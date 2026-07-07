'use client';
import { useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { GoogleReCaptchaProvider, useGoogleReCaptcha } from 'react-google-recaptcha-v3';
import PublicShell from '@/components/PublicShell';

// ─── Barangay Pinyahan approximate center coordinates ────────────
const BRGY_LAT  = 14.6400;
const BRGY_LNG  = 121.0460;
const RADIUS_KM = 2.0; // 2-kilometre radius

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
/**
 * Returns the detected area string (e.g. "Area 4", "Area 1/Area 2")
 * or null if no known Pinyahan street is found.
 *
 * Rules are checked most-specific first to avoid false matches:
 *   Area 4  must be checked before Area 3 ("malakas lane" before plain "malakas")
 *   Area 3  must be checked before the generic malakas overlap
 */
function detectAreaFromAddress(addressString) {
  const s = (addressString || '').toLowerCase();

  // Area 4 — check before Area 3 to catch specific sub-streets first
  if (
    s.includes('malakas lane')     ||
    s.includes('malakas upper')    ||
    s.includes('matatag upper')    ||
    s.includes('mapang-akit upper')||
    s.includes('matapang')
  ) return 'Area 4';

  // Area 3 — check before generic malakas overlap
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

  // Area 1/Area 2 overlap — plain "malakas" with no further qualifier
  if (s.includes('malakas')) return 'Area 1/Area 2';

  return null; // no recognised street found
}

// ─── Inner form component (needs reCAPTCHA context) ──────────────
function ComplaintForm() {
  const router = useRouter();
  const { executeRecaptcha } = useGoogleReCaptcha();

  const [fullName,      setFullName]      = useState('');
  const [address,       setAddress]       = useState('');
  const [contactNumber, setContactNumber] = useState('');
  const [complaintType, setComplaintType] = useState('');
  const [message,       setMessage]       = useState('');
  const [photoFile,     setPhotoFile]     = useState(null);
  const [photoPreview,  setPhotoPreview]  = useState(null);
  const [submitting,    setSubmitting]    = useState(false);
  const [geoStatus,     setGeoStatus]     = useState('idle'); // idle | checking | ok | denied | outside
  const [popup,         setPopup]         = useState(null);
  const [areaHint,      setAreaHint]      = useState(null); // live detected area

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

      const distanceKm = haversineDistanceKm(latitude, longitude, BRGY_LAT, BRGY_LNG);

      if (distanceKm > RADIUS_KM) {
        setGeoStatus('outside');
        setPopup({
          title: 'Outside Barangay Limits',
          text:  `You must be within the barangay limits to submit a complaint.\n\nYour location is approximately ${distanceKm.toFixed(1)} km from Barangay Pinyahan (limit: ${RADIUS_KM} km).`,
          type:  'error',
        });
        setSubmitting(false);
        return;
      }

      setGeoStatus('ok');
    } catch (geoErr) {
      // Permission denied or timeout → block submission
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
      // Non-blocking — submission continues even if token fails
    }

    // ── Step 3: Submit to backend ──────────────────────────────────
    try {
      const formData = new FormData();
      formData.append('full_name',      fullName);
      formData.append('address',        address);
      formData.append('contact_number', contactNumber);
      formData.append('complaint_type', complaintType);
      formData.append('message',        message);
      formData.append('area',           detectedArea);  // injected from detectAreaFromAddress
      if (latitude  !== null) formData.append('latitude',     latitude);
      if (longitude !== null) formData.append('longitude',    longitude);
      if (captchaToken)       formData.append('captchaToken', captchaToken);
      if (photoFile)          formData.append('photo',        photoFile);

      const res  = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/complaints`), { method: 'POST', body: formData });
      const data = await res.json();

      if (!res.ok) {
        // Surface specific server-side rejection reasons
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
  }, [fullName, address, contactNumber, complaintType, message, photoFile, executeRecaptcha, router]);

  // ── Geo status indicator label ─────────────────────────────────
  const geoLabel = {
    idle:     null,
    checking: { text: '📍 Verifying your location…',                         color: '#0056b3' },
    ok:       { text: '✅ Location verified — within Barangay Pinyahan.',     color: '#2e7d32' },
    outside:  { text: '❌ Outside barangay limits.',                          color: '#c62828' },
    denied:   { text: '❌ Location access denied — required to submit.',      color: '#c62828' },
  }[geoStatus];

  return (
    <>
      {/* Popup modal */}
      {popup && (
        <div onClick={() => { popup.onClose?.(); setPopup(null); }}
          style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000 }}>
          <div onClick={e => e.stopPropagation()}
            style={{ background: 'white', borderRadius: 14, padding: '32px 28px', width: '94%', maxWidth: 460, boxShadow: '0 10px 40px rgba(0,0,0,0.2)', textAlign: 'center' }}>
            <div style={{ fontSize: '2.5rem', marginBottom: 12 }}>
              {popup.type === 'success' ? '✅' : '❌'}
            </div>
            <h3 style={{ color: popup.type === 'success' ? '#2e7d32' : '#c62828', fontWeight: 800, marginBottom: 12, fontSize: '1.2rem' }}>{popup.title}</h3>
            <p style={{ color: '#444', fontSize: '0.95rem', lineHeight: 1.6, whiteSpace: 'pre-wrap' }}>{popup.text}</p>
            <button onClick={() => { popup.onClose?.(); setPopup(null); }}
              style={{ marginTop: 20, background: '#1565c0', color: 'white', border: 'none', borderRadius: 25, padding: '10px 32px', fontWeight: 700, fontSize: '1rem', cursor: 'pointer' }}>
              OK
            </button>
          </div>
        </div>
      )}

      {/* Complaint Section */}
      <section style={{ backgroundColor: '#f0f2f5', padding: '60px 20px', display: 'flex', justifyContent: 'center' }}>
        <div style={{ backgroundColor: 'white', width: '100%', maxWidth: 600, padding: 40, borderRadius: 15, boxShadow: '0 4px 15px rgba(0,0,0,0.1)' }}>
          <h2 style={{ color: '#006eb3', textAlign: 'center', fontWeight: 800, fontSize: '1.8rem', marginBottom: 8, textTransform: 'uppercase' }}>
            SUBMIT A COMPLAINT
          </h2>

          {/* Geofencing notice */}
          <p style={{ textAlign: 'center', color: '#888', fontSize: '0.82rem', marginBottom: 24 }}>
            <i className="fas fa-map-marker-alt" style={{ color: '#006eb3', marginRight: 4 }}></i>
            Location verification required. You must be within 2 km of Barangay Pinyahan.
          </p>

          <form onSubmit={handleSubmit}>
            {/* Full Name */}
            <div style={{ marginBottom: 20 }}>
              <input type="text" placeholder="Full Name" value={fullName} onChange={e => setFullName(e.target.value)} required
                style={{ width: '100%', padding: '12px 20px', border: '1px solid #ccc', borderRadius: 25, fontSize: '1rem', outline: 'none', boxSizing: 'border-box' }} />
            </div>
            {/* Address */}
            <div style={{ marginBottom: 4 }}>
              <input type="text" placeholder="Address" value={address} onChange={handleAddressChange} required
                style={{ width: '100%', padding: '12px 20px', border: `1px solid ${areaHint === null && address.trim() ? '#e53935' : '#ccc'}`, borderRadius: 25, fontSize: '1rem', outline: 'none', boxSizing: 'border-box' }} />
            </div>
            {/* Live area hint */}
            {address.trim() && (
              <div style={{ marginBottom: 16, paddingLeft: 20, fontSize: '0.8rem', fontWeight: 700,
                color: areaHint ? '#2e7d32' : '#c62828',
                display: 'flex', alignItems: 'center', gap: 6 }}>
                {areaHint
                  ? <><i className="fas fa-map-pin"></i> Detected: {areaHint}</>  
                  : <><i className="fas fa-exclamation-triangle"></i> No valid Pinyahan street detected</>}
              </div>
            )}
            {/* Contact */}
            <div style={{ marginBottom: 20 }}>
              <input type="tel" placeholder="Contact Number" value={contactNumber} onChange={e => setContactNumber(e.target.value)} required
                style={{ width: '100%', padding: '12px 20px', border: '1px solid #ccc', borderRadius: 25, fontSize: '1rem', outline: 'none', boxSizing: 'border-box' }} />
            </div>
            {/* Complaint Type */}
            <div style={{ marginBottom: 20 }}>
              <div style={{ position: 'relative' }}>
                <select value={complaintType} onChange={e => setComplaintType(e.target.value)} required
                  style={{ width: '100%', padding: '12px 20px', border: '1px solid #ccc', borderRadius: 25, fontSize: '1rem', outline: 'none', appearance: 'none', background: 'white', cursor: 'pointer', boxSizing: 'border-box' }}>
                  <option value="" disabled>Type of Complaint</option>
                  <option value="noise">Noise Complaint</option>
                  <option value="trash">Garbage/Trash Issue</option>
                  <option value="security">Security Concern</option>
                  <option value="other">Other</option>
                </select>
                <i className="fas fa-caret-down" style={{ position: 'absolute', right: 20, top: '50%', transform: 'translateY(-50%)', color: '#333', pointerEvents: 'none' }}></i>
              </div>
            </div>
            {/* Message */}
            <div style={{ marginBottom: 20 }}>
              <textarea placeholder="Message" value={message} onChange={e => setMessage(e.target.value)} rows={5} required
                style={{ width: '100%', padding: '12px 20px', border: '1px solid #ccc', borderRadius: 15, fontSize: '1rem', outline: 'none', resize: 'vertical', boxSizing: 'border-box', fontFamily: 'inherit' }} />
            </div>
            {/* Photo Upload */}
            <div style={{ marginBottom: 20 }}>
              <label style={{ display: 'block', backgroundColor: '#cfd8dc', border: '2px dashed #90a4ae', borderRadius: 10, padding: 40, textAlign: 'center', cursor: 'pointer', transition: 'background-color 0.3s' }}
                onMouseEnter={e => e.currentTarget.style.backgroundColor = '#b0bec5'}
                onMouseLeave={e => e.currentTarget.style.backgroundColor = '#cfd8dc'}>
                <input type="file" accept="image/*" hidden onChange={handlePhotoChange} />
                {photoPreview ? (
                  <img src={photoPreview} alt="Preview" style={{ maxHeight: 120, borderRadius: 8, objectFit: 'cover' }} />
                ) : (
                  <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', color: '#555' }}>
                    <i className="fas fa-plus" style={{ fontSize: '2.5rem', marginBottom: 10, color: '#455a64' }}></i>
                    <span style={{ fontWeight: 'bold', fontSize: '0.9rem' }}>ADD PHOTO</span>
                    <span style={{ fontWeight: 'normal', fontSize: '0.8rem', marginTop: 5 }}>(Optional)</span>
                  </div>
                )}
              </label>
            </div>

            {/* Geo status indicator */}
            {geoLabel && (
              <p style={{ textAlign: 'center', color: geoLabel.color, fontSize: '0.85rem', marginBottom: 12, fontWeight: 600 }}>
                {geoLabel.text}
              </p>
            )}

            {/* Submit */}
            <button type="submit" disabled={submitting}
              style={{ width: '100%', backgroundColor: submitting ? '#90a4ae' : '#1565c0', color: 'white', padding: 15, border: 'none', borderRadius: 25, fontSize: '1.1rem', fontWeight: 700, textTransform: 'uppercase', cursor: submitting ? 'not-allowed' : 'pointer', marginTop: 10, transition: 'background-color 0.3s' }}>
              {submitting
                ? geoStatus === 'checking'
                  ? '📍 Verifying location…'
                  : '⏳ Submitting…'
                : 'SUBMIT COMPLAINT'}
            </button>

            {/* reCAPTCHA branding (required by Google ToS) */}
            <p style={{ textAlign: 'center', fontSize: '0.72rem', color: '#aaa', marginTop: 12 }}>
              Protected by reCAPTCHA —{' '}
              <a href="https://policies.google.com/privacy" target="_blank" rel="noopener" style={{ color: '#aaa' }}>Privacy</a>{' '}
              &amp;{' '}
              <a href="https://policies.google.com/terms" target="_blank" rel="noopener" style={{ color: '#aaa' }}>Terms</a>
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
    </GoogleReCaptchaProvider>
  );
}
