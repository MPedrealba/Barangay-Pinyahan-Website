'use client';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

const STATUS_OPTS = ['Pending', 'Processing', 'Ready for Pick-up', 'Completed/Claimed'];

const STATUS_STYLE = {
  'Pending':           { bg: '#fff8e1', text: '#f57f17', dot: '#fdd835' },
  'Processing':        { bg: '#e3f2fd', text: '#1565c0', dot: '#42a5f5' },
  'Ready for Pick-up': { bg: '#e8f5e9', text: '#2e7d32', dot: '#66bb6a' },
  'Completed/Claimed': { bg: '#ede7f6', text: '#6a1b9a', dot: '#ab47bc' },
};

function StatusBadge({ status }) {
  const s = STATUS_STYLE[status] || STATUS_STYLE['Pending'];
  return (
    <span style={{ background: s.bg, color: s.text, display: 'inline-flex', alignItems: 'center', gap: 5, padding: '3px 10px', borderRadius: 20, fontSize: 11, fontWeight: 700 }}>
      <span style={{ width: 7, height: 7, borderRadius: '50%', background: s.dot, display: 'inline-block' }}></span>
      {status}
    </span>
  );
}

function formatDate(str) {
  if (!str) return '—';
  return new Date(str).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
}

export default function ServiceRequestsAdminPage() {
  const router = useRouter();
  const [requests,      setRequests]      = useState([]);
  const [loading,       setLoading]       = useState(true);
  const [filterStatus,  setFilterStatus]  = useState('');
  const [searchQuery,   setSearchQuery]   = useState('');
  const [updatingId,    setUpdatingId]    = useState(null);
  const [showHistory,   setShowHistory]   = useState(false);

  const fetchRequests = async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem('token');
      const qs    = filterStatus ? `?status=${encodeURIComponent(filterStatus)}` : '';
      const res   = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/admin/service-requests${qs}`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (res.ok) {
        const data = await res.json();
        setRequests(data.requests || []);
      }
    } catch (err) {
      console.error('Fetch error:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchRequests(); }, [filterStatus]);

  const handleStatusChange = async (id, newStatus) => {
    setUpdatingId(id);
    try {
      const token = localStorage.getItem('token');
      const res = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/api/admin/service-requests/${id}/status`,
        {
          method:  'PATCH',
          headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
          body:    JSON.stringify({ status: newStatus }),
        }
      );
      if (res.ok) {
        const data = await res.json();
        setRequests(prev => prev.map(r =>
          r.id === id
            ? { ...r, status: newStatus, processed_by: data.processed_by ?? r.processed_by }
            : r
        ));
      }
    } catch (err) {
      console.error('Status update error:', err);
    } finally {
      setUpdatingId(null);
    }
  };

  // Client-side filter: history mode shows only Completed/Claimed, active hides it
  const filtered = requests.filter(r => {
    // History toggle
    if (showHistory && r.status !== 'Completed/Claimed') return false;
    if (!showHistory && r.status === 'Completed/Claimed') return false;

    // Status dropdown filter (only relevant in active mode)
    if (!showHistory && filterStatus && r.status !== filterStatus) return false;

    // Text search
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      return (
        r.tracking_no?.toLowerCase().includes(q) ||
        r.resident_name?.toLowerCase().includes(q) ||
        r.service_type?.toLowerCase().includes(q)
      );
    }
    return true;
  });

  // Summary counts
  const counts = STATUS_OPTS.reduce((acc, s) => {
    acc[s] = requests.filter(r => r.status === s).length;
    return acc;
  }, {});

  return (
    <div className="p-6 md:p-8 max-w-7xl mx-auto">

      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-4 mb-8">
        <div>
          <h1 className="text-xl font-black text-[#002B5B] flex items-center gap-2 uppercase tracking-wide">
            <i className="fas fa-file-alt text-[#0056b3]"></i> Online Service Requests
          </h1>
          <p className="text-sm text-gray-500 mt-1">Manage and process citizen document requests</p>
        </div>
        {/* History Toggle */}
        <button
          onClick={() => { setShowHistory(h => !h); setFilterStatus(''); setSearchQuery(''); }}
          className={`flex items-center gap-2 px-5 py-2.5 rounded-lg font-bold text-sm transition-all border-2 ${
            showHistory
              ? 'bg-[#6a1b9a] text-white border-[#6a1b9a] shadow-md'
              : 'bg-white text-[#6a1b9a] border-[#6a1b9a] hover:bg-purple-50'
          }`}
        >
          <i className={`fas ${showHistory ? 'fa-list' : 'fa-history'}`}></i>
          {showHistory ? 'Show Active Requests' : 'Service Request History'}
        </button>
      </div>

      {/* Summary Cards — only in active view */}
      {!showHistory && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
          {STATUS_OPTS.map(s => {
            const style = STATUS_STYLE[s];
            return (
              <button key={s} onClick={() => setFilterStatus(filterStatus === s ? '' : s)}
                className={`rounded-xl p-4 text-left border-2 transition-all ${filterStatus === s ? 'border-[#0056b3] shadow-md' : 'border-transparent'}`}
                style={{ background: style.bg }}>
                <p className="text-2xl font-black" style={{ color: style.text }}>{counts[s] || 0}</p>
                <p className="text-[11px] font-bold mt-1" style={{ color: style.text, opacity: 0.8 }}>{s}</p>
              </button>
            );
          })}
        </div>
      )}

      {/* Filters Row */}
      <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-4 mb-5 flex flex-wrap gap-3 items-center">
        <div className="relative flex-1 min-w-[200px]">
          <i className="fas fa-search absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 text-sm"></i>
          <input
            type="text"
            placeholder={showHistory ? 'Search history by name, tracking no., or service…' : 'Search by name, tracking no., or service…'}
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-4 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-200"
          />
        </div>
        {!showHistory && (
          <select value={filterStatus} onChange={e => setFilterStatus(e.target.value)}
            className="border border-gray-200 rounded-lg px-3 py-2 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-blue-200 font-semibold text-gray-700">
            <option value="">All Active Statuses</option>
            {STATUS_OPTS.filter(s => s !== 'Completed/Claimed').map(s => <option key={s} value={s}>{s}</option>)}
          </select>
        )}
        {(filterStatus || searchQuery) && (
          <button onClick={() => { setFilterStatus(''); setSearchQuery(''); }}
            className="text-xs font-bold text-gray-500 hover:text-gray-800 flex items-center gap-1">
            <i className="fas fa-times"></i> Clear
          </button>
        )}
        <span className="text-xs text-gray-400 font-medium ml-auto">{filtered.length} record{filtered.length !== 1 ? 's' : ''}</span>
      </div>

      {/* Table */}
      <div className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-x-auto">
        <table className="w-full border-collapse text-sm">
          <thead>
            <tr className="bg-gray-50 text-gray-500 text-[11px] uppercase tracking-wider">
              <th className="px-5 py-3.5 text-left font-bold">Tracking No.</th>
              <th className="px-5 py-3.5 text-left font-bold">Resident</th>
              <th className="px-5 py-3.5 text-left font-bold">Service Type</th>
              <th className="px-5 py-3.5 text-left font-bold">Date</th>
              <th className="px-5 py-3.5 text-left font-bold">Status</th>
              <th className="px-5 py-3.5 text-left font-bold">Processed By</th>
              <th className="px-5 py-3.5 text-center font-bold">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {loading ? (
              [...Array(5)].map((_, i) => (
                <tr key={i}>
            {[...Array(7)].map((_, j) => (
                    <td key={j} className="px-5 py-4">
                      <div className="h-4 bg-gray-100 rounded animate-pulse"></div>
                    </td>
                  ))}
                </tr>
              ))
            ) : filtered.length === 0 ? (
              <tr>
                <td colSpan="7" className="px-5 py-16 text-center text-gray-400">
                  <i className="fas fa-inbox text-4xl block mb-3 opacity-40"></i>
                  <p className="font-semibold">No service requests found.</p>
                </td>
              </tr>
            ) : filtered.map(r => (
              <tr key={r.id} className="hover:bg-gray-50 transition-colors">
                <td className="px-5 py-3.5">
                  <span className="font-mono font-black text-[#0056b3] text-[13px]">{r.tracking_no}</span>
                </td>
                <td className="px-5 py-3.5">
                  <p className="font-bold text-gray-900 text-[13px]">{r.resident_name}</p>
                  {r.address && <p className="text-[11px] text-gray-400 truncate max-w-[180px]">{r.address}</p>}
                </td>
                <td className="px-5 py-3.5">
                  <p className="text-gray-700 font-medium text-[13px]">{r.service_type}</p>
                  {r.purpose && <p className="text-[11px] text-gray-400 truncate max-w-[180px]" title={r.purpose}>{r.purpose}</p>}
                </td>
                <td className="px-5 py-3.5 text-gray-500 text-[12px]">{formatDate(r.created_at)}</td>
                <td className="px-5 py-3.5">
                  <div className="relative">
                    <select
                      value={r.status}
                      onChange={e => handleStatusChange(r.id, e.target.value)}
                      disabled={updatingId === r.id}
                      className="text-[11px] font-bold rounded-full pl-3 pr-7 py-1.5 border-0 outline-none appearance-none cursor-pointer disabled:opacity-50"
                      style={{
                        background: STATUS_STYLE[r.status]?.bg || '#f5f5f5',
                        color:      STATUS_STYLE[r.status]?.text || '#333',
                      }}
                    >
                      {STATUS_OPTS.map(s => <option key={s} value={s}>{s}</option>)}
                    </select>
                    <i className="fas fa-caret-down absolute right-2 top-1/2 -translate-y-1/2 text-[10px] pointer-events-none"
                       style={{ color: STATUS_STYLE[r.status]?.text || '#333' }}></i>
                  </div>
                </td>
                {/* Processed By */}
                <td className="px-5 py-3.5">
                  {r.processed_by
                    ? <span className="text-[12px] font-semibold text-gray-700 flex items-center gap-1.5">
                        <i className="fas fa-user-check text-green-500 text-[10px]"></i>
                        {r.processed_by}
                      </span>
                    : <span className="text-[12px] text-gray-300 font-medium">—</span>
                  }
                </td>
                <td className="px-5 py-3.5">
                  <div className="flex items-center justify-center gap-2">
                    <Link
                      href={`/admin/services/pdf/${r.id}`}
                      title="View & Download PDF"
                      className="flex items-center gap-1.5 bg-[#0056b3] text-white text-[11px] font-bold px-3 py-1.5 rounded-lg hover:bg-blue-800 transition-colors"
                    >
                      <i className="fas fa-file-pdf"></i> PDF
                    </Link>
                    {r.status !== 'Completed/Claimed' && (
                      <button
                        onClick={() => handleStatusChange(r.id, 'Completed/Claimed')}
                        disabled={updatingId === r.id}
                        title="Mark as Completed/Claimed"
                        className="flex items-center gap-1.5 bg-green-600 hover:bg-green-700 disabled:bg-gray-300 text-white text-[11px] font-bold px-3 py-1.5 rounded-lg transition-colors"
                      >
                        <i className={`fas ${updatingId === r.id ? 'fa-spinner fa-spin' : 'fa-check-circle'}`}></i>
                        {updatingId === r.id ? '…' : 'Mark Done'}
                      </button>
                    )}
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

    </div>
  );
}
