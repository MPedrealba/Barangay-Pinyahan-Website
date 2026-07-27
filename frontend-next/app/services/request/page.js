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

// ── Shared input classes ─────────────────────────────────────────────────────
const inputCls = 'w-full px-5 py-3.5 border-[1.5px] border-gray-200 rounded-full text-base outline-none text-[#1a237e] transition-all focus:ring-2 focus:ring-[#1565c0] focus:border-[#1565c0]';
const selectCls = 'w-full px-5 py-3.5 border-[1.5px] border-gray-200 rounded-full text-base outline-none appearance-none bg-white cursor-pointer text-[#1a237e] focus:ring-2 focus:ring-[#1565c0] focus:border-[#1565c0] transition-all';
const labelCls = 'block text-[0.82rem] font-bold text-gray-500 mb-1.5 uppercase tracking-wider';

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
      <div className="bg-[#f0f2f5] min-h-screen py-12 md:py-16 px-5">

        {/* ═══ Success Screen ═══ */}
        {successData ? (
          <div className="bg-white w-full max-w-[580px] mx-auto px-8 py-10 md:px-11 md:py-12 rounded-2xl shadow-lg text-center">
            {/* Checkmark animation */}
            <div className="w-20 h-20 rounded-full bg-gradient-to-br from-green-700 to-green-500 flex items-center justify-center mx-auto mb-6">
              <i className="fas fa-check text-[2.2rem] text-white" />
            </div>

            <h2 className="text-[#1a237e] font-extrabold text-2xl mb-1.5">
              Request Submitted!
            </h2>
            <p className="text-gray-500 text-[0.95rem] mb-8">
              Your <strong>{successData.service_type}</strong> request has been received.<br />
              Please save your tracking number below.
            </p>

            {/* Tracking Number Box */}
            <div className="bg-gradient-to-br from-[#1565c0] to-[#0d47a1] rounded-2xl px-6 py-7 mb-5">
              <p className="text-white/75 text-xs font-bold uppercase tracking-widest mb-2.5">
                Your Tracking Number
              </p>
              <p className="text-white text-3xl md:text-[2.4rem] font-black tracking-[0.18em] font-mono m-0">
                {successData.tracking_no}
              </p>
            </div>

            {/* Screenshot reminder */}
            <div className="bg-yellow-50 border border-amber-200 rounded-xl px-4 py-3.5 mb-7 flex items-start gap-2.5 text-left">
              <i className="fas fa-camera text-amber-700 mt-0.5 shrink-0" />
              <p className="text-amber-900 text-[0.87rem] leading-snug m-0 font-semibold">
                Please <strong>screenshot or write down</strong> this tracking number. You will need it to follow up or claim your document at the Barangay Hall.
              </p>
            </div>

            {/* Status indicator */}
            <div className="flex items-center justify-center gap-2 mb-7">
              <span className="w-2.5 h-2.5 rounded-full inline-block" style={{ backgroundColor: STATUS_COLORS['Pending'].dot }} />
              <span className="text-[0.85rem] font-bold" style={{ color: STATUS_COLORS['Pending'].text }}>Status: Pending</span>
            </div>

            {/* Actions */}
            <div className="flex flex-col gap-3">
              <button onClick={reset}
                className="w-full bg-white hover:bg-[#1565c0] text-[#1565c0] hover:text-white px-3.5 py-3.5 border-2 border-[#1565c0] rounded-full text-base font-bold cursor-pointer transition-all tracking-wide">
                <i className="fas fa-plus mr-2" />Submit Another Request
              </button>
              <Link href="/services" className="block text-center text-[#1565c0] font-bold text-[0.9rem] no-underline pt-1 hover:underline">
                Back to Services
              </Link>
            </div>
          </div>

        ) : (
        /* ═══ Request Form ═══ */
          <div className="bg-white w-full max-w-[640px] mx-auto px-8 py-10 md:px-11 md:py-12 rounded-2xl shadow-lg">
            {/* Header */}
            <div className="text-center mb-9">
              <div className="w-16 h-16 rounded-full bg-gradient-to-br from-[#1565c0] to-[#42a5f5] flex items-center justify-center mx-auto mb-4">
                <i className="fas fa-file-alt text-2xl text-white" />
              </div>
              <h1 className="text-[#1a237e] font-black text-xl md:text-[1.7rem] mb-1.5 uppercase tracking-wide">
                Service Request
              </h1>
              <p className="text-gray-400 text-[0.88rem] leading-snug">
                Submit your document or service request online.<br />
                You will receive a tracking number upon submission.
              </p>
            </div>

            {/* Error banner */}
            {error && (
              <div className="bg-red-50 border border-red-200 rounded-xl px-4 py-3 text-red-700 text-[0.88rem] font-semibold flex items-center gap-2 mb-5">
                <i className="fas fa-exclamation-circle" />
                {error}
              </div>
            )}

            <form onSubmit={handleSubmit} noValidate>

              {/* Full Name */}
              <div className="mb-5">
                <label className={labelCls}>
                  <i className="fas fa-user mr-1.5 text-[#1565c0]" />Full Name <span className="text-red-500">*</span>
                </label>
                <input type="text" placeholder="Enter your full name" value={residentName} onChange={e => setResidentName(e.target.value)} required
                  className={inputCls} />
              </div>

              {/* Service Type */}
              <div className="mb-5">
                <label className={labelCls}>
                  <i className="fas fa-concierge-bell mr-1.5 text-[#1565c0]" />Service / Document Type <span className="text-red-500">*</span>
                </label>
                <div className="relative">
                  <select value={serviceType} onChange={e => setServiceType(e.target.value)} required className={selectCls}>
                    <option value="" disabled>— Select a service —</option>
                    {SERVICE_TYPES.map(s => (
                      <option key={s.value} value={s.value}>{s.value}</option>
                    ))}
                  </select>
                  <i className="fas fa-caret-down absolute right-5 top-1/2 -translate-y-1/2 text-gray-500 pointer-events-none" />
                </div>
                {/* Inline service description hint */}
                {selectedService && (
                  <p className="text-xs text-gray-400 mt-1.5 pl-5 italic flex items-center gap-1.5">
                    <i className={`fas ${selectedService.icon} text-[#1565c0]`} />
                    {selectedService.desc}
                  </p>
                )}
              </div>

              {/* Address */}
              <div className="mb-5">
                <label className={labelCls}>
                  <i className="fas fa-map-marker-alt mr-1.5 text-[#1565c0]" />Complete Address <span className="text-red-500">*</span>
                </label>
                <input type="text" placeholder="House No., Street, Barangay Pinyahan, Quezon City" value={address} onChange={e => setAddress(e.target.value)} required
                  className={inputCls} />
              </div>

              {/* Age + Civil Status — side by side */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-5">
                <div>
                  <label className={labelCls}>
                    <i className="fas fa-birthday-cake mr-1.5 text-[#1565c0]" />Age <span className="text-red-500">*</span>
                  </label>
                  <input type="number" placeholder="e.g. 35" min="1" max="120" value={age} onChange={e => setAge(e.target.value)} required
                    className={inputCls} />
                </div>
                <div>
                  <label className={labelCls}>
                    <i className="fas fa-heart mr-1.5 text-[#1565c0]" />Civil Status <span className="text-red-500">*</span>
                  </label>
                  <div className="relative">
                    <select value={civilStatus} onChange={e => setCivilStatus(e.target.value)} required className={selectCls}>
                      <option value="" disabled>— Select —</option>
                      <option value="Single">Single</option>
                      <option value="Married">Married</option>
                      <option value="Widowed">Widowed</option>
                      <option value="Legally Separated">Legally Separated</option>
                    </select>
                    <i className="fas fa-caret-down absolute right-4 top-1/2 -translate-y-1/2 text-gray-500 pointer-events-none" />
                  </div>
                </div>
              </div>

              {/* Purpose */}
              <div className="mb-5">
                <label className={labelCls}>
                  <i className="fas fa-align-left mr-1.5 text-[#1565c0]" />Purpose of Request <span className="text-red-500">*</span>
                </label>
                <textarea
                  placeholder="Briefly describe the purpose of your request (e.g., Employment, Scholarship, Travel, etc.)"
                  value={purpose}
                  onChange={e => setPurpose(e.target.value)}
                  required
                  className="w-full px-5 py-3.5 border-[1.5px] border-gray-200 rounded-2xl text-base outline-none resize-y text-[#1a237e] min-h-[110px] focus:ring-2 focus:ring-[#1565c0] focus:border-[#1565c0] transition-all"
                />
              </div>

              {/* Privacy notice */}
              <div className="bg-green-50 border border-green-200 rounded-xl px-4 py-3 mb-6 flex items-start gap-2.5">
                <i className="fas fa-shield-alt text-green-700 mt-0.5 shrink-0" />
                <p className="text-green-900 text-xs leading-snug m-0 font-medium">
                  Your information is handled in accordance with the Data Privacy Act of 2012 and will only be used for processing your barangay service request.
                </p>
              </div>

              {/* Submit */}
              <button type="submit" disabled={submitting}
                className={`w-full py-4 border-0 rounded-full text-base font-bold uppercase tracking-wider text-white transition-all
                  ${submitting ? 'bg-gray-400 cursor-not-allowed opacity-60' : 'bg-[#1565c0] hover:bg-[#0d47a1] active:scale-[0.98] cursor-pointer'}`}>
                {submitting
                  ? <><i className="fas fa-spinner fa-spin mr-2.5" />Submitting Request…</>
                  : <><i className="fas fa-paper-plane mr-2.5" />Submit Request</>
                }
              </button>

              {/* Back link */}
              <div className="text-center mt-5">
                <Link href="/services" className="text-gray-400 text-[0.87rem] font-semibold no-underline hover:text-[#1565c0] transition-colors">
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
