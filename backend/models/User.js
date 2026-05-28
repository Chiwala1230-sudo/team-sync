const pool = require('../config/database');
const bcrypt = require('bcryptjs');

const User = {
    // Create a new user
    create: async (userData) => {
        const { name, email, student_id, password } = userData;
        const hashedPassword = await bcrypt.hash(password, 10);
        
        const query = `
            INSERT INTO users (name, email, student_id, password_hash)
            VALUES ($1, $2, $3, $4)
            RETURNING id, name, email, student_id, created_at
        `;
        const values = [name, email, student_id, hashedPassword];
        
        const result = await pool.query(query, values);
        return result.rows[0];
    },
    
    // Find user by email
    findByEmail: async (email) => {
        const query = 'SELECT * FROM users WHERE email = $1';
        const result = await pool.query(query, [email]);
        return result.rows[0];
    },
    
    // Find user by student ID
    findByStudentId: async (studentId) => {
        const query = 'SELECT * FROM users WHERE student_id = $1';
        const result = await pool.query(query, [studentId]);
        return result.rows[0];
    },
    
    // Find user by ID
    findById: async (id) => {
        const query = 'SELECT id, name, email, student_id, avatar_url, created_at FROM users WHERE id = $1';
        const result = await pool.query(query, [id]);
        return result.rows[0];
    },
    
    // Verify password
    verifyPassword: async (plainPassword, hashedPassword) => {
        return await bcrypt.compare(plainPassword, hashedPassword);
    }
};

module.exports = User;