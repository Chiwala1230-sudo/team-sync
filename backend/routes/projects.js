const express = require('express');
const pool = require('../config/database');
const authMiddleware = require('../middleware/auth');

const router = express.Router();

// Get all projects for logged in user
router.get('/', authMiddleware, async (req, res) => {
    try {
        const query = `
            SELECT p.*, 
                   COUNT(DISTINCT t.id) as task_count,
                   COUNT(DISTINCT CASE WHEN t.status = 'done' THEN t.id END) as completed_count,
                   COUNT(DISTINCT pm.user_id) as member_count
            FROM projects p
            LEFT JOIN project_members pm ON p.id = pm.project_id
            LEFT JOIN tasks t ON p.id = t.project_id
            WHERE pm.user_id = $1
            GROUP BY p.id
            ORDER BY p.created_at DESC
        `;
        const result = await pool.query(query, [req.user.id]);
        res.json({ success: true, projects: result.rows });
    } catch (error) {
        console.error('Error getting projects:', error);
        res.status(500).json({ success: false, message: error.message });
    }
});

// IMPORTANT: Get members for ONE specific project
router.get('/:id/members', authMiddleware, async (req, res) => {
    try {
        const projectId = req.params.id;
        
        console.log('Fetching members for project ID:', projectId);
        
        const result = await pool.query(
            `SELECT u.id, u.name, u.email, u.student_id, pm.role, pm.joined_at
             FROM project_members pm
             JOIN users u ON pm.user_id = u.id
             WHERE pm.project_id = $1`,
            [projectId]
        );
        
        console.log('Found members:', result.rows);
        
        res.json({ success: true, members: result.rows });
    } catch (error) {
        console.error('Error getting members:', error);
        res.status(500).json({ success: false, message: error.message });
    }
});

// Add member to project
router.post('/:id/members', authMiddleware, async (req, res) => {
    try {
        const projectId = req.params.id;
        const { email, role } = req.body;
        
        const ownerCheck = await pool.query(
            'SELECT * FROM project_members WHERE project_id = $1 AND user_id = $2 AND role = $3',
            [projectId, req.user.id, 'owner']
        );
        
        if (ownerCheck.rows.length === 0) {
            return res.status(403).json({ success: false, message: 'Only project owner can add members' });
        }
        
        const userResult = await pool.query(
            'SELECT id, name, email FROM users WHERE email = $1',
            [email]
        );
        
        if (userResult.rows.length === 0) {
            return res.status(404).json({ success: false, message: 'User not found with that email' });
        }
        
        const userToAdd = userResult.rows[0];
        
        const existing = await pool.query(
            'SELECT * FROM project_members WHERE project_id = $1 AND user_id = $2',
            [projectId, userToAdd.id]
        );
        
        if (existing.rows.length > 0) {
            return res.status(400).json({ success: false, message: 'User is already a member' });
        }
        
        await pool.query(
            'INSERT INTO project_members (project_id, user_id, role) VALUES ($1, $2, $3)',
            [projectId, userToAdd.id, role || 'member']
        );
        
        res.json({ success: true, message: 'Member added', member: userToAdd });
    } catch (error) {
        console.error(error);
        res.status(500).json({ success: false, message: error.message });
    }
});

// Remove member from project
router.delete('/:id/members/:userId', authMiddleware, async (req, res) => {
    try {
        const projectId = req.params.id;
        const userIdToRemove = parseInt(req.params.userId);
        
        const ownerCheck = await pool.query(
            'SELECT * FROM project_members WHERE project_id = $1 AND user_id = $2 AND role = $3',
            [projectId, req.user.id, 'owner']
        );
        
        if (ownerCheck.rows.length === 0) {
            return res.status(403).json({ success: false, message: 'Only project owner can remove members' });
        }
        
        if (req.user.id === userIdToRemove) {
            return res.status(400).json({ success: false, message: 'Cannot remove yourself as owner' });
        }
        
        await pool.query(
            'DELETE FROM project_members WHERE project_id = $1 AND user_id = $2',
            [projectId, userIdToRemove]
        );
        
        res.json({ success: true, message: 'Member removed' });
    } catch (error) {
        console.error(error);
        res.status(500).json({ success: false, message: error.message });
    }
});

// Get all users
router.get('/users/all', authMiddleware, async (req, res) => {
    try {
        const result = await pool.query(
            'SELECT id, name, email, student_id FROM users ORDER BY name'
        );
        res.json({ success: true, users: result.rows });
    } catch (error) {
        console.error(error);
        res.status(500).json({ success: false, message: error.message });
    }
});

// Create a new project
router.post('/', authMiddleware, async (req, res) => {
    try {
        const { name, description, deadline } = req.body;
        
        if (!name) {
            return res.status(400).json({ success: false, message: 'Project name is required' });
        }
        
        const result = await pool.query(
            'INSERT INTO projects (name, description, deadline, created_by, status) VALUES ($1, $2, $3, $4, $5) RETURNING *',
            [name, description, deadline, req.user.id, 'active']
        );
        
        const project = result.rows[0];
        
        await pool.query(
            'INSERT INTO project_members (project_id, user_id, role) VALUES ($1, $2, $3) ON CONFLICT DO NOTHING',
            [project.id, req.user.id, 'owner']
        );
        
        res.status(201).json({ success: true, project });
    } catch (error) {
        console.error('Error creating project:', error);
        res.status(500).json({ success: false, message: error.message });
    }
});

// Update a project
router.put('/:id', authMiddleware, async (req, res) => {
    try {
        const { name, description, deadline, status } = req.body;
        const projectId = req.params.id;
        
        const checkResult = await pool.query(
            'SELECT * FROM project_members WHERE project_id = $1 AND user_id = $2 AND role = $3',
            [projectId, req.user.id, 'owner']
        );
        
        if (checkResult.rows.length === 0) {
            return res.status(403).json({ success: false, message: 'Only project owner can edit' });
        }
        
        const result = await pool.query(
            'UPDATE projects SET name = COALESCE($1, name), description = COALESCE($2, description), deadline = COALESCE($3, deadline), status = COALESCE($4, status) WHERE id = $5 RETURNING *',
            [name, description, deadline, status, projectId]
        );
        
        res.json({ success: true, project: result.rows[0] });
    } catch (error) {
        console.error('Error updating project:', error);
        res.status(500).json({ success: false, message: error.message });
    }
});

// Delete a project
router.delete('/:id', authMiddleware, async (req, res) => {
    try {
        const projectId = req.params.id;
        
        const checkResult = await pool.query(
            'SELECT * FROM project_members WHERE project_id = $1 AND user_id = $2 AND role = $3',
            [projectId, req.user.id, 'owner']
        );
        
        if (checkResult.rows.length === 0) {
            return res.status(403).json({ success: false, message: 'Only project owner can delete' });
        }
        
        await pool.query('DELETE FROM tasks WHERE project_id = $1', [projectId]);
        await pool.query('DELETE FROM project_members WHERE project_id = $1', [projectId]);
        await pool.query('DELETE FROM projects WHERE id = $1', [projectId]);
        
        res.json({ success: true, message: 'Project deleted' });
    } catch (error) {
        console.error('Error deleting project:', error);
        res.status(500).json({ success: false, message: error.message });
    }
});

module.exports = router;