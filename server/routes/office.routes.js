const express = require('express');
const router = express.Router();
const Request = require('../models/Request.model');
const User = require('../models/User.model');
const AuditLog = require('../models/AuditLog.model');
const { protect } = require('../middleware/auth.middleware');
const { authorizeRoles } = require('../middleware/role.middleware');

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

// GET /api/office/history — completed requests processed by this office account
router.get('/history', async (req, res) => {
    try {
        const requests = await Request.find({
            type: { $in: OFFICE_TYPES },
            officeProcessedBy: req.user.id,
            status: { $in: ['completed', 'awaiting_office', 'ready_to_collect'] },
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
                status: 'completed',
                officeProcessedAt: { $gte: startOfMonth },
            }),
            Request.find({
                type: { $in: OFFICE_TYPES },
                status: 'completed',
                officeProcessedAt: { $exists: true },
            }, 'officeProcessedAt updatedAt').lean(),
        ]);

        // Average turnaround: days from last approval (updatedAt at approved/awaiting_office transition)
        // to officeProcessedAt
        let avgTurnaround = 0;
        if (allCompleted.length > 0) {
            const totalDays = allCompleted.reduce((sum, r) => {
                const diff = (new Date(r.officeProcessedAt) - new Date(r.updatedAt)) / 86400000;
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

        // Get approval steps
        const ApprovalStep = require('../models/ApprovalStep.model');
        const steps = await ApprovalStep.find({ requestId: request._id })
            .populate('authorityId', 'name role');

        res.json({ request, steps });
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});

// POST /api/office/process/:id — save draft or mark complete
router.post('/process/:id', async (req, res) => {
    try {
        const { officePreparedBy, officeScrutinyBy, officeRemarks, isHandedOver, isReturnedByStudent } = req.body;

        const request = await Request.findById(req.params.id)
            .populate('studentId', 'name _id');

        if (!request) return res.status(404).json({ message: 'Request not found' });
        if (!OFFICE_TYPES.includes(request.type)) return res.status(403).json({ message: 'Not an office-type request' });
        if (!['awaiting_office', 'ready_to_collect'].includes(request.status)) {
            return res.status(400).json({ message: 'Request is not in a processable state' });
        }

        // Save office fields
        request.officeProcessedBy = req.user.id;
        request.officePreparedBy = officePreparedBy || request.officePreparedBy;
        request.officeScrutinyBy = officeScrutinyBy !== undefined ? officeScrutinyBy : request.officeScrutinyBy;
        request.officeRemarks = officeRemarks !== undefined ? officeRemarks : request.officeRemarks;

        const io = req.app.get('io');

        if (isHandedOver) {
            request.isHandedOver = true;
            request.handedOverAt = new Date();
            request.officeProcessedAt = new Date();
            request.status = 'ready_to_collect';

            // Notify student
            if (io) {
                io.to(request.studentId._id.toString()).emit('request_update', {
                    requestId: request.requestId,
                    status: 'ready_to_collect',
                    message: `Your ${TYPE_LABELS[request.type]} is ready. Please collect it from the office.`,
                });
            }
        }

        // Handle borrow certificate return
        if (request.type === 'borrow_certificate' && isReturnedByStudent) {
            request.isReturnedByStudent = true;
            request.returnedAt = new Date();
            request.status = 'completed';
        } else if (isHandedOver && request.type !== 'borrow_certificate') {
            // Non-borrow: mark completed on handover
            request.status = 'completed';
        }

        await request.save();

        await AuditLog.create({
            event: 'OFFICE_PROCESSED',
            userId: req.user.id,
            requestId: request._id,
            meta: { isHandedOver, status: request.status },
        });

        res.json({ message: 'Saved', request });
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});

// POST /api/office/return/:id — mark borrow cert as returned
router.post('/return/:id', async (req, res) => {
    try {
        const request = await Request.findById(req.params.id);
        if (!request) return res.status(404).json({ message: 'Request not found' });
        if (request.type !== 'borrow_certificate') return res.status(400).json({ message: 'Not a borrow certificate request' });

        request.isReturnedByStudent = true;
        request.returnedAt = new Date();
        request.status = 'completed';
        await request.save();

        res.json({ message: 'Marked as returned', request });
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});

module.exports = router;
