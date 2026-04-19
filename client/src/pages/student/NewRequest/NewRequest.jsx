import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../../context/AuthContext';
import PageLayout from '../../../components/Layout/PageLayout';
import api from '../../../api/axios';
import Step1_SelectType from './Step1_SelectType';
import Step2_FillForm from './Step2_FillForm';
import Step3_Preview from './Step3_Preview';

export default function NewRequest() {
    const { user } = useAuth();
    const navigate = useNavigate();
    const [step, setStep] = useState(1);
    const [selectedType, setSelectedType] = useState('');
    const [formData, setFormData] = useState({});
    const [files, setFiles] = useState([]);
    const [submitting, setSubmitting] = useState(false);

    const handleSubmit = async () => {
        setSubmitting(true);
        try {
            const fd = new FormData();
            fd.append('type', selectedType);
            fd.append('formData', JSON.stringify(formData));
            files.forEach(f => fd.append('files', f));
            await api.post('/requests', fd);
            navigate('/dashboard');
        } catch (err) {
            alert(err.response?.data?.message || 'Submission failed');
        } finally {
            setSubmitting(false);
        }
    };

    return (
        <PageLayout>
            <div className="page-title">New Request</div>
            <div className="page-subtitle">Submit a request</div>

            {/* Step progress bar */}
            <div className="step-bar" style={{ marginBottom: 28 }}>
                {[1, 2, 3].map((s, idx) => (
                    <div key={s} style={{ display: 'flex', alignItems: 'center', gap: 8, flex: idx < 2 ? 1 : 'none' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                            <span className={`step-num ${step > s ? 'done' : step === s ? 'active' : 'upcoming'}`}>
                                {step > s ? '✓' : s}
                            </span>
                            <span className="step-label" style={{ color: step === s ? 'var(--navy)' : 'var(--text-secondary)', fontSize: 13 }}>
                                {['Select Type', 'Fill Form', 'Preview & Submit'][idx]}
                            </span>
                        </div>
                        {idx < 2 && <div style={{ flex: 1, height: 1, background: 'var(--border)', margin: '0 8px' }} />}
                    </div>
                ))}
            </div>

            {step === 1 && (
                <Step1_SelectType
                    selected={selectedType}
                    onSelect={t => { setSelectedType(t); setStep(2); }}
                />
            )}
            {step === 2 && (
                <Step2_FillForm
                    type={selectedType}
                    user={user}
                    formData={formData}
                    onChange={setFormData}
                    onFiles={setFiles}
                    onBack={() => setStep(1)}
                    onNext={() => setStep(3)}
                />
            )}
            {step === 3 && (
                <Step3_Preview
                    type={selectedType}
                    formData={formData}
                    files={files}
                    onBack={() => setStep(2)}
                    onSubmit={handleSubmit}
                    submitting={submitting}
                />
            )}
        </PageLayout>
    );
}
