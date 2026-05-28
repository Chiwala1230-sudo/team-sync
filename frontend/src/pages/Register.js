import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import axios from 'axios';

function Register() {
    const navigate = useNavigate();
    const [formData, setFormData] = useState({
        name: '', email: '', student_id: '', password: '', confirm_password: ''
    });
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);
    const [quoteIndex, setQuoteIndex] = useState(0);
    const [focusedField, setFocusedField] = useState(null);
    const [isMobile, setIsMobile] = useState(false);

    const quotes = [
        { text: "Alone we can do so little; together we can do so much.", author: "Helen Keller" },
        { text: "Teamwork is the ability to work together toward a common vision.", author: "Andrew Carnegie" },
        { text: "Coming together is a beginning; keeping together is progress; working together is success.", author: "Henry Ford" },
        { text: "None of us is as smart as all of us.", author: "Ken Blanchard" },
        { text: "The strength of the team is each individual member.", author: "Phil Jackson" },
        { text: "Great things are never done by one person. They're done by a team.", author: "Steve Jobs" },
        { text: "Teamwork makes the dream work.", author: "John C. Maxwell" },
        { text: "If everyone moves forward together, success takes care of itself.", author: "Henry Ford" }
    ];

    useEffect(() => {
        const interval = setInterval(() => {
            setQuoteIndex((prev) => (prev + 1) % quotes.length);
        }, 5000);
        return () => clearInterval(interval);
    }, []);

    useEffect(() => {
        const checkMobile = () => {
            setIsMobile(window.innerWidth <= 768);
        };
        checkMobile();
        window.addEventListener('resize', checkMobile);
        return () => window.removeEventListener('resize', checkMobile);
    }, []);

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

    const containerStyle = {
        display: 'flex',
        flexDirection: isMobile ? 'column' : 'row',
        minHeight: '100vh',
        width: '100%',
        position: 'relative',
        overflow: 'auto',
        fontFamily: "'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif",
    };

    const brandSectionStyle = {
        flex: isMobile ? '0.8' : '1.2',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 1,
        padding: isMobile ? '40px 20px' : '60px',
        position: 'relative',
        minHeight: isMobile ? 'auto' : '100vh',
    };

    const formSectionStyle = {
        flex: 1,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 1,
        background: 'white',
        padding: isMobile ? '40px 20px' : '40px',
        position: 'relative',
        minHeight: isMobile ? 'auto' : '100vh',
    };

    const formContainerStyle = {
        width: '100%',
        maxWidth: isMobile ? '400px' : '520px',
        margin: isMobile ? '0 auto' : '0',
        animation: 'fadeInRight 0.8s ease-out',
    };

    const brandContentStyle = {
        maxWidth: isMobile ? '100%' : '500px',
        textAlign: isMobile ? 'center' : 'left',
        animation: 'fadeInLeft 0.8s ease-out',
    };

    const rowStyle = {
        display: 'grid',
        gridTemplateColumns: isMobile ? '1fr' : '1fr 1fr',
        gap: isMobile ? '16px' : '16px',
    };

    return (
        <div style={containerStyle}>
            {/* Animated Background */}
            <div style={styles.background}>
                <div style={styles.gradientBg}></div>
                <div style={styles.gridPattern}></div>
                <div style={styles.floatingShapes}>
                    <div style={styles.shape1}></div>
                    <div style={styles.shape2}></div>
                    <div style={styles.shape3}></div>
                    <div style={styles.shape4}></div>
                    <div style={styles.shape5}></div>
                </div>
            </div>

            {/* Left Side - Brand & Quote */}
            <div style={brandSectionStyle}>
                <div style={brandContentStyle}>
                    <div style={styles.brandLogo}>
                        <div style={styles.logoIcon}>
                            <svg width={isMobile ? "40" : "48"} height={isMobile ? "40" : "48"} viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                                <path d="M12 2L2 7L12 12L22 7L12 2Z" stroke="white" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                                <path d="M2 17L12 22L22 17" stroke="white" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                                <path d="M2 12L12 17L22 12" stroke="white" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                            </svg>
                        </div>
                        <div>
                            <h1 style={{...styles.brandTitle, fontSize: isMobile ? '24px' : '32px'}}>Team<span style={styles.brandHighlight}>Sync</span></h1>
                            <p style={styles.brandTagline}>Collaborate. Create. Succeed.</p>
                        </div>
                    </div>
                    
                    <div style={styles.quoteContainer}>
                        <div style={styles.quoteWrapper}>
                            <span style={styles.quoteMark}>"</span>
                            <p style={{...styles.quoteText, fontSize: isMobile ? '18px' : '22px'}}>{quotes[quoteIndex].text}</p>
                            <p style={styles.quoteAuthor}>— {quotes[quoteIndex].author}</p>
                        </div>
                    </div>
                    
                    <div style={styles.featureList}>
                        <div style={styles.featureItem}>
                            <span style={styles.featureIcon}>✓</span>
                            <span>Real-time Task Tracking</span>
                        </div>
                        <div style={styles.featureItem}>
                            <span style={styles.featureIcon}>✓</span>
                            <span>Team Collaboration Tools</span>
                        </div>
                        <div style={styles.featureItem}>
                            <span style={styles.featureIcon}>✓</span>
                            <span>File Sharing & Storage</span>
                        </div>
                        <div style={styles.featureItem}>
                            <span style={styles.featureIcon}>✓</span>
                            <span>Progress Analytics</span>
                        </div>
                    </div>
                </div>
            </div>

            {/* Right Side - Register Form */}
            <div style={formSectionStyle}>
                <div style={formContainerStyle}>
                    <div style={styles.formHeader}>
                        <h2 style={{...styles.formTitle, fontSize: isMobile ? '28px' : '32px'}}>Create account</h2>
                        <p style={styles.formSubtitle}>Join thousands of teams collaborating with TeamSync</p>
                    </div>
                    
                    {error && (
                        <div style={styles.errorAlert}>
                            <span style={styles.errorIcon}>⚠️</span>
                            <span>{error}</span>
                        </div>
                    )}
                    
                    <form onSubmit={handleSubmit} style={styles.form}>
                        <div style={rowStyle}>
                            <div style={styles.inputWrapper}>
                                <label style={{...styles.label, ...(focusedField === 'name' || formData.name ? styles.labelFocused : {})}}>
                                    Full name
                                </label>
                                <div style={{...styles.inputContainer, ...(focusedField === 'name' ? styles.inputContainerFocused : {})}}>
                                    <span style={styles.inputIcon}>
                                        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                                            <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/>
                                            <circle cx="12" cy="7" r="4"/>
                                        </svg>
                                    </span>
                                    <input
                                        type="text"
                                        name="name"
                                        placeholder="John Doe"
                                        value={formData.name}
                                        onChange={handleChange}
                                        onFocus={() => setFocusedField('name')}
                                        onBlur={() => setFocusedField(null)}
                                        required
                                        style={styles.input}
                                    />
                                </div>
                            </div>
                            
                            <div style={styles.inputWrapper}>
                                <label style={{...styles.label, ...(focusedField === 'student_id' || formData.student_id ? styles.labelFocused : {})}}>
                                    Student ID
                                </label>
                                <div style={{...styles.inputContainer, ...(focusedField === 'student_id' ? styles.inputContainerFocused : {})}}>
                                    <span style={styles.inputIcon}>
                                        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                                            <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"/>
                                            <polyline points="22,6 12,13 2,6"/>
                                        </svg>
                                    </span>
                                    <input
                                        type="text"
                                        name="student_id"
                                        placeholder="STU12345"
                                        value={formData.student_id}
                                        onChange={handleChange}
                                        onFocus={() => setFocusedField('student_id')}
                                        onBlur={() => setFocusedField(null)}
                                        required
                                        style={styles.input}
                                    />
                                </div>
                            </div>
                        </div>
                        
                        <div style={styles.inputWrapper}>
                            <label style={{...styles.label, ...(focusedField === 'email' || formData.email ? styles.labelFocused : {})}}>
                                Email address
                            </label>
                            <div style={{...styles.inputContainer, ...(focusedField === 'email' ? styles.inputContainerFocused : {})}}>
                                <span style={styles.inputIcon}>
                                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                                        <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"/>
                                        <polyline points="22,6 12,13 2,6"/>
                                    </svg>
                                </span>
                                <input
                                    type="email"
                                    name="email"
                                    placeholder="name@university.edu"
                                    value={formData.email}
                                    onChange={handleChange}
                                    onFocus={() => setFocusedField('email')}
                                    onBlur={() => setFocusedField(null)}
                                    required
                                    style={styles.input}
                                />
                            </div>
                        </div>
                        
                        <div style={rowStyle}>
                            <div style={styles.inputWrapper}>
                                <label style={{...styles.label, ...(focusedField === 'password' || formData.password ? styles.labelFocused : {})}}>
                                    Password
                                </label>
                                <div style={{...styles.inputContainer, ...(focusedField === 'password' ? styles.inputContainerFocused : {})}}>
                                    <span style={styles.inputIcon}>
                                        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                                            <rect x="3" y="11" width="18" height="11" rx="2" ry="2"/>
                                            <path d="M7 11V7a5 5 0 0 1 10 0v4"/>
                                        </svg>
                                    </span>
                                    <input
                                        type="password"
                                        name="password"
                                        placeholder="••••••••"
                                        value={formData.password}
                                        onChange={handleChange}
                                        onFocus={() => setFocusedField('password')}
                                        onBlur={() => setFocusedField(null)}
                                        required
                                        style={styles.input}
                                    />
                                </div>
                            </div>
                            
                            <div style={styles.inputWrapper}>
                                <label style={{...styles.label, ...(focusedField === 'confirm_password' || formData.confirm_password ? styles.labelFocused : {})}}>
                                    Confirm password
                                </label>
                                <div style={{...styles.inputContainer, ...(focusedField === 'confirm_password' ? styles.inputContainerFocused : {})}}>
                                    <span style={styles.inputIcon}>
                                        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                                            <rect x="3" y="11" width="18" height="11" rx="2" ry="2"/>
                                            <path d="M7 11V7a5 5 0 0 1 10 0v4"/>
                                        </svg>
                                    </span>
                                    <input
                                        type="password"
                                        name="confirm_password"
                                        placeholder="••••••••"
                                        value={formData.confirm_password}
                                        onChange={handleChange}
                                        onFocus={() => setFocusedField('confirm_password')}
                                        onBlur={() => setFocusedField(null)}
                                        required
                                        style={styles.input}
                                    />
                                </div>
                            </div>
                        </div>
                        
                        <button type="submit" disabled={loading} style={styles.submitButton}>
                            {loading ? (
                                <span style={styles.spinner}></span>
                            ) : (
                                'Create account'
                            )}
                        </button>
                    </form>
                    
                    <div style={styles.divider}>
                        <span style={styles.dividerLine}></span>
                        <span style={styles.dividerText}>or</span>
                        <span style={styles.dividerLine}></span>
                    </div>
                    
                    <p style={styles.loginPrompt}>
                        Already have an account?{' '}
                        <Link to="/login" style={styles.loginLink}>
                            Sign in
                            <span style={styles.loginArrow}>→</span>
                        </Link>
                    </p>
                </div>
            </div>
        </div>
    );
}

