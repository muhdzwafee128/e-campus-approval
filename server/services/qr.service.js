const crypto = require('crypto');
const QRCode = require('qrcode');

/**
 * Generate a unique verification token for a request.
 */
function generateVerificationToken(requestId) {
    return crypto
        .createHmac('sha256', process.env.JWT_SECRET)
        .update(String(requestId))
        .digest('hex');
}

/**
 * Generate a QR code data URL for the verification page.
 * @param {string} readableRequestId - e.g. REQ-2026-IT-0001
 * @param {string} token - verification token
 * @returns {Promise<string>} - base64 data URL of the QR code image
 */
async function generateQRCode(readableRequestId, token) {
    const verifyUrl = `${process.env.CLIENT_URL}/verify/${readableRequestId}?token=${token}`;
    const qrDataUrl = await QRCode.toDataURL(verifyUrl, {
        errorCorrectionLevel: 'M',
        width: 76, // ~2cm at 96dpi
        margin: 1,
    });
    return qrDataUrl;
}

/**
 * Verify a token matches the request ID.
 */
function verifyToken(requestId, token) {
    const expected = generateVerificationToken(requestId);
    return expected === token;
}

module.exports = { generateVerificationToken, generateQRCode, verifyToken };
