'use client';
import { useState } from 'react';
import Link from 'next/link';
import PublicShell from '@/components/PublicShell';

// ── Document types & their conditional fields ────────────────────────────────
const DOCUMENT_TYPES = [
  {
    value:  'Barangay Clearance',
    icon:   'fa-file-invoice',
    desc:   'Standard clearance for employment and general requirements.',
    fields: ['yearsOfResidency'],
  },
  {
    value:  'Barangay Clearance - No Derogatory',
    icon:   'fa-shield-alt',
    desc:   'Certification of no derogatory record or pending cases.',
    fields: ['yearsOfResidency'],
  },
  {
    value:  'Certificate of Indigency',
    icon:   'fa-file-lines',
    desc:   'Certification for financial, medical, or educational assistance.',
    fields: ['age', 'birthdate', 'requestor'],
  },
  {
    value:  'Certificate of Residency',
    icon:   'fa-house-user',
    desc:   'Official proof of residency within the barangay.',
    fields: ['civilStatus', 'birthdate', 'yearsOfResidency'],
  },
];

const PURPOSE_OPTIONS = [
  'Employment / Work Requirement',
  'Business Permit Application',
  'School / Scholarship Requirement',
  'Financial Assistance',
  'Medical Assistance',
  'Bank Account Opening',
  'Other',
];

const STATUS_COLORS = {
  'Pending':           { dot: '#fdd835' },
  'Processing':        { dot: '#42a5f5' },
  'Ready for Pick-up': { dot: '#66bb6a' },
  'Completed/Claimed': { dot: '#ab47bc' },
};

// ── CSS classes ───────────────────────────────────────────────────────────────
const inputCls  = 'w-full px-5 py-3.5 border-[1.5px] border-gray-200 rounded-full text-base outline-none text-[#1a237e] transition-all focus:ring-2 focus:ring-[#1565c0] focus:border-[#1565c0]';
const selectCls = 'w-full px-5 py-3.5 border-[1.5px] border-gray-200 rounded-full text-base outline-none appearance-none bg-white cursor-pointer text-[#1a237e] focus:ring-2 focus:ring-[#1565c0] focus:border-[#1565c0] transition-all';
const labelCls  = 'block text-[0.82rem] font-bold text-gray-500 mb-1.5 uppercase tracking-wider';

// ── Main Component ────────────────────────────────────────────────────────────
export default function ServiceRequestPage() {
  // Always-visible fields
  const [residentName,  setResidentName]  = useState('');
  const [address,       setAddress]       = useState('');
  const [selectedDoc,   setSelectedDoc]   = useState('');
  const [purpose,       setPurpose]       = useState('');

  // Clearance / No Derogatory fields
  const [yearsOfResidency, setYearsOfResidency] = useState('');

  // Indigency fields
  const [age,       setAge]       = useState('');
  const [birthdate, setBirthdate] = useState('');
  const [requestor, setRequestor] = useState('');

  // Residency fields
  const [civilStatus, setCivilStatus] = useState('');
  // birthdate & yearsOfResidency shared above

  const [submitting,  setSubmitting]  = useState(false);
  const [error,       setError]       = useState('');
  const [successData, setSuccessData] = useState(null);

  const docType = DOCUMENT_TYPES.find(d => d.value === selectedDoc);
  const showField = (f) => docType?.fields.includes(f);

  const reset = () => {
    setResidentName(''); setAddress(''); setSelectedDoc(''); setPurpose('');
    setYearsOfResidency(''); setAge(''); setBirthdate(''); setRequestor('');
    setCivilStatus(''); setError(''); setSuccessData(null);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (!residentName.trim() || !selectedDoc || !address.trim() || !purpose) {
      setError('Please fill in all required fields before submitting.');
      return;
    }

    setSubmitting(true);
    try {
      const body = {
        resident_name: residentName.trim(),
        service_type:  selectedDoc,
        address:       address.trim(),
        purpose,
        // Conditional fields — only send if relevant to this document type
        ...(showField('yearsOfResidency') && yearsOfResidency ? { years_of_residency: parseInt(yearsOfResidency) } : {}),
        ...(showField('age')       && age       ? { age: parseInt(age) }       : {}),
        ...(showField('birthdate') && birthdate ? { birthdate }                : {}),
        ...(showField('requestor') && requestor ? { requestor: requestor.trim() } : {}),
        ...(showField('civilStatus') && civilStatus ? { civil_status: civilStatus } : {}),
      };

      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/services/request`, {
        method:  'POST',
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify(body),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Submission failed. Please try again.');
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
            <div className="w-20 h-20 rounded-full bg-gradient-to-br from-green-700 to-green-500 flex items-center justify-center mx-auto mb-6">
              <i className="fas fa-check text-[2.2rem] text-white" />
            </div>
            <h2 className="text-[#1a237e] font-extrabold text-2xl mb-1.5">Request Submitted!</h2>
            <p className="text-gray-500 text-[0.95rem] mb-8">
              Your <strong>{successData.service_type}</strong> request has been received.<br />
              Please save your tracking number below.
            </p>

            <div className="bg-gradient-to-br from-[#1565c0] to-[#0d47a1] rounded-2xl px-6 py-7 mb-5">
              <p className="text-white/75 text-xs font-bold uppercase tracking-widest mb-2.5">Your Tracking Number</p>
              <p className="text-white text-3xl md:text-[2.4rem] font-black tracking-[0.18em] font-mono m-0">
                {successData.tracking_no}
              </p>
            </div>

            <div className="bg-yellow-50 border border-amber-200 rounded-xl px-4 py-3.5 mb-4 flex items-start gap-2.5 text-left">
              <i className="fas fa-camera text-amber-700 mt-0.5 shrink-0" />
              <p className="text-amber-900 text-[0.87rem] leading-snug m-0 font-semibold">
                Please <strong>screenshot or write down</strong> this tracking number. You will need it to follow up or claim your document at the Barangay Hall.
              </p>
            </div>

            {/* 3-Day Retention Policy Warning */}
            <div className="bg-red-50 border-2 border-red-300 rounded-xl px-4 py-3.5 mb-7 flex items-start gap-2.5 text-left">
              <i className="fas fa-exclamation-triangle text-red-600 mt-0.5 shrink-0" />
              <p className="text-red-800 text-[0.87rem] leading-snug m-0 font-semibold">
                <strong>Important 3-Day Policy:</strong> Requested documents must be claimed at the Barangay Hall within <strong>3 days</strong> of submission. After 3 days, your request and tracking number will be <strong>permanently deleted</strong> from the system.
              </p>
            </div>

            <div className="flex items-center justify-center gap-2 mb-7">
              <span className="w-2.5 h-2.5 rounded-full inline-block" style={{ backgroundColor: STATUS_COLORS['Pending'].dot }} />
              <span className="text-[0.85rem] font-bold text-amber-700">Status: Pending</span>
            </div>

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

            {/* Error */}
            {error && (
              <div className="bg-red-50 border border-red-200 rounded-xl px-4 py-3 text-red-700 text-[0.88rem] font-semibold flex items-center gap-2 mb-5">
                <i className="fas fa-exclamation-circle" />{error}
              </div>
            )}

            <form onSubmit={handleSubmit} noValidate>

              {/* ── Full Name ── */}
              <div className="mb-5">
                <label className={labelCls}>
                  <i className="fas fa-user mr-1.5 text-[#1565c0]" />Full Name <span className="text-red-500">*</span>
                </label>
                <input type="text" placeholder="Enter your full name"
                  value={residentName} onChange={e => setResidentName(e.target.value)} required
                  className={inputCls} />
              </div>

              {/* ── Address ── */}
              <div className="mb-5">
                <label className={labelCls}>
                  <i className="fas fa-map-marker-alt mr-1.5 text-[#1565c0]" />Complete Address <span className="text-red-500">*</span>
                </label>
                <input type="text" placeholder="House No., Street, Barangay Pinyahan, Quezon City"
                  value={address} onChange={e => setAddress(e.target.value)} required
                  className={inputCls} />
              </div>

              {/* ── Document Type ── */}
              <div className="mb-5">
                <label className={labelCls}>
                  <i className="fas fa-concierge-bell mr-1.5 text-[#1565c0]" />Document / Service Type <span className="text-red-500">*</span>
                </label>
                <div className="relative">
                  <select value={selectedDoc} onChange={e => setSelectedDoc(e.target.value)} required className={selectCls}>
                    <option value="" disabled>— Select a document —</option>
                    {DOCUMENT_TYPES.map(d => (
                      <option key={d.value} value={d.value}>{d.value}</option>
                    ))}
                  </select>
                  <i className="fas fa-caret-down absolute right-5 top-1/2 -translate-y-1/2 text-gray-500 pointer-events-none" />
                </div>
                {docType && (
                  <p className="text-xs text-gray-400 mt-1.5 pl-5 italic flex items-center gap-1.5">
                    <i className={`fas ${docType.icon} text-[#1565c0]`} />{docType.desc}
                  </p>
                )}
              </div>

              {/* ── Purpose ── */}
              <div className="mb-5">
                <label className={labelCls}>
                  <i className="fas fa-clipboard mr-1.5 text-[#1565c0]" />Purpose <span className="text-red-500">*</span>
                </label>
                <div className="relative">
                  <select value={purpose} onChange={e => setPurpose(e.target.value)} required className={selectCls}>
                    <option value="" disabled>— Select a purpose —</option>
                    {PURPOSE_OPTIONS.map(p => (
                      <option key={p} value={p}>{p}</option>
                    ))}
                  </select>
                  <i className="fas fa-caret-down absolute right-5 top-1/2 -translate-y-1/2 text-gray-500 pointer-events-none" />
                </div>
              </div>

              {/* ── Conditional: Years of Residency (Clearance types + Residency) ── */}
              {showField('yearsOfResidency') && (
                <div className="mb-5">
                  <label className={labelCls}>
                    <i className="fas fa-home mr-1.5 text-[#1565c0]" />Years of Residency
                  </label>
                  <input type="number" placeholder="e.g. 5" min="1" max="100"
                    value={yearsOfResidency} onChange={e => setYearsOfResidency(e.target.value)}
                    className={inputCls} />
                </div>
              )}

              {/* ── Conditional: Age (Indigency) ── */}
              {showField('age') && (
                <div className="mb-5">
                  <label className={labelCls}>
                    <i className="fas fa-birthday-cake mr-1.5 text-[#1565c0]" />Age
                  </label>
                  <input type="number" placeholder="e.g. 35" min="1" max="120"
                    value={age} onChange={e => setAge(e.target.value)}
                    className={inputCls} />
                </div>
              )}

              {/* ── Conditional: Birthdate (Indigency + Residency) ── */}
              {showField('birthdate') && (
                <div className="mb-5">
                  <label className={labelCls}>
                    <i className="fas fa-calendar mr-1.5 text-[#1565c0]" />Date of Birth
                  </label>
                  <input type="date"
                    value={birthdate} onChange={e => setBirthdate(e.target.value)}
                    className={inputCls} />
                </div>
              )}

              {/* ── Conditional: Requestor Name (Indigency) ── */}
              {showField('requestor') && (
                <div className="mb-5">
                  <label className={labelCls}>
                    <i className="fas fa-user-tag mr-1.5 text-[#1565c0]" />Requestor Name
                  </label>
                  <input type="text" placeholder="Name of person requesting (if different from above)"
                    value={requestor} onChange={e => setRequestor(e.target.value)}
                    className={inputCls} />
                </div>
              )}

              {/* ── Conditional: Civil Status (Residency) ── */}
              {showField('civilStatus') && (
                <div className="mb-5">
                  <label className={labelCls}>
                    <i className="fas fa-ring mr-1.5 text-[#1565c0]" />Civil Status
                  </label>
                  <div className="relative">
                    <select value={civilStatus} onChange={e => setCivilStatus(e.target.value)} className={selectCls}>
                      <option value="" disabled>— Select —</option>
                      <option value="Single">Single</option>
                      <option value="Married">Married</option>
                      <option value="Widowed">Widowed</option>
                      <option value="Legally Separated">Legally Separated</option>
                    </select>
                    <i className="fas fa-caret-down absolute right-5 top-1/2 -translate-y-1/2 text-gray-500 pointer-events-none" />
                  </div>
                </div>
              )}

              {/* Privacy notice */}
              <div className="bg-green-50 border border-green-200 rounded-xl px-4 py-3 mb-4 flex items-start gap-2.5">
                <i className="fas fa-shield-alt text-green-700 mt-0.5 shrink-0" />
                <p className="text-green-900 text-xs leading-snug m-0 font-medium">
                  Your information is handled in accordance with the Data Privacy Act of 2012 and will only be used for processing your barangay service request.
                </p>
              </div>

              {/* 3-Day Retention Policy Acknowledgment */}
              <label className="flex items-start gap-3 bg-amber-50 border-2 border-amber-300 rounded-xl px-4 py-3.5 mb-6 cursor-pointer select-none">
                <input type="checkbox" required
                  className="mt-0.5 w-5 h-5 shrink-0 accent-[#1565c0] cursor-pointer" />
                <span className="text-amber-900 text-[0.82rem] leading-snug font-semibold">
                  I understand that requested documents must be claimed at the Barangay Hall within <strong>3 days</strong>, or the request and tracking number will be <strong>permanently deleted</strong> from the system.
                </span>
              </label>

              {/* Submit */}
              <button type="submit" disabled={submitting}
                className={`w-full py-4 border-0 rounded-full text-base font-bold uppercase tracking-wider text-white transition-all
                  ${submitting ? 'bg-gray-400 cursor-not-allowed opacity-60' : 'bg-[#1565c0] hover:bg-[#0d47a1] active:scale-[0.98] cursor-pointer'}`}>
                {submitting
                  ? <><i className="fas fa-spinner fa-spin mr-2.5" />Submitting Request…</>
                  : <><i className="fas fa-paper-plane mr-2.5" />Submit Request</>
                }
              </button>

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
