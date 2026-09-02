'use client';
import { useState, useEffect, use } from 'react';
import { useRouter } from 'next/navigation';

// ── Preview Components ───────────────────────────────────────────────────────
import BarangayClearance from '@/components/BarangayClearance';
import AlternativeClearance from '@/components/AlternativeClearance';
import CertificateOfIndigency from '@/components/CertificateOfIndigency';
import CertificateOfResidency from '@/components/CertificateOfResidency';

// ── Helpers ──────────────────────────────────────────────────────────────────
function formatDate(str) {
  if (!str) return '—';
  return new Date(str).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' });
}
function toDateInput(str) {
  if (!str) return '';
  return new Date(str).toISOString().split('T')[0]; // yyyy-mm-dd for <input type="date">
}
function toOrdinal(n) {
  const s = ['th', 'st', 'nd', 'rd'], v = n % 100;
  return n + (s[(v - 20) % 10] || s[v] || s[0]);
}

// ── Constants ────────────────────────────────────────────────────────────────
const SERVICE_TYPES = [
  'Barangay Clearance',
  'Barangay Clearance - No Derogatory',
  'Certificate of Indigency',
  'Certificate of Residency',
];

const SERVICE_BADGE = {
  'Barangay Clearance':                'bg-blue-100 text-blue-800',
  'Barangay Clearance - No Derogatory': 'bg-indigo-100 text-indigo-800',
  'Certificate of Indigency':          'bg-green-100 text-green-800',
  'Certificate of Residency':          'bg-purple-100 text-purple-800',
};
const STATUS_BADGE = {
  'Pending':              'bg-yellow-100 text-yellow-800',
  'Processing':           'bg-blue-100 text-blue-800',
  'Ready for Pick-up':    'bg-green-100 text-green-800',
  'Completed/Claimed':    'bg-gray-100 text-gray-600',
};

// docType derived from service_type
function getDocType(serviceType) {
  switch (serviceType) {
    case 'Barangay Clearance':                return 'clearance';
    case 'Barangay Clearance - No Derogatory': return 'clearance-no-derogatory';
    case 'Certificate of Indigency':          return 'indigency';
    case 'Certificate of Residency':          return 'residency';
    default:                                  return 'clearance';
  }
}

// ── Input CSS ─────────────────────────────────────────────────────────────────
const inputCls  = 'w-full px-4 py-2.5 border border-gray-300 rounded-lg text-sm outline-none text-gray-900 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all';
const selectCls = 'w-full px-4 py-2.5 border border-gray-300 rounded-lg text-sm outline-none appearance-none bg-white text-gray-900 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all cursor-pointer';
const labelCls  = 'block text-xs font-semibold text-gray-500 mb-1 uppercase tracking-wider';

// ── Live Preview Component ───────────────────────────────────────────────────
function LiveDocumentPreview({ formData, createdAt }) {
  const issueDate  = createdAt ? new Date(createdAt) : new Date();
  const issueDay   = toOrdinal(issueDate.getDate());
  const issueMonth = issueDate.toLocaleDateString('en-US', { month: 'long' });

  const serviceType = formData.service_type || 'Barangay Clearance';

  switch (serviceType) {
    case 'Barangay Clearance':
      return (
        <BarangayClearance
          residentName={formData.resident_name}
          address={formData.address}
          purpose={formData.purpose}
          issueDay={issueDay}
          issueMonth={issueMonth}
        />
      );
    case 'Barangay Clearance - No Derogatory':
      return (
        <AlternativeClearance
          residentName={formData.resident_name}
          address={formData.address}
          purpose={formData.purpose}
          yearsOfResidency={formData.years_of_residency}
          issueDay={issueDay}
          issueMonth={issueMonth}
        />
      );
    case 'Certificate of Indigency':
      return (
        <CertificateOfIndigency
          residentName={formData.resident_name}
          age={formData.age}
          birthdate={formData.birthdate ? formatDate(formData.birthdate) : ''}
          address={formData.address}
          requestor={formData.requestor}
          purpose={formData.purpose}
          issueDay={issueDay}
          issueMonth={issueMonth}
        />
      );
    case 'Certificate of Residency':
      return (
        <CertificateOfResidency
          residentName={formData.resident_name}
          civilStatus={formData.civil_status}
          birthdate={formData.birthdate ? formatDate(formData.birthdate) : ''}
          address={formData.address}
          yearsOfResidency={formData.years_of_residency}
          purpose={formData.purpose}
          photo={formData.photo}
          issueDay={issueDay}
          issueMonth={issueMonth}
        />
      );
    default:
      return (
        <BarangayClearance
          residentName={formData.resident_name}
          address={formData.address}
          purpose={formData.purpose}
          issueDay={issueDay}
          issueMonth={issueMonth}
        />
      );
  }
}

