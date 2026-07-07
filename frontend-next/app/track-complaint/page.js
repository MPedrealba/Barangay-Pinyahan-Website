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

  return (
    <PublicShell activeHref="/track-complaint">

      {/* Complaint Detail Modal */}
      {modalOpen && c && (
        <div onClick={() => setModalOpen(false)}
          style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000 }}>
          <div onClick={e => e.stopPropagation()}
            style={{ background: 'white', borderRadius: 14, padding: '32px 28px', width: '94%', maxWidth: 560, maxHeight: '85vh', overflowY: 'auto', position: 'relative', boxShadow: '0 10px 40px rgba(0,0,0,0.2)', animation: 'modalIn 0.25s ease' }}>
            <button onClick={() => setModalOpen(false)}
              style={{ position: 'absolute', top: 12, right: 16, background: 'none', border: 'none', fontSize: '1.6rem', cursor: 'pointer', color: '#888' }}>
              &times;
            </button>

            {/* Escalation warning */}
            {escalated && (
              <div style={{ background: '#d9534f', color: 'white', padding: '12px 16px', borderRadius: 6, marginBottom: 18, textAlign: 'center', fontWeight: 700 }}>
                <i className="fas fa-exclamation-triangle"></i>{' '}
                This complaint has been unresolved for {daysPending} day{daysPending > 1 ? 's' : ''}. It has been escalated to HIGH urgency.
              </div>
            )}

            <h2 style={{ fontSize: '1.15rem', fontWeight: 800, color: '#003366', textAlign: 'center', marginBottom: 20 }}>COMPLAINT DETAILS</h2>

            {[
              ['Reference No:', c.ref_no],
              ['Name:',         c.full_name],
              ['Category:',     c.category || c.complaint_type],
              ['Date Filed:',   formatDate(c.submitted_at)],
            ].map(([label, val]) => (
              <div key={label} style={{ display: 'flex', marginBottom: 10, fontSize: '0.92rem' }}>
                <strong style={{ minWidth: 130, color: '#222' }}>{label}</strong>
                <span style={{ color: '#444' }}>{val}</span>
              </div>
            ))}

            {/* Status badge */}
            <div style={{ display: 'flex', marginBottom: 10, fontSize: '0.92rem' }}>
              <strong style={{ minWidth: 130, color: '#222' }}>Status:</strong>
              <span style={{
                display: 'inline-block', padding: '3px 12px', borderRadius: 4, fontSize: '0.78rem', fontWeight: 700,
                background: STATUS_CLASS[c.status] === 'pending' ? '#fff3e0' : STATUS_CLASS[c.status] === 'on-going' ? '#e3f2fd' : '#e8f5e9',
                color:      STATUS_CLASS[c.status] === 'pending' ? '#e65100' : STATUS_CLASS[c.status] === 'on-going' ? '#0d47a1' : '#2e7d32',
              }}>{c.status}</span>
            </div>

            {/* Urgency badge */}
            <div style={{ display: 'flex', marginBottom: 10, fontSize: '0.92rem' }}>
              <strong style={{ minWidth: 130, color: '#222' }}>Urgency Level:</strong>
              <span style={{ display: 'inline-block', padding: '3px 12px', borderRadius: 4, fontSize: '0.78rem', fontWeight: 800, textTransform: 'uppercase', border: '1px solid currentColor',
                background: URGENCY_BG[c.urgency_level?.toLowerCase()] || '#f5f5f5',
                color:      URGENCY_CLR[c.urgency_level?.toLowerCase()] || '#333',
              }}>{c.urgency_level?.toUpperCase()}</span>
            </div>

            <div style={{ fontSize: '0.85rem', fontWeight: 800, color: '#003366', textTransform: 'uppercase', margin: '18px 0 8px', borderBottom: '2px solid #003366', display: 'inline-block', paddingBottom: 2 }}>Complaint Message</div>
            <div style={{ background: '#f5f7fa', border: '1px solid #e0e0e0', borderRadius: 6, padding: 14, fontSize: '0.9rem', color: '#444', lineHeight: 1.6 }}>{c.message || 'No message provided.'}</div>

            <div style={{ fontSize: '0.85rem', fontWeight: 800, color: '#003366', textTransform: 'uppercase', margin: '18px 0 8px', borderBottom: '2px solid #003366', display: 'inline-block', paddingBottom: 2 }}>Admin Notes</div>
            <div style={{ background: '#f5f7fa', border: '1px solid #e0e0e0', borderRadius: 6, padding: 14, fontSize: '0.9rem', color: '#444', lineHeight: 1.6 }}>{c.admin_notes || 'Your complaint is currently under review.'}</div>

            {photoSrc && (
              <>
                <div style={{ fontSize: '0.85rem', fontWeight: 800, color: '#003366', textTransform: 'uppercase', margin: '18px 0 8px', display: 'block' }}>Evidence Photo</div>
                <img src={photoSrc} alt="Complaint Photo" style={{ width: '100%', maxHeight: 280, objectFit: 'cover', borderRadius: 8, boxShadow: '0 2px 8px rgba(0,0,0,0.1)' }} />
              </>
            )}

            <div style={{ textAlign: 'center', marginTop: 24 }}>
              <button onClick={() => setModalOpen(false)}
                style={{ background: '#5d9ccb', color: 'white', padding: '12px 40px', border: 'none', borderRadius: 25, fontSize: '1.1rem', fontWeight: 700, cursor: 'pointer' }}>
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Track Section */}
      <section style={{ padding: '80px 20px', backgroundColor: 'white', display: 'flex', justifyContent: 'center', minHeight: '60vh' }}>
        <div style={{ width: '100%', maxWidth: 700 }}>

          {/* Header */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 15, marginBottom: 25 }}>
            <i className="fas fa-map-marker-alt" style={{ fontSize: '2.5rem', color: '#0056b3' }}></i>
            <h2 style={{ fontSize: '2.2rem', fontWeight: 800, color: '#0056b3', margin: 0 }}>Track Your Complaint</h2>
          </div>

          {/* Card */}
          <div style={{ backgroundColor: 'white', borderRadius: 15, boxShadow: '0 5px 20px rgba(0,0,0,0.15)', padding: 40, border: '1px solid #eee' }}>
            <form onSubmit={handleTrack}>
              <div style={{ marginBottom: 20 }}>
                <input type="text" placeholder="Complaint Reference Number" value={refNo} onChange={e => setRefNo(e.target.value)} required
                  style={{ width: '100%', padding: '15px 25px', border: '1px solid #ccc', borderRadius: 25, fontSize: '1.1rem', outline: 'none', boxSizing: 'border-box', marginBottom: 10 }} />
              </div>
              <div style={{ marginBottom: 20 }}>
                <input type="text" placeholder="Full Name" value={fullName} onChange={e => setFullName(e.target.value)} required
                  style={{ width: '100%', padding: '15px 25px', border: '1px solid #ccc', borderRadius: 25, fontSize: '1.1rem', outline: 'none', boxSizing: 'border-box', marginBottom: 10 }} />
              </div>

              {errMsg && (
                <p style={{ color: '#c62828', fontSize: '0.9rem', marginBottom: 12, textAlign: 'center' }}>{errMsg}</p>
              )}

              <div style={{ display: 'flex', justifyContent: 'center', marginTop: 20 }}>
                <button type="submit" disabled={tracking}
                  style={{ backgroundColor: tracking ? '#90a4ae' : '#5d9ccb', color: 'white', padding: '12px 40px', border: 'none', borderRadius: 25, fontSize: '1.1rem', fontWeight: 700, cursor: tracking ? 'not-allowed' : 'pointer' }}>
                  {tracking ? 'Tracking...' : 'Track Complaint'}
                </button>
              </div>
            </form>
          </div>
        </div>
      </section>

      <style>{`@keyframes modalIn { from { opacity:0; transform:translateY(-15px); } to { opacity:1; transform:translateY(0); } }`}</style>
    </PublicShell>
  );
}