const styles = {
    background: {
        position: 'fixed',
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
        background: 'linear-gradient(135deg, #0f0c29 0%, #302b63 50%, #24243e 100%)',
    },
    gridPattern: {
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        backgroundImage: 'radial-gradient(rgba(255,255,255,0.1) 1px, transparent 1px)',
        backgroundSize: '50px 50px',
        opacity: 0.5,
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
        width: '400px',
        height: '400px',
        background: 'radial-gradient(circle, rgba(102,126,234,0.3) 0%, rgba(118,75,162,0) 70%)',
        borderRadius: '50%',
        animation: 'float1 25s ease-in-out infinite',
    },
    shape2: {
        position: 'absolute',
        bottom: '10%',
        right: '-5%',
        width: '500px',
        height: '500px',
        background: 'radial-gradient(circle, rgba(118,75,162,0.2) 0%, rgba(102,126,234,0) 70%)',
        borderRadius: '50%',
        animation: 'float2 30s ease-in-out infinite reverse',
    },
    shape3: {
        position: 'absolute',
        top: '40%',
        left: '20%',
        width: '200px',
        height: '200px',
        background: 'radial-gradient(circle, rgba(255,255,255,0.08) 0%, rgba(255,255,255,0) 70%)',
        borderRadius: '50%',
        animation: 'float3 18s ease-in-out infinite',
    },
    shape4: {
        position: 'absolute',
        bottom: '30%',
        right: '15%',
        width: '250px',
        height: '250px',
        background: 'radial-gradient(circle, rgba(102,126,234,0.15) 0%, rgba(118,75,162,0) 70%)',
        borderRadius: '50%',
        animation: 'float4 22s ease-in-out infinite reverse',
    },
    shape5: {
        position: 'absolute',
        top: '60%',
        left: '40%',
        width: '150px',
        height: '150px',
        background: 'radial-gradient(circle, rgba(255,255,255,0.05) 0%, rgba(255,255,255,0) 70%)',
        borderRadius: '50%',
        animation: 'float5 20s ease-in-out infinite',
    },
    brandLogo: {
        display: 'flex',
        alignItems: 'center',
        gap: '16px',
        marginBottom: '60px',
        flexWrap: 'wrap',
        justifyContent: 'center',
    },
    logoIcon: {
        width: '56px',
        height: '56px',
        background: 'rgba(255,255,255,0.15)',
        borderRadius: '16px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        backdropFilter: 'blur(10px)',
    },
    brandTitle: {
        fontSize: '32px',
        fontWeight: '700',
        color: 'white',
        margin: 0,
        letterSpacing: '-0.5px',
    },
    brandHighlight: {
        color: '#a855f7',
    },
    brandTagline: {
        fontSize: '14px',
        color: 'rgba(255,255,255,0.7)',
        margin: '5px 0 0 0',
    },
    quoteContainer: {
        background: 'rgba(255,255,255,0.05)',
        backdropFilter: 'blur(10px)',
        borderRadius: '24px',
        padding: '32px',
        marginBottom: '40px',
        border: '1px solid rgba(255,255,255,0.1)',
    },
    quoteWrapper: {
        position: 'relative',
    },
    quoteMark: {
        fontSize: '80px',
        fontFamily: 'Georgia, serif',
        color: 'rgba(255,255,255,0.2)',
        position: 'absolute',
        top: '-40px',
        left: '-10px',
    },
    quoteText: {
        fontSize: '22px',
        lineHeight: 1.4,
        color: 'white',
        marginBottom: '20px',
        fontWeight: '500',
        position: 'relative',
        zIndex: 1,
    },
    quoteAuthor: {
        fontSize: '14px',
        color: 'rgba(255,255,255,0.6)',
        letterSpacing: '0.5px',
    },
    featureList: {
        display: 'flex',
        flexDirection: 'column',
        gap: '12px',
    },
    featureItem: {
        display: 'flex',
        alignItems: 'center',
        gap: '12px',
        color: 'rgba(255,255,255,0.8)',
        fontSize: '14px',
    },
    featureIcon: {
        width: '22px',
        height: '22px',
        background: 'rgba(168,85,247,0.2)',
        borderRadius: '50%',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        color: '#a855f7',
        fontSize: '12px',
        fontWeight: 'bold',
    },
    formHeader: {
        marginBottom: '32px',
    },
    formTitle: {
        fontSize: '32px',
        fontWeight: '700',
        color: '#1a1a2e',
        marginBottom: '8px',
        letterSpacing: '-0.5px',
    },
    formSubtitle: {
        fontSize: '15px',
        color: '#666',
    },
    errorAlert: {
        background: '#fef2f2',
        border: '1px solid #fecaca',
        borderRadius: '12px',
        padding: '12px 16px',
        marginBottom: '24px',
        display: 'flex',
        alignItems: 'center',
        gap: '10px',
        color: '#dc2626',
        fontSize: '14px',
    },
    errorIcon: {
        fontSize: '16px',
    },
    form: {
        display: 'flex',
        flexDirection: 'column',
        gap: '20px',
    },
    inputWrapper: {
        display: 'flex',
        flexDirection: 'column',
        gap: '8px',
    },
    label: {
        fontSize: '13px',
        fontWeight: '600',
        color: '#374151',
        transition: 'color 0.2s ease',
    },
    labelFocused: {
        color: '#667eea',
    },
    inputContainer: {
        display: 'flex',
        alignItems: 'center',
        border: '2px solid #e5e7eb',
        borderRadius: '14px',
        transition: 'all 0.2s ease',
        background: 'white',
    },
    inputContainerFocused: {
        borderColor: '#667eea',
        boxShadow: '0 0 0 4px rgba(102,126,234,0.1)',
    },
    inputIcon: {
        padding: '0 12px',
        color: '#9ca3af',
        display: 'flex',
        alignItems: 'center',
    },
    input: {
        flex: 1,
        padding: '12px 16px 12px 0',
        border: 'none',
        outline: 'none',
        fontSize: '14px',
        fontFamily: 'inherit',
        background: 'transparent',
        color: '#1f2937',
    },
    submitButton: {
        padding: '14px 24px',
        background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
        color: 'white',
        border: 'none',
        borderRadius: '14px',
        fontSize: '16px',
        fontWeight: '600',
        cursor: 'pointer',
        transition: 'all 0.2s ease',
        marginTop: '8px',
    },
    spinner: {
        display: 'inline-block',
        width: '20px',
        height: '20px',
        border: '2px solid white',
        borderTop: '2px solid transparent',
        borderRadius: '50%',
        animation: 'spin 0.6s linear infinite',
    },
    divider: {
        display: 'flex',
        alignItems: 'center',
        gap: '16px',
        margin: '24px 0',
    },
    dividerLine: {
        flex: 1,
        height: '1px',
        background: '#e5e7eb',
    },
    dividerText: {
        fontSize: '13px',
        color: '#9ca3af',
    },
    loginPrompt: {
        textAlign: 'center',
        fontSize: '14px',
        color: '#6b7280',
    },
    loginLink: {
        color: '#667eea',
        textDecoration: 'none',
        fontWeight: '600',
        display: 'inline-flex',
        alignItems: 'center',
        gap: '4px',
    },
    loginArrow: {
        transition: 'transform 0.2s ease',
    },
};

