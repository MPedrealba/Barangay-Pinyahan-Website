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

  return (
    <div className="p-6 md:p-8 max-w-5xl mx-auto">
      {/* The exact Card layout from image_301d7f.png */}
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