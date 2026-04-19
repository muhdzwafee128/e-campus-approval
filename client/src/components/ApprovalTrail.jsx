const ROLE_LABELS = {
    tutor: 'Group Tutor',
    faculty_coordinator: 'Faculty In-charge',
    hod: 'Head of Department',
    principal: 'Principal',
};

export default function ApprovalTrail({ chain = [], steps = [], currentStep = 0, status }) {
    return (
        <div className="trail">
            {chain.map((role, idx) => {
                const step = steps.find(s => s.role === role);
                const isDone = step?.action === 'approved';
                const isRejected = step?.action === 'rejected';
                const isCurrent = idx === currentStep && status !== 'approved' && status !== 'rejected';
                const isPending = !isDone && !isRejected && !isCurrent;

                let dotClass = 'trail-dot pending';
                if (isDone) dotClass = 'trail-dot done';
                else if (isRejected) dotClass = 'trail-dot';
                else if (isCurrent) dotClass = 'trail-dot current';

                return (
                    <div key={role} className="trail-item">
                        <div className="trail-line-area">
                            <span className={dotClass} style={isRejected ? { background: '#EF4444' } : {}} />
                            {idx < chain.length - 1 && <div className="trail-connector" />}
                        </div>
                        <div className="trail-content">
                            <div className="trail-role">{ROLE_LABELS[role] || role}</div>
                            {isDone && (
                                <div className="trail-time">
                                    ✓ Approved by {step.authorityId?.name || '—'} · {formatTime(step.timestamp)}
                                </div>
                            )}
                            {isRejected && (
                                <div className="trail-time" style={{ color: '#EF4444' }}>
                                    ✗ Rejected by {step.authorityId?.name || '—'} · {formatTime(step.timestamp)}
                                </div>
                            )}
                            {isCurrent && <div className="trail-time" style={{ color: '#3B82F6' }}>Awaiting review…</div>}
                            {isPending && <div className="trail-time">—</div>}
                            {(isDone || isRejected) && step?.comment && (
                                <div className="trail-comment">"{step.comment}"</div>
                            )}
                        </div>
                    </div>
                );
            })}
        </div>
    );
}

function formatTime(ts) {
    if (!ts) return '';
    return new Date(ts).toLocaleString('en-IN', {
        day: '2-digit', month: 'short', year: 'numeric',
        hour: '2-digit', minute: '2-digit', hour12: true,
    });
}
