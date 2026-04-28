require('dotenv').config();
const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const cors = require('cors');
const path = require('path');
const connectDB = require('./config/db');

const app = express();
const server = http.createServer(app);

// Socket.io — real-time events
const io = new Server(server, {
    cors: { origin: process.env.CLIENT_URL || 'http://localhost:5173', methods: ['GET', 'POST'] },
});

io.on('connection', (socket) => {
    // Each user joins their own room using their userId
    socket.on('join', (userId) => {
        socket.join(userId);
        console.log(`Socket: user ${userId} joined room`);
    });
    socket.on('disconnect', () => { });
});

app.set('io', io);

// Middleware
app.use(cors({ origin: process.env.CLIENT_URL || 'http://localhost:5173' }));
app.use(express.json({ limit: '20mb' }));
app.use(express.urlencoded({ extended: true, limit: '20mb' }));

// Static file serving — uploaded files and generated PDFs
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));
app.use('/pdfs', express.static(path.join(__dirname, 'pdfs')));

// Routes
app.use('/api/auth', require('./routes/auth.routes'));
app.use('/api/requests', require('./routes/request.routes'));
app.use('/api/approvals', require('./routes/approval.routes'));
app.use('/api/office', require('./routes/office.routes'));
app.use('/api/documents', require('./routes/document.routes'));

// Health check
app.get('/api/health', (req, res) => res.json({ status: 'ok', time: new Date().toISOString() }));

// Connect DB and start server
const PORT = process.env.PORT || 5000;
connectDB().then(() => {
    server.listen(PORT, () => console.log(`Server running on http://localhost:${PORT}`));
});
