const mongoose = require('mongoose');

const requestSchema = new mongoose.Schema(
    {
        studentId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },

        // Request classification
        type: {
            type: String,
            required: true,
            enum: [
                'duty_leave_upload',
                'duty_leave_event',
                'scholarship',
                'event_conduct',
                'general_certificate',
                'borrow_certificate',
                'season_ticket',
                'fee_structure',
            ],
        },

        // Full form data (flexible per type)
        formData: { type: mongoose.Schema.Types.Mixed, required: true },

        // Routing & status
        status: {
            type: String,
            enum: ['pending', 'in_progress', 'approved', 'rejected', 'awaiting_office', 'ready_to_collect', 'completed', 'returned_and_closed'],
            default: 'pending',
        },
        approvalChain: { type: [String], default: [] }, // e.g. ['tutor', 'hod', 'principal']
        currentStep: { type: Number, default: 0 }, // index into approvalChain
        currentHolder: { type: mongoose.Schema.Types.ObjectId, ref: 'User' }, // user assigned now

        // Uploaded file paths / Cloudinary URLs (from Multer)
        attachments: { type: [String], default: [] },

        // Cloudinary URL of the final approved permission-letter PDF
        approvalLetterUrl: { type: String, default: '' },

        // Office Staff processing fields
        officeProcessedBy:   { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
        officePreparedBy:    { type: String, default: '' },
        officeScrutinyBy:    { type: String, default: '' },
        officeRemarks:       { type: String, default: '' },
        officeProcessedAt:   { type: Date },
        isHandedOver:        { type: Boolean, default: false },
        handedOverAt:        { type: Date },
        // Borrow Certificate only
        returnDueDate:       { type: Date },
        isReturnedByStudent: { type: Boolean, default: false },
        returnedAt:          { type: Date },

        // Unique readable ID
        requestId: { type: String, unique: true },
    },
    { timestamps: true }
);

// Auto-generate readable request ID before save
requestSchema.pre('save', async function () {
    if (!this.requestId) {
        const count = await mongoose.model('Request').countDocuments();
        const year = new Date().getFullYear();
        const dept = this.formData?.branch ? this.formData.branch.toUpperCase().slice(0, 4) : 'GEN';
        this.requestId = `REQ-${year}-${dept}-${String(count + 1).padStart(4, '0')}`;
    }
});

module.exports = mongoose.model('Request', requestSchema);
