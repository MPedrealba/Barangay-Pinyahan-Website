'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import PublicShell from '@/components/PublicShell';
import { apiGet } from '@/lib/api';

function parseArray(value) {
  if (Array.isArray(value)) return value;
  if (typeof value === 'string') {
    try {
      const parsed = JSON.parse(value);
      return Array.isArray(parsed) ? parsed : (value.trim() ? [value] : []);
    } catch {
      return value.trim() ? [value] : [];
    }
  }
  return [];
}

function getServiceIcon(title = '', iconClass = '') {
  if (iconClass && iconClass !== 'fas fa-file-alt') return iconClass;
  const lower = title.toLowerCase();
  if (lower.includes('derogatory')) return 'fas fa-shield-alt';
  if (lower.includes('indigency')) return 'fas fa-file-lines';
  if (lower.includes('residency')) return 'fas fa-house-user';
  if (lower.includes('clearance') || lower.includes('certification')) return 'fas fa-file-invoice';
  if (lower.includes('business') || lower.includes('permit')) return 'fas fa-store';
  if (lower.includes('health') || lower.includes('medical')) return 'fas fa-heart-pulse';
  return 'fas fa-file-alt';
}

function formatStep(text) {
  if (!text) return '';
  return String(text).replace(/^\d+[\.\)\-:]\s*/, '');
}

export default function ServicesPage() {
  const [services, setServices] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeDetail, setActiveDetail] = useState(null);
  const [lastScroll, setLastScroll] = useState(0);

  useEffect(() => {
    let isMounted = true;

    const fetchServices = async () => {
      try {
        const data = await apiGet('/api/services/public');
        const list = Array.isArray(data) ? data : (data?.services || []);
        if (isMounted) {
          // Strictly filter out any service that is not Active
          const activeOnly = list.filter(
            (s) => (s.status || '').toLowerCase().trim() === 'active'
          );
          const mapped = activeOnly.map((s) => ({
            id: s.id,
            key: s.id,
            title: s.name || s.title || 'Barangay Service',
            icon: getServiceIcon(s.name || s.title, s.icon_class),
            description: s.description || '',
            requirements: parseArray(s.requirements),
            procedure: parseArray(s.procedures || s.procedure || s.steps),
            status: s.status || 'Active',
          }));
          setServices(mapped);

          // If the currently viewed detail is now inactive, close the detail view
          setActiveDetail((curr) =>
            curr && !activeOnly.some((s) => String(s.id) === String(curr.id || curr.key))
              ? null
              : curr
          );
        }
      } catch (err) {
        console.error('Failed to load services from API:', err);
      } finally {
        if (isMounted) setLoading(false);
      }
    };

    fetchServices();

    return () => {
      isMounted = false;
    };
  }, []);

  // Handle URL query parameter linking (e.g. /services?id=30001)
  useEffect(() => {
    if (services.length > 0 && !activeDetail && typeof window !== 'undefined') {
      const params = new URLSearchParams(window.location.search);
      const targetId = params.get('id');
      const targetKey = params.get('service');
      if (targetId || targetKey) {
        const match = services.find(
          (s) =>
            (targetId && String(s.id) === String(targetId)) ||
            (targetKey && String(s.key).toLowerCase() === String(targetKey).toLowerCase())
        );
        if (match) {
          showDetail(match);
        }
      }
    }
  }, [services]);

  const showDetail = (card) => {
    setLastScroll(window.scrollY);
    setActiveDetail(card);
    window.scrollTo({ top: 0, behavior: 'instant' });
  };

  const showListing = () => {
    setActiveDetail(null);
    setTimeout(() => window.scrollTo({ top: lastScroll, behavior: 'instant' }), 10);
  };

  const otherCards = activeDetail
    ? services.filter((c) => String(c.id || c.key) !== String(activeDetail.id || activeDetail.key))
    : [];

  return (
    <PublicShell activeHref="/services">
      {/* ═══════════ LISTING VIEW ═══════════ */}
      {!activeDetail && (
        <>
          {/* Hero */}
          <section
            className="bg-cover bg-center h-[200px] sm:h-[280px] md:h-[350px] flex items-center justify-center relative px-[5%]"
            style={{
              backgroundImage: "linear-gradient(rgba(0, 40, 85, 0.72), rgba(0, 40, 85, 0.72)), url('/images/barangay-hall-pinyahan.jpg')"
            }}
          >
            <div className="bg-[rgba(0,51,102,0.65)] px-6 py-4 md:px-10 md:py-5 rounded-xl text-center mx-auto backdrop-blur-xs border border-white/20 shadow-2xl">
              <h1 className="text-white text-xl sm:text-2xl md:text-[2.5rem] font-extrabold uppercase text-center drop-shadow-lg m-0 tracking-wider">
                BARANGAY COMMUNITY SERVICES
              </h1>
              <p className="text-blue-100 text-xs sm:text-sm mt-2 font-medium tracking-wide">
                Official documents, permits, and citizen services of Barangay Pinyahan
              </p>
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
              <div className="flex items-center gap-3 shrink-0 flex-wrap sm:flex-nowrap">
                <Link
                  href="/services/request"
                  className="bg-white text-[#1565c0] px-6 py-3 rounded-full font-extrabold text-[0.92rem] no-underline flex items-center gap-2 whitespace-nowrap shadow-lg hover:bg-gray-50 transition-colors shrink-0"
                >
                  <i className="fas fa-file-alt" /> Request a Service
                </Link>
                <Link
                  href="/track-service-request"
                  className="bg-white/15 hover:bg-white/25 text-white border border-white/40 px-5 py-3 rounded-full font-extrabold text-[0.92rem] no-underline flex items-center gap-2 whitespace-nowrap transition-colors shrink-0 backdrop-blur-sm"
                >
                  <i className="fas fa-search" /> Track Request
                </Link>
              </div>
            </div>
          </section>

          {/* Service Listing */}
          <section className="w-[90%] max-w-[1200px] mx-auto py-8 md:py-12">
            <h3 className="text-xl md:text-[1.8rem] font-extrabold text-gray-800 uppercase mb-6 text-center tracking-wide">
              SERVICE LISTING
            </h3>

            {loading ? (
              <div className="py-20 flex flex-col items-center justify-center text-gray-400 gap-3">
                <i className="fas fa-spinner fa-spin text-3xl text-[#006eb3]" />
                <span className="text-sm font-semibold">Loading barangay services...</span>
              </div>
            ) : services.length === 0 ? (
              <div className="text-center py-16 text-gray-500 font-medium">
                No active services available at this time.
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mt-10">
                {services.map((card) => (
                  <ServiceCard
                    key={card.id || card.key}
                    card={card}
                    onLearnMore={() => showDetail(card)}
                  />
                ))}
              </div>
            )}
          </section>
        </>
      )}

      {/* ═══════════ DETAIL VIEW ═══════════ */}
      {activeDetail && (
        <>
          {/* Title Banner */}
          <div className="w-[90%] max-w-[1200px] mx-auto mt-8">
            <div className="bg-[#006eb3] text-white px-5 py-4 border-[3px] border-[#003d80] rounded-xl w-full flex items-center justify-between shadow-lg">
              <button
                type="button"
                onClick={showListing}
                className="text-white text-2xl font-bold bg-white/15 hover:bg-white/30 rounded-lg px-4 py-1.5 shrink-0 cursor-pointer border-0 transition-colors flex items-center justify-center"
                title="Back to services listing"
              >
                &#8592;
              </button>
              <h2 className="flex-1 text-center text-lg sm:text-xl md:text-[1.8rem] font-extrabold uppercase m-0 tracking-wider text-white px-3">
                {activeDetail.title}
              </h2>
              <span className="invisible text-2xl font-bold px-4 py-1.5 shrink-0">&#8592;</span>
            </div>
          </div>

          {/* Process Section — Side by Side */}
          <section className="w-[90%] max-w-[1200px] mx-auto pt-9 pb-9">
            <h3 className="text-xl md:text-2xl font-extrabold text-gray-800 uppercase mb-6 tracking-wide">PROCESS</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-7">
              {/* Requirements */}
              <div className="border-2 border-[#006eb3] rounded-xl p-6 md:p-8 bg-white min-h-[260px] shadow-sm">
                <h4 className="text-[1.05rem] font-extrabold text-[#006eb3] uppercase mb-4 tracking-wide border-b-2 border-blue-100 pb-2.5">
                  REQUIREMENTS:
                </h4>
                {activeDetail.requirements && activeDetail.requirements.length > 0 ? (
                  <ul className="list-disc pl-5 text-gray-600 space-y-3 text-sm md:text-base leading-relaxed">
                    {activeDetail.requirements.map((r, i) => (
                      <li key={i}>{r}</li>
                    ))}
                  </ul>
                ) : (
                  <p className="text-sm text-gray-400 italic">No specific requirements listed.</p>
                )}
              </div>

              {/* Procedure */}
              <div className="border-2 border-[#006eb3] rounded-xl p-6 md:p-8 bg-white min-h-[260px] shadow-sm">
                <h4 className="text-[1.05rem] font-extrabold text-[#006eb3] uppercase mb-4 tracking-wide border-b-2 border-blue-100 pb-2.5">
                  PROCEDURE:
                </h4>
                {activeDetail.procedure && activeDetail.procedure.length > 0 ? (
                  <ol className="list-decimal pl-5 text-gray-600 space-y-3 text-sm md:text-base leading-relaxed">
                    {activeDetail.procedure.map((p, i) => (
                      <li key={i}>{formatStep(p)}</li>
                    ))}
                  </ol>
                ) : (
                  <p className="text-sm text-gray-400 italic">No specific procedure listed.</p>
                )}
              </div>
            </div>

            {/* Request CTA inside detail */}
            <div className="mt-8 flex justify-center">
              <Link
                href="/services/request"
                className="bg-[#1565c0] hover:bg-[#0d47a1] text-white px-8 py-3.5 rounded-full font-extrabold text-[0.95rem] no-underline flex items-center gap-2.5 shadow-md transition-colors"
              >
                <i className="fas fa-paper-plane" /> Request This Document Online
              </Link>
            </div>
          </section>

          {/* Other Services */}
          {otherCards.length > 0 && (
            <section className="w-[90%] max-w-[1200px] mx-auto pt-2.5 pb-12">
              <h3 className="text-lg md:text-xl font-extrabold text-gray-800 uppercase mb-6 tracking-wide">OTHER SERVICES:</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 w-full">
                {otherCards.map((card) => (
                  <ServiceCard
                    key={card.id || card.key}
                    card={card}
                    compact
                    onLearnMore={() => showDetail(card)}
                  />
                ))}
              </div>
            </section>
          )}
        </>
      )}
    </PublicShell>
  );
}

// ── Service Card Component ────────────────────────────────────────────────────
function ServiceCard({ card, onLearnMore, compact }) {
  return (
    <div className="bg-white rounded-2xl shadow-md p-6 md:p-8 flex items-center gap-5 md:gap-6 transition-transform duration-300 hover:-translate-y-1.5 hover:shadow-lg">
      <div className="text-5xl md:text-[3.5rem] text-[#006eb3] min-w-[70px] text-center shrink-0">
        <i className={card.icon || 'fas fa-file-invoice'} aria-hidden="true" />
      </div>
      <div className="flex-1 flex flex-col gap-3 md:gap-4 min-w-0">
        <h4 className="text-base md:text-xl font-bold text-gray-800 m-0">{card.title}</h4>
        {card.description && !compact && (
          <p className="text-[0.88rem] text-gray-500 m-0 leading-snug line-clamp-3">{card.description}</p>
        )}
        <button
          type="button"
          onClick={onLearnMore}
          className="inline-block bg-[#006eb3] hover:bg-[#004a80] text-white px-5 md:px-6 py-2.5 rounded-md font-bold text-[0.9rem] text-center self-start whitespace-nowrap no-underline transition-colors cursor-pointer border-0 shadow-sm"
        >
          LEARN MORE
        </button>
      </div>
    </div>
  );
}
