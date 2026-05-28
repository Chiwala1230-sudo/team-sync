const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const dotenv = require('dotenv');
const path = require('path');
const http = require('http');
const { Server } = require('socket.io');

dotenv.config();

const authRoutes = require('./routes/auth');
const projectRoutes = require('./routes/projects');
const taskRoutes = require('./routes/tasks');
const uploadRoutes = require('./routes/upload');
const chatRoutes = require('./routes/chat');
const submissionRoutes = require('./routes/submissions');
const friendRoutes = require('./routes/friends');

const app = express();
const server = http.createServer(app);
const io = new Server(server, {
    cors: {
        origin: 'http://localhost:3000',
        credentials: true
    }
});

// Socket.IO for real-time chat
io.on('connection', (socket) => {
    console.log('New client connected');
    
    socket.on('join-project', (projectId) => {
        socket.join(`project-${projectId}`);
        console.log(`User joined project ${projectId}`);
    });
    
    socket.on('send-message', async (data) => {
        const { projectId, message, userId, userName } = data;
        io.to(`project-${projectId}`).emit('new-message', {
            message,
            userId,
            userName,
            createdAt: new Date()
        });
    });
    
    socket.on('disconnect', () => {
        console.log('Client disconnected');
    });
});

app.use(helmet());
app.use(cors({ origin: 'http://localhost:3000', credentials: true }));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(morgan('dev'));
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

app.get('/api/health', (req, res) => {
    res.status(200).json({ success: true, message: 'Team Sync API is running' });
});

app.use('/api/auth', authRoutes);
app.use('/api/projects', projectRoutes);
app.use('/api/tasks', taskRoutes);
app.use('/api/upload', uploadRoutes);
app.use('/api/chat', chatRoutes);
app.use('/api/submissions', submissionRoutes);
app.use('/api/friends', friendRoutes);

app.use((req, res) => {
    res.status(404).json({ success: false, message: 'Route not found' });
});

app.use((err, req, res, next) => {
    console.error(err.stack);
    res.status(err.status || 500).json({ success: false, message: err.message || 'Internal server error' });
});

const PORT = process.env.PORT || 5000;
server.listen(PORT, () => {
    console.log(`🚀 Server running on port ${PORT}`);
});