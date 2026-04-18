import { useState, useRef, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import api from '../api/axios';
import { Upload, PenTool } from 'lucide-react';

const ROLES = ['tutor', 'nodal_officer', 'faculty_coordinator', 'hod', 'principal'];
const ROLE_LABELS = { tutor: 'Class Tutor', nodal_officer: 'Nodal Officer', faculty_coordinator: 'Faculty Coordinator', hod: 'HOD', principal: 'Principal' };
const DEPTS = ['CS1', 'CS2', 'IT', 'ECE', 'EEE', 'MECH', 'CIVIL', 'ECS'];
const CLUBS = ['IEEE', 'TinkerHub', 'MuLearn', 'NSS', 'NCC', 'Other'];

export default function RegisterAuthority() {
    const [form, setForm] = useState({ name: '', email: '', password: '', confirmPassword: '', role: '', department: '', staffId: '', assignedClubs: [], assignedYear: '' });
    const [sigMode, setSigMode] = useState('upload'); // 'upload' | 'draw'
    const [sigFile, setSigFile] = useState(null);
    const [sigPreview, setSigPreview] = useState('');
    const [drawing, setDrawing] = useState(false);
    const canvasRef = useRef(null);
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);
    const { login } = useAuth();
    const navigate = useNavigate();

    const set = (k, v) => setForm(p => ({ ...p, [k]: v }));

    const handleFileChange = (e) => {
        const f = e.target.files[0];
        if (f) {
            setSigFile(f);
            setSigPreview(URL.createObjectURL(f));
        }
    };

    // Canvas drawing
    useEffect(() => {
        if (sigMode !== 'draw' || !canvasRef.current) return;
        const canvas = canvasRef.current;
        const ctx = canvas.getContext('2d');
        ctx.fillStyle = 'white';
        ctx.fillRect(0, 0, canvas.width, canvas.height);
    }, [sigMode]);

    const startDraw = (e) => {
        setDrawing(true);
        const canvas = canvasRef.current;
        const ctx = canvas.getContext('2d');
        const rect = canvas.getBoundingClientRect();
        const x = (e.clientX || e.touches?.[0]?.clientX) - rect.left;
        const y = (e.clientY || e.touches?.[0]?.clientY) - rect.top;
        ctx.beginPath();
        ctx.moveTo(x, y);
    };
    const draw = (e) => {
        if (!drawing) return;
        const canvas = canvasRef.current;
        const ctx = canvas.getContext('2d');
        const rect = canvas.getBoundingClientRect();
        const x = (e.clientX || e.touches?.[0]?.clientX) - rect.left;
        const y = (e.clientY || e.touches?.[0]?.clientY) - rect.top;
        ctx.lineWidth = 2;
        ctx.lineCap = 'round';
        ctx.strokeStyle = '#000';
        ctx.lineTo(x, y);
        ctx.stroke();
    };
    const endDraw = () => setDrawing(false);

    const clearCanvas = () => {
        const canvas = canvasRef.current;
        const ctx = canvas.getContext('2d');
        ctx.fillStyle = 'white';
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        setSigFile(null);
        setSigPreview('');
    };

    const saveSignature = () => {
        const canvas = canvasRef.current;
        // Convert canvas to a Blob, then wrap in a File so Cloudinary middleware processes it
        canvas.toBlob((blob) => {
            if (!blob) return;
            const file = new File([blob], 'signature-drawn.png', { type: 'image/png' });
            setSigFile(file);
            setSigPreview(URL.createObjectURL(blob));
        }, 'image/png');
    };

    const toggleClub = (club) => {
        setForm(p => ({
            ...p,
            assignedClubs: p.assignedClubs.includes(club)
                ? p.assignedClubs.filter(c => c !== club)
                : [...p.assignedClubs, club]
        }));
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');
        if (form.password !== form.confirmPassword) { setError('Passwords do not match'); return; }
        if (!sigFile) { setError('Signature image is required for authority registration'); return; }

        const fd = new FormData();
        Object.entries(form).forEach(([k, v]) => {
            if (k === 'assignedClubs') fd.append(k, JSON.stringify(v));
            else fd.append(k, v);
        });
        fd.append('signature', sigFile); // Always a File object (uploaded or canvas-drawn)

        setLoading(true);
        try {
            const res = await api.post('/auth/register/authority', fd);
            login(res.data.token, res.data.user);
            navigate('/authority/dashboard');
        } catch (err) {
            setError(err.response?.data?.message || 'Registration failed');
        } finally {
            setLoading(false);
        }
    };

    const needsDept = ['tutor', 'hod'].includes(form.role);
    const isCoord = form.role === 'faculty_coordinator';
    const isTutor = form.role === 'tutor';

    return (
        <div className="auth-page" style={{ alignItems: 'flex-start', paddingTop: 40 }}>
            <div className="auth-card" style={{ maxWidth: 600 }}>
                <div className="auth-title">Staff Registration</div>
                <div className="auth-subtitle">Create your authority account</div>
                {error && <div style={{ background: '#FEE2E2', color: '#991B1B', padding: '10px 14px', borderRadius: 8, fontSize: 13, marginBottom: 16 }}>{error}</div>}
                <form onSubmit={handleSubmit}>
                    <div className="form-grid-2">
                        <div className="form-group">
                            <label className="form-label required">Full Name</label>
                            <input className="form-input" value={form.name} onChange={e => set('name', e.target.value)} required />
                        </div>
                        <div className="form-group">
                            <label className="form-label required">Staff ID</label>
                            <input className="form-input" value={form.staffId} onChange={e => set('staffId', e.target.value)} required />
                        </div>
                        <div className="form-group">
                            <label className="form-label required">Role</label>
                            <select className="form-select" value={form.role} onChange={e => set('role', e.target.value)} required>
                                <option value="">Select role</option>
                                {ROLES.map(r => <option key={r} value={r}>{ROLE_LABELS[r]}</option>)}
                            </select>
                        </div>
                        {needsDept && (
                            <div className="form-group">
                                <label className="form-label required">Department</label>
                                <select className="form-select" value={form.department} onChange={e => set('department', e.target.value)} required>
                                    <option value="">Select</option>
                                    {DEPTS.map(d => <option key={d}>{d}</option>)}
                                </select>
                            </div>
                        )}
                        {isTutor && (
                            <div className="form-group">
                                <label className="form-label required">Assigned Year</label>
                                <select className="form-select" value={form.assignedYear} onChange={e => set('assignedYear', e.target.value)} required>
                                    <option value="">Select Year</option>
                                    {[1, 2, 3, 4].map(y => <option key={y} value={y}>{y}{y === 1 ? 'st' : y === 2 ? 'nd' : y === 3 ? 'rd' : 'th'} Year</option>)}
                                </select>
                            </div>
                        )}
                    </div>

                    {isCoord && (
                        <div className="form-group">
                            <label className="form-label required">Assigned Clubs / Communities</label>
                            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, marginTop: 4 }}>
                                {CLUBS.map(c => (
                                    <label key={c} style={{ display: 'flex', alignItems: 'center', gap: 6, cursor: 'pointer', fontSize: 13 }}>
                                        <input type="checkbox" checked={form.assignedClubs.includes(c)} onChange={() => toggleClub(c)} />
                                        {c}
                                    </label>
                                ))}
                            </div>
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

                    {/* Signature section */}
                    <div className="form-group">
                        <label className="form-label required">Signature</label>
                        <div style={{ display: 'flex', gap: 0, marginBottom: 12, borderRadius: 8, overflow: 'hidden', border: '1px solid var(--border)' }}>
                            {['upload', 'draw'].map(m => (
                                <button key={m} type="button" onClick={() => setSigMode(m)}
                                    style={{
                                        flex: 1, padding: '8px 12px', background: sigMode === m ? 'var(--navy)' : 'white',
                                        color: sigMode === m ? 'white' : 'var(--text-secondary)', border: 'none', cursor: 'pointer', fontSize: 13, fontWeight: 500, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6
                                    }}>
                                    {m === 'upload' ? <><Upload size={14} />Upload</> : <><PenTool size={14} />Draw</>}
                                </button>
                            ))}
                        </div>

                        {sigMode === 'upload' ? (
                            <div>
                                <input type="file" accept="image/png,image/jpeg" onChange={handleFileChange} style={{ fontSize: 13 }} />
                                <div className="form-helper">PNG or JPG, max 2MB</div>
                            </div>
                        ) : (
                            <div>
                                <canvas ref={canvasRef} width={400} height={120}
                                    style={{ border: '1px solid var(--border)', borderRadius: 8, cursor: 'crosshair', touchAction: 'none', display: 'block' }}
                                    onMouseDown={startDraw} onMouseMove={draw} onMouseUp={endDraw} onMouseLeave={endDraw}
                                    onTouchStart={startDraw} onTouchMove={draw} onTouchEnd={endDraw}
                                />
                                <div style={{ display: 'flex', gap: 8, marginTop: 8 }}>
                                    <button type="button" className="btn btn-secondary" style={{ padding: '6px 14px', fontSize: 13 }} onClick={clearCanvas}>Clear</button>
                                    <button type="button" className="btn btn-primary" style={{ padding: '6px 14px', fontSize: 13 }} onClick={saveSignature}>Save Signature</button>
                                </div>
                            </div>
                        )}

                        {sigPreview && (
                            <div style={{ marginTop: 12, border: '1px solid var(--border)', borderRadius: 8, padding: 12, display: 'inline-block' }}>
                                <div style={{ fontSize: 12, color: 'var(--text-secondary)', marginBottom: 6 }}>Preview:</div>
                                <img src={sigPreview} alt="Signature preview" style={{ maxHeight: 60, maxWidth: 250 }} />
                            </div>
                        )}
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
