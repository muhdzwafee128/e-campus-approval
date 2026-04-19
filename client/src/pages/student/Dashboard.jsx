import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import PageLayout from '../../components/Layout/PageLayout';
import StatCard from '../../components/StatCard';
import StatusBadge from '../../components/StatusBadge';
import { Clock, CheckCircle, FileText, FilePlus } from 'lucide-react';
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

export default function StudentDashboard() {
    const { user, socket } = useAuth();
    const navigate = useNavigate();
    const [requests, setRequests] = useState([]);
    const [loading, setLoading] = useState(true);

    const fetchRequests = () => {
        api.get('/requests').then(res => {
            setRequests(res.data);
            setLoading(false);
        }).catch(() => setLoading(false));
    };

    useEffect(() => {
        fetchRequests();
    }, []);

    // Real-time updates
    useEffect(() => {
        if (!socket) return;
        socket.on('request_update', fetchRequests);
        return () => socket.off('request_update');
    }, [socket]);

    const pending = requests.filter(r => r.status === 'pending').length;
    const approved = requests.filter(r => r.status === 'approved').length;
    const total = requests.length;
    const recent = requests.slice(0, 5);

    const greeting = () => {
        const h = new Date().getHours();
        if (h < 12) return 'Good morning';
        if (h < 17) return 'Good afternoon';
        return 'Good evening';
    };

    return (
        <PageLayout>
            <div className="page-title">{greeting()}, {user?.name?.split(' ')[0]}</div>
            <div className="page-subtitle">
                {user?.department} · Year {user?.yearOfStudy} · Admn: {user?.admissionNo}
            </div>

            <div className="stat-cards">
                <StatCard icon={Clock} count={pending} label="Pending" color="#F59E0B" />
                <StatCard icon={CheckCircle} count={approved} label="Approved" color="#10B981" />
                <StatCard icon={FileText} count={total} label="Total Requests" color="#3B82F6" />
            </div>

            <div className="card">
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
                    <div style={{ fontWeight: 600, fontSize: 16 }}>Recent Requests</div>
                    {total > 0 && (
                        <button className="btn btn-ghost" onClick={() => navigate('/requests')}>
                            View all →
                        </button>
                    )}
                </div>

                {loading ? (
                    <div className="spinner" />
                ) : recent.length === 0 ? (
                    <div className="empty-state">
                        <FileText size={48} className="empty-state-icon" style={{ margin: '0 auto 16px', color: 'var(--border)' }} />
                        <div className="empty-state-title">No requests yet</div>
                        <div style={{ fontSize: 14 }}>Submit your first request to get started</div>
                    </div>
                ) : (
                    <div className="request-list">
                        {recent.map(r => (
                            <div key={r._id} className="request-row" onClick={() => navigate(`/requests/${r._id}`)}>
                                <FileText size={16} color="var(--text-secondary)" />
                                <div style={{ flex: 1 }}>
                                    <div style={{ fontWeight: 600, fontSize: 14 }}>{TYPE_LABELS[r.type]}</div>
                                    <div style={{ fontSize: 12, color: 'var(--text-secondary)', marginTop: 2 }}>
                                        {new Date(r.createdAt).toLocaleDateString('en-IN')}
                                        {r.approvalChain?.length > 0 && ` · Step ${Math.min(r.currentStep + 1, r.approvalChain.length)} of ${r.approvalChain.length}`}
                                    </div>
                                </div>
                                <StatusBadge status={r.status} />
                            </div>
                        ))}
                    </div>
                )}
            </div>

            <div className="cta-banner">
                <div>
                    <div className="cta-title">Need a permission?</div>
                    <div className="cta-sub">Submit a new request online — no paperwork needed</div>
                </div>
                <button className="btn" onClick={() => navigate('/new-request')}
                    style={{ background: 'white', color: 'var(--navy)', fontWeight: 600, padding: '10px 20px' }}>
                    <FilePlus size={16} />
                    Submit New Request
                </button>
            </div>
        </PageLayout>
    );
}
