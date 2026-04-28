import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import PageLayout from '../../components/Layout/PageLayout';
import StatCard from '../../components/StatCard';
import { Clock, CheckCircle, FileText, Timer, AlertCircle } from 'lucide-react';
import api from '../../api/axios';

const TYPE_LABELS = {
    general_certificate: 'General Certificate',
    borrow_certificate: 'Borrow Certificate',
    season_ticket: 'Season Ticket',
    fee_structure: 'Fee Structure',
};

const FILTERS = [
    { key: 'all', label: 'All' },
    { key: 'general_certificate', label: 'Certificate' },
    { key: 'fee_structure', label: 'Loan Fee' },
    { key: 'season_ticket', label: 'Rail Pass' },
    { key: 'borrow_certificate', label: 'Borrow Cert' },
];

function officeBadge(status) {
    const map = {
        awaiting_office: { label: 'Ready to process', color: '#F59E0B', bg: '#FEF3C7' },
        ready_to_collect: { label: 'In progress', color: '#3B82F6', bg: '#DBEAFE' },
        completed: { label: 'Delivered', color: '#10B981', bg: '#D1FAE5' },
    };
    const s = map[status] || { label: status, color: '#64748B', bg: '#F1F5F9' };
    return (
        <span style={{
            background: s.bg, color: s.color, padding: '3px 10px',
            borderRadius: 999, fontSize: 11, fontWeight: 600,
        }}>{s.label}</span>
    );
}

function fmt(dateStr) {
    if (!dateStr) return '—';
    return new Date(dateStr).toLocaleString('en-IN', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit', hour12: true });
}

export default function OfficeDashboard() {
    const { user, socket } = useAuth();
    const navigate = useNavigate();
    const [requests, setRequests] = useState([]);
    const [stats, setStats] = useState({ pending: 0, inProgress: 0, completedThisMonth: 0, avgTurnaround: 0 });
    const [loading, setLoading] = useState(true);
    const [filter, setFilter] = useState('all');

    const fetchAll = async () => {
        try {
            const [qRes, sRes] = await Promise.all([
                api.get('/office/queue'),
                api.get('/office/stats'),
            ]);
            setRequests(qRes.data);
            setStats(sRes.data);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => { fetchAll(); }, []);

    useEffect(() => {
        if (!socket) return;
        socket.on('new_office_request', fetchAll);
        return () => socket.off('new_office_request');
    }, [socket]);

    const filtered = filter === 'all' ? requests : requests.filter(r => r.type === filter);

    // Sort: awaiting_office first (oldest), then ready_to_collect, then completed
    const sorted = [...filtered].sort((a, b) => {
        const order = { awaiting_office: 0, ready_to_collect: 1, completed: 2 };
        if (order[a.status] !== order[b.status]) return order[a.status] - order[b.status];
        return new Date(a.updatedAt) - new Date(b.updatedAt);
    });

    return (
        <PageLayout>
            <div className="page-title">Pending Approvals ({stats.pending + stats.inProgress})</div>
            <div className="page-subtitle">Requests assigned to you requiring action</div>

            <div className="stat-cards" style={{ gridTemplateColumns: 'repeat(4, 1fr)' }}>
                <StatCard icon={Clock} count={stats.pending} label="Pending" color="#F59E0B" />
                <StatCard icon={FileText} count={stats.inProgress} label="In Progress" color="#3B82F6" />
                <StatCard icon={CheckCircle} count={stats.completedThisMonth} label="Completed (Month)" color="#10B981" />
                <StatCard icon={Timer} count={`${stats.avgTurnaround}d`} label="Avg Turnaround" color="#6B7280" />
            </div>

            {/* Filter pills */}
            <div style={{ display: 'flex', gap: 8, marginBottom: 16, flexWrap: 'wrap' }}>
                {FILTERS.map(f => (
                    <button key={f.key} onClick={() => setFilter(f.key)}
                        style={{
                            padding: '6px 14px', borderRadius: 999, border: '1px solid var(--border)',
                            background: filter === f.key ? 'var(--navy)' : 'white',
                            color: filter === f.key ? 'white' : 'var(--text-secondary)',
                            fontSize: 12, fontWeight: 500, cursor: 'pointer',
                        }}>
                        {f.label}{f.key === 'all' ? ` (${requests.length})` : ''}
                    </button>
                ))}
            </div>

            <div className="card" style={{ padding: 0 }}>
                {loading ? <div className="spinner" style={{ margin: '40px auto' }} /> :
                sorted.length === 0 ? (
                    <div className="empty-state">
                        <CheckCircle size={48} style={{ margin: '0 auto 16px', color: 'var(--border)' }} />
                        <div className="empty-state-title">All clear!</div>
                        <div style={{ fontSize: 14 }}>No pending requests at the moment</div>
                    </div>
                ) : (
                    <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                        <thead>
                            <tr style={{ background: '#F8FAFC', borderBottom: '1px solid var(--border)' }}>
                                {['Student', 'Request Type', 'Final Approval', 'Status', 'Action'].map(h => (
                                    <th key={h} style={{ padding: '10px 16px', textAlign: 'left', fontSize: 11, fontWeight: 600, color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.5px' }}>{h}</th>
                                ))}
                            </tr>
                        </thead>
                        <tbody>
                            {sorted.map(r => (
                                <tr key={r._id} style={{ borderBottom: '1px solid var(--border)' }}>
                                    <td style={{ padding: '12px 16px' }}>
                                        <div style={{ fontWeight: 600, fontSize: 13 }}>{r.studentId?.name}</div>
                                        <div style={{ fontSize: 12, color: 'var(--text-secondary)' }}>{r.studentId?.admissionNo} · {r.studentId?.department}</div>
                                    </td>
                                    <td style={{ padding: '12px 16px', fontSize: 13 }}>{TYPE_LABELS[r.type]}</td>
                                    <td style={{ padding: '12px 16px', fontSize: 12, color: 'var(--text-secondary)' }}>{fmt(r.updatedAt)}</td>
                                    <td style={{ padding: '12px 16px' }}>{officeBadge(r.status)}</td>
                                    <td style={{ padding: '12px 16px' }}>
                                        {r.status === 'awaiting_office' ? (
                                            <button className="btn btn-primary" style={{ padding: '6px 14px', fontSize: 12 }}
                                                onClick={() => navigate(`/office/process/${r._id}`)}>
                                                Process
                                            </button>
                                        ) : r.status === 'ready_to_collect' ? (
                                            <button className="btn btn-secondary" style={{ padding: '6px 14px', fontSize: 12 }}
                                                onClick={() => navigate(`/office/process/${r._id}`)}>
                                                View
                                            </button>
                                        ) : null}
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                )}
            </div>
        </PageLayout>
    );
}
