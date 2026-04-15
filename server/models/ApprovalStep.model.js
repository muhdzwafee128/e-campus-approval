const mongoose = require('mongoose');

const approvalStepSchema = new mongoose.Schema(
    {
        requestId: { type: mongoose.Schema.Types.ObjectId, ref: 'Request', required: true },
        authorityId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
        role: { type: String, required: true }, // e.g. 'tutor', 'hod', 'principal'
        action: { type: String, enum: ['approved', 'rejected', 'pending'], default: 'pending' },
        comment: { type: String, default: '' },
        timestamp: { type: Date, default: Date.now },
    },
    { timestamps: false }
);

module.exports = mongoose.model('ApprovalStep', approvalStepSchema);
