import { useState, useEffect } from 'react';
import PageLayout from '../../components/Layout/PageLayout';
import StatusBadge from '../../components/StatusBadge';
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

export default function History() {
    const [steps, setSteps] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        api.get('/approvals/history/mine')
            .then(res => setSteps(res.data))
            .finally(() => setLoading(false));
    }, []);

    return (
        <PageLayout>
            <div className="page-title">Action History</div>
            <div className="page-subtitle">All requests you have reviewed</div>

            <div className="card" style={{ padding: 0 }}>
                {loading ? (
                    <div className="spinner" style={{ margin: '40px auto' }} />
                ) : steps.length === 0 ? (
                    <div className="empty-state">
                        <div className="empty-state-title">No history yet</div>
                        <div style={{ fontSize: 14 }}>Your approved and rejected requests will appear here</div>
                    </div>
                ) : (
                    <div className="request-list">
                        {steps.map(s => (
                            <div key={s._id} className="request-row" style={{ cursor: 'default' }}>
                                <div style={{ flex: 1 }}>
                                    <div style={{ fontWeight: 600, fontSize: 14 }}>
                                        {s.requestId?.studentId?.name} — {TYPE_LABELS[s.requestId?.type] || s.requestId?.type}
                                    </div>
                                    <div style={{ fontSize: 12, color: 'var(--text-secondary)', marginTop: 2 }}>
                                        {new Date(s.timestamp).toLocaleString('en-IN')}
                                        {s.comment && ` · "${s.comment}"`}
                                    </div>
                                </div>
                                <span className={`badge badge-${s.action === 'approved' ? 'approved' : 'rejected'}`}>
                                    <span className="badge-dot" />
                                    {s.action === 'approved' ? 'Approved' : 'Rejected'}
                                </span>
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </PageLayout>
    );
}
