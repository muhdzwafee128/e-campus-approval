import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import PageLayout from '../../components/Layout/PageLayout';
import ApprovalTrail from '../../components/ApprovalTrail';
import { ChevronRight, Paperclip } from 'lucide-react';
import api from '../../api/axios';

const TYPE_LABELS = {
    duty_leave_upload: 'Duty Leave — File Upload',
    duty_leave_event: 'Duty Leave — Event',
    scholarship: 'Scholarship Recommendation',
    event_conduct: 'Event Conduct Permission',
    general_certificate: 'General Purpose Certificate',
    borrow_certificate: 'Borrowing Original Certificates',
    season_ticket: 'Season Ticket / Railway Concession',
    fee_structure: 'Fee Structure for Educational Loan',
};

export default function ReviewRequest() {
    const { id } = useParams();
    const navigate = useNavigate();
    const [data, setData] = useState(null);
    const [loading, setLoading] = useState(true);
    const [action, setAction] = useState('');
    const [comment, setComment] = useState('');
    const [submitting, setSubmitting] = useState(false);
    const [error, setError] = useState('');

    useEffect(() => {
        api.get(`/requests/${id}`)
            .then(res => setData(res.data))
            .finally(() => setLoading(false));
    }, [id]);

    const handleAction = async (act) => {
        if (act === 'rejected' && !comment.trim()) {
            setError('Rejection reason is required');
            return;
        }
        setError('');
        setSubmitting(true);
        try {
            await api.post(`/approvals/${id}`, { action: act, comment });
            navigate('/authority/dashboard');
        } catch (err) {
            // 403 means the approval already went through (e.g. PDF was generating)
            // — navigate away instead of showing a confusing "not assigned" error
            if (err.response?.status === 403) {
                navigate('/authority/dashboard');
                return;
            }
            setError(err.response?.data?.message || 'Action failed');
            setSubmitting(false);
        }
    };


    if (loading) return <PageLayout><div className="spinner" /></PageLayout>;
    if (!data) return <PageLayout><div>Request not found</div></PageLayout>;

    const { request, steps } = data;
    const student = request.studentId;

    return (
        <PageLayout>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
                <button className="btn btn-ghost" style={{ padding: '4px 8px', fontSize: 13 }} onClick={() => navigate('/authority/dashboard')}>
                    Dashboard
                </button>
                <ChevronRight size={14} color="var(--text-secondary)" />
                <span style={{ fontSize: 13, color: 'var(--text-secondary)' }}>Review Request</span>
            </div>

            <div className="page-title" style={{ marginBottom: 4 }}>{TYPE_LABELS[request.type]}</div>
            <div className="page-subtitle">{request.requestId}</div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 300px', gap: 20 }}>
                <div>
                    {/* Student Info Card */}
                    <div className="card" style={{ marginBottom: 16 }}>
                        <div style={{ fontWeight: 600, fontSize: 14, marginBottom: 12 }}>Student Information</div>
                        <div className="form-grid-2" style={{ gap: '8px 24px' }}>
                            <div><div style={{ fontSize: 11, color: 'var(--text-secondary)', fontWeight: 500, textTransform: 'uppercase' }}>Name</div><div style={{ fontSize: 13 }}>{student?.name}</div></div>
                            <div><div style={{ fontSize: 11, color: 'var(--text-secondary)', fontWeight: 500, textTransform: 'uppercase' }}>Admission No</div><div style={{ fontSize: 13, fontFamily: 'var(--font-mono)' }}>{student?.admissionNo}</div></div>
                            <div><div style={{ fontSize: 11, color: 'var(--text-secondary)', fontWeight: 500, textTransform: 'uppercase' }}>Branch</div><div style={{ fontSize: 13 }}>{student?.department}</div></div>
                            <div><div style={{ fontSize: 11, color: 'var(--text-secondary)', fontWeight: 500, textTransform: 'uppercase' }}>Year of Study</div><div style={{ fontSize: 13 }}>{student?.yearOfStudy ? `${student.yearOfStudy}${student.yearOfStudy === 1 ? 'st' : student.yearOfStudy === 2 ? 'nd' : student.yearOfStudy === 3 ? 'rd' : 'th'} Year` : '—'}</div></div>
                        </div>
                    </div>

                    {/* Request Data Card */}
                    <div className="card" style={{ marginBottom: 16 }}>
                        <div style={{ fontWeight: 600, fontSize: 14, marginBottom: 12 }}>Request Details</div>
                        <div className="form-grid-2" style={{ gap: '8px 24px' }}>
                            {Object.entries(request.formData || {}).map(([k, v]) => {
                                if (!v || k === 'studentName') return null;
                                const label = k.replace(/([A-Z])/g, ' $1').replace(/^./, s => s.toUpperCase());
                                const val = Array.isArray(v) ? v.join(', ') : (typeof v === 'boolean' ? (v ? 'Yes' : 'No') : String(v));
                                return (
                                    <div key={k} style={{ paddingBottom: 8, borderBottom: '1px solid var(--border)' }}>
                                        <div style={{ fontSize: 11, color: 'var(--text-secondary)', fontWeight: 500, textTransform: 'uppercase' }}>{label}</div>
                                        <div style={{ fontSize: 13, marginTop: 2 }}>{val}</div>
                                    </div>
                                );
                            })}
                        </div>
                        {request.attachments?.length > 0 && (
                            <div style={{ marginTop: 12 }}>
                                <div style={{ fontWeight: 500, fontSize: 13, marginBottom: 8 }}>Attachments</div>
                                {request.attachments.map((a, i) => (
                                    <a key={i} href={a} target="_blank" rel="noreferrer"
                                        style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 13, color: 'var(--navy)', marginBottom: 4 }}>
                                        <Paperclip size={12} /> {a.split('/').pop()}
                                    </a>
                                ))}
                            </div>
                        )}
                    </div>

                    {/* Action Panel */}
                    <div className="card">
                        <div style={{ fontWeight: 600, fontSize: 14, marginBottom: 12 }}>Your Decision</div>
                        {error && (
                            <div style={{ background: '#FEE2E2', color: '#991B1B', padding: '10px 14px', borderRadius: 8, fontSize: 13, marginBottom: 12 }}>
                                {error}
                            </div>
                        )}
                        <div className="form-group">
                            <label className="form-label">Comment / Note (required if rejecting)</label>
                            <textarea
                                className="form-textarea"
                                rows={3}
                                placeholder="Add a comment or note for the student and next authority…"
                                value={comment}
                                onChange={e => setComment(e.target.value)}
                            />
                        </div>
                        <div style={{ display: 'flex', gap: 12 }}>
                            <button
                                className="btn btn-danger"
                                disabled={submitting}
                                onClick={() => handleAction('rejected')}
                                style={{ flex: 1 }}
                            >
                                Reject
                            </button>
                            <button
                                className="btn btn-primary"
                                disabled={submitting}
                                onClick={() => handleAction('approved')}
                                style={{ flex: 1 }}
                            >
                                {submitting ? 'Processing…' : 'Approve'}
                            </button>
                        </div>
                    </div>
                </div>

                {/* Approval Trail sidebar */}
                <div className="card" style={{ height: 'fit-content' }}>
                    <div style={{ fontWeight: 600, fontSize: 14, marginBottom: 12 }}>Approval Trail</div>
                    <ApprovalTrail
                        chain={request.approvalChain}
                        steps={steps}
                        currentStep={request.currentStep}
                        status={request.status}
                    />
                </div>
            </div>
        </PageLayout>
    );
}
