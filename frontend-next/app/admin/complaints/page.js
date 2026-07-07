'use client';
import { useState, useEffect, useMemo } from 'react';
import Link from 'next/link';

export default function ComplaintsPage() {
  const [complaints, setComplaints] = useState([]);
  const [stats, setStats] = useState({ total_complaints: 0, total_events: 0, total_news: 0, announcements: 0 });

  // ── Filter state ─────────────────────────────────────────────────────────
  const [search,        setSearch]        = useState('');
  const [filterCat,     setFilterCat]     = useState('');
  const [filterStatus,  setFilterStatus]  = useState('');
  const [filterUrgency, setFilterUrgency] = useState('');

  useEffect(() => {
    const fetchData = async () => {
      try {
        const token = localStorage.getItem('token');
        const headers = { 'Authorization': `Bearer ${token}` };

        // Fetch Stats
        const statsRes = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/dashboard/stats`, { headers });
        if (statsRes.ok) {
          const statsData = await statsRes.json();
          setStats({
            total_complaints: statsData.total_complaints || 0,
            total_events:     statsData.total_events     || 0,
            total_news:       statsData.total_news       || 0,
            announcements:    0,
          });
        }

        // Fetch Complaints list
        const compRes = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/complaints/admin`, { headers });
        if (compRes.ok) {
          const compData = await compRes.json();
          setComplaints(compData.complaints || []);
        }
      } catch (err) {
        console.error('Error fetching data:', err);
      }
    };
    fetchData();
  }, []);

  // ── Derive unique filter options from the live data ──────────────────────
  const categories = useMemo(() => {
    const set = new Set(complaints.map((c) => c.category || c.complaint_type).filter(Boolean));
    return [...set].sort();
  }, [complaints]);

  const statuses = useMemo(() => {
    const set = new Set(complaints.map((c) => c.status).filter(Boolean));
    return [...set].sort();
  }, [complaints]);

  const urgencyLevels = useMemo(() => {
    const order = { high: 0, medium: 1, low: 2 };
    const set = new Set(complaints.map((c) => c.urgency_level).filter(Boolean));
    return [...set].sort((a, b) => (order[a?.toLowerCase()] ?? 99) - (order[b?.toLowerCase()] ?? 99));
  }, [complaints]);

  // ── Client-side filtered list ────────────────────────────────────────────
  const filtered = useMemo(() => {
    const q = search.toLowerCase();
    return complaints.filter((c) => {
      const cat = (c.category || c.complaint_type || '').toLowerCase();
      const matchSearch  = !q || c.ref_no?.toLowerCase().includes(q) || c.full_name?.toLowerCase().includes(q) || cat.includes(q);
      const matchCat     = !filterCat     || cat === filterCat.toLowerCase();
      const matchStatus  = !filterStatus  || (c.status || '') === filterStatus;
      const matchUrgency = !filterUrgency || (c.urgency_level || '').toLowerCase() === filterUrgency.toLowerCase();
      return matchSearch && matchCat && matchStatus && matchUrgency;
    });
  }, [complaints, search, filterCat, filterStatus, filterUrgency]);

  const hasActiveFilter = search || filterCat || filterStatus || filterUrgency;
  const clearFilters = () => { setSearch(''); setFilterCat(''); setFilterStatus(''); setFilterUrgency(''); };

  // ── Helpers ──────────────────────────────────────────────────────────────
  const getUrgencyColor = (level) => {
    const l = (level || '').toLowerCase();
    if (l === 'high')   return 'bg-red-100 text-red-700';
    if (l === 'medium') return 'bg-orange-100 text-orange-700';
    return 'bg-green-100 text-green-700';
  };

  const getStatusColor = (status) => {
    const s = (status || '').toLowerCase();
    if (s === 'resolved')  return 'bg-green-100 text-green-700';
    if (s === 'on-going' || s === 'ongoing') return 'bg-blue-100 text-blue-700';
    return 'bg-yellow-100 text-yellow-700'; // pending
  };

  return (
    <div className="p-8 max-w-7xl mx-auto">

      {/* ── 4 Stats Cards ── */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <div className="bg-white rounded-xl p-5 shadow-sm border border-gray-100 flex items-center gap-4">
          <div className="w-12 h-12 rounded-full bg-blue-50 text-[#0056b3] flex items-center justify-center text-xl shrink-0"><i className="fas fa-exclamation-circle"></i></div>
          <div><h3 className="text-xs font-bold text-gray-500 mb-1">COMPLAINTS</h3><h2 className="text-2xl font-black text-gray-800">{stats.total_complaints}</h2></div>
        </div>
        <div className="bg-white rounded-xl p-5 shadow-sm border border-gray-100 flex items-center gap-4">
          <div className="w-12 h-12 rounded-full bg-blue-50 text-[#0056b3] flex items-center justify-center text-xl shrink-0"><i className="fas fa-calendar-check"></i></div>
          <div><h3 className="text-xs font-bold text-gray-500 mb-1">EVENTS</h3><h2 className="text-2xl font-black text-gray-800">{stats.total_events}</h2></div>
        </div>
        <div className="bg-white rounded-xl p-5 shadow-sm border border-gray-100 flex items-center gap-4">
          <div className="w-12 h-12 rounded-full bg-blue-50 text-[#0056b3] flex items-center justify-center text-xl shrink-0"><i className="fas fa-newspaper"></i></div>
          <div><h3 className="text-xs font-bold text-gray-500 mb-1">NEWS</h3><h2 className="text-2xl font-black text-gray-800">{stats.total_news}</h2></div>
        </div>
        <div className="bg-white rounded-xl p-5 shadow-sm border border-gray-100 flex items-center gap-4">
          <div className="w-12 h-12 rounded-full bg-blue-50 text-[#0056b3] flex items-center justify-center text-xl shrink-0"><i className="fas fa-bullhorn"></i></div>
          <div><h3 className="text-xs font-bold text-gray-500 mb-1">ANNOUNCEMENTS</h3><h2 className="text-2xl font-black text-gray-800">{stats.announcements}</h2></div>
        </div>
      </div>

      {/* ── Toolbar: History + Filters ── */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-4 mb-6 flex flex-wrap items-center gap-3">

        {/* Search */}
        <div className="relative flex-1 min-w-[180px]">
          <i className="fas fa-search absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 text-xs"></i>
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by name or ref no..."
            className="w-full pl-8 pr-4 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#0056b3] focus:border-transparent"
          />
        </div>

        {/* Category filter */}
        <select
          value={filterCat}
          onChange={(e) => setFilterCat(e.target.value)}
          className="py-2 px-3 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#0056b3] text-gray-600 bg-white min-w-[150px]"
        >
          <option value="">All Categories</option>
          {categories.map((cat) => (
            <option key={cat} value={cat}>{cat}</option>
          ))}
        </select>

        {/* Status filter */}
        <select
          value={filterStatus}
          onChange={(e) => setFilterStatus(e.target.value)}
          className="py-2 px-3 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#0056b3] text-gray-600 bg-white min-w-[130px]"
        >
          <option value="">All Statuses</option>
          {statuses.map((s) => (
            <option key={s} value={s}>{s}</option>
          ))}
        </select>

        {/* Urgency filter */}
        <select
          value={filterUrgency}
          onChange={(e) => setFilterUrgency(e.target.value)}
          className="py-2 px-3 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#0056b3] text-gray-600 bg-white min-w-[140px]"
        >
          <option value="">All Urgency Levels</option>
          {urgencyLevels.map((u) => (
            <option key={u} value={u}>{u}</option>
          ))}
        </select>

        {/* Clear filters */}
        {hasActiveFilter && (
          <button
            onClick={clearFilters}
            className="flex items-center gap-1.5 text-xs font-bold text-red-500 hover:text-red-700 px-3 py-2 rounded-lg hover:bg-red-50 transition-colors"
          >
            <i className="fas fa-times"></i> Clear
          </button>
        )}

        {/* Spacer */}
        <div className="flex-1" />

        {/* History link */}
        <Link
          href="/admin/complaints/history"
          className="bg-white text-gray-700 px-4 py-2 rounded-lg border border-gray-200 font-bold text-sm hover:bg-gray-50 transition-colors flex items-center gap-2 no-underline shrink-0"
        >
          <i className="fas fa-history"></i> COMPLAINT HISTORY
        </Link>
      </div>

      {/* ── Active Complaints Table ── */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
        {/* Table header with result count */}
        <div className="px-6 py-5 border-b border-gray-100 flex items-center justify-between">
          <h3 className="font-black text-gray-800 tracking-tight">ACTIVE COMPLAINTS</h3>
          <span className="text-xs font-semibold text-gray-400">
            {filtered.length} of {complaints.length} result{complaints.length !== 1 ? 's' : ''}
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-gray-50 text-gray-500 text-xs uppercase tracking-wider">
                <th className="px-6 py-4 font-bold">REF NO.</th>
                <th className="px-6 py-4 font-bold">NAME</th>
                <th className="px-6 py-4 font-bold">CATEGORY</th>
                <th className="px-6 py-4 font-bold">DATE</th>
                <th className="px-6 py-4 font-bold">TIME</th>
                <th className="px-6 py-4 font-bold">STATUS</th>
                <th className="px-6 py-4 font-bold">URGENCY LEVEL</th>
                <th className="px-6 py-4 font-bold text-center">ACTIONS</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {filtered.length > 0 ? (
                filtered.map((c) => (
                  <tr key={c.id} className="hover:bg-gray-50 transition-colors text-sm text-gray-700">
                    <td className="px-6 py-4 font-bold text-gray-900">{c.ref_no}</td>
                    <td className="px-6 py-4">{c.full_name}</td>
                    <td className="px-6 py-4">{c.category || c.complaint_type}</td>
                    <td className="px-6 py-4">{new Date(c.submitted_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}</td>
                    <td className="px-6 py-4">{new Date(c.submitted_at).toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true })}</td>
                    <td className="px-6 py-4">
                      <span className={`px-3 py-1 rounded-md text-[11px] font-bold uppercase tracking-wider ${getStatusColor(c.status)}`}>
                        {c.status}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <span className={`px-3 py-1 rounded-md text-[11px] font-bold uppercase tracking-wider ${getUrgencyColor(c.urgency_level)}`}>
                        {c.urgency_level}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-center">
                      <Link
                        href={`/admin/complaints/view/${c.id}`}
                        className="bg-[#0056b3] text-white px-4 py-1.5 rounded-md text-xs font-bold hover:bg-blue-800 transition-colors inline-block shadow-sm no-underline"
                      >
                        View
                      </Link>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan="8" className="px-6 py-16 text-center">
                    <div className="flex flex-col items-center gap-2 text-gray-400">
                      <i className="fas fa-filter text-2xl"></i>
                      <p className="font-semibold text-sm">
                        {hasActiveFilter ? 'No complaints match your filters.' : 'No active complaints found.'}
                      </p>
                      {hasActiveFilter && (
                        <button onClick={clearFilters} className="text-xs text-[#0056b3] hover:underline font-bold mt-1">
                          Clear all filters
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

    </div>
  );
}