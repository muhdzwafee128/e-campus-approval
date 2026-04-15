export default function StatCard({ icon: Icon, count, label, color }) {
    return (
        <div className="stat-card">
            <div className="stat-icon" style={{ background: color + '20' }}>
                <Icon size={20} color={color} />
            </div>
            <div>
                <div className="stat-count">{count}</div>
                <div className="stat-label">{label}</div>
            </div>
        </div>
    );
}
