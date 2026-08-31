'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';

// Safe parser for JSON array columns from TiDB/MySQL
function parseJsonArray(field) {
  if (!field) return [''];
  if (Array.isArray(field)) {
    return field.length > 0 ? field : [''];
  }
  if (typeof field === 'string') {
    try {
      const parsed = JSON.parse(field);
      return Array.isArray(parsed) && parsed.length > 0 ? parsed : (field.trim() ? [field] : ['']);
    } catch {
      return field.trim() ? [field] : [''];
    }
  }
  return [''];
}

export default function EditServicePage() {
  // 1. Grab service id from route parameters
  const params = useParams();
  const id = params?.id;
  const router = useRouter();

  // Controlled form state
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    icon_class: 'fas fa-file-alt',
    icon_color: 'blue',
    status: 'Active',
    requirements: [''],
    procedures: ['']
  });

  // 5. Loading and submitting states to prevent blank form rendering
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [toast, setToast] = useState(null); // { type, message }

  const showToast = (type, message) => {
    setToast({ type, message });
    setTimeout(() => setToast(null), 3500);
  };

  // 2. Fetch service data on component mount
  useEffect(() => {
    if (!id) return;

    const fetchServiceData = async () => {
      setIsLoading(true);
      setErrorMessage('');

      try {
        const token = localStorage.getItem('token');
        const apiBase = process.env.NEXT_PUBLIC_API_URL || '';
        
        // Fetch single service by ID
        const res = await fetch(`${apiBase}/api/services/${id}`, {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        });

        if (!res.ok) {
          throw new Error(`Failed to load service (Status: ${res.status})`);
        }

        const data = await res.json();
        const service = data.service || data;

        if (!service) {
          throw new Error('Service data is empty.');
        }

        // 3 & 4. Parse JSON requirements and procedures safely, defaulting to ['']
        const parsedRequirements = parseJsonArray(service.requirements);
        const parsedProcedures = parseJsonArray(service.procedures || service.procedure || service.steps);

        setFormData({
          name: service.name || service.title || '',
          description: service.description || '',
          icon_class: service.icon_class || 'fas fa-file-alt',
          icon_color: service.icon_color || 'blue',
          status: service.status || 'Active',
          requirements: parsedRequirements,
          procedures: parsedProcedures
        });
      } catch (err) {
        console.error('Error fetching service data:', err);
        setErrorMessage(err.message || 'Failed to load service information.');
        showToast('error', 'Failed to load service data.');
      } finally {
        setIsLoading(false);
      }
    };

    fetchServiceData();
  }, [id]);

  // ── Requirements Handlers ────────────────────────────────────────────
  const handleRequirementChange = (index, value) => {
    setFormData((prev) => ({
      ...prev,
      requirements: prev.requirements.map((r, i) => (i === index ? value : r))
    }));
  };

  const addRequirement = () => {
    setFormData((prev) => ({
      ...prev,
      requirements: [...prev.requirements, '']
    }));
  };

  const removeRequirement = (index) => {
    setFormData((prev) => {
      const filtered = prev.requirements.filter((_, i) => i !== index);
      return {
        ...prev,
        requirements: filtered.length > 0 ? filtered : ['']
      };
    });
  };

  // ── Procedures Handlers ──────────────────────────────────────────────
  const handleProcedureChange = (index, value) => {
    setFormData((prev) => ({
      ...prev,
      procedures: prev.procedures.map((p, i) => (i === index ? value : p))
    }));
  };

  const addProcedure = () => {
    setFormData((prev) => ({
      ...prev,
      procedures: [...prev.procedures, '']
    }));
  };

  const removeProcedure = (index) => {
    setFormData((prev) => {
      const filtered = prev.procedures.filter((_, i) => i !== index);
      return {
        ...prev,
        procedures: filtered.length > 0 ? filtered : ['']
      };
    });
  };

  // ── Save/Submit Handler ──────────────────────────────────────────────
  const handleSubmit = async (e) => {
    if (e) e.preventDefault();

    if (!formData.name.trim()) {
      showToast('error', 'Service name is required.');
      return;
    }

    setIsSubmitting(true);

    try {
      const token = localStorage.getItem('token');
      const apiBase = process.env.NEXT_PUBLIC_API_URL || '';

      const payload = {
        name: formData.name.trim(),
        description: formData.description.trim(),
        icon_class: formData.icon_class,
        icon_color: formData.icon_color,
        status: formData.status,
        requirements: formData.requirements.filter((r) => r.trim() !== ''),
        procedures: formData.procedures.filter((p) => p.trim() !== '')
      };

      const res = await fetch(`${apiBase}/api/services/${id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(payload)
      });

      if (res.ok) {
        showToast('success', 'Service updated successfully!');
        setTimeout(() => {
          router.push('/admin/services');
        }, 1200);
      } else {
        const err = await res.json();
        showToast('error', err.error || 'Failed to update service.');
      }
    } catch (err) {
      console.error('Update error:', err);
      showToast('error', 'Network error. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  // ── Render Loading Screen (Prevents Blank Form) ───────────────────────
  if (isLoading) {
    return (
      <div className="p-8 max-w-4xl mx-auto flex flex-col items-center justify-center py-32 text-gray-400 gap-3">
        <i className="fas fa-spinner fa-spin text-3xl text-[#0056b3]" />
        <span className="text-sm font-medium">Loading service information...</span>
      </div>
    );
  }

  // ── Render Error Screen if Service Not Found ─────────────────────────
  if (errorMessage && !formData.name) {
    return (
      <div className="p-8 max-w-4xl mx-auto text-center py-24">
        <div className="w-14 h-14 rounded-2xl bg-red-50 text-red-500 flex items-center justify-center text-2xl mx-auto mb-4">
          <i className="fas fa-exclamation-triangle" />
        </div>
        <h2 className="text-lg font-bold text-gray-800 mb-2">Failed to Load Service</h2>
        <p className="text-sm text-gray-500 mb-6">{errorMessage}</p>
        <Link
          href="/admin/services"
          className="inline-flex items-center gap-2 bg-[#0056b3] text-white px-5 py-2 rounded-xl text-sm font-bold shadow-sm hover:bg-blue-800"
        >
          <i className="fas fa-arrow-left text-xs" />
          <span>Back to Services</span>
        </Link>
      </div>
    );
  }

  // ── Form Classes ─────────────────────────────────────────────────────
  const inputClass =
    'w-full rounded-xl border border-gray-300 bg-white px-4 py-2.5 text-sm text-gray-800 placeholder-gray-400 focus:border-[#0056b3] focus:outline-none focus:ring-2 focus:ring-[#0056b3]/20 transition-all';
  const labelClass = 'block text-xs font-bold uppercase tracking-wider text-gray-600 mb-1.5';

  return (
    <div className="p-6 md:p-8 max-w-4xl mx-auto pb-24">
      {/* ── Toast Notification ────────────────────────────────────────── */}
      {toast && (
        <div
          className={`fixed top-6 right-6 z-50 flex items-center gap-3 rounded-xl px-5 py-3.5 shadow-xl text-sm font-semibold transition-all animate-bounce ${
            toast.type === 'success' ? 'bg-green-600 text-white' : 'bg-red-600 text-white'
          }`}
        >
          <i className={`fas ${toast.type === 'success' ? 'fa-check-circle' : 'fa-exclamation-circle'} text-lg`} />
          <span>{toast.message}</span>
        </div>
      )}

      {/* ── Header ────────────────────────────────────────────────────── */}
      <div className="flex flex-wrap items-center justify-between gap-4 mb-6">
        <div>
          <div className="flex items-center gap-2 text-xs font-semibold text-gray-400 uppercase tracking-wider mb-1">
            <Link href="/admin/services" className="hover:text-[#0056b3] transition-colors">
              Services
            </Link>
            <span>/</span>
            <span className="text-gray-700">Edit Service #{id}</span>
          </div>
          <h1 className="text-2xl md:text-3xl font-extrabold text-gray-900 tracking-tight">
            Edit Service Information
          </h1>
          <p className="text-sm text-gray-500 mt-0.5">
            Modify the core service details, checklist of requirements, and step-by-step procedures.
          </p>
        </div>

        <Link
          href="/admin/services"
          className="inline-flex items-center gap-2 px-4 py-2 rounded-xl border border-gray-300 text-sm font-semibold text-gray-700 bg-white hover:bg-gray-50 transition-colors shadow-2xs"
        >
          <i className="fas fa-arrow-left text-xs" />
          <span>Cancel &amp; Return</span>
        </Link>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* ── Card: Basic Details ──────────────────────────────────────── */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6 md:p-7 space-y-5">
          <div className="flex items-center gap-3 pb-4 border-b border-gray-100">
            <div className="w-9 h-9 rounded-xl bg-blue-50 text-[#0056b3] flex items-center justify-center text-lg shrink-0">
              <i className="fas fa-info-circle" />
            </div>
            <div>
              <h2 className="text-base font-bold text-gray-800">Basic Information</h2>
              <p className="text-xs text-gray-400">Specify service title, description, and status</p>
            </div>
          </div>

          {/* 6. Controlled Inputs tied to value={formData.property} */}
          <div>
            <label className={labelClass}>
              Service Name <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              placeholder="e.g. Barangay Clearance"
              className={inputClass}
              required
            />
          </div>

          <div>
            <label className={labelClass}>Service Description</label>
            <textarea
              rows={3}
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              placeholder="Provide a brief summary of this service and what it offers..."
              className={inputClass}
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2">
            <div>
              <label className={labelClass}>Status</label>
              <select
                value={formData.status}
                onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                className={inputClass}
              >
                <option value="Active">Active</option>
                <option value="Inactive">Inactive</option>
              </select>
            </div>

            <div>
              <label className={labelClass}>Service Icon</label>
              <div className="relative">
                <select
                  value={formData.icon_class}
                  onChange={(e) => setFormData({ ...formData, icon_class: e.target.value })}
                  className={inputClass}
                >
                  <option value="fas fa-file-alt">📄 Document / General Clearance</option>
                  <option value="fas fa-certificate">📜 Certificate / Indigency</option>
                  <option value="fas fa-building">🏢 Business &amp; Commercial</option>
                  <option value="fas fa-home">🏠 Residency &amp; Household</option>
                  <option value="fas fa-hands-helping">🤝 Social &amp; Financial Aid</option>
                  <option value="fas fa-id-card">🪪 ID &amp; Registration</option>
                  <option value="fas fa-balance-scale">⚖️ Legal &amp; Lupon</option>
                  <option value="fas fa-heartbeat">🩺 Health &amp; Medical</option>
                </select>
              </div>
            </div>
          </div>
        </div>

        {/* ── Card: Requirements ──────────────────────────────────────── */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6 md:p-7 space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-gray-100">
            <div className="flex items-center gap-2.5">
              <span className="w-2.5 h-2.5 rounded-full bg-[#0056b3]" />
              <h2 className="text-sm font-bold uppercase tracking-wider text-gray-800">
                Checklist of Requirements
              </h2>
            </div>
            <button
              type="button"
              onClick={addRequirement}
              className="inline-flex items-center gap-1 text-xs font-bold text-[#0056b3] bg-blue-50 hover:bg-blue-100 px-3 py-1.5 rounded-lg transition-colors"
            >
              <i className="fas fa-plus text-[10px]" />
              <span>Add Requirement</span>
            </button>
          </div>

          <div className="space-y-3">
            {formData.requirements.map((req, idx) => (
              <div key={idx} className="flex items-center gap-3">
                <span className="w-6 h-6 rounded-full bg-blue-100 text-[#0056b3] text-xs font-bold flex items-center justify-center shrink-0">
                  {idx + 1}
                </span>
                <input
                  type="text"
                  value={req}
                  onChange={(e) => handleRequirementChange(idx, e.target.value)}
                  placeholder={`Requirement #${idx + 1} (e.g. Valid Government ID)`}
                  className={inputClass}
                />
                <button
                  type="button"
                  onClick={() => removeRequirement(idx)}
                  className="p-2 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors shrink-0"
                  title="Remove requirement"
                >
                  <i className="fas fa-times text-sm" />
                </button>
              </div>
            ))}
          </div>
        </div>

        {/* ── Card: Procedures ────────────────────────────────────────── */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6 md:p-7 space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-gray-100">
            <div className="flex items-center gap-2.5">
              <span className="w-2.5 h-2.5 rounded-full bg-[#006eb3]" />
              <h2 className="text-sm font-bold uppercase tracking-wider text-gray-800">
                Step-by-Step Procedures
              </h2>
            </div>
            <button
              type="button"
              onClick={addProcedure}
              className="inline-flex items-center gap-1 text-xs font-bold text-[#006eb3] bg-blue-50 hover:bg-blue-100 px-3 py-1.5 rounded-lg transition-colors"
            >
              <i className="fas fa-plus text-[10px]" />
              <span>Add Step</span>
            </button>
          </div>

          <div className="space-y-3">
            {formData.procedures.map((step, idx) => (
              <div key={idx} className="flex items-center gap-3">
                <span className="w-6 h-6 rounded-lg bg-[#006eb3] text-white text-xs font-bold flex items-center justify-center shrink-0 shadow-2xs">
                  {idx + 1}
                </span>
                <input
                  type="text"
                  value={step}
                  onChange={(e) => handleProcedureChange(idx, e.target.value)}
                  placeholder={`Step #${idx + 1} (e.g. Submit application form at the counter)`}
                  className={inputClass}
                />
                <button
                  type="button"
                  onClick={() => removeProcedure(idx)}
                  className="p-2 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors shrink-0"
                  title="Remove step"
                >
                  <i className="fas fa-times text-sm" />
                </button>
              </div>
            ))}
          </div>
        </div>

        {/* ── Footer Sticky Action Bar ────────────────────────────────── */}
        <div className="sticky bottom-6 z-20 bg-white/95 backdrop-blur-md border border-gray-200 rounded-2xl shadow-xl p-4 flex items-center justify-between">
          <Link
            href="/admin/services"
            className="px-5 py-2.5 rounded-xl text-sm font-semibold text-gray-600 hover:text-gray-900 hover:bg-gray-100 transition-colors"
          >
            Cancel
          </Link>

          <button
            type="submit"
            disabled={isSubmitting}
            className="inline-flex items-center gap-2 bg-green-600 hover:bg-green-700 active:scale-[0.99] disabled:bg-gray-400 text-white text-sm font-bold px-7 py-2.5 rounded-xl shadow-md hover:shadow-lg transition-all"
          >
            {isSubmitting ? (
              <>
                <i className="fas fa-spinner fa-spin text-sm" />
                <span>Saving Changes...</span>
              </>
            ) : (
              <>
                <i className="fas fa-save text-sm" />
                <span>Save Changes</span>
              </>
            )}
          </button>
        </div>
      </form>
    </div>
  );
}
