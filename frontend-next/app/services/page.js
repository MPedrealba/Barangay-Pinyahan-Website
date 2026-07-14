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
          <section style={{
            backgroundImage: "url('https://placehold.co/1200x400?text=Community+Park+Image')",
            backgroundSize: 'cover', backgroundPosition: 'center',
            height: 350, display: 'flex', alignItems: 'center', justifyContent: 'flex-start',
            position: 'relative', paddingLeft: '5%', paddingRight: '5%',
          }}>
            <div style={{ backgroundColor: 'rgba(0,51,102,0.6)', padding: '20px 40px', borderRadius: 5, textAlign: 'center', margin: '0 auto' }}>
              <h1 style={{ color: 'white', fontSize: '2.5rem', fontWeight: 800, textTransform: 'uppercase', textAlign: 'center', textShadow: '2px 2px 4px rgba(0,0,0,0.5)', margin: 0 }}>
                BARANGAY COMMUNITY SERVICES
              </h1>
            </div>
          </section>

          {/* Online Service Request CTA */}
          <section style={{ background: 'linear-gradient(135deg, #1565c0 0%, #0d47a1 100%)', padding: '30px 5%' }}>
            <div style={{ maxWidth: 1200, margin: '0 auto', display: 'flex', flexWrap: 'wrap', alignItems: 'center', justifyContent: 'space-between', gap: 16 }}>
              <div>
                <p style={{ color: 'rgba(255,255,255,0.8)', fontSize: '0.78rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: 4 }}>
                  <i className="fas fa-bolt" style={{ marginRight: 6 }}></i>New — Online Service Request
                </p>
                <h2 style={{ color: 'white', fontWeight: 800, fontSize: '1.25rem', margin: 0 }}>
                  Skip the queue. Request your documents online!
                </h2>
                <p style={{ color: 'rgba(255,255,255,0.75)', fontSize: '0.85rem', marginTop: 4 }}>
                  Submit requests for Barangay Clearance, Certificates, and more — get a tracking number instantly.
                </p>
              </div>
              <Link href="/services/request" style={{
                backgroundColor: 'white', color: '#1565c0', padding: '12px 28px',
                borderRadius: 30, fontWeight: 800, fontSize: '0.92rem', textDecoration: 'none',
                display: 'flex', alignItems: 'center', gap: 8, whiteSpace: 'nowrap',
                boxShadow: '0 4px 15px rgba(0,0,0,0.15)',
              }}>
                <i className="fas fa-file-alt"></i> Request a Service
              </Link>
            </div>
          </section>

          {/* Service Listing */}
          <section style={{ width: '90%', maxWidth: 1200, margin: '0 auto', padding: '20px 0 60px' }}>
            <h3 style={{ fontSize: '1.8rem', fontWeight: 800, color: '#333', textTransform: 'uppercase', marginBottom: 25, textAlign: 'center' }}>
              SERVICE LISTING
            </h3>

            {loading ? (
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 30, justifyContent: 'flex-start', marginTop: 40 }}>
                {[...Array(4)].map((_, i) => (
                  <div key={i} style={{ width: 'calc(50% - 30px)', height: 120, borderRadius: 15, background: 'linear-gradient(90deg,#d0d0d0 25%,#e8e8e8 50%,#d0d0d0 75%)', backgroundSize: '600px 100%', animation: 'shimmer 1.4s infinite linear' }} />
                ))}
              </div>
            ) : cards.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '60px 20px', color: '#888' }}>
                <i className="fas fa-tools" style={{ fontSize: '3rem', color: '#ccc', display: 'block', marginBottom: 14 }}></i>
                <p style={{ fontSize: '1rem', fontWeight: 600 }}>There are currently no active services listed.</p>
                <p style={{ fontSize: '0.88rem', marginTop: 6 }}>Please check back later or visit the Barangay Hall for assistance.</p>
              </div>
            ) : (
              <div style={{ display: 'flex', flexWrap: 'wrap', justifyContent: 'flex-start', gap: 30, marginTop: 40 }} className="services-grid-resp">
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
          <div style={{ width: '90%', maxWidth: 1200, margin: '32px auto 0' }}>
            <div style={{
              backgroundColor: '#006eb3', color: 'white', padding: '16px 24px',
              border: '3px solid #003d80', borderRadius: 6, width: '100%',
              display: 'flex', alignItems: 'center', justifyContent: 'space-between',
              boxShadow: '0 4px 12px rgba(0,78,150,0.25)', boxSizing: 'border-box',
            }}>
              <button onClick={showListing}
                style={{ color: 'white', fontSize: '1.5rem', fontWeight: 'bold', textDecoration: 'none', display: 'flex', alignItems: 'center', justifyContent: 'center', backgroundColor: 'rgba(255,255,255,0.15)', borderRadius: 8, padding: '6px 18px', flexShrink: 0, cursor: 'pointer', border: 'none', transition: 'background-color 0.2s' }}
                onMouseEnter={e => e.currentTarget.style.backgroundColor = 'rgba(255,255,255,0.3)'}
                onMouseLeave={e => e.currentTarget.style.backgroundColor = 'rgba(255,255,255,0.15)'}>
                &#8592;
              </button>
              <h2 style={{ flex: 1, textAlign: 'center', fontSize: '1.8rem', fontWeight: 800, textTransform: 'uppercase', margin: 0, letterSpacing: 2, color: 'white', padding: '0 12px' }}>
                {activeDetail.title}
              </h2>
              {/* Invisible spacer to keep title centered */}
              <span style={{ visibility: 'hidden', fontSize: '1.5rem', fontWeight: 'bold', padding: '6px 18px', flexShrink: 0 }}>&#8592;</span>
            </div>
          </div>

          {/* Process Section */}
          <section style={{ width: '90%', maxWidth: 1200, margin: '0 auto', paddingTop: 36, paddingBottom: 36 }}>
            <h3 style={{ fontSize: '1.5rem', fontWeight: 800, color: '#222', textTransform: 'uppercase', marginBottom: 24, letterSpacing: 1 }}>PROCESS</h3>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 28 }} className="process-grid-resp">
              {/* Requirements */}
              <div style={{ border: '2px solid #006eb3', borderRadius: 10, padding: '32px 36px', background: '#fff', minHeight: 260, boxShadow: '0 2px 8px rgba(0,0,0,0.07)' }}>
                <h4 style={{ fontSize: '1.05rem', fontWeight: 800, color: '#006eb3', textTransform: 'uppercase', marginBottom: 18, letterSpacing: '0.8px', borderBottom: '2px solid #e3eef8', paddingBottom: 10 }}>
                  REQUIREMENTS:
                </h4>
                <ul style={{ paddingLeft: 22, color: '#444', listStyle: 'disc' }}>
                  {activeDetail.requirements.map((r, i) => (
                    <li key={i} style={{ marginBottom: 12, fontSize: '1rem', lineHeight: 1.6 }}>{r}</li>
                  ))}
                </ul>
              </div>
              {/* Procedure */}
              <div style={{ border: '2px solid #006eb3', borderRadius: 10, padding: '32px 36px', background: '#fff', minHeight: 260, boxShadow: '0 2px 8px rgba(0,0,0,0.07)' }}>
                <h4 style={{ fontSize: '1.05rem', fontWeight: 800, color: '#006eb3', textTransform: 'uppercase', marginBottom: 18, letterSpacing: '0.8px', borderBottom: '2px solid #e3eef8', paddingBottom: 10 }}>
                  PROCEDURE:
                </h4>
                <ol style={{ paddingLeft: 22, color: '#444', listStyle: 'decimal' }}>
                  {activeDetail.procedure.map((p, i) => (
                    <li key={i} style={{ marginBottom: 12, fontSize: '1rem', lineHeight: 1.6 }}>{p}</li>
                  ))}
                </ol>
              </div>
            </div>
          </section>

          {/* Other Services */}
          {otherCards.length > 0 && (
            <section style={{ width: '90%', maxWidth: 1200, margin: '0 auto', paddingTop: 10, paddingBottom: 50 }}>
              <h3 style={{ fontSize: '1.4rem', fontWeight: 800, color: '#222', textTransform: 'uppercase', marginBottom: 24, letterSpacing: 1 }}>OTHER SERVICES:</h3>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 24, width: '100%' }} className="other-grid-resp">
                {otherCards.map(card => (
                  <ServiceCard key={card.id} card={card} compact onLearnMore={() => showDetail(card)} />
                ))}
              </div>
            </section>
          )}
        </>
      )}

      <style>{`
        @keyframes shimmer { 0% { background-position: -600px 0; } 100% { background-position: 600px 0; } }
        @media (max-width: 900px) {
          .services-grid-resp > * { width: 100% !important; }
          .process-grid-resp      { grid-template-columns: 1fr !important; }
          .other-grid-resp        { grid-template-columns: 1fr !important; }
        }
      `}</style>
    </PublicShell>
  );
}

// ── Service Card Component ───────────────────────────────────────
function ServiceCard({ card, onLearnMore, compact }) {
  return (
    <div
      style={{
        backgroundColor: 'white', borderRadius: 15, boxShadow: '0 4px 12px rgba(0,0,0,0.1)',
        padding: compact ? '28px 32px' : 30,
        display: 'flex', alignItems: 'center', gap: 25,
        width: compact ? '100%' : 'calc(50% - 30px)',
        boxSizing: 'border-box', minWidth: 0,
        transition: 'transform 0.3s ease',
      }}
      onMouseEnter={e => e.currentTarget.style.transform = 'translateY(-5px)'}
      onMouseLeave={e => e.currentTarget.style.transform = 'translateY(0)'}
    >
      {/* Icon or image */}
      {card.image ? (
        <img src={card.image} alt={card.title}
          style={{ width: 70, height: 70, objectFit: 'cover', borderRadius: 8, flexShrink: 0 }} />
      ) : (
        <div style={{ fontSize: '3.5rem', color: '#006eb3', minWidth: 70, textAlign: 'center', flexShrink: 0 }}>
          <i className={card.icon} aria-hidden="true"></i>
        </div>
      )}

      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 15 }}>
        <h4 style={{ fontSize: '1.3rem', fontWeight: 700, color: '#333', margin: 0 }}>{card.title}</h4>
        {card.description && !compact && (
          <p style={{ fontSize: '0.88rem', color: '#666', margin: 0, lineHeight: 1.5 }}>
            {card.description.length > 100 ? card.description.substring(0, 100) + '…' : card.description}
          </p>
        )}
        <Link
          href={`/services/${card.id}`}
          style={{ display: 'inline-block', backgroundColor: '#006eb3', color: 'white', padding: '10px 25px', borderRadius: 5, fontWeight: 700, fontSize: '0.9rem', textAlign: 'center', alignSelf: 'flex-start', whiteSpace: 'nowrap', textDecoration: 'none', transition: 'background-color 0.3s' }}
          onMouseEnter={e => e.currentTarget.style.backgroundColor = '#004a80'}
          onMouseLeave={e => e.currentTarget.style.backgroundColor = '#006eb3'}
        >
          LEARN MORE
        </Link>
      </div>
    </div>
  );
}
