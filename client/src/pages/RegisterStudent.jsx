import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import api from '../api/axios';

const DEPTS = ['CS1', 'CS2', 'IT', 'ECE', 'EEE', 'MECH', 'CIVIL', 'ECS'];
const CATEGORIES = ['Merit', 'TFW', 'Management', 'NRI', 'Non-KEAM'];
const ADMISSIONS = ['Regular', 'Lateral Entry', 'Spot'];

export default function RegisterStudent() {
    const [form, setForm] = useState({
        name: '', email: '', password: '', confirmPassword: '',
        admissionNo: '', department: '', yearOfStudy: '1',
        yearOfAdmission: new Date().getFullYear(),
        category: 'Merit', typeOfAdmission: 'Regular',
        dateOfBirth: '', parentName: '', isHostler: false, hostelName: '',
    });
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);
    const { login } = useAuth();
    const navigate = useNavigate();

    const set = (k, v) => setForm(p => ({ ...p, [k]: v }));

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');
        if (form.password !== form.confirmPassword) {
            setError('Passwords do not match');
            return;
        }
        setLoading(true);
        try {
            const res = await api.post('/auth/register/student', form);
            login(res.data.token, res.data.user);
            navigate('/dashboard');
        } catch (err) {
            setError(err.response?.data?.message || 'Registration failed');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="auth-page" style={{ alignItems: 'flex-start', paddingTop: 40 }}>
            <div className="auth-card" style={{ maxWidth: 600 }}>
                <div className="auth-title">Student Registration</div>
                <div className="auth-subtitle">Create your E-Approval System account</div>
                {error && <div style={{ background: '#FEE2E2', color: '#991B1B', padding: '10px 14px', borderRadius: 8, fontSize: 13, marginBottom: 16 }}>{error}</div>}
                <form onSubmit={handleSubmit}>
                    <div className="form-grid-2">
                        <div className="form-group">
                            <label className="form-label required">Full Name</label>
                            <input className="form-input" value={form.name} onChange={e => set('name', e.target.value)} required />
                        </div>
                        <div className="form-group">
                            <label className="form-label required">Admission Number</label>
                            <input className="form-input" value={form.admissionNo} onChange={e => set('admissionNo', e.target.value)} required />
                        </div>
                        <div className="form-group">
                            <label className="form-label required">Branch / Department</label>
                            <select className="form-select" value={form.department} onChange={e => set('department', e.target.value)} required>
                                <option value="">Select</option>
                                {DEPTS.map(d => <option key={d}>{d}</option>)}
                            </select>
                        </div>
                        <div className="form-group">
                            <label className="form-label required">Year of Study</label>
                            <select className="form-select" value={form.yearOfStudy} onChange={e => set('yearOfStudy', e.target.value)}>
                                {[1, 2, 3, 4].map(y => <option key={y} value={y}>{y}{y === 1 ? 'st' : y === 2 ? 'nd' : y === 3 ? 'rd' : 'th'} Year</option>)}
                            </select>
                        </div>
                        <div className="form-group">
                            <label className="form-label required">Year of Admission</label>
                            <input className="form-input" type="number" min="2015" max="2030" value={form.yearOfAdmission} onChange={e => set('yearOfAdmission', e.target.value)} required />
                        </div>
                        <div className="form-group">
                            <label className="form-label required">Category</label>
                            <select className="form-select" value={form.category} onChange={e => set('category', e.target.value)}>
                                {CATEGORIES.map(c => <option key={c}>{c}</option>)}
                            </select>
                        </div>
                        <div className="form-group">
                            <label className="form-label required">Type of Admission</label>
                            <select className="form-select" value={form.typeOfAdmission} onChange={e => set('typeOfAdmission', e.target.value)}>
                                {ADMISSIONS.map(a => <option key={a}>{a}</option>)}
                            </select>
                        </div>
                        <div className="form-group">
                            <label className="form-label required">Date of Birth</label>
                            <input className="form-input" type="date" value={form.dateOfBirth} onChange={e => set('dateOfBirth', e.target.value)} required />
                        </div>
                        <div className="form-group">
                            <label className="form-label required">Father's / Mother's Name</label>
                            <input className="form-input" value={form.parentName} onChange={e => set('parentName', e.target.value)} required />
                        </div>
                        <div className="form-group" style={{ display: 'flex', alignItems: 'center', gap: 8, paddingTop: 24 }}>
                            <input type="checkbox" id="hostler" checked={form.isHostler} onChange={e => set('isHostler', e.target.checked)} />
                            <label htmlFor="hostler" style={{ fontSize: 14 }}>Whether Hostler</label>
                        </div>
                    </div>
                    {form.isHostler && (
                        <div className="form-group">
                            <label className="form-label required">Hostel Name</label>
                            <input className="form-input" value={form.hostelName} onChange={e => set('hostelName', e.target.value)} />
                        </div>
                    )}
                    <div className="form-group">
                        <label className="form-label required">Email Address</label>
                        <input className="form-input" type="email" value={form.email} onChange={e => set('email', e.target.value)} required />
                    </div>
                    <div className="form-grid-2">
                        <div className="form-group">
                            <label className="form-label required">Password</label>
                            <input className="form-input" type="password" value={form.password} onChange={e => set('password', e.target.value)} minLength={8} required />
                        </div>
                        <div className="form-group">
                            <label className="form-label required">Confirm Password</label>
                            <input className="form-input" type="password" value={form.confirmPassword} onChange={e => set('confirmPassword', e.target.value)} required />
                        </div>
                    </div>
                    <button className="btn btn-primary" type="submit" disabled={loading} style={{ width: '100%', marginTop: 8 }}>
                        {loading ? 'Creating Account…' : 'Create Account'}
                    </button>
                </form>
                <div style={{ marginTop: 16, textAlign: 'center', fontSize: 13, color: 'var(--text-secondary)' }}>
                    Already have an account? <Link to="/login" style={{ color: 'var(--navy)', fontWeight: 500 }}>Sign in</Link>
                </div>
            </div>
        </div>
    );
}
