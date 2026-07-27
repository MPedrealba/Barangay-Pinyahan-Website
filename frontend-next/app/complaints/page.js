'use client';
import { useState, useCallback, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { GoogleReCaptchaProvider, useGoogleReCaptcha } from 'react-google-recaptcha-v3';
import PublicShell from '@/components/PublicShell';

// ─── Allowed testing locations (within MAX_RADIUS_KM of ANY = allowed) ──────
const ALLOWED_LOCATIONS = [
  { lat: 14.6433, lng: 121.0465, name: 'Barangay Pinyahan'      }, // Main Target
  { lat: 14.6006, lng: 121.0034, name: 'EARIST Manila'          }, // Testing Location 1
  { lat: 14.6506, lng: 120.9744, name: 'Brgy 12, South Caloocan'}, // Testing Location 2
];
const MAX_RADIUS_KM = 2; // 2 kilometres

/**
 * Haversine formula — returns the great-circle distance in kilometres
 * between two lat/lng coordinates.
 */
function haversineDistanceKm(lat1, lng1, lat2, lng2) {
  const R    = 6371; // Earth radius in km
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLng = ((lng2 - lng1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLng / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

/**
 * Get the user's current position as a Promise.
 * Rejects on permission denial or timeout.
 */
function getUserPosition() {
  return new Promise((resolve, reject) => {
    if (!navigator.geolocation) {
      reject(new Error('Geolocation is not supported by your browser.'));
      return;
    }
    navigator.geolocation.getCurrentPosition(resolve, reject, {
      enableHighAccuracy: true,
      timeout: 10000,
      maximumAge: 0,
    });
  });
}

// ─── Area detection — parse free-text address into Barangay Area ─
function detectAreaFromAddress(addressString) {
  const s = (addressString || '').toLowerCase();

  // Area 4
  if (
    s.includes('malakas lane')     ||
    s.includes('malakas upper')    ||
    s.includes('matatag upper')    ||
    s.includes('mapang-akit upper')||
    s.includes('matapang')
  ) return 'Area 4';

  // Area 3
  if (
    s.includes('matatag lower')    ||
    s.includes('matatag')          ||
    s.includes('mapang-akit lower')||
    s.includes('mapang-akit')      ||
    s.includes('mabilis lower')    ||
    s.includes('maunawain')
  ) return 'Area 3';

  // Area 5
  if (
    s.includes('mabilis upper')  ||
    s.includes('mabilis')        ||
    s.includes('masigasig')      ||
    s.includes('mapagbigay')     ||
    s.includes('maunlad')        ||
    s.includes('magiliw')
  ) return 'Area 5';

  // Area 6
  if (
    s.includes('matimpiin') ||
    s.includes('matapat')   ||
    s.includes('masikap')   ||
    s.includes('maginoo')   ||
    s.includes('matiyaga')  ||
    s.includes('maparaan')  ||
    s.includes('kalayaan')  ||
    s.includes('v. luna')
  ) return 'Area 6';

  // Area 7
  if (s.includes('nia') || s.includes('dpwh')) return 'Area 7';

  // Area 1
  if (
    s.includes('mapagmahal') ||
    s.includes('maliksi')    ||
    s.includes('kamias')
  ) return 'Area 1';

  // Area 2
  if (
    s.includes('makisig')  ||
    s.includes('magalang') ||
    s.includes('matipuno')
  ) return 'Area 2';

  // Area 1/Area 2 overlap
  if (s.includes('malakas')) return 'Area 1/Area 2';

  return null;
}

// ─── Shared input classes ────────────────────────────────────────
const inputCls = 'w-full px-5 py-3 border border-gray-300 rounded-full text-base outline-none focus:ring-2 focus:ring-[#006eb3] focus:border-[#006eb3] transition-all';
const selectCls = 'w-full px-5 py-3 border border-gray-300 rounded-full text-base outline-none appearance-none bg-white cursor-pointer focus:ring-2 focus:ring-[#006eb3] focus:border-[#006eb3] transition-all';

// ─── Inner form component (needs reCAPTCHA context) ──────────────
function ComplaintForm() {
  const router = useRouter();
  const { executeRecaptcha } = useGoogleReCaptcha();

  const [fullName,      setFullName]      = useState('');
  const [accusedName,   setAccusedName]   = useState('');
  const [address,       setAddress]       = useState('');
  const [contactNumber, setContactNumber] = useState('');
  const [complaintType, setComplaintType] = useState('');
  const [message,       setMessage]       = useState('');
  const [photoFile,     setPhotoFile]     = useState(null);
  const [photoPreview,  setPhotoPreview]  = useState(null);
  const [submitting,    setSubmitting]    = useState(false);
  const [geoStatus,     setGeoStatus]     = useState('idle');
  const [popup,         setPopup]         = useState(null);
  const [areaHint,      setAreaHint]      = useState(null);
  const [categories,    setCategories]    = useState([]);

  // Derive the selected category object
  const selectedCategory = categories.find(c => c.name === complaintType);
  const accusedRule = selectedCategory?.accused_rule || 'OPTIONAL';

  // Fetch dynamic categories on mount
  useEffect(() => {
    fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/admin/categories/public`)
      .then(r => r.ok ? r.json() : { categories: [] })
      .then(d => setCategories(d.categories || []))
      .catch(() => setCategories([]));
  }, []);

  const handleAddressChange = (e) => {
    const val = e.target.value;
    setAddress(val);
    setAreaHint(val.trim() ? detectAreaFromAddress(val) : null);
  };

  const handlePhotoChange = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    setPhotoFile(file);
    setPhotoPreview(URL.createObjectURL(file));
  };

  const handleSubmit = useCallback(async (e) => {
    e.preventDefault();

    if (!fullName || !address || !contactNumber || !complaintType || !message) {
      setPopup({ title: 'Missing Fields', text: 'Please fill all required fields.', type: 'error' });
      return;
    }

    // Validate accused_name based on category rule
    if (accusedRule === 'MANDATORY' && !accusedName.trim()) {
      setPopup({ title: 'Missing Fields', text: 'Name of Accused is required for this complaint type.', type: 'error' });
      return;
    }

    // ── Step 0: Area detection / address validation ────────────────
    const detectedArea = detectAreaFromAddress(address);
    if (!detectedArea) {
      setPopup({
        title: 'Address Validation Failed',
        text:  'Please include a valid Barangay Pinyahan street name in your address.\n\nExamples: Matatag St., Malakas Lane, Kalayaan Ave., V. Luna, Kamias Rd., NIA Road.',
        type:  'error',
      });
      return;
    }

    setSubmitting(true);

    // ── Step 1: Geofencing ─────────────────────────────────────────
    let latitude  = null;
    let longitude = null;
    setGeoStatus('checking');

    try {
      const position = await getUserPosition();
      latitude  = position.coords.latitude;
      longitude = position.coords.longitude;

      const distances = ALLOWED_LOCATIONS.map(loc => ({
        name: loc.name,
        km:   haversineDistanceKm(latitude, longitude, loc.lat, loc.lng),
      }));
      const withinAny = distances.some(d => d.km <= MAX_RADIUS_KM);
      const closest   = distances.reduce((a, b) => a.km < b.km ? a : b);

      if (!withinAny) {
        setGeoStatus('outside');
        setPopup({
          title: 'Outside Allowed Locations',
          text:  `You must be within ${MAX_RADIUS_KM} km of an allowed location to submit a complaint.\n\nClosest allowed point: ${closest.name} (${closest.km.toFixed(2)} km away).`,
          type:  'error',
        });
        setSubmitting(false);
        return;
      }

      setGeoStatus('ok');
    } catch (geoErr) {
      setGeoStatus('denied');
      setPopup({
        title: 'Location Required',
        text:  'You must be within the barangay limits to submit a complaint.\n\nPlease allow location access and try again.',
        type:  'error',
      });
      setSubmitting(false);
      return;
    }

    // ── Step 2: reCAPTCHA v3 token ─────────────────────────────────
    let captchaToken = null;
    try {
      if (executeRecaptcha) {
        captchaToken = await executeRecaptcha('submit_complaint');
      }
    } catch (captchaErr) {
      // Non-blocking
    }

    // ── Step 3: Submit to backend ──────────────────────────────────
    try {
      const formData = new FormData();
      formData.append('full_name',      fullName);
      if (accusedRule !== 'HIDDEN' && accusedName.trim()) {
        formData.append('accused_name', accusedName);
      }
      formData.append('address',        address);
      formData.append('contact_number', contactNumber);
      formData.append('complaint_type', complaintType);
      formData.append('message',        message);
      formData.append('area',           detectedArea);
      if (latitude  !== null) formData.append('latitude',     latitude);
      if (longitude !== null) formData.append('longitude',    longitude);
      if (captchaToken)       formData.append('captchaToken', captchaToken);
      if (photoFile)          formData.append('photo',        photoFile);

      const res  = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/complaints`, { method: 'POST', body: formData });
      const data = await res.json();

      if (!res.ok) {
        const msg = data.error || data.message || 'Submission failed.';
        if (data.code === 'PROXY_DETECTED' || data.code === 'VPN_DETECTED') {
          throw new Error('Proxy/VPN connections are not allowed. Please connect from a direct internet connection.');
        }
        if (data.code === 'CAPTCHA_FAILED') {
          throw new Error('Automated submission detected. Please try again.');
        }
        throw new Error(msg);
      }

      setPopup({
        title:   'Complaint Submitted!',
        text:    `Your Reference Number:\n${data.ref_no}\n\nCategory: ${data.category}\nUrgency: ${data.urgency_level}\n\nPlease save your reference number to track your complaint.`,
        type:    'success',
        onClose: () => router.push('/track-complaint'),
      });
    } catch (err) {
      setPopup({ title: 'Submission Failed', text: err.message, type: 'error' });
    } finally {
      setSubmitting(false);
    }
  }, [fullName, accusedName, address, contactNumber, complaintType, message, photoFile, executeRecaptcha, router]);

  // ── Geo status indicator label ─────────────────────────────────
  const geoLabel = {
    idle:     null,
    checking: { text: '📍 Verifying your location…',                         color: 'text-[#0056b3]' },
    ok:       { text: '✅ Location verified — within Barangay Pinyahan.',     color: 'text-green-700' },
    outside:  { text: '❌ Outside barangay limits.',                          color: 'text-red-700' },
    denied:   { text: '❌ Location access denied — required to submit.',      color: 'text-red-700' },
  }[geoStatus];

  return (
    <>
      {/* ═══ Popup Modal ═══ */}
      {popup && (
        <div onClick={() => { popup.onClose?.(); setPopup(null); }}
          className="fixed inset-0 bg-black/50 flex items-center justify-center z-[1000] p-4">
          <div onClick={e => e.stopPropagation()}
            className="bg-white rounded-2xl px-6 py-8 md:px-7 md:py-8 w-full max-w-[460px] shadow-2xl text-center animate-modalIn">
            <div className="text-[2.5rem] mb-3">
              {popup.type === 'success' ? '✅' : '❌'}
            </div>
            <h3 className={`font-extrabold mb-3 text-lg ${popup.type === 'success' ? 'text-green-700' : 'text-red-700'}`}>{popup.title}</h3>
            <p className="text-gray-600 text-[0.95rem] leading-relaxed whitespace-pre-wrap">{popup.text}</p>
            <button onClick={() => { popup.onClose?.(); setPopup(null); }}
              className="mt-5 bg-[#1565c0] hover:bg-[#0d47a1] text-white border-0 rounded-full px-8 py-2.5 font-bold text-base cursor-pointer transition-colors">
              OK
            </button>
          </div>
        </div>
      )}

      {/* ═══ Complaint Form ═══ */}
      <section className="bg-[#f0f2f5] py-12 md:py-16 px-5 flex justify-center">
        <div className="bg-white w-full max-w-[600px] p-8 md:p-10 rounded-2xl shadow-lg">
          <h2 className="text-[#006eb3] text-center font-extrabold text-xl md:text-[1.8rem] mb-2 uppercase">
            SUBMIT A COMPLAINT
          </h2>

          {/* Geofencing notice */}
          <p className="text-center text-gray-400 text-[0.82rem] mb-6">
            <i className="fas fa-map-marker-alt text-[#006eb3] mr-1" />
            Location verification required. You must be within 2 km of Barangay Pinyahan.
          </p>

          <form onSubmit={handleSubmit}>
            {/* Full Name */}
            <div className="mb-5">
              <input type="text" placeholder="Full Name (Pangalan ng nagrereklamo)" value={fullName} onChange={e => setFullName(e.target.value)} required
                className={inputCls} />
            </div>
            {/* Address */}
            <div className="mb-1">
              <input type="text" placeholder="Address" value={address} onChange={handleAddressChange} required
                className={`${inputCls} ${areaHint === null && address.trim() ? '!border-red-500 focus:!ring-red-400' : ''}`} />
            </div>
            {/* Live area hint */}
            {address.trim() && (
              <div className={`mb-4 pl-5 text-[0.8rem] font-bold flex items-center gap-1.5 ${areaHint ? 'text-green-700' : 'text-red-700'}`}>
                {areaHint
                  ? <><i className="fas fa-map-pin" /> Detected: {areaHint}</>
                  : <><i className="fas fa-exclamation-triangle" /> No valid Pinyahan street detected</>}
              </div>
            )}
            {/* Contact */}
            <div className="mb-5">
              <input type="tel" placeholder="Contact Number" value={contactNumber} onChange={e => setContactNumber(e.target.value)} required
                className={inputCls} />
            </div>
            {/* Complaint Type — Dynamic Categories */}
            <div className="mb-5">
              <div className="relative">
                <select value={complaintType} onChange={e => { setComplaintType(e.target.value); setAccusedName(''); }} required
                  className={selectCls}>
                  <option value="" disabled>Type of Complaint</option>
                  {categories.map(cat => (
                    <option key={cat.id} value={cat.name}>{cat.name}</option>
                  ))}
                </select>
                <i className="fas fa-caret-down absolute right-5 top-1/2 -translate-y-1/2 text-gray-500 pointer-events-none" />
              </div>
            </div>
            {/* Conditional Accused Name Field */}
            {complaintType && accusedRule !== 'HIDDEN' && (
              <div className="mb-5">
                <input
                  type="text"
                  placeholder={accusedRule === 'MANDATORY' ? 'Name of Accused (Required — Sino ang inirereklamo?)' : 'Name of Accused (Optional — Sino ang inirereklamo?)'}
                  value={accusedName}
                  onChange={e => setAccusedName(e.target.value)}
                  required={accusedRule === 'MANDATORY'}
                  className={`${inputCls} ${accusedRule === 'MANDATORY' ? '!border-red-300' : ''}`}
                />
                {accusedRule === 'MANDATORY' && (
                  <p className="text-xs text-red-700 mt-1 pl-5 font-semibold">
                    <i className="fas fa-exclamation-circle mr-1" /> Required for this complaint type
                  </p>
                )}
              </div>
            )}
            {/* Message */}
            <div className="mb-5">
              <textarea placeholder="Message" value={message} onChange={e => setMessage(e.target.value)} rows={5} required
                className="w-full px-5 py-3 border border-gray-300 rounded-2xl text-base outline-none resize-y focus:ring-2 focus:ring-[#006eb3] focus:border-[#006eb3] transition-all min-h-[120px]" />
            </div>
            {/* Photo Upload */}
            <div className="mb-5">
              <label className="block bg-[#cfd8dc] hover:bg-[#b0bec5] border-2 border-dashed border-gray-400 rounded-xl p-8 md:p-10 text-center cursor-pointer transition-colors">
                <input type="file" accept="image/*" hidden onChange={handlePhotoChange} />
                {photoPreview ? (
                  <img src={photoPreview} alt="Preview" className="max-h-[120px] rounded-lg object-cover mx-auto" />
                ) : (
                  <div className="flex flex-col items-center text-gray-600">
                    <i className="fas fa-plus text-4xl mb-2.5 text-gray-500" />
                    <span className="font-bold text-[0.9rem]">ADD PHOTO</span>
                    <span className="font-normal text-[0.8rem] mt-1">(Optional)</span>
                  </div>
                )}
              </label>
            </div>

            {/* Geo status indicator */}
            {geoLabel && (
              <p className={`text-center text-[0.85rem] mb-3 font-semibold ${geoLabel.color}`}>
                {geoLabel.text}
              </p>
            )}

            {/* Submit */}
            <button type="submit" disabled={submitting}
              className={`w-full py-4 border-0 rounded-full text-base md:text-lg font-bold uppercase tracking-wide text-white transition-all mt-2.5
                ${submitting ? 'bg-gray-400 cursor-not-allowed opacity-60' : 'bg-[#1565c0] hover:bg-[#0d47a1] active:scale-[0.98] cursor-pointer'}`}>
              {submitting
                ? geoStatus === 'checking'
                  ? '📍 Verifying location…'
                  : '⏳ Submitting…'
                : 'SUBMIT COMPLAINT'}
            </button>

            {/* reCAPTCHA branding (required by Google ToS) */}
            <p className="text-center text-[0.72rem] text-gray-400 mt-3">
              Protected by reCAPTCHA —{' '}
              <a href="https://policies.google.com/privacy" target="_blank" rel="noopener" className="text-gray-400 hover:text-gray-600">Privacy</a>{' '}
              &amp;{' '}
              <a href="https://policies.google.com/terms" target="_blank" rel="noopener" className="text-gray-400 hover:text-gray-600">Terms</a>
            </p>
          </form>
        </div>
      </section>
    </>
  );
}

// ─── Outer page component — wraps form in reCAPTCHA provider ────
export default function FileComplaintPage() {
  const RECAPTCHA_SITE_KEY = process.env.NEXT_PUBLIC_RECAPTCHA_SITE_KEY || 'YOUR_RECAPTCHA_SITE_KEY';

  return (
    <GoogleReCaptchaProvider reCaptchaKey={RECAPTCHA_SITE_KEY}>
      <PublicShell activeHref="/complaints">
        <ComplaintForm />
      </PublicShell>
      {/* Modal animation */}
      <style>{`
        @keyframes modalIn { from { opacity:0; transform:translateY(-15px); } to { opacity:1; transform:translateY(0); } }
        .animate-modalIn { animation: modalIn 0.25s ease; }
      `}</style>
    </GoogleReCaptchaProvider>
  );
}
