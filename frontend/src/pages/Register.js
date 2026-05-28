import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import axios from 'axios';

function Register() {
    const navigate = useNavigate();
    const [formData, setFormData] = useState({
        name: '', email: '', student_id: '', password: '', confirm_password: ''
    });
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);

    const handleChange = (e) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');
        setLoading(true);

        if (formData.password !== formData.confirm_password) {
            setError('Passwords do not match');
            setLoading(false);
            return;
        }

        if (formData.password.length < 6) {
            setError('Password must be at least 6 characters');
            setLoading(false);
            return;
        }

        try {
            const response = await axios.post('http://localhost:5000/api/auth/register', {
                name: formData.name,
                email: formData.email,
                student_id: formData.student_id,
                password: formData.password,
                confirm_password: formData.confirm_password
            });
            
            if (response.data.success && response.data.token) {
                localStorage.setItem('token', response.data.token);
                localStorage.setItem('user', JSON.stringify(response.data.user));
                navigate('/dashboard');
            } else {
                setError(response.data.message || 'Registration failed');
            }
        } catch (err) {
            setError(err.response?.data?.message || 'Registration failed');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div style={styles.container}>
            <div style={styles.card}>
                <h1 style={styles.title}>Team Sync</h1>
                <h2 style={styles.subtitle}>Register</h2>
                {error && <div style={styles.error}>{error}</div>}
                <form onSubmit={handleSubmit} style={styles.form}>
                    <input type="text" name="name" placeholder="Full Name" onChange={handleChange} required style={styles.input} />
                    <input type="email" name="email" placeholder="Email" onChange={handleChange} required style={styles.input} />
                    <input type="text" name="student_id" placeholder="Student ID" onChange={handleChange} required style={styles.input} />
                    <input type="password" name="password" placeholder="Password" onChange={handleChange} required style={styles.input} />
                    <input type="password" name="confirm_password" placeholder="Confirm Password" onChange={handleChange} required style={styles.input} />
                    <button type="submit" disabled={loading} style={styles.button}>
                        {loading ? 'Registering...' : 'Register'}
                    </button>
                </form>
                <p style={styles.link}>
                    Already have an account? <Link to="/login">Login</Link>
                </p>
            </div>
        </div>
    );
}

const styles = {
    container: { display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '100vh', background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)' },
    card: { background: 'white', padding: '40px', borderRadius: '10px', boxShadow: '0 10px 40px rgba(0,0,0,0.2)', width: '100%', maxWidth: '400px' },
    title: { textAlign: 'center', color: '#667eea', marginBottom: '10px' },
    subtitle: { textAlign: 'center', color: '#333', marginBottom: '30px' },
    form: { display: 'flex', flexDirection: 'column', gap: '15px' },
    input: { padding: '12px', border: '1px solid #ddd', borderRadius: '5px', fontSize: '16px' },
    button: { padding: '12px', background: '#667eea', color: 'white', border: 'none', borderRadius: '5px', cursor: 'pointer', marginTop: '10px' },
    error: { background: '#fee', color: '#c00', padding: '10px', borderRadius: '5px', marginBottom: '15px', textAlign: 'center' },
    link: { textAlign: 'center', marginTop: '20px', color: '#666' },
};

export default Register;