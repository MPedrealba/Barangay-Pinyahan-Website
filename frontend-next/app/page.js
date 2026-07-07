'use client';
import { useState, useEffect, useRef, useCallback } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';

// ─── Helpers ────────────────────────────────────────────────────
function getPhotoUrl(url) {
  if (!url) return null;
  if (url.startsWith('http')) return url;
  return `${process.env.NEXT_PUBLIC_API_URL}${url}`;
}

function formatDate(str) {
  if (!str) return '';
  return new Date(str).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' });
}

// ─── Nav links ──────────────────────────────────────────────────
const NAV_LINKS = [
  { label: 'HOME',             href: '/' },
  { label: 'ABOUT US',         href: '/about' },
  { label: 'SERVICES',         href: '/services' },
  { label: 'NEWS & EVENTS',    href: '/news' },
  { label: 'CITIZENS CHARTER', href: '/citizens-charter' },
  { label: 'SUBMIT COMPLAINT', href: '/complaints' },
  { label: 'TRACK COMPLAINT',  href: '/complaints/track' },
];

export default function PublicHomePage() {
  const pathname = usePathname();
  const [menuOpen,       setMenuOpen]       = useState(false);
  const [events,         setEvents]         = useState([]);
  const [news,           setNews]           = useState([]);
  const [loadingEvents,  setLoadingEvents]  = useState(true);
  const [loadingNews,    setLoadingNews]    = useState(true);
  const [errorEvents,    setErrorEvents]    = useState(false);
  const [errorNews,      setErrorNews]      = useState(false);

  // Carousel state
  const [currentSlide,   setCurrentSlide]   = useState(0);
  const autoSlideRef = useRef(null);
  const totalSlides  = news.length;

  // ── Fetch Events ──────────────────────────────────────────────
  useEffect(() => {
    fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/admin/events/public`))
      .then(r => r.ok ? r.json() : Promise.reject())
      .then(data => setEvents(data.events || []))
      .catch(() => setErrorEvents(true))
      .finally(() => setLoadingEvents(false));
  }, []);

  // ── Fetch News ────────────────────────────────────────────────
  useEffect(() => {
    fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/admin/news/public?limit=10`))
      .then(r => r.ok ? r.json() : Promise.reject())
      .then(data => setNews(data.news || []))
      .catch(() => setErrorNews(true))
      .finally(() => setLoadingNews(false));
  }, []);

  // ── Carousel auto-slide ───────────────────────────────────────
  const goToSlide = useCallback((idx) => {
    if (totalSlides === 0) return;
    setCurrentSlide(((idx % totalSlides) + totalSlides) % totalSlides);
  }, [totalSlides]);

  const resetAutoSlide = useCallback(() => {
    clearInterval(autoSlideRef.current);
    autoSlideRef.current = setInterval(() => goToSlide(currentSlide + 1), 5000);
  }, [currentSlide, goToSlide]);

  useEffect(() => {
    if (totalSlides > 0) {
      autoSlideRef.current = setInterval(() => setCurrentSlide(s => (s + 1) % totalSlides), 5000);
    }
    return () => clearInterval(autoSlideRef.current);
  }, [totalSlides]);

  // ── Close menu on outside click ───────────────────────────────
  useEffect(() => {
    if (!menuOpen) return;
    const handler = (e) => {
      if (!e.target.closest('#main-nav')) setMenuOpen(false);
    };
    document.addEventListener('click', handler);
    return () => document.removeEventListener('click', handler);
  }, [menuOpen]);

  return (
    <div style={{ backgroundColor: '#f0f0f0', color: '#333', fontFamily: "'Segoe UI', Tahoma, Geneva, Verdana, sans-serif", lineHeight: '1.6' }}>

      {/* ═══════════ HEADER ═══════════ */}
      <header style={{ background: 'white', padding: '12px 0', borderBottom: '1px solid #ddd' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '0 5%', maxWidth: 1200, margin: '0 auto', gap: 16 }}>
          <img src="/images/Quezon_City_logo.svg" alt="Quezon City Official Seal" style={{ height: 80, width: 'auto', flexShrink: 0 }} />
          <h1 style={{ color: '#007bff', fontSize: '2.5rem', fontWeight: 800, textAlign: 'center', flex: 1, lineHeight: 1.2 }}>
            Barangay Pinyahan
          </h1>
          <img src="/images/Brgy._Pinyahan_Seal.png" alt="Barangay Pinyahan Official Seal" style={{ height: 80, width: 'auto', flexShrink: 0 }} />
        </div>
      </header>

      {/* ═══════════ NAVIGATION ═══════════ */}
      <nav id="main-nav" role="navigation" aria-label="Main Navigation" style={{ backgroundColor: '#006eb3', color: 'white' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', position: 'relative' }}>
          {/* Desktop links */}
          <ul style={{ display: 'flex', justifyContent: 'center', flexWrap: 'wrap', listStyle: 'none', margin: 0, padding: 0 }}
              className="nav-links-list">
            {NAV_LINKS.map((link, i) => {
              const active = link.href === '/' ? pathname === '/' : pathname.startsWith(link.href);
              return (
                <li key={link.href} style={{ borderRight: i < NAV_LINKS.length - 1 ? '1px solid rgba(255,255,255,0.3)' : 'none' }}>
                  <Link
                    href={link.href}
                    onClick={() => setMenuOpen(false)}
                    style={{
                      display: 'block', padding: '15px 22px', fontSize: '0.88rem',
                      fontWeight: 'bold', textTransform: 'uppercase', textDecoration: 'none',
                      color: 'white', transition: 'background 0.3s',
                      backgroundColor: active ? '#004a80' : 'transparent',
                    }}
                    onMouseEnter={e => { if (!active) e.currentTarget.style.backgroundColor = '#004a80'; }}
                    onMouseLeave={e => { if (!active) e.currentTarget.style.backgroundColor = 'transparent'; }}
                  >
                    {link.label}
                  </Link>
                </li>
              );
            })}
          </ul>

          {/* Hamburger */}
          <button
            onClick={() => setMenuOpen(o => !o)}
            aria-label="Toggle navigation menu"
            aria-expanded={menuOpen}
            style={{
              display: 'none', background: 'none', border: 'none', color: 'white',
              fontSize: '1.5rem', cursor: 'pointer', padding: '10px 16px',
            }}
            className="hamburger-btn"
          >
            <i className={`fas ${menuOpen ? 'fa-times' : 'fa-bars'}`} aria-hidden="true"></i>
          </button>
        </div>

        {/* Mobile dropdown */}
        {menuOpen && (
          <ul style={{ listStyle: 'none', margin: 0, padding: 0, borderTop: '1px solid rgba(255,255,255,0.2)' }}>
            {NAV_LINKS.map(link => (
              <li key={link.href} style={{ borderBottom: '1px solid rgba(255,255,255,0.1)' }}>
                <Link
                  href={link.href}
                  onClick={() => setMenuOpen(false)}
                  style={{ display: 'block', padding: '13px 5%', color: 'white', textDecoration: 'none', fontWeight: 'bold', fontSize: '0.9rem' }}
                >
                  {link.label}
                </Link>
              </li>
            ))}
          </ul>
        )}

        <style>{`
          @media (max-width: 768px) {
            .nav-links-list { display: none !important; }
            .hamburger-btn  { display: block !important; }
          }
        `}</style>
      </nav>

      {/* ═══════════ HERO BANNER ═══════════ */}
      <section aria-label="Banner" style={{ position: 'relative', overflow: 'hidden', backgroundColor: '#003366' }}>
        <img
          src="/images/newly_elected_officials.jpg"
          alt="Newly Elected Barangay Pinyahan Officials"
          style={{ width: '100%', height: 'auto', display: 'block', objectFit: 'cover', maxHeight: 520, minHeight: 180 }}
          loading="eager"
        />
        <div aria-hidden="true" style={{
          position: 'absolute', bottom: 0, left: 0, right: 0,
          background: 'rgba(0,86,179,0.75)', color: 'white', textAlign: 'center',
          padding: '8px 0', fontSize: '1.1rem', fontWeight: 800, letterSpacing: 2,
          textTransform: 'uppercase',
        }}>
          <span>HOME</span>
        </div>
      </section>

      {/* ═══════════ WELCOME ═══════════ */}
      <section style={{ textAlign: 'center', padding: '50px 20px', maxWidth: 1000, margin: '0 auto' }}>
        <h2 style={{ color: '#0056b3', marginBottom: 20, fontSize: '1.8rem' }}>
          Welcome to the Barangay Pinyahan Official Website!
        </h2>
        <p style={{ maxWidth: 800, margin: '0 auto 15px', fontSize: '1rem', color: '#444' }}>
          We're happy to have you here! This space was created to keep our community informed, connected, and involved. Whether you're looking for the latest announcements, ongoing projects, public services, or ways to participate in our programs, everything you need is just a few clicks away.
        </p>
        <p style={{ maxWidth: 800, margin: '0 auto', fontSize: '1rem', color: '#444' }}>
          Our barangay thrives because of the people who call it home—and we hope this website makes it easier for you to stay updated, raise concerns, and engage with us. Thank you for being an important part of our community. Together, let's continue building a safe, caring, and progressive barangay.
        </p>
      </section>

      {/* ═══════════ EVENTS ═══════════ */}
      <section aria-labelledby="events-heading" style={{ backgroundColor: '#e9ecef', padding: '40px 5%' }}>
        <h3 id="events-heading" style={{ fontSize: '1.8rem', fontWeight: 800, color: '#333', textTransform: 'uppercase', marginBottom: 25 }}>
          EVENTS
        </h3>

        {/* Skeleton */}
        {loadingEvents && (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: 15, marginTop: 20 }}>
            {[...Array(4)].map((_, i) => (
              <div key={i} style={{
                borderRadius: 8, height: 180,
                background: 'linear-gradient(90deg,#d0d0d0 25%,#e8e8e8 50%,#d0d0d0 75%)',
                backgroundSize: '600px 100%',
                animation: 'shimmer 1.4s infinite linear',
              }} />
            ))}
          </div>
        )}

        {/* Error */}
        {!loadingEvents && errorEvents && (
          <EmptyState icon="fa-exclamation-circle" title="Unable to Load Events" sub="Please check your connection and try again." error />
        )}

        {/* Empty */}
        {!loadingEvents && !errorEvents && events.length === 0 && (
          <EmptyState icon="fa-calendar-times" title="No Upcoming Events" sub="Check back soon for announcements from Barangay Pinyahan." />
        )}

        {/* Grid */}
        {!loadingEvents && !errorEvents && events.length > 0 && (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: 15, marginTop: 20 }}
               className="events-grid-responsive">
            {events.map(ev => {
              const img = getPhotoUrl(ev.photo_url)
                || `https://placehold.co/300x200/006eb3/ffffff?text=${encodeURIComponent(ev.name)}`;
              return (
                <Link
                  key={ev.id}
                  href={`/events/${ev.id}`}
                  title={ev.name}
                  style={{ position: 'relative', display: 'block', overflow: 'hidden', borderRadius: 8, boxShadow: '0 2px 8px rgba(0,0,0,0.12)', textDecoration: 'none', color: 'inherit' }}
                  className="event-card"
                >
                  <img src={img} alt={ev.name} loading="lazy"
                    style={{ width: '100%', height: 180, objectFit: 'cover', display: 'block', transition: 'transform 0.35s ease' }}
                    className="event-card-img" />
                  <div className="event-card-overlay" style={{
                    position: 'absolute', bottom: 0, left: 0, right: 0, padding: '10px 12px',
                    background: 'linear-gradient(transparent,rgba(0,0,0,0.7))', color: 'white',
                    opacity: 0, transition: 'opacity 0.3s ease',
                  }}>
                    <span style={{ fontSize: '0.85rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.3px' }}>
                      {ev.name}
                    </span>
                  </div>
                </Link>
              );
            })}
          </div>
        )}
      </section>

      {/* ═══════════ NEWS & UPDATES ═══════════ */}
      <section aria-labelledby="news-heading" style={{ padding: '40px 5%', background: '#f8f9fa' }}>
        <h3 id="news-heading" style={{ fontSize: '1.8rem', fontWeight: 800, color: '#333', textTransform: 'uppercase', marginBottom: 25 }}>
          NEWS &amp; UPDATES
        </h3>

        <div style={{ position: 'relative', maxWidth: 900, margin: '0 auto', overflow: 'hidden', borderRadius: 10, boxShadow: '0 4px 16px rgba(0,0,0,0.12)' }}>

          {/* Skeleton carousel */}
          {loadingNews && (
            <div style={{
              width: '100%', height: 320, borderRadius: 8,
              background: 'linear-gradient(90deg,#d0d0d0 25%,#e8e8e8 50%,#d0d0d0 75%)',
              backgroundSize: '600px 100%', animation: 'shimmer 1.4s infinite linear',
            }} />
          )}

          {/* Error */}
          {!loadingNews && errorNews && (
            <EmptyState icon="fa-exclamation-circle" title="Unable to Load News" sub="Please check your connection and try again." error />
          )}

          {/* Empty */}
          {!loadingNews && !errorNews && news.length === 0 && (
            <EmptyState icon="fa-newspaper" title="No News Updates Yet" sub="Stay tuned for the latest news from Barangay Pinyahan." />
          )}

          {/* Carousel */}
          {!loadingNews && !errorNews && news.length > 0 && (
            <>
              {/* Track */}
              <div style={{ display: 'flex', transition: 'transform 0.5s ease', transform: `translateX(-${currentSlide * 100}%)`, willChange: 'transform' }}>
                {news.map(n => {
                  const img = getPhotoUrl(n.photo_url)
                    || `https://placehold.co/900x400/006eb3/ffffff?text=${encodeURIComponent(n.title)}`;
                  return (
                    <Link key={n.id} href={`/news/${n.id}`} title={n.title}
                      style={{ minWidth: '100%', position: 'relative', display: 'block', textDecoration: 'none', color: 'inherit', flexShrink: 0, cursor: 'pointer' }}
                      className="carousel-slide">
                      <img src={img} alt={n.title} loading="lazy"
                        style={{ width: '100%', height: 400, objectFit: 'cover', display: 'block' }} />
                      <div style={{
                        position: 'absolute', bottom: 0, left: 0, right: 0, padding: '20px 25px',
                        background: 'linear-gradient(transparent 0%,rgba(0,0,0,0.75) 100%)', color: 'white',
                      }}>
                        <h4 style={{ fontSize: '1.25rem', fontWeight: 700, marginBottom: 4 }}>{n.title}</h4>
                        <p style={{ fontSize: '0.8rem', opacity: 0.85, marginBottom: 6 }}>{formatDate(n.date_published)}</p>
                        <p style={{ fontSize: '0.85rem', opacity: 0.9, lineHeight: 1.4 }}>
                          {n.description ? n.description.substring(0, 120) + '…' : ''}
                        </p>
                      </div>
                    </Link>
                  );
                })}
              </div>

              {/* Arrows */}
              <button onClick={() => { goToSlide(currentSlide - 1); resetAutoSlide(); }}
                aria-label="Previous news"
                style={{
                  position: 'absolute', top: '50%', left: 12, transform: 'translateY(-50%)',
                  background: 'rgba(255,255,255,0.9)', border: 'none', width: 40, height: 40, borderRadius: '50%',
                  cursor: 'pointer', fontSize: '1rem', color: '#333', display: 'flex', alignItems: 'center',
                  justifyContent: 'center', boxShadow: '0 2px 8px rgba(0,0,0,0.2)', zIndex: 10, transition: 'background 0.2s',
                }}>
                <i className="fas fa-chevron-left" aria-hidden="true"></i>
              </button>
              <button onClick={() => { goToSlide(currentSlide + 1); resetAutoSlide(); }}
                aria-label="Next news"
                style={{
                  position: 'absolute', top: '50%', right: 12, transform: 'translateY(-50%)',
                  background: 'rgba(255,255,255,0.9)', border: 'none', width: 40, height: 40, borderRadius: '50%',
                  cursor: 'pointer', fontSize: '1rem', color: '#333', display: 'flex', alignItems: 'center',
                  justifyContent: 'center', boxShadow: '0 2px 8px rgba(0,0,0,0.2)', zIndex: 10, transition: 'background 0.2s',
                }}>
                <i className="fas fa-chevron-right" aria-hidden="true"></i>
              </button>

              {/* Dots */}
              <div style={{ position: 'absolute', bottom: 12, left: '50%', transform: 'translateX(-50%)', display: 'flex', gap: 8, zIndex: 10 }}>
                {news.map((_, i) => (
                  <button key={i} onClick={() => { goToSlide(i); resetAutoSlide(); }}
                    aria-label={`Go to slide ${i + 1}`}
                    style={{
                      width: 10, height: 10, borderRadius: '50%', border: '2px solid white', cursor: 'pointer', padding: 0,
                      background: i === currentSlide ? 'white' : 'transparent', transition: 'background 0.2s',
                    }} />
                ))}
              </div>
            </>
          )}
        </div>
      </section>

      {/* ═══════════ MAIN FOOTER ═══════════ */}
      <footer role="contentinfo" style={{ backgroundColor: '#e6e6e6', padding: '48px 5% 36px', fontSize: '0.9rem', borderTop: '3px solid #006eb3' }}>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 36, maxWidth: 1200, margin: '0 auto' }}
             className="footer-grid-responsive">

          {/* Contact Info */}
          <div>
            <h4 style={{ fontSize: '1rem', marginBottom: 16, textTransform: 'uppercase', fontWeight: 800, color: '#003366', borderBottom: '2px solid #006eb3', paddingBottom: 8 }}>
              CONTACT INFORMATION
            </h4>
            <ul style={{ listStyle: 'none', padding: 0, margin: 0 }}>
              {[
                { icon: 'fab fa-facebook-square', content: <>Facebook: <a href="https://facebook.com" target="_blank" rel="noopener" style={{ color: '#0056b3', textDecoration: 'underline' }}>Barangay Pinyahan</a></> },
                { icon: 'fas fa-envelope',        content: <>Email: <a href="mailto:brgypinyahan@gmail.com" style={{ color: '#0056b3', textDecoration: 'underline' }}>brgypinyahan@gmail.com</a></> },
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
              {[
                { src: '/images/Quezon_City_logo.svg', alt: 'Quezon City Official Seal' },
                { src: '/images/Brgy._Pinyahan_Seal.png', alt: 'Barangay Pinyahan Official Seal' },
              ].map(seal => (
                <img key={seal.alt} src={seal.src} alt={seal.alt}
                  style={{ width: 44, height: 44, objectFit: 'contain', borderRadius: '50%', background: '#fff', padding: 2, boxShadow: '0 1px 4px rgba(0,0,0,0.15)' }} />
              ))}
            </div>
          </div>

          {/* Map */}
          <div>
            <h4 style={{ fontSize: '1rem', marginBottom: 16, textTransform: 'uppercase', fontWeight: 800, color: '#003366', borderBottom: '2px solid #006eb3', paddingBottom: 8 }}>
              MAP LOCATION
            </h4>
            <p style={{ fontSize: '0.85rem', color: '#555', marginBottom: 4 }}>Malakas St, Diliman, Quezon City, Metro Manila</p>
            <iframe
              src="https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d3860.5!2d121.0505!3d14.6477!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x3397b700a30da6d5%3A0x5c8e4b7b!2sMalakas%20St%2C%20Diliman%2C%20Quezon%20City!5e0!3m2!1sen!2sph!4v1711000000000"
              title="Barangay Pinyahan Map Location"
              width="100%" height="160"
              style={{ border: 0, borderRadius: 6, marginTop: 10 }}
              allowFullScreen loading="lazy"
              referrerPolicy="no-referrer-when-downgrade"
            />
          </div>

          {/* Emergency Hotlines */}
          <div>
            <h4 style={{ fontSize: '1rem', marginBottom: 16, textTransform: 'uppercase', fontWeight: 800, color: '#003366', borderBottom: '2px solid #006eb3', paddingBottom: 8 }}>
              EMERGENCY HOTLINES
            </h4>
            <ul style={{ listStyle: 'none', padding: 0, margin: 0 }}>
              {[
                { label: 'National Emergency',        number: '911',          tel: '911' },
                { label: 'Philippine National Police', number: '117',         tel: '117' },
                { label: 'Philippine Red Cross',       number: '143',         tel: '143' },
                { label: 'Bureau of Fire Protection',  number: '(02) 8426-0219', tel: '02-8426-0219' },
                { label: 'DSWD',                       number: '8931-81-08',  tel: '8931-81-08' },
                { label: 'Coast Guard',                number: '8527-3877',   tel: '8527-3877' },
              ].map(h => (
                <li key={h.label} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', minHeight: 44, padding: '6px 0', borderBottom: '1px solid rgba(0,0,0,0.07)', fontSize: '0.86rem', gap: 8 }}>
                  <span style={{ color: '#444', flex: 1 }}>{h.label}</span>
                  <a href={`tel:${h.tel}`} style={{ fontWeight: 700, color: '#cc0000', textDecoration: 'none', whiteSpace: 'nowrap', padding: '4px 8px', borderRadius: 4 }}>
                    {h.number}
                  </a>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </footer>

      {/* ═══════════ GOV FOOTER ═══════════ */}
      <div style={{ backgroundColor: '#003366', color: 'white', padding: 20, textAlign: 'center', borderTop: '4px solid #cc0000' }}>
        <div style={{ marginTop: 10, display: 'flex', justifyContent: 'center', alignItems: 'center', gap: 10 }}>
          <img src="/images/Quezon_City_logo.svg" alt="Quezon City Official Seal" style={{ height: 40, width: 'auto', borderRadius: '50%' }} />
        </div>
        <h4 style={{ fontSize: '0.95rem', margin: '8px 0 4px' }}>REPUBLIC OF THE PHILIPPINES</h4>
        <p style={{ fontSize: '0.78rem', opacity: 0.85 }}>All content is in the public domain unless otherwise stated.</p>
      </div>

      {/* ═══════════ ADMIN SUB-FOOTER ═══════════ */}
      <div style={{
        backgroundColor: '#1a1a2e', display: 'flex', justifyContent: 'space-between',
        alignItems: 'center', padding: '10px 5%', fontSize: '0.78rem', flexWrap: 'wrap', gap: 8,
      }}>
        {/* Admin Login — lower left, beside logout if logged in */}
        <div style={{ display: 'flex', justifyContent: 'flex-start', alignItems: 'center', gap: 16 }}>
          <Link
            href="/login"
            style={{ color: 'rgba(255,255,255,0.55)', textDecoration: 'none', display: 'inline-flex', alignItems: 'center', gap: 5, minHeight: 44, padding: '4px 0', transition: 'color 0.2s' }}
            onMouseEnter={e => e.currentTarget.style.color = 'rgba(255,255,255,0.9)'}
            onMouseLeave={e => e.currentTarget.style.color = 'rgba(255,255,255,0.55)'}
          >
            <i className="fas fa-lock" aria-hidden="true"></i>
            <span>Admin Login</span>
          </Link>
        </div>
        <span style={{ color: 'rgba(255,255,255,0.4)', fontSize: '0.75rem' }}>
          © {new Date().getFullYear()} Barangay Pinyahan. All rights reserved.
        </span>
      </div>

      {/* Shimmer keyframes + responsive helpers */}
      <style>{`
        @keyframes shimmer {
          0%   { background-position: -600px 0; }
          100% { background-position:  600px 0; }
        }
        .event-card:hover .event-card-img   { transform: scale(1.12) !important; }
        .event-card:hover .event-card-overlay { opacity: 1 !important; }
        @media (max-width: 900px) {
          .events-grid-responsive { grid-template-columns: repeat(2,1fr) !important; }
          .footer-grid-responsive { grid-template-columns: 1fr !important; }
        }
        @media (max-width: 500px) {
          .events-grid-responsive { grid-template-columns: 1fr !important; }
        }
      `}</style>
    </div>
  );
}

// ── Reusable empty/error state ────────────────────────────────────
function EmptyState({ icon, title, sub, error }) {
  return (
    <div style={{
      display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
      padding: '50px 20px', textAlign: 'center', background: error ? '#fff8f8' : 'white',
      borderRadius: 10, border: `2px dashed ${error ? '#f5c6cb' : '#c0d6ea'}`, color: '#555', width: '100%',
    }}>
      <i className={`fas ${icon}`} aria-hidden="true" style={{ fontSize: '2.5rem', marginBottom: 14, color: error ? '#e74c3c' : '#a0b8cc' }}></i>
      <p style={{ fontWeight: 700, fontSize: '1rem', marginBottom: 6 }}>{title}</p>
      <p style={{ fontSize: '0.88rem', color: '#888' }}>{sub}</p>
    </div>
  );
}
