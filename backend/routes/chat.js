const express = require('express');
const pool = require('../config/database');
const authMiddleware = require('../middleware/auth');

const router = express.Router();

// Get messages for a project
router.get('/project/:projectId', authMiddleware, async (req, res) => {
    try {
        const result = await pool.query(
            `SELECT cm.*, u.name, u.avatar_url 
             FROM chat_messages cm
             JOIN users u ON cm.user_id = u.id
             WHERE cm.project_id = $1 
             ORDER BY cm.created_at ASC`,
            [req.params.projectId]
        );
        res.json({ success: true, messages: result.rows });
    } catch (error) {
        console.error('Error getting messages:', error);
        res.status(500).json({ success: false, message: error.message });
    }
});

// Send message
router.post('/', authMiddleware, async (req, res) => {
    try {
        const { project_id, message, file_url } = req.body;
        
        const result = await pool.query(
            'INSERT INTO chat_messages (project_id, user_id, message, file_url) VALUES ($1, $2, $3, $4) RETURNING *',
            [project_id, req.user.id, message, file_url]
        );
        
        res.status(201).json({ success: true, message: result.rows[0] });
    } catch (error) {
        console.error('Error sending message:', error);
        res.status(500).json({ success: false, message: error.message });
    }
});

module.exports = router;
