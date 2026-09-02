'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

export default function CreateCitizensCharterPage() {
  const router = useRouter();

  // ── 1. Form State Structure ──────────────────────────────────────────
  const [formData, setFormData] = useState({
    service_name: '',
    office_division: 'Administrative Division',
    classification: 'Simple',
    transaction_type: 'G2C',
    who_may_avail: '',
    requirements: [
      { name: '', where_to_secure: '' }
    ],
    steps: [
      { client_step: '', agency_action: '', fees: 'None', processing_time: '', person_responsible: '' }
    ]
  });

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [toast, setToast] = useState(null); // { type: 'success' | 'error', message: string }

  // ── Toast Notification Helper ────────────────────────────────────────
  const showToast = (type, message) => {
    setToast({ type, message });
    setTimeout(() => setToast(null), 4000);
  };

  // ── Core Details Change Handler ──────────────────────────────────────
  const handleCoreChange = (field, value) => {
    setFormData((prev) => ({
      ...prev,
      [field]: value
    }));
  };

  // ── Dynamic Requirements Handlers ────────────────────────────────────
  const addRequirement = () => {
    setFormData((prev) => ({
      ...prev,
      requirements: [...prev.requirements, { name: '', where_to_secure: '' }]
    }));
  };

  const removeRequirement = (index) => {
    if (formData.requirements.length <= 1) {
      // Clear instead of removing last row
      setFormData((prev) => ({
        ...prev,
        requirements: [{ name: '', where_to_secure: '' }]
      }));
      return;
    }
    setFormData((prev) => ({
      ...prev,
      requirements: prev.requirements.filter((_, i) => i !== index)
    }));
  };

  const handleRequirementChange = (index, field, value) => {
    setFormData((prev) => ({
      ...prev,
      requirements: prev.requirements.map((req, i) =>
        i === index ? { ...req, [field]: value } : req
      )
    }));
  };

  // ── Dynamic Processing Steps Handlers ────────────────────────────────
  const addStep = () => {
    setFormData((prev) => ({
      ...prev,
      steps: [
        ...prev.steps,
        { client_step: '', agency_action: '', fees: 'None', processing_time: '', person_responsible: '' }
      ]
    }));
  };

  const removeStep = (index) => {
    if (formData.steps.length <= 1) {
      setFormData((prev) => ({
        ...prev,
        steps: [{ client_step: '', agency_action: '', fees: 'None', processing_time: '', person_responsible: '' }]
      }));
      return;
    }
    setFormData((prev) => ({
      ...prev,
      steps: prev.steps.filter((_, i) => i !== index)
    }));
  };

  const handleStepChange = (index, field, value) => {
    setFormData((prev) => ({
      ...prev,
      steps: prev.steps.map((step, i) =>
        i === index ? { ...step, [field]: value } : step
      )
    }));
  };

  // ── Submit Handler ───────────────────────────────────────────────────
  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!formData.service_name.trim()) {
      showToast('error', 'Please provide a Service Name.');
      return;
    }

    setIsSubmitting(true);

    const payload = {
      service_name: formData.service_name.trim(),
      office_division: formData.office_division.trim(),
      classification: formData.classification,
      transaction_type: formData.transaction_type,
      who_may_avail: formData.who_may_avail.trim(),
      requirements: formData.requirements
        .filter((r) => r.name.trim() !== '' || r.where_to_secure.trim() !== '')
        .map((r) => ({
          name: r.name.trim(),
          where_to_secure: r.where_to_secure.trim()
        })),
      steps: formData.steps
        .filter((s) => s.client_step.trim() !== '' || s.agency_action.trim() !== '')
        .map((s, idx) => ({
          step_number: idx + 1,
          client_step: s.client_step.trim(),
          agency_action: s.agency_action.trim(),
          fees: s.fees.trim() || 'None',
          processing_time: s.processing_time.trim(),
          person_responsible: s.person_responsible.trim()
        }))
    };

    try {
      const token = localStorage.getItem('token');
      const apiBase = process.env.NEXT_PUBLIC_API_URL || '';
      const res = await fetch(`${apiBase}/api/admin/citizens-charter`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(payload)
      });

      if (res.ok) {
        showToast('success', "Citizen's Charter created successfully!");
        setTimeout(() => {
          router.push('/admin/citizens-charter');
        }, 1200);
      } else {
        const data = await res.json();
        showToast('error', data.error || 'Failed to create Citizen\'s Charter.');
      }
    } catch (err) {
      console.error('Submit error:', err);
      showToast('error', 'Network error. Please check your connection.');
    } finally {
      setIsSubmitting(false);
    }
  };

  // ── Common Styling Classes ───────────────────────────────────────────
  const inputClass =
    'w-full rounded-lg border border-gray-300 bg-white px-3.5 py-2 text-sm text-gray-800 placeholder-gray-400 focus:border-[#0056b3] focus:outline-none focus:ring-2 focus:ring-[#0056b3]/20 transition-all';
  const textareaClass =
    'w-full rounded-lg border border-gray-300 bg-white px-3.5 py-2 text-sm text-gray-800 placeholder-gray-400 focus:border-[#0056b3] focus:outline-none focus:ring-2 focus:ring-[#0056b3]/20 transition-all resize-y';
  const labelClass = 'block text-xs font-bold uppercase tracking-wider text-gray-600 mb-1.5';

  return (
    <div className="p-6 md:p-8 max-w-5xl mx-auto pb-24">
      {/* ── Toast Message ──────────────────────────────────────────────── */}
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

      {/* ── Top Header Navigation ──────────────────────────────────────── */}
      <div className="flex flex-wrap items-center justify-between gap-4 mb-6">
        <div>
          <div className="flex items-center gap-2 text-xs font-semibold text-gray-400 uppercase tracking-wider mb-1">
            <Link href="/admin/citizens-charter" className="hover:text-[#0056b3] transition-colors">
              Citizen&apos;s Charter
            </Link>
            <span>/</span>
            <span className="text-gray-700">New Charter</span>
          </div>
          <h1 className="text-2xl md:text-3xl font-extrabold text-gray-900 tracking-tight">
            Create Citizen&apos;s Charter
          </h1>
          <p className="text-sm text-gray-500 mt-0.5">
            ARTA-compliant frontline service information and procedure specification.
          </p>
        </div>

        <Link
          href="/admin/citizens-charter"
          className="inline-flex items-center gap-2 px-4 py-2 rounded-lg border border-gray-300 text-sm font-semibold text-gray-700 bg-white hover:bg-gray-50 hover:text-gray-900 transition-colors shadow-sm"
        >
          <i className="fas fa-arrow-left text-xs" />
          <span>Back to List</span>
        </Link>
      </div>

      <form onSubmit={handleSubmit} className="space-y-8">
        {/* ══════════════════════════════════════════════════════════════
            SECTION 1: Core Service Details
        ══════════════════════════════════════════════════════════════ */}
        <section className="bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden">
          <div className="bg-gradient-to-r from-[#0056b3] to-blue-700 px-6 py-4 text-white flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-lg bg-white/10 flex items-center justify-center">
                <i className="fas fa-landmark text-white text-sm" />
              </div>
              <h2 className="text-base font-bold uppercase tracking-wider">1. Core Service Details</h2>
            </div>
            <span className="text-xs bg-white/20 px-2.5 py-1 rounded-full font-medium">ARTA Mandate</span>
          </div>

          <div className="p-6 grid grid-cols-1 md:grid-cols-2 gap-5">
            {/* Service Name */}
            <div className="md:col-span-2">
              <label className={labelClass}>
                Service Name <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                value={formData.service_name}
                onChange={(e) => handleCoreChange('service_name', e.target.value)}
                placeholder="e.g. Barangay Clearance and Certifications / Barangay Business Clearance"
                className={inputClass}
                required
              />
            </div>

            {/* Office / Division */}
            <div>
              <label className={labelClass}>Office / Division</label>
              <input
                type="text"
                value={formData.office_division}
                onChange={(e) => handleCoreChange('office_division', e.target.value)}
                placeholder="e.g. Administrative Division"
                className={inputClass}
              />
            </div>

            {/* Classification */}
            <div>
              <label className={labelClass}>Classification</label>
              <select
                value={formData.classification}
                onChange={(e) => handleCoreChange('classification', e.target.value)}
                className={inputClass}
              >
                <option value="Simple">Simple (under 3 days)</option>
                <option value="Complex">Complex (up to 7 days)</option>
                <option value="Highly Technical">Highly Technical (up to 20 days)</option>
              </select>
            </div>

            {/* Type of Transaction */}
            <div>
              <label className={labelClass}>Type of Transaction</label>
              <select
                value={formData.transaction_type}
                onChange={(e) => handleCoreChange('transaction_type', e.target.value)}
                className={inputClass}
              >
                <option value="G2C">G2C — Government to Citizen</option>
                <option value="G2B">G2B — Government to Business</option>
                <option value="G2G">G2G — Government to Government</option>
                <option value="G2C, G2G">G2C &amp; G2G — Multi-Sectoral</option>
              </select>
            </div>

            {/* Who May Avail */}
            <div className="md:col-span-2">
              <label className={labelClass}>Who May Avail</label>
              <textarea
                rows={2}
                value={formData.who_may_avail}
                onChange={(e) => handleCoreChange('who_may_avail', e.target.value)}
                placeholder="e.g. Residents of Barangay Pinyahan / Sole Proprietors, Partnerships, Corporations operating within the barangay"
                className={textareaClass}
              />
            </div>
          </div>
        </section>

        {/* ══════════════════════════════════════════════════════════════
            SECTION 2: Checklist of Requirements
        ══════════════════════════════════════════════════════════════ */}
        <section className="bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden">
          <div className="bg-gradient-to-r from-[#0056b3] to-blue-700 px-6 py-4 text-white flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-lg bg-white/10 flex items-center justify-center">
                <i className="fas fa-clipboard-check text-white text-sm" />
              </div>
              <h2 className="text-base font-bold uppercase tracking-wider">2. Checklist of Requirements</h2>
            </div>
            <button
              type="button"
              onClick={addRequirement}
              className="inline-flex items-center gap-1.5 bg-white text-[#0056b3] hover:bg-blue-50 px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all shadow-sm"
            >
              <i className="fas fa-plus text-[10px]" />
              <span>Add Requirement</span>
            </button>
          </div>

          <div className="p-6 space-y-3">
            {formData.requirements.map((req, index) => (
              <div
                key={index}
                className="flex flex-col md:flex-row items-start md:items-center gap-3 p-3.5 bg-gray-50 rounded-xl border border-gray-200/70 hover:border-gray-300 transition-colors"
              >
                <div className="w-6 h-6 rounded-full bg-[#0056b3] text-white text-xs font-bold flex items-center justify-center shrink-0 mt-2 md:mt-0">
                  {index + 1}
                </div>

                {/* Requirement Name */}
                <div className="flex-1 w-full">
                  <label className="text-[10px] font-bold text-gray-500 uppercase tracking-wider mb-1 block md:hidden">
                    Requirement
                  </label>
                  <input
                    type="text"
                    value={req.name}
                    onChange={(e) => handleRequirementChange(index, 'name', e.target.value)}
                    placeholder="e.g. Accomplished Information Form / Photocopy of Valid ID"
                    className={inputClass}
                  />
                </div>

                {/* Where to Secure */}
                <div className="flex-1 w-full">
                  <label className="text-[10px] font-bold text-gray-500 uppercase tracking-wider mb-1 block md:hidden">
                    Where to Secure
                  </label>
                  <input
                    type="text"
                    value={req.where_to_secure}
                    onChange={(e) => handleRequirementChange(index, 'where_to_secure', e.target.value)}
                    placeholder="e.g. Administrative Division / LTO, SSS, Comelec"
                    className={inputClass}
                  />
                </div>

                {/* Remove Button */}
                <button
                  type="button"
                  onClick={() => removeRequirement(index)}
                  className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors shrink-0 self-end md:self-center"
                  title="Remove requirement"
                >
                  <i className="fas fa-trash-alt text-sm" />
                </button>
              </div>
            ))}

            <div className="pt-2 flex justify-end">
              <button
                type="button"
                onClick={addRequirement}
                className="text-xs font-bold text-[#0056b3] hover:text-blue-800 flex items-center gap-1.5 py-1 px-2"
              >
                <i className="fas fa-plus-circle" /> Add another requirement
              </button>
            </div>
          </div>
        </section>

        {/* ══════════════════════════════════════════════════════════════
            SECTION 3: Processing Steps
        ══════════════════════════════════════════════════════════════ */}
        <section className="bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden">
          <div className="bg-gradient-to-r from-[#0056b3] to-blue-700 px-6 py-4 text-white flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-lg bg-white/10 flex items-center justify-center">
                <i className="fas fa-list-ol text-white text-sm" />
              </div>
              <h2 className="text-base font-bold uppercase tracking-wider">3. Processing Steps</h2>
            </div>
            <button
              type="button"
              onClick={addStep}
              className="inline-flex items-center gap-1.5 bg-white text-[#0056b3] hover:bg-blue-50 px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all shadow-sm"
            >
              <i className="fas fa-plus text-[10px]" />
              <span>Add Step</span>
            </button>
          </div>

          <div className="p-6 space-y-6">
            {formData.steps.map((step, index) => (
              <div
                key={index}
                className="p-5 bg-gray-50/80 rounded-2xl border border-gray-200 relative group hover:border-blue-300 transition-colors"
              >
                {/* Step Header */}
                <div className="flex items-center justify-between mb-4 pb-3 border-b border-gray-200/80">
                  <div className="flex items-center gap-2.5">
                    <span className="w-7 h-7 rounded-full bg-blue-700 text-white text-xs font-extrabold flex items-center justify-center shadow-sm">
                      {index + 1}
                    </span>
                    <span className="font-bold text-gray-800 text-sm">Step {index + 1} Procedure</span>
                  </div>

                  <button
                    type="button"
                    onClick={() => removeStep(index)}
                    className="inline-flex items-center gap-1.5 text-xs text-red-500 hover:text-red-700 hover:bg-red-50 px-2.5 py-1 rounded-md transition-colors"
                    title="Remove step"
                  >
                    <i className="fas fa-trash-alt text-xs" />
                    <span>Delete Step</span>
                  </button>
                </div>

                {/* 5 Distinct Input Fields */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {/* Client Step */}
                  <div>
                    <label className={labelClass}>Client Step</label>
                    <textarea
                      rows={2}
                      value={step.client_step}
                      onChange={(e) => handleStepChange(index, 'client_step', e.target.value)}
                      placeholder="e.g. 1. Obtain an application form and fill out completely"
                      className={textareaClass}
                    />
                  </div>

                  {/* Agency Action */}
                  <div>
                    <label className={labelClass}>Agency Action</label>
                    <textarea
                      rows={2}
                      value={step.agency_action}
                      onChange={(e) => handleStepChange(index, 'agency_action', e.target.value)}
                      placeholder="e.g. 1.1 Provide an information form to the applicants requiring clearance"
                      className={textareaClass}
                    />
                  </div>

                  {/* Fees */}
                  <div>
                    <label className={labelClass}>Fees to be Paid</label>
                    <input
                      type="text"
                      value={step.fees}
                      onChange={(e) => handleStepChange(index, 'fees', e.target.value)}
                      placeholder="e.g. None / ₱50.00 / Covered under Ordinance"
                      className={inputClass}
                    />
                  </div>

                  {/* Processing Time */}
                  <div>
                    <label className={labelClass}>Processing Time</label>
                    <input
                      type="text"
                      value={step.processing_time}
                      onChange={(e) => handleStepChange(index, 'processing_time', e.target.value)}
                      placeholder="e.g. 10 minutes / 3 days / 15 days"
                      className={inputClass}
                    />
                  </div>

                  {/* Person Responsible */}
                  <div className="md:col-span-2">
                    <label className={labelClass}>Person Responsible</label>
                    <input
                      type="text"
                      value={step.person_responsible}
                      onChange={(e) => handleStepChange(index, 'person_responsible', e.target.value)}
                      placeholder="e.g. Peter A. Guiyab / Robert Jose C. Santos / Sec. Joy B. Dellomas"
                      className={inputClass}
                    />
                  </div>
                </div>
              </div>
            ))}

            <div className="pt-2 flex justify-end">
              <button
                type="button"
                onClick={addStep}
                className="text-xs font-bold text-[#0056b3] hover:text-blue-800 flex items-center gap-1.5 py-1 px-2"
              >
                <i className="fas fa-plus-circle" /> Add next step
              </button>
            </div>
          </div>
        </section>

        {/* ══════════════════════════════════════════════════════════════
            Bottom Floating Actions Bar
        ══════════════════════════════════════════════════════════════ */}
        <div className="sticky bottom-6 z-20 bg-white/95 backdrop-blur-md border border-gray-200/80 rounded-2xl shadow-xl p-4 flex items-center justify-between">
          <Link
            href="/admin/citizens-charter"
            className="px-5 py-2.5 rounded-xl text-sm font-semibold text-gray-600 hover:text-gray-900 hover:bg-gray-100 transition-colors"
          >
            Cancel
          </Link>

          <div className="flex items-center gap-3">
            <button
              type="submit"
              disabled={isSubmitting}
              className="inline-flex items-center gap-2 bg-[#0056b3] hover:bg-blue-800 active:scale-[0.99] disabled:bg-gray-400 text-white text-sm font-bold px-7 py-2.5 rounded-xl shadow-md hover:shadow-lg transition-all"
            >
              {isSubmitting ? (
                <>
                  <i className="fas fa-spinner fa-spin text-sm" />
                  <span>Saving Charter...</span>
                </>
              ) : (
                <>
                  <i className="fas fa-save text-sm" />
                  <span>Save Citizen&apos;s Charter</span>
                </>
              )}
            </button>
          </div>
        </div>
      </form>
    </div>
  );
}
