import { useNavigate } from 'react-router-dom';
import PageLayout from '../../components/Layout/PageLayout';
import StatusBadge from '../../components/StatusBadge';
import api from '../../api/axios';
import { useEffect, useState } from 'react';

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

export default function PendingQueue() {
    const navigate = useNavigate();
    const [requests, setRequests] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        api.get('/requests').then(res => setRequests(res.data)).finally(() => setLoading(false));
    }, []);

    return (
        <PageLayout>
            <div className="page-title">Pending Queue</div>
            <div className="page-subtitle">All pending requests assigned to you</div>
            <div className="card" style={{ padding: 0 }}>
                {loading ? <div className="spinner" style={{ margin: '40px auto' }} /> :
                    requests.length === 0 ? (
                        <div className="empty-state">
                            <div className="empty-state-title">All clear!</div>
                            <div style={{ fontSize: 14 }}>No pending requests</div>
                        </div>
                    ) : (
                        <div className="request-list">
                            {requests.map(r => (
                                <div key={r._id} className="request-row" onClick={() => navigate(`/authority/review/${r._id}`)}>
                                    <div style={{ flex: 1 }}>
                                        <div style={{ fontWeight: 600, fontSize: 14 }}>
                                            {r.studentId?.name} — {TYPE_LABELS[r.type]}
                                        </div>
                                        <div style={{ fontSize: 12, color: 'var(--text-secondary)', marginTop: 2 }}>
                                            {r.studentId?.department} · Yr {r.studentId?.yearOfStudy}
                                        </div>
                                    </div>
                                    <StatusBadge status={r.status} />
                                    <button className="btn btn-primary" style={{ padding: '6px 14px', fontSize: 13 }}
                                        onClick={e => { e.stopPropagation(); navigate(`/authority/review/${r._id}`); }}>
                                        Review
                                    </button>
                                </div>
                            ))}
                        </div>
                    )}
            </div>
        </PageLayout>
    );
}
