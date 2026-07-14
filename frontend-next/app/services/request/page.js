'use client';
import { useState } from 'react';
import Link from 'next/link';
import PublicShell from '@/components/PublicShell';

// ── Constants ────────────────────────────────────────────────────────────────
const SERVICE_TYPES = [
  { value: 'Barangay Clearance',          icon: 'fa-file-invoice',    desc: 'General-purpose clearance document' },
  { value: 'Business Permit Application', icon: 'fa-store',           desc: 'Barangay endorsement for businesses' },
  { value: 'Certificate of Indigency',    icon: 'fa-file-lines',      desc: 'Proof of financial need' },
  { value: 'Certificate of Residency',    icon: 'fa-house-user',      desc: 'Proof of address in the barangay' },
  { value: 'Health Services',             icon: 'fa-heartbeat',       desc: 'Medical assistance & referrals' },
  { value: 'Disaster Response',           icon: 'fa-hands-helping',   desc: 'Emergency & calamity assistance' },
];

const STATUS_COLORS = {
  'Pending':           { bg: '#fff8e1', text: '#f57f17', dot: '#fdd835' },
  'Processing':        { bg: '#e3f2fd', text: '#1565c0', dot: '#42a5f5' },
  'Ready for Pick-up': { bg: '#e8f5e9', text: '#2e7d32', dot: '#66bb6a' },
  'Completed/Claimed': { bg: '#f3e5f5', text: '#6a1b9a', dot: '#ab47bc' },
};

// ── Inline styles (consistent with existing public pages) ───────────────────
const S = {
  page:       { backgroundColor: '#f0f2f5', minHeight: '100vh', padding: '60px 20px' },
  card:       { backgroundColor: 'white', width: '100%', maxWidth: 640, margin: '0 auto', padding: '48px 44px', borderRadius: 18, boxShadow: '0 8px 40px rgba(0,0,0,0.10)' },
  label:      { display: 'block', fontSize: '0.82rem', fontWeight: 700, color: '#455a64', marginBottom: 6, textTransform: 'uppercase', letterSpacing: '0.05em' },
  input:      { width: '100%', padding: '13px 20px', border: '1.5px solid #dce1e7', borderRadius: 30, fontSize: '1rem', outline: 'none', boxSizing: 'border-box', fontFamily: 'inherit', color: '#1a237e', transition: 'border-color 0.2s' },
  select:     { width: '100%', padding: '13px 20px', border: '1.5px solid #dce1e7', borderRadius: 30, fontSize: '1rem', outline: 'none', appearance: 'none', background: 'white', cursor: 'pointer', boxSizing: 'border-box', color: '#1a237e' },
  textarea:   { width: '100%', padding: '13px 20px', border: '1.5px solid #dce1e7', borderRadius: 16, fontSize: '1rem', outline: 'none', resize: 'vertical', boxSizing: 'border-box', fontFamily: 'inherit', color: '#1a237e', minHeight: 110 },
  btn:        { width: '100%', backgroundColor: '#1565c0', color: 'white', padding: '15px', border: 'none', borderRadius: 30, fontSize: '1.05rem', fontWeight: 700, textTransform: 'uppercase', cursor: 'pointer', transition: 'background-color 0.25s, transform 0.1s', letterSpacing: '0.04em' },
  btnReset:   { width: '100%', backgroundColor: 'white', color: '#1565c0', padding: '14px', border: '2px solid #1565c0', borderRadius: 30, fontSize: '1rem', fontWeight: 700, cursor: 'pointer', transition: 'all 0.2s', letterSpacing: '0.03em' },
  err:        { backgroundColor: '#ffebee', border: '1px solid #ef9a9a', borderRadius: 10, padding: '12px 16px', color: '#c62828', fontSize: '0.88rem', fontWeight: 600, display: 'flex', alignItems: 'center', gap: 8 },
  field:      { marginBottom: 22 },
};

