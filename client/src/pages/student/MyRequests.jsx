import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import PageLayout from '../../components/Layout/PageLayout';
import StatusBadge from '../../components/StatusBadge';
import { FileText, Download } from 'lucide-react';
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

export default function MyRequests() {
    const navigate = useNavigate();
    const [requests, setRequests] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        api.get('/requests')
            .then(res => setRequests(res.data))
            .finally(() => setLoading(false));
    }, []);

    const handleDownload = async (e, reqId) => {
        e.stopPropagation();
        try {
            const res = await api.get(`/documents/download/${reqId}`, { responseType: 'blob' });
            const url = URL.createObjectURL(res.data);
            window.open(url, '_blank');
        } catch {
            alert('PDF not available yet');
        }
    };

    return (
        <PageLayout>
            <div className="page-title">My Requests</div>
            <div className="page-subtitle">All your submitted permission requests</div>

            <div className="card" style={{ padding: 0 }}>
                {loading ? (
                    <div className="spinner" style={{ margin: '40px auto' }} />
                ) : requests.length === 0 ? (
                    <div className="empty-state">
                        <FileText size={48} style={{ margin: '0 auto 16px', color: 'var(--border)' }} />
                        <div className="empty-state-title">No requests yet</div>
                        <div style={{ fontSize: 14 }}>Submit your first permission request to get started</div>
                    </div>
                ) : (
                    <div className="request-list">
                        {requests.map(r => (
                            <div key={r._id} className="request-row" onClick={() => navigate(`/requests/${r._id}`)}>
                                <FileText size={16} color="var(--text-secondary)" />
                                <div style={{ flex: 1 }}>
                                    <div style={{ fontWeight: 600, fontSize: 14 }}>{TYPE_LABELS[r.type]}</div>
                                    <div style={{ fontSize: 12, color: 'var(--text-secondary)', marginTop: 2 }}>
                                        Submitted {new Date(r.createdAt).toLocaleDateString('en-IN')}
                                        {r.approvalChain?.length > 0 && (
                                            <span>
                                                {' · '}Step {Math.min(r.currentStep + 1, r.approvalChain.length)} of {r.approvalChain.length}
                                                {r.status === 'in_progress' && r.currentHolder && ` — Awaiting ${formatRole(r.currentHolder?.role)}`}
                                            </span>
                                        )}
                                    </div>
                                </div>
                                <StatusBadge status={r.status} />
                                {r.status === 'approved' && (
                                    <button
                                        className="btn btn-ghost"
                                        style={{ fontSize: 12, padding: '4px 10px', color: 'var(--approved)' }}
                                        onClick={(e) => handleDownload(e, r._id)}
                                    >
                                        <Download size={14} /> Download
                                    </button>
                                )}
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </PageLayout>
    );
}

function formatRole(role) {
    const map = {
        tutor: 'Tutor', nodal_officer: 'Nodal Officer',
        faculty_coordinator: 'Faculty Coordinator', hod: 'HOD', principal: 'Principal',
    };
    return map[role] || role;
}
