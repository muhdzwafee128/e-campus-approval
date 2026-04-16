import { useEffect, useRef, useState } from 'react';
import { Upload, Paperclip, X } from 'lucide-react';

const DEPTS = ['CS1', 'CS2', 'IT', 'ECE', 'EEE', 'MECH', 'CIVIL', 'ECS'];
const CLUBS = ['IEDC', 'IEEE', 'TinkerHub', 'MuLearn', 'NSS', 'NCC', 'Other'];
const CERTS = ['10th', 'Plus Two', 'Diploma', 'Other'];

export default function Step2_FillForm({ type, user, formData, onChange, onFiles, onBack, onNext }) {
    // Auto-fill student profile fields
    useEffect(() => {
        onChange(prev => ({
            name: user.name || '',
            admissionNo: user.admissionNo || '',
            branch: user.department || '',
            yearOfStudy: user.yearOfStudy || '',
            yearOfAdmission: user.yearOfAdmission || '',
            category: user.category || '',
            typeOfAdmission: user.typeOfAdmission || '',
            dateOfBirth: user.dateOfBirth ? user.dateOfBirth.split('T')[0] : '',
            parentName: user.parentName || '',
            isHostler: user.isHostler || false,
            hostelName: user.hostelName || '',
            ...prev,
        }));
    }, []);

    const set = (k, v) => onChange(prev => ({ ...prev, [k]: v }));
    const fd = formData;

    const handleSubmit = (e) => {
        e.preventDefault();
        onNext();
    };

    return (
        <div>
            <div className="card">
                <form onSubmit={handleSubmit}>
                    {/* Auto-filled section */}
                    <div style={{ background: 'var(--bg)', borderRadius: 8, padding: '14px 18px', marginBottom: 20, border: '1px solid var(--border)' }}>
                        <div style={{ fontSize: 12, color: 'var(--text-secondary)', marginBottom: 8, fontWeight: 500 }}>AUTO-FILLED FROM YOUR PROFILE</div>
                        <div className="form-grid-2" style={{ gap: '8px 24px' }}>
                            <span style={{ fontSize: 13 }}><b>Name:</b> {user.name}</span>
                            <span style={{ fontSize: 13 }}><b>Admn No:</b> {user.admissionNo}</span>
                            <span style={{ fontSize: 13 }}><b>Branch:</b> {user.department}</span>
                            <span style={{ fontSize: 13 }}><b>Year:</b> {user.yearOfStudy ? `${user.yearOfStudy}${user.yearOfStudy === 1 ? 'st' : user.yearOfStudy === 2 ? 'nd' : user.yearOfStudy === 3 ? 'rd' : 'th'} Year` : '—'}</span>
                        </div>
                    </div>

                    {/* TYPE-SPECIFIC FIELDS */}
                    {type === 'duty_leave_upload' && <DutyLeaveUploadForm fd={fd} set={set} onFiles={onFiles} />}
                    {type === 'duty_leave_event' && <DutyLeaveEventForm fd={fd} set={set} onFiles={onFiles} />}
                    {type === 'scholarship' && <ScholarshipForm fd={fd} set={set} onFiles={onFiles} />}
                    {type === 'event_conduct' && <EventConductForm fd={fd} set={set} onFiles={onFiles} />}
                    {type === 'general_certificate' && <GeneralCertForm fd={fd} set={set} />}
                    {type === 'borrow_certificate' && <BorrowCertForm fd={fd} set={set} />}
                    {type === 'season_ticket' && <SeasonTicketForm fd={fd} set={set} />}
                    {type === 'fee_structure' && <FeeStructureForm fd={fd} set={set} />}

                    <div style={{ display: 'flex', gap: 12, marginTop: 24 }}>
                        <button type="button" className="btn btn-secondary" onClick={onBack}>← Back</button>
                        <button type="submit" className="btn btn-primary">Continue →</button>
                    </div>
                </form>
            </div>
        </div>
    );
}

function FG({ label, children, required }) {
    return (
        <div className="form-group">
            <label className={`form-label${required ? ' required' : ''}`}>{label}</label>
            {children}
        </div>
    );
}

