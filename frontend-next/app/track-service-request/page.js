'use client';

import { useState, useEffect, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import Link from 'next/link';
import PublicShell from '@/components/PublicShell';

// ── Status styling and step order ──────────────────────────────────────────
const STATUS_STEPS = [
  { key: 'Pending',           label: 'Submitted',          desc: 'Request received & queued' },
  { key: 'Processing',        label: 'Processing',         desc: 'Under review & evaluation' },
  { key: 'Ready for Pick-up', label: 'Ready for Pick-up',  desc: 'Document prepared at Hall' },
  { key: 'Completed/Claimed', label: 'Completed',          desc: 'Document claimed by resident' },
];

const STATUS_CONFIG = {
  'Pending': {
    badgeCls: 'bg-amber-50 text-amber-800 border-amber-200',
    dotCls:   'bg-amber-400',
    icon:     'fa-clock',
    title:    'Request Received & Queued',
    summary:  'Your service request has been received by the Barangay Pinyahan Administrative Portal and is waiting for processing.',
    stepIndex: 0,
  },
  'Processing': {
    badgeCls: 'bg-blue-50 text-blue-800 border-blue-200',
    dotCls:   'bg-blue-500',
    icon:     'fa-spinner fa-spin',
    title:    'In Progress & Verification',
    summary:  'Our administrative staff is currently verifying your records and preparing the official certificate.',
    stepIndex: 1,
  },
  'Ready for Pick-up': {
    badgeCls: 'bg-emerald-50 text-emerald-800 border-emerald-300 ring-2 ring-emerald-500/20',
    dotCls:   'bg-emerald-500',
    icon:     'fa-check-circle',
    title:    'Document Ready for Pick-Up!',
    summary:  'Your document has been printed, signed, and is ready for claiming at Barangay Hall Cubicle 9.',
    stepIndex: 2,
  },
  'Completed/Claimed': {
    badgeCls: 'bg-purple-50 text-purple-800 border-purple-200',
    dotCls:   'bg-purple-600',
    icon:     'fa-award',
    title:    'Document Claimed & Completed',
    summary:  'This service request has been successfully completed and released to the resident.',
    stepIndex: 3,
  },
  'Rejected': {
    badgeCls: 'bg-red-50 text-red-800 border-red-200',
    dotCls:   'bg-red-500',
    icon:     'fa-times-circle',
    title:    'Request Rejected / Cancelled',
    summary:  'This request could not be processed. Please visit Barangay Hall Cubicle 9 for clarification.',
    stepIndex: -1,
  },
};

function formatDate(dateStr) {
  if (!dateStr) return 'N/A';
  return new Date(dateStr).toLocaleDateString('en-US', {
    month: 'long',
    day:   'numeric',
    year:  'numeric',
    hour:  'numeric',
    minute:'2-digit',
    hour12: true,
  });
}

// ── Inner component with search params ─────────────────────────────────────
function TrackServiceRequestContent() {
  const searchParams = useSearchParams();
  const queryTrackingNo = searchParams.get('tracking_no') || searchParams.get('ref') || '';

  const [trackingNo,   setTrackingNo]   = useState(queryTrackingNo);
  const [residentName, setResidentName] = useState('');
  const [loading,      setLoading]      = useState(false);
  const [request,      setRequest]      = useState(null);
  const [errMsg,       setErrMsg]       = useState('');
  const [copied,       setCopied]       = useState(false);

  const API_BASE = process.env.NEXT_PUBLIC_API_URL ||
    (typeof window !== 'undefined' && window.location.hostname.includes('onrender.com')
      ? 'https://barangay-pinyahan-website-bz6q.onrender.com'
      : 'http://localhost:5000');

  // Perform search
  const handleTrack = async (targetTrackingNo, targetName) => {
    const noToUse   = (targetTrackingNo !== undefined ? targetTrackingNo : trackingNo).trim();
    const nameToUse = (targetName !== undefined ? targetName : residentName).trim();

    if (!noToUse) {
      setErrMsg('Please enter your service tracking number (e.g., SRV-ABC123).');
      return;
    }

    setLoading(true);
    setErrMsg('');

    try {
      const res = await fetch(`${API_BASE}/api/services/track`, {
        method:  'POST',
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify({
          tracking_no:   noToUse,
          resident_name: nameToUse || undefined,
        }),
      });

      let data;
      try {
        data = await res.json();
      } catch {
        throw new Error(`Server returned status ${res.status}. Please check your connection.`);
      }

      if (!res.ok || !data?.request) {
        throw new Error(data?.error || 'Service request not found. Please verify your tracking number.');
      }

      setRequest(data.request);
    } catch (err) {
      setRequest(null);
      setErrMsg(err.message || 'Unable to retrieve service request details. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  // Auto-search if query param exists on mount
  useEffect(() => {
    if (queryTrackingNo) {
      setTrackingNo(queryTrackingNo);
      handleTrack(queryTrackingNo, '');
    }
  }, [queryTrackingNo]);

  const copyTrackingNo = () => {
    if (!request?.tracking_no) return;
    navigator.clipboard?.writeText(request.tracking_no);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const statusInfo = request ? (STATUS_CONFIG[request.status] || STATUS_CONFIG['Pending']) : null;
  const currentStepIdx = statusInfo?.stepIndex ?? 0;

  return (
    <div className="bg-[#f4f7fb] min-h-[75vh] py-12 md:py-16 px-4 sm:px-6 lg:px-8">
      <div className="max-w-3xl mx-auto">

        {/* Header Title */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-blue-50 text-[#006eb3] mb-3 shadow-sm border border-blue-100">
            <i className="fas fa-file-invoice text-2xl" />
          </div>
          <h1 className="text-2xl sm:text-3xl font-black text-gray-900 tracking-tight mb-2">
            Track Service Request
          </h1>
          <p className="text-sm text-gray-600 max-w-lg mx-auto">
            Check the real-time status of your Barangay Clearance, Certificate of Indigency, or Certificate of Residency.
          </p>
        </div>

        {/* ── Search Card ── */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6 sm:p-8 mb-8">
          <form
            onSubmit={(e) => {
              e.preventDefault();
              handleTrack();
            }}
            className="space-y-4"
          >
            <div>
              <label htmlFor="tracking_no" className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1.5">
                Service Tracking Number <span className="text-red-500">*</span>
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-gray-400">
                  <i className="fas fa-barcode text-sm" />
                </div>
                <input
                  id="tracking_no"
                  type="text"
                  value={trackingNo}
                  onChange={(e) => setTrackingNo(e.target.value.toUpperCase())}
                  className="w-full pl-10 pr-4 py-3 text-base font-mono font-bold tracking-widest text-gray-900 bg-gray-50/50 border border-gray-300 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#006eb3] focus:border-[#006eb3] transition-all"
                  required
                />
              </div>
            </div>

            <div>
              <label htmlFor="resident_name" className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1.5">
                Resident Full Name <span className="text-gray-400 font-normal lowercase">(optional verification)</span>
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-gray-400">
                  <i className="fas fa-user text-sm" />
                </div>
                <input
                  id="resident_name"
                  type="text"
                  value={residentName}
                  onChange={(e) => setResidentName(e.target.value)}
                  className="w-full pl-10 pr-4 py-3 text-sm text-gray-900 bg-gray-50/50 border border-gray-300 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#006eb3] focus:border-[#006eb3] transition-all"
                />
              </div>
            </div>

            {errMsg && (
              <div className="p-3 bg-red-50 border border-red-200 rounded-xl text-xs text-red-700 font-semibold flex items-center gap-2">
                <i className="fas fa-exclamation-circle text-red-500 shrink-0" />
                <span>{errMsg}</span>
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full py-3.5 px-6 text-sm font-bold text-white bg-[#006eb3] hover:bg-[#005a94] active:bg-[#004a80] rounded-xl transition-all shadow-sm hover:shadow disabled:opacity-75 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            >
              {loading ? (
                <>
                  <i className="fas fa-spinner fa-spin" />
                  <span>Searching Records…</span>
                </>
              ) : (
                <>
                  <i className="fas fa-search" />
                  <span>Track Service Request</span>
                </>
              )}
            </button>
          </form>

          {/* Quick links */}
          <div className="mt-5 pt-4 border-t border-gray-100 flex flex-wrap items-center justify-between text-xs text-gray-500 gap-2">
            <span>Don&apos;t have a tracking number yet?</span>
            <Link
              href="/services/request"
              className="font-bold text-[#006eb3] hover:underline inline-flex items-center gap-1"
            >
              <span>Submit a Service Request</span>
              <i className="fas fa-arrow-right text-[10px]" />
            </Link>
          </div>
        </div>

        {/* ── Results Section ── */}
        {request && (
          <div className="bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden animate-fadeIn">
            {/* Status Header Banner */}
            <div className="p-6 sm:p-8 bg-gradient-to-br from-blue-900 to-[#003d80] text-white">
              <div className="flex flex-wrap items-center justify-between gap-3 mb-4">
                <span className="text-xs font-bold tracking-widest uppercase text-blue-200">
                  Official Service Tracking Result
                </span>
                <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold border ${statusInfo.badgeCls}`}>
                  <span className={`w-2 h-2 rounded-full ${statusInfo.dotCls}`} />
                  <span>{request.status}</span>
                </span>
              </div>

              <div className="flex flex-col sm:flex-row sm:items-baseline justify-between gap-2">
                <div>
                  <h2 className="text-xl sm:text-2xl font-black text-white m-0">
                    {request.service_type}
                  </h2>
                  <p className="text-xs text-blue-200 mt-1">
                    Resident: <strong className="text-white">{request.resident_name}</strong>
                  </p>
                </div>

                <div className="inline-flex items-center gap-2 bg-white/10 backdrop-blur-sm border border-white/20 px-3.5 py-1.5 rounded-lg text-sm font-mono self-start sm:self-auto">
                  <span className="font-bold text-white tracking-wider">{request.tracking_no}</span>
                  <button
                    onClick={copyTrackingNo}
                    title="Copy tracking number"
                    className="text-blue-200 hover:text-white transition-colors cursor-pointer bg-transparent border-0 p-0"
                  >
                    <i className={`fas ${copied ? 'fa-check text-emerald-300' : 'fa-copy'}`} />
                  </button>
                </div>
              </div>
            </div>

            {/* 4-Stage Progress Stepper (if not rejected) */}
            {currentStepIdx >= 0 && (
              <div className="p-6 sm:p-8 border-b border-gray-100 bg-gray-50/50">
                <p className="text-xs font-bold uppercase tracking-wider text-gray-500 mb-6">
                  Application Progress
                </p>

                <div className="relative">
                  {/* Connecting line */}
                  <div className="absolute top-5 left-6 right-6 h-0.5 bg-gray-200 -z-0 hidden sm:block">
                    <div
                      className="h-full bg-[#006eb3] transition-all duration-500"
                      style={{
                        width: `${(currentStepIdx / (STATUS_STEPS.length - 1)) * 100}%`,
                      }}
                    />
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-4 gap-4 sm:gap-2 relative z-10">
                    {STATUS_STEPS.map((step, idx) => {
                      const isDone    = idx < currentStepIdx;
                      const isCurrent = idx === currentStepIdx;

                      return (
                        <div key={step.key} className="flex sm:flex-col items-center sm:text-center gap-3 sm:gap-2">
                          <div
                            className={`w-10 h-10 rounded-full flex items-center justify-center font-bold text-xs shrink-0 transition-all ${
                              isDone
                                ? 'bg-[#006eb3] text-white shadow-sm'
                                : isCurrent
                                ? 'bg-white border-2 border-[#006eb3] text-[#006eb3] ring-4 ring-blue-100 shadow-sm'
                                : 'bg-gray-100 text-gray-400 border border-gray-200'
                            }`}
                          >
                            {isDone ? (
                              <i className="fas fa-check text-sm" />
                            ) : isCurrent ? (
                              <i className="fas fa-circle text-[8px] animate-ping" />
                            ) : (
                              <span>{idx + 1}</span>
                            )}
                          </div>

                          <div>
                            <p className={`text-xs font-bold m-0 ${isCurrent ? 'text-[#006eb3]' : isDone ? 'text-gray-900' : 'text-gray-400'}`}>
                              {step.label}
                            </p>
                            <p className="text-[11px] text-gray-500 m-0 hidden sm:block">
                              {step.desc}
                            </p>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>
            )}

            {/* Status Narrative Callout */}
            <div className="p-6 sm:p-8 border-b border-gray-100">
              <div className={`p-4 rounded-xl border flex items-start gap-3.5 ${statusInfo.badgeCls}`}>
                <i className={`fas ${statusInfo.icon} text-lg mt-0.5 shrink-0`} />
                <div>
                  <h3 className="text-sm font-bold m-0 mb-1">
                    {statusInfo.title}
                  </h3>
                  <p className="text-xs leading-relaxed m-0 opacity-90">
                    {statusInfo.summary}
                  </p>
                </div>
              </div>
            </div>

            {/* Request Details Grid */}
            <div className="p-6 sm:p-8">
              <h3 className="text-xs font-bold uppercase tracking-wider text-gray-500 mb-4">
                Application Summary
              </h3>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-y-4 gap-x-6 text-xs sm:text-sm">
                <div className="border-b border-gray-100 pb-2.5">
                  <span className="block text-gray-500 text-xs mb-0.5">Tracking Number</span>
                  <span className="font-mono font-bold text-gray-900">{request.tracking_no}</span>
                </div>

                <div className="border-b border-gray-100 pb-2.5">
                  <span className="block text-gray-500 text-xs mb-0.5">Service Requested</span>
                  <span className="font-semibold text-gray-900">{request.service_type}</span>
                </div>

                <div className="border-b border-gray-100 pb-2.5">
                  <span className="block text-gray-500 text-xs mb-0.5">Resident Name</span>
                  <span className="font-semibold text-gray-900">{request.resident_name}</span>
                </div>

                {request.requestor && (
                  <div className="border-b border-gray-100 pb-2.5">
                    <span className="block text-gray-500 text-xs mb-0.5">Authorized Requestor</span>
                    <span className="font-semibold text-gray-900">{request.requestor}</span>
                  </div>
                )}

                <div className="border-b border-gray-100 pb-2.5">
                  <span className="block text-gray-500 text-xs mb-0.5">Purpose</span>
                  <span className="font-semibold text-gray-900">{request.purpose}</span>
                </div>

                {request.address && (
                  <div className="border-b border-gray-100 pb-2.5">
                    <span className="block text-gray-500 text-xs mb-0.5">Registered Address</span>
                    <span className="font-semibold text-gray-900">{request.address}</span>
                  </div>
                )}

                <div className="border-b border-gray-100 pb-2.5">
                  <span className="block text-gray-500 text-xs mb-0.5">Date Submitted</span>
                  <span className="font-semibold text-gray-900">{formatDate(request.created_at)}</span>
                </div>

                <div className="border-b border-gray-100 pb-2.5">
                  <span className="block text-gray-500 text-xs mb-0.5">Last Status Update</span>
                  <span className="font-semibold text-gray-900">{formatDate(request.updated_at || request.created_at)}</span>
                </div>

                {request.processed_by && (
                  <div className="border-b border-gray-100 pb-2.5 sm:col-span-2">
                    <span className="block text-gray-500 text-xs mb-0.5">Attending Officer</span>
                    <span className="font-semibold text-gray-900">{request.processed_by}</span>
                  </div>
                )}
              </div>

              {/* Claiming Instructions Callout */}
              <div className="mt-8 bg-amber-50/70 border border-amber-200 rounded-xl p-4 sm:p-5">
                <div className="flex items-start gap-3">
                  <i className="fas fa-landmark text-amber-700 text-base mt-0.5 shrink-0" />
                  <div className="text-xs text-amber-900 space-y-1.5">
                    <p className="font-bold text-sm text-amber-950 m-0">
                      Barangay Hall Claiming Instructions
                    </p>
                    <p className="m-0 leading-relaxed">
                      Please proceed to <strong>Cubicle No. 9</strong> at the Barangay Pinyahan Hall (Malakas St., Diliman, Quezon City).
                    </p>
                    <ul className="list-disc list-inside space-y-1 pt-1 text-[11px] text-amber-900">
                      <li>Present this tracking number: <strong className="font-mono">{request.tracking_no}</strong></li>
                      <li>Bring one (1) valid government-issued ID showing your Barangay Pinyahan address.</li>
                      <li><strong>Important 3-Day Policy:</strong> Documents must be claimed within 3 business days of preparation.</li>
                    </ul>
                  </div>
                </div>
              </div>

              {/* Actions Footer */}
              <div className="mt-6 flex flex-wrap items-center justify-end gap-3 pt-4 border-t border-gray-100">
                <button
                  type="button"
                  onClick={() => {
                    setRequest(null);
                    setTrackingNo('');
                    setResidentName('');
                  }}
                  className="text-xs font-semibold text-[#006eb3] hover:underline cursor-pointer bg-transparent border-0 inline-flex items-center gap-1.5"
                >
                  <i className="fas fa-search text-[11px]" />
                  <span>Track Another Request</span>
                </button>
              </div>
            </div>
          </div>
        )}

      </div>
    </div>
  );
}

export default function TrackServiceRequestPage() {
  return (
    <PublicShell activeHref="/track-service-request">
      <Suspense fallback={
        <div className="min-h-[60vh] flex items-center justify-center">
          <div className="text-center">
            <i className="fas fa-spinner fa-spin text-3xl text-[#006eb3] mb-3" />
            <p className="text-sm font-semibold text-gray-600">Loading service tracking…</p>
          </div>
        </div>
      }>
        <TrackServiceRequestContent />
      </Suspense>
    </PublicShell>
  );
}
