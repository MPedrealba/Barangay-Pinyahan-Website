'use client';
import { useState, useEffect, use } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

function parseArray(value) {
  if (Array.isArray(value)) return value;
  if (typeof value === 'string') {
    try { return JSON.parse(value); } catch { return []; }
  }
  return [];
}

function timeAgo(dateStr) {
  if (!dateStr) return '';
  const diff = Date.now() - new Date(dateStr).getTime();
  const days = Math.floor(diff / 86400000);
  if (days === 0) return 'Updated today';
  if (days === 1) return 'Updated 1 day ago';
  return `Updated ${days} days ago`;
}

export default function ViewServicePage({ params }) {
  const { id } = use(params);
  const router = useRouter();

  const [service, setService] = useState(null);
  const [status, setStatus] = useState('Active');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchService = async () => {
      try {
        const token = localStorage.getItem('token');
        const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/services/admin/${id}`, {
          headers: { 'Authorization': `Bearer ${token}` }
        });
        if (res.ok) {
          const data = await res.json();
          const s = data.service || data;
          setService(s);
          setStatus(s.status || 'Active');
        }
      } catch (err) {
        console.error('Failed to fetch service:', err);
      } finally {
        setLoading(false);
      }
    };
    fetchService();
  }, [id]);

  const handleStatusChange = async (newStatus) => {
    setStatus(newStatus);
    try {
      const token = localStorage.getItem('token');
      const formData = new FormData();
      formData.append('status', newStatus);
      await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/services/admin/${id}`, {
        method: 'PUT',
        headers: { 'Authorization': `Bearer ${token}` },
        body: formData
      });
    } catch (err) {
      console.error('Failed to update status:', err);
    }
  };

  if (loading) {
    return (
      <div className="p-8 max-w-4xl mx-auto">
        <div className="flex items-center justify-center py-24 text-gray-400 text-sm gap-2">
          <i className="fas fa-spinner fa-spin"></i> Loading service...
        </div>
      </div>
    );
  }

  if (!service) {
    return (
      <div className="p-8 max-w-4xl mx-auto">
        <p className="text-center text-red-500 font-bold mt-10">Service not found.</p>
      </div>
    );
  }

  const requirements = parseArray(service.requirements);
  const procedure = parseArray(service.procedure || service.steps);
  const name = service.name || service.title || 'Untitled';
  const description = service.description || 'Service Information and Processing Details';

  return (
    <div className="p-8 max-w-4xl mx-auto">
      {/* Page Header */}
      <div className="flex items-start justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold text-[#0056b3]">Service Management</h1>
          <p className="text-sm text-gray-500 mt-1">Manage Barangay Services and Information</p>
        </div>
        <Link
          href="/admin/services"
          className="bg-[#0056b3] text-white rounded-md px-4 py-2 font-medium text-sm hover:bg-blue-800 transition-colors no-underline"
        >
          + Add Information
        </Link>
      </div>

      {/* Service Card */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">

        {/* Card Header */}
        <div className="flex items-start justify-between mb-1">
          <h2 className="text-xl font-bold text-gray-900">{name}</h2>
          <div className="bg-blue-50 text-[#0056b3] p-2 rounded-md flex-shrink-0">
            <i className="fas fa-file-alt text-lg"></i>
          </div>
        </div>
        <p className="text-sm text-gray-400 mb-5">{description}</p>

        {/* Requirements & Procedure */}
        {(requirements.length > 0 || procedure.length > 0) && (
          <div className="bg-gray-50 rounded-lg border border-gray-100 p-5 mb-5">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {requirements.length > 0 && (
                <div>
                  <h3 className="font-bold text-gray-800 mb-3 text-sm">Requirements</h3>
                  <div className="flex flex-col gap-2">
                    {requirements.map((req, idx) => (
                      <div key={idx} className="bg-white border border-gray-200 rounded-md px-3 py-2 flex items-center gap-2 text-sm text-gray-700">
                        <span className="w-2 h-2 rounded-full bg-[#0056b3] flex-shrink-0"></span>
                        {req}
                      </div>
                    ))}
                  </div>
                </div>
              )}
              {procedure.length > 0 && (
                <div>
                  <h3 className="font-bold text-gray-800 mb-3 text-sm">Procedure</h3>
                  <div className="flex flex-col gap-2">
                    {procedure.map((step, idx) => (
                      <div key={idx} className="bg-white border border-gray-200 rounded-md px-3 py-2 flex items-center gap-2 text-sm text-gray-700">
                        <span className="w-5 h-5 rounded-full bg-[#0056b3] text-white text-xs flex items-center justify-center font-bold flex-shrink-0">
                          {idx + 1}
                        </span>
                        {step}
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Card Footer */}
        <div className="flex items-center justify-between pt-2">
          <div className="flex items-center gap-2">
            <span className="text-xs text-gray-500 font-semibold">Status:</span>
            <select
              value={status}
              onChange={(e) => handleStatusChange(e.target.value)}
              className="border border-gray-300 rounded px-2 py-1 text-sm text-gray-700 bg-white focus:outline-none focus:ring-1 focus:ring-blue-300"
            >
              <option value="Active">Active</option>
              <option value="Inactive">Inactive</option>
            </select>
          </div>
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={() => router.push('/admin/services')}
              className="bg-gray-500 hover:bg-gray-600 text-white px-5 py-1.5 rounded-md text-sm font-medium transition-colors"
            >
              Close
            </button>
            <Link
              href={`/admin/services/edit/${id}`}
              className="bg-[#0056b3] hover:bg-blue-800 text-white px-5 py-1.5 rounded-md text-sm font-medium transition-colors no-underline"
            >
              Edit
            </Link>
          </div>
        </div>

      </div>
    </div>
  );
}
