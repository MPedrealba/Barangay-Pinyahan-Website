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
    fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/admin/services/public`)
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
        <div className="w-[90%] max-w-[1200px] mx-auto my-16 text-center text-gray-400">
          <i className="fas fa-spinner fa-spin text-3xl block mb-3" />
          Loading service details…
        </div>
      </PublicShell>
    );
  }

  // ── Not found ─────────────────────────────────────────────────
  if (notFound || !service) {
    return (
      <PublicShell activeHref="/services">
        <div className="w-[90%] max-w-[1200px] mx-auto my-16 text-center text-gray-400">
          <i className="fas fa-exclamation-circle text-5xl text-gray-300 block mb-4" />
          <h2 className="font-extrabold text-gray-800">Service Not Found</h2>
          <p className="mt-2">The service you are looking for does not exist or is no longer active.</p>
          <Link href="/services" className="inline-block mt-5 bg-[#006eb3] hover:bg-[#004a80] text-white px-7 py-2.5 rounded-md font-bold no-underline transition-colors">
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
      <div className="w-[90%] max-w-[1200px] mx-auto mt-8">
        <div className="bg-[#006eb3] text-white px-5 py-4 border-[3px] border-[#003d80] rounded-md w-full flex items-center justify-between shadow-lg">
          <Link href="/services"
            className="text-white text-2xl font-bold bg-white/15 hover:bg-white/30 rounded-lg px-4 py-1.5 shrink-0 no-underline transition-colors flex items-center justify-center"
          >
            &#8592;
          </Link>
          <h1 className="flex-1 text-center text-lg sm:text-xl md:text-[1.8rem] font-extrabold uppercase m-0 tracking-wider text-white px-3">
            {service.name}
          </h1>
          {/* Invisible spacer keeps title centred */}
          <span className="invisible text-2xl font-bold px-4 py-1.5 shrink-0">&#8592;</span>
        </div>
      </div>

      {/* ── Description (if any) ──────────────────────────────────── */}
      {service.description && (
        <div className="w-[90%] max-w-[1200px] mx-auto mt-5">
          <p className="text-gray-500 text-sm md:text-base leading-relaxed">{service.description}</p>
        </div>
      )}

      {/* ── Process Section ───────────────────────────────────────── */}
      <section className="w-[90%] max-w-[1200px] mx-auto pt-8 pb-9">
        <h2 className="text-xl md:text-2xl font-extrabold text-gray-800 uppercase mb-6 tracking-wide">
          PROCESS
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-7">
          {/* Requirements */}
          <div className="border-2 border-[#006eb3] rounded-xl p-6 md:p-8 bg-white min-h-[260px] shadow-sm">
            <h3 className="text-[1.05rem] font-extrabold text-[#006eb3] uppercase mb-4 tracking-wide border-b-2 border-blue-100 pb-2.5">
              REQUIREMENTS:
            </h3>
            {requirements.length > 0 ? (
              <ul className="list-disc pl-5 text-gray-600 space-y-3 text-sm md:text-base leading-relaxed">
                {requirements.map((r, i) => (
                  <li key={i}>{r}</li>
                ))}
              </ul>
            ) : (
              <p className="text-gray-400 text-[0.9rem]">Please visit the Barangay Hall for requirements.</p>
            )}
          </div>

          {/* Procedure */}
          <div className="border-2 border-[#006eb3] rounded-xl p-6 md:p-8 bg-white min-h-[260px] shadow-sm">
            <h3 className="text-[1.05rem] font-extrabold text-[#006eb3] uppercase mb-4 tracking-wide border-b-2 border-blue-100 pb-2.5">
              PROCEDURE:
            </h3>
            {procedures.length > 0 ? (
              <ol className="list-decimal pl-5 text-gray-600 space-y-3 text-sm md:text-base leading-relaxed">
                {procedures.map((p, i) => (
                  <li key={i}>{p}</li>
                ))}
              </ol>
            ) : (
              <p className="text-gray-400 text-[0.9rem]">Please visit the Barangay Hall for procedures.</p>
            )}
          </div>
        </div>
      </section>

      {/* ── Other Services ─────────────────────────────────────────── */}
      {others.length > 0 && (
        <section className="w-[90%] max-w-[1200px] mx-auto pt-2.5 pb-12">
          <h2 className="text-lg md:text-xl font-extrabold text-gray-800 uppercase mb-6 tracking-wide">
            OTHER SERVICES:
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {others.map(svc => (
              <div key={svc.id}
                className="bg-white rounded-2xl shadow-md p-6 md:p-8 flex items-center gap-5 md:gap-6 transition-transform duration-300 hover:-translate-y-1.5 hover:shadow-lg"
              >
                <div className="text-4xl md:text-5xl text-[#006eb3] min-w-[60px] text-center shrink-0">
                  <i className={getIcon(svc.name, svc.icon_class)} aria-hidden="true" />
                </div>
                <div className="flex-1 flex flex-col gap-3 min-w-0">
                  <h4 className="text-base md:text-lg font-bold text-gray-800 m-0">{svc.name}</h4>
                  <Link href={`/services/${svc.id}`}
                    className="inline-block bg-[#006eb3] hover:bg-[#004a80] text-white px-5 md:px-6 py-2.5 rounded-md font-bold text-[0.9rem] self-start whitespace-nowrap no-underline transition-colors"
                  >
                    LEARN MORE
                  </Link>
                </div>
              </div>
            ))}
          </div>
        </section>
      )}
    </PublicShell>
  );
}
