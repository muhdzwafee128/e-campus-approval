import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import PageLayout from '../../components/Layout/PageLayout';
import ApprovalTrail from '../../components/ApprovalTrail';
import { ChevronLeft, Download, CheckCircle, AlertCircle } from 'lucide-react';
import api from '../../api/axios';

const TYPE_LABELS = {
    general_certificate: 'General Purpose Certificate',
    borrow_certificate: 'Borrowing Original Certificates',
    season_ticket: 'Season Ticket / Railway Concession',
    fee_structure: 'Fee Structure for Educational Loan',
};

function InfoRow({ label, value }) {
    return (
        <div style={{ paddingBottom: 10, borderBottom: '1px solid var(--border)' }}>
            <div style={{ fontSize: 11, color: 'var(--text-secondary)', fontWeight: 500, textTransform: 'uppercase', letterSpacing: '0.4px' }}>{label}</div>
            <div style={{ fontSize: 13, marginTop: 2 }}>{value || '—'}</div>
        </div>
    );
}

function StatusPill({ status }) {
    const map = {
        awaiting_office:    { label: 'Ready to process',     bg: '#FEF3C7', color: '#92400E' },
        ready_to_collect:   { label: 'Processed — Pending Collection', bg: '#DBEAFE', color: '#1D4ED8' },
        completed:          { label: 'Collected by student', bg: '#D1FAE5', color: '#065F46' },
        returned_and_closed:{ label: 'Returned & Closed',    bg: '#D1FAE5', color: '#065F46' },
    };
    const s = map[status] || { label: status, bg: '#F1F5F9', color: '#64748B' };
    return <span style={{ background: s.bg, color: s.color, padding: '4px 12px', borderRadius: 999, fontSize: 11, fontWeight: 600 }}>{s.label}</span>;
}

function InfoBanner({ color, bg, border, icon: Icon, text }) {
    return (
        <div style={{ background: bg, border: `1px solid ${border}`, borderRadius: 8, padding: '12px 14px', display: 'flex', gap: 10, alignItems: 'flex-start', marginBottom: 16 }}>
            <Icon size={16} color={color} style={{ marginTop: 1, flexShrink: 0 }} />
            <div style={{ fontSize: 13, color, fontWeight: 500 }}>{text}</div>
        </div>
    );
}