function FileField({ label, onChange, multiple, helper, required: req = true }) {
    const [selectedFiles, setSelectedFiles] = useState([]);
    const inputRef = useRef(null);

    const handleChange = (e) => {
        const picked = Array.from(e.target.files);
        if (!picked.length) return;
        const next = multiple ? [...selectedFiles, ...picked] : picked;
        setSelectedFiles(next);
        onChange(next);
    };

    const removeFile = (idx) => {
        const next = selectedFiles.filter((_, i) => i !== idx);
        setSelectedFiles(next);
        onChange(next);
        // Reset the hidden input so the same file can be re-selected
        if (inputRef.current) inputRef.current.value = '';
    };

    return (
        <FG label={label} required={req}>
            {/* Drop zone / click-to-upload trigger */}
            <div
                style={{
                    border: `1px dashed ${selectedFiles.length ? 'var(--navy)' : 'var(--border)'}`,
                    borderRadius: 8,
                    padding: '14px 16px',
                    background: selectedFiles.length ? 'rgba(10,36,99,0.04)' : 'var(--bg)',
                    transition: 'border-color 0.2s, background 0.2s',
                }}
            >
                <label
                    style={{
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        gap: 8,
                        fontSize: 13,
                        color: 'var(--text-secondary)',
                    }}
                >
                    <Upload size={16} />
                    {selectedFiles.length
                        ? `Add ${multiple ? 'more files' : 'a different file'}`
                        : `Click to upload ${multiple ? 'files' : 'a file'}`}
                    <input
                        ref={inputRef}
                        type="file"
                        multiple={multiple}
                        style={{ display: 'none' }}
                        onChange={handleChange}
                    />
                </label>
                {helper && <div className="form-helper">{helper}</div>}

                {/* Selected file list */}
                {selectedFiles.length > 0 && (
                    <div style={{ marginTop: 10, display: 'flex', flexDirection: 'column', gap: 6 }}>
                        {selectedFiles.map((file, idx) => (
                            <div
                                key={idx}
                                style={{
                                    display: 'flex',
                                    alignItems: 'center',
                                    gap: 8,
                                    background: 'var(--bg)',
                                    border: '1px solid var(--border)',
                                    borderRadius: 6,
                                    padding: '5px 10px',
                                    fontSize: 12,
                                }}
                            >
                                <Paperclip size={12} color="var(--navy)" style={{ flexShrink: 0 }} />
                                <span
                                    style={{
                                        flex: 1,
                                        overflow: 'hidden',
                                        textOverflow: 'ellipsis',
                                        whiteSpace: 'nowrap',
                                        color: 'var(--text)',
                                        fontWeight: 500,
                                    }}
                                >
                                    {file.name}
                                </span>
                                <span style={{ color: 'var(--text-secondary)', flexShrink: 0 }}>
                                    {(file.size / 1024).toFixed(0)} KB
                                </span>
                                <button
                                    type="button"
                                    onClick={() => removeFile(idx)}
                                    title="Remove file"
                                    style={{
                                        background: 'none',
                                        border: 'none',
                                        cursor: 'pointer',
                                        padding: 2,
                                        display: 'flex',
                                        alignItems: 'center',
                                        color: '#e53e3e',
                                        flexShrink: 0,
                                    }}
                                >
                                    <X size={14} />
                                </button>
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </FG>
    );
}


function DutyLeaveUploadForm({ fd, set, onFiles }) {
    return (
        <>
            <FG label="Event Date" required>
                <input className="form-input" type="date" value={fd.eventDate || ''} onChange={e => set('eventDate', e.target.value)} required />
            </FG>
            <FG label="Number of Class Hours Missing" required>
                <input className="form-input" type="number" min="1" value={fd.classHours || ''} onChange={e => set('classHours', e.target.value)} required />
            </FG>
            <FG label="Reason / Purpose" required>
                <textarea className="form-textarea" rows={3} value={fd.purpose || ''} onChange={e => set('purpose', e.target.value)} required />
            </FG>
            <FileField label="Upload Duty Leave Sheet / Attendance List" multiple onChange={onFiles} helper="PDF, JPG, PNG, or Excel (.xlsx)" />
        </>
    );
}

function DutyLeaveEventForm({ fd, set, onFiles }) {
    const isClub = fd.eventType === 'Community-Club';
    return (
        <>
            <div className="form-grid-2">
                <FG label="Role" required>
                    <select className="form-select" value={fd.role || ''} onChange={e => set('role', e.target.value)} required>
                        <option value="">Select</option>
                        <option>Participant</option><option>Coordinator</option>
                    </select>
                </FG>
                <FG label="Event Type" required>
                    <select className="form-select" value={fd.eventType || ''} onChange={e => set('eventType', e.target.value)} required>
                        <option value="">Select</option>
                        <option>Department</option><option>Community-Club</option><option>Inter-college</option><option>Other</option>
                    </select>
                </FG>
            </div>
            <FG label="Event Name" required>
                <input className="form-input" value={fd.eventName || ''} onChange={e => set('eventName', e.target.value)} required />
            </FG>
            {isClub && (
                <FG label="Community / Club Name" required>
                    <select className="form-select" value={fd.communityName || ''} onChange={e => set('communityName', e.target.value)} required>
                        <option value="">Select</option>
                        {['IEDC', 'IEEE', 'TinkerHub', 'MuLearn', 'NSS', 'NCC', 'Other'].map(c => <option key={c}>{c}</option>)}
                    </select>
                </FG>
            )}
            <FG label="Organizing Institution / Body" required>
                <input className="form-input" value={fd.organisingBody || ''} onChange={e => set('organisingBody', e.target.value)} required />
            </FG>
            <div className="form-grid-2">
                <FG label="Event Date" required>
                    <input className="form-input" type="date" value={fd.eventDate || ''} onChange={e => set('eventDate', e.target.value)} required />
                </FG>
                <FG label="Venue" required>
                    <input className="form-input" value={fd.venue || ''} onChange={e => set('venue', e.target.value)} required />
                </FG>
                <FG label="Class Hours Missing" required>
                    <input className="form-input" type="number" min="1" value={fd.classHours || ''} onChange={e => set('classHours', e.target.value)} required />
                </FG>
            </div>
            <FG label="Purpose / Description" required>
                <textarea className="form-textarea" rows={3} value={fd.purpose || ''} onChange={e => set('purpose', e.target.value)} required />
            </FG>
            <FileField label="Upload Student Attendance List" multiple onChange={onFiles} helper="PDF, Image, or Excel (.xlsx)" />
            <FileField label="Supporting Documents (Optional)" multiple onChange={onFiles} helper="Invitation letter, brochure, sanction letter" required={false} />
        </>
    );
}

function ScholarshipForm({ fd, set, onFiles }) {
    return (
        <>
            <FG label="Name of Scholarship" required>
                <input className="form-input" value={fd.scholarshipName || ''} onChange={e => set('scholarshipName', e.target.value)} required />
            </FG>
            <FG label="Name of Agency Awarding Scholarship" required>
                <input className="form-input" value={fd.agencyName || ''} onChange={e => set('agencyName', e.target.value)} required />
            </FG>
            <FG label="Specific Format Attached">
                <label style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 14, cursor: 'pointer' }}>
                    <input type="checkbox" checked={!!fd.formatAttached} onChange={e => set('formatAttached', e.target.checked)} />
                    Yes, I have a specific format to attach
                </label>
            </FG>
            {fd.formatAttached && <FileField label="Upload Format" onChange={onFiles} />}
        </>
    );
}

function EventConductForm({ fd, set, onFiles }) {
    const multiDay = fd.eventDuration === 'Multi-Day';
    return (
        <>
            <div className="form-grid-2">
                <FG label="Position / Role in Organisation" required>
                    <input className="form-input" value={fd.positionInOrg || ''} onChange={e => set('positionInOrg', e.target.value)} required />
                </FG>
                <FG label="Organisation Name" required>
                    <select className="form-select" value={fd.organisationName || ''} onChange={e => set('organisationName', e.target.value)} required>
                        <option value="">Select</option>
                        {['IEDC', 'IEEE', 'MuLearn', 'TinkerHub', 'NCC', 'NSS', 'Department', 'Other'].map(o => <option key={o}>{o}</option>)}
                    </select>
                </FG>
            </div>
            <FG label="Event Title" required>
                <input className="form-input" value={fd.eventTitle || ''} onChange={e => set('eventTitle', e.target.value)} required />
            </FG>
            <div className="form-grid-2">
                <FG label="Event Type" required>
                    <select className="form-select" value={fd.eventType || ''} onChange={e => set('eventType', e.target.value)} required>
                        <option value="">Select</option>
                        <option>Online</option><option>Offline</option><option>Hybrid</option>
                    </select>
                </FG>
                <FG label="Duration" required>
                    <select className="form-select" value={fd.eventDuration || 'Single Day'} onChange={e => set('eventDuration', e.target.value)}>
                        <option>Single Day</option><option>Multi-Day</option>
                    </select>
                </FG>
            </div>
            {!multiDay ? (
                <FG label="Event Date" required>
                    <input className="form-input" type="date" value={fd.eventDate || ''} onChange={e => set('eventDate', e.target.value)} required />
                </FG>
            ) : (
                <div className="form-grid-2">
                    <FG label="From Date" required>
                        <input className="form-input" type="date" value={fd.eventDateFrom || ''} onChange={e => set('eventDateFrom', e.target.value)} required />
                    </FG>
                    <FG label="To Date" required>
                        <input className="form-input" type="date" value={fd.eventDateTo || ''} onChange={e => set('eventDateTo', e.target.value)} required />
                    </FG>
                </div>
            )}
            <div className="form-grid-2">
                <FG label="Event Start Time" required>
                    <input className="form-input" type="time" value={fd.eventStartTime || ''} onChange={e => set('eventStartTime', e.target.value)} required />
                </FG>
                <FG label="Venue" required>
                    <input className="form-input" value={fd.venue || ''} onChange={e => set('venue', e.target.value)} required />
                </FG>
                <FG label="Expected Participants" required>
                    <input className="form-input" type="number" min="1" value={fd.participants || ''} onChange={e => set('participants', e.target.value)} required />
                </FG>
            </div>
            <FG label="Objective / Description" required>
                <textarea className="form-textarea" rows={4} value={fd.purpose || ''} onChange={e => set('purpose', e.target.value)} required />
            </FG>
            <FileField label="Supporting Documents (Optional)" onChange={onFiles} helper="Event proposal, brochure" />
        </>
    );
}

function GeneralCertForm({ fd, set }) {
    return (
        <>
            <FG label="Type of Certificate Needed" required>
                <select className="form-select" value={fd.certificateType || ''} onChange={e => set('certificateType', e.target.value)} required>
                    <option value="">Select</option>
                    {['Conduct', 'Bonafide', 'Course Completion', 'KSRTC Pass', 'Other'].map(c => <option key={c}>{c}</option>)}
                </select>
            </FG>
            {fd.certificateType === 'Other' && (
                <FG label="Specify Certificate Type" required>
                    <input className="form-input" value={fd.certificateTypeOther || ''} onChange={e => set('certificateTypeOther', e.target.value)} required />
                </FG>
            )}
            <FG label="Purpose" required>
                <textarea className="form-textarea" rows={3} value={fd.purpose || ''} onChange={e => set('purpose', e.target.value)} required />
            </FG>
        </>
    );
}

function BorrowCertForm({ fd, set }) {
    const toggleCert = (c) => {
        const prev = fd.certificates || [];
        set('certificates', prev.includes(c) ? prev.filter(x => x !== c) : [...prev, c]);
    };
    return (
        <>
            <FG label="Type of Admission" required>
                <select className="form-select" value={fd.typeOfAdmission || ''} onChange={e => set('typeOfAdmission', e.target.value)} required>
                    <option value="">Select</option>
                    <option>Regular</option><option>Lateral Entry</option><option>Spot</option>
                </select>
            </FG>
            <FG label="Required Original Certificates" required>
                <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap', marginTop: 4 }}>
                    {CERTS.map(c => (
                        <label key={c} style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 13, cursor: 'pointer' }}>
                            <input type="checkbox" checked={(fd.certificates || []).includes(c)} onChange={() => toggleCert(c)} />{c}
                        </label>
                    ))}
                </div>
            </FG>
            <FG label="Purpose" required>
                <textarea className="form-textarea" rows={3} value={fd.purpose || ''} onChange={e => set('purpose', e.target.value)} required />
            </FG>
            <FG label="Expected Date of Return" required>
                <input className="form-input" type="date" value={fd.returnDate || ''} onChange={e => set('returnDate', e.target.value)} required />
            </FG>
        </>
    );
}

function SeasonTicketForm({ fd, set }) {
    const age = fd.dateOfBirth ? Math.floor((new Date() - new Date(fd.dateOfBirth)) / (365.25 * 24 * 3600 * 1000)) : '';
    useEffect(() => { if (age) set('age', age); }, [fd.dateOfBirth]);
    return (
        <div className="form-grid-2">
            <FG label="Date of Birth">
                <input className="form-input" type="date" value={fd.dateOfBirth || ''} onChange={e => set('dateOfBirth', e.target.value)} />
            </FG>
            <FG label="Age (auto-calculated)">
                <input className="form-input" type="number" value={age || fd.age || ''} readOnly />
            </FG>
            <FG label="From Station" required>
                <input className="form-input" value={fd.fromStation || ''} onChange={e => set('fromStation', e.target.value)} required />
            </FG>
            <FG label="To Station" required>
                <input className="form-input" value={fd.toStation || ''} onChange={e => set('toStation', e.target.value)} required />
            </FG>
        </div>
    );
}

function FeeStructureForm({ fd, set }) {
    const checkboxes = [
        ['examFee', 'Examination Fee'], ['busFee', 'Bus Fee'], ['textbooks', 'Textbooks, Records & Notebooks'],
        ['uniform', 'Uniform Expense'], ['laptop', 'Laptop'], ['project', 'Project'],
    ];
    return (
        <>
            <div className="form-grid-2">
                <FG label="Category" required>
                    <select className="form-select" value={fd.category || ''} onChange={e => set('category', e.target.value)} required>
                        <option value="">Select</option>
                        {['Merit', 'TFW', 'Management', 'NRI', 'Non-KEAM'].map(c => <option key={c}>{c}</option>)}
                    </select>
                </FG>
                <FG label="Type of Admission" required>
                    <select className="form-select" value={fd.typeOfAdmission || ''} onChange={e => set('typeOfAdmission', e.target.value)} required>
                        <option value="">Select</option>
                        <option>Regular</option><option>Lateral Entry</option><option>Spot</option>
                    </select>
                </FG>
            </div>
            <FG label="Whether Hostler">
                <label style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 14, cursor: 'pointer' }}>
                    <input type="checkbox" checked={!!fd.isHostler} onChange={e => set('isHostler', e.target.checked)} />
                    Yes
                </label>
            </FG>
            {fd.isHostler && (
                <FG label="Hostel Name">
                    <input className="form-input" value={fd.hostelName || ''} onChange={e => set('hostelName', e.target.value)} />
                </FG>
            )}
            <FG label="Additional Requirements">
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8, marginTop: 4 }}>
                    {checkboxes.map(([k, l]) => (
                        <label key={k} style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 13, cursor: 'pointer' }}>
                            <input type="checkbox" checked={!!fd[k]} onChange={e => set(k, e.target.checked)} />{l}
                        </label>
                    ))}
                </div>
            </FG>
            <div className="form-grid-2">
                <FG label="Purpose" required>
                    <select className="form-select" value={fd.purpose || ''} onChange={e => set('purpose', e.target.value)} required>
                        <option value="">Select</option>
                        <option>Loan</option><option>Scholarship</option><option>Other</option>
                    </select>
                </FG>
            </div>
            <div className="form-grid-2">
                <FG label="Name of Bank / Institution" required>
                    <input className="form-input" value={fd.bankName || ''} onChange={e => set('bankName', e.target.value)} required />
                </FG>
                <FG label="Branch" required>
                    <input className="form-input" value={fd.bankBranch || ''} onChange={e => set('bankBranch', e.target.value)} required />
                </FG>
            </div>
        </>
    );
}
