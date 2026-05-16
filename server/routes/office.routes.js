const express = require('express');
const router = express.Router();
const Request = require('../models/Request.model');
const User = require('../models/User.model');
const AuditLog = require('../models/AuditLog.model');
const ApprovalStep = require('../models/ApprovalStep.model');
const Document = require('../models/Document.model');
const { protect } = require('../middleware/auth.middleware');
const { authorizeRoles } = require('../middleware/role.middleware');
const { generatePermissionLetterPDF } = require('../services/pdf.service');
const { generateVerificationToken } = require('../services/qr.service');

const OFFICE_TYPES = ['general_certificate', 'borrow_certificate', 'season_ticket', 'fee_structure'];
const TYPE_LABELS = {
    general_certificate: 'General Purpose Certificate',
    borrow_certificate: 'Borrowing Original Certificates',
    season_ticket: 'Season Ticket / Railway Concession',
    fee_structure: 'Fee Structure for Educational Loan',
};

// All office routes require office_staff role
router.use(protect, authorizeRoles('office_staff'));

// GET /api/office/queue — all requests needing office action
router.get('/queue', async (req, res) => {
    try {
        const requests = await Request.find({
            type: { $in: OFFICE_TYPES },
            status: { $in: ['awaiting_office', 'ready_to_collect'] },
        })
            .populate('studentId', 'name admissionNo department yearOfStudy category')
            .populate('officeProcessedBy', 'name')
            .sort({ updatedAt: 1 });

        res.json(requests);
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});

// GET /api/office/history — completed/closed requests processed by any office account
router.get('/history', async (req, res) => {
    try {
        const requests = await Request.find({
            type: { $in: OFFICE_TYPES },
            status: { $in: ['completed', 'returned_and_closed'] },
        })
            .populate('studentId', 'name admissionNo department yearOfStudy')
            .sort({ officeProcessedAt: -1 });

        res.json(requests);
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});

// GET /api/office/stats — counts for dashboard cards
router.get('/stats', async (req, res) => {
    try {
        const now = new Date();
        const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);

        const [pending, inProgress, completedThisMonth, allCompleted] = await Promise.all([
            Request.countDocuments({ type: { $in: OFFICE_TYPES }, status: 'awaiting_office' }),
            Request.countDocuments({ type: { $in: OFFICE_TYPES }, status: 'ready_to_collect' }),
            Request.countDocuments({
                type: { $in: OFFICE_TYPES },
                status: { $in: ['completed', 'returned_and_closed'] },
                officeProcessedAt: { $gte: startOfMonth },
            }),
            Request.find({
                type: { $in: OFFICE_TYPES },
                status: { $in: ['completed', 'returned_and_closed'] },
                officeProcessedAt: { $exists: true },
            }, 'officeProcessedAt handedOverAt').lean(),
        ]);

        let avgTurnaround = 0;
        if (allCompleted.length > 0) {
            const totalDays = allCompleted.reduce((sum, r) => {
                const end = r.handedOverAt || r.officeProcessedAt;
                const diff = (new Date(end) - new Date(r.officeProcessedAt)) / 86400000;
                return sum + Math.max(0, diff);
            }, 0);
            avgTurnaround = Math.round(totalDays / allCompleted.length);
        }

        res.json({ pending, inProgress, completedThisMonth, avgTurnaround });
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});

// GET /api/office/request/:id — single request detail for office
router.get('/request/:id', async (req, res) => {
    try {
        const request = await Request.findById(req.params.id)
            .populate('studentId', 'name admissionNo department yearOfStudy yearOfAdmission category dateOfBirth parentName email')
            .populate('officeProcessedBy', 'name');

        if (!request) return res.status(404).json({ message: 'Request not found' });
        if (!OFFICE_TYPES.includes(request.type)) return res.status(403).json({ message: 'Not an office-type request' });

        const steps = await ApprovalStep.find({ requestId: request._id })
            .populate('authorityId', 'name role');

        res.json({ request, steps });
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});

// POST /api/office/save-draft/:id — save office fields without changing status
router.post('/save-draft/:id', async (req, res) => {
    try {
        const { officePreparedBy, officeScrutinyBy, officeRemarks } = req.body;

        const request = await Request.findById(req.params.id);
        if (!request) return res.status(404).json({ message: 'Request not found' });
        if (!['awaiting_office', 'ready_to_collect'].includes(request.status)) {
            return res.status(400).json({ message: 'Request is not editable in current state' });
        }

        request.officeProcessedBy = req.user.id;
        if (officePreparedBy !== undefined) request.officePreparedBy = officePreparedBy;
        if (officeScrutinyBy !== undefined) request.officeScrutinyBy = officeScrutinyBy;
        if (officeRemarks !== undefined) request.officeRemarks = officeRemarks;
        await request.save();

        res.json({ message: 'Draft saved', request });
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});

// POST /api/office/mark-complete/:id — Phase 1 completion
// Saves office fields, regenerates PDF with them, sets status to ready_to_collect, notifies student
router.post('/mark-complete/:id', async (req, res) => {
    try {
        const { officePreparedBy, officeScrutinyBy, officeRemarks } = req.body;

        const request = await Request.findById(req.params.id)
            .populate('studentId', 'name admissionNo department yearOfStudy yearOfAdmission category dateOfBirth parentName email _id');

        if (!request) return res.status(404).json({ message: 'Request not found' });
        if (!OFFICE_TYPES.includes(request.type)) return res.status(403).json({ message: 'Not an office-type request' });
        if (request.status !== 'awaiting_office') {
            return res.status(400).json({ message: 'Request is not in awaiting_office state' });
        }

        // Save office fields
        request.officeProcessedBy = req.user.id;
        request.officePreparedBy = officePreparedBy || request.officePreparedBy || '';
        request.officeScrutinyBy = officeScrutinyBy !== undefined ? officeScrutinyBy : (request.officeScrutinyBy || '');
        request.officeRemarks = officeRemarks !== undefined ? officeRemarks : (request.officeRemarks || '');
        request.officeProcessedAt = new Date();
        request.status = 'ready_to_collect';

        await request.save();

        // Respond immediately, regenerate PDF async
        const io = req.app.get('io');
        if (io) {
            io.to(request.studentId._id.toString()).emit('request_update', {
                requestId: request.requestId,
                status: 'ready_to_collect',
                message: `Your ${TYPE_LABELS[request.type]} has been processed. Please visit the office to collect your certificate / document.`,
            });
        }

        res.json({ message: 'Marked as complete', request });

        // Regenerate PDF with office fields filled in — non-blocking
        setImmediate(async () => {
            try {
                const allSteps = await ApprovalStep.find({ requestId: request._id })
                    .populate('authorityId', 'name role signatureUrl');

                const token = generateVerificationToken(request._id);
                const officeFields = {
                    officePreparedBy: request.officePreparedBy,
                    officeScrutinyBy: request.officeScrutinyBy,
                    officeRemarks: request.officeRemarks,
                    officeProcessedAt: request.officeProcessedAt,
                };
                const pdfUrl = await generatePermissionLetterPDF(
                    request, request.studentId, allSteps, token, officeFields
                );

                request.approvalLetterUrl = pdfUrl;
                await request.save();

                // Update Document record too
                await Document.findOneAndUpdate(
                    { requestId: request._id },
                    { pdfUrl, verificationToken: token },
                    { upsert: true }
                );

                await AuditLog.create({
                    event: 'PDF_REGENERATED_WITH_OFFICE_FIELDS',
                    userId: req.user.id,
                    requestId: request._id,
                    meta: { pdfUrl },
                });

                console.log(`PDF regenerated for ${request.requestId} with office fields: ${pdfUrl}`);
            } catch (err) {
                console.error(`PDF regeneration failed for ${request.requestId}:`, err.message);
            }
        });

    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});

// POST /api/office/handover/:id — Phase 2: student physically collects
// Sets status to "completed", enables download on student side
router.post('/handover/:id', async (req, res) => {
    try {
        const request = await Request.findById(req.params.id)
            .populate('studentId', 'name _id');

        if (!request) return res.status(404).json({ message: 'Request not found' });
        if (request.status !== 'ready_to_collect') {
            return res.status(400).json({ message: 'Request must be in ready_to_collect state for handover' });
        }

        request.isHandedOver = true;
        request.handedOverAt = new Date();
        request.status = 'completed';

        await request.save();

        await AuditLog.create({
            event: 'OFFICE_HANDOVER',
            userId: req.user.id,
            requestId: request._id,
            meta: { handedOverAt: request.handedOverAt },
        });

        const io = req.app.get('io');
        if (io) {
            io.to(request.studentId._id.toString()).emit('request_update', {
                requestId: request.requestId,
                status: 'completed',
                message: 'Your request is now complete. You can download your letter.',
            });
        }

        res.json({ message: 'Handover complete', request });
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});

// POST /api/office/return/:id — Phase 2 Borrow only: original certificate returned by student
router.post('/return/:id', async (req, res) => {
    try {
        const request = await Request.findById(req.params.id)
            .populate('studentId', 'name _id');

        if (!request) return res.status(404).json({ message: 'Request not found' });
        if (request.type !== 'borrow_certificate') {
            return res.status(400).json({ message: 'Not a borrow certificate request' });
        }
        if (request.status !== 'completed') {
            return res.status(400).json({ message: 'Student must have collected first before returning' });
        }

        request.isReturnedByStudent = true;
        request.returnedAt = new Date();
        request.status = 'returned_and_closed';

        await request.save();

        await AuditLog.create({
            event: 'CERTIFICATE_RETURNED',
            userId: req.user.id,
            requestId: request._id,
            meta: { returnedAt: request.returnedAt },
        });

        const io = req.app.get('io');
        if (io) {
            io.to(request.studentId._id.toString()).emit('request_update', {
                requestId: request.requestId,
                status: 'returned_and_closed',
                message: 'Original certificate returned. Request closed.',
            });
        }

        res.json({ message: 'Certificate returned and request closed', request });
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});

module.exports = router;
