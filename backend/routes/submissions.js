const express = require('express');
const pool = require('../config/database');
const authMiddleware = require('../middleware/auth');
const upload = require('../middleware/upload');

const router = express.Router();

// Submit project to lecturer
router.post('/project/:projectId', authMiddleware, upload.single('file'), async (req, res) => {
    try {
        const projectId = req.params.projectId;
        const { title, description } = req.body;
        const fileUrl = req.file ? `/uploads/${req.file.filename}` : null;
        
        // Check if user is owner
        const checkResult = await pool.query(
            'SELECT * FROM project_members WHERE project_id = $1 AND user_id = $2 AND role = $3',
            [projectId, req.user.id, 'owner']
        );
        
        if (checkResult.rows.length === 0) {
            return res.status(403).json({ success: false, message: 'Only project owner can submit' });
        }
        
        const result = await pool.query(
            `INSERT INTO project_submissions (project_id, user_id, title, description, file_url, status) 
             VALUES ($1, $2, $3, $4, $5, 'pending') RETURNING *`,
            [projectId, req.user.id, title, description, fileUrl]
        );
        
        res.json({ success: true, submission: result.rows[0] });
    } catch (error) {
        console.error('Error submitting project:', error);
        res.status(500).json({ success: false, message: error.message });
    }
});

// Get submission status
router.get('/project/:projectId', authMiddleware, async (req, res) => {
    try {
        const result = await pool.query(
            'SELECT * FROM project_submissions WHERE project_id = $1 ORDER BY submitted_at DESC LIMIT 1',
            [req.params.projectId]
        );
        res.json({ success: true, submission: result.rows[0] || null });
    } catch (error) {
        console.error('Error getting submission:', error);
        res.status(500).json({ success: false, message: error.message });
    }
});

module.exports = router;