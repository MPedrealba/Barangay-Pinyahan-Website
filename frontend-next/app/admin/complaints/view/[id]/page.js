'use client';
import { useState, useEffect, use } from 'react';
import { useRouter } from 'next/navigation';

export default function ComplaintView({ params }) {
  const unwrappedParams = use(params);
  const id = unwrappedParams.id;
  
  const router = useRouter();
  const [complaint, setComplaint] = useState(null);
  const [isEditing, setIsEditing] = useState(false);
  const [status, setStatus] = useState('Pending');
  const [notes, setNotes] = useState('');
  const [loading, setLoading] = useState(true);
  const [offenseData, setOffenseData] = useState(null);
  const [showOffenseModal, setShowOffenseModal] = useState(false);
  const [offenseLoading, setOffenseLoading] = useState(false);
  const [editingAccused, setEditingAccused] = useState(false);
  const [accusedDraft, setAccusedDraft] = useState('');
  const [savingAccused, setSavingAccused] = useState(false);

  useEffect(() => {
    const fetchComplaint = async () => {
      try {
        const token = localStorage.getItem('token');
        const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/complaints/admin/${id}`, {
          headers: { 'Authorization': `Bearer ${token}` }
        });
        if (res.ok) {
          const data = await res.json();
          setComplaint(data.complaint);
          
          const statusMap = { 'Pending': 'pending', 'On-Going': 'on-going', 'Resolved': 'resolved' };
          setStatus(statusMap[data.complaint.status] || 'pending');
          setNotes(data.complaint.admin_notes || '');
        }
      } catch (err) {
        console.error('Failed to load complaint:', err);
      } finally {
        setLoading(false);
      }
    };
    fetchComplaint();
  }, [id]);

  const handleSave = async () => {
    const statusMap = { 'pending': 'Pending', 'on-going': 'On-Going', 'resolved': 'Resolved' };
    const updatedStatus = statusMap[status];

    try {
      const token = localStorage.getItem('token');
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/complaints/admin/${id}`, {
        method: 'PUT',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}` 
        },
        body: JSON.stringify({ status: updatedStatus, admin_notes: notes })
      });

      if (res.ok) {
        alert('✅ Saved Successfully!');
        router.push('/admin/complaints');
      } else {
        alert('Failed to save changes.');
      }
    } catch (err) {
      console.error(err);
      alert('Error saving complaint.');
    }
  };

  if (loading) return <div className="p-8 text-center text-gray-500 font-bold mt-10">Loading complaint details...</div>;
  if (!complaint) return <div className="p-8 text-center text-red-500 font-bold mt-10">Complaint not found.</div>;

  const dateStr = new Date(complaint.submitted_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
  const timeStr = new Date(complaint.submitted_at).toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true });

  const getUrgencyColor = (level) => {
    const l = (level || '').toLowerCase();
    if (l === 'high') return 'border-red-500 text-red-600';
    if (l === 'medium') return 'border-orange-500 text-orange-600';
    return 'border-green-500 text-green-600';
  };

  const getUrgencyDot = (level) => {
    const l = (level || '').toLowerCase();
    if (l === 'high') return 'bg-red-500';
    if (l === 'medium') return 'bg-orange-500';
    return 'bg-green-500';
  };

  const fetchOffenseHistory = async () => {
    if (!complaint?.accused_name) return;
    setOffenseLoading(true);
    try {
      const token = localStorage.getItem('token');
      const res = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/api/complaints/admin/offense-history/${encodeURIComponent(complaint.accused_name)}`,
        { headers: { 'Authorization': `Bearer ${token}` } }
      );
      if (res.ok) {
        const data = await res.json();
        setOffenseData(data);
        setShowOffenseModal(true);
      }
    } catch (err) {
      console.error('Failed to fetch offense history:', err);
    } finally {
      setOffenseLoading(false);
    }
  };

  const saveAccusedName = async () => {
    setSavingAccused(true);
    try {
      const token = localStorage.getItem('token');
      const res = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/api/complaints/admin/${id}/accused`,
        {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
          body: JSON.stringify({ accused_name: accusedDraft })
        }
      );
      if (res.ok) {
        setComplaint(prev => ({ ...prev, accused_name: accusedDraft.trim() || null }));
        setEditingAccused(false);
      }
    } catch (err) {
      console.error('Failed to update accused name:', err);
    } finally {
      setSavingAccused(false);
    }
  };

  return (
    <div className="p-6 md:p-8 max-w-5xl mx-auto">
      {/* ── Offense History Modal ── */}
      {showOffenseModal && offenseData && (
        <div onClick={() => setShowOffenseModal(false)}
          className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div onClick={e => e.stopPropagation()}
            className="bg-white rounded-2xl shadow-2xl w-[94%] max-w-lg p-7 max-h-[85vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-5">
              <h3 className="text-[15px] font-black text-[#002B5B] uppercase tracking-wide flex items-center gap-2">
                <i className="fas fa-user-shield text-orange-500"></i> Offense History
              </h3>
              <button onClick={() => setShowOffenseModal(false)} className="text-gray-400 hover:text-gray-600 text-lg">
                <i className="fas fa-times"></i>
              </button>
            </div>

            {/* Summary */}
            <div className={`rounded-xl p-4 mb-5 border ${offenseData.total_offenses > 2 ? 'bg-red-50 border-red-200' : offenseData.total_offenses > 1 ? 'bg-orange-50 border-orange-200' : 'bg-green-50 border-green-200'}`}>
              <p className="text-sm font-bold text-gray-800 mb-1">
                <span className="text-[13px]">{offenseData.accused_name}</span>
              </p>
              <p className="text-2xl font-black text-gray-900">
                {offenseData.total_offenses} {offenseData.total_offenses === 1 ? 'Offense' : 'Offenses'}
              </p>
              {offenseData.categories.length > 0 && (
                <div className="flex flex-wrap gap-1.5 mt-2">
                  {offenseData.categories.map(cat => (
                    <span key={cat} className="text-[10px] font-bold bg-white px-2 py-0.5 rounded-full border border-gray-200 text-gray-600">{cat}</span>
                  ))}
                </div>
              )}
            </div>

            {/* Detailed list */}
            {offenseData.history.length > 0 && (
              <div className="space-y-2">
                {offenseData.history.map((h, idx) => (
                  <div key={h.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg border border-gray-100 text-sm">
                    <div className="flex items-center gap-3">
                      <span className="w-6 h-6 rounded-full bg-gray-200 text-gray-600 text-xs font-black flex items-center justify-center">{idx + 1}</span>
                      <div>
                        <p className="font-semibold text-gray-800">{h.category || h.complaint_type}</p>
                        <p className="text-xs text-gray-400">{h.ref_no} · {new Date(h.submitted_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}</p>
                      </div>
                    </div>
                    <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                      h.status === 'Resolved' ? 'bg-green-100 text-green-700' :
                      h.status === 'On-Going' ? 'bg-blue-100 text-blue-700' :
                      'bg-yellow-100 text-yellow-700'
                    }`}>{h.status}</span>
                  </div>
                ))}
              </div>
            )}

            <button onClick={() => setShowOffenseModal(false)}
              className="mt-5 w-full bg-[#0056b3] text-white py-2.5 rounded-lg font-bold text-sm hover:bg-blue-800 transition-colors">
              Close
            </button>
          </div>
        </div>
      )}

      {/* The exact Card layout */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-8">
        
        {/* Header & Status Dropdown */}
        <div className="flex justify-between items-center mb-8 border-b border-gray-100 pb-4">
          <h2 className="text-[15px] font-black text-[#002B5B] flex items-center gap-2 uppercase tracking-wide">
            <i className="fas fa-file-alt text-[#0056b3]"></i> COMPLAINT DETAILS
          </h2>
          
          <div className="flex items-center gap-3">
            <span className="text-sm font-black text-gray-900 uppercase">STATUS:</span>
            <select 
              disabled={!isEditing}
              value={status}
              onChange={(e) => setStatus(e.target.value)}
              className="border border-gray-400 rounded px-4 py-2 text-sm text-gray-800 bg-white min-w-[160px] focus:outline-none focus:border-[#0056b3] disabled:bg-white disabled:text-gray-700"
            >
              <option value="pending">Pending</option>
              <option value="on-going">On-Going</option>
              <option value="resolved">Resolved</option>
            </select>
          </div>
        </div>

        {/* Details 2-Column Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-x-12 gap-y-5 mb-8">
          
          {/* LEFT COLUMN */}
          <div className="space-y-5">
            <div>
              <span className="block text-[11px] font-bold text-gray-400 uppercase tracking-widest mb-1">Name</span>
              <span className="block text-[14px] font-bold text-gray-900">{complaint.full_name}</span>
            </div>
            <div>
              <span className="block text-[11px] font-bold text-gray-400 uppercase tracking-widest mb-1">Ref No.</span>
              <span className="block text-[14px] font-bold text-gray-900">{complaint.ref_no}</span>
            </div>
            <div>
              <span className="block text-[11px] font-bold text-gray-400 uppercase tracking-widest mb-1">Date & Time</span>
              <span className="block text-[14px] font-bold text-gray-900">{dateStr} at {timeStr}</span>
            </div>
            <div>
              <span className="block text-[11px] font-bold text-gray-400 uppercase tracking-widest mb-2">Urgency Level</span>
              <div className="flex items-center gap-2">
                <span className={`w-2 h-2 rounded-full ${getUrgencyDot(complaint.urgency_level)}`}></span>
                <span className={`px-2 py-0.5 rounded text-[11px] font-bold tracking-wider uppercase border ${getUrgencyColor(complaint.urgency_level)}`}>
                  {complaint.urgency_level}
                </span>
              </div>
            </div>
            {/* Accused Person — Inline Editable */}
            <div>
              <span className="block text-[11px] font-bold text-gray-400 uppercase tracking-widest mb-1">Accused Person</span>
              {editingAccused ? (
                <div className="flex items-center gap-2 flex-wrap">
                  <input
                    type="text"
                    value={accusedDraft}
                    onChange={e => setAccusedDraft(e.target.value)}
                    placeholder="Enter accused name"
                    className="border border-blue-300 rounded-lg px-3 py-1.5 text-[14px] font-bold text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-200 w-48"
                    autoFocus
                  />
                  <button
                    onClick={saveAccusedName}
                    disabled={savingAccused}
                    className="text-[11px] font-bold text-white bg-green-600 px-3 py-1.5 rounded-lg hover:bg-green-700 transition-colors flex items-center gap-1 disabled:opacity-50"
                  >
                    <i className={`fas ${savingAccused ? 'fa-spinner fa-spin' : 'fa-check'} text-[10px]`}></i>
                    {savingAccused ? 'Saving...' : 'Save'}
                  </button>
                  <button
                    onClick={() => setEditingAccused(false)}
                    className="text-[11px] font-bold text-gray-500 hover:text-gray-700 px-2"
                  >
                    Cancel
                  </button>
                </div>
              ) : complaint.accused_name ? (
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="text-[14px] font-bold text-gray-900">{complaint.accused_name}</span>
                  <button
                    onClick={() => { setAccusedDraft(complaint.accused_name); setEditingAccused(true); }}
                    className="text-[11px] font-bold text-blue-600 bg-blue-50 border border-blue-200 px-2 py-0.5 rounded-lg hover:bg-blue-100 transition-colors"
                  >
                    <i className="fas fa-pen text-[9px]"></i>
                  </button>
                  <button
                    onClick={fetchOffenseHistory}
                    disabled={offenseLoading}
                    className="text-[11px] font-bold text-orange-600 bg-orange-50 border border-orange-200 px-2.5 py-1 rounded-lg hover:bg-orange-100 transition-colors flex items-center gap-1 disabled:opacity-50"
                  >
                    <i className={`fas ${offenseLoading ? 'fa-spinner fa-spin' : 'fa-search'} text-[10px]`}></i>
                    {offenseLoading ? 'Checking...' : 'Check History'}
                  </button>
                </div>
              ) : (
                <div className="flex items-center gap-2">
                  <span className="text-[14px] text-gray-400 italic">N/A</span>
                  <button
                    onClick={() => { setAccusedDraft(''); setEditingAccused(true); }}
                    className="text-[11px] font-bold text-blue-600 bg-blue-50 border border-blue-200 px-2.5 py-1 rounded-lg hover:bg-blue-100 transition-colors flex items-center gap-1"
                  >
                    <i className="fas fa-plus text-[9px]"></i> Add
                  </button>
                </div>
              )}
            </div>
          </div>

          {/* RIGHT COLUMN */}
          <div className="space-y-5">
            <div>
              <span className="block text-[11px] font-bold text-gray-400 uppercase tracking-widest mb-1">Contact</span>
              <span className="block text-[14px] font-bold text-gray-900">{complaint.contact_number || 'N/A'}</span>
            </div>
            <div>
              <span className="block text-[11px] font-bold text-gray-400 uppercase tracking-widest mb-1">Address</span>
              <span className="block text-[14px] font-bold text-gray-900">{complaint.address || 'N/A'}</span>
            </div>
            <div>
              <span className="block text-[11px] font-bold text-gray-400 uppercase tracking-widest mb-1">Category</span>
              <span className="block text-[14px] font-bold text-gray-900">{complaint.category || complaint.complaint_type}</span>
            </div>
          </div>

        </div>

        {/* Complaint Details Message Box */}
        <div className="mb-6">
          <span className="block text-[11px] font-bold text-gray-400 uppercase tracking-widest mb-2">Details</span>
          <div className="bg-gray-50 border border-gray-100 rounded-lg p-5 text-[14px] text-gray-800 leading-relaxed whitespace-pre-wrap">
            {complaint.message}
          </div>
        </div>

        {/* Uploaded Image Space */}
        {complaint.photo_url && (
          <div className="mb-8">
            <span className="block text-[11px] font-bold text-gray-400 uppercase tracking-widest mb-2">Attached Photo</span>
            <img 
              src={`${process.env.NEXT_PUBLIC_API_URL}${complaint.photo_url.startsWith('/') ? '' : '/'}${complaint.photo_url}`} 
              alt="Evidence" 
              className="w-full max-w-md rounded-lg border border-gray-200 shadow-sm"
            />
          </div>
        )}

        {/* Admin Notes Box */}
        <div className="mb-6">
          <span className="block text-[11px] font-bold text-gray-400 uppercase tracking-widest mb-2">Admin Notes</span>
          <textarea 
            disabled={!isEditing}
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            className="w-full min-h-[120px] p-4 border border-gray-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-[#0056b3] disabled:bg-white disabled:text-gray-800 resize-y text-[14px]"
          ></textarea>
        </div>

        {/* ── Resolution Audit Trail ──────────────────────────────── */}
        {complaint.status === 'Resolved' && (
          <div className="mb-6 bg-green-50 border border-green-200 rounded-xl p-5">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <span className="block text-[11px] font-bold text-green-600 uppercase tracking-widest mb-1">Resolved By</span>
                <span className="block text-[14px] font-bold text-gray-900 flex items-center gap-2">
                  <i className="fas fa-user-shield text-green-600 text-xs"></i>
                  {complaint.resolved_by || <span className="text-gray-400 italic">Legacy Data</span>}
                </span>
              </div>
              <div>
                <span className="block text-[11px] font-bold text-green-600 uppercase tracking-widest mb-1">Date Resolved</span>
                <span className="block text-[14px] font-bold text-gray-900 flex items-center gap-2">
                  <i className="fas fa-clock text-green-600 text-xs"></i>
                  {complaint.resolved_at 
                    ? new Date(complaint.resolved_at).toLocaleString('en-US', { month: 'short', day: 'numeric', year: 'numeric', hour: 'numeric', minute: '2-digit', hour12: true })
                    : <span className="text-gray-400 italic">Legacy Data</span>
                  }
                </span>
              </div>
            </div>
          </div>
        )}

{/* Fixed Buttons Layout (Edit / Back) */}
        <div className="flex justify-end items-center gap-5 pt-4">
          {!isEditing ? (
            <>
              <button 
                onClick={() => setIsEditing(true)} 
                className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2 rounded-md font-bold text-sm transition-colors flex items-center gap-2 shadow-sm"
              >
                <i className="fas fa-edit"></i> Edit
              </button>
              <button 
                onClick={() => router.push('/admin/complaints')} 
                className="text-gray-900 font-bold text-sm hover:underline px-2"
              >
                Back
              </button>
            </>
          ) : (
            <>
              <button 
                onClick={handleSave} 
                className="bg-green-600 hover:bg-green-700 text-white px-6 py-2 rounded-md font-bold text-sm transition-colors flex items-center gap-2 shadow-sm"
              >
                <i className="fas fa-save"></i> Save
              </button>
              <button 
                onClick={() => setIsEditing(false)} 
                className="text-gray-900 font-bold text-sm hover:underline px-2"
              >
                Cancel
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  );
}