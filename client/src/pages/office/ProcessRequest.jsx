import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import PageLayout from '../../components/Layout/PageLayout';
import ApprovalTrail from '../../components/ApprovalTrail';
import { ChevronLeft, Download, Printer } from 'lucide-react';
import api from '../../api/axios';

const TYPE_LABELS = {
    general_certificate: 'General Purpose Certificate',
    borrow_certificate: 'Borrowing Original Certificates',
    season_ticket: 'Season Ticket / Railway Concession',
    fee_structure: 'Fee Structure for Educational Loan',
};

const ROLE_LABELS = {
    tutor: 'Group Tutor',
    faculty_coordinator: 'Faculty In-charge',
    hod: 'Head of Department',
    principal: 'Principal',
};

function InfoRow({ label, value }) {
    return (
        <div style={{ paddingBottom: 10, borderBottom: '1px solid var(--border)' }}>
            <div style={{ fontSize: 11, color: 'var(--text-secondary)', fontWeight: 500, textTransform: 'uppercase' }}>{label}</div>
            <div style={{ fontSize: 13, marginTop: 2 }}>{value || '—'}</div>
        </div>
    );
}

function OfficeBadge({ status }) {
    const map = {
        awaiting_office: { label: 'Ready to process', color: '#F59E0B', bg: '#FEF3C7' },
        ready_to_collect: { label: 'In progress', color: '#3B82F6', bg: '#DBEAFE' },
        completed: { label: 'Delivered', color: '#10B981', bg: '#D1FAE5' },
    };
    const s = map[status] || { label: status, color: '#64748B', bg: '#F1F5F9' };
    return <span style={{ background: s.bg, color: s.color, padding: '3px 10px', borderRadius: 999, fontSize: 11, fontWeight: 600 }}>{s.label}</span>;
}

