'use client';
import { useState, useEffect, useRef, useCallback } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { PublicFooter } from '@/components/PublicShell';

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
    const apiBase = process.env.NEXT_PUBLIC_API_URL || '';
    fetch(`${apiBase}/api/admin/events/public`)
      .then(r => r.ok ? r.json() : Promise.reject())
      .then(data => setEvents(data.events || []))
      .catch(() => setErrorEvents(true))
      .finally(() => setLoadingEvents(false));
  }, []);

  // ── Fetch News ────────────────────────────────────────────────
  useEffect(() => {
    const apiBase = process.env.NEXT_PUBLIC_API_URL || '';
    fetch(`${apiBase}/api/admin/news/public?limit=10`)
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
    <div className="bg-[#f0f0f0] text-gray-700 leading-relaxed" style={{ fontFamily: "'Segoe UI', Tahoma, Geneva, Verdana, sans-serif" }}>

      {/* ═══════════ HEADER ═══════════ */}
      <header className="bg-white py-3 border-b border-gray-300">
        <div className="flex justify-between items-center px-[5%] max-w-[1200px] mx-auto gap-4">
          <img src="/images/Quezon_City_logo.svg" alt="Quezon City Official Seal"
            className="h-14 sm:h-16 md:h-20 w-auto shrink-0" />
          <h1 className="text-[#007bff] text-xl sm:text-2xl md:text-[2.5rem] font-extrabold text-center flex-1 leading-tight m-0">
            Barangay Pinyahan
          </h1>
          <img src="/images/brgypinyahanseal.jpg" alt="Barangay Pinyahan Official Seal"
            className="h-14 sm:h-16 md:h-20 w-auto shrink-0" />
        </div>
      </header>

      {/* ═══════════ NAVIGATION ═══════════ */}
      <nav id="main-nav" role="navigation" aria-label="Main Navigation" className="bg-[#006eb3] text-white">
        <div className="flex items-center justify-center relative">
          {/* Desktop links */}
          <ul className="hidden md:flex justify-center flex-wrap list-none m-0 p-0">
            {NAV_LINKS.map((link, i) => {
              const active = link.href === '/' ? pathname === '/' : pathname.startsWith(link.href);
              return (
                <li key={link.href} className={i < NAV_LINKS.length - 1 ? 'border-r border-white/30' : ''}>
                  <Link
                    href={link.href}
                    onClick={() => setMenuOpen(false)}
                    className={`block px-4 lg:px-[22px] py-[15px] text-[0.82rem] lg:text-[0.88rem] font-bold uppercase no-underline text-white transition-colors duration-300
                      ${active ? 'bg-[#004a80]' : 'hover:bg-[#004a80]'}`}
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
            className="md:hidden bg-transparent border-0 text-white text-2xl cursor-pointer px-4 py-2.5"
          >
            <i className={`fas ${menuOpen ? 'fa-times' : 'fa-bars'}`} aria-hidden="true" />
          </button>
        </div>

        {/* Mobile dropdown */}
        {menuOpen && (
          <ul className="md:hidden list-none m-0 p-0 border-t border-white/20">
            {NAV_LINKS.map(link => (
              <li key={link.href} className="border-b border-white/10">
                <Link
                  href={link.href}
                  onClick={() => setMenuOpen(false)}
                  className="block px-[5%] py-3.5 text-white no-underline font-bold text-[0.9rem] hover:bg-[#004a80] transition-colors"
                >
                  {link.label}
                </Link>
              </li>
            ))}
          </ul>
        )}
      </nav>

      {/* ═══════════ HERO BANNER ═══════════ */}
      <section aria-label="Banner" className="relative overflow-hidden bg-[#003366]">
        <img
          src="/images/newly_elected_officials.jpg"
          alt="Newly Elected Barangay Pinyahan Officials"
          className="w-full h-auto block object-cover max-h-[520px] min-h-[180px]"
          loading="eager"
        />
        <div aria-hidden="true" className="absolute bottom-0 left-0 right-0 bg-[rgba(0,86,179,0.75)] text-white text-center py-2 text-base md:text-lg font-extrabold tracking-widest uppercase">
          <span>HOME</span>
        </div>
      </section>

      {/* ═══════════ WELCOME ═══════════ */}
      <section className="text-center py-10 md:py-[50px] px-5 max-w-[1000px] mx-auto">
        <h2 className="text-[#0056b3] mb-5 text-xl md:text-[1.8rem] font-extrabold">
          Welcome to the Barangay Pinyahan Official Website!
        </h2>
        <p className="max-w-[800px] mx-auto mb-4 text-sm md:text-base text-gray-600">
          We&apos;re happy to have you here! This space was created to keep our community informed, connected, and involved. Whether you&apos;re looking for the latest announcements, ongoing projects, public services, or ways to participate in our programs, everything you need is just a few clicks away.
        </p>
        <p className="max-w-[800px] mx-auto text-sm md:text-base text-gray-600">
          Our barangay thrives because of the people who call it home—and we hope this website makes it easier for you to stay updated, raise concerns, and engage with us. Thank you for being an important part of our community. Together, let&apos;s continue building a safe, caring, and progressive barangay.
        </p>
      </section>

      {/* ═══════════ EVENTS ═══════════ */}
      <section aria-labelledby="events-heading" className="bg-[#e9ecef] py-10 px-[5%]">
        <h3 id="events-heading" className="text-xl md:text-[1.8rem] font-extrabold text-gray-800 uppercase mb-6">
          EVENTS
        </h3>

        {/* Skeleton */}
        {loadingEvents && (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mt-5">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="rounded-lg h-[180px] animate-shimmer" />
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
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mt-5">
            {events.map(ev => {
              const img = getPhotoUrl(ev.photo_url)
                || `https://placehold.co/300x200/006eb3/ffffff?text=${encodeURIComponent(ev.name)}`;
              return (
                <Link
                  key={ev.id}
                  href={`/events/${ev.id}`}
                  title={ev.name}
                  className="group relative block overflow-hidden rounded-lg shadow-md no-underline text-inherit"
                >
                  <img src={img} alt={ev.name} loading="lazy"
                    className="w-full h-[180px] object-cover block transition-transform duration-300 group-hover:scale-110" />
                  <div className="absolute bottom-0 left-0 right-0 px-3 py-2.5 bg-gradient-to-t from-black/70 to-transparent text-white opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                    <span className="text-[0.85rem] font-bold uppercase tracking-wide">
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
      <section aria-labelledby="news-heading" className="py-10 px-[5%] bg-[#f8f9fa]">
        <h3 id="news-heading" className="text-xl md:text-[1.8rem] font-extrabold text-gray-800 uppercase mb-6">
          NEWS &amp; UPDATES
        </h3>

        <div className="relative max-w-[900px] mx-auto overflow-hidden rounded-xl shadow-lg">

          {/* Skeleton carousel */}
          {loadingNews && (
            <div className="w-full h-[240px] sm:h-[320px] rounded-lg animate-shimmer" />
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
              <div
                className="flex transition-transform duration-500 ease-in-out will-change-transform"
                style={{ transform: `translateX(-${currentSlide * 100}%)` }}
              >
                {news.map(n => {
                  const img = getPhotoUrl(n.photo_url)
                    || `https://placehold.co/900x400/006eb3/ffffff?text=${encodeURIComponent(n.title)}`;
                  return (
                    <Link key={n.id} href={`/news/${n.id}`} title={n.title}
                      className="min-w-full relative block no-underline text-inherit shrink-0 cursor-pointer">
                      <img src={img} alt={n.title} loading="lazy"
                        className="w-full h-[240px] sm:h-[320px] md:h-[400px] object-cover block" />
                      <div className="absolute bottom-0 left-0 right-0 px-5 py-5 bg-gradient-to-t from-black/75 to-transparent text-white">
                        <h4 className="text-base md:text-xl font-bold mb-1">{n.title}</h4>
                        <p className="text-xs md:text-[0.8rem] opacity-85 mb-1.5">{formatDate(n.date_published)}</p>
                        <p className="text-xs md:text-[0.85rem] opacity-90 leading-snug">
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
                className="absolute top-1/2 left-3 -translate-y-1/2 bg-white/90 hover:bg-white border-0 w-10 h-10 rounded-full cursor-pointer text-base text-gray-700 flex items-center justify-center shadow-md z-10 transition-colors"
              >
                <i className="fas fa-chevron-left" aria-hidden="true" />
              </button>
              <button onClick={() => { goToSlide(currentSlide + 1); resetAutoSlide(); }}
                aria-label="Next news"
                className="absolute top-1/2 right-3 -translate-y-1/2 bg-white/90 hover:bg-white border-0 w-10 h-10 rounded-full cursor-pointer text-base text-gray-700 flex items-center justify-center shadow-md z-10 transition-colors"
              >
                <i className="fas fa-chevron-right" aria-hidden="true" />
              </button>

              {/* Dots */}
              <div className="absolute bottom-3 left-1/2 -translate-x-1/2 flex gap-2 z-10">
                {news.map((_, i) => (
                  <button key={i} onClick={() => { goToSlide(i); resetAutoSlide(); }}
                    aria-label={`Go to slide ${i + 1}`}
                    className={`w-2.5 h-2.5 rounded-full border-2 border-white cursor-pointer p-0 transition-colors
                      ${i === currentSlide ? 'bg-white' : 'bg-transparent'}`}
                  />
                ))}
              </div>
            </>
          )}
        </div>
      </section>

      {/* ═══════════ FOOTER (shared component) ═══════════ */}
      <PublicFooter />

      {/* Shimmer animation */}
      <style>{`
        @keyframes shimmer {
          0%   { background-position: -600px 0; }
          100% { background-position:  600px 0; }
        }
        .animate-shimmer {
          background: linear-gradient(90deg, #d0d0d0 25%, #e8e8e8 50%, #d0d0d0 75%);
          background-size: 600px 100%;
          animation: shimmer 1.4s infinite linear;
        }
      `}</style>
    </div>
  );
}

// ── Reusable empty/error state ────────────────────────────────────
function EmptyState({ icon, title, sub, error }) {
  return (
    <div className={`flex flex-col items-center justify-center py-12 px-5 text-center rounded-xl border-2 border-dashed w-full
      ${error ? 'bg-red-50 border-red-200' : 'bg-white border-blue-200'} text-gray-500`}>
      <i className={`fas ${icon} text-[2.5rem] mb-3.5 ${error ? 'text-red-500' : 'text-blue-300'}`} aria-hidden="true" />
      <p className="font-bold text-base mb-1.5">{title}</p>
      <p className="text-[0.88rem] text-gray-400">{sub}</p>
    </div>
  );
}
