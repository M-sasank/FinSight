import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
// You might want to create a specific CSS file for login/register pages
// import './AuthPage.css'; 

function LoginPage() {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);
    const { login } = useAuth();
    const navigate = useNavigate();

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');
        setLoading(true);
        try {
            await login(email, password);
            navigate('/'); // Redirect to home or dashboard after login
        } catch (err) {
            setError(err.message || 'Failed to login. Please check your credentials.');
        }
        setLoading(false);
    };

    return (
        <div className="auth-page-container"> {/* Use a consistent container class */}
            <div className="auth-form-card"> {/* Card styling */}
                <h2>Login</h2>
                <form onSubmit={handleSubmit}>
                    <div className="form-group">
                        <label htmlFor="email">Email</label>
                        <input 
                            type="email" 
                            id="email" 
                            value={email} 
                            onChange={(e) => setEmail(e.target.value)} 
                            required 
                        />
                    </div>
                    <div className="form-group">
                        <label htmlFor="password">Password</label>
                        <input 
                            type="password" 
                            id="password" 
                            value={password} 
                            onChange={(e) => setPassword(e.target.value)} 
                            required 
                        />
                    </div>
                    {error && <p className="error-message">{error}</p>}
                    <button type="submit" className="auth-button primary" disabled={loading}>
                        {loading ? 'Logging in...' : 'Login'}
                    </button>
                </form>
                <p className="switch-auth-link">
                    Don't have an account? <Link to="/register">Register here</Link>
                </p>
            </div>
        </div>
    );
}

export default LoginPage; 