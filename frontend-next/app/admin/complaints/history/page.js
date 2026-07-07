'use client';
import { useState, useEffect } from 'react';
import Link from 'next/link';

export default function ComplaintHistoryPage() {
  const [resolved, setResolved] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchHistory = async () => {
      try {
        const token = localStorage.getItem('token');
        const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/complaints/admin/history`, {
          headers: { 'Authorization': `Bearer ${token}` }
        });

        if (res.ok) {
          const data = await res.json();
          setResolved(data.complaints || []);
        }
      } catch (err) {
        console.error('Failed to fetch complaint history:', err);
      } finally {
        setLoading(false);
      }
    };
    fetchHistory();
  }, []);

  return (
    <div className="p-8 max-w-7xl mx-auto">

      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <h2 className="text-[15px] font-black text-[#002B5B] flex items-center gap-2 uppercase tracking-wide">
          <i className="fas fa-history text-[#0056b3]"></i> COMPLAINT HISTORY
        </h2>
        <Link
          href="/admin/complaints"
          className="bg-white text-gray-700 px-5 py-2.5 rounded-lg shadow-sm border border-gray-200 font-bold text-sm hover:bg-gray-50 transition-colors flex items-center gap-2 no-underline"
        >
          <i className="fas fa-arrow-left"></i> Back to Active Complaints
        </Link>
      </div>

      {/* Table Card */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-gray-50 text-gray-500 text-xs uppercase tracking-wider">
                <th className="px-6 py-4 font-bold">Ref No.</th>
                <th className="px-6 py-4 font-bold">Name</th>
                <th className="px-6 py-4 font-bold">Category</th>
                <th className="px-6 py-4 font-bold">Date</th>
                <th className="px-6 py-4 font-bold">Time</th>
                <th className="px-6 py-4 font-bold">Status</th>
                <th className="px-6 py-4 font-bold text-center">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {loading ? (
                <tr>
                  <td colSpan="7" className="px-6 py-12 text-center text-gray-400 text-sm">
                    Loading...
                  </td>
                </tr>
              ) : resolved.length > 0 ? (
                resolved.map((c) => {
                  const dateStr = new Date(c.submitted_at).toLocaleDateString('en-US', {
                    month: 'short', day: 'numeric', year: 'numeric'
                  });
                  const timeStr = new Date(c.submitted_at).toLocaleTimeString('en-US', {
                    hour: 'numeric', minute: '2-digit', hour12: true
                  });

                  return (
                    <tr key={c.id} className="hover:bg-gray-50 transition-colors text-sm text-gray-700">
                      <td className="px-6 py-4 font-bold text-gray-900">{c.ref_no}</td>
                      <td className="px-6 py-4">{c.full_name}</td>
                      <td className="px-6 py-4">{c.category || c.complaint_type}</td>
                      <td className="px-6 py-4">{dateStr}</td>
                      <td className="px-6 py-4">{timeStr}</td>
                      <td className="px-6 py-4">
                        <span className="px-3 py-1 rounded-md text-[11px] font-bold uppercase tracking-wider bg-green-100 text-green-700">
                          Resolved
                        </span>
                      </td>
                      <td className="px-6 py-4 text-center">
                        <Link
                          href={`/admin/complaints/view/${c.id}`}
                          className="bg-[#0056b3] text-white px-4 py-2 rounded-md text-xs font-bold hover:bg-blue-800 transition-colors inline-block shadow-sm no-underline"
                        >
                          View
                        </Link>
                      </td>
                    </tr>
                  );
                })
              ) : (
                <tr>
                  <td colSpan="7" className="px-6 py-12 text-center text-gray-500 font-medium">
                    No history of resolved complaints found.
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