// Add CSS animations
const styleSheet = document.createElement("style");
styleSheet.textContent = `
    @keyframes float1 {
        0%, 100% { transform: translate(0, 0) scale(1); }
        50% { transform: translate(-30px, -30px) scale(1.05); }
    }
    @keyframes float2 {
        0%, 100% { transform: translate(0, 0) scale(1); }
        50% { transform: translate(30px, 20px) scale(1.1); }
    }
    @keyframes float3 {
        0%, 100% { transform: translate(0, 0); }
        50% { transform: translate(-20px, 30px); }
    }
    @keyframes float4 {
        0%, 100% { transform: translate(0, 0); }
        50% { transform: translate(25px, -20px); }
    }
    @keyframes float5 {
        0%, 100% { transform: translate(0, 0); }
        50% { transform: translate(-15px, -25px); }
    }
    @keyframes fadeInLeft {
        from {
            opacity: 0;
            transform: translateX(-30px);
        }
        to {
            opacity: 1;
            transform: translateX(0);
        }
    }
    @keyframes fadeInRight {
        from {
            opacity: 0;
            transform: translateX(30px);
        }
        to {
            opacity: 1;
            transform: translateX(0);
        }
    }
    @keyframes spin {
        to { transform: rotate(360deg); }
    }
    .submitButton:hover {
        transform: translateY(-2px);
        box-shadow: 0 10px 25px rgba(102,126,234,0.3);
    }
    .loginLink:hover span {
        transform: translateX(4px);
    }
    
    @media (max-width: 768px) {
        body {
            overflow-x: hidden;
        }
        input, button {
            font-size: 16px !important;
        }
    }
`;
document.head.appendChild(styleSheet);

export default Register;  