const express = require('express');
const router = express.Router();
const path = require('path');
const fs = require('fs');
const Document = require('../models/Document.model');
const Request = require('../models/Request.model');
const ApprovalStep = require('../models/ApprovalStep.model');
const { protect } = require('../middleware/auth.middleware');
const { verifyToken } = require('../services/qr.service');

// GET /api/documents/download/:requestId — download PDF
router.get('/download/:requestId', protect, async (req, res) => {
    try {
        const request = await Request.findById(req.params.requestId);
        if (!request) return res.status(404).json({ message: 'Request not found' });

        // Only the student who owns it can download
        if (req.user.role === 'student' && request.studentId.toString() !== req.user.id) {
            return res.status(403).json({ message: 'Access denied' });
        }

        const doc = await Document.findOne({ requestId: request._id });

        let absPath;
        if (doc) {
            absPath = path.join(__dirname, '..', doc.pdfPath);
        } else {
            // Fallback: serve directly from pdfs/ folder if the file exists
            // (handles cases where the Document DB record was not created)
            const fallbackPath = path.join(__dirname, '..', 'pdfs', `${request.requestId}.pdf`);
            if (fs.existsSync(fallbackPath)) {
                absPath = fallbackPath;
            } else {
                return res.status(404).json({ message: 'PDF not yet generated' });
            }
        }

        if (!fs.existsSync(absPath)) return res.status(404).json({ message: 'PDF file not found' });

        res.download(absPath, `${request.requestId}.pdf`);
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});

// GET /api/documents/verify/:readableRequestId — public QR verification (no auth needed)
router.get('/verify/:readableRequestId', async (req, res) => {
    try {
        const { token } = req.query;
        const { readableRequestId } = req.params;

        const request = await Request.findOne({ requestId: readableRequestId })
            .populate('studentId', 'name admissionNo department semester');
        if (!request) return res.status(404).json({ valid: false, message: 'Request not found' });

        const doc = await Document.findOne({ requestId: request._id });
        if (!doc) return res.status(404).json({ valid: false, message: 'No document for this request' });

        const isValid = verifyToken(request._id, token);
        if (!isValid) return res.status(400).json({ valid: false, message: 'Invalid verification token' });

        const steps = await ApprovalStep.find({ requestId: request._id, action: 'approved' })
            .populate('authorityId', 'name role signatureUrl');

        res.json({
            valid: true,
            requestId: request.requestId,
            type: request.type,
            status: request.status,
            student: request.studentId,
            approvalChain: request.approvalChain,
            approvals: steps.map(s => ({
                role: s.role,
                authorityName: s.authorityId?.name,
                timestamp: s.timestamp,
                comment: s.comment,
            })),
            issuedAt: doc.issuedAt,
        });
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});

module.exports = router;
