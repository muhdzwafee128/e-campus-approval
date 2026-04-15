const mongoose = require('mongoose');

const auditLogSchema = new mongoose.Schema(
    {
        event: { type: String, required: true },
        userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
        requestId: { type: mongoose.Schema.Types.ObjectId, ref: 'Request' },
        meta: { type: mongoose.Schema.Types.Mixed },
        timestamp: { type: Date, default: Date.now },
    },
    { timestamps: false }
);

// Prevent any updates — audit logs are immutable
auditLogSchema.pre('updateOne', function () {
    throw new Error('Audit logs are immutable');
});
auditLogSchema.pre('findOneAndUpdate', function () {
    throw new Error('Audit logs are immutable');
});

module.exports = mongoose.model('AuditLog', auditLogSchema);
