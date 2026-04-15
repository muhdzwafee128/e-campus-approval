const mongoose = require('mongoose');

const userSchema = new mongoose.Schema(
    {
        // Common fields
        name: { type: String, required: true, trim: true },
        email: { type: String, required: true, unique: true, lowercase: true, trim: true },
        passwordHash: { type: String, required: true },
        role: {
            type: String,
            required: true,
            enum: ['student', 'tutor', 'nodal_officer', 'faculty_coordinator', 'hod', 'principal'],
        },

        // Student-only fields
        admissionNo: { type: String, sparse: true }, // unique for students
        department: { type: String },
        yearOfStudy: { type: Number, min: 1, max: 4 },
        yearOfAdmission: { type: Number },
        category: { type: String, enum: ['TFW', 'Merit', 'Management', 'NRI', 'Non-KEAM', ''] },
        typeOfAdmission: { type: String, enum: ['Regular', 'Lateral Entry', 'Spot', ''] },
        dateOfBirth: { type: Date },
        parentName: { type: String },
        isHostler: { type: Boolean, default: false },
        hostelName: { type: String },

        // Authority-only fields
        staffId: { type: String, sparse: true },
        signatureUrl: { type: String }, // path to uploaded/drawn signature
        assignedClubs: { type: [String], default: [] }, // Faculty Coordinator only: ['IEEE', 'TinkerHub', ...]
        assignedYear: { type: Number, min: 1, max: 4 }, // Class Tutor only: which B.Tech year they manage
    },
    { timestamps: true }
);

// Fast lookup: find the tutor for a specific dept + year batch
userSchema.index({ role: 1, department: 1, assignedYear: 1 });
// Fast lookup for HOD by department
userSchema.index({ role: 1, department: 1 });

module.exports = mongoose.model('User', userSchema);
