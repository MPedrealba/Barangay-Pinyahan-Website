'use client';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

export default function CreateServicePage() {
  const router = useRouter();

  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [requirements, setRequirements] = useState(['']);
  const [procedure, setProcedure] = useState(['']);
  const [status, setStatus] = useState('Active');
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Requirements handlers
  const handleRequirementChange = (index, value) => {
    setRequirements((prev) => prev.map((r, i) => (i === index ? value : r)));
  };
  const addRequirement = () => setRequirements((prev) => [...prev, '']);
  const removeRequirement = (index) => setRequirements((prev) => prev.filter((_, i) => i !== index));

  // Procedure handlers
  const handleStepChange = (index, value) => {
    setProcedure((prev) => prev.map((s, i) => (i === index ? value : s)));
  };
  const addStep = () => setProcedure((prev) => [...prev, '']);
  const removeStep = (index) => setProcedure((prev) => prev.filter((_, i) => i !== index));

  const handleSubmit = async () => {
    if (!name.trim()) {
      alert('Please enter a service name.');
      return;
    }
    setIsSubmitting(true);

    try {
      const token = localStorage.getItem('token');
      const formData = new FormData();
      formData.append('name', name.trim());
      formData.append('description', description.trim());
      formData.append('status', status);
      formData.append('requirements', JSON.stringify(requirements.filter((r) => r.trim())));
      formData.append('procedure', JSON.stringify(procedure.filter((s) => s.trim())));

      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/services/admin`, {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` },
        body: formData
      });

      if (res.ok) {
        alert('✅ Service saved successfully!');
        router.push('/admin/services');
      } else {
        const err = await res.json();
        alert(`Failed to save: ${err.error || 'Unknown error'}`);
      }
    } catch (err) {
      console.error(err);
      alert('Error saving service.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="p-8 max-w-4xl mx-auto">
      {/* Page Header */}
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-[#0056b3]">Service Management</h1>
        <p className="text-sm text-gray-500 mt-1">Add a New Barangay Service</p>
      </div>

      {/* Card */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">

        {/* Title & Description Inputs */}
        <div className="flex items-start justify-between gap-4 mb-1">
          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Enter service name"
            className="flex-1 text-xl font-bold text-gray-800 placeholder-gray-300 border-none outline-none bg-transparent"
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
              <h3 className="font-bold text-gray-800 mb-3 text-sm">Requirements</h3>
              <div className="flex flex-col gap-2">
                {requirements.map((req, idx) => (
                  <div key={idx} className="bg-white border border-gray-200 rounded-md px-3 py-2 flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full bg-[#0056b3] flex-shrink-0"></span>
                    <input
                      type="text"
                      value={req}
                      onChange={(e) => handleRequirementChange(idx, e.target.value)}
                      placeholder="Enter requirement"
                      className="flex-1 text-sm text-gray-700 border-none outline-none bg-transparent"
                    />
                    <button
                      type="button"
                      onClick={() => removeRequirement(idx)}
                      className="text-red-400 hover:text-red-600 transition-colors text-xs flex-shrink-0"
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
              <h3 className="font-bold text-gray-800 mb-3 text-sm">Procedure</h3>
              <div className="flex flex-col gap-2">
                {procedure.map((step, idx) => (
                  <div key={idx} className="bg-white border border-gray-200 rounded-md px-3 py-2 flex items-center gap-2">
                    <span className="w-5 h-5 rounded-full bg-[#0056b3] text-white text-xs flex items-center justify-center font-bold flex-shrink-0">
                      {idx + 1}
                    </span>
                    <input
                      type="text"
                      value={step}
                      onChange={(e) => handleStepChange(idx, e.target.value)}
                      placeholder="Enter step"
                      className="flex-1 text-sm text-gray-700 border-none outline-none bg-transparent"
                    />
                    <button
                      type="button"
                      onClick={() => removeStep(idx)}
                      className="text-red-400 hover:text-red-600 transition-colors text-xs flex-shrink-0"
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
