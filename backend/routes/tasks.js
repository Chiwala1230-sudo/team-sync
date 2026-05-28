const express = require('express');
const pool = require('../config/database');
const authMiddleware = require('../middleware/auth');

const router = express.Router();

// Get all tasks for a project
router.get('/project/:projectId', authMiddleware, async (req, res) => {
    try {
        const result = await pool.query(
            `SELECT * FROM tasks WHERE project_id = $1 ORDER BY created_at ASC`,
            [req.params.projectId]
        );
        
        for (const task of result.rows) {
            const checklist = await pool.query(
                'SELECT * FROM task_checklist WHERE task_id = $1 ORDER BY created_at ASC',
                [task.id]
            );
            task.checklist = checklist.rows;
        }
        
        res.json({ success: true, tasks: result.rows });
    } catch (error) {
        console.error('Error:', error);
        res.status(500).json({ success: false, message: error.message });
    }
});

// Create a new task
router.post('/', authMiddleware, async (req, res) => {
    try {
        const { project_id, title, description, assigned_to, priority, due_date } = req.body;
        
        const result = await pool.query(
            `INSERT INTO tasks (project_id, title, description, assigned_to, priority, due_date, status) 
             VALUES ($1, $2, $3, $4, $5, $6, 'todo') RETURNING *`,
            [project_id, title, description, assigned_to, priority || 'medium', due_date]
        );
        
        res.status(201).json({ success: true, task: result.rows[0] });
    } catch (error) {
        console.error('Error:', error);
        res.status(500).json({ success: false, message: error.message });
    }
});

// Update task status
router.put('/:id', authMiddleware, async (req, res) => {
    try {
        const taskId = req.params.id;
        const { status, is_completed } = req.body;
        
        if (status !== undefined) {
            const result = await pool.query(
                'UPDATE tasks SET status = $1 WHERE id = $2 RETURNING *',
                [status, taskId]
            );
            if (result.rows.length === 0) {
                return res.status(404).json({ success: false, message: 'Task not found' });
            }
            return res.json({ success: true, task: result.rows[0] });
        }
        
        if (is_completed !== undefined) {
            const result = await pool.query(
                'UPDATE tasks SET is_completed = $1, status = CASE WHEN $1 = true THEN \'done\' ELSE \'todo\' END WHERE id = $2 RETURNING *',
                [is_completed, taskId]
            );
            if (result.rows.length === 0) {
                return res.status(404).json({ success: false, message: 'Task not found' });
            }
            return res.json({ success: true, task: result.rows[0] });
        }
        
        res.status(400).json({ success: false, message: 'No update fields provided' });
    } catch (error) {
        console.error('Update error:', error);
        res.status(500).json({ success: false, message: error.message });
    }
});

// Add checklist item
router.post('/:id/checklist', authMiddleware, async (req, res) => {
    try {
        const taskId = req.params.id;
        const { title } = req.body;
        
        const result = await pool.query(
            'INSERT INTO task_checklist (task_id, title) VALUES ($1, $2) RETURNING *',
            [taskId, title]
        );
        
        res.status(201).json({ success: true, checklist: result.rows[0] });
    } catch (error) {
        console.error('Error:', error);
        res.status(500).json({ success: false, message: error.message });
    }
});

// Toggle checklist item
router.put('/checklist/:id', authMiddleware, async (req, res) => {
    try {
        const checklistId = req.params.id;
        const { is_completed } = req.body;
        
        const result = await pool.query(
            'UPDATE task_checklist SET is_completed = $1 WHERE id = $2 RETURNING *',
            [is_completed, checklistId]
        );
        
        res.json({ success: true, checklist: result.rows[0] });
    } catch (error) {
        console.error('Error:', error);
        res.status(500).json({ success: false, message: error.message });
    }
});

// Delete task
router.delete('/:id', authMiddleware, async (req, res) => {
    try {
        await pool.query('DELETE FROM task_checklist WHERE task_id = $1', [req.params.id]);
        await pool.query('DELETE FROM tasks WHERE id = $1', [req.params.id]);
        res.json({ success: true, message: 'Task deleted' });
    } catch (error) {
        console.error('Error:', error);
        res.status(500).json({ success: false, message: error.message });
    }
});

module.exports = router;