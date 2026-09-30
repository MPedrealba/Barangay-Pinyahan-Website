'use client';

import { useState, useEffect, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { apiGet, apiPatch } from '@/lib/api';

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

function ServiceRequestsContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [error,         setError]         = useState(null);
  const [requests,      setRequests]      = useState([]);
  const [loading,       setLoading]       = useState(true);
  const [filterStatus,  setFilterStatus]  = useState('');
  const [searchQuery,   setSearchQuery]   = useState(searchParams.get('search') || '');
  const [updatingId,    setUpdatingId]    = useState(null);
  const [showHistory,   setShowHistory]   = useState(false);

  // Claim History Modal State
  const [selectedResident,    setSelectedResident]    = useState(null);
  const [claimHistoryLoading, setClaimHistoryLoading] = useState(false);
  const [claimHistoryData,    setClaimHistoryData]    = useState(null);
  const [showClaimModal,      setShowClaimModal]      = useState(false);

  useEffect(() => {
    const urlQuery = searchParams.get('search');
    if (urlQuery) {
      setSearchQuery(urlQuery);
    }
  }, [searchParams]);

  const fetchRequests = async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await apiGet('/api/admin/service-requests');
      setRequests(data?.requests || []);
    } catch (err) {
      console.error('Fetch error:', err);
      setError(err.message || 'Unable to connect to server. Please check your backend connection.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRequests();
  }, []);

  const openClaimHistory = async (residentName) => {
    if (!residentName?.trim()) return;
    const trimmed = residentName.trim();
    setSelectedResident(trimmed);
    setShowClaimModal(true);
    setClaimHistoryLoading(true);
    setClaimHistoryData(null);

    try {
      const data = await apiGet(`/api/admin/service-requests/claim-history/${encodeURIComponent(trimmed)}`);
      setClaimHistoryData(data);
    } catch (err) {
      console.error('Failed to fetch claim history:', err);
    } finally {
      setClaimHistoryLoading(false);
    }
  };

  const handleStatusChange = async (id, newStatus) => {
    setUpdatingId(id);
    try {
      await apiPatch(`/api/admin/service-requests/${id}/status`, {
        status: newStatus
      });
      // Re-fetch all requests to refresh sequence numbers, counts, and First-Time Free badges
      await fetchRequests();
    } catch (err) {
      console.error('Status update error:', err);
      alert(err.message || 'Network error while updating status.');
    } finally {
      setUpdatingId(null);
    }
  };

  // Filter requests based on selected status, history view mode, and search query
  const filtered = requests.filter(r => {
    if (filterStatus) {
      // Direct status filter overrides active/history grouping
      if (r.status !== filterStatus) return false;
    } else {
      // Default view when no single status filter is clicked
      if (showHistory && r.status !== 'Completed/Claimed') return false;
      if (!showHistory && r.status === 'Completed/Claimed') return false;
    }

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

  // Global counts computed across all requests (never wiped out by local table filtering)
  const counts = STATUS_OPTS.reduce((acc, s) => {
    acc[s] = requests.filter(r => r.status === s).length;
    return acc;
  }, {});

  return (
    <div className="p-6 md:p-8 max-w-[1500px] w-full mx-auto">

      {/* ── Resident Service Claim History Modal ── */}
      {showClaimModal && (
        <div
          onClick={() => setShowClaimModal(false)}
          className="fixed inset-0 bg-black/50 backdrop-blur-xs flex items-center justify-center z-50 p-4"
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl max-h-[90vh] flex flex-col overflow-hidden animate-in fade-in zoom-in-95 duration-150"
          >
            {/* Modal Header */}
            <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between bg-gradient-to-r from-blue-900 to-[#0056b3] text-white">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-xl bg-white/10 flex items-center justify-center text-base">
                  <i className="fas fa-history text-purple-200"></i>
                </div>
                <div>
                  <h3 className="text-base font-black tracking-wide uppercase">
                    Resident Service Claim History
                  </h3>
                  <p className="text-xs text-blue-100">
                    Track document claim frequency &amp; RA 11261 First-Time Free eligibility
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setShowClaimModal(false)}
                className="text-white/70 hover:text-white text-lg p-1 transition-colors cursor-pointer"
              >
                <i className="fas fa-times"></i>
              </button>
            </div>

            {/* Modal Body */}
            <div className="p-6 overflow-y-auto space-y-5">
              {claimHistoryLoading ? (
                <div className="py-16 text-center text-gray-400">
                  <i className="fas fa-spinner fa-spin text-3xl text-[#0056b3] mb-3"></i>
                  <p className="text-sm font-semibold">Loading claim history for {selectedResident}...</p>
                </div>
              ) : !claimHistoryData ? (
                <div className="py-12 text-center text-gray-500">
                  <p>No claim history records found.</p>
                </div>
              ) : (
                <>
                  {/* Resident Summary Card */}
                  <div className="bg-gradient-to-br from-gray-50 to-blue-50/40 rounded-xl p-5 border border-gray-200">
                    <div className="flex flex-wrap items-center justify-between gap-3">
                      <div>
                        <span className="text-[11px] font-bold text-gray-400 uppercase tracking-wider block">Resident</span>
                        <h4 className="text-xl font-black text-gray-900 flex items-center gap-2">
                          <i className="fas fa-user-circle text-[#0056b3]"></i>
                          <span>{claimHistoryData.resident_name}</span>
                        </h4>
                      </div>
                      <div className="flex items-center gap-3">
                        <div className="text-right">
                          <span className="text-[11px] font-bold text-gray-400 uppercase tracking-wider block">Total Claims</span>
                          <span className="text-2xl font-black text-[#6a1b9a]">
                            {claimHistoryData.total_completed_claims}
                          </span>
                        </div>
                        {claimHistoryData.total_active_requests > 0 && (
                          <div className="text-right pl-3 border-l border-gray-200">
                            <span className="text-[11px] font-bold text-gray-400 uppercase tracking-wider block">Active</span>
                            <span className="text-2xl font-black text-blue-600">
                              {claimHistoryData.total_active_requests}
                            </span>
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Breakdown by Service */}
                    {claimHistoryData.service_breakdown?.length > 0 && (
                      <div className="mt-4 pt-3 border-t border-gray-200/80">
                        <p className="text-[11px] font-bold text-gray-500 uppercase tracking-wider mb-2">Claim Breakdown:</p>
                        <div className="flex flex-wrap gap-2">
                          {claimHistoryData.service_breakdown.map((item, idx) => (
                            <span
                              key={idx}
                              className="inline-flex items-center gap-1.5 bg-white border border-gray-200 px-3 py-1 rounded-full text-xs font-semibold text-gray-700 shadow-2xs"
                            >
                              <i className="fas fa-file-check text-green-600 text-[10px]"></i>
                              <span>{item.service_type}:</span>
                              <strong className="font-black text-gray-900">{item.count} claim{item.count !== 1 ? 's' : ''}</strong>
                            </span>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Legal / Policy Note */}
                    <div className="mt-3.5 bg-purple-50/80 rounded-lg p-2.5 border border-purple-100 text-[11px] text-purple-900 flex items-start gap-2">
                      <i className="fas fa-info-circle text-purple-600 mt-0.5 shrink-0"></i>
                      <span>
                        <strong>Republic Act 11261 (First-Time Free):</strong> The 1st claim for eligible clearance/certifications is granted free of charge. Repeat claims for the same service are assessed standard barangay document fees.
                      </span>
                    </div>
                  </div>

                  {/* Active / In-Progress Requests */}
                  {claimHistoryData.active_requests?.length > 0 && (
                    <div>
                      <h5 className="text-xs font-black text-gray-700 uppercase tracking-wider mb-2.5 flex items-center gap-1.5">
                        <span className="w-2 h-2 rounded-full bg-blue-500"></span>
                        <span>Pending / Active Inquiries ({claimHistoryData.active_requests.length})</span>
                      </h5>
                      <div className="space-y-2">
                        {claimHistoryData.active_requests.map((act) => (
                          <div
                            key={act.id}
                            className="p-3 bg-blue-50/40 rounded-xl border border-blue-200/70 flex flex-wrap items-center justify-between gap-3 text-xs"
                          >
                            <div>
                              <div className="flex items-center gap-2">
                                <span className="font-mono font-bold text-[#0056b3]">{act.tracking_no}</span>
                                <span className="font-bold text-gray-800">{act.service_type}</span>
                              </div>
                              {act.purpose && <p className="text-gray-500 text-[11px] mt-0.5">Purpose: {act.purpose}</p>}
                              <span className="text-[10px] text-gray-400">Filed on {formatDate(act.created_at)}</span>
                            </div>
                            <div className="flex items-center gap-2">
                              <span className="font-bold text-[11px] px-2.5 py-0.5 rounded-full bg-blue-100 text-blue-800">
                                {act.status}
                              </span>
                              <span className={`font-black text-[11px] px-2.5 py-0.5 rounded-full border ${
                                act.is_free
                                  ? 'bg-emerald-50 text-emerald-700 border-emerald-300'
                                  : 'bg-amber-50 text-amber-800 border-amber-300'
                              }`}>
                                {act.claim_label} • {act.pricing_label}
                              </span>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Completed Claims History */}
                  <div>
                    <h5 className="text-xs font-black text-gray-700 uppercase tracking-wider mb-2.5 flex items-center gap-1.5">
                      <span className="w-2 h-2 rounded-full bg-purple-600"></span>
                      <span>Claim History Records ({claimHistoryData.claims?.length || 0})</span>
                    </h5>

                    {!claimHistoryData.claims || claimHistoryData.claims.length === 0 ? (
                      <div className="p-6 text-center bg-gray-50 rounded-xl border border-gray-200 text-gray-400 text-xs font-medium">
                        No completed claims recorded yet for this resident.
                      </div>
                    ) : (
                      <div className="space-y-2.5">
                        {claimHistoryData.claims.map((claim) => (
                          <div
                            key={claim.id}
                            className="p-3.5 bg-white rounded-xl border border-gray-200 hover:border-gray-300 transition-colors flex flex-wrap items-center justify-between gap-3 shadow-2xs"
                          >
                            <div className="flex items-start gap-3">
                              <div className={`w-8 h-8 rounded-lg flex items-center justify-center font-black text-xs shrink-0 ${
                                claim.is_free
                                  ? 'bg-emerald-100 text-emerald-800'
                                  : 'bg-amber-100 text-amber-800'
                              }`}>
                                #{claim.claim_sequence}
                              </div>
                              <div>
                                <div className="flex items-center gap-2">
                                  <span className="font-bold text-gray-900 text-sm">{claim.service_type}</span>
                                  <span className="font-mono text-xs font-semibold text-gray-400">({claim.tracking_no})</span>
                                </div>
                                {claim.purpose && (
                                  <p className="text-xs text-gray-500 mt-0.5 line-clamp-1">Purpose: {claim.purpose}</p>
                                )}
                                <div className="flex items-center gap-3 text-[11px] text-gray-400 mt-1">
                                  <span>Claimed on {formatDate(claim.updated_at || claim.created_at)}</span>
                                  {claim.processed_by && (
                                    <span>• Released by: <strong className="text-gray-600">{claim.processed_by}</strong></span>
                                  )}
                                </div>
                              </div>
                            </div>

                            <div className="flex items-center gap-2">
                              <span className={`text-xs font-black px-3 py-1 rounded-full border flex items-center gap-1 ${
                                claim.is_free
                                  ? 'bg-emerald-50 text-emerald-700 border-emerald-300'
                                  : 'bg-amber-50 text-amber-800 border-amber-300'
                              }`}>
                                <i className={`fas ${claim.is_free ? 'fa-gift text-emerald-600' : 'fa-coins text-amber-600'} text-[10px]`}></i>
                                <span>{claim.pricing_label}</span>
                              </span>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </>
              )}
            </div>

            {/* Modal Footer */}
            <div className="px-6 py-3.5 bg-gray-50 border-t border-gray-100 flex items-center justify-end">
              <button
                type="button"
                onClick={() => setShowClaimModal(false)}
                className="px-5 py-2 bg-gray-200 hover:bg-gray-300 text-gray-800 text-xs font-bold rounded-lg transition-colors cursor-pointer"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

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
          onClick={() => {
            setShowHistory(h => !h);
            setFilterStatus('');
            setSearchQuery('');
          }}
          className={`flex items-center gap-2 px-5 py-2.5 rounded-lg font-bold text-sm transition-all border-2 cursor-pointer ${
            showHistory
              ? 'bg-[#6a1b9a] text-white border-[#6a1b9a] shadow-md'
              : 'bg-white text-[#6a1b9a] border-[#6a1b9a] hover:bg-purple-50'
          }`}
        >
          <i className={`fas ${showHistory ? 'fa-list' : 'fa-history'}`}></i>
          {showHistory ? 'Show Active Requests' : 'Service Request History'}
        </button>
      </div>

      {/* Summary Stat Cards — always present with real global counts */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
        {STATUS_OPTS.map(s => {
          const style = STATUS_STYLE[s];
          const isSelected = filterStatus === s;
          return (
            <button
              key={s}
              type="button"
              onClick={() => {
                if (filterStatus === s) {
                  setFilterStatus('');
                } else {
                  setFilterStatus(s);
                  if (s === 'Completed/Claimed') {
                    setShowHistory(true);
                  } else {
                    setShowHistory(false);
                  }
                }
              }}
              className={`rounded-xl p-4 text-left border-2 transition-all cursor-pointer ${
                isSelected
                  ? 'border-[#0056b3] shadow-md ring-2 ring-blue-400/20'
                  : 'border-transparent hover:shadow-sm'
              }`}
              style={{ background: style.bg }}
            >
              <p className="text-2xl font-black" style={{ color: style.text }}>
                {counts[s] || 0}
              </p>
              <p className="text-[11px] font-bold mt-1 uppercase tracking-wider" style={{ color: style.text, opacity: 0.85 }}>
                {s}
              </p>
            </button>
          );
        })}
      </div>

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
        <select
          value={filterStatus}
          onChange={e => {
            const val = e.target.value;
            setFilterStatus(val);
            if (val === 'Completed/Claimed') {
              setShowHistory(true);
            } else if (val) {
              setShowHistory(false);
            }
          }}
          className="border border-gray-200 rounded-lg px-3 py-2 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-blue-200 font-semibold text-gray-700 cursor-pointer"
        >
          <option value="">{showHistory ? 'All Completed / Claimed' : 'All Active Statuses'}</option>
          {STATUS_OPTS.map(s => <option key={s} value={s}>{s}</option>)}
        </select>
        {(filterStatus || searchQuery) && (
          <button
            type="button"
            onClick={() => { setFilterStatus(''); setSearchQuery(''); }}
            className="text-xs font-bold text-gray-500 hover:text-gray-800 flex items-center gap-1 cursor-pointer border-0 bg-transparent"
          >
            <i className="fas fa-times"></i> Clear
          </button>
        )}
        <span className="text-xs text-gray-400 font-medium ml-auto">{filtered.length} record{filtered.length !== 1 ? 's' : ''}</span>
      </div>

      {/* Table */}
      <div className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-x-auto">
        <table className="w-full min-w-[1050px] border-collapse text-sm">
          <thead>
            <tr className="bg-gray-50 text-gray-500 text-[11px] uppercase tracking-wider">
              <th className="px-5 py-3.5 text-left font-bold whitespace-nowrap">Tracking No.</th>
              <th className="px-5 py-3.5 text-left font-bold">Resident</th>
              <th className="px-5 py-3.5 text-left font-bold">Service Type</th>
              <th className="px-5 py-3.5 text-left font-bold whitespace-nowrap">Claim Status</th>
              <th className="px-5 py-3.5 text-left font-bold whitespace-nowrap">Date</th>
              <th className="px-5 py-3.5 text-left font-bold whitespace-nowrap">Status</th>
              <th className="px-5 py-3.5 text-left font-bold whitespace-nowrap">Processed By</th>
              <th className="px-5 py-3.5 text-center font-bold whitespace-nowrap">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {loading ? (
              [...Array(5)].map((_, i) => (
                <tr key={i}>
                  {[...Array(8)].map((_, j) => (
                    <td key={j} className="px-5 py-4">
                      <div className="h-4 bg-gray-100 rounded animate-pulse"></div>
                    </td>
                  ))}
                </tr>
              ))
            ) : error ? (
              <tr>
                <td colSpan="8" className="px-5 py-12 text-center text-red-500">
                  <i className="fas fa-exclamation-circle text-3xl block mb-2 opacity-60"></i>
                  <p className="font-semibold">{error}</p>
                  <button
                    onClick={() => fetchRequests()}
                    className="mt-3 px-4 py-1.5 bg-red-50 text-red-700 text-xs rounded-lg hover:bg-red-100 font-bold border border-red-200 transition-colors cursor-pointer"
                  >
                    <i className="fas fa-redo mr-1"></i> Retry
                  </button>
                </td>
              </tr>
            ) : filtered.length === 0 ? (
              <tr>
                <td colSpan="8" className="px-5 py-16 text-center text-gray-400">
                  <i className="fas fa-inbox text-4xl block mb-3 opacity-40"></i>
                  <p className="font-semibold">No service requests found.</p>
                </td>
              </tr>
            ) : filtered.map(r => (
              <tr key={r.id} className="hover:bg-gray-50 transition-colors">
                <td className="px-5 py-3.5 whitespace-nowrap">
                  <span className="font-mono font-black text-[#0056b3] text-[13px] whitespace-nowrap">{r.tracking_no}</span>
                </td>
                <td className="px-5 py-3.5">
                  <p className="font-bold text-gray-900 text-[13px]">{r.resident_name}</p>
                  {r.address && <p className="text-[11px] text-gray-400 truncate max-w-[180px]">{r.address}</p>}
                </td>
                <td className="px-5 py-3.5">
                  <p className="text-gray-700 font-medium text-[13px]">{r.service_type}</p>
                  {r.purpose && <p className="text-[11px] text-gray-400 truncate max-w-[180px]" title={r.purpose}>{r.purpose}</p>}
                </td>
                {/* Claim Status Indicator Badge */}
                <td className="px-5 py-3.5 whitespace-nowrap">
                  <button
                    type="button"
                    onClick={() => openClaimHistory(r.resident_name)}
                    title={`Click to view ${r.resident_name}'s complete claim history`}
                    className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-extrabold transition-all border cursor-pointer hover:shadow-xs active:scale-95 whitespace-nowrap ${
                      r.claim_info?.is_free
                        ? 'bg-emerald-50 text-emerald-800 border-emerald-300 hover:bg-emerald-100 ring-1 ring-emerald-400/20'
                        : 'bg-amber-50 text-amber-900 border-amber-300 hover:bg-amber-100'
                    }`}
                  >
                    <i className={`fas ${r.claim_info?.is_free ? 'fa-gift text-emerald-600' : 'fa-receipt text-amber-600'} text-[10px]`}></i>
                    <span>{r.claim_info?.badge_text || `${r.claim_info?.sequence || 1} Claim`}</span>
                    <i className="fas fa-chevron-right text-[8px] opacity-40 ml-0.5"></i>
                  </button>
                </td>
                <td className="px-5 py-3.5 text-gray-500 text-[12px] whitespace-nowrap">{formatDate(r.created_at)}</td>
                <td className="px-5 py-3.5 whitespace-nowrap">
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
                <td className="px-5 py-3.5 whitespace-nowrap">
                  {r.processed_by
                    ? <span className="text-[12px] font-semibold text-gray-700 flex items-center gap-1.5">
                        <i className="fas fa-user-check text-green-500 text-[10px]"></i>
                        {r.processed_by}
                      </span>
                    : <span className="text-[12px] text-gray-300 font-medium">—</span>
                  }
                </td>
                <td className="px-5 py-3.5 whitespace-nowrap min-w-[140px]">
                  <div className="flex items-center justify-center gap-2">
                    <Link
                      href={`/admin/services/pdf/${r.id}`}
                      title="View & Download PDF"
                      className="flex items-center gap-1.5 bg-[#0056b3] text-white text-[11px] font-bold px-3 py-1.5 rounded-lg hover:bg-blue-800 transition-colors no-underline"
                    >
                      <i className="fas fa-file-pdf"></i> PDF
                    </Link>
                    {r.status !== 'Completed/Claimed' && (
                      <button
                        onClick={() => handleStatusChange(r.id, 'Completed/Claimed')}
                        disabled={updatingId === r.id}
                        title="Mark as Completed/Claimed"
                        className="flex items-center gap-1.5 bg-green-600 hover:bg-green-700 disabled:bg-gray-300 text-white text-[11px] font-bold px-3 py-1.5 rounded-lg transition-colors cursor-pointer border-0"
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

export default function ServiceRequestsAdminPage() {
  return (
    <Suspense fallback={
      <div className="p-12 flex flex-col items-center justify-center min-h-[400px]">
        <i className="fas fa-spinner fa-spin text-3xl text-[#0056b3] mb-3"></i>
        <p className="text-sm font-semibold text-gray-500">Loading service requests...</p>
      </div>
    }>
      <ServiceRequestsContent />
    </Suspense>
  );
}
