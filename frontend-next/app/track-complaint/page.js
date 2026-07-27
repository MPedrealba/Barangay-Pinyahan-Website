'use client';
import { useState } from 'react';
import PublicShell from '@/components/PublicShell';

const STATUS_CLASS = { 'Pending': 'pending', 'On-Going': 'on-going', 'Resolved': 'resolved' };
const URGENCY_BG   = { low: '#e8f5e9', medium: '#fff3e0', high: '#ffebee', critical: '#b71c1c' };
const URGENCY_CLR  = { low: '#2e7d32', medium: '#e65100', high: '#c62828', critical: '#fff' };

function formatDate(str) {
  return new Date(str).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' });
}

export default function TrackComplaintPage() {
  const [refNo,      setRefNo]      = useState('');
  const [fullName,   setFullName]   = useState('');
  const [tracking,   setTracking]   = useState(false);
  const [complaint,  setComplaint]  = useState(null);
  const [modalOpen,  setModalOpen]  = useState(false);
  const [errMsg,     setErrMsg]     = useState('');

  const handleTrack = async (e) => {
    e.preventDefault();
    if (!refNo || !fullName) { setErrMsg('Please fill all fields.'); return; }
    setTracking(true);
    setErrMsg('');
    try {
      const res  = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/complaints/track`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ref_no: refNo, full_name: fullName }),
      });
      const data = await res.json();
      if (data?.complaint) {
        setComplaint(data.complaint);
        setModalOpen(true);
      } else {
        setErrMsg('Complaint not found. Please check your reference number and full name.');
      }
    } catch {
      setErrMsg('Unable to connect. Please try again.');
    } finally {
      setTracking(false);
    }
  };

  const c = complaint;
  const daysPending = c ? Math.floor((Date.now() - new Date(c.submitted_at)) / 86400000) : 0;
  const escalated   = c && daysPending >= 7 && c.status !== 'Resolved';
  const photoSrc    = c?.photo_url ? (c.photo_url.startsWith('http') ? c.photo_url : `${process.env.NEXT_PUBLIC_API_URL}${c.photo_url}`) : null;

  const statusStyle = c ? (() => {
    const s = STATUS_CLASS[c.status];
    if (s === 'pending')  return 'bg-orange-50 text-orange-700';
    if (s === 'on-going') return 'bg-blue-50 text-blue-800';
    return 'bg-green-50 text-green-700';
  })() : '';

  return (
    <PublicShell activeHref="/track-complaint">

      {/* ═══ Complaint Detail Modal ═══ */}
      {modalOpen && c && (
        <div onClick={() => setModalOpen(false)}
          className="fixed inset-0 bg-black/50 flex items-center justify-center z-[1000] p-4">
          <div onClick={e => e.stopPropagation()}
            className="bg-white rounded-2xl px-6 py-8 md:px-7 md:py-8 w-full max-w-[560px] max-h-[85vh] overflow-y-auto relative shadow-2xl animate-modalIn">
            <button onClick={() => setModalOpen(false)}
              className="absolute top-3 right-4 bg-transparent border-0 text-2xl cursor-pointer text-gray-400 hover:text-gray-700 transition-colors">
              &times;
            </button>

            {/* Escalation warning */}
            {escalated && (
              <div className="bg-red-500 text-white px-4 py-3 rounded-md mb-5 text-center font-bold text-sm">
                <i className="fas fa-exclamation-triangle mr-1" />
                This complaint has been unresolved for {daysPending} day{daysPending > 1 ? 's' : ''}. It has been escalated to HIGH urgency.
              </div>
            )}

            <h2 className="text-[1.15rem] font-extrabold text-[#003366] text-center mb-5">COMPLAINT DETAILS</h2>

            {[
              ['Reference No:', c.ref_no],
              ['Name:',         c.full_name],
              ['Category:',     c.category || c.complaint_type],
              ['Date Filed:',   formatDate(c.submitted_at)],
            ].map(([label, val]) => (
              <div key={label} className="flex mb-2.5 text-[0.92rem]">
                <strong className="min-w-[120px] md:min-w-[130px] text-gray-800 shrink-0">{label}</strong>
                <span className="text-gray-600">{val}</span>
              </div>
            ))}

            {/* Status badge */}
            <div className="flex mb-2.5 text-[0.92rem] items-center">
              <strong className="min-w-[120px] md:min-w-[130px] text-gray-800 shrink-0">Status:</strong>
              <span className={`inline-block px-3 py-0.5 rounded text-xs font-bold ${statusStyle}`}>{c.status}</span>
            </div>

            {/* Urgency badge */}
            <div className="flex mb-2.5 text-[0.92rem] items-center">
              <strong className="min-w-[120px] md:min-w-[130px] text-gray-800 shrink-0">Urgency Level:</strong>
              <span className="inline-block px-3 py-0.5 rounded text-xs font-extrabold uppercase border border-current"
                style={{
                  background: URGENCY_BG[c.urgency_level?.toLowerCase()] || '#f5f5f5',
                  color:      URGENCY_CLR[c.urgency_level?.toLowerCase()] || '#333',
                }}>{c.urgency_level?.toUpperCase()}</span>
            </div>

            <div className="text-[0.85rem] font-extrabold text-[#003366] uppercase mt-5 mb-2 border-b-2 border-[#003366] inline-block pb-0.5">Complaint Message</div>
            <div className="bg-gray-50 border border-gray-200 rounded-md p-3.5 text-[0.9rem] text-gray-600 leading-relaxed">{c.message || 'No message provided.'}</div>

            <div className="text-[0.85rem] font-extrabold text-[#003366] uppercase mt-5 mb-2 border-b-2 border-[#003366] inline-block pb-0.5">Admin Notes</div>
            <div className="bg-gray-50 border border-gray-200 rounded-md p-3.5 text-[0.9rem] text-gray-600 leading-relaxed">{c.admin_notes || 'Your complaint is currently under review.'}</div>

            {photoSrc && (
              <>
                <div className="text-[0.85rem] font-extrabold text-[#003366] uppercase mt-5 mb-2 block">Evidence Photo</div>
                <img src={photoSrc} alt="Complaint Photo" className="w-full max-h-[280px] object-cover rounded-lg shadow-sm" />
              </>
            )}

            <div className="text-center mt-6">
              <button onClick={() => setModalOpen(false)}
                className="bg-[#5d9ccb] hover:bg-[#4a8ab8] text-white px-10 py-3 border-0 rounded-full text-lg font-bold cursor-pointer transition-colors">
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ═══ Track Section ═══ */}
      <section className="bg-white py-16 md:py-20 px-5 flex justify-center min-h-[60vh]">
        <div className="w-full max-w-[700px]">

          {/* Header */}
          <div className="flex items-center gap-4 mb-6">
            <i className="fas fa-map-marker-alt text-4xl md:text-[2.5rem] text-[#0056b3]" />
            <h2 className="text-2xl md:text-[2.2rem] font-extrabold text-[#0056b3] m-0">Track Your Complaint</h2>
          </div>

          {/* Card */}
          <div className="bg-white rounded-2xl shadow-lg p-8 md:p-10 border border-gray-100">
            <form onSubmit={handleTrack}>
              <div className="mb-5">
                <input type="text" placeholder="Complaint Reference Number" value={refNo} onChange={e => setRefNo(e.target.value)} required
                  className="w-full px-6 py-4 border border-gray-300 rounded-full text-base md:text-lg outline-none focus:ring-2 focus:ring-[#0056b3] focus:border-[#0056b3] transition-all" />
              </div>
              <div className="mb-5">
                <input type="text" placeholder="Full Name" value={fullName} onChange={e => setFullName(e.target.value)} required
                  className="w-full px-6 py-4 border border-gray-300 rounded-full text-base md:text-lg outline-none focus:ring-2 focus:ring-[#0056b3] focus:border-[#0056b3] transition-all" />
              </div>

              {errMsg && (
                <p className="text-red-700 text-[0.9rem] mb-3 text-center font-semibold">{errMsg}</p>
              )}

              <div className="flex justify-center mt-5">
                <button type="submit" disabled={tracking}
                  className={`px-10 py-3 border-0 rounded-full text-base md:text-lg font-bold text-white transition-all cursor-pointer
                    ${tracking ? 'bg-gray-400 cursor-not-allowed opacity-60' : 'bg-[#5d9ccb] hover:bg-[#4a8ab8] active:scale-[0.97]'}`}>
                  {tracking ? 'Tracking...' : 'Track Complaint'}
                </button>
              </div>
            </form>
          </div>
        </div>
      </section>

      {/* Modal animation */}
      <style>{`
        @keyframes modalIn { from { opacity:0; transform:translateY(-15px); } to { opacity:1; transform:translateY(0); } }
        .animate-modalIn { animation: modalIn 0.25s ease; }
      `}</style>
    </PublicShell>
  );
}
