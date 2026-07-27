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
      {/* ═══ Main Footer ═══ */}
      <footer role="contentinfo" className="bg-[#e6e6e6] border-t-[3px] border-[#006eb3] pt-12 pb-9 px-[5%] text-sm">
        <div className="max-w-[1200px] mx-auto grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-9">

          {/* ── Contact ── */}
          <div>
            <h4 className="text-base font-extrabold text-[#003366] uppercase border-b-2 border-[#006eb3] pb-2 mb-4">
              CONTACT INFORMATION
            </h4>
            <ul className="space-y-1">
              {[
                { icon: 'fab fa-facebook-square', content: <><span>Facebook:</span> <a href="https://facebook.com" target="_blank" rel="noopener" className="text-[#0056b3] underline hover:text-blue-800">Barangay Pinyahan</a></> },
                { icon: 'fas fa-envelope',        content: <><span>Email:</span> <a href="mailto:brgypinyahan@gmail.com" className="text-[#0056b3] underline hover:text-blue-800">brgypinyahan@gmail.com</a></> },
                { icon: 'fas fa-phone-alt',       content: 'Tel: (02) 1234-5678' },
                { icon: 'fas fa-map-marker-alt',  content: 'Malakas St, Diliman, Quezon City' },
              ].map((item, i) => (
                <li key={i} className="flex items-center gap-2.5 text-[0.88rem] text-gray-700 py-1 min-h-[44px]">
                  <i className={`${item.icon} text-[#006eb3] text-base shrink-0 w-[18px] text-center`} aria-hidden="true" />
                  <span>{item.content}</span>
                </li>
              ))}
            </ul>
            <div className="flex gap-3 mt-4 items-center">
              <img src="/images/Quezon_City_logo.svg" alt="Quezon City Official Seal"
                className="w-11 h-11 object-contain rounded-full bg-white p-0.5 shadow-sm" />
              <img src="/images/brgypinyahanseal.jpg" alt="Barangay Pinyahan Official Seal"
                className="w-11 h-11 object-contain rounded-full bg-white p-0.5 shadow-sm" />
            </div>
          </div>

          {/* ── Map ── */}
          <div>
            <h4 className="text-base font-extrabold text-[#003366] uppercase border-b-2 border-[#006eb3] pb-2 mb-4">
              MAP LOCATION
            </h4>
            <p className="text-[0.85rem] text-gray-600 mb-1">Malakas St, Diliman, Quezon City, Metro Manila</p>
            <iframe
              src="https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d3860.5!2d121.0505!3d14.6477!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x3397b700a30da6d5%3A0x5c8e4b7b!2sMalakas%20St%2C%20Diliman%2C%20Quezon%20City!5e0!3m2!1sen!2sph!4v1711000000000"
              title="Barangay Pinyahan Map Location"
              className="w-full h-40 border-0 rounded-md mt-2.5"
              allowFullScreen loading="lazy" referrerPolicy="no-referrer-when-downgrade"
            />
          </div>

          {/* ── Emergency Hotlines ── */}
          <div>
            <h4 className="text-base font-extrabold text-[#003366] uppercase border-b-2 border-[#006eb3] pb-2 mb-4">
              EMERGENCY HOTLINES
            </h4>
            <ul className="divide-y divide-black/[0.07]">
              {HOTLINES.map(h => (
                <li key={h.label} className="flex justify-between items-center min-h-[44px] py-1.5 text-[0.86rem] gap-2">
                  <span className="text-gray-600 flex-1">{h.label}</span>
                  <a href={`tel:${h.tel}`} className="font-bold text-red-700 no-underline whitespace-nowrap px-2 py-1 rounded hover:bg-red-50 transition-colors">
                    {h.number}
                  </a>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </footer>

      {/* ═══ Government Footer ═══ */}
      <div className="bg-[#003366] text-white py-5 text-center border-t-4 border-red-700">
        <div className="flex justify-center items-center gap-2.5 mt-2.5">
          <img src="/images/Quezon_City_logo.svg" alt="Quezon City Official Seal" className="h-10 w-auto rounded-full" />
        </div>
        <h4 className="text-[0.95rem] mt-2 mb-1 font-bold">REPUBLIC OF THE PHILIPPINES</h4>
        <p className="text-[0.78rem] opacity-85">All content is in the public domain unless otherwise stated.</p>
      </div>

      {/* ═══ Sub-Footer: Admin Login ═══ */}
      <div className="bg-[#1a1a2e] flex flex-wrap justify-between items-center px-[5%] py-2.5 text-[0.78rem] gap-2">
        <Link
          href="/login"
          className="text-white/55 hover:text-white/90 no-underline inline-flex items-center gap-1.5 min-h-[44px] py-1 transition-colors"
        >
          <i className="fas fa-lock" aria-hidden="true" />
          <span>Admin Login</span>
        </Link>
        <span className="text-white/40 text-xs">
          © {new Date().getFullYear()} Barangay Pinyahan. All rights reserved.
        </span>
      </div>
    </>
  );
}

// ─── Shared Shell (header + nav + children + footer) ─────────────
export default function PublicShell({ children, activeHref }) {
  const pathname   = usePathname();
  const [menuOpen, setMenuOpen] = useState(false);
  const active     = activeHref || pathname;

  // Close mobile menu on outside click
  useEffect(() => {
    if (!menuOpen) return;
    const handler = (e) => { if (!e.target.closest('#pub-nav')) setMenuOpen(false); };
    document.addEventListener('click', handler);
    return () => document.removeEventListener('click', handler);
  }, [menuOpen]);

  return (
    <div className="bg-[#f0f0f0] text-gray-700 leading-relaxed" style={{ fontFamily: "'Segoe UI', Tahoma, Geneva, Verdana, sans-serif" }}>

      {/* ═══════════ HEADER ═══════════ */}
      <header className="bg-white py-3 border-b border-gray-300">
        <div className="flex justify-between items-center px-[5%] max-w-[1200px] mx-auto gap-4">
          <img
            src="/images/Quezon_City_logo.svg"
            alt="Quezon City Official Seal"
            className="h-14 sm:h-16 md:h-20 w-auto shrink-0"
          />
          <h1 className="text-[#007bff] text-xl sm:text-2xl md:text-[2.5rem] font-extrabold text-center flex-1 leading-tight m-0">
            Barangay Pinyahan
          </h1>
          <img
            src="/images/brgypinyahanseal.jpg"
            alt="Barangay Pinyahan Official Seal"
            className="h-14 sm:h-16 md:h-20 w-auto shrink-0"
          />
        </div>
      </header>

      {/* ═══════════ NAVIGATION ═══════════ */}
      <nav id="pub-nav" role="navigation" aria-label="Main Navigation" className="bg-[#006eb3] text-white">
        <div className="flex items-center justify-center relative">

          {/* Desktop nav links */}
          <ul className="hidden md:flex justify-center flex-wrap list-none m-0 p-0">
            {NAV_LINKS.map((link, i) => {
              const isActive = link.href === '/' ? active === '/' : active.startsWith(link.href);
              return (
                <li key={link.href} className={i < NAV_LINKS.length - 1 ? 'border-r border-white/30' : ''}>
                  <Link
                    href={link.href}
                    onClick={() => setMenuOpen(false)}
                    className={`block px-4 lg:px-[22px] py-[15px] text-[0.82rem] lg:text-[0.88rem] font-bold uppercase no-underline text-white transition-colors duration-300
                      ${isActive ? 'bg-[#004a80]' : 'hover:bg-[#004a80]'}`}
                  >
                    {link.label}
                  </Link>
                </li>
              );
            })}
          </ul>

          {/* Hamburger button — visible on mobile */}
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

      {/* ═══════════ PAGE CONTENT ═══════════ */}
      {children}

      {/* ═══════════ FOOTER ═══════════ */}
      <PublicFooter />
    </div>
  );
}