// ── Main Page Component ──────────────────────────────────────────────────────
export default function ServiceRequestPage() {
  const [residentName,  setResidentName]  = useState('');
  const [serviceType,   setServiceType]   = useState('');
  const [address,       setAddress]       = useState('');
  const [age,           setAge]           = useState('');
  const [civilStatus,   setCivilStatus]   = useState('');
  const [purpose,       setPurpose]       = useState('');
  const [submitting,    setSubmitting]    = useState(false);
  const [error,         setError]         = useState('');
  const [successData,   setSuccessData]   = useState(null);

  const selectedService = SERVICE_TYPES.find(s => s.value === serviceType);

  const reset = () => {
    setResidentName('');
    setServiceType('');
    setAddress('');
    setAge('');
    setCivilStatus('');
    setPurpose('');
    setError('');
    setSuccessData(null);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (!residentName.trim() || !serviceType || !address.trim() || !age || !civilStatus || !purpose.trim()) {
      setError('Please fill in all required fields before submitting.');
      return;
    }

    setSubmitting(true);
    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/services/request`, {
        method:  'POST',
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify({
          resident_name: residentName.trim(),
          service_type:  serviceType,
          address:       address.trim(),
          age:           parseInt(age),
          civil_status:  civilStatus,
          purpose:       purpose.trim(),
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || 'Submission failed. Please try again.');
      }

      setSuccessData({ tracking_no: data.tracking_no, service_type: data.service_type });
    } catch (err) {
      setError(err.message);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <PublicShell activeHref="/services">
      <div style={S.page}>

        {/* ── Success Screen ─────────────────────────────────────────────── */}
        {successData ? (
          <div style={{ ...S.card, textAlign: 'center', maxWidth: 580 }}>
            {/* Checkmark animation */}
            <div style={{ width: 80, height: 80, borderRadius: '50%', background: 'linear-gradient(135deg, #2e7d32, #43a047)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 24px' }}>
              <i className="fas fa-check" style={{ fontSize: '2.2rem', color: 'white' }}></i>
            </div>

            <h2 style={{ color: '#1a237e', fontWeight: 800, fontSize: '1.6rem', marginBottom: 6 }}>
              Request Submitted!
            </h2>
            <p style={{ color: '#546e7a', fontSize: '0.95rem', marginBottom: 32 }}>
              Your <strong>{successData.service_type}</strong> request has been received.<br />
              Please save your tracking number below.
            </p>

            {/* Tracking Number Box */}
            <div style={{ background: 'linear-gradient(135deg, #1565c0 0%, #0d47a1 100%)', borderRadius: 16, padding: '28px 24px', marginBottom: 20 }}>
              <p style={{ color: 'rgba(255,255,255,0.75)', fontSize: '0.78rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.12em', marginBottom: 10 }}>
                Your Tracking Number
              </p>
              <p style={{ color: 'white', fontSize: '2.4rem', fontWeight: 900, letterSpacing: '0.18em', fontFamily: 'monospace', margin: 0 }}>
                {successData.tracking_no}
              </p>
            </div>

            {/* Screenshot reminder */}
            <div style={{ background: '#fff8e1', border: '1px solid #ffe082', borderRadius: 12, padding: '14px 18px', marginBottom: 28, display: 'flex', alignItems: 'flex-start', gap: 10, textAlign: 'left' }}>
              <i className="fas fa-camera" style={{ color: '#f57f17', marginTop: 2, flexShrink: 0 }}></i>
              <p style={{ color: '#5d4037', fontSize: '0.87rem', lineHeight: 1.55, margin: 0, fontWeight: 600 }}>
                Please <strong>screenshot or write down</strong> this tracking number. You will need it to follow up or claim your document at the Barangay Hall.
              </p>
            </div>

            {/* Status indicator */}
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, marginBottom: 28 }}>
              <span style={{ width: 10, height: 10, borderRadius: '50%', backgroundColor: STATUS_COLORS['Pending'].dot, display: 'inline-block' }}></span>
              <span style={{ fontSize: '0.85rem', fontWeight: 700, color: STATUS_COLORS['Pending'].text }}>Status: Pending</span>
            </div>

            {/* Actions */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              <button onClick={reset} style={S.btnReset}
                onMouseEnter={e => { e.currentTarget.style.backgroundColor = '#1565c0'; e.currentTarget.style.color = 'white'; }}
                onMouseLeave={e => { e.currentTarget.style.backgroundColor = 'white'; e.currentTarget.style.color = '#1565c0'; }}>
                <i className="fas fa-plus" style={{ marginRight: 8 }}></i>Submit Another Request
              </button>
              <Link href="/services" style={{ display: 'block', textAlign: 'center', color: '#1565c0', fontWeight: 700, fontSize: '0.9rem', textDecoration: 'none', paddingTop: 4 }}>
                Back to Services
              </Link>
            </div>
          </div>

        ) : (
        /* ── Request Form ──────────────────────────────────────────────── */
          <div style={S.card}>
            {/* Header */}
            <div style={{ textAlign: 'center', marginBottom: 36 }}>
              <div style={{ width: 64, height: 64, borderRadius: '50%', background: 'linear-gradient(135deg, #1565c0, #42a5f5)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 16px' }}>
                <i className="fas fa-file-alt" style={{ fontSize: '1.6rem', color: 'white' }}></i>
              </div>
              <h1 style={{ color: '#1a237e', fontWeight: 900, fontSize: '1.7rem', marginBottom: 6, textTransform: 'uppercase', letterSpacing: '0.03em' }}>
                Service Request
              </h1>
              <p style={{ color: '#78909c', fontSize: '0.88rem', lineHeight: 1.55 }}>
                Submit your document or service request online.<br />
                You will receive a tracking number upon submission.
              </p>
            </div>

            {/* Error banner */}
            {error && (
              <div style={{ ...S.err, marginBottom: 22 }}>
                <i className="fas fa-exclamation-circle"></i>
                {error}
              </div>
            )}

            <form onSubmit={handleSubmit} noValidate>

              {/* Full Name */}
              <div style={S.field}>
                <label style={S.label}>
                  <i className="fas fa-user" style={{ marginRight: 6, color: '#1565c0' }}></i>Full Name <span style={{ color: '#e53935' }}>*</span>
                </label>
                <input
                  type="text"
                  placeholder="Enter your full name"
                  value={residentName}
                  onChange={e => setResidentName(e.target.value)}
                  required
                  style={S.input}
                  onFocus={e  => e.target.style.borderColor = '#1565c0'}
                  onBlur={e   => e.target.style.borderColor = '#dce1e7'}
                />
              </div>

              {/* Service Type */}
              <div style={S.field}>
                <label style={S.label}>
                  <i className="fas fa-concierge-bell" style={{ marginRight: 6, color: '#1565c0' }}></i>Service / Document Type <span style={{ color: '#e53935' }}>*</span>
                </label>
                <div style={{ position: 'relative' }}>
                  <select
                    value={serviceType}
                    onChange={e => setServiceType(e.target.value)}
                    required
                    style={S.select}
                    onFocus={e  => e.target.style.borderColor = '#1565c0'}
                    onBlur={e   => e.target.style.borderColor = '#dce1e7'}
                  >
                    <option value="" disabled>— Select a service —</option>
                    {SERVICE_TYPES.map(s => (
                      <option key={s.value} value={s.value}>{s.value}</option>
                    ))}
                  </select>
                  <i className="fas fa-caret-down" style={{ position: 'absolute', right: 20, top: '50%', transform: 'translateY(-50%)', color: '#546e7a', pointerEvents: 'none' }}></i>
                </div>
                {/* Inline service description hint */}
                {selectedService && (
                  <p style={{ fontSize: '0.78rem', color: '#78909c', marginTop: 6, paddingLeft: 20, fontStyle: 'italic', display: 'flex', alignItems: 'center', gap: 6 }}>
                    <i className={`fas ${selectedService.icon}`} style={{ color: '#1565c0' }}></i>
                    {selectedService.desc}
                  </p>
                )}
              </div>

              {/* Address */}
              <div style={S.field}>
                <label style={S.label}>
                  <i className="fas fa-map-marker-alt" style={{ marginRight: 6, color: '#1565c0' }}></i>Complete Address <span style={{ color: '#e53935' }}>*</span>
                </label>
                <input
                  type="text"
                  placeholder="House No., Street, Barangay Pinyahan, Quezon City"
                  value={address}
                  onChange={e => setAddress(e.target.value)}
                  required
                  style={S.input}
                  onFocus={e  => e.target.style.borderColor = '#1565c0'}
                  onBlur={e   => e.target.style.borderColor = '#dce1e7'}
                />
              </div>

              {/* Age + Civil Status — side by side */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, marginBottom: 22 }}>
                <div>
                  <label style={S.label}>
                    <i className="fas fa-birthday-cake" style={{ marginRight: 6, color: '#1565c0' }}></i>Age <span style={{ color: '#e53935' }}>*</span>
                  </label>
                  <input
                    type="number"
                    placeholder="e.g. 35"
                    min="1" max="120"
                    value={age}
                    onChange={e => setAge(e.target.value)}
                    required
                    style={S.input}
                    onFocus={e  => e.target.style.borderColor = '#1565c0'}
                    onBlur={e   => e.target.style.borderColor = '#dce1e7'}
                  />
                </div>
                <div>
                  <label style={S.label}>
                    <i className="fas fa-heart" style={{ marginRight: 6, color: '#1565c0' }}></i>Civil Status <span style={{ color: '#e53935' }}>*</span>
                  </label>
                  <div style={{ position: 'relative' }}>
                    <select
                      value={civilStatus}
                      onChange={e => setCivilStatus(e.target.value)}
                      required
                      style={S.select}
                      onFocus={e  => e.target.style.borderColor = '#1565c0'}
                      onBlur={e   => e.target.style.borderColor = '#dce1e7'}
                    >
                      <option value="" disabled>— Select —</option>
                      <option value="Single">Single</option>
                      <option value="Married">Married</option>
                      <option value="Widowed">Widowed</option>
                      <option value="Legally Separated">Legally Separated</option>
                    </select>
                    <i className="fas fa-caret-down" style={{ position: 'absolute', right: 16, top: '50%', transform: 'translateY(-50%)', color: '#546e7a', pointerEvents: 'none' }}></i>
                  </div>
                </div>
              </div>

              {/* Purpose */}
              <div style={S.field}>
                <label style={S.label}>
                  <i className="fas fa-align-left" style={{ marginRight: 6, color: '#1565c0' }}></i>Purpose of Request <span style={{ color: '#e53935' }}>*</span>
                </label>
                <textarea
                  placeholder="Briefly describe the purpose of your request (e.g., Employment, Scholarship, Travel, etc.)"
                  value={purpose}
                  onChange={e => setPurpose(e.target.value)}
                  required
                  style={S.textarea}
                  onFocus={e  => e.target.style.borderColor = '#1565c0'}
                  onBlur={e   => e.target.style.borderColor = '#dce1e7'}
                />
              </div>

              {/* Privacy notice */}
              <div style={{ background: '#e8f5e9', border: '1px solid #a5d6a7', borderRadius: 10, padding: '11px 16px', marginBottom: 24, display: 'flex', alignItems: 'flex-start', gap: 9 }}>
                <i className="fas fa-shield-alt" style={{ color: '#2e7d32', marginTop: 2, flexShrink: 0 }}></i>
                <p style={{ color: '#1b5e20', fontSize: '0.78rem', lineHeight: 1.5, margin: 0, fontWeight: 500 }}>
                  Your information is handled in accordance with the Data Privacy Act of 2012 and will only be used for processing your barangay service request.
                </p>
              </div>

              {/* Submit */}
              <button
                type="submit"
                disabled={submitting}
                style={{ ...S.btn, backgroundColor: submitting ? '#90a4ae' : '#1565c0', cursor: submitting ? 'not-allowed' : 'pointer' }}
                onMouseEnter={e => { if (!submitting) e.currentTarget.style.backgroundColor = '#0d47a1'; }}
                onMouseLeave={e => { if (!submitting) e.currentTarget.style.backgroundColor = '#1565c0'; }}
              >
                {submitting
                  ? <><i className="fas fa-spinner fa-spin" style={{ marginRight: 10 }}></i>Submitting Request…</>
                  : <><i className="fas fa-paper-plane" style={{ marginRight: 10 }}></i>Submit Request</>
                }
              </button>

              {/* Back link */}
              <div style={{ textAlign: 'center', marginTop: 18 }}>
                <Link href="/services" style={{ color: '#78909c', fontSize: '0.87rem', fontWeight: 600, textDecoration: 'none' }}>
                  Back to Services
                </Link>
              </div>
            </form>
          </div>
        )}

      </div>
    </PublicShell>
  );
}
