import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import PageLayout from '../../components/Layout/PageLayout';
import StatCard from '../../components/StatCard';
import { CheckCircle, FileText, Timer, AlertCircle, Download } from 'lucide-react';
import api from '../../api/axios';

const TYPE_LABELS = {
    general_certificate: 'General Certificate',
    borrow_certificate: 'Borrow Certificate',
    season_ticket: 'Season Ticket',
    fee_structure: 'Fee Structure',
};

function HistoryBadge({ request }) {
    const isBorrow = request.type === 'borrow_certificate';
    const isReturned = request.isReturnedByStudent;
    const isHandedOver = request.isHandedOver;
    const isReturnedClosed = request.status === 'returned_and_closed';

    if (isBorrow && (isReturnedClosed || isReturned)) {
        return <span style={{ background: '#D1FAE5', color: '#065F46', padding: '3px 10px', borderRadius: 999, fontSize: 11, fontWeight: 600 }}>Returned & closed</span>;
    }
    if (isBorrow && isHandedOver && !isReturned) {
        return <span style={{ background: '#DBEAFE', color: '#1D4ED8', padding: '3px 10px', borderRadius: 999, fontSize: 11, fontWeight: 600 }}>Issued, pending return</span>;
    }
    return <span style={{ background: '#D1FAE5', color: '#065F46', padding: '3px 10px', borderRadius: 999, fontSize: 11, fontWeight: 600 }}>Delivered</span>;
}

function fmt(dateStr) {
    if (!dateStr) return '—';
    return new Date(dateStr).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' });
}

// Get month pills from data
function getMonthPills(requests) {
    const months = {};
    requests.forEach(r => {
        const d = new Date(r.officeProcessedAt || r.updatedAt);
        const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
        const label = d.toLocaleString('en-IN', { month: 'short', year: 'numeric' });
        months[key] = label;
    });
    return Object.entries(months).sort((a, b) => b[0].localeCompare(a[0])).map(([k, v]) => ({ key: k, label: v }));
}

export default function OfficeHistory() {
    const navigate = useNavigate();
    const [requests, setRequests] = useState([]);
    const [stats, setStats] = useState({ completedThisMonth: 0, inProgress: 0, avgTurnaround: 0 });
    const [loading, setLoading] = useState(true);
    const [monthFilter, setMonthFilter] = useState('all');
    const [returningId, setReturningId] = useState(null);

    const fetch = async () => {
        try {
            const [hRes, sRes] = await Promise.all([
                api.get('/office/history'),
                api.get('/office/stats'),
            ]);
            setRequests(hRes.data);
            setStats(sRes.data);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => { fetch(); }, []);

    const handleMarkReturned = async (id) => {
        setReturningId(id);
        try {
            await api.post(`/office/return/${id}`);
            fetch();
        } finally {
            setReturningId(null);
        }
    };

    const monthPills = getMonthPills(requests);

    const filtered = monthFilter === 'all' ? requests : requests.filter(r => {
        const d = new Date(r.officeProcessedAt || r.updatedAt);
        const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
        return key === monthFilter;
    });

    // Pending returns: borrow certs that are 'completed' (collected) but not yet returned
    const pendingReturns = requests.filter(r => r.type === 'borrow_certificate' && r.status === 'completed' && !r.isReturnedByStudent);

    return (
        <PageLayout>
            <div className="page-title">Completed History</div>
            <div className="page-subtitle">All requests processed by this office account</div>

            <div className="stat-cards" style={{ gridTemplateColumns: 'repeat(3, 1fr)' }}>
                <StatCard icon={CheckCircle} count={stats.completedThisMonth} label="Completed (Month)" color="#10B981" />
                <StatCard icon={FileText} count={requests.filter(r => !r.type?.includes('borrow') || r.isHandedOver).length} label="Documents Issued" color="#3B82F6" />
                <StatCard icon={Timer} count={`${stats.avgTurnaround}d`} label="Avg Turnaround" color="#6B7280" />
            </div>

            {/* Month filter pills */}
            <div style={{ display: 'flex', gap: 8, marginBottom: 16, flexWrap: 'wrap' }}>
                <button onClick={() => setMonthFilter('all')}
                    style={{ padding: '6px 14px', borderRadius: 999, border: '1px solid var(--border)', background: monthFilter === 'all' ? 'var(--navy)' : 'white', color: monthFilter === 'all' ? 'white' : 'var(--text-secondary)', fontSize: 12, fontWeight: 500, cursor: 'pointer' }}>
                    All
                </button>
                {monthPills.map(m => (
                    <button key={m.key} onClick={() => setMonthFilter(m.key)}
                        style={{ padding: '6px 14px', borderRadius: 999, border: '1px solid var(--border)', background: monthFilter === m.key ? 'var(--navy)' : 'white', color: monthFilter === m.key ? 'white' : 'var(--text-secondary)', fontSize: 12, fontWeight: 500, cursor: 'pointer' }}>
                        {m.label}
                    </button>
                ))}
            </div>

            <div className="card" style={{ padding: 0, marginBottom: 16 }}>
                {loading ? <div className="spinner" style={{ margin: '40px auto' }} /> :
                filtered.length === 0 ? (
                    <div className="empty-state">
                        <div className="empty-state-title">No history yet</div>
                        <div style={{ fontSize: 14 }}>Completed requests will appear here</div>
                    </div>
                ) : (
                    <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                        <thead>
                            <tr style={{ background: '#F8FAFC', borderBottom: '1px solid var(--border)' }}>
                                {['Student', 'Request Type', 'Completed On', 'Status', 'View PDF'].map(h => (
                                    <th key={h} style={{ padding: '10px 16px', textAlign: 'left', fontSize: 11, fontWeight: 600, color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.5px' }}>{h}</th>
                                ))}
                            </tr>
                        </thead>
                        <tbody>
                            {filtered.map(r => {
                                const isPendingReturn = r.type === 'borrow_certificate' && r.isHandedOver && !r.isReturnedByStudent;
                                const dueDate = r.returnDueDate ? new Date(r.returnDueDate) : null;
                                return (
                                    <tr key={r._id} style={{ borderBottom: '1px solid var(--border)' }}>
                                        <td style={{ padding: '12px 16px' }}>
                                            <div style={{ fontWeight: 600, fontSize: 13 }}>{r.studentId?.name}</div>
                                            <div style={{ fontSize: 12, color: 'var(--text-secondary)' }}>{r.studentId?.department}</div>
                                        </td>
                                        <td style={{ padding: '12px 16px', fontSize: 13 }}>{TYPE_LABELS[r.type]}</td>
                                        <td style={{ padding: '12px 16px' }}>
                                            <div style={{ fontSize: 13 }}>{fmt(r.officeProcessedAt || r.handedOverAt)}</div>
                                            {isPendingReturn && dueDate && (
                                                <div style={{ fontSize: 11, color: '#EF4444', marginTop: 2, fontWeight: 600 }}>
                                                    Return due: {fmt(dueDate)}
                                                </div>
                                            )}
                                        </td>
                                        <td style={{ padding: '12px 16px' }}><HistoryBadge request={r} /></td>
                                        <td style={{ padding: '12px 16px' }}>
                                            {r.approvalLetterUrl ? (
                                                <a href={r.approvalLetterUrl} target="_blank" rel="noreferrer"
                                                    style={{ display: 'inline-flex', alignItems: 'center', gap: 6, fontSize: 12, color: 'var(--navy)', fontWeight: 500 }}>
                                                    <Download size={14} /> PDF
                                                </a>
                                            ) : '—'}
                                        </td>
                                    </tr>
                                );
                            })}
                        </tbody>
                    </table>
                )}
            </div>

            {/* Pending returns alert banner */}
            {pendingReturns.length > 0 && (
                <div style={{ background: '#FEF3C7', border: '1px solid #F59E0B', borderRadius: 10, padding: '14px 18px' }}>
                    <div style={{ display: 'flex', alignItems: 'flex-start', gap: 12 }}>
                        <AlertCircle size={18} color="#D97706" style={{ marginTop: 1, flexShrink: 0 }} />
                        <div style={{ flex: 1 }}>
                            <div style={{ fontWeight: 600, fontSize: 13, color: '#92400E' }}>
                                {pendingReturns.length} certificate{pendingReturns.length > 1 ? 's' : ''} pending return
                            </div>
                            {pendingReturns.map(r => (
                                <div key={r._id} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: 8, padding: '8px 0', borderTop: '1px solid #FDE68A' }}>
                                    <div style={{ fontSize: 12, color: '#78350F' }}>
                                        <strong>{r.studentId?.name}</strong>'s {r.formData?.certificates?.join(', ')} cert
                                        {r.returnDueDate && <> is due back by <strong>{fmt(r.returnDueDate)}</strong></>}
                                    </div>
                                    <button className="btn btn-primary" style={{ padding: '5px 12px', fontSize: 12, marginLeft: 16 }}
                                        onClick={() => handleMarkReturned(r._id)}
                                        disabled={returningId === r._id}>
                                        {returningId === r._id ? 'Saving…' : 'Mark as Returned'}
                                    </button>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            )}
        </PageLayout>
    );
}
