import {
    FileText, Calendar, Award, BookOpen,
    Archive, Train, CreditCard, Users
} from 'lucide-react';

const REQUEST_TYPES = [
    { type: 'duty_leave_upload', icon: FileText, title: 'Duty Leave', sub: 'File Upload', desc: 'Upload duty leave sheet provided by organiser' },
    { type: 'duty_leave_event', icon: Calendar, title: 'Duty Leave', sub: 'Event Sanction', desc: 'Bulk duty leave for event participants' },
    { type: 'scholarship', icon: Award, title: 'Scholarship', sub: 'Recommendation', desc: 'Request scholarship recommendation letter' },
    { type: 'event_conduct', icon: Users, title: 'Event Permission', sub: 'Conduct Event', desc: 'Get permission to organise a club event' },
    { type: 'general_certificate', icon: BookOpen, title: 'Certificate', sub: 'General Purpose', desc: 'Conduct, Bonafide, KSRTC pass, etc.' },
    { type: 'borrow_certificate', icon: Archive, title: 'Borrow Certificates', sub: 'Original Documents', desc: 'Borrow original 10th, plus two, diploma etc.' },
    { type: 'season_ticket', icon: Train, title: 'Season Ticket', sub: 'Railway Concession', desc: 'Get railway season ticket or concession' },
    { type: 'fee_structure', icon: CreditCard, title: 'Fee Structure', sub: 'Educational Loan', desc: 'Fee certificate for education loan or scholarship' },
];

export default function Step1_SelectType({ selected, onSelect }) {
    return (
        <div>
            <div style={{ marginBottom: 16, fontSize: 14, color: 'var(--text-secondary)' }}>
                Select the type of permission request you want to submit
            </div>
            <div className="type-cards-grid">
                {REQUEST_TYPES.map(({ type, icon: Icon, title, sub, desc }) => (
                    <div
                        key={type}
                        className={`type-card ${selected === type ? 'selected' : ''}`}
                        onClick={() => onSelect(type)}
                    >
                        <div className="type-card-icon">
                            <Icon size={20} />
                        </div>
                        <div className="type-card-title">{title}</div>
                        <div style={{ fontSize: 11, color: 'var(--navy)', fontWeight: 500, marginBottom: 6 }}>{sub}</div>
                        <div className="type-card-sub">{desc}</div>
                    </div>
                ))}
            </div>
        </div>
    );
}
