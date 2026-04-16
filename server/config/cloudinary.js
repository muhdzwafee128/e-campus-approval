const cloudinary = require('cloudinary').v2;
const { CloudinaryStorage } = require('multer-storage-cloudinary');

// Configure Cloudinary with credentials from environment variables
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key:    process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

// ─── Storage: Signatures ────────────────────────────────────────────────────
// Used for uploading student / authority signature images.
const signaturesStorage = new CloudinaryStorage({
  cloudinary,
  params: {
    folder:         'signatures',
    allowed_formats: ['jpg', 'jpeg', 'png', 'webp'],
    // Keep original file name as the public_id so it is easy to reference
    public_id: (req, file) =>
      `sig_${Date.now()}_${file.originalname.split('.')[0]}`,
  },
});

// ─── Storage: Attachments ───────────────────────────────────────────────────
// Used for general supporting documents attached to a request.
const attachmentsStorage = new CloudinaryStorage({
  cloudinary,
  params: {
    folder:           'attachments',
    resource_type:    'auto',           // allows PDFs and image formats
    allowed_formats:  ['jpg', 'jpeg', 'png', 'pdf', 'docx'],
    public_id: (req, file) =>
      `attach_${Date.now()}_${file.originalname.split('.')[0]}`,
  },
});

// ─── Storage: Permission Letters ────────────────────────────────────────────
// Used for the final generated permission-letter PDFs.
const permissionLettersStorage = new CloudinaryStorage({
  cloudinary,
  params: {
    folder:          'permission_letters',
    resource_type:   'auto',
    allowed_formats: ['pdf', 'jpg', 'jpeg', 'png'],
    public_id: (req, file) =>
      `letter_${Date.now()}_${file.originalname.split('.')[0]}`,
  },
});

module.exports = {
  cloudinary,             // raw SDK instance (useful for direct API calls)
  signaturesStorage,
  attachmentsStorage,
  permissionLettersStorage,
};
