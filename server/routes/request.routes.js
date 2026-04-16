const express = require('express');
const router = express.Router();
const multer = require('multer');
const Request = require('../models/Request.model');
const ApprovalStep = require('../models/ApprovalStep.model');
const User = require('../models/User.model');
const AuditLog = require('../models/AuditLog.model');
const { protect } = require('../middleware/auth.middleware');
const { authorizeRoles } = require('../middleware/role.middleware');
const { determineApprovalChain, findNextAuthority } = require('../services/routing.service');
const { attachmentsStorage } = require('../config/cloudinary');

// Multer — streams student attachments directly to Cloudinary 'attachments' folder
// Supports images, PDFs, and DOCX (resource_type: 'auto' handles non-image formats)
const upload = multer({
    storage: attachmentsStorage,
    limits: { fileSize: 10 * 1024 * 1024 },
});

// POST /api/requests — submit a new request (student only)
router.post('/', protect, authorizeRoles('student'), upload.array('files', 10), async (req, res) => {
    try {
        const { type, formData: formDataRaw } = req.body;
        const formData = typeof formDataRaw === 'string' ? JSON.parse(formDataRaw) : formDataRaw;

        // Get student profile for auto-fill
        const student = await User.findById(req.user.id).select('-passwordHash');
        formData.branch = student.department;
        formData.studentName = student.name;
        formData.yearOfStudy = student.yearOfStudy; // used by routing to find the right tutor

        const approvalChain = determineApprovalChain(type, formData);

        // Build request
        const request = new Request({
            studentId: req.user.id,
            type,
            formData,
            approvalChain,
            currentStep: 0,
            status: 'pending',
            // Each uploaded file's Cloudinary secure_url is stored.
            // multer-storage-cloudinary sets req.file.path to the secure_url.
            attachments: req.files ? req.files.map(f => f.path) : [],
        });

        // Find first authority
        const firstAuthority = await findNextAuthority(request, User);
        if (firstAuthority) request.currentHolder = firstAuthority._id;

        await request.save();

        // Create pending approval step placeholders
        for (const role of approvalChain) {
            await ApprovalStep.create({
                requestId: request._id,
                authorityId: firstAuthority?._id || null,
                role,
                action: 'pending',
            });
        }

        await AuditLog.create({
            event: 'REQUEST_SUBMITTED',
            userId: req.user.id,
            requestId: request._id,
            meta: { type, requestId: request.requestId },
        });

        // Notify via socket if io available
        const io = req.app.get('io');
        if (io && firstAuthority) {
            io.to(firstAuthority._id.toString()).emit('new_request', {
                requestId: request.requestId,
                type: request.type,
                studentName: student.name,
            });
        }

        res.status(201).json(request);
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});

// GET /api/requests — get requests (student sees own, authority sees assigned)
router.get('/', protect, async (req, res) => {
    try {
        let requests;
        if (req.user.role === 'student') {
            requests = await Request.find({ studentId: req.user.id })
                .sort({ createdAt: -1 })
                .populate('currentHolder', 'name role');
        } else {
            requests = await Request.find({ currentHolder: req.user.id })
                .sort({ createdAt: 1 })
                .populate('studentId', 'name admissionNo department yearOfStudy');
        }
        res.json(requests);
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});

// GET /api/requests/:id — get single request with full details
router.get('/:id', protect, async (req, res) => {
    try {
        const request = await Request.findById(req.params.id)
            .populate('studentId', 'name admissionNo department yearOfStudy yearOfAdmission category dateOfBirth parentName')
            .populate('currentHolder', 'name role');

        if (!request) return res.status(404).json({ message: 'Request not found' });

        // Auth check
        if (req.user.role === 'student' && request.studentId._id.toString() !== req.user.id) {
            return res.status(403).json({ message: 'Access denied' });
        }

        const steps = await ApprovalStep.find({ requestId: request._id })
            .populate('authorityId', 'name role signatureUrl department');

        res.json({ request, steps });
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});

module.exports = router;
