'use client';
import { useState, useEffect } from 'react';
import Link from 'next/link';

function timeAgo(dateStr) {
  if (!dateStr) return '';
  const diff = Date.now() - new Date(dateStr).getTime();
  const days = Math.floor(diff / 86400000);
  if (days === 0) return 'Updated today';
  if (days === 1) return 'Updated 1 day ago';
  return `Updated ${days} days ago`;
}

export default function CitizensCharterListPage() {
  const [charters, setCharters] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchCharters = async () => {
    try {
      const token = localStorage.getItem('token');
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/admin/citizens-charter`, {
        headers: { 'Authorization': `Bearer ${token}` },
      });
      if (res.ok) {
        const data = await res.json();
        setCharters(data.services || []);
      }
    } catch (err) {
      console.error('Failed to fetch charters:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchCharters(); }, []);

  const handleDelete = async (id, name) => {
    if (!confirm(`Delete "${name}"? This will also remove its requirements and processing steps.`)) return;

    try {
      const token = localStorage.getItem('token');
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/admin/citizens-charter/${id}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${token}` },
      });
      if (res.ok) {
        setCharters((prev) => prev.filter((c) => c.id !== id));
      } else {
        const err = await res.json();
        alert(err.error || 'Failed to delete.');
      }
    } catch (err) {
      console.error(err);
      alert('Error deleting charter.');
    }
  };

  const classificationBadge = {
    'Simple':           'bg-green-50 text-green-700 border-green-200',
    'Complex':          'bg-amber-50 text-amber-700 border-amber-200',
    'Highly Technical': 'bg-red-50 text-red-700 border-red-200',
  };

  return (
    <div className="p-8 max-w-5xl mx-auto">
      {/* Page Header */}
      <div className="flex items-start justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold text-[#0056b3]">Citizen&apos;s Charter</h1>
          <p className="text-sm text-gray-500 mt-1">Manage ARTA-mandated service charters</p>
        </div>
        <Link
          href="/admin/citizens-charter/create"
          className="bg-[#0056b3] text-white rounded-md px-4 py-2 font-medium text-sm hover:bg-blue-800 transition-colors no-underline flex items-center gap-1.5"
        >
          <i className="fas fa-plus text-xs"></i> Add Charter
        </Link>
      </div>

      {/* Loading */}
      {loading ? (
        <div className="flex items-center justify-center py-24 text-gray-400 text-sm gap-2">
          <i className="fas fa-spinner fa-spin"></i> Loading charters...
        </div>
      ) : charters.length === 0 ? (
        /* Empty State */
        <div className="flex flex-col items-center justify-center py-24 gap-3">
          <div className="w-16 h-16 rounded-full bg-blue-50 flex items-center justify-center">
            <i className="fas fa-scroll text-[#0056b3] text-2xl"></i>
          </div>
          <p className="text-gray-600 font-semibold">No charter services found.</p>
          <p className="text-gray-400 text-sm">Click &quot;+ Add Charter&quot; to create your first Citizen&apos;s Charter entry.</p>
        </div>
      ) : (
        /* Charter Cards */
        <div className="flex flex-col gap-5">
          {charters.map((charter) => (
            <div key={charter.id} className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 hover:shadow-md transition-shadow">
              {/* Card Header */}
              <div className="flex items-start justify-between mb-3">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-lg bg-[#0056b3]/10 flex items-center justify-center shrink-0">
                    <i className="fas fa-scroll text-[#0056b3]"></i>
                  </div>
                  <div>
                    <h2 className="text-lg font-bold text-gray-900">{charter.service_name}</h2>
                    {charter.office_division && (
                      <p className="text-xs text-gray-400 mt-0.5">{charter.office_division}</p>
                    )}
                  </div>
                </div>
                {charter.classification && (
                  <span className={`text-xs font-semibold px-2.5 py-0.5 rounded-full border ${classificationBadge[charter.classification] || 'bg-gray-100 text-gray-500 border-gray-200'}`}>
                    {charter.classification}
                  </span>
                )}
              </div>

              {/* Meta grid */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-4">
                {charter.transaction_type && (
                  <div className="bg-gray-50 rounded-lg px-3 py-2">
                    <p className="text-[10px] font-bold text-gray-400 uppercase">Transaction</p>
                    <p className="text-sm font-semibold text-gray-700">{charter.transaction_type}</p>
                  </div>
                )}
                {charter.who_may_avail && (
                  <div className="bg-gray-50 rounded-lg px-3 py-2 col-span-2 md:col-span-1">
                    <p className="text-[10px] font-bold text-gray-400 uppercase">Who May Avail</p>
                    <p className="text-sm font-semibold text-gray-700 truncate">{charter.who_may_avail}</p>
                  </div>
                )}
                <div className="bg-gray-50 rounded-lg px-3 py-2">
                  <p className="text-[10px] font-bold text-gray-400 uppercase">Requirements</p>
                  <p className="text-sm font-semibold text-gray-700">{charter.requirements_count || 0}</p>
                </div>
                <div className="bg-gray-50 rounded-lg px-3 py-2">
                  <p className="text-[10px] font-bold text-gray-400 uppercase">Steps</p>
                  <p className="text-sm font-semibold text-gray-700">{charter.steps_count || 0}</p>
                </div>
              </div>

              {/* Card Footer */}
              <div className="flex items-center justify-between pt-2 border-t border-gray-100">
                <span className="text-xs text-gray-400">{timeAgo(charter.updated_at)}</span>
                <div className="flex items-center gap-2">
                  <Link
                    href={`/admin/citizens-charter/edit/${charter.id}`}
                    className="bg-[#0056b3] text-white px-3.5 py-1.5 rounded-md text-xs font-bold hover:bg-blue-800 transition-colors no-underline"
                  >
                    Edit
                  </Link>
                  <button
                    type="button"
                    onClick={() => handleDelete(charter.id, charter.service_name)}
                    className="bg-red-500 text-white px-3.5 py-1.5 rounded-md text-xs font-bold hover:bg-red-600 transition-colors"
                  >
                    Delete
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
