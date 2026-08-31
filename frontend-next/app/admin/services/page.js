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

// Safely parse JSON or array fields from TiDB/MySQL
function parseArray(value) {
  if (Array.isArray(value)) return value;
  if (typeof value === 'string') {
    try {
      const parsed = JSON.parse(value);
      return Array.isArray(parsed) ? parsed : [];
    } catch {
      return value.trim() ? [value] : [];
    }
  }
  return [];
}

export default function ServicesPage() {
  const [services, setServices] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchServices = async () => {
    try {
      const token = localStorage.getItem('token');
      const apiBase = process.env.NEXT_PUBLIC_API_URL || '';
      const res = await fetch(`${apiBase}/api/admin/services`, {
        headers: { Authorization: `Bearer ${token}` }
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

  useEffect(() => {
    fetchServices();
  }, []);

  const handleDelete = async (id, serviceName) => {
    if (!confirm(`Are you sure you want to delete "${serviceName}"? This action cannot be undone.`)) return;

    try {
      const token = localStorage.getItem('token');
      if (!token) {
        alert('You are not logged in. Redirecting to login page...');
        window.location.href = '/admin';
        return;
      }

      const apiBase = process.env.NEXT_PUBLIC_API_URL || '';
      const res = await fetch(`${apiBase}/api/admin/services/${id}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (res.ok) {
        setServices((prev) => prev.filter((s) => s.id !== id));
      } else if (res.status === 401 || res.status === 403) {
        // Token expired or invalid — clear it and redirect to login
        localStorage.removeItem('token');
        alert('Your session has expired. Please log in again.');
        window.location.href = '/admin';
      } else {
        const errData = await res.json().catch(() => ({}));
        alert(errData.error || errData.message || 'Failed to delete service.');
      }
    } catch (err) {
      console.error('Delete error:', err);
      alert('Network error while deleting service.');
    }
  };

  return (
    <div className="p-6 md:p-8 max-w-5xl mx-auto pb-20">
      {/* ── Page Header ────────────────────────────────────────── */}
      <div className="flex flex-wrap items-center justify-between gap-4 mb-8">
        <div>
          <h1 className="text-2xl md:text-3xl font-extrabold text-[#0056b3] tracking-tight">
            Service Management
          </h1>
          <p className="text-sm text-gray-500 mt-1">
            Manage Barangay Services, Requirements, and Procedures
          </p>
        </div>
        <Link
          href="/admin/services/create"
          className="inline-flex items-center gap-2 bg-[#0056b3] text-white rounded-xl px-4 py-2.5 font-bold text-sm hover:bg-blue-800 transition-all shadow-sm hover:shadow-md no-underline"
        >
          <i className="fas fa-plus text-xs" />
          <span>Add Service Information</span>
        </Link>
      </div>

      {/* ── Loading State ──────────────────────────────────────── */}
      {loading ? (
        <div className="flex flex-col items-center justify-center py-28 text-gray-400 text-sm gap-3">
          <i className="fas fa-spinner fa-spin text-3xl text-[#0056b3]" />
          <span>Loading services...</span>
        </div>
      ) : services.length === 0 ? (
        /* ── Empty State ────────────────────────────────────────── */
        <div className="bg-white rounded-2xl border border-gray-200 p-12 flex flex-col items-center justify-center text-center shadow-sm">
          <div className="w-16 h-16 rounded-2xl bg-blue-50 flex items-center justify-center text-[#0056b3] text-2xl mb-4">
            <i className="fas fa-hands-helping" />
          </div>
          <h3 className="text-lg font-bold text-gray-800 mb-1">No services found</h3>
          <p className="text-sm text-gray-400 max-w-sm mb-6">
            Get started by creating your first service information card with requirements and procedures.
          </p>
          <Link
            href="/admin/services/create"
            className="inline-flex items-center gap-2 bg-[#0056b3] text-white rounded-xl px-5 py-2.5 font-bold text-sm hover:bg-blue-800 transition-colors shadow-sm"
          >
            <i className="fas fa-plus text-xs" />
            <span>Create First Service</span>
          </Link>
        </div>
      ) : (
        /* ── Service Cards ──────────────────────────────────────── */
        <div className="flex flex-col gap-6">
          {services.map((service) => {
            const requirements = parseArray(service.requirements);
            const procedures = parseArray(service.procedures || service.procedure || service.steps);
            const serviceName = service.name || service.title || 'Untitled Service';
            const description = service.description || 'Service information and processing details.';
            const statusLabel = service.status || 'Active';
            const isActive = statusLabel.toLowerCase() === 'active';
            const iconClass = service.icon_class || 'fas fa-file-alt';

            return (
              <div
                key={service.id}
                className="bg-white rounded-2xl shadow-sm border border-gray-200 hover:border-gray-300 transition-all overflow-hidden"
              >
                {/* ── Card Header ── */}
                <div className="p-6 pb-4 border-b border-gray-100 flex items-start justify-between gap-4">
                  <div className="flex items-start gap-3.5">
                    <div className="w-11 h-11 rounded-xl bg-blue-50 text-[#0056b3] flex items-center justify-center text-xl shrink-0 mt-0.5">
                      <i className={iconClass} />
                    </div>
                    <div>
                      <h2 className="text-lg md:text-xl font-bold text-gray-900 leading-tight">
                        {serviceName}
                      </h2>
                      <p className="text-sm text-gray-500 mt-1 leading-relaxed">
                        {description}
                      </p>
                    </div>
                  </div>

                  <span
                    className={`shrink-0 text-xs font-bold px-3 py-1 rounded-full border ${
                      isActive
                        ? 'bg-green-50 text-green-700 border-green-200'
                        : 'bg-gray-100 text-gray-500 border-gray-200'
                    }`}
                  >
                    {statusLabel}
                  </span>
                </div>

                {/* ── Requirements & Procedures SIDE BY SIDE ── */}
                <div className="p-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                    {/* Requirements Column */}
                    <div className="border-2 border-[#006eb3] rounded-xl p-5 bg-white min-h-[200px]">
                      <h4 className="text-sm font-extrabold text-[#006eb3] uppercase mb-3 tracking-wide border-b-2 border-blue-100 pb-2">
                        REQUIREMENTS:
                      </h4>
                      {requirements.length > 0 ? (
                        <ul className="list-disc pl-5 text-gray-600 space-y-2 text-sm leading-relaxed">
                          {requirements.map((req, idx) => (
                            <li key={idx}>{req}</li>
                          ))}
                        </ul>
                      ) : (
                        <p className="text-xs text-gray-400 italic">
                          No specific requirements specified.
                        </p>
                      )}
                    </div>

                    {/* Procedures Column */}
                    <div className="border-2 border-[#006eb3] rounded-xl p-5 bg-white min-h-[200px]">
                      <h4 className="text-sm font-extrabold text-[#006eb3] uppercase mb-3 tracking-wide border-b-2 border-blue-100 pb-2">
                        PROCEDURE:
                      </h4>
                      {procedures.length > 0 ? (
                        <ol className="list-decimal pl-5 text-gray-600 space-y-2 text-sm leading-relaxed">
                          {procedures.map((proc, idx) => (
                            <li key={idx}>{proc}</li>
                          ))}
                        </ol>
                      ) : (
                        <p className="text-xs text-gray-400 italic">
                          No procedures specified.
                        </p>
                      )}
                    </div>
                  </div>
                </div>

                {/* ── Card Footer ── */}
                <div className="px-6 py-3.5 bg-gray-50/70 border-t border-gray-100 flex flex-wrap items-center justify-between gap-3">
                  <div className="flex items-center gap-2 text-xs text-gray-400 font-medium">
                    <i className="fas fa-clock text-gray-300" />
                    <span>{timeAgo(service.updated_at || service.created_at)}</span>
                  </div>

                  <div className="flex items-center gap-2">
                    <Link
                      href={`/admin/services/view/${service.id}`}
                      className="inline-flex items-center gap-1.5 bg-white border border-gray-200 text-gray-700 hover:text-[#0056b3] hover:border-[#0056b3] px-3.5 py-1.5 rounded-lg text-xs font-bold transition-colors shadow-2xs no-underline"
                    >
                      <i className="fas fa-eye text-xs" />
                      <span>View</span>
                    </Link>

                    <Link
                      href={`/admin/services/edit/${service.id}`}
                      className="inline-flex items-center gap-1.5 bg-[#0056b3] text-white hover:bg-blue-800 px-3.5 py-1.5 rounded-lg text-xs font-bold transition-colors shadow-2xs no-underline"
                    >
                      <i className="fas fa-edit text-xs" />
                      <span>Edit</span>
                    </Link>

                    <button
                      type="button"
                      onClick={() => handleDelete(service.id, serviceName)}
                      className="inline-flex items-center gap-1.5 bg-red-500 text-white hover:bg-red-600 px-3 py-1.5 rounded-lg text-xs font-bold transition-colors shadow-2xs cursor-pointer border-0"
                    >
                      <i className="fas fa-trash-alt text-xs" />
                      <span>Delete</span>
                    </button>
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