// ── Main Page ─────────────────────────────────────────────────────────────────
export default function ServicePDFPage({ params }) {
  const { id }  = use(params);
  const router  = useRouter();

  const [request,     setRequest]     = useState(null);
  const [loading,     setLoading]     = useState(true);
  const [downloading, setDownloading] = useState(false);
  const [error,       setError]       = useState('');
  const [saveSuccess, setSaveSuccess] = useState(false);

  // Edit state
  const [isEditing, setIsEditing] = useState(false);
  const [saving,    setSaving]    = useState(false);
  const [saveError, setSaveError] = useState('');
  const [formData,  setFormData]  = useState({});

  const API_BASE = process.env.NEXT_PUBLIC_API_URL || '';

  // ── Fetch ─────────────────────────────────────────────────────────────────
  useEffect(() => {
    const fetchRequest = async () => {
      try {
        const token = localStorage.getItem('token');
        const res = await fetch(
          `${API_BASE}/api/admin/service-requests/${id}`,
          { headers: { Authorization: `Bearer ${token}` } }
        );
        if (!res.ok) throw new Error('Request not found.');
        const data = await res.json();
        setRequest(data.request);
        initForm(data.request);
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };
    fetchRequest();
  }, [id, API_BASE]);

  function initForm(r) {
    if (!r) return;
    setFormData({
      resident_name:      r.resident_name      || '',
      address:            r.address            || '',
      purpose:            r.purpose            || '',
      age:                r.age                ? String(r.age) : '',
      civil_status:       r.civil_status       || '',
      birthdate:          toDateInput(r.birthdate),
      years_of_residency: r.years_of_residency ? String(r.years_of_residency) : '',
      requestor:          r.requestor          || '',
      service_type:       r.service_type       || 'Barangay Clearance',
      photo:              r.photo              || '',
    });
  }

  // ── Photo Upload Handler (with client-side compression) ────────────────────
  const handlePhotoUpload = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onloadend = () => {
      const img = new window.Image();
      img.onload = () => {
        // Scale down to max 400px on the longest side
        const MAX = 400;
        let w = img.width;
        let h = img.height;
        if (w > MAX || h > MAX) {
          if (w >= h) { h = Math.round(h * (MAX / w)); w = MAX; }
          else        { w = Math.round(w * (MAX / h)); h = MAX; }
        }

        const canvas = document.createElement('canvas');
        canvas.width  = w;
        canvas.height = h;
        const ctx = canvas.getContext('2d');
        ctx.drawImage(img, 0, 0, w, h);

        // Compress to JPEG at 70% quality — drastically smaller base64 string
        const compressed = canvas.toDataURL('image/jpeg', 0.7);
        handleFormChange('photo', compressed);
      };
      img.src = reader.result;
    };
    reader.readAsDataURL(file);
  };

  const handleFormChange = (field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  // ── Save Changes ──────────────────────────────────────────────────────────
  const handleSave = async () => {
    if (!formData.resident_name?.trim()) {
      setSaveError('Full name is required.'); return;
    }
    setSaving(true); setSaveError(''); setSaveSuccess(false);
    try {
      const token = localStorage.getItem('token');
      const res = await fetch(
        `${API_BASE}/api/admin/service-requests/${id}`,
        {
          method:  'PUT',
          headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
          body: JSON.stringify({
            resident_name:      formData.resident_name.trim(),
            address:            formData.address.trim()    || null,
            purpose:            formData.purpose.trim()    || null,
            age:                formData.age               ? parseInt(formData.age) : null,
            civil_status:       formData.civil_status      || null,
            birthdate:          formData.birthdate         || null,
            years_of_residency: formData.years_of_residency ? parseInt(formData.years_of_residency) : null,
            requestor:          formData.requestor.trim()  || null,
            service_type:       formData.service_type      || null,
            photo:              formData.photo             || null,
          }),
        }
      );

      if (!res.ok) {
        // Read body as text ONCE, then try to parse as JSON
        const responseText = await res.text();
        let errorMsg = 'Save failed.';
        try {
          const errData = JSON.parse(responseText);
          errorMsg = errData.error || errorMsg;
        } catch {
          console.error('Server Error (save):', responseText);
          errorMsg = `Server rejected the request (${res.status}). Check console for details.`;
        }
        throw new Error(errorMsg);
      }

      const data = await res.json();
      setRequest(data.request);
      initForm(data.request);
      setIsEditing(false);
      setSaveSuccess(true);
      setTimeout(() => setSaveSuccess(false), 4000);
    } catch (err) {
      setSaveError(err.message);
    } finally {
      setSaving(false);
    }
  };

  // ── DOCX Download (uses formData for live values) ─────────────────────────
  const handleDownloadDocx = async () => {
    if (!request) return;
    setDownloading(true);
    try {
      const issueDate  = request.created_at ? new Date(request.created_at) : new Date();
      const issueDay   = toOrdinal(issueDate.getDate());
      const issueMonth = issueDate.toLocaleDateString('en-US', { month: 'long' });
      const issueYear  = issueDate.getFullYear().toString();

      const payload = {
        docType:          getDocType(formData.service_type || request.service_type),
        residentName:     formData.resident_name     || '________________',
        address:          formData.address           || '________________',
        purpose:          formData.purpose           || '________________',
        age:              formData.age               || '____',
        civilStatus:      formData.civil_status      || '________________',
        birthdate:        formData.birthdate         ? formatDate(formData.birthdate) : '________________',
        yearsOfResidency: formData.years_of_residency || '________________',
        requestor:        formData.requestor         || formData.resident_name || '________________',
        issueDay, issueMonth, issueYear,
        trackingNo:       request.tracking_no        || '',
        serviceType:      formData.service_type      || request.service_type || 'Barangay Clearance',
        photo:            formData.photo             || '',
      };

      const res = await fetch('/api/generate-docx', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      if (!res.ok) {
        // Read body as text ONCE, then try to parse as JSON
        const responseText = await res.text();
        let errorMsg = 'Failed to generate document.';
        try {
          const errData = JSON.parse(responseText);
          errorMsg = errData.error || errorMsg;
        } catch {
          console.error('Server Error (docx):', responseText);
          errorMsg = `Server rejected the request (${res.status}). Check console for details.`;
        }
        throw new Error(errorMsg);
      }

      const blob = await res.blob();
      const url  = window.URL.createObjectURL(blob);
      const a    = document.createElement('a');
      a.href     = url;
      a.download = `${request.tracking_no || 'Document'}_${(formData.resident_name || 'Resident').replace(/\s+/g, '_')}.docx`;
      document.body.appendChild(a);
      a.click(); a.remove();
      window.URL.revokeObjectURL(url);
    } catch (err) {
      console.error('Download error:', err);
      alert(err.message || 'Failed to generate document. Please try again.');
    } finally {
      setDownloading(false);
    }
  };

  // ── Loading / Error ───────────────────────────────────────────────────────
  if (loading) return (
    <div className="flex items-center justify-center h-screen bg-gray-50">
      <i className="fas fa-spinner fa-spin text-[#0056b3] text-3xl" />
    </div>
  );

  if (error) return (
    <div className="flex flex-col items-center justify-center h-screen gap-4">
      <i className="fas fa-exclamation-triangle text-red-400 text-4xl" />
      <p className="text-red-600 font-bold">{error}</p>
      <button onClick={() => router.back()} className="text-blue-600 underline text-sm">← Go Back</button>
    </div>
  );

  const serviceType = formData.service_type || request?.service_type || 'Barangay Clearance';
  const status      = request?.status       || 'Pending';
  const trackingNo  = request?.tracking_no  || '—';

  // ── Render ────────────────────────────────────────────────────────────────
  return (
    <div className="min-h-screen bg-gray-50 py-8 px-4">

      {/* Back */}
      <div className="max-w-7xl mx-auto mb-6">
        <button onClick={() => router.back()}
          className="flex items-center gap-2 text-sm font-semibold text-gray-500 hover:text-gray-800 transition-colors">
          <i className="fas fa-arrow-left" /> Back to Service Requests
        </button>
      </div>

      {/* ── 2-Column Split Layout ── */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 w-full max-w-7xl mx-auto">

        {/* ════════════════════════════════════════════════════════════════════
            LEFT COLUMN — Controls & Editing
        ════════════════════════════════════════════════════════════════════ */}
        <div className="min-w-0 flex flex-col gap-6">

          {/* ── Header / Tracking Card ── */}
          <div className="bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden">
            <div className="h-1.5 bg-gradient-to-r from-[#0056b3] to-blue-400" />
            <div className="p-6">
              <div className="flex flex-wrap items-start justify-between gap-4 mb-4">
                <div>
                  <p className="text-xs font-bold text-gray-400 tracking-wider mb-1">TRACKING NO.</p>
                  <p className="text-xl font-black text-gray-900 tracking-wide">{trackingNo}</p>
                </div>
                <div className="flex flex-col items-end gap-2">
                  <span className={`text-xs font-bold px-3 py-1 rounded-full ${SERVICE_BADGE[serviceType] || 'bg-gray-100 text-gray-700'}`}>
                    {serviceType}
                  </span>
                  <span className={`text-xs font-bold px-3 py-1 rounded-full ${STATUS_BADGE[status] || 'bg-gray-100 text-gray-600'}`}>
                    {status}
                  </span>
                </div>
              </div>
              <div className="flex items-center gap-2 text-xs text-gray-400">
                <i className="fas fa-clock" />
                <span>Submitted {formatDate(request?.created_at)}</span>
                {request?.updated_at && request.updated_at !== request.created_at && (
                  <><span className="mx-1">·</span><span>Updated {formatDate(request?.updated_at)}</span></>
                )}
              </div>
            </div>
          </div>

          {/* ── Resident Information Card ── */}
          <div className="bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden">
            <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between">
              <h2 className="text-sm font-bold text-gray-700 tracking-wider uppercase">
                <i className="fas fa-id-card text-[#0056b3] mr-2" />Resident Information
              </h2>
              {!isEditing && (
                <button onClick={() => { setIsEditing(true); setSaveError(''); initForm(request); }}
                  className="flex items-center gap-1.5 text-xs font-bold text-[#0056b3] hover:text-blue-800 transition-colors px-3 py-1.5 rounded-lg hover:bg-blue-50">
                  <i className="fas fa-pen" /> Edit
                </button>
              )}
            </div>

            <div className="p-6">
              {saveSuccess && (
                <div className="mb-4 bg-green-50 border border-green-200 rounded-lg px-4 py-3 text-green-700 text-xs font-semibold flex items-center gap-2 animate-fadeIn">
                  <i className="fas fa-check-circle text-green-600" /> Changes saved and updated successfully in the database.
                </div>
              )}
              {isEditing ? (
                /* ── Edit Form ── */
                <div className="space-y-4">
                  {saveError && (
                    <div className="bg-red-50 border border-red-200 rounded-lg px-4 py-3 text-red-700 text-xs font-semibold flex items-center gap-2">
                      <i className="fas fa-exclamation-circle" />{saveError}
                    </div>
                  )}

                  {/* Service Type */}
                  <div>
                    <label className={labelCls}>Document Type</label>
                    <div className="relative">
                      <select value={formData.service_type} onChange={e => handleFormChange('service_type', e.target.value)} className={selectCls}>
                        {SERVICE_TYPES.map(t => <option key={t} value={t}>{t}</option>)}
                      </select>
                      <i className="fas fa-caret-down absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none text-xs" />
                    </div>
                  </div>

                  {/* Name */}
                  <div>
                    <label className={labelCls}>Full Name <span className="text-red-500">*</span></label>
                    <input type="text" value={formData.resident_name}
                      onChange={e => handleFormChange('resident_name', e.target.value)}
                      className={inputCls} placeholder="Full name" />
                  </div>

                  {/* Address */}
                  <div>
                    <label className={labelCls}>Address</label>
                    <input type="text" value={formData.address}
                      onChange={e => handleFormChange('address', e.target.value)}
                      className={inputCls} placeholder="Complete address" />
                  </div>

                  {/* Purpose */}
                  <div>
                    <label className={labelCls}>Purpose</label>
                    <input type="text" value={formData.purpose}
                      onChange={e => handleFormChange('purpose', e.target.value)}
                      className={inputCls} placeholder="Purpose of request" />
                  </div>

                  {/* Age + Civil Status */}
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className={labelCls}>Age</label>
                      <input type="number" min="1" max="120" value={formData.age}
                        onChange={e => handleFormChange('age', e.target.value)}
                        className={inputCls} placeholder="Age" />
                    </div>
                    <div>
                      <label className={labelCls}>Civil Status</label>
                      <div className="relative">
                        <select value={formData.civil_status} onChange={e => handleFormChange('civil_status', e.target.value)} className={selectCls}>
                          <option value="">— Select —</option>
                          <option value="Single">Single</option>
                          <option value="Married">Married</option>
                          <option value="Widowed">Widowed</option>
                          <option value="Legally Separated">Legally Separated</option>
                        </select>
                        <i className="fas fa-caret-down absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none text-xs" />
                      </div>
                    </div>
                  </div>

                  {/* Birthdate + Years of Residency */}
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className={labelCls}>Date of Birth</label>
                      <input type="date" value={formData.birthdate}
                        onChange={e => handleFormChange('birthdate', e.target.value)}
                        className={inputCls} />
                    </div>
                    <div>
                      <label className={labelCls}>Years of Residency</label>
                      <input type="number" min="1" max="100" value={formData.years_of_residency}
                        onChange={e => handleFormChange('years_of_residency', e.target.value)}
                        className={inputCls} placeholder="e.g. 5" />
                    </div>
                  </div>

                  {/* Requestor */}
                  <div>
                    <label className={labelCls}>Requestor Name</label>
                    <input type="text" value={formData.requestor}
                      onChange={e => handleFormChange('requestor', e.target.value)}
                      className={inputCls} placeholder="Requestor (if different from resident)" />
                  </div>

                  {/* Resident Photo — Certificate of Residency only */}
                  {formData.service_type === 'Certificate of Residency' && (
                    <div>
                      <label className={labelCls}>Resident Photo</label>
                      <div className="flex items-start gap-4">
                        <div className="flex-1">
                          <input
                            type="file"
                            accept="image/*"
                            capture="environment"
                            onChange={handlePhotoUpload}
                            className="w-full text-sm text-gray-600 file:mr-3 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-[#0056b3] hover:file:bg-blue-100 file:cursor-pointer file:transition-colors cursor-pointer"
                          />
                          <p className="text-[10px] text-gray-400 mt-1.5">
                            <i className="fas fa-info-circle mr-1" />
                            Upload a 1x1 ID photo. This will be embedded in the generated Word document.
                          </p>
                        </div>
                        {formData.photo && (
                          <div className="relative shrink-0">
                            <img
                              src={formData.photo}
                              alt="Resident photo"
                              className="w-20 h-20 object-cover rounded-lg border-2 border-blue-200 shadow-sm"
                            />
                            <button
                              type="button"
                              onClick={() => handleFormChange('photo', '')}
                              className="absolute -top-2 -right-2 w-5 h-5 bg-red-500 text-white rounded-full flex items-center justify-center text-[10px] hover:bg-red-600 transition-colors shadow-sm"
                              title="Remove photo"
                            >
                              <i className="fas fa-times" />
                            </button>
                          </div>
                        )}
                      </div>
                    </div>
                  )}

                  {/* Action buttons */}
                  <div className="flex gap-3 pt-2">
                    <button onClick={handleSave} disabled={saving}
                      className="flex items-center gap-2 bg-[#0056b3] hover:bg-blue-800 disabled:bg-gray-400 text-white font-bold text-sm px-5 py-2.5 rounded-xl transition-all shadow-sm">
                      <i className={`fas ${saving ? 'fa-spinner fa-spin' : 'fa-save'}`} />
                      {saving ? 'Saving…' : 'Save Changes'}
                    </button>
                    <button onClick={() => { setIsEditing(false); setSaveError(''); }}
                      className="flex items-center gap-2 bg-gray-100 hover:bg-gray-200 text-gray-700 font-bold text-sm px-5 py-2.5 rounded-xl transition-all">
                      <i className="fas fa-times" /> Cancel
                    </button>
                  </div>
                </div>
              ) : (
                /* ── Display Mode ── */
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-8 gap-y-5">
                  {[
                    { label: 'Full Name',           value: request?.resident_name,                              icon: 'fa-user' },
                    { label: 'Address',              value: request?.address,                                    icon: 'fa-map-marker-alt' },
                    { label: 'Purpose',              value: request?.purpose,                                    icon: 'fa-clipboard' },
                    { label: 'Age',                  value: request?.age,                                        icon: 'fa-birthday-cake' },
                    { label: 'Civil Status',         value: request?.civil_status,                               icon: 'fa-ring' },
                    { label: 'Date of Birth',        value: request?.birthdate ? formatDate(request.birthdate) : null, icon: 'fa-calendar' },
                    { label: 'Years of Residency',   value: request?.years_of_residency,                         icon: 'fa-home' },
                    { label: 'Requestor',            value: request?.requestor,                                  icon: 'fa-user-tag' },
                    { label: 'Processed By',         value: request?.processed_by,                               icon: 'fa-user-shield' },
                  ].filter(f => f.value).map(({ label, value, icon }) => (
                    <div key={label} className="flex items-start gap-3">
                      <div className="w-8 h-8 rounded-lg bg-blue-50 flex items-center justify-center flex-shrink-0 mt-0.5">
                        <i className={`fas ${icon} text-[#0056b3] text-xs`} />
                      </div>
                      <div>
                        <p className="text-[11px] font-semibold text-gray-400 uppercase tracking-wider">{label}</p>
                        <p className="text-sm font-semibold text-gray-900 mt-0.5">{value}</p>
                      </div>
                    </div>
                  ))}
                  {request?.photo && (
                    <div className="flex items-start gap-3 col-span-full">
                      <div className="w-8 h-8 rounded-lg bg-blue-50 flex items-center justify-center flex-shrink-0 mt-0.5">
                        <i className="fas fa-camera text-[#0056b3] text-xs" />
                      </div>
                      <div>
                        <p className="text-[11px] font-semibold text-gray-400 uppercase tracking-wider">Resident Photo</p>
                        <img
                          src={request.photo}
                          alt="Resident"
                          className="w-16 h-16 object-cover rounded-lg border border-blue-200 mt-1 shadow-sm"
                        />
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>

          {/* ── Download / Actions Card ── */}
          <div className="bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden">
            <div className="p-6 flex flex-col sm:flex-row items-center justify-between gap-4">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-xl bg-blue-50 flex items-center justify-center">
                  <i className="fas fa-file-word text-[#0056b3] text-xl" />
                </div>
                <div>
                  <p className="text-sm font-bold text-gray-900">Official Document</p>
                  <p className="text-xs text-gray-500">Generate and download the official .docx document</p>
                </div>
              </div>

              <div className="flex flex-wrap gap-3 w-full">
                {/* Edit button (alternative location visible in download row too) */}
                {!isEditing && (
                  <button onClick={() => { setIsEditing(true); setSaveError(''); initForm(request); }}
                    className="flex items-center gap-2 bg-gray-100 hover:bg-gray-200 text-gray-700 font-bold text-sm px-5 py-3 rounded-xl transition-all w-full sm:w-auto justify-center">
                    <i className="fas fa-pen" /> Edit Request
                  </button>
                )}
                <button onClick={handleDownloadDocx} disabled={downloading}
                  className="flex items-center gap-2 bg-[#0056b3] hover:bg-blue-800 disabled:bg-gray-400 text-white font-bold text-sm px-6 py-3 rounded-xl transition-all shadow-sm hover:shadow-md disabled:shadow-none w-full sm:w-auto justify-center">
                  <i className={`fas ${downloading ? 'fa-spinner fa-spin' : 'fa-download'}`} />
                  {downloading ? 'Generating…' : 'Download Official Document'}
                </button>
              </div>
            </div>
          </div>

          <p className="text-center text-xs text-gray-400">
            <i className="fas fa-info-circle mr-1" />
            Documents are generated from official Barangay Pinyahan Word templates.
            Ensure resident information is complete before downloading.
          </p>

        </div>
        {/* END LEFT COLUMN */}

        {/* ════════════════════════════════════════════════════════════════════
            RIGHT COLUMN — Live Visual Preview
        ════════════════════════════════════════════════════════════════════ */}
        <div className="hidden lg:block">
          <div className="sticky top-8">
            {/* Label */}
            <div className="flex items-center gap-2 mb-4">
              <div className="w-8 h-8 rounded-lg bg-blue-50 flex items-center justify-center">
                <i className="fas fa-eye text-[#0056b3] text-xs" />
              </div>
              <div>
                <p className="text-sm font-bold text-gray-700">Live Document Preview</p>
                <p className="text-[11px] text-gray-400">
                  {isEditing ? 'Updates in real-time as you type' : 'Preview of the generated document'}
                </p>
              </div>
            </div>

            {/* Scaled A4 preview container */}
            <div className="w-full flex justify-center items-start overflow-hidden rounded-2xl border border-gray-200 bg-gray-100 shadow-sm"
              style={{ height: 'calc(297mm * 0.52 + 16px)' }}>
              <div className="p-2">
                <div className="origin-top" style={{ transform: 'scale(0.52)', width: '210mm' }}>
                  <LiveDocumentPreview formData={formData} createdAt={request?.created_at} />
                </div>
              </div>
            </div>
          </div>
        </div>
        {/* END RIGHT COLUMN */}

      </div>
    </div>
  );
}
