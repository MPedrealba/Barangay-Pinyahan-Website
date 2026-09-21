'use client';

import { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import { apiGet, apiPut } from '@/lib/api';

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
  if (!dateStr) return 'Updated today';
  const diff = Date.now() - new Date(dateStr).getTime();
  const days = Math.floor(diff / 86400000);
  if (days === 0) return 'Updated today';
  if (days === 1) return 'Updated 1 day ago';
  return `Updated ${days} days ago`;
}

export default function ViewServicePage() {
  const params = useParams();
  const id = params?.id;

  const [service, setService]       = useState(null);
  const [status, setStatus]         = useState('Active');
  const [loading, setLoading]       = useState(true);
  const [isUpdating, setIsUpdating] = useState(false);
  const [toast, setToast]           = useState(null); // { type: 'success' | 'error', message: string }

  const showToast = (type, message) => {
    setToast({ type, message });
    setTimeout(() => setToast(null), 3500);
  };

  useEffect(() => {
    if (!id) return;

    const fetchService = async () => {
      try {
        const data = await apiGet(`/api/services/${id}`);
        if (data) {
          const s = data.service || data;
          setService(s);
          setStatus(s.status || 'Active');
        }
      } catch (err) {
        console.error('Failed to fetch service:', err);
        showToast('error', 'Failed to load service details.');
      } finally {
        setLoading(false);
      }
    };

    fetchService();
  }, [id]);

  const handleStatusChange = async (newStatus) => {
    if (newStatus === status || isUpdating) return;
    const previousStatus = status;
    setStatus(newStatus);
    setIsUpdating(true);

    try {
      await apiPut(`/api/services/${id}`, { status: newStatus });
      setService((prev) => (prev ? { ...prev, status: newStatus, updated_at: new Date().toISOString() } : prev));
      showToast('success', `Service status updated to ${newStatus}.`);
    } catch (err) {
      console.error('Failed to update status:', err);
      setStatus(previousStatus);
      showToast('error', err.message || 'Failed to update service status.');
    } finally {
      setIsUpdating(false);
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
  const procedures   = parseArray(service.procedures || service.procedure || service.steps);
  const name         = service.name || service.title || 'Untitled Service';
  const description  = service.description || 'Service Information and Processing Details';

  return (
    <div className="p-6 md:p-8 max-w-4xl mx-auto pb-20 relative">
      {/* Toast Notification */}
      {toast && (
        <div
          className={`fixed bottom-6 right-6 z-50 px-4 py-3 rounded-xl shadow-lg border text-sm font-semibold flex items-center gap-2.5 transition-all ${
            toast.type === 'success'
              ? 'bg-emerald-50 text-emerald-800 border-emerald-200 shadow-emerald-900/10'
              : 'bg-red-50 text-red-800 border-red-200 shadow-red-900/10'
          }`}
        >
          <i
            className={`fas ${
              toast.type === 'success' ? 'fa-check-circle text-emerald-600' : 'fa-exclamation-circle text-red-600'
            }`}
          />
          <span>{toast.message}</span>
        </div>
      )}

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
          className="inline-flex items-center gap-2 px-4 py-2 rounded-xl border border-gray-300 text-sm font-semibold text-gray-700 bg-white hover:bg-gray-50 transition-colors shadow-2xs no-underline"
        >
          <i className="fas fa-arrow-left text-xs" />
          <span>Back to List</span>
        </Link>
      </div>

      {/* ── Main Content Card ── */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6 md:p-8 space-y-6">
        {/* Title, Badge & Icon */}
        <div className="flex items-start justify-between gap-4 pb-4 border-b border-gray-100">
          <div className="space-y-1.5">
            <div className="flex flex-wrap items-center gap-2.5">
              <h2 className="text-xl md:text-2xl font-bold text-gray-900 leading-tight m-0">
                {name}
              </h2>
              <span
                className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-bold border transition-colors ${
                  status === 'Active'
                    ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                    : 'bg-gray-100 text-gray-600 border-gray-200'
                }`}
              >
                <span
                  className={`w-1.5 h-1.5 rounded-full ${
                    status === 'Active' ? 'bg-emerald-500' : 'bg-gray-400'
                  }`}
                />
                <span>{status}</span>
              </span>
            </div>
            <p className="text-sm text-gray-500 m-0 leading-relaxed">{description}</p>
          </div>
          <div className="w-12 h-12 rounded-xl bg-blue-50 text-[#0056b3] flex items-center justify-center text-2xl shrink-0">
            <i className={service.icon_class || 'fas fa-file-alt'} />
          </div>
        </div>

        {/* Requirements */}
        <div>
          <div className="flex items-center gap-2 mb-3">
            <span className="w-2 h-2 rounded-full bg-[#0056b3]" />
            <h3 className="text-xs font-bold uppercase tracking-wider text-gray-700 m-0">
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
            <h3 className="text-xs font-bold uppercase tracking-wider text-gray-700 m-0">
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

        {/* Card Footer: Live Status Switcher */}
        <div className="flex flex-wrap items-center justify-between pt-4 border-t border-gray-100 gap-4">
          <div className="flex items-center gap-3">
            <label htmlFor="service-status-select" className="text-xs text-gray-500 font-bold uppercase tracking-wider">
              Status:
            </label>
            <div className="relative inline-flex items-center">
              <select
                id="service-status-select"
                value={status}
                disabled={isUpdating}
                onChange={(e) => handleStatusChange(e.target.value)}
                className={`border rounded-lg pl-3 pr-8 py-1.5 text-xs font-bold transition-all appearance-none cursor-pointer outline-none ${
                  status === 'Active'
                    ? 'bg-emerald-50 text-emerald-800 border-emerald-300 focus:ring-2 focus:ring-emerald-400/20'
                    : 'bg-gray-100 text-gray-700 border-gray-300 focus:ring-2 focus:ring-gray-400/20'
                } disabled:opacity-60 disabled:cursor-not-allowed`}
              >
                <option value="Active">Active</option>
                <option value="Inactive">Inactive</option>
              </select>
              <div className="absolute right-2.5 pointer-events-none text-xs text-gray-500">
                {isUpdating ? (
                  <i className="fas fa-spinner fa-spin text-blue-600" />
                ) : (
                  <i className="fas fa-chevron-down text-[10px]" />
                )}
              </div>
            </div>
            <span className="text-xs text-gray-400 ml-1">
              {timeAgo(service.updated_at || service.created_at)}
            </span>
          </div>

          <div className="flex items-center gap-2">
            <Link
              href={`/admin/services/edit/${id}`}
              className="bg-[#0056b3] hover:bg-blue-800 text-white px-5 py-2 rounded-xl text-xs font-bold transition-colors shadow-2xs no-underline inline-flex items-center gap-1.5"
            >
              <i className="fas fa-edit text-[11px]" />
              <span>Edit Service</span>
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
