export default function StatusBadge({ status }) {
    const labels = {
        pending: 'Pending',
        in_progress: 'In Progress',
        approved: 'Approved',
        rejected: 'Rejected',
        awaiting_office: 'Awaiting Office',
        ready_to_collect: 'Ready to Collect',
        completed: 'Complete',
        returned_and_closed: 'Returned & Closed',
    };
    return (
        <span className={`badge badge-${status}`}>
            <span className="badge-dot" />
            {labels[status] || status}
        </span>
    );
}
