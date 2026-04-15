import { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { FileText, CheckCircle, XCircle } from 'lucide-react';
import api from '../api/axios';

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

const ROLE_LABELS = {
    tutor: 'Group Tutor',
    nodal_officer: 'Nodal Officer',
    faculty_coordinator: 'Faculty In-charge',
    hod: 'Head of Department',
    principal: 'Principal',
};

export default function VerifyPage() {
    const { requestId } = useParams();
    const [token, setToken] = useState(new URLSearchParams(window.location.search).get('token') || '');
    const [data, setData] = useState(null);
    const [loading, setLoading] = useState(true);
    const [valid, setValid] = useState(null);

    useEffect(() => {
        api.get(`/documents/verify/${requestId}?token=${token}`)
            .then(res => {
                setData(res.data);
                setValid(res.data.valid);
            })
            .catch(() => setValid(false))
            .finally(() => setLoading(false));
    }, [requestId, token]);

    return (
        <div style={{ minHeight: '100vh', background: '#F8FAFC', padding: '48px 24px', fontFamily: 'Inter, sans-serif' }}>
            <div style={{ maxWidth: 600, margin: '0 auto' }}>
                {/* Header */}
                <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 32 }}>
                    <div style={{ width: 40, height: 40, background: '#1E3A5F', borderRadius: 8, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                        <FileText size={20} color="white" />
                    </div>
                    <div>
                        <div style={{ fontWeight: 700, fontSize: 16, color: '#1E293B' }}>E-Approval System</div>
                        <div style={{ fontSize: 12, color: '#64748B' }}>College of Engineering, Thalassery</div>
                    </div>
                </div>

                <div style={{ fontWeight: 700, fontSize: 22, color: '#1E293B', marginBottom: 24 }}>
                    Document Verification
                </div>

                {loading ? (
                    <div style={{ textAlign: 'center', padding: 48, color: '#64748B' }}>Verifying document…</div>
                ) : valid ? (
                    <>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 12, background: '#D1FAE5', border: '1px solid #6EE7B7', borderRadius: 10, padding: '16px 20px', marginBottom: 24 }}>
                            <CheckCircle size={24} color="#10B981" />
                            <div>
                                <div style={{ fontWeight: 600, color: '#065F46', fontSize: 15 }}>Document Verified and Authentic</div>
                                <div style={{ fontSize: 13, color: '#064E3B', marginTop: 2 }}>This is a digitally approved document from the College of Engineering, Thalassery</div>
                            </div>
                        </div>
                        <div style={{ background: 'white', border: '1px solid #E2E8F0', borderRadius: 10, padding: 24 }}>
                            <div style={{ marginBottom: 16 }}>
                                <div style={{ fontSize: 11, color: '#64748B', fontWeight: 500, textTransform: 'uppercase' }}>Request ID</div>
                                <div style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: 14, marginTop: 2 }}>{data.requestId}</div>
                            </div>
                            <div style={{ marginBottom: 16 }}>
                                <div style={{ fontSize: 11, color: '#64748B', fontWeight: 500, textTransform: 'uppercase' }}>Request Type</div>
                                <div style={{ fontSize: 14, marginTop: 2 }}>{TYPE_LABELS[data.type] || data.type}</div>
                            </div>
                            <div style={{ marginBottom: 16 }}>
                                <div style={{ fontSize: 11, color: '#64748B', fontWeight: 500, textTransform: 'uppercase' }}>Student</div>
                                <div style={{ fontSize: 14, marginTop: 2 }}>{data.student?.name} · {data.student?.admissionNo}</div>
                                <div style={{ fontSize: 12, color: '#64748B' }}>{data.student?.department} · Year {data.student?.yearOfStudy}</div>
                            </div>
                            <div>
                                <div style={{ fontSize: 11, color: '#64748B', fontWeight: 500, textTransform: 'uppercase', marginBottom: 8 }}>Approval Chain</div>
                                {data.approvals?.map((a, i) => (
                                    <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '8px 0', borderBottom: '1px solid #E2E8F0' }}>
                                        <CheckCircle size={14} color="#10B981" />
                                        <div>
                                            <div style={{ fontSize: 13, fontWeight: 500 }}>{ROLE_LABELS[a.role] || a.role} — {a.authorityName}</div>
                                            <div style={{ fontSize: 12, color: '#64748B' }}>
                                                Approved: {new Date(a.timestamp).toLocaleString('en-IN')}
                                                {a.comment && ` · "${a.comment}"`}
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                            <div style={{ marginTop: 16, fontSize: 12, color: '#64748B' }}>
                                Issued: {data.issuedAt ? new Date(data.issuedAt).toLocaleDateString('en-IN') : '—'}
                            </div>
                        </div>
                    </>
                ) : (
                    <div style={{ display: 'flex', alignItems: 'center', gap: 12, background: '#FEE2E2', border: '1px solid #FECACA', borderRadius: 10, padding: '16px 20px' }}>
                        <XCircle size={24} color="#EF4444" />
                        <div>
                            <div style={{ fontWeight: 600, color: '#991B1B', fontSize: 15 }}>Could Not Verify This Document</div>
                            <div style={{ fontSize: 13, color: '#7F1D1D', marginTop: 2 }}>This document could not be verified. It may be invalid, tampered, or expired.</div>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}
