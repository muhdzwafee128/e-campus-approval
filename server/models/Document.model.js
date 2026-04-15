const mongoose = require('mongoose');

const documentSchema = new mongoose.Schema(
    {
        requestId: { type: mongoose.Schema.Types.ObjectId, ref: 'Request', required: true, unique: true },
        pdfPath: { type: String, required: true },        // local path to generated PDF
        qrCodeData: { type: String },                      // Base64 QR image or data URL
        verificationToken: { type: String, required: true, unique: true },
        issuedAt: { type: Date, default: Date.now },
    },
    { timestamps: false }
);

module.exports = mongoose.model('Document', documentSchema);
