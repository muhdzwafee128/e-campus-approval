const mongoose = require('mongoose');

const documentSchema = new mongoose.Schema(
    {
        requestId: { type: mongoose.Schema.Types.ObjectId, ref: 'Request', required: true, unique: true },
        // Cloudinary HTTPS URL of the generated PDF (primary — used for download/display)
        pdfUrl: { type: String, default: '' },
        // Legacy local path — kept for backward compatibility, no longer written for new docs
        pdfPath: { type: String, default: '' },
        qrCodeData: { type: String },                      // Base64 QR image or data URL
        verificationToken: { type: String, required: true, unique: true },
        issuedAt: { type: Date, default: Date.now },
    },
    { timestamps: false }
);

module.exports = mongoose.model('Document', documentSchema);
