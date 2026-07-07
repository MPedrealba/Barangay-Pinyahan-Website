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

function parseArray(value) {
  if (Array.isArray(value)) return value;
  if (typeof value === 'string') {
    try { return JSON.parse(value); } catch { return []; }
  }
  return [];
}

export default function ServicesPage() {
  const [services, setServices] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchServices = async () => {
      try {
        const token = localStorage.getItem('token');
        const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/admin/services`), {
          headers: { 'Authorization': `Bearer ${token}` }
        });
        if (res.ok) {
          const data = await res.json();
          setServices(data.services || []);
        }
      } catch (err) {
        console.error('Failed to fetch services:', err);
      } finally {
        setLoading(false);
      }
    };
    fetchServices();
  }, []);

  return (
    <div className="p-8 max-w-4xl mx-auto">
      {/* Page Header */}
      <div className="flex items-start justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold text-[#0056b3]">Service Management</h1>
          <p className="text-sm text-gray-500 mt-1">Manage Barangay Services and Information</p>
        </div>
        <Link
          href="/admin/services/create"
          className="bg-[#0056b3] text-white rounded-md px-4 py-2 font-medium text-sm hover:bg-blue-800 transition-colors no-underline flex items-center gap-1"
        >
          + Add Information
        </Link>
      </div>

      {/* Loading */}
      {loading ? (
        <div className="flex items-center justify-center py-24 text-gray-400 text-sm gap-2">
          <i className="fas fa-spinner fa-spin"></i> Loading services...
        </div>
      ) : services.length === 0 ? (
        /* Empty State */
        <div className="flex flex-col items-center justify-center py-24 gap-3">
          <div className="w-16 h-16 rounded-full bg-blue-50 flex items-center justify-center">
            <i className="fas fa-file-alt text-[#0056b3] text-2xl"></i>
          </div>
          <p className="text-gray-600 font-semibold">No services found.</p>
          <p className="text-gray-400 text-sm">Click "+ Add Information" to create your first service.</p>
        </div>
      ) : (
        /* Service Cards */
        <div className="flex flex-col gap-6">
          {services.map((service) => {
            const requirements = parseArray(service.requirements);
            const procedure = parseArray(service.procedure || service.steps);
            const name = service.name || service.title || 'Untitled';
            const description = service.description || 'Service Information and Processing Details';
            const statusLabel = service.status || 'Active';
            const isActive = statusLabel.toLowerCase() === 'active';

            return (
              <div key={service.id} className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
                {/* Card Header */}
                <div className="flex items-start justify-between mb-1">
                  <h2 className="text-xl font-bold text-gray-900">{name}</h2>
                  <div className="bg-blue-50 text-[#0056b3] p-2 rounded-md">
                    <i className="fas fa-file-alt text-lg"></i>
                  </div>
                </div>
                <p className="text-sm text-gray-400 mb-5">{description}</p>

                {/* Requirements & Procedure */}
                {(requirements.length > 0 || procedure.length > 0) && (
                  <div className="bg-gray-50 rounded-lg border border-gray-100 p-5 mb-5">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      {/* Requirements */}
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

                      {/* Procedure */}
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
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <span className="text-xs text-gray-400">{timeAgo(service.updated_at)}</span>
                      <span className={`text-xs font-semibold px-2.5 py-0.5 rounded-full border ${isActive ? 'bg-green-50 text-green-700 border-green-200' : 'bg-gray-100 text-gray-500 border-gray-200'}`}>
                        {statusLabel}
                      </span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Link
                        href={`/admin/services/view/${service.id}`}
                        className="bg-[#0056b3] text-white px-3 py-1.5 rounded-md text-xs font-bold hover:bg-blue-800 transition-colors no-underline"
                      >
                        View
                      </Link>
                      <Link
                        href={`/admin/services/edit/${service.id}`}
                        className="bg-green-600 text-white px-3 py-1.5 rounded-md text-xs font-bold hover:bg-green-700 transition-colors no-underline"
                      >
                        Edit
                      </Link>
                    </div>
                  </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
