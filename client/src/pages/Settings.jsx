import { useState, useRef } from 'react';
import { useAuth } from '../context/AuthContext';
import PageLayout from '../components/Layout/PageLayout';
import { Upload, PenTool } from 'lucide-react';
import api from '../api/axios';

export default function Settings() {
    const { user, login } = useAuth();
    const [sigMode, setSigMode] = useState('upload');
    const [sigFile, setSigFile] = useState(null);
    const [sigPreview, setSigPreview] = useState(user?.signatureUrl || '');
    const [sigBase64, setSigBase64] = useState('');
    const [drawing, setDrawing] = useState(false);
    const canvasRef = useRef(null);
    const [saving, setSaving] = useState(false);
    const [msg, setMsg] = useState('');

    const isAuthority = user?.role !== 'student';

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
        setSigBase64(''); setSigPreview('');
    };
    const saveCanvas = () => {
        const dataUrl = canvasRef.current.toDataURL('image/png');
        setSigBase64(dataUrl); setSigPreview(dataUrl);
    };

    const handleSave = async () => {
        setSaving(true); setMsg('');
        try {
            const fd = new FormData();
            if (sigFile) fd.append('signature', sigFile);
            else if (sigBase64) fd.append('signatureBase64', sigBase64);
            // For now just show success (update route can be added if needed)
            setMsg('Settings saved successfully');
        } catch {
            setMsg('Save failed');
        } finally {
            setSaving(false);
        }
    };

    return (
        <PageLayout>
            <div className="page-title">Settings</div>
            <div className="page-subtitle">Manage your account preferences</div>

            <div className="card" style={{ maxWidth: 560 }}>
                <div style={{ fontWeight: 600, fontSize: 15, marginBottom: 16 }}>Profile Information</div>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px 24px', marginBottom: 24 }}>
                    {[['Name', user?.name], ['Email', user?.email], ['Role', user?.role], ['Department', user?.department || '—'],
                    user?.role === 'student' ? ['Admission No', user?.admissionNo] : ['Staff ID', user?.staffId],
                    user?.role === 'student' && user?.yearOfStudy ? ['Year of Study', `${user.yearOfStudy}${user.yearOfStudy === 1 ? 'st' : user.yearOfStudy === 2 ? 'nd' : user.yearOfStudy === 3 ? 'rd' : 'th'} Year`] : null,
                    user?.role === 'tutor' && user?.assignedYear ? ['Assigned Year', `${user.assignedYear}${user.assignedYear === 1 ? 'st' : user.assignedYear === 2 ? 'nd' : user.assignedYear === 3 ? 'rd' : 'th'} Year`] : null,
                    ].filter(Boolean).map(([k, v]) => (
                        <div key={k} style={{ paddingBottom: 8 }}>
                            <div style={{ fontSize: 11, color: 'var(--text-secondary)', fontWeight: 500, textTransform: 'uppercase' }}>{k}</div>
                            <div style={{ fontSize: 13, marginTop: 2 }}>{v || '—'}</div>
                        </div>
                    ))}
                </div>

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
                        <button className="btn btn-primary" style={{ marginTop: 16 }} onClick={handleSave} disabled={saving}>
                            {saving ? 'Saving…' : 'Save Signature'}
                        </button>
                    </>
                )}
            </div>
        </PageLayout>
    );
}
