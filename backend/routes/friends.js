const express = require('express');
const pool = require('../config/database');
const authMiddleware = require('../middleware/auth');

const router = express.Router();

// Get suggested friends (people you may know)
router.get('/suggestions', authMiddleware, async (req, res) => {
    try {
        // Get users from same student ID pattern or not friends yet
        const result = await pool.query(
            `SELECT u.id, u.name, u.email, u.student_id 
             FROM users u
             WHERE u.id != $1
             AND NOT EXISTS (
                 SELECT 1 FROM friends f 
                 WHERE (f.user_id = $1 AND f.friend_id = u.id)
                 OR (f.user_id = u.id AND f.friend_id = $1)
             )
             AND NOT EXISTS (
                 SELECT 1 FROM friend_requests fr 
                 WHERE fr.from_user_id = $1 AND fr.to_user_id = u.id
                 OR fr.from_user_id = u.id AND fr.to_user_id = $1
             )
             LIMIT 10`,
            [req.user.id]
        );
        
        res.json({ success: true, suggestions: result.rows });
    } catch (error) {
        console.error('Error getting suggestions:', error);
        res.status(500).json({ success: false, message: error.message });
    }
});

// Send friend request
router.post('/request/:userId', authMiddleware, async (req, res) => {
    try {
        const toUserId = req.params.userId;
        
        const result = await pool.query(
            'INSERT INTO friend_requests (from_user_id, to_user_id) VALUES ($1, $2) ON CONFLICT DO NOTHING RETURNING *',
            [req.user.id, toUserId]
        );
        
        res.json({ success: true, request: result.rows[0] });
    } catch (error) {
        console.error('Error sending request:', error);
        res.status(500).json({ success: false, message: error.message });
    }
});

// Get pending friend requests
router.get('/requests/pending', authMiddleware, async (req, res) => {
    try {
        const result = await pool.query(
            `SELECT fr.*, u.name, u.email, u.student_id 
             FROM friend_requests fr
             JOIN users u ON fr.from_user_id = u.id
             WHERE fr.to_user_id = $1 AND fr.status = 'pending'`,
            [req.user.id]
        );
        
        res.json({ success: true, requests: result.rows });
    } catch (error) {
        console.error('Error getting requests:', error);
        res.status(500).json({ success: false, message: error.message });
    }
});

// Accept friend request
router.put('/request/:requestId/accept', authMiddleware, async (req, res) => {
    try {
        const requestId = req.params.requestId;
        
        // Get the request
        const requestResult = await pool.query(
            'SELECT * FROM friend_requests WHERE id = $1 AND to_user_id = $2',
            [requestId, req.user.id]
        );
        
        if (requestResult.rows.length === 0) {
            return res.status(404).json({ success: false, message: 'Request not found' });
        }
        
        const request = requestResult.rows[0];
        
        // Add both as friends
        await pool.query(
            'INSERT INTO friends (user_id, friend_id) VALUES ($1, $2), ($2, $1)',
            [request.from_user_id, request.to_user_id]
        );
        
        // Update request status
        await pool.query(
            'UPDATE friend_requests SET status = $1 WHERE id = $2',
            ['accepted', requestId]
        );
        
        res.json({ success: true, message: 'Friend added' });
    } catch (error) {
        console.error('Error accepting request:', error);
        res.status(500).json({ success: false, message: error.message });
    }
});

// Get friends list
router.get('/list', authMiddleware, async (req, res) => {
    try {
        const result = await pool.query(
            `SELECT u.id, u.name, u.email, u.student_id 
             FROM friends f
             JOIN users u ON f.friend_id = u.id
             WHERE f.user_id = $1`,
            [req.user.id]
        );
        
        res.json({ success: true, friends: result.rows });
    } catch (error) {
        console.error('Error getting friends:', error);
        res.status(500).json({ success: false, message: error.message });
    }
});

module.exports = router;