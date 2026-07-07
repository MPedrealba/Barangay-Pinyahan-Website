'use client';
import { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import PublicShell from '@/components/PublicShell';

// Icon map fallback
const ICON_MAP = [
  { keywords: ['clearance'],                    icon: 'fas fa-file-invoice' },
  { keywords: ['business', 'permit', 'store'],  icon: 'fas fa-store' },
  { keywords: ['indigency', 'certificate'],     icon: 'fas fa-file-lines' },
  { keywords: ['health', 'medical'],            icon: 'fas fa-heart' },
  { keywords: ['disaster', 'response', 'emergency'], icon: 'fas fa-bell' },
];
function getIcon(name = '', iconClass = '') {
  if (iconClass && iconClass !== 'fas fa-file-alt') return iconClass;
  const lower = name.toLowerCase();
  for (const entry of ICON_MAP) {
    if (entry.keywords.some(k => lower.includes(k))) return entry.icon;
  }
  return 'fas fa-cogs';
}

function parseArray(value) {
  if (Array.isArray(value)) return value;
  if (typeof value === 'string') {
    try { return JSON.parse(value); } catch { return []; }
  }
  return [];
}

export default function ServiceDetailPage() {
  const { id } = useParams();
  const [service,   setService]   = useState(null);
  const [others,    setOthers]    = useState([]);
  const [loading,   setLoading]   = useState(true);
  const [notFound,  setNotFound]  = useState(false);

  useEffect(() => {
    if (!id) return;
    // Fetch all active services — no auth needed
    fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/admin/services/public`))
      .then(r => r.ok ? r.json() : Promise.reject(r.status))
      .then(data => {
        const raw = Array.isArray(data) ? data : (data.services || []);
        const active = raw.filter(s => (s.status || '').toLowerCase() === 'active');
        const current = active.find(s => String(s.id) === String(id));
        if (!current) { setNotFound(true); return; }
        setService(current);
        setOthers(active.filter(s => String(s.id) !== String(id)));
      })
      .catch(() => setNotFound(true))
      .finally(() => setLoading(false));
  }, [id]);

  // ── Loading ────────────────────────────────────────────────────
  if (loading) {
    return (
      <PublicShell activeHref="/services">
        <div style={{ width: '90%', maxWidth: 1200, margin: '60px auto', textAlign: 'center', color: '#888' }}>
          <i className="fas fa-spinner fa-spin" style={{ fontSize: '2rem', marginBottom: 12, display: 'block' }}></i>
          Loading service details…
        </div>
      </PublicShell>
    );
  }

  // ── Not found ─────────────────────────────────────────────────
  if (notFound || !service) {
    return (
      <PublicShell activeHref="/services">
        <div style={{ width: '90%', maxWidth: 1200, margin: '60px auto', textAlign: 'center', color: '#888' }}>
          <i className="fas fa-exclamation-circle" style={{ fontSize: '3rem', color: '#ccc', display: 'block', marginBottom: 16 }}></i>
          <h2 style={{ fontWeight: 800, color: '#333' }}>Service Not Found</h2>
          <p style={{ marginTop: 8 }}>The service you are looking for does not exist or is no longer active.</p>
          <Link href="/services" style={{ display: 'inline-block', marginTop: 20, backgroundColor: '#006eb3', color: 'white', padding: '10px 28px', borderRadius: 5, fontWeight: 700, textDecoration: 'none' }}>
            ← Back to Services
          </Link>
        </div>
      </PublicShell>
    );
  }

  const requirements = parseArray(service.requirements);
  const procedures   = parseArray(service.procedures);
  const icon         = getIcon(service.name, service.icon_class);

  return (
    <PublicShell activeHref="/services">

      {/* ── Title Banner ──────────────────────────────────────────── */}
      <div style={{ width: '90%', maxWidth: 1200, margin: '32px auto 0' }}>
        <div style={{
          backgroundColor: '#006eb3', color: 'white', padding: '16px 24px',
          border: '3px solid #003d80', borderRadius: 6, width: '100%',
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          boxShadow: '0 4px 12px rgba(0,78,150,0.25)', boxSizing: 'border-box',
        }}>
          <Link href="/services"
            style={{ color: 'white', fontSize: '1.5rem', fontWeight: 'bold', display: 'flex', alignItems: 'center', justifyContent: 'center', backgroundColor: 'rgba(255,255,255,0.15)', borderRadius: 8, padding: '6px 18px', flexShrink: 0, textDecoration: 'none', transition: 'background-color 0.2s' }}
            onMouseEnter={e => e.currentTarget.style.backgroundColor = 'rgba(255,255,255,0.3)'}
            onMouseLeave={e => e.currentTarget.style.backgroundColor = 'rgba(255,255,255,0.15)'}
          >
            &#8592;
          </Link>
          <h1 style={{ flex: 1, textAlign: 'center', fontSize: '1.8rem', fontWeight: 800, textTransform: 'uppercase', margin: 0, letterSpacing: 2, color: 'white', padding: '0 12px' }}>
            {service.name}
          </h1>
          {/* Invisible spacer keeps title centred */}
          <span style={{ visibility: 'hidden', fontSize: '1.5rem', fontWeight: 'bold', padding: '6px 18px', flexShrink: 0 }}>&#8592;</span>
        </div>
      </div>

      {/* ── Description (if any) ──────────────────────────────────── */}
      {service.description && (
        <div style={{ width: '90%', maxWidth: 1200, margin: '20px auto 0' }}>
          <p style={{ color: '#555', fontSize: '1rem', lineHeight: 1.7 }}>{service.description}</p>
        </div>
      )}

      {/* ── Process Section ───────────────────────────────────────── */}
      <section style={{ width: '90%', maxWidth: 1200, margin: '0 auto', paddingTop: 32, paddingBottom: 36 }}>
        <h2 style={{ fontSize: '1.5rem', fontWeight: 800, color: '#222', textTransform: 'uppercase', marginBottom: 24, letterSpacing: 1 }}>
          PROCESS
        </h2>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 28 }} className="svc-process-grid">

          {/* Requirements */}
          <div style={{ border: '2px solid #006eb3', borderRadius: 10, padding: '32px 36px', background: '#fff', minHeight: 260, boxShadow: '0 2px 8px rgba(0,0,0,0.07)' }}>
            <h3 style={{ fontSize: '1.05rem', fontWeight: 800, color: '#006eb3', textTransform: 'uppercase', marginBottom: 18, letterSpacing: '0.8px', borderBottom: '2px solid #e3eef8', paddingBottom: 10 }}>
              REQUIREMENTS:
            </h3>
            {requirements.length > 0 ? (
              <ul style={{ paddingLeft: 22, color: '#444', listStyle: 'disc' }}>
                {requirements.map((r, i) => (
                  <li key={i} style={{ marginBottom: 12, fontSize: '1rem', lineHeight: 1.6 }}>{r}</li>
                ))}
              </ul>
            ) : (
              <p style={{ color: '#888', fontSize: '0.9rem' }}>Please visit the Barangay Hall for requirements.</p>
            )}
          </div>

          {/* Procedure */}
          <div style={{ border: '2px solid #006eb3', borderRadius: 10, padding: '32px 36px', background: '#fff', minHeight: 260, boxShadow: '0 2px 8px rgba(0,0,0,0.07)' }}>
            <h3 style={{ fontSize: '1.05rem', fontWeight: 800, color: '#006eb3', textTransform: 'uppercase', marginBottom: 18, letterSpacing: '0.8px', borderBottom: '2px solid #e3eef8', paddingBottom: 10 }}>
              PROCEDURE:
            </h3>
            {procedures.length > 0 ? (
              <ol style={{ paddingLeft: 22, color: '#444', listStyle: 'decimal' }}>
                {procedures.map((p, i) => (
                  <li key={i} style={{ marginBottom: 12, fontSize: '1rem', lineHeight: 1.6 }}>{p}</li>
                ))}
              </ol>
            ) : (
              <p style={{ color: '#888', fontSize: '0.9rem' }}>Please visit the Barangay Hall for procedures.</p>
            )}
          </div>
        </div>
      </section>

      {/* ── Other Services ─────────────────────────────────────────── */}
      {others.length > 0 && (
        <section style={{ width: '90%', maxWidth: 1200, margin: '0 auto', paddingTop: 10, paddingBottom: 50 }}>
          <h2 style={{ fontSize: '1.4rem', fontWeight: 800, color: '#222', textTransform: 'uppercase', marginBottom: 24, letterSpacing: 1 }}>
            OTHER SERVICES:
          </h2>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 24 }} className="svc-other-grid">
            {others.map(svc => (
              <div key={svc.id}
                style={{ backgroundColor: 'white', borderRadius: 15, boxShadow: '0 4px 12px rgba(0,0,0,0.1)', padding: '28px 32px', display: 'flex', alignItems: 'center', gap: 25, boxSizing: 'border-box', minWidth: 0, transition: 'transform 0.3s ease' }}
                onMouseEnter={e => e.currentTarget.style.transform = 'translateY(-5px)'}
                onMouseLeave={e => e.currentTarget.style.transform = 'translateY(0)'}
              >
                <div style={{ fontSize: '3rem', color: '#006eb3', minWidth: 60, textAlign: 'center', flexShrink: 0 }}>
                  <i className={getIcon(svc.name, svc.icon_class)} aria-hidden="true"></i>
                </div>
                <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 14 }}>
                  <h4 style={{ fontSize: '1.2rem', fontWeight: 700, color: '#333', margin: 0 }}>{svc.name}</h4>
                  <Link href={`/services/${svc.id}`}
                    style={{ display: 'inline-block', backgroundColor: '#006eb3', color: 'white', padding: '10px 25px', borderRadius: 5, fontWeight: 700, fontSize: '0.9rem', alignSelf: 'flex-start', whiteSpace: 'nowrap', textDecoration: 'none', transition: 'background-color 0.3s' }}
                    onMouseEnter={e => e.currentTarget.style.backgroundColor = '#004a80'}
                    onMouseLeave={e => e.currentTarget.style.backgroundColor = '#006eb3'}
                  >
                    LEARN MORE
                  </Link>
                </div>
              </div>
            ))}
          </div>
        </section>
      )}

      <style>{`
        @media (max-width: 768px) {
          .svc-process-grid { grid-template-columns: 1fr !important; }
          .svc-other-grid   { grid-template-columns: 1fr !important; }
        }
      `}</style>

    </PublicShell>
  );
}
