'use client';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { apiPost } from '@/lib/api';

export default function CreateServicePage() {
  const router = useRouter();

  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [fee, setFee] = useState('0.00');
  const [isFirstTimeFree, setIsFirstTimeFree] = useState(false);
  const [requirements, setRequirements] = useState(['']);
  const [procedure, setProcedure] = useState(['']);
  const [status, setStatus] = useState('Active');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [toast, setToast] = useState(null); // { type, message }

  const showToast = (type, message) => {
    setToast({ type, message });
    setTimeout(() => setToast(null), 3500);
  };

  // Requirements handlers
  const handleRequirementChange = (index, value) => {
    setRequirements((prev) => prev.map((r, i) => (i === index ? value : r)));
  };
  const addRequirement = () => setRequirements((prev) => [...prev, '']);
  const removeRequirement = (index) => {
    setRequirements((prev) => {
      const filtered = prev.filter((_, i) => i !== index);
      return filtered.length > 0 ? filtered : [''];
    });
  };

  // Procedure handlers
  const handleStepChange = (index, value) => {
    setProcedure((prev) => prev.map((s, i) => (i === index ? value : s)));
  };
  const addStep = () => setProcedure((prev) => [...prev, '']);
  const removeStep = (index) => {
    setProcedure((prev) => {
      const filtered = prev.filter((_, i) => i !== index);
      return filtered.length > 0 ? filtered : [''];
    });
  };

  const handleSubmit = async (e) => {
    if (e) e.preventDefault();
    setSubmitted(true);

    if (!name.trim()) {
      showToast('error', 'Please enter a service name.');
      return;
    }

    if (requirements.length === 0 || requirements.every((r) => !r.trim())) {
      showToast('error', 'At least one requirement is required and cannot be blank.');
      return;
    }

    if (requirements.some((r) => !r.trim())) {
      showToast('error', 'Requirement fields cannot be blank. Please enter the requirement or remove the empty row.');
      return;
    }

    if (procedure.length === 0 || procedure.every((s) => !s.trim())) {
      showToast('error', 'At least one procedure step is required and cannot be blank.');
      return;
    }

    if (procedure.some((s) => !s.trim())) {
      showToast('error', 'Procedure fields cannot be blank. Please enter the step details or remove the empty row.');
      return;
    }

    setIsSubmitting(true);

    try {
      await apiPost('/api/admin/services', {
        name: name.trim(),
        description: description.trim(),
        fee: parseFloat(fee) || 0,
        is_first_time_free: isFirstTimeFree,
        status,
        requirements: requirements.map((r) => r.trim()),
        procedures: procedure.map((s) => s.trim()),
      });

      showToast('success', 'Service created successfully!');
      setTimeout(() => {
        router.push('/admin/services');
      }, 1200);
    } catch (err) {
      console.error(err);
      showToast('error', err.message || 'Error saving service.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="p-8 max-w-4xl mx-auto">
      {/* Toast Notification */}
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

      {/* Page Header */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold text-[#0056b3]">Service Management</h1>
          <p className="text-sm text-gray-500 mt-1">Add a New Barangay Service</p>
        </div>
        <Link
          href="/admin/services"
          className="flex items-center gap-2 text-sm font-medium text-gray-500 hover:text-gray-700 transition-colors no-underline"
        >
          <i className="fas fa-arrow-left"></i> Back to Services
        </Link>
      </div>

      {/* Card */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">

        {/* Title & Description Inputs */}
        <div className="flex items-start justify-between gap-4 mb-1">
          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Enter service name *"
            className={`flex-1 text-xl font-bold text-gray-800 placeholder-gray-300 rounded-lg px-2 py-1 outline-none transition-all ${
              submitted && !name.trim() ? 'border border-red-400 bg-red-50/20' : 'border border-transparent focus:border-blue-300'
            }`}
          />
          <div className="bg-blue-50 text-[#0056b3] p-2 rounded-md flex-shrink-0">
            <i className="fas fa-file-alt text-lg"></i>
          </div>
        </div>
        <input
          type="text"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          placeholder="Enter service description"
          className="w-full text-sm text-gray-400 placeholder-gray-300 border-none outline-none bg-transparent mb-5"
        />

        {/* Requirements & Procedure */}
        <div className="bg-gray-50 rounded-lg border border-gray-100 p-5 mb-5">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">

            {/* Requirements */}
            <div>
              <div className="flex items-center justify-between mb-3">
                <h3 className="font-bold text-gray-800 text-sm flex items-center gap-1">
                  <span>Requirements</span>
                  <span className="text-red-500">*</span>
                </h3>
                <span className="text-[11px] text-gray-400">At least 1 required</span>
              </div>
              <div className="flex flex-col gap-2">
                {requirements.map((req, idx) => (
                  <div
                    key={idx}
                    className={`bg-white border rounded-md px-3 py-2 flex items-center gap-2 transition-all ${
                      submitted && !req.trim() ? 'border-red-400 bg-red-50/20' : 'border-gray-200'
                    }`}
                  >
                    <span className="w-2 h-2 rounded-full bg-[#0056b3] flex-shrink-0"></span>
                    <input
                      type="text"
                      value={req}
                      onChange={(e) => handleRequirementChange(idx, e.target.value)}
                      placeholder={`Requirement #${idx + 1} (required)`}
                      className="flex-1 text-sm text-gray-700 border-none outline-none bg-transparent"
                    />
                    <button
                      type="button"
                      onClick={() => removeRequirement(idx)}
                      className="text-red-400 hover:text-red-600 transition-colors text-xs flex-shrink-0"
                      title={requirements.length > 1 ? "Remove requirement" : "Clear requirement"}
                    >
                      <i className="fas fa-times"></i>
                    </button>
                  </div>
                ))}
              </div>
              <button
                type="button"
                onClick={addRequirement}
                className="mt-3 text-[#0056b3] text-xs font-semibold hover:underline flex items-center gap-1"
              >
                + Add Requirement
              </button>
            </div>

            {/* Procedure */}
            <div>
              <div className="flex items-center justify-between mb-3">
                <h3 className="font-bold text-gray-800 text-sm flex items-center gap-1">
                  <span>Procedure</span>
                  <span className="text-red-500">*</span>
                </h3>
                <span className="text-[11px] text-gray-400">At least 1 step required</span>
              </div>
              <div className="flex flex-col gap-2">
                {procedure.map((step, idx) => (
                  <div
                    key={idx}
                    className={`bg-white border rounded-md px-3 py-2 flex items-center gap-2 transition-all ${
                      submitted && !step.trim() ? 'border-red-400 bg-red-50/20' : 'border-gray-200'
                    }`}
                  >
                    <span className="w-5 h-5 rounded-full bg-[#0056b3] text-white text-xs flex items-center justify-center font-bold flex-shrink-0">
                      {idx + 1}
                    </span>
                    <input
                      type="text"
                      value={step}
                      onChange={(e) => handleStepChange(idx, e.target.value)}
                      placeholder={`Step #${idx + 1} (required)`}
                      className="flex-1 text-sm text-gray-700 border-none outline-none bg-transparent"
                    />
                    <button
                      type="button"
                      onClick={() => removeStep(idx)}
                      className="text-red-400 hover:text-red-600 transition-colors text-xs flex-shrink-0"
                      title={procedure.length > 1 ? "Remove step" : "Clear step"}
                    >
                      <i className="fas fa-times"></i>
                    </button>
                  </div>
                ))}
              </div>
              <button
                type="button"
                onClick={addStep}
                className="mt-3 text-[#0056b3] text-xs font-semibold hover:underline flex items-center gap-1"
              >
                + Add Step
              </button>
            </div>

          </div>
        </div>

        {/* Pricing & First-Time Free Privilege */}
        <div className="bg-white rounded-lg border border-gray-200 p-4 mb-5">
          <h3 className="font-bold text-gray-800 text-sm mb-3 flex items-center gap-2">
            <i className="fas fa-tag text-purple-600"></i>
            <span>Pricing &amp; Resident Privileges</span>
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-gray-600 mb-1">Standard Fee (₱)</label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 font-bold text-sm">₱</span>
                <input
                  type="number"
                  step="0.01"
                  min="0"
                  value={fee}
                  onChange={(e) => setFee(e.target.value)}
                  placeholder="0.00"
                  className="w-full text-sm font-semibold border border-gray-200 rounded-lg pl-7 pr-3 py-2 outline-none focus:border-blue-400"
                />
              </div>
              <p className="text-[11px] text-gray-400 mt-1">Default processing fee for document release.</p>
            </div>

            <div className="flex flex-col justify-center">
              <label className="block text-xs font-semibold text-gray-600 mb-1">First-Time Free Privilege</label>
              <label className="flex items-start gap-2.5 p-2.5 bg-purple-50/60 border border-purple-200 rounded-lg cursor-pointer hover:bg-purple-50 transition-colors">
                <input
                  type="checkbox"
                  checked={isFirstTimeFree}
                  onChange={(e) => setIsFirstTimeFree(e.target.checked)}
                  className="mt-0.5 w-4 h-4 text-purple-600 rounded border-gray-300 focus:ring-purple-400 cursor-pointer"
                />
                <div>
                  <span className="text-xs font-bold text-purple-900 block">First-Time Free (RA 11261)</span>
                  <span className="text-[11px] text-purple-700 block leading-snug">
                    1st claim is 100% FREE; subsequent claims require standard fee.
                  </span>
                </div>
              </label>
            </div>
          </div>
        </div>

        {/* Footer: Status + Actions */}
        <div className="flex items-center justify-between pt-2">
          <div className="flex items-center gap-2">
            <span className="text-xs text-gray-500 font-semibold">Status:</span>
            <select
              value={status}
              onChange={(e) => setStatus(e.target.value)}
              className="border border-gray-300 rounded px-2 py-1 text-sm text-gray-700 bg-white focus:outline-none focus:ring-1 focus:ring-blue-300"
            >
              <option value="Active">Active</option>
              <option value="Inactive">Inactive</option>
            </select>
          </div>
          <div className="flex items-center gap-3">
            <Link
              href="/admin/services"
              className="text-sm text-gray-500 font-medium hover:text-gray-700 transition-colors no-underline"
            >
              Cancel
            </Link>
            <button
              type="button"
              onClick={handleSubmit}
              disabled={isSubmitting}
              className="text-sm text-[#0056b3] font-semibold hover:underline disabled:opacity-60"
            >
              {isSubmitting ? 'Saving...' : 'Save'}
            </button>
          </div>
        </div>

      </div>
    </div>
  );
}
