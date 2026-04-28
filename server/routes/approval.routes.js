const express = require('express');
const router = express.Router();
const Request = require('../models/Request.model');
const ApprovalStep = require('../models/ApprovalStep.model');
const Document = require('../models/Document.model');
const User = require('../models/User.model');
const AuditLog = require('../models/AuditLog.model');
const { protect } = require('../middleware/auth.middleware');
const { authorizeRoles } = require('../middleware/role.middleware');
const { findNextAuthority } = require('../services/routing.service');
const { generatePermissionLetterPDF } = require('../services/pdf.service');
const { generateVerificationToken, generateQRCode } = require('../services/qr.service');

const AUTHORITY_ROLES = ['tutor', 'faculty_coordinator', 'hod', 'principal'];
const OFFICE_TYPES = ['general_certificate', 'borrow_certificate', 'season_ticket', 'fee_structure'];

// POST /api/approvals/:requestId — approve or reject
router.post('/:requestId', protect, authorizeRoles(...AUTHORITY_ROLES), async (req, res) => {
    try {
        const { action, comment } = req.body; // action: 'approved' | 'rejected'
        if (!['approved', 'rejected'].includes(action)) {
            return res.status(400).json({ message: 'Action must be "approved" or "rejected"' });
        }
        if (action === 'rejected' && !comment?.trim()) {
            return res.status(400).json({ message: 'Rejection reason is required' });
        }

        const request = await Request.findById(req.params.requestId)
            .populate('studentId', 'name admissionNo department yearOfStudy yearOfAdmission category dateOfBirth parentName email');
        if (!request) return res.status(404).json({ message: 'Request not found' });

        // Verify this authority is the current holder
        if (request.currentHolder?.toString() !== req.user.id) {
            return res.status(403).json({ message: 'This request is not assigned to you' });
        }

        const currentRole = request.approvalChain[request.currentStep];

        // Update the approval step
        await ApprovalStep.findOneAndUpdate(
            { requestId: request._id, role: currentRole, action: 'pending' },
            { action, comment: comment || '', authorityId: req.user.id, timestamp: new Date() }
        );

        await AuditLog.create({
            event: action === 'approved' ? 'REQUEST_APPROVED' : 'REQUEST_REJECTED',
            userId: req.user.id,
            requestId: request._id,
            meta: { role: currentRole, comment },
        });

        const io = req.app.get('io');

        if (action === 'rejected') {
            request.status = 'rejected';
            request.currentHolder = null;
            await request.save();

            // Notify student
            if (io) io.to(request.studentId._id.toString()).emit('request_update', {
                requestId: request.requestId, status: 'rejected', rejectedBy: req.user.name, comment,
            });
            return res.json({ message: 'Request rejected', request });
        }

        // Approved — advance to next step
        const nextStep = request.currentStep + 1;
        if (nextStep >= request.approvalChain.length) {
            // FINAL APPROVAL
            const goesToOffice = OFFICE_TYPES.includes(request.type);
            request.currentHolder = null;
            request.currentStep = nextStep;

            if (goesToOffice) {
                request.status = 'awaiting_office';
                if (request.type === 'borrow_certificate' && request.formData?.returnDate) {
                    request.returnDueDate = new Date(request.formData.returnDate);
                }
            } else {
                request.status = 'approved';
            }
            await request.save();

            // Notify student
            if (io) io.to(request.studentId._id.toString()).emit('request_update', {
                requestId: request.requestId, status: request.status,
            });

            if (goesToOffice) {
                // Notify ALL office_staff users
                const officeUsers = await User.find({ role: 'office_staff' }, '_id');
                officeUsers.forEach(ou => {
                    if (io) io.to(ou._id.toString()).emit('new_office_request', {
                        requestId: request.requestId,
                        type: request.type,
                        studentName: request.studentId.name,
                    });
                });
                res.json({ message: 'Final approval — forwarding to office', request });
            } else {
                res.json({ message: 'Final approval — PDF generating in background', request });
            }

            // Generate PDF asynchronously for all final approvals
            setImmediate(async () => {
                try {
                    const allSteps = await ApprovalStep.find({ requestId: request._id })
                        .populate('authorityId', 'name role signatureUrl');

                    const token = generateVerificationToken(request._id);
                    const pdfUrl = await generatePermissionLetterPDF(
                        request, request.studentId, allSteps, token
                    );

                    request.approvalLetterUrl = pdfUrl;
                    await request.save();

                    await Document.create({
                        requestId: request._id,
                        pdfUrl,
                        pdfPath: '',
                        verificationToken: token,
                    });

                    await AuditLog.create({
                        event: 'PDF_GENERATED',
                        userId: req.user.id,
                        requestId: request._id,
                        meta: { pdfUrl },
                    });

                    console.log(`PDF generated for request ${request.requestId}: ${pdfUrl}`);
                } catch (err) {
                    console.error(`PDF generation failed for request ${request.requestId}:`, err.message);
                }
            });

            return; // response already sent
        }


        // Advance to next authority
        request.currentStep = nextStep;
        request.status = 'in_progress';

        // Find next authority
        const tempRequest = { ...request.toObject(), currentStep: nextStep };
        const nextAuthority = await findNextAuthority(
            { approvalChain: request.approvalChain, currentStep: nextStep, formData: request.formData },
            User
        );
        request.currentHolder = nextAuthority?._id || null;
        await request.save();

        // Notify next authority
        if (io && nextAuthority) {
            io.to(nextAuthority._id.toString()).emit('new_request', {
                requestId: request.requestId, type: request.type,
                studentName: request.studentId.name,
            });
        }

        res.json({ message: `Approved — forwarded to ${request.approvalChain[nextStep]}`, request });
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});

// GET /api/approvals/history — authority's past actions
router.get('/history/mine', protect, authorizeRoles(...AUTHORITY_ROLES), async (req, res) => {
    try {
        const steps = await ApprovalStep.find({ authorityId: req.user.id, action: { $ne: 'pending' } })
            .populate({
                path: 'requestId',
                populate: { path: 'studentId', select: 'name admissionNo department yearOfStudy' },
            })
            .sort({ timestamp: -1 })
            .limit(50);
        res.json(steps);
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});

// GET /api/approvals/stats — authority's stats
router.get('/stats/mine', protect, authorizeRoles(...AUTHORITY_ROLES), async (req, res) => {
    try {
        const pending = await Request.countDocuments({ currentHolder: req.user.id });
        const approved = await ApprovalStep.countDocuments({ authorityId: req.user.id, action: 'approved' });
        const rejected = await ApprovalStep.countDocuments({ authorityId: req.user.id, action: 'rejected' });
        res.json({ pending, approved, rejected });
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});

module.exports = router;
