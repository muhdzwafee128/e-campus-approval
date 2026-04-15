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

const CHAIN_LABELS = {
    tutor: 'Group Tutor',
    nodal_officer: 'Nodal Officer',
    faculty_coordinator: 'Faculty In-charge',
    hod: 'Head of Department',
    principal: 'Principal',
};

// Client-side chain preview (mirrors routing service)
function previewChain(type, formData) {
    if (type === 'duty_leave_upload') return ['tutor'];
    if (type === 'duty_leave_event') {
        const et = formData.eventType || '';
        const cm = (formData.communityName || '').toLowerCase();
        if (et === 'Community-Club') {
            if (cm === 'iedc') return ['nodal_officer', 'principal'];
            return ['faculty_coordinator', 'principal'];
        }
        return ['tutor', 'hod', 'principal'];
    }
    if (type === 'scholarship') return ['tutor', 'hod', 'principal'];
    if (type === 'event_conduct') {
        const org = (formData.organisationName || '').toLowerCase();
        if (org === 'iedc') return ['nodal_officer', 'principal'];
        if (org === 'department') return ['hod', 'principal'];
        return ['faculty_coordinator', 'principal'];
    }
    if (type === 'general_certificate') return ['tutor', 'hod', 'principal'];
    if (type === 'borrow_certificate') return ['tutor', 'hod', 'principal'];
    if (type === 'season_ticket') return ['tutor', 'hod'];
    if (type === 'fee_structure') return ['tutor', 'hod', 'principal'];
    return ['tutor'];
}

export default function Step3_Preview({ type, formData, onBack, onSubmit, submitting }) {
    const chain = previewChain(type, formData);

    return (
        <div>
            <div className="card" style={{ marginBottom: 16 }}>
                <div style={{ fontWeight: 600, fontSize: 16, marginBottom: 16 }}>Request Summary</div>
                <div style={{ display: 'flex', gap: 8, marginBottom: 20 }}>
                    <span style={{ background: '#EFF6FF', color: 'var(--navy)', padding: '3px 10px', borderRadius: 6, fontSize: 13, fontWeight: 500 }}>
                        {TYPE_LABELS[type]}
                    </span>
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px 24px' }}>
                    {Object.entries(formData).map(([k, v]) => {
                        if (!v || v === false || v === '') return null;
                        const label = k.replace(/([A-Z])/g, ' $1').replace(/^./, s => s.toUpperCase());
                        const val = Array.isArray(v) ? v.join(', ') : (typeof v === 'boolean' ? 'Yes' : String(v));
                        return (
                            <div key={k} style={{ paddingBottom: 10, borderBottom: '1px solid var(--border)' }}>
                                <div style={{ fontSize: 11, color: 'var(--text-secondary)', fontWeight: 500, textTransform: 'uppercase' }}>{label}</div>
                                <div style={{ fontSize: 13, marginTop: 3 }}>{val}</div>
                            </div>
                        );
                    })}
                </div>
            </div>

            <div className="card" style={{ marginBottom: 16 }}>
                <div style={{ fontWeight: 600, fontSize: 16, marginBottom: 12 }}>Approval Chain</div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 0, flexWrap: 'wrap' }}>
                    <span style={{ fontSize: 13, color: 'var(--text-secondary)', marginRight: 8 }}>You</span>
                    {chain.map((role, i) => (
                        <div key={role} style={{ display: 'flex', alignItems: 'center', gap: 0 }}>
                            <span style={{ color: 'var(--text-secondary)', margin: '0 6px' }}>→</span>
                            <span style={{
                                background: '#EFF6FF', color: 'var(--navy)', padding: '4px 12px',
                                borderRadius: 6, fontSize: 13, fontWeight: 500,
                            }}>
                                {CHAIN_LABELS[role] || role}
                                {i === chain.length - 1 && ' ✓'}
                            </span>
                        </div>
                    ))}
                </div>
                <div style={{ fontSize: 12, color: 'var(--text-secondary)', marginTop: 12 }}>
                    Your request will be routed through this approval chain automatically upon submission.
                </div>
            </div>

            <div style={{ display: 'flex', gap: 12 }}>
                <button className="btn btn-secondary" onClick={onBack} disabled={submitting}>← Back</button>
                <button className="btn btn-primary" onClick={onSubmit} disabled={submitting}>
                    {submitting ? 'Submitting…' : 'Submit Request'}
                </button>
            </div>
        </div>
    );
}
