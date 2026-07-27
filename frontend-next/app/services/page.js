'use client';
import { useState, useEffect } from 'react';
import Link from 'next/link';
import PublicShell from '@/components/PublicShell';

// ── Static fallback detail data (matches services.html exactly) ──
const STATIC_SERVICE_DATA = {
  clearance: {
    title: 'Barangay Clearance',
    icon:  'fas fa-file-invoice',
    requirements: [
      'Barangay Clearance Application Form',
      'Valid Government-issued ID',
      'Proof of Residency',
      'Cedula (Community Tax Certificate)',
    ],
    procedure: [
      'Submit requirements to the Barangay Office',
      'Verification of documents',
      'Pay clearance fee',
      'Processing and approval',
      'Release of Barangay Clearance',
    ],
  },
  business: {
    title: 'Business Permit Application',
    icon:  'fas fa-store',
    requirements: [
      'Duly accomplished Business Permit Application Form',
      'Valid Government-issued ID of the owner',
      'Barangay Clearance',
      'DTI/SEC/CDA Registration',
      'Lease Contract or Land Title (if applicable)',
    ],
    procedure: [
      'Secure and accomplish the application form',
      'Submit complete requirements to the Barangay Office',
      'Inspection of the business location',
      'Assessment and payment of applicable fees',
      'Release of Barangay Business Permit',
    ],
  },
  indigency: {
    title: 'Certificate of Indigency',
    icon:  'fas fa-file-lines',
    requirements: [
      'Request letter or filled-out application form',
      'Valid Government-issued ID',
      'Proof of Residency in Barangay Pinyahan',
      'Barangay Clearance (if required by the requesting institution)',
    ],
    procedure: [
      'Go to the Barangay Hall and state your purpose',
      'Submit required documents to the receiving clerk',
      'Verification of residency and financial status',
      'Processing and signing by the Punong Barangay',
      'Release of Certificate of Indigency',
    ],
  },
  health: {
    title: 'Health Services',
    icon:  'fas fa-heart',
    requirements: [
      'Valid Government-issued ID or Barangay ID',
      'Proof of Residency in Barangay Pinyahan',
      'PhilHealth ID (if available)',
      'Referral letter (for specialist consultations)',
    ],
    procedure: [
      'Register at the Barangay Health Center',
      'Present required documents',
      'Wait for queue number and consultation schedule',
      'Consultation with the Barangay Health Worker or Physician',
      'Receive medicines or referral as needed',
    ],
  },
  disaster: {
    title: 'Disaster Response',
    icon:  'fas fa-bell',
    requirements: [
      'Valid Government-issued ID or Barangay ID',
      'Proof of residency in the affected area',
      'Disaster/Calamity Report (if available)',
      'Request for Assistance Form',
    ],
    procedure: [
      'Report the disaster/emergency to the Barangay Hall or BDRRMC',
      'Assessment of damage and affected families',
      'Coordination with DRRMC and relevant agencies',
      'Distribution of relief goods and temporary shelter (if needed)',
      'Post-disaster monitoring and rehabilitation assistance',
    ],
  },
};

// Icon map — backend services matched by name keywords
const ICON_MAP = [
  { keywords: ['clearance'],        icon: 'fas fa-file-invoice' },
  { keywords: ['business', 'permit', 'store'], icon: 'fas fa-store' },
  { keywords: ['indigency', 'certificate'],    icon: 'fas fa-file-lines' },
  { keywords: ['health', 'medical'],           icon: 'fas fa-heart' },
  { keywords: ['disaster', 'response', 'emergency'], icon: 'fas fa-bell' },
];

function getIcon(name = '') {
  const lower = name.toLowerCase();
  for (const entry of ICON_MAP) {
    if (entry.keywords.some(k => lower.includes(k))) return entry.icon;
  }
  return 'fas fa-cogs';
}

function getPhotoUrl(url) {
  if (!url) return null;
  return url.startsWith('http') ? url : `${process.env.NEXT_PUBLIC_API_URL}${url}`;
}

export default function ServicesPage() {
  const [services,     setServices]     = useState([]);
  const [loading,      setLoading]      = useState(true);
  const [activeDetail, setActiveDetail] = useState(null); // null = listing view
  const [lastScroll,   setLastScroll]   = useState(0);

  // ── Fetch active services from backend ──────────────────────────
  useEffect(() => {
    // /api/admin/services/public already filters Active server-side
    fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/admin/services/public`)
      .then(r => r.ok ? r.json() : Promise.reject())
      .then(data => {
        const raw = Array.isArray(data) ? data : (data.services || []);
        // Extra client-side guard in case the route returns all statuses
        const active = raw.filter(s => (s.status || '').toLowerCase() === 'active');
        setServices(active);
      })
      .catch(() => setServices([]))
      .finally(() => setLoading(false));
  }, []);

  // ── Build card list from live DB data ──────────────────────────
  function buildCards() {
    return services.map(svc => ({
      id:           svc.id,
      title:        svc.name,
      // Use icon_class from DB, fall back to keyword map if blank
      icon:         svc.icon_class || getIcon(svc.name),
      description:  svc.description || '',
      image:        getPhotoUrl(svc.photo_url),
      // DB stores these as JSON arrays (parsed automatically by mysql2)
      requirements: Array.isArray(svc.requirements) && svc.requirements.length > 0
        ? svc.requirements
        : ['Please visit the Barangay Hall for requirements.'],
      procedure:    Array.isArray(svc.procedures) && svc.procedures.length > 0
        ? svc.procedures
        : ['Please visit the Barangay Hall for procedures.'],
    }));
  }

  const cards = buildCards();

  // ── Show detail view ─────────────────────────────────────────────
  const showDetail = (card) => {
    setLastScroll(window.scrollY);
    setActiveDetail(card);
    window.scrollTo({ top: 0, behavior: 'instant' });
  };

  const showListing = () => {
    setActiveDetail(null);
    setTimeout(() => window.scrollTo({ top: lastScroll, behavior: 'instant' }), 10);
  };

  // Other services: all except the active one
  const otherCards = activeDetail
    ? cards.filter(c => c.id !== activeDetail.id)
    : [];

  return (
    <PublicShell activeHref="/services">

      {/* ═══════════ LISTING VIEW ═══════════ */}
      {!activeDetail && (
        <>
          {/* Hero */}
          <section
            className="bg-cover bg-center h-[200px] sm:h-[280px] md:h-[350px] flex items-center justify-center relative px-[5%]"
            style={{ backgroundImage: "url('https://placehold.co/1200x400?text=Community+Park+Image')" }}
          >
            <div className="bg-[rgba(0,51,102,0.6)] px-6 py-4 md:px-10 md:py-5 rounded-md text-center mx-auto">
              <h1 className="text-white text-xl sm:text-2xl md:text-[2.5rem] font-extrabold uppercase text-center drop-shadow-lg m-0">
                BARANGAY COMMUNITY SERVICES
              </h1>
            </div>
          </section>

          {/* Online Service Request CTA */}
          <section className="bg-gradient-to-br from-[#1565c0] to-[#0d47a1] py-6 md:py-8 px-[5%]">
            <div className="max-w-[1200px] mx-auto flex flex-col sm:flex-row items-center justify-between gap-4">
              <div className="text-center sm:text-left">
                <p className="text-white/80 text-xs font-bold uppercase tracking-wider mb-1">
                  <i className="fas fa-bolt mr-1.5" />New — Online Service Request
                </p>
                <h2 className="text-white font-extrabold text-lg md:text-xl m-0">
                  Skip the queue. Request your documents online!
                </h2>
                <p className="text-white/75 text-sm mt-1">
                  Submit requests for Barangay Clearance, Certificates, and more — get a tracking number instantly.
                </p>
              </div>
              <Link href="/services/request"
                className="bg-white text-[#1565c0] px-7 py-3 rounded-full font-extrabold text-[0.92rem] no-underline flex items-center gap-2 whitespace-nowrap shadow-lg hover:bg-gray-50 transition-colors shrink-0"
              >
                <i className="fas fa-file-alt" /> Request a Service
              </Link>
            </div>
          </section>

          {/* Service Listing */}
          <section className="w-[90%] max-w-[1200px] mx-auto py-8 md:py-12">
            <h3 className="text-xl md:text-[1.8rem] font-extrabold text-gray-800 uppercase mb-6 text-center">
              SERVICE LISTING
            </h3>

            {loading ? (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mt-10">
                {[...Array(4)].map((_, i) => (
                  <div key={i} className="h-[120px] rounded-2xl animate-shimmer" />
                ))}
              </div>
            ) : cards.length === 0 ? (
              <div className="text-center py-16 px-5 text-gray-400">
                <i className="fas fa-tools text-5xl text-gray-300 block mb-3.5" />
                <p className="text-base font-semibold">There are currently no active services listed.</p>
                <p className="text-[0.88rem] mt-1.5">Please check back later or visit the Barangay Hall for assistance.</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mt-10">
                {cards.map(card => (
                  <ServiceCard key={card.id} card={card} onLearnMore={() => showDetail(card)} />
                ))}
              </div>
            )}
          </section>
        </>
      )}

      {/* ═══════════ DETAIL VIEW ═══════════ */}
      {activeDetail && (
        <>
          {/* Title Banner with Back Button */}
          <div className="w-[90%] max-w-[1200px] mx-auto mt-8">
            <div className="bg-[#006eb3] text-white px-5 py-4 border-[3px] border-[#003d80] rounded-md w-full flex items-center justify-between shadow-lg">
              <button onClick={showListing}
                className="text-white text-2xl font-bold bg-white/15 hover:bg-white/30 rounded-lg px-4 py-1.5 shrink-0 cursor-pointer border-0 transition-colors flex items-center justify-center"
              >
                &#8592;
              </button>
              <h2 className="flex-1 text-center text-lg sm:text-xl md:text-[1.8rem] font-extrabold uppercase m-0 tracking-wider text-white px-3">
                {activeDetail.title}
              </h2>
              {/* Invisible spacer to keep title centered */}
              <span className="invisible text-2xl font-bold px-4 py-1.5 shrink-0">&#8592;</span>
            </div>
          </div>

          {/* Process Section */}
          <section className="w-[90%] max-w-[1200px] mx-auto pt-9 pb-9">
            <h3 className="text-xl md:text-2xl font-extrabold text-gray-800 uppercase mb-6 tracking-wide">PROCESS</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-7">
              {/* Requirements */}
              <div className="border-2 border-[#006eb3] rounded-xl p-6 md:p-8 bg-white min-h-[260px] shadow-sm">
                <h4 className="text-[1.05rem] font-extrabold text-[#006eb3] uppercase mb-4 tracking-wide border-b-2 border-blue-100 pb-2.5">
                  REQUIREMENTS:
                </h4>
                <ul className="list-disc pl-5 text-gray-600 space-y-3 text-sm md:text-base leading-relaxed">
                  {activeDetail.requirements.map((r, i) => (
                    <li key={i}>{r}</li>
                  ))}
                </ul>
              </div>
              {/* Procedure */}
              <div className="border-2 border-[#006eb3] rounded-xl p-6 md:p-8 bg-white min-h-[260px] shadow-sm">
                <h4 className="text-[1.05rem] font-extrabold text-[#006eb3] uppercase mb-4 tracking-wide border-b-2 border-blue-100 pb-2.5">
                  PROCEDURE:
                </h4>
                <ol className="list-decimal pl-5 text-gray-600 space-y-3 text-sm md:text-base leading-relaxed">
                  {activeDetail.procedure.map((p, i) => (
                    <li key={i}>{p}</li>
                  ))}
                </ol>
              </div>
            </div>
          </section>

          {/* Other Services */}
          {otherCards.length > 0 && (
            <section className="w-[90%] max-w-[1200px] mx-auto pt-2.5 pb-12">
              <h3 className="text-lg md:text-xl font-extrabold text-gray-800 uppercase mb-6 tracking-wide">OTHER SERVICES:</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 w-full">
                {otherCards.map(card => (
                  <ServiceCard key={card.id} card={card} compact onLearnMore={() => showDetail(card)} />
                ))}
              </div>
            </section>
          )}
        </>
      )}

      {/* Shimmer animation */}
      <style>{`
        @keyframes shimmer { 0% { background-position: -600px 0; } 100% { background-position: 600px 0; } }
        .animate-shimmer {
          background: linear-gradient(90deg, #d0d0d0 25%, #e8e8e8 50%, #d0d0d0 75%);
          background-size: 600px 100%;
          animation: shimmer 1.4s infinite linear;
        }
      `}</style>
    </PublicShell>
  );
}

// ── Service Card Component ───────────────────────────────────────
function ServiceCard({ card, onLearnMore, compact }) {
  return (
    <div className="bg-white rounded-2xl shadow-md p-6 md:p-8 flex items-center gap-5 md:gap-6 transition-transform duration-300 hover:-translate-y-1.5 hover:shadow-lg">
      {/* Icon or image */}
      {card.image ? (
        <img src={card.image} alt={card.title}
          className="w-16 h-16 md:w-[70px] md:h-[70px] object-cover rounded-lg shrink-0" />
      ) : (
        <div className="text-5xl md:text-[3.5rem] text-[#006eb3] min-w-[70px] text-center shrink-0">
          <i className={card.icon} aria-hidden="true" />
        </div>
      )}

      <div className="flex-1 flex flex-col gap-3 md:gap-4 min-w-0">
        <h4 className="text-base md:text-xl font-bold text-gray-800 m-0">{card.title}</h4>
        {card.description && !compact && (
          <p className="text-[0.88rem] text-gray-500 m-0 leading-snug">
            {card.description.length > 100 ? card.description.substring(0, 100) + '…' : card.description}
          </p>
        )}
        <Link
          href={`/services/${card.id}`}
          className="inline-block bg-[#006eb3] hover:bg-[#004a80] text-white px-5 md:px-6 py-2.5 rounded-md font-bold text-[0.9rem] text-center self-start whitespace-nowrap no-underline transition-colors"
        >
          LEARN MORE
        </Link>
      </div>
    </div>
  );
}
