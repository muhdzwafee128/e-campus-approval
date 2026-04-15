import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import PageLayout from '../../components/Layout/PageLayout';
import StatusBadge from '../../components/StatusBadge';
import ApprovalTrail from '../../components/ApprovalTrail';
import { Download, ChevronRight } from 'lucide-react';
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

export default function RequestDetail() {
    const { id } = useParams();
    const navigate = useNavigate();
    const [data, setData] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        api.get(`/requests/${id}`)
            .then(res => setData(res.data))
            .finally(() => setLoading(false));
    }, [id]);

    const handleDownload = async () => {
        try {
            const res = await api.get(`/documents/download/${id}`, { responseType: 'blob' });
            const url = URL.createObjectURL(res.data);
            window.open(url, '_blank');
        } catch {
            alert('PDF not available yet');
        }
    };

    if (loading) return <PageLayout><div className="spinner" /></PageLayout>;
    if (!data) return <PageLayout><div>Request not found</div></PageLayout>;

    const { request, steps } = data;

    return (
        <PageLayout>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
                <button className="btn btn-ghost" style={{ padding: '4px 8px', fontSize: 13 }} onClick={() => navigate('/requests')}>
                    My Requests
                </button>
                <ChevronRight size={14} color="var(--text-secondary)" />
                <span style={{ fontSize: 13, color: 'var(--text-secondary)' }}>{request.requestId}</span>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 24 }}>
                <div>
                    <div className="page-title">{TYPE_LABELS[request.type]}</div>
                    <div style={{ fontSize: 12, fontFamily: 'var(--font-mono)', color: 'var(--text-secondary)', marginTop: 4 }}>
                        {request.requestId}
                    </div>
                </div>
                <div style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
                    <StatusBadge status={request.status} />
                    {request.status === 'approved' && (
                        <button className="btn btn-secondary" onClick={handleDownload}>
                            <Download size={14} /> Download Letter
                        </button>
                    )}
                </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 320px', gap: 20 }}>
                {/* Form data summary */}
                <div className="card">
                    <div style={{ fontWeight: 600, fontSize: 16, marginBottom: 16 }}>Request Details</div>
                    <FormSummary formData={request.formData} type={request.type} />
                    {request.attachments?.length > 0 && (
                        <div style={{ marginTop: 16 }}>
                            <div style={{ fontWeight: 500, fontSize: 13, marginBottom: 8 }}>Attachments</div>
                            {request.attachments.map((a, i) => (
                                <a key={i} href={a} target="_blank" rel="noreferrer"
                                    style={{ display: 'block', fontSize: 13, color: 'var(--navy)', marginBottom: 4 }}>
                                    📎 {a.split('/').pop()}
                                </a>
                            ))}
                        </div>
                    )}
                </div>

                {/* Approval trail */}
                <div className="card">
                    <div style={{ fontWeight: 600, fontSize: 16, marginBottom: 16 }}>Approval Trail</div>
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

function FormSummary({ formData, type }) {
    if (!formData) return null;
    return (
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px 24px' }}>
            {Object.entries(formData).map(([k, v]) => {
                if (!v || k === 'studentName' || k === 'branch') return null;
                const label = k.replace(/([A-Z])/g, ' $1').replace(/^./, s => s.toUpperCase());
                const val = Array.isArray(v) ? v.join(', ') : (typeof v === 'boolean' ? (v ? 'Yes' : 'No') : String(v));
                return (
                    <div key={k} style={{ paddingBottom: 10, borderBottom: '1px solid var(--border)' }}>
                        <div style={{ fontSize: 11, color: 'var(--text-secondary)', fontWeight: 500, textTransform: 'uppercase', letterSpacing: '0.5px' }}>{label}</div>
                        <div style={{ fontSize: 13, marginTop: 3 }}>{val}</div>
                    </div>
                );
            })}
        </div>
    );
}
