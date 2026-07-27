'use client';
import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import PublicShell from '@/components/PublicShell';

function formatDate(str) {
  if (!str) return '';
  return new Date(str).toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' });
}

function getPhotoUrl(url) {
  if (!url) return null;
  return url.startsWith('http') ? url : `${process.env.NEXT_PUBLIC_API_URL}${url}`;
}

export default function EventDetailPage() {
  const { id }   = useParams();
  const router   = useRouter();
  const [event,   setEvent]   = useState(null);
  const [loading, setLoading] = useState(true);
  const [error,   setError]   = useState(false);

  useEffect(() => {
    if (!id) { router.push('/news'); return; }
    fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/admin/events/public/${id}`)
      .then(r => r.ok ? r.json() : Promise.reject())
      .then(d => setEvent(d.event || null))
      .catch(() => setError(true))
      .finally(() => setLoading(false));
  }, [id]);

  const imgSrc = event?.photo_url
    ? getPhotoUrl(event.photo_url)
    : `https://placehold.co/800x350/003366/ffffff?text=${encodeURIComponent(event?.name || 'Event')}`;

  return (
    <PublicShell activeHref="/news">
      {/* Hero */}
      <section
        className="bg-[#003366] bg-cover bg-center bg-no-repeat h-[200px] sm:h-[280px] md:h-[350px] flex items-center justify-center relative overflow-hidden"
        style={{ backgroundImage: "url('/images/newly_elected_officials.jpg')" }}
      >
        <div className="absolute inset-0 bg-[rgba(0,33,71,0.62)] z-[1]" />
        <div className="relative z-[2] px-5 py-3 md:px-8 md:py-4 rounded border-2 border-white/25">
          <h1 className="text-white text-lg sm:text-xl md:text-[2.2rem] font-extrabold uppercase m-0 drop-shadow-lg">BARANGAY NEWS &amp; EVENTS</h1>
        </div>
      </section>

      {/* Advisory Bar */}
      <div className="bg-[#0056b3] text-white w-full py-2.5 mb-5">
        <div className="w-[90%] max-w-[1200px] mx-auto flex flex-col sm:flex-row items-start sm:items-center gap-2 sm:gap-4">
          <span className="bg-[#5dace0] px-2.5 py-0.5 font-bold uppercase text-[0.9rem] shrink-0">EVENT</span>
          <span className="text-xs sm:text-[0.9rem] uppercase tracking-wide">OFFICIAL BARANGAY PINYAHAN COMMUNITY EVENT</span>
        </div>
      </div>

      {/* Event Content */}
      <section className="max-w-[800px] mx-auto px-5 py-8">
        {/* Back Button */}
        <Link href="/news"
          className="inline-flex items-center gap-2 text-[#0056b3] no-underline font-semibold text-[0.9rem] mb-5 px-3.5 py-1.5 border border-[#0056b3] rounded-md hover:bg-[#0056b3] hover:text-white transition-all"
        >
          <i className="fas fa-arrow-left" /> Back to News &amp; Events
        </Link>

        {loading && (
          <div>
            <div className="h-7 animate-shimmer rounded mb-2.5 w-[70%]" />
            <div className="h-[250px] md:h-[350px] animate-shimmer rounded-md" />
          </div>
        )}

        {!loading && (error || !event) && (
          <p className="text-red-700 font-bold text-center mt-10">Unable to load event details.</p>
        )}

        {!loading && event && (
          <>
            {/* Event Badge */}
            <div className="inline-block bg-green-50 text-green-700 px-3.5 py-1 rounded-full font-bold text-[0.8rem] uppercase mb-3 tracking-wide">
              <i className="fas fa-calendar-alt mr-1.5" />Community Event
            </div>

            <h1 className="text-xl md:text-2xl font-extrabold text-gray-800 mb-1.5">
              {event.name}
            </h1>

            <div className="flex flex-wrap gap-4 md:gap-5 mb-5 text-[0.85rem] text-gray-500">
              <span><i className="fas fa-calendar mr-1.5 text-[#0056b3]" />{formatDate(event.date)}</span>
              {event.time && <span><i className="fas fa-clock mr-1.5 text-[#0056b3]" />{event.time}</span>}
              {event.location && <span><i className="fas fa-map-marker-alt mr-1.5 text-[#0056b3]" />{event.location}</span>}
            </div>

            <img src={imgSrc} alt={event.name}
              onError={e => { e.currentTarget.src = `https://placehold.co/800x350/003366/ffffff?text=Event`; }}
              className="w-full max-h-[400px] object-cover rounded-md block mb-6" />

            <div className="text-sm md:text-[0.95rem] text-gray-600 leading-relaxed md:leading-loose text-justify">
              {event.description || 'No description available for this event.'}
            </div>
          </>
        )}
      </section>

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
