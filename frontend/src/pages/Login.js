import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import axios from 'axios';

function Login() {
    const navigate = useNavigate();
    const [formData, setFormData] = useState({ email: '', password: '' });
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);
    const [quoteIndex, setQuoteIndex] = useState(0);

    const quotes = [
        { text: "Alone we can do so little; together we can do so much.", author: "Helen Keller" },
        { text: "Teamwork is the ability to work together toward a common vision.", author: "Andrew Carnegie" },
        { text: "Coming together is a beginning; keeping together is progress; working together is success.", author: "Henry Ford" },
        { text: "None of us is as smart as all of us.", author: "Ken Blanchard" },
        { text: "The strength of the team is each individual member. The strength of each member is the team.", author: "Phil Jackson" },
        { text: "Great things in business are never done by one person. They're done by a team of people.", author: "Steve Jobs" },
        { text: "Teamwork makes the dream work.", author: "John C. Maxwell" },
        { text: "If everyone is moving forward together, then success takes care of itself.", author: "Henry Ford" }
    ];

    useEffect(() => {
        const interval = setInterval(() => {
            setQuoteIndex((prev) => (prev + 1) % quotes.length);
        }, 5000);
        return () => clearInterval(interval);
    }, [quotes.length]);

    const handleChange = (e) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');
        setLoading(true);

        try {
            const response = await axios.post('http://localhost:5000/api/auth/login', {
                email: formData.email,
                password: formData.password
            });
            
            if (response.data.success && response.data.token) {
                localStorage.setItem('token', response.data.token);
                localStorage.setItem('user', JSON.stringify(response.data.user));
                navigate('/dashboard');
            } else {
                setError(response.data.message || 'Login failed');
            }
        } catch (err) {
            setError(err.response?.data?.message || 'Login failed');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div style={styles.container}>
            <div style={styles.background}>
                <div style={styles.gradientBg}></div>
                <div style={styles.floatingShapes}>
                    <div style={styles.shape1}></div>
                    <div style={styles.shape2}></div>
                    <div style={styles.shape3}></div>
                    <div style={styles.shape4}></div>
                </div>
            </div>

            <div style={styles.quoteSection}>
                <div style={styles.quoteCard}>
                    <div style={styles.quoteIcon}>"</div>
                    <p style={styles.quoteText}>{quotes[quoteIndex].text}</p>
                    <p style={styles.quoteAuthor}>— {quotes[quoteIndex].author}</p>
                </div>
            </div>

            <div style={styles.formSection}>
                <div style={styles.formCard}>
                    <div style={styles.logo}>
                        <span style={styles.logoIcon}>🤝</span>
                        <h1 style={styles.logoText}>Team Sync</h1>
                    </div>
                    <h2 style={styles.welcomeText}>Welcome Back!</h2>
                    <p style={styles.subText}>Login to manage your team projects</p>
                    
                    {error && <div style={styles.error}>{error}</div>}
                    
                    <form onSubmit={handleSubmit} style={styles.form}>
                        <div style={styles.inputGroup}>
                            <label style={styles.label}>Email Address</label>
                            <input
                                type="email"
                                name="email"
                                placeholder="you@example.com"
                                value={formData.email}
                                onChange={handleChange}
                                required
                                style={styles.input}
                            />
                        </div>
                        
                        <div style={styles.inputGroup}>
                            <label style={styles.label}>Password</label>
                            <input
                                type="password"
                                name="password"
                                placeholder="••••••••"
                                value={formData.password}
                                onChange={handleChange}
                                required
                                style={styles.input}
                            />
                        </div>
                        
                        <button type="submit" disabled={loading} style={styles.button}>
                            {loading ? 'Logging in...' : 'Login →'}
                        </button>
                    </form>
                    
                    <p style={styles.footer}>
                        Don't have an account? <Link to="/register" style={styles.link}>Create Account</Link>
                    </p>
                </div>
            </div>
        </div>
    );
}

