const express = require('express');
const upload = require('../middleware/upload');
const authMiddleware = require('../middleware/auth');
const pool = require('../config/database');
const fs = require('fs');
const path = require('path');

const router = express.Router();

// Upload file for a task
router.post('/task/:taskId', authMiddleware, upload.single('file'), async (req, res) => {
    try {
        const taskId = req.params.taskId;
        const userId = req.user.id;
        
        if (!req.file) {
            return res.status(400).json({ success: false, message: 'No file uploaded' });
        }
        
        const fileUrl = `/uploads/${req.file.filename}`;
        const originalName = req.file.originalname;
        const fileSize = req.file.size;
        
        const result = await pool.query(
            `INSERT INTO task_comments (task_id, user_id, comment, file_url) 
             VALUES ($1, $2, $3, $4) RETURNING *`,
            [taskId, userId, `Uploaded: ${originalName} (${(fileSize/1024).toFixed(2)} KB)`, fileUrl]
        );
        
        res.json({
            success: true,
            file: {
                filename: req.file.filename,
                originalName: originalName,
                url: fileUrl,
                size: fileSize
            },
            comment: result.rows[0]
        });
    } catch (error) {
        console.error(error);
        res.status(500).json({ success: false, message: 'Upload failed' });
    }
});

// Get all files for a task
router.get('/task/:taskId/files', authMiddleware, async (req, res) => {
    try {
        const taskId = req.params.taskId;
        const result = await pool.query(
            'SELECT * FROM task_comments WHERE task_id = $1 AND file_url IS NOT NULL ORDER BY created_at DESC',
            [taskId]
        );
        res.json({ success: true, files: result.rows });
    } catch (error) {
        console.error(error);
        res.status(500).json({ success: false, message: 'Error fetching files' });
    }
});

// Download/View file
router.get('/file/:filename', (req, res) => {
    const filename = req.params.filename;
    const filepath = path.join(__dirname, '../uploads', filename);
    
    if (fs.existsSync(filepath)) {
        res.sendFile(filepath);
    } else {
        res.status(404).json({ success: false, message: 'File not found' });
    }
});

// Delete file
router.delete('/file/:commentId', authMiddleware, async (req, res) => {
    try {
        const commentId = req.params.commentId;
        const result = await pool.query('DELETE FROM task_comments WHERE id = $1 RETURNING file_url', [commentId]);
        
        if (result.rows.length > 0 && result.rows[0].file_url) {
            const filename = path.basename(result.rows[0].file_url);
            const filepath = path.join(__dirname, '../uploads', filename);
            if (fs.existsSync(filepath)) {
                fs.unlinkSync(filepath);
            }
        }
        
        res.json({ success: true, message: 'File deleted' });
    } catch (error) {
        console.error(error);
        res.status(500).json({ success: false, message: 'Error deleting file' });
    }
});

module.exports = router;