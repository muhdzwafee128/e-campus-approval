const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const multer = require('multer');
const User = require('../models/User.model');
const { signaturesStorage } = require('../config/cloudinary');

// Multer — streams signature images directly to Cloudinary 'signatures' folder
const uploadSignature = multer({
    storage: signaturesStorage,
    limits: { fileSize: 2 * 1024 * 1024 },
    fileFilter: (req, file, cb) => {
        if (['image/png', 'image/jpeg', 'image/webp'].includes(file.mimetype)) cb(null, true);
        else cb(new Error('Only PNG/JPG/WEBP signatures allowed'));
    },
});

function signToken(user) {
    return jwt.sign(
        { id: user._id, role: user.role, name: user.name },
        process.env.JWT_SECRET,
        { expiresIn: '7d' }
    );
}

// POST /api/auth/register/student
router.post('/register/student', async (req, res) => {
    try {
        const {
            name, email, password, admissionNo, department, yearOfStudy,
            yearOfAdmission, category, typeOfAdmission, dateOfBirth,
            parentName, isHostler, hostelName,
        } = req.body;

        if (await User.findOne({ email })) {
            return res.status(400).json({ message: 'Email already registered' });
        }
        if (await User.findOne({ admissionNo })) {
            return res.status(400).json({ message: 'Admission number already registered' });
        }

        const passwordHash = await bcrypt.hash(password, 12);
        const user = await User.create({
            name, email, passwordHash, role: 'student',
            admissionNo, department, yearOfStudy: Number(yearOfStudy),
            yearOfAdmission: Number(yearOfAdmission), category, typeOfAdmission,
            dateOfBirth, parentName,
            isHostler: isHostler === true || isHostler === 'true',
            hostelName: isHostler ? hostelName : '',
        });

        res.status(201).json({ token: signToken(user), user: sanitize(user) });
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});

// POST /api/auth/register/authority
router.post('/register/authority', uploadSignature.single('signature'), async (req, res) => {
    try {
        const { name, email, password, role, department, staffId, assignedClubs, assignedYear } = req.body;

        const VALID_AUTHORITY_ROLES = ['tutor', 'faculty_coordinator', 'hod', 'principal', 'office_staff'];
        if (!VALID_AUTHORITY_ROLES.includes(role)) {
            return res.status(400).json({ message: 'Invalid authority role' });
        }
        if (await User.findOne({ email })) {
            return res.status(400).json({ message: 'Email already registered' });
        }

        // Office staff do not need a signature
        let signatureUrl = '';
        if (role !== 'office_staff') {
            if (req.file) {
                signatureUrl = req.file.path; // Cloudinary secure_url
            } else {
                return res.status(400).json({ message: 'Signature image is required for authority registration' });
            }
        }

        const passwordHash = await bcrypt.hash(password, 12);
        const user = await User.create({
            name, email, passwordHash, role, staffId,
            department: ['faculty_coordinator', 'principal', 'office_staff'].includes(role) ? '' : department,
            signatureUrl,
            assignedClubs: role === 'faculty_coordinator'
                ? (Array.isArray(assignedClubs) ? assignedClubs : JSON.parse(assignedClubs || '[]'))
                : [],
            assignedYear: role === 'tutor' && assignedYear ? Number(assignedYear) : undefined,
        });

        res.status(201).json({ token: signToken(user), user: sanitize(user) });
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});

// POST /api/auth/login
router.post('/login', async (req, res) => {
    try {
        const { email, password } = req.body;
        const user = await User.findOne({ email });
        if (!user) return res.status(401).json({ message: 'Invalid credentials' });

        const match = await bcrypt.compare(password, user.passwordHash);
        if (!match) return res.status(401).json({ message: 'Invalid credentials' });

        res.json({ token: signToken(user), user: sanitize(user) });
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});

// GET /api/auth/me — fetch current user profile
router.get('/me', require('../middleware/auth.middleware').protect, async (req, res) => {
    try {
        const user = await User.findById(req.user.id).select('-passwordHash');
        res.json(user);
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});

// PUT /api/auth/profile — update staff profile (name, signature)
// Staff can upload a new signature image; Cloudinary replaces the old one.
router.put(
    '/profile',
    require('../middleware/auth.middleware').protect,
    uploadSignature.single('signature'),
    async (req, res) => {
        try {
            const updates = {};

            if (req.body.name) updates.name = req.body.name;

            // New signature file uploaded → use Cloudinary secure_url
            if (req.file) {
                updates.signatureUrl = req.file.path;
            }

            const user = await User.findByIdAndUpdate(
                req.user.id,
                { $set: updates },
                { new: true, runValidators: true }
            ).select('-passwordHash');

            res.json({ message: 'Profile updated', user });
        } catch (err) {
            res.status(500).json({ message: err.message });
        }
    }
);

// PATCH /api/auth/student/profile
router.patch('/student/profile', require('../middleware/auth.middleware').protect, async (req, res) => {
    try {
        const {
            name, admissionNo, department, yearOfStudy,
            yearOfAdmission, category, typeOfAdmission, dateOfBirth,
            parentName, isHostler, hostelName
        } = req.body;

        const user = await User.findById(req.user.id);
        if (!user || user.role !== 'student') return res.status(403).json({ message: 'Only students can use this route' });

        if (admissionNo && admissionNo !== user.admissionNo) {
            if (await User.findOne({ admissionNo })) {
                return res.status(400).json({ message: 'Admission number already registered' });
            }
        }

        user.name = name || user.name;
        user.admissionNo = admissionNo || user.admissionNo;
        user.department = department || user.department;
        user.yearOfStudy = yearOfStudy || user.yearOfStudy;
        user.yearOfAdmission = yearOfAdmission || user.yearOfAdmission;
        user.category = category || user.category;
        user.typeOfAdmission = typeOfAdmission || user.typeOfAdmission;
        user.dateOfBirth = dateOfBirth || user.dateOfBirth;
        user.parentName = parentName || user.parentName;
        user.isHostler = isHostler !== undefined ? isHostler : user.isHostler;
        user.hostelName = user.isHostler ? hostelName : ''; // clean up if not hostler

        await user.save();
        res.json({ message: 'Profile updated', user: sanitize(user) });
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});

// PATCH /api/auth/staff/profile
router.patch('/staff/profile', require('../middleware/auth.middleware').protect, async (req, res) => {
    try {
        const { name, staffId, department, assignedClubs, assignedYear } = req.body;

        const user = await User.findById(req.user.id);
        if (!user || user.role === 'student') return res.status(403).json({ message: 'Only staff can use this route' });

        if (staffId && staffId !== user.staffId) {
            if (await User.findOne({ staffId })) {
                return res.status(400).json({ message: 'Staff ID already registered' });
            }
        }

        user.name = name || user.name;
        user.staffId = staffId || user.staffId;
        
        if (user.role === 'tutor' || user.role === 'hod') {
            user.department = department || user.department;
        }
        if (user.role === 'faculty_coordinator') {
            try {
                const parsedClubs = typeof assignedClubs === 'string' ? JSON.parse(assignedClubs) : assignedClubs;
                user.assignedClubs = Array.isArray(parsedClubs) ? parsedClubs : user.assignedClubs;
            } catch (e) {
                user.assignedClubs = Array.isArray(assignedClubs) ? assignedClubs : user.assignedClubs;
            }
        }
        if (user.role === 'tutor') {
            user.assignedYear = assignedYear || user.assignedYear;
        }

        await user.save();
        res.json({ message: 'Profile updated', user: sanitize(user) });
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});

function sanitize(user) {
    const u = user.toObject();
    delete u.passwordHash;
    return u;
}

module.exports = router;