export default function ProcessRequest() {
    const { id } = useParams();
    const navigate = useNavigate();
    const { user } = useAuth();

    const [data, setData] = useState(null);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [msg, setMsg] = useState('');

    const [form, setForm] = useState({
        officePreparedBy: '',
        officeScrutinyBy: '',
        officeRemarks: '',
        isHandedOver: false,
        isReturnedByStudent: false,
    });

    useEffect(() => {
        api.get(`/office/request/${id}`)
            .then(res => {
                setData(res.data);
                const r = res.data.request;
                setForm(prev => ({
                    ...prev,
                    officePreparedBy: r.officePreparedBy || user?.name || '',
                    officeScrutinyBy: r.officeScrutinyBy || '',
                    officeRemarks: r.officeRemarks || '',
                    isHandedOver: r.isHandedOver || false,
                    isReturnedByStudent: r.isReturnedByStudent || false,
                }));
            })
            .finally(() => setLoading(false));
    }, [id]);

    const setF = (k, v) => setForm(p => ({ ...p, [k]: v }));

    const handleSave = async (markComplete = false) => {
        setSaving(true); setMsg('');
        try {
            const payload = { ...form };
            if (!markComplete) {
                // Save draft without completing
                payload.isHandedOver = false;
            }
            const res = await api.post(`/office/process/${id}`, payload);
            setData(prev => ({ ...prev, request: res.data.request }));
            setMsg(markComplete ? 'Marked as complete. Student has been notified.' : 'Draft saved.');
        } catch (err) {
            setMsg(err.response?.data?.message || 'Save failed');
        } finally {
            setSaving(false);
        }
    };

    const handleReturn = async () => {
        setSaving(true); setMsg('');
        try {
            const res = await api.post(`/office/return/${id}`);
            setData(prev => ({ ...prev, request: res.data.request }));
            setMsg('Marked as returned and closed.');
        } catch (err) {
            setMsg(err.response?.data?.message || 'Failed');
        } finally {
            setSaving(false);
        }
    };

    if (loading) return <PageLayout><div className="spinner" /></PageLayout>;
    if (!data) return <PageLayout><div>Request not found</div></PageLayout>;

    const { request, steps } = data;
    const isBorrow = request.type === 'borrow_certificate';
    const canComplete = form.isHandedOver;
    const isCompleted = request.status === 'completed';

    return (
        <PageLayout>
            {/* Header */}
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 20 }}>
                <button className="btn btn-ghost" style={{ padding: '4px 8px', fontSize: 13 }} onClick={() => navigate('/office/dashboard')}>
                    <ChevronLeft size={14} /> Back to Queue
                </button>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20 }}>
                <div>
                    <div className="page-title">{TYPE_LABELS[request.type]}</div>
                    <div style={{ fontSize: 12, fontFamily: 'var(--font-mono)', color: 'var(--text-secondary)', marginTop: 4 }}>{request.requestId}</div>
                </div>
                <OfficeBadge status={request.status} />
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 380px', gap: 20 }}>

                {/* LEFT PANE — Read-only info */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                    {/* Student Info */}
                    <div className="card">
                        <div style={{ fontWeight: 600, fontSize: 14, marginBottom: 14 }}>Student Information</div>
                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px 24px' }}>
                            <InfoRow label="Student Name" value={request.studentId?.name} />
                            <InfoRow label="Admission No" value={request.studentId?.admissionNo} />
                            <InfoRow label="Branch" value={request.studentId?.department} />
                            <InfoRow label="Year" value={request.studentId?.yearOfStudy ? `Year ${request.studentId.yearOfStudy}` : '—'} />
                            <InfoRow label="Category" value={request.studentId?.category} />
                            {request.formData?.certificateType && <InfoRow label="Certificate Type" value={request.formData.certificateType} />}
                            {request.formData?.purpose && <InfoRow label="Purpose" value={request.formData.purpose} />}
                            {isBorrow && request.formData?.certificates && (
                                <InfoRow label="Certificates Needed" value={request.formData.certificates?.join(', ')} />
                            )}
                            {isBorrow && <InfoRow label="Expected Return Date" value={request.formData?.returnDate ? new Date(request.formData.returnDate).toLocaleDateString('en-IN') : '—'} />}
                        </div>
                    </div>

                    {/* Approval Chain */}
                    <div className="card">
                        <div style={{ fontWeight: 600, fontSize: 14, marginBottom: 14 }}>Approval Chain</div>
                        <ApprovalTrail
                            chain={request.approvalChain}
                            steps={steps}
                            currentStep={request.approvalChain.length}
                            status={request.status}
                        />
                    </div>

                    {/* Document actions */}
                    <div style={{ display: 'flex', gap: 10 }}>
                        {request.approvalLetterUrl ? (
                            <a href={request.approvalLetterUrl} target="_blank" rel="noreferrer" className="btn btn-secondary">
                                <Download size={14} /> View PDF
                            </a>
                        ) : (
                            <button className="btn btn-secondary" disabled>PDF generating…</button>
                        )}
                    </div>
                </div>

                {/* RIGHT PANE — For Office Use Only */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                    <div className="card">
                        <div style={{ fontWeight: 600, fontSize: 14, marginBottom: 4 }}>For Office Use Only</div>
                        <div style={{ fontSize: 12, color: 'var(--text-secondary)', marginBottom: 16 }}>
                            Fields below will be recorded on the request record.
                        </div>

                        <div className="form-group">
                            <label className="form-label">Prepared By</label>
                            <input className="form-input" value={form.officePreparedBy}
                                readOnly
                                style={{ background: '#F8FAFC', color: 'var(--text-secondary)' }} />
                        </div>
                        <div className="form-group">
                            <label className="form-label">Scrutiny By (Optional)</label>
                            <input className="form-input" value={form.officeScrutinyBy}
                                onChange={e => setF('officeScrutinyBy', e.target.value)}
                                placeholder="Name of scrutinising officer" disabled={isCompleted} />
                        </div>
                        <div className="form-group">
                            <label className="form-label">Remarks (Optional)</label>
                            <textarea className="form-textarea" rows={3} value={form.officeRemarks}
                                onChange={e => setF('officeRemarks', e.target.value)}
                                placeholder="Any internal notes" disabled={isCompleted} />
                        </div>

                        {!isCompleted && (
                            <button className="btn btn-secondary" style={{ width: '100%', marginBottom: 20 }}
                                onClick={() => handleSave(false)} disabled={saving}>
                                Save Draft
                            </button>
                        )}

                        {/* Student Handover */}
                        <div style={{ borderTop: '1px solid var(--border)', paddingTop: 16, marginBottom: 12 }}>
                            <div style={{ fontWeight: 600, fontSize: 13, marginBottom: 12 }}>Student Handover</div>
                            <label style={{ display: 'flex', alignItems: 'flex-start', gap: 10, cursor: isCompleted ? 'default' : 'pointer' }}>
                                <input type="checkbox" checked={form.isHandedOver}
                                    onChange={e => setF('isHandedOver', e.target.checked)}
                                    disabled={isCompleted}
                                    style={{ marginTop: 2, cursor: isCompleted ? 'default' : 'pointer' }} />
                                <div>
                                    <div style={{ fontSize: 13, fontWeight: 500 }}>Student has received the certificate / document</div>
                                    <div style={{ fontSize: 12, color: 'var(--text-secondary)', marginTop: 3 }}>
                                        Checking this marks the request as fully closed and updates the student's dashboard to "Ready to collect".
                                    </div>
                                </div>
                            </label>
                        </div>

                        {/* Borrow certificate: return tracking */}
                        {isBorrow && form.isHandedOver && (
                            <div style={{ background: '#FFF7ED', border: '1px solid #FED7AA', borderRadius: 8, padding: 12, marginBottom: 12 }}>
                                <div style={{ fontSize: 12, fontWeight: 600, color: '#9A3412', marginBottom: 8 }}>
                                    Original Certificate Return
                                </div>
                                <div style={{ fontSize: 12, color: '#7C2D12', marginBottom: 10 }}>
                                    Expected return date: <strong>{request.formData?.returnDate ? new Date(request.formData.returnDate).toLocaleDateString('en-IN') : '—'}</strong>
                                </div>
                                {!isCompleted && (
                                    <label style={{ display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer', fontSize: 13 }}>
                                        <input type="checkbox" checked={form.isReturnedByStudent}
                                            onChange={e => setF('isReturnedByStudent', e.target.checked)} />
                                        Original certificate returned by student
                                    </label>
                                )}
                                {isCompleted && request.isReturnedByStudent && (
                                    <div style={{ fontSize: 12, color: '#10B981', fontWeight: 600 }}>✓ Returned & Closed</div>
                                )}
                            </div>
                        )}

                        {msg && (
                            <div style={{ fontSize: 13, marginBottom: 12, color: msg.includes('failed') || msg.includes('Failed') ? '#EF4444' : '#10B981' }}>
                                {msg}
                            </div>
                        )}

                        {!isCompleted && (
                            <button className="btn btn-primary" style={{ width: '100%' }}
                                onClick={() => handleSave(true)}
                                disabled={!canComplete || saving}>
                                {saving ? 'Saving…' : 'Mark as Complete'}
                            </button>
                        )}

                        {isCompleted && !request.isReturnedByStudent && isBorrow && (
                            <button className="btn btn-primary" style={{ width: '100%' }}
                                onClick={handleReturn} disabled={saving}>
                                {saving ? 'Saving…' : 'Mark Certificate as Returned'}
                            </button>
                        )}

                        {isCompleted && (!isBorrow || request.isReturnedByStudent) && (
                            <div style={{ textAlign: 'center', fontSize: 13, color: '#10B981', fontWeight: 600, padding: '12px 0' }}>
                                ✓ Request fully completed
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </PageLayout>
    );
}