const styles = {
    container: {
        display: 'flex',
        minHeight: '100vh',
        position: 'relative',
        overflow: 'hidden',
        fontFamily: "'Inter', 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif",
    },
    background: {
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        zIndex: 0,
    },
    gradientBg: {
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
    },
    floatingShapes: {
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        overflow: 'hidden',
    },
    shape1: {
        position: 'absolute',
        top: '10%',
        left: '-5%',
        width: '300px',
        height: '300px',
        background: 'rgba(255,255,255,0.1)',
        borderRadius: '50%',
        animation: 'float 20s ease-in-out infinite',
    },
    shape2: {
        position: 'absolute',
        bottom: '10%',
        right: '-5%',
        width: '400px',
        height: '400px',
        background: 'rgba(255,255,255,0.08)',
        borderRadius: '50%',
        animation: 'float 25s ease-in-out infinite reverse',
    },
    shape3: {
        position: 'absolute',
        top: '50%',
        left: '20%',
        width: '150px',
        height: '150px',
        background: 'rgba(255,255,255,0.05)',
        borderRadius: '50%',
        animation: 'float 15s ease-in-out infinite',
    },
    shape4: {
        position: 'absolute',
        bottom: '30%',
        right: '15%',
        width: '200px',
        height: '200px',
        background: 'rgba(255,255,255,0.06)',
        borderRadius: '50%',
        animation: 'float 18s ease-in-out infinite reverse',
    },
    quoteSection: {
        flex: 1,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 1,
        padding: '40px',
    },
    quoteCard: {
        maxWidth: '500px',
        padding: '40px',
        background: 'rgba(255,255,255,0.1)',
        backdropFilter: 'blur(10px)',
        borderRadius: '20px',
        color: 'white',
        textAlign: 'center',
        animation: 'fadeInUp 0.8s ease-out',
    },
    quoteIcon: {
        fontSize: '80px',
        fontFamily: 'Georgia, serif',
        lineHeight: 1,
        opacity: 0.5,
        marginBottom: '20px',
    },
    quoteText: {
        fontSize: '24px',
        lineHeight: 1.4,
        marginBottom: '20px',
        fontWeight: '500',
    },
    quoteAuthor: {
        fontSize: '14px',
        opacity: 0.8,
        letterSpacing: '1px',
    },
    formSection: {
        flex: 1,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 1,
        padding: '40px',
    },
    formCard: {
        background: 'white',
        padding: '50px',
        borderRadius: '30px',
        boxShadow: '0 20px 60px rgba(0,0,0,0.3)',
        width: '100%',
        maxWidth: '450px',
        animation: 'fadeInUp 0.8s ease-out 0.2s both',
    },
    logo: {
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        gap: '10px',
        marginBottom: '30px',
    },
    logoIcon: {
        fontSize: '32px',
    },
    logoText: {
        fontSize: '28px',
        background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
        WebkitBackgroundClip: 'text',
        WebkitTextFillColor: 'transparent',
        margin: 0,
    },
    welcomeText: {
        fontSize: '28px',
        color: '#333',
        marginBottom: '10px',
        textAlign: 'center',
    },
    subText: {
        color: '#666',
        textAlign: 'center',
        marginBottom: '30px',
        fontSize: '14px',
    },
    form: {
        display: 'flex',
        flexDirection: 'column',
        gap: '20px',
    },
    inputGroup: {
        display: 'flex',
        flexDirection: 'column',
        gap: '8px',
    },
    label: {
        fontSize: '14px',
        fontWeight: '600',
        color: '#333',
    },
    input: {
        padding: '14px 16px',
        border: '2px solid #e0e0e0',
        borderRadius: '12px',
        fontSize: '16px',
        transition: 'all 0.3s ease',
        outline: 'none',
        fontFamily: 'inherit',
    },
    button: {
        padding: '14px',
        background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
        color: 'white',
        border: 'none',
        borderRadius: '12px',
        fontSize: '16px',
        fontWeight: '600',
        cursor: 'pointer',
        transition: 'transform 0.2s ease, box-shadow 0.2s ease',
        marginTop: '10px',
    },
    footer: {
        textAlign: 'center',
        marginTop: '30px',
        color: '#666',
        fontSize: '14px',
    },
    link: {
        color: '#667eea',
        textDecoration: 'none',
        fontWeight: '600',
    },
    error: {
        background: '#fee',
        color: '#c00',
        padding: '12px',
        borderRadius: '12px',
        marginBottom: '20px',
        textAlign: 'center',
        fontSize: '14px',
    },
};

const styleSheet = document.createElement("style");
styleSheet.textContent = `
    @keyframes float {
        0%, 100% { transform: translateY(0) translateX(0); }
        50% { transform: translateY(-30px) translateX(20px); }
    }
    @keyframes fadeInUp {
        from {
            opacity: 0;
            transform: translateY(30px);
        }
        to {
            opacity: 1;
            transform: translateY(0);
        }
    }
    input:focus {
        border-color: #667eea;
        box-shadow: 0 0 0 3px rgba(102,126,234,0.1);
    }
    button:hover {
        transform: translateY(-2px);
        box-shadow: 0 10px 20px rgba(102,126,234,0.3);
    }
`;
document.head.appendChild(styleSheet);

export default Login;