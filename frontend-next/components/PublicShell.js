'use client';
import { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';

const NAV_LINKS = [
  { label: 'HOME',             href: '/' },
  { label: 'ABOUT US',         href: '/about' },
  { label: 'SERVICES',         href: '/services' },
  { label: 'NEWS & EVENTS',    href: '/news' },
  { label: 'CITIZENS CHARTER', href: '/citizens-charter' },
  { label: 'SUBMIT COMPLAINT', href: '/complaints' },
  { label: 'TRACK COMPLAINT',  href: '/track-complaint' },
];

const HOTLINES = [
  { label: 'National Emergency',        number: '911',           tel: '911' },
  { label: 'Philippine National Police', number: '117',          tel: '117' },
  { label: 'Philippine Red Cross',       number: '143',          tel: '143' },
  { label: 'Bureau of Fire Protection',  number: '(02) 8426-0219', tel: '02-8426-0219' },
  { label: 'DSWD',                       number: '8931-81-08',   tel: '8931-81-08' },
  { label: 'Coast Guard',                number: '8527-3877',    tel: '8527-3877' },
];

// ─── Shared Footer ────────────────────────────────────────────────
export function PublicFooter() {
  return (
    <>
      {/* Main Footer */}
      <footer role="contentinfo" style={{ backgroundColor: '#e6e6e6', padding: '48px 5% 36px', fontSize: '0.9rem', borderTop: '3px solid #006eb3' }}>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 36, maxWidth: 1200, margin: '0 auto' }} className="footer-grid-resp">
          {/* Contact */}
          <div>
            <h4 style={{ fontSize: '1rem', marginBottom: 16, textTransform: 'uppercase', fontWeight: 800, color: '#003366', borderBottom: '2px solid #006eb3', paddingBottom: 8 }}>CONTACT INFORMATION</h4>
            <ul style={{ listStyle: 'none', padding: 0, margin: 0 }}>
              {[
                { icon: 'fab fa-facebook-square', content: <><span>Facebook:</span> <a href="https://facebook.com" target="_blank" rel="noopener" style={{ color: '#0056b3', textDecoration: 'underline' }}>Barangay Pinyahan</a></> },
                { icon: 'fas fa-envelope',        content: <><span>Email:</span> <a href="mailto:brgypinyahan@gmail.com" style={{ color: '#0056b3', textDecoration: 'underline' }}>brgypinyahan@gmail.com</a></> },
                { icon: 'fas fa-phone-alt',       content: 'Tel: (02) 1234-5678' },
                { icon: 'fas fa-map-marker-alt',  content: 'Malakas St, Diliman, Quezon City' },
              ].map((item, i) => (
                <li key={i} style={{ display: 'flex', alignItems: 'center', gap: 10, fontSize: '0.88rem', color: '#333', padding: '4px 0', minHeight: 44 }}>
                  <i className={item.icon} aria-hidden="true" style={{ color: '#006eb3', fontSize: '1rem', flexShrink: 0, width: 18, textAlign: 'center' }}></i>
                  <span>{item.content}</span>
                </li>
              ))}
            </ul>
            <div style={{ display: 'flex', gap: 12, marginTop: 18, alignItems: 'center' }}>
              <img src="/images/Quezon_City_logo.svg" alt="Quezon City Official Seal" style={{ width: 44, height: 44, objectFit: 'contain', borderRadius: '50%', background: '#fff', padding: 2, boxShadow: '0 1px 4px rgba(0,0,0,0.15)' }} />
              <img src="/images/Brgy._Pinyahan_Seal.png" alt="Barangay Pinyahan Official Seal" style={{ width: 44, height: 44, objectFit: 'contain', borderRadius: '50%', background: '#fff', padding: 2, boxShadow: '0 1px 4px rgba(0,0,0,0.15)' }} />
            </div>
          </div>
          {/* Map */}
          <div>
            <h4 style={{ fontSize: '1rem', marginBottom: 16, textTransform: 'uppercase', fontWeight: 800, color: '#003366', borderBottom: '2px solid #006eb3', paddingBottom: 8 }}>MAP LOCATION</h4>
            <p style={{ fontSize: '0.85rem', color: '#555', marginBottom: 4 }}>Malakas St, Diliman, Quezon City, Metro Manila</p>
            <iframe src="https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d3860.5!2d121.0505!3d14.6477!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x3397b700a30da6d5%3A0x5c8e4b7b!2sMalakas%20St%2C%20Diliman%2C%20Quezon%20City!5e0!3m2!1sen!2sph!4v1711000000000" title="Barangay Pinyahan Map Location" width="100%" height="160" style={{ border: 0, borderRadius: 6, marginTop: 10 }} allowFullScreen loading="lazy" referrerPolicy="no-referrer-when-downgrade" />
          </div>
          {/* Hotlines */}
          <div>
            <h4 style={{ fontSize: '1rem', marginBottom: 16, textTransform: 'uppercase', fontWeight: 800, color: '#003366', borderBottom: '2px solid #006eb3', paddingBottom: 8 }}>EMERGENCY HOTLINES</h4>
            <ul style={{ listStyle: 'none', padding: 0, margin: 0 }}>
              {HOTLINES.map(h => (
                <li key={h.label} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', minHeight: 44, padding: '6px 0', borderBottom: '1px solid rgba(0,0,0,0.07)', fontSize: '0.86rem', gap: 8 }}>
                  <span style={{ color: '#444', flex: 1 }}>{h.label}</span>
                  <a href={`tel:${h.tel}`} style={{ fontWeight: 700, color: '#cc0000', textDecoration: 'none', whiteSpace: 'nowrap', padding: '4px 8px', borderRadius: 4 }}>{h.number}</a>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </footer>

      {/* Gov Footer */}
      <div style={{ backgroundColor: '#003366', color: 'white', padding: 20, textAlign: 'center', borderTop: '4px solid #cc0000' }}>
        <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', gap: 10, marginTop: 10 }}>
          <img src="/images/Quezon_City_logo.svg" alt="Quezon City Official Seal" style={{ height: 40, width: 'auto', borderRadius: '50%' }} />
        </div>
        <h4 style={{ fontSize: '0.95rem', margin: '8px 0 4px' }}>REPUBLIC OF THE PHILIPPINES</h4>
        <p style={{ fontSize: '0.78rem', opacity: 0.85 }}>All content is in the public domain unless otherwise stated.</p>
      </div>

      {/* Sub-footer: Admin Login lower-left */}
      <div style={{ backgroundColor: '#1a1a2e', display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '10px 5%', fontSize: '0.78rem', flexWrap: 'wrap', gap: 8 }}>
        <div style={{ display: 'flex', justifyContent: 'flex-start', alignItems: 'center', gap: 16 }}>
          <Link href="/login" style={{ color: 'rgba(255,255,255,0.55)', textDecoration: 'none', display: 'inline-flex', alignItems: 'center', gap: 5, minHeight: 44, padding: '4px 0' }}
            onMouseEnter={e => e.currentTarget.style.color = 'rgba(255,255,255,0.9)'}
            onMouseLeave={e => e.currentTarget.style.color = 'rgba(255,255,255,0.55)'}>
            <i className="fas fa-lock" aria-hidden="true"></i> <span>Admin Login</span>
          </Link>
        </div>
        <span style={{ color: 'rgba(255,255,255,0.4)', fontSize: '0.75rem' }}>© {new Date().getFullYear()} Barangay Pinyahan. All rights reserved.</span>
      </div>

      <style>{`
        @media (max-width: 768px) { .footer-grid-resp { grid-template-columns: 1fr !important; } }
        @media (max-width: 1024px) and (min-width: 769px) { .footer-grid-resp { grid-template-columns: 1fr 1fr !important; } }
      `}</style>
    </>
  );
}

// ─── Shared Shell (header + nav + children + footer) ─────────────
export default function PublicShell({ children, activeHref }) {
  const pathname   = usePathname();
  const [menuOpen, setMenuOpen] = useState(false);
  const active     = activeHref || pathname;

  useEffect(() => {
    if (!menuOpen) return;
    const handler = (e) => { if (!e.target.closest('#pub-nav')) setMenuOpen(false); };
    document.addEventListener('click', handler);
    return () => document.removeEventListener('click', handler);
  }, [menuOpen]);

  return (
    <div style={{ backgroundColor: '#f0f0f0', color: '#333', fontFamily: "'Segoe UI', Tahoma, Geneva, Verdana, sans-serif", lineHeight: '1.6' }}>
      {/* Header */}
      <header style={{ background: 'white', padding: '12px 0', borderBottom: '1px solid #ddd' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '0 5%', maxWidth: 1200, margin: '0 auto', gap: 16 }}>
          <img src="/images/Quezon_City_logo.svg" alt="Quezon City Official Seal" style={{ height: 80, width: 'auto', flexShrink: 0 }} />
          <h1 style={{ color: '#007bff', fontSize: '2.5rem', fontWeight: 800, textAlign: 'center', flex: 1, lineHeight: 1.2, margin: 0 }}>Barangay Pinyahan</h1>
          <img src="/images/Brgy._Pinyahan_Seal.png" alt="Barangay Pinyahan Official Seal" style={{ height: 80, width: 'auto', flexShrink: 0 }} />
        </div>
      </header>

      {/* Nav */}
      <nav id="pub-nav" role="navigation" aria-label="Main Navigation" style={{ backgroundColor: '#006eb3', color: 'white' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', position: 'relative' }}>
          <ul className="pub-nav-list" style={{ display: 'flex', justifyContent: 'center', flexWrap: 'wrap', listStyle: 'none', margin: 0, padding: 0 }}>
            {NAV_LINKS.map((link, i) => {
              const isActive = link.href === '/' ? active === '/' : active.startsWith(link.href);
              return (
                <li key={link.href} style={{ borderRight: i < NAV_LINKS.length - 1 ? '1px solid rgba(255,255,255,0.3)' : 'none' }}>
                  <Link href={link.href} onClick={() => setMenuOpen(false)}
                    style={{ display: 'block', padding: '15px 22px', fontSize: '0.88rem', fontWeight: 'bold', textTransform: 'uppercase', textDecoration: 'none', color: 'white', backgroundColor: isActive ? '#004a80' : 'transparent', transition: 'background 0.3s' }}
                    onMouseEnter={e => { if (!isActive) e.currentTarget.style.backgroundColor = '#004a80'; }}
                    onMouseLeave={e => { if (!isActive) e.currentTarget.style.backgroundColor = 'transparent'; }}>
                    {link.label}
                  </Link>
                </li>
              );
            })}
          </ul>
          <button onClick={() => setMenuOpen(o => !o)} aria-label="Toggle navigation menu" aria-expanded={menuOpen} className="pub-hamburger"
            style={{ display: 'none', background: 'none', border: 'none', color: 'white', fontSize: '1.5rem', cursor: 'pointer', padding: '10px 16px' }}>
            <i className={`fas ${menuOpen ? 'fa-times' : 'fa-bars'}`} aria-hidden="true"></i>
          </button>
        </div>
        {menuOpen && (
          <ul style={{ listStyle: 'none', margin: 0, padding: 0, borderTop: '1px solid rgba(255,255,255,0.2)' }}>
            {NAV_LINKS.map(link => (
              <li key={link.href} style={{ borderBottom: '1px solid rgba(255,255,255,0.1)' }}>
                <Link href={link.href} onClick={() => setMenuOpen(false)}
                  style={{ display: 'block', padding: '13px 5%', color: 'white', textDecoration: 'none', fontWeight: 'bold', fontSize: '0.9rem' }}>
                  {link.label}
                </Link>
              </li>
            ))}
          </ul>
        )}
        <style>{`
          @media (max-width: 768px) { .pub-nav-list { display: none !important; } .pub-hamburger { display: block !important; } }
          @keyframes shimmer { 0% { background-position: -600px 0; } 100% { background-position: 600px 0; } }
        `}</style>
      </nav>

      {/* Page Content */}
      {children}

      <PublicFooter />
    </div>
  );
}
