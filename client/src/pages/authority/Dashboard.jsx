import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import PageLayout from '../../components/Layout/PageLayout';
import StatCard from '../../components/StatCard';
import StatusBadge from '../../components/StatusBadge';
import { Clock, CheckCircle, XCircle, FileText } from 'lucide-react';
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

function daysAgo(date) {
    const diff = Math.floor((Date.now() - new Date(date)) / 86400000);
    if (diff === 0) return 'Today';
    if (diff === 1) return '1 day ago';
    return `${diff} days ago`;
}

export default function AuthorityDashboard() {
    const { user, socket } = useAuth();
    const navigate = useNavigate();
    const [requests, setRequests] = useState([]);
    const [stats, setStats] = useState({ pending: 0, approved: 0, rejected: 0 });
    const [loading, setLoading] = useState(true);

    const fetchAll = async () => {
        const [reqRes, statRes] = await Promise.all([
            api.get('/requests'),
            api.get('/approvals/stats/mine'),
        ]);
        setRequests(reqRes.data);
        setStats(statRes.data);
        setLoading(false);
    };

    useEffect(() => { fetchAll(); }, []);

    useEffect(() => {
        if (!socket) return;
        socket.on('new_request', fetchAll);
        return () => socket.off('new_request');
    }, [socket]);

    return (
        <PageLayout>
            <div className="page-title">Pending Approvals ({stats.pending})</div>
            <div className="page-subtitle">
                {user?.department
                    ? `${user.department}${user?.assignedYear ? ` · Year ${user.assignedYear}` : ''}`
                    : 'Requests assigned to you requiring action'}
            </div>

            <div className="stat-cards">
                <StatCard icon={Clock} count={stats.pending} label="Pending" color="#F59E0B" />
                <StatCard icon={CheckCircle} count={stats.approved} label="Approved" color="#10B981" />
                <StatCard icon={XCircle} count={stats.rejected} label="Rejected" color="#EF4444" />
            </div>

            <div className="card" style={{ padding: 0 }}>
                {loading ? (
                    <div className="spinner" style={{ margin: '40px auto' }} />
                ) : requests.length === 0 ? (
                    <div className="empty-state">
                        <CheckCircle size={48} style={{ margin: '0 auto 16px', color: 'var(--border)' }} />
                        <div className="empty-state-title">All clear!</div>
                        <div style={{ fontSize: 14 }}>No pending requests at the moment</div>
                    </div>
                ) : (
                    <div className="request-list">
                        {requests.map(r => (
                            <div key={r._id} className="request-row" onClick={() => navigate(`/authority/review/${r._id}`)}>
                                <FileText size={16} color="var(--text-secondary)" />
                                <div style={{ flex: 1 }}>
                                    <div style={{ fontWeight: 600, fontSize: 14 }}>
                                        {r.studentId?.name} — <span style={{ fontWeight: 400 }}>{TYPE_LABELS[r.type]}</span>
                                    </div>
                                    <div style={{ fontSize: 12, color: 'var(--text-secondary)', marginTop: 2 }}>
                                        {r.studentId?.department} · Year {r.studentId?.yearOfStudy}
                                        {' · '}{daysAgo(r.createdAt)}
                                    </div>
                                </div>
                                <button className="btn btn-primary" style={{ padding: '6px 16px', fontSize: 13 }}
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
