import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { FileText } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import api from '../api/axios';

export default function Login() {
    const [form, setForm] = useState({ email: '', password: '' });
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);
    const { login } = useAuth();
    const navigate = useNavigate();

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');
        setLoading(true);
        try {
            const res = await api.post('/auth/login', form);
            login(res.data.token, res.data.user);
            if (res.data.user.role === 'student') navigate('/dashboard');
            else navigate('/authority/dashboard');
        } catch (err) {
            setError(err.response?.data?.message || 'Login failed');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="auth-page">
            <div className="auth-card">
                <div className="auth-logo">
                    <div className="auth-logo-icon">
                        <FileText size={20} />
                    </div>
                    <div>
                        <div style={{ fontWeight: 700, fontSize: 15 }}>E-Campus Approval</div>
                        <div style={{ fontSize: 12, color: 'var(--text-secondary)' }}>College of Engineering, Thalassery</div>
                    </div>
                </div>

                <div className="auth-title">Welcome back</div>
                <div className="auth-subtitle">Sign in to your account to continue</div>

                <form onSubmit={handleSubmit}>
                    {error && (
                        <div style={{
                            background: '#FEE2E2', color: '#991B1B', padding: '10px 14px',
                            borderRadius: 8, fontSize: 13, marginBottom: 16
                        }}>{error}</div>
                    )}

                    <div className="form-group">
                        <label className="form-label required">Email Address</label>
                        <input
                            className="form-input"
                            type="email"
                            value={form.email}
                            onChange={e => setForm(p => ({ ...p, email: e.target.value }))}
                            placeholder="your@email.com"
                            required
                        />
                    </div>

                    <div className="form-group">
                        <label className="form-label required">Password</label>
                        <input
                            className="form-input"
                            type="password"
                            value={form.password}
                            onChange={e => setForm(p => ({ ...p, password: e.target.value }))}
                            placeholder="••••••••"
                            required
                        />
                    </div>

                    <button className="btn btn-primary" type="submit" disabled={loading} style={{ width: '100%', marginTop: 8 }}>
                        {loading ? 'Signing in…' : 'Sign In'}
                    </button>
                </form>

                <div style={{ marginTop: 20, textAlign: 'center', fontSize: 13, color: 'var(--text-secondary)' }}>
                    Don't have an account?{' '}
                    <Link to="/register" style={{ color: 'var(--navy)', fontWeight: 500 }}>Register as Student</Link>
                    {' · '}
                    <Link to="/register/authority" style={{ color: 'var(--navy)', fontWeight: 500 }}>Register as Staff</Link>
                </div>
            </div>
        </div>
    );
}
