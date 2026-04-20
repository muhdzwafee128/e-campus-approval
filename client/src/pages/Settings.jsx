import { useState, useRef } from 'react';
import { useAuth } from '../context/AuthContext';
import PageLayout from '../components/Layout/PageLayout';
import { Upload, PenTool } from 'lucide-react';
import api from '../api/axios';

const DEPTS = ['CS1', 'CS2', 'IT', 'ECE', 'EEE', 'MECH', 'CIVIL', 'ECS'];
const CLUBS = ['IEDC', 'IEEE', 'TinkerHub', 'MuLearn', 'NSS', 'NCC', 'Other'];
const CATEGORIES = ['TFW', 'Merit', 'Management', 'NRI', 'Non-KEAM'];
const ADMISSION_TYPES = ['Regular', 'Lateral Entry', 'Spot'];

export default function Settings() {
    const { user, login } = useAuth();
    
    // Profile Edit State
    const [editMode, setEditMode] = useState(false);
    const [profileSaving, setProfileSaving] = useState(false);
    const [profileMsg, setProfileMsg] = useState('');
    const [form, setForm] = useState(getInitialForm());

    function getInitialForm() {
        return {
            name: user?.name || '',
            admissionNo: user?.admissionNo || '',
            staffId: user?.staffId || '',
            department: user?.department || '',
            yearOfStudy: user?.yearOfStudy || '',
            yearOfAdmission: user?.yearOfAdmission || '',
            category: user?.category || '',
            typeOfAdmission: user?.typeOfAdmission || '',
            dateOfBirth: user?.dateOfBirth ? new Date(user.dateOfBirth).toISOString().split('T')[0] : '',
            parentName: user?.parentName || '',
            isHostler: user?.isHostler || false,
            hostelName: user?.hostelName || '',
            assignedClubs: user?.assignedClubs || [],
            assignedYear: user?.assignedYear || ''
        };
    }

    // Signature State
    const [sigMode, setSigMode] = useState('upload');
    const [sigFile, setSigFile] = useState(null);
    const [sigPreview, setSigPreview] = useState(user?.signatureUrl || '');
    const [drawing, setDrawing] = useState(false);
    const canvasRef = useRef(null);
    const [saving, setSaving] = useState(false);
    const [msg, setMsg] = useState('');

    const isAuthority = user?.role !== 'student';
    
    const setF = (k, v) => setForm(p => ({ ...p, [k]: v }));

    const handleProfileSubmit = async (e) => {
        e.preventDefault();
        setProfileSaving(true);
        setProfileMsg('');
        try {
            const endpoint = isAuthority ? '/auth/staff/profile' : '/auth/student/profile';
            const payload = { ...form };
            if (!payload.isHostler) payload.hostelName = '';
            
            const res = await api.patch(endpoint, payload);
            login(localStorage.getItem('token'), res.data.user);
            setEditMode(false);
            setProfileMsg('Profile updated successfully!');
        } catch (err) {
            setProfileMsg(err.response?.data?.message || 'Profile update failed');
        } finally {
            setProfileSaving(false);
        }
    };

    const handleCancelEdit = () => {
        setForm(getInitialForm());
        setEditMode(false);
        setProfileMsg('');
    };

    const toggleClub = (club) => {
        setForm(p => ({
            ...p,
            assignedClubs: p.assignedClubs.includes(club)
                ? p.assignedClubs.filter(c => c !== club)
                : [...p.assignedClubs, club]
        }));
    };

    // Canvas Logic
    const startDraw = (e) => {
        setDrawing(true);
        const canvas = canvasRef.current;
        const ctx = canvas.getContext('2d');
        const rect = canvas.getBoundingClientRect();
        ctx.beginPath();
        ctx.moveTo(e.clientX - rect.left, e.clientY - rect.top);
    };
    const draw = (e) => {
        if (!drawing) return;
        const canvas = canvasRef.current;
        const ctx = canvas.getContext('2d');
        const rect = canvas.getBoundingClientRect();
        ctx.lineWidth = 2; ctx.lineCap = 'round'; ctx.strokeStyle = '#000';
        ctx.lineTo(e.clientX - rect.left, e.clientY - rect.top);
        ctx.stroke();
    };
    const clearCanvas = () => {
        const canvas = canvasRef.current;
        const ctx = canvas.getContext('2d');
        ctx.fillStyle = 'white'; ctx.fillRect(0, 0, canvas.width, canvas.height);
        setSigFile(null); setSigPreview('');
    };
    const saveCanvas = () => {
        const canvas = canvasRef.current;
        canvas.toBlob((blob) => {
            if (!blob) return;
            const file = new File([blob], 'signature-drawn.png', { type: 'image/png' });
            setSigFile(file);
            setSigPreview(URL.createObjectURL(blob));
        }, 'image/png');
    };

    const handleSigSave = async () => {
        if (!sigFile) { setMsg('Please upload or draw a signature first.'); return; }
        setSaving(true); setMsg('');
        try {
            const fd = new FormData();
            fd.append('signature', sigFile);
            const res = await api.put('/auth/profile', fd);
            const updatedUser = res.data.user;
            login(localStorage.getItem('token'), updatedUser);
            setSigPreview(updatedUser.signatureUrl || sigPreview);
            setSigFile(null);
            setMsg('Signature updated successfully!');
        } catch (err) {
            setMsg(err.response?.data?.message || 'Save failed');
        } finally {
            setSaving(false);
        }
    };

    return (
        <PageLayout>
            <div className="page-title">Settings</div>
            <div className="page-subtitle">Manage your account preferences</div>

            <div className="card" style={{ maxWidth: 660 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
                    <div style={{ fontWeight: 600, fontSize: 15 }}>Profile Information</div>
                    {!editMode && (
                        <button className="btn btn-secondary" style={{ padding: '6px 12px', fontSize: 12 }} onClick={() => { setForm(getInitialForm()); setEditMode(true); }}>
                            Edit Profile
                        </button>
                    )}
                </div>

                {profileMsg && !editMode && (
                    <div style={{ marginBottom: 16, fontSize: 13, color: profileMsg.includes('failed') ? '#EF4444' : '#10B981' }}>{profileMsg}</div>
                )}

                {editMode ? (
                    <form onSubmit={handleProfileSubmit}>
                        {profileMsg && (
                            <div style={{ marginBottom: 16, padding: '10px 14px', borderRadius: 8, fontSize: 13, background: '#FEE2E2', color: '#991B1B' }}>
                                {profileMsg}
                            </div>
                        )}
                        <div className="form-grid-2">
                            <div className="form-group">
                                <label className="form-label required">Full Name</label>
                                <input className="form-input" value={form.name} onChange={e => setF('name', e.target.value)} required />
                            </div>
                            <div className="form-group">
                                <label className="form-label">Role</label>
                                <input className="form-input" value={user?.role} disabled style={{ background: '#F8FAFC', color: 'var(--text-secondary)' }} />
                            </div>

                            {/* Staff specific fields */}
                            {isAuthority && (
                                <>
                                    <div className="form-group">
                                        <label className="form-label required">Staff ID</label>
                                        <input className="form-input" value={form.staffId} onChange={e => setF('staffId', e.target.value)} required />
                                    </div>
                                    {['tutor', 'hod'].includes(user?.role) && (
                                        <div className="form-group">
                                            <label className="form-label required">Department</label>
                                            <select className="form-select" value={form.department} onChange={e => setF('department', e.target.value)} required>
                                                <option value="">Select Department</option>
                                                {DEPTS.map(d => <option key={d} value={d}>{d}</option>)}
                                            </select>
                                        </div>
                                    )}
                                    {user?.role === 'tutor' && (
                                        <div className="form-group">
                                            <label className="form-label required">Assigned Year</label>
                                            <select className="form-select" value={form.assignedYear} onChange={e => setF('assignedYear', e.target.value)} required>
                                                <option value="">Select Year</option>
                                                {[1, 2, 3, 4].map(y => <option key={y} value={y}>{y}{y === 1 ? 'st' : y === 2 ? 'nd' : y === 3 ? 'rd' : 'th'} Year</option>)}
                                            </select>
                                        </div>
                                    )}
                                </>
                            )}
                            {user?.role === 'faculty_coordinator' && (
                                <div className="form-group" style={{ gridColumn: '1 / -1' }}>
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

                            {/* Student specific fields */}
                            {!isAuthority && (
                                <>
                                    <div className="form-group">
                                        <label className="form-label required">Admission Number</label>
                                        <input className="form-input" value={form.admissionNo} onChange={e => setF('admissionNo', e.target.value)} required />
                                    </div>
                                    <div className="form-group">
                                        <label className="form-label required">Branch / Department</label>
                                        <select className="form-select" value={form.department} onChange={e => setF('department', e.target.value)} required>
                                            <option value="">Select Branch</option>
                                            {DEPTS.map(d => <option key={d} value={d}>{d}</option>)}
                                        </select>
                                    </div>
                                    <div className="form-group">
                                        <label className="form-label required">Year of Study</label>
                                        <select className="form-select" value={form.yearOfStudy} onChange={e => setF('yearOfStudy', parseInt(e.target.value))} required>
                                            <option value="">Select Year</option>
                                            {[1, 2, 3, 4].map(y => <option key={y} value={y}>{y}{y === 1 ? 'st' : y === 2 ? 'nd' : y === 3 ? 'rd' : 'th'} Year</option>)}
                                        </select>
                                    </div>
                                    <div className="form-group">
                                        <label className="form-label required">Year of Admission</label>
                                        <input className="form-input" type="number" min="2000" max="2100" value={form.yearOfAdmission} onChange={e => setF('yearOfAdmission', e.target.value)} required />
                                    </div>
                                    <div className="form-group">
                                        <label className="form-label required">Category</label>
                                        <select className="form-select" value={form.category} onChange={e => setF('category', e.target.value)} required>
                                            <option value="">Select Category</option>
                                            {CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
                                        </select>
                                    </div>
                                    <div className="form-group">
                                        <label className="form-label required">Type of Admission</label>
                                        <select className="form-select" value={form.typeOfAdmission} onChange={e => setF('typeOfAdmission', e.target.value)} required>
                                            <option value="">Select Admission Type</option>
                                            {ADMISSION_TYPES.map(t => <option key={t} value={t}>{t}</option>)}
                                        </select>
                                    </div>
                                    <div className="form-group">
                                        <label className="form-label required">Date of Birth</label>
                                        <input className="form-input" type="date" value={form.dateOfBirth} onChange={e => setF('dateOfBirth', e.target.value)} required />
                                    </div>
                                    <div className="form-group">
                                        <label className="form-label required">Father's / Mother's Name</label>
                                        <input className="form-input" value={form.parentName} onChange={e => setF('parentName', e.target.value)} required />
                                    </div>
                                    <div className="form-group" style={{ display: 'flex', alignItems: 'center', height: '100%' }}>
                                        <label style={{ display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer', fontSize: 13 }}>
                                            <input type="checkbox" checked={form.isHostler} onChange={e => setF('isHostler', e.target.checked)} />
                                            Are you a hostler?
                                        </label>
                                    </div>
                                    {form.isHostler && (
                                        <div className="form-group" style={{ gridColumn: '1 / -1' }}>
                                            <label className="form-label required">Hostel Name</label>
                                            <input className="form-input" value={form.hostelName} onChange={e => setF('hostelName', e.target.value)} required />
                                        </div>
                                    )}
                                </>
                            )}
                        </div>
                        <div style={{ display: 'flex', gap: 12, marginTop: 16 }}>
                            <button type="button" className="btn btn-secondary" onClick={handleCancelEdit} disabled={profileSaving}>
                                Cancel
                            </button>
                            <button type="submit" className="btn btn-primary" disabled={profileSaving}>
                                {profileSaving ? 'Saving…' : 'Save Changes'}
                            </button>
                        </div>
                    </form>
                ) : (
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px 24px', marginBottom: 24 }}>
                        {/* Render all user properties identically organized to the registration array requirements */}
                        {[
                            ['Name', user?.name],
                            ['Email', user?.email],
                            ['Role', user?.role],
                            isAuthority 
                                ? ['Department', ['principal', 'faculty_coordinator'].includes(user?.role) ? null : user?.department]
                                : ['Department', user?.department || '—'],
                            !isAuthority && ['Admission No', user?.admissionNo],
                            isAuthority && ['Staff ID', user?.staffId],
                            !isAuthority && user?.yearOfStudy && ['Year of Study', `${user.yearOfStudy}${user.yearOfStudy === 1 ? 'st' : user.yearOfStudy === 2 ? 'nd' : user.yearOfStudy === 3 ? 'rd' : 'th'} Year`],
                            isAuthority && user?.role === 'tutor' && user?.assignedYear && ['Assigned Year', `${user.assignedYear}${user.assignedYear === 1 ? 'st' : user.assignedYear === 2 ? 'nd' : user.assignedYear === 3 ? 'rd' : 'th'} Year`],
                            !isAuthority && ['Year of Admission', user?.yearOfAdmission],
                            !isAuthority && ['Category', user?.category],
                            !isAuthority && ['Type of Admission', user?.typeOfAdmission],
                            !isAuthority && ['Date of Birth', user?.dateOfBirth ? new Date(user.dateOfBirth).toLocaleDateString('en-IN') : '—'],
                            !isAuthority && ["Father's / Mother's Name", user?.parentName],
                            !isAuthority && ['Whether Hostler', user?.isHostler ? 'Yes' : 'No'],
                        ].filter(Boolean).map(([k, v]) => {
                            if (v === null) return null;
                            return (
                                <div key={k} style={{ paddingBottom: 8 }}>
                                    <div style={{ fontSize: 11, color: 'var(--text-secondary)', fontWeight: 500, textTransform: 'uppercase' }}>{k}</div>
                                    <div style={{ fontSize: 13, marginTop: 2 }}>{v || '—'}</div>
                                </div>
                            );
                        })}
                        {/* Full width items */}
                        {isAuthority && user?.role === 'faculty_coordinator' && (
                           <div style={{ gridColumn: '1 / -1', paddingBottom: 8 }}>
                                <div style={{ fontSize: 11, color: 'var(--text-secondary)', fontWeight: 500, textTransform: 'uppercase' }}>Assigned Clubs</div>
                                <div style={{ fontSize: 13, marginTop: 2 }}>{user?.assignedClubs?.length ? user.assignedClubs.join(', ') : '—'}</div>
                            </div>
                        )}
                        {!isAuthority && user?.isHostler && (
                            <div style={{ gridColumn: '1 / -1', paddingBottom: 8 }}>
                                <div style={{ fontSize: 11, color: 'var(--text-secondary)', fontWeight: 500, textTransform: 'uppercase' }}>Hostel Name</div>
                                <div style={{ fontSize: 13, marginTop: 2 }}>{user?.hostelName || '—'}</div>
                            </div>
                        )}
                    </div>
                )}

                {isAuthority && (
                    <>
                        <div style={{ fontWeight: 600, fontSize: 15, marginBottom: 12, borderTop: '1px solid var(--border)', paddingTop: 20 }}>
                            Update Signature
                        </div>
                        <div style={{ display: 'flex', gap: 0, marginBottom: 12, borderRadius: 8, overflow: 'hidden', border: '1px solid var(--border)' }}>
                            {['upload', 'draw'].map(m => (
                                <button key={m} type="button" onClick={() => setSigMode(m)}
                                    style={{
                                        flex: 1, padding: '8px 12px', background: sigMode === m ? 'var(--navy)' : 'white',
                                        color: sigMode === m ? 'white' : 'var(--text-secondary)', border: 'none', cursor: 'pointer', fontSize: 13,
                                        fontWeight: 500, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6
                                    }}>
                                    {m === 'upload' ? <><Upload size={14} />Upload</> : <><PenTool size={14} />Draw</>}
                                </button>
                            ))}
                        </div>
                        {sigMode === 'upload' ? (
                            <input type="file" accept="image/png,image/jpeg"
                                onChange={e => { setSigFile(e.target.files[0]); setSigPreview(URL.createObjectURL(e.target.files[0])); }}
                                style={{ fontSize: 13 }} />
                        ) : (
                            <>
                                <canvas ref={canvasRef} width={400} height={120}
                                    style={{ border: '1px solid var(--border)', borderRadius: 8, cursor: 'crosshair', display: 'block' }}
                                    onMouseDown={startDraw} onMouseMove={draw} onMouseUp={() => setDrawing(false)} onMouseLeave={() => setDrawing(false)} />
                                <div style={{ display: 'flex', gap: 8, marginTop: 8 }}>
                                    <button type="button" className="btn btn-secondary" style={{ fontSize: 13, padding: '6px 12px' }} onClick={clearCanvas}>Clear</button>
                                    <button type="button" className="btn btn-primary" style={{ fontSize: 13, padding: '6px 12px' }} onClick={saveCanvas}>Save</button>
                                </div>
                            </>
                        )}
                        {sigPreview && (
                            <div style={{ marginTop: 12, border: '1px solid var(--border)', borderRadius: 8, padding: 12, display: 'inline-block' }}>
                                <div style={{ fontSize: 12, color: 'var(--text-secondary)', marginBottom: 6 }}>Current Signature:</div>
                                <img src={sigPreview} alt="Signature" style={{ maxHeight: 60 }} />
                            </div>
                        )}
                        {msg && <div style={{ marginTop: 12, fontSize: 13, color: msg.includes('failed') ? '#EF4444' : '#10B981' }}>{msg}</div>}
                        <button className="btn btn-primary" style={{ marginTop: 16 }} onClick={handleSigSave} disabled={saving}>
                            {saving ? 'Saving…' : 'Save Signature'}
                        </button>
                    </>
                )}
            </div>
        </PageLayout>
    );
}
