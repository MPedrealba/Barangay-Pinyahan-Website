'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';

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

function timeAgo(dateStr) {
  if (!dateStr) return '';
  const diff = Date.now() - new Date(dateStr).getTime();
  const days = Math.floor(diff / 86400000);
  if (days === 0) return 'Updated today';
  if (days === 1) return 'Updated 1 day ago';
  return `Updated ${days} days ago`;
}

export default function ViewServicePage() {
  const params = useParams();
  const id = params?.id;
  const router = useRouter();

  const [service, setService] = useState(null);
  const [status, setStatus] = useState('Active');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!id) return;

    const fetchService = async () => {
      try {
        const token = localStorage.getItem('token');
        const apiBase = process.env.NEXT_PUBLIC_API_URL || '';
        const res = await fetch(`${apiBase}/api/services/${id}`, {
          headers: { Authorization: `Bearer ${token}` }
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
      const apiBase = process.env.NEXT_PUBLIC_API_URL || '';
      await fetch(`${apiBase}/api/services/${id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ status: newStatus })
      });
    } catch (err) {
      console.error('Failed to update status:', err);
    }
  };

  if (loading) {
    return (
      <div className="p-8 max-w-4xl mx-auto flex flex-col items-center justify-center py-28 text-gray-400 gap-3">
        <i className="fas fa-spinner fa-spin text-3xl text-[#0056b3]" />
        <span>Loading service details...</span>
      </div>
    );
  }

  if (!service) {
    return (
      <div className="p-8 max-w-4xl mx-auto text-center py-24">
        <p className="text-red-500 font-bold mb-4">Service not found.</p>
        <Link href="/admin/services" className="text-[#0056b3] font-bold text-sm hover:underline">
          &larr; Back to Services
        </Link>
      </div>
    );
  }

  const requirements = parseArray(service.requirements);
  const procedures = parseArray(service.procedures || service.procedure || service.steps);
  const name = service.name || service.title || 'Untitled Service';
  const description = service.description || 'Service Information and Processing Details';

  return (
    <div className="p-6 md:p-8 max-w-4xl mx-auto pb-20">
      {/* ── Page Header ── */}
      <div className="flex flex-wrap items-center justify-between gap-4 mb-6">
        <div>
          <div className="flex items-center gap-2 text-xs font-semibold text-gray-400 uppercase tracking-wider mb-1">
            <Link href="/admin/services" className="hover:text-[#0056b3] transition-colors">
              Services
            </Link>
            <span>/</span>
            <span className="text-gray-700">View Service #{id}</span>
          </div>
          <h1 className="text-2xl md:text-3xl font-extrabold text-gray-900 tracking-tight">
            Service Details
          </h1>
        </div>

        <Link
          href="/admin/services"
          className="inline-flex items-center gap-2 px-4 py-2 rounded-xl border border-gray-300 text-sm font-semibold text-gray-700 bg-white hover:bg-gray-50 transition-colors shadow-2xs"
        >
          <i className="fas fa-arrow-left text-xs" />
          <span>Back to List</span>
        </Link>
      </div>

      {/* ── Main Content Card ── */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6 md:p-8 space-y-6">
        {/* Title & Icon */}
        <div className="flex items-start justify-between gap-4 pb-4 border-b border-gray-100">
          <div>
            <h2 className="text-xl md:text-2xl font-bold text-gray-900 leading-tight">{name}</h2>
            <p className="text-sm text-gray-500 mt-1">{description}</p>
          </div>
          <div className="w-12 h-12 rounded-xl bg-blue-50 text-[#0056b3] flex items-center justify-center text-2xl shrink-0">
            <i className={service.icon_class || 'fas fa-file-alt'} />
          </div>
        </div>

        {/* Requirements */}
        <div>
          <div className="flex items-center gap-2 mb-3">
            <span className="w-2 h-2 rounded-full bg-[#0056b3]" />
            <h3 className="text-xs font-bold uppercase tracking-wider text-gray-700">
              Requirements ({requirements.length})
            </h3>
          </div>
          {requirements.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-2.5">
              {requirements.map((req, idx) => (
                <div
                  key={idx}
                  className="bg-gray-50 border border-gray-100 rounded-xl px-3.5 py-2.5 flex items-center gap-2.5 text-sm text-gray-700 font-medium"
                >
                  <i className="fas fa-check text-blue-600 text-xs" />
                  <span>{req}</span>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-xs text-gray-400 italic">No requirements specified.</p>
          )}
        </div>

        {/* Procedures */}
        <div className="pt-2 border-t border-gray-100">
          <div className="flex items-center gap-2 mb-3">
            <span className="w-2 h-2 rounded-full bg-indigo-600" />
            <h3 className="text-xs font-bold uppercase tracking-wider text-gray-700">
              Procedures ({procedures.length})
            </h3>
          </div>
          {procedures.length > 0 ? (
            <div className="space-y-2.5">
              {procedures.map((step, idx) => (
                <div
                  key={idx}
                  className="bg-gray-50 border border-gray-100 rounded-xl p-3.5 flex items-start gap-3"
                >
                  <span className="w-6 h-6 rounded-lg bg-indigo-600 text-white text-xs font-extrabold flex items-center justify-center shrink-0 mt-0.5">
                    {idx + 1}
                  </span>
                  <span className="text-sm font-medium text-gray-800">{step}</span>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-xs text-gray-400 italic">No procedures specified.</p>
          )}
        </div>

        {/* Card Footer */}
        <div className="flex flex-wrap items-center justify-between pt-4 border-t border-gray-100 gap-4">
          <div className="flex items-center gap-2.5">
            <span className="text-xs text-gray-500 font-bold uppercase">Status:</span>
            <select
              value={status}
              onChange={(e) => handleStatusChange(e.target.value)}
              className="border border-gray-300 rounded-lg px-3 py-1.5 text-xs font-semibold text-gray-700 bg-white focus:outline-none focus:ring-2 focus:ring-[#0056b3]/20"
            >
              <option value="Active">Active</option>
              <option value="Inactive">Inactive</option>
            </select>
            <span className="text-xs text-gray-400 ml-2">
              {timeAgo(service.updated_at || service.created_at)}
            </span>
          </div>

          <div className="flex items-center gap-2">
            <Link
              href={`/admin/services/edit/${id}`}
              className="bg-[#0056b3] hover:bg-blue-800 text-white px-5 py-2 rounded-xl text-xs font-bold transition-colors shadow-2xs no-underline"
            >
              Edit Service
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
