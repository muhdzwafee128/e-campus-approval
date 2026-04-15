const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const User = require('../models/User.model');

// Multer config for signature uploads
const sigStorage = multer.diskStorage({
    destination: (req, file, cb) => {
        const dir = path.join(__dirname, '..', 'uploads', 'signatures');
        fs.mkdirSync(dir, { recursive: true });
        cb(null, dir);
    },
    filename: (req, file, cb) => {
        cb(null, `sig_${Date.now()}${path.extname(file.originalname)}`);
    },
});
const uploadSignature = multer({
    storage: sigStorage,
    limits: { fileSize: 2 * 1024 * 1024 },
    fileFilter: (req, file, cb) => {
        if (['image/png', 'image/jpeg'].includes(file.mimetype)) cb(null, true);
        else cb(new Error('Only PNG/JPG signatures allowed'));
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

        if (!['tutor', 'nodal_officer', 'faculty_coordinator', 'hod', 'principal'].includes(role)) {
            return res.status(400).json({ message: 'Invalid authority role' });
        }
        if (await User.findOne({ email })) {
            return res.status(400).json({ message: 'Email already registered' });
        }

        // signatureUrl: from uploaded file OR from base64 body field (canvas draw)
        let signatureUrl = '';
        if (req.file) {
            signatureUrl = `/uploads/signatures/${req.file.filename}`;
        } else if (req.body.signatureBase64) {
            // Save base64 canvas signature to file
            const base64Data = req.body.signatureBase64.replace(/^data:image\/\w+;base64,/, '');
            const sigDir = path.join(__dirname, '..', 'uploads', 'signatures');
            fs.mkdirSync(sigDir, { recursive: true });
            const filename = `sig_canvas_${Date.now()}.png`;
            fs.writeFileSync(path.join(sigDir, filename), base64Data, 'base64');
            signatureUrl = `/uploads/signatures/${filename}`;
        } else {
            return res.status(400).json({ message: 'Signature is required for authority registration' });
        }

        const passwordHash = await bcrypt.hash(password, 12);
        const user = await User.create({
            name, email, passwordHash, role, staffId,
            department: ['faculty_coordinator', 'principal'].includes(role) ? '' : department,
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

function sanitize(user) {
    const u = user.toObject();
    delete u.passwordHash;
    return u;
}

module.exports = router;