function fmt(d) {
    if (!d) return '—';
    return new Date(d).toLocaleString('en-IN', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit', hour12: true });
}
function fmtDate(d) {
    if (!d) return '—';
    return new Date(d).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' });
}

export default function ProcessRequest() {
    const { id } = useParams();
    const navigate = useNavigate();
    const { user } = useAuth();

    const [data, setData] = useState(null);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [msg, setMsg] = useState(null); // { text, type: 'success'|'error' }

    // Phase 1 form fields
    const [form, setForm] = useState({
        officePreparedBy: '',
        officeScrutinyBy: '',
        officeRemarks: '',
    });

    // Phase 2 checkboxes
    const [handoverChecked, setHandoverChecked] = useState(false);
    const [returnChecked, setReturnChecked] = useState(false);

    const refresh = () =>
        api.get(`/office/request/${id}`).then(res => {
            setData(res.data);
            const r = res.data.request;
            setForm({
                officePreparedBy: r.officePreparedBy || user?.name || '',
                officeScrutinyBy: r.officeScrutinyBy || '',
                officeRemarks: r.officeRemarks || '',
            });
        }).finally(() => setLoading(false));

    useEffect(() => { refresh(); }, [id]);

    const setF = (k, v) => setForm(p => ({ ...p, [k]: v }));

    // ─── ACTIONS ───────────────────────────────────────────────────────────────

    const handleSaveDraft = async () => {
        setSaving(true); setMsg(null);
        try {
            await api.post(`/office/save-draft/${id}`, form);
            setMsg({ text: 'Draft saved successfully.', type: 'success' });
        } catch (err) {
            setMsg({ text: err.response?.data?.message || 'Save failed.', type: 'error' });
        } finally {
            setSaving(false);
        }
    };

    const handleMarkComplete = async () => {
        setSaving(true); setMsg(null);
        try {
            const res = await api.post(`/office/mark-complete/${id}`, form);
            setData(prev => ({ ...prev, request: res.data.request }));
            setMsg({ text: 'Processing complete. Student has been notified to collect. PDF is being updated.', type: 'success' });
        } catch (err) {
            setMsg({ text: err.response?.data?.message || 'Failed.', type: 'error' });
        } finally {
            setSaving(false);
        }
    };

    const handleHandover = async () => {
        setSaving(true); setMsg(null);
        try {
            const res = await api.post(`/office/handover/${id}`);
            setData(prev => ({ ...prev, request: res.data.request }));
            setHandoverChecked(false);
            setMsg({ text: 'Student handover confirmed. Request marked as complete.', type: 'success' });
        } catch (err) {
            setMsg({ text: err.response?.data?.message || 'Failed.', type: 'error' });
        } finally {
            setSaving(false);
        }
    };

    const handleReturn = async () => {
        setSaving(true); setMsg(null);
        try {
            const res = await api.post(`/office/return/${id}`);
            setData(prev => ({ ...prev, request: res.data.request }));
            setReturnChecked(false);
            setMsg({ text: 'Original certificate marked as returned. Request fully closed.', type: 'success' });
        } catch (err) {
            setMsg({ text: err.response?.data?.message || 'Failed.', type: 'error' });
        } finally {
            setSaving(false);
        }
    };

    // ─── LOADING / NOT FOUND ───────────────────────────────────────────────────

    if (loading) return <PageLayout><div className="spinner" style={{ margin: '60px auto' }} /></PageLayout>;
    if (!data) return <PageLayout><div>Request not found</div></PageLayout>;

    const { request, steps } = data;
    const isBorrow = request.type === 'borrow_certificate';
    const status = request.status;

    // Determine current phase state
    const isPhase1Editable   = status === 'awaiting_office';
    const isPhase1ReadOnly   = ['ready_to_collect', 'completed', 'returned_and_closed'].includes(status);
    const showPhase2         = ['ready_to_collect', 'completed', 'returned_and_closed'].includes(status);
    const isPhase2Handover   = status === 'ready_to_collect';
    const showBorrowReturn   = isBorrow && status === 'completed';
    const isFullyClosed      = status === 'completed' && !isBorrow || status === 'returned_and_closed';

    return (
        <PageLayout>
            {/* Back + header */}
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 20 }}>
                <button className="btn btn-ghost" style={{ padding: '4px 8px', fontSize: 13, display: 'flex', alignItems: 'center', gap: 4 }}
                    onClick={() => navigate('/office/dashboard')}>
                    <ChevronLeft size={14} /> Back to Queue
                </button>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20 }}>
                <div>
                    <div className="page-title">{TYPE_LABELS[request.type]}</div>
                    <div style={{ fontSize: 12, fontFamily: 'var(--font-mono)', color: 'var(--text-secondary)', marginTop: 4 }}>{request.requestId}</div>
                </div>
                <StatusPill status={status} />
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 380px', gap: 20, alignItems: 'start' }}>

                {/* ─── LEFT PANE — read-only request info ──────────────────────── */}
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
                            {isBorrow && (
                                <InfoRow label="Expected Return Date" value={fmtDate(request.formData?.returnDate)} />
                            )}
                        </div>
                    </div>

                    {/* Approval Chain */}
                    <div className="card">
                        <div style={{ fontWeight: 600, fontSize: 14, marginBottom: 14 }}>Approval Chain</div>
                        <ApprovalTrail
                            chain={request.approvalChain}
                            steps={steps}
                            currentStep={request.approvalChain.length}
                            status={status}
                        />
                    </div>

                    {/* View PDF */}
                    <div style={{ display: 'flex', gap: 10 }}>
                        {request.approvalLetterUrl ? (
                            <a href={request.approvalLetterUrl} target="_blank" rel="noreferrer" className="btn btn-secondary"
                                style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}>
                                <Download size={14} /> View PDF
                            </a>
                        ) : (
                            <button className="btn btn-secondary" disabled>PDF generating…</button>
                        )}
                    </div>
                </div>

                {/* ─── RIGHT PANE — office action panel ────────────────────────── */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>

                    {/* Feedback message */}
                    {msg && (
                        <div style={{
                            padding: '10px 14px', borderRadius: 8, fontSize: 13, fontWeight: 500,
                            background: msg.type === 'success' ? '#D1FAE5' : '#FEE2E2',
                            color: msg.type === 'success' ? '#065F46' : '#991B1B',
                            border: `1px solid ${msg.type === 'success' ? '#6EE7B7' : '#FCA5A5'}`,
                        }}>
                            {msg.text}
                        </div>
                    )}

                    {/* ── PHASE 1 — For Office Use Only ── */}
                    <div className="card">
                        <div style={{ fontWeight: 600, fontSize: 14, marginBottom: 4 }}>For Office Use Only</div>
                        <div style={{ fontSize: 12, color: 'var(--text-secondary)', marginBottom: 16 }}>
                            Fields below will be recorded on the request record and printed in the PDF.
                        </div>

                        <div className="form-group">
                            <label className="form-label">Prepared By</label>
                            <input className="form-input" value={form.officePreparedBy}
                                readOnly
                                style={{ background: '#F8FAFC', color: 'var(--text-secondary)' }} />
                        </div>

                        <div className="form-group">
                            <label className="form-label">Scrutiny By <span style={{ color: 'var(--text-secondary)', fontWeight: 400 }}>(Optional)</span></label>
                            <input className="form-input" value={form.officeScrutinyBy}
                                onChange={e => setF('officeScrutinyBy', e.target.value)}
                                placeholder="Name of scrutinising officer"
                                disabled={isPhase1ReadOnly}
                                style={isPhase1ReadOnly ? { background: '#F8FAFC', color: 'var(--text-secondary)' } : {}} />
                        </div>

                        <div className="form-group">
                            <label className="form-label">Remarks <span style={{ color: 'var(--text-secondary)', fontWeight: 400 }}>(Optional)</span></label>
                            <textarea className="form-textarea" rows={3} value={form.officeRemarks}
                                onChange={e => setF('officeRemarks', e.target.value)}
                                placeholder="Any internal notes"
                                disabled={isPhase1ReadOnly}
                                style={isPhase1ReadOnly ? { background: '#F8FAFC', color: 'var(--text-secondary)', resize: 'none' } : {}} />
                        </div>

                        {isPhase1Editable && (
                            <>
                                <button className="btn btn-secondary" style={{ width: '100%', marginBottom: 10 }}
                                    onClick={handleSaveDraft} disabled={saving}>
                                    Save Draft
                                </button>
                                <button className="btn btn-primary" style={{ width: '100%' }}
                                    onClick={handleMarkComplete} disabled={saving}>
                                    {saving ? 'Processing…' : 'Mark as Complete'}
                                </button>
                            </>
                        )}

                        {isPhase1ReadOnly && (
                            <InfoBanner
                                bg="#D1FAE5" border="#6EE7B7" color="#065F46" icon={CheckCircle}
                                text={`Processing complete on ${fmt(request.officeProcessedAt)}. Student notified to collect.`}
                            />
                        )}
                    </div>

                    {/* ── PHASE 2 — Student Handover ── */}
                    {showPhase2 && (
                        <div className="card">
                            <div style={{ fontWeight: 600, fontSize: 14, marginBottom: 4 }}>Student Handover</div>
                            <div style={{ fontSize: 12, color: 'var(--text-secondary)', marginBottom: 16 }}>
                                Mark when the student physically collects the document from the office.
                            </div>

                            {isPhase2Handover ? (
                                <>
                                    <label style={{ display: 'flex', alignItems: 'flex-start', gap: 10, cursor: 'pointer', marginBottom: 16 }}>
                                        <input type="checkbox" checked={handoverChecked}
                                            onChange={e => setHandoverChecked(e.target.checked)}
                                            style={{ marginTop: 2 }} />
                                        <div>
                                            <div style={{ fontSize: 13, fontWeight: 500 }}>Student has received the certificate / document</div>
                                            <div style={{ fontSize: 12, color: 'var(--text-secondary)', marginTop: 3 }}>
                                                This updates the student's dashboard to "Complete" and enables the Download Letter button.
                                            </div>
                                        </div>
                                    </label>
                                    <button className="btn btn-primary" style={{ width: '100%' }}
                                        onClick={handleHandover}
                                        disabled={!handoverChecked || saving}>
                                        {saving ? 'Saving…' : 'Student Received'}
                                    </button>
                                </>
                            ) : (
                                <InfoBanner
                                    bg="#D1FAE5" border="#6EE7B7" color="#065F46" icon={CheckCircle}
                                    text={`Collected by student on ${fmt(request.handedOverAt)}.`}
                                />
                            )}
                        </div>
                    )}

                    {/* ── PHASE 2b — Borrow Certificate Return (shown after student collected) ── */}
                    {isBorrow && showPhase2 && status !== 'ready_to_collect' && (
                        <div className="card">
                            <div style={{ fontWeight: 600, fontSize: 14, marginBottom: 4 }}>Original Certificate Return</div>
                            <div style={{ fontSize: 12, color: 'var(--text-secondary)', marginBottom: 14 }}>
                                Expected return date: <strong>{fmtDate(request.returnDueDate || request.formData?.returnDate)}</strong>
                            </div>

                            {status === 'completed' ? (
                                <>
                                    {new Date(request.returnDueDate || request.formData?.returnDate) < new Date() && (
                                        <InfoBanner
                                            bg="#FEF3C7" border="#FCD34D" color="#92400E" icon={AlertCircle}
                                            text="Return date has passed. Waiting for student to return the originals."
                                        />
                                    )}
                                    <label style={{ display: 'flex', alignItems: 'flex-start', gap: 10, cursor: 'pointer', marginBottom: 16 }}>
                                        <input type="checkbox" checked={returnChecked}
                                            onChange={e => setReturnChecked(e.target.checked)}
                                            style={{ marginTop: 2 }} />
                                        <div>
                                            <div style={{ fontSize: 13, fontWeight: 500 }}>Original certificate returned by student</div>
                                            <div style={{ fontSize: 12, color: 'var(--text-secondary)', marginTop: 3 }}>
                                                This closes the request permanently.
                                            </div>
                                        </div>
                                    </label>
                                    <button className="btn btn-primary" style={{ width: '100%' }}
                                        onClick={handleReturn}
                                        disabled={!returnChecked || saving}>
                                        {saving ? 'Saving…' : 'Mark as Returned'}
                                    </button>
                                </>
                            ) : (
                                <InfoBanner
                                    bg="#D1FAE5" border="#6EE7B7" color="#065F46" icon={CheckCircle}
                                    text={`Original certificate returned on ${fmt(request.returnedAt)}. Request fully closed.`}
                                />
                            )}
                        </div>
                    )}

                    {/* Fully closed banner (non-borrow) */}
                    {!isBorrow && status === 'completed' && (
                        <InfoBanner
                            bg="#D1FAE5" border="#6EE7B7" color="#065F46" icon={CheckCircle}
                            text="Request fully closed."
                        />
                    )}
                </div>
            </div>
        </PageLayout>
    );
}
