'use client';
import { useState, useEffect } from 'react';
import Link from 'next/link';
import PublicShell from '@/components/PublicShell';

function getPhotoUrl(url) {
  if (!url) return null;
  return url.startsWith('http') ? url : `${process.env.NEXT_PUBLIC_API_URL}${url}`;
}

function formatDate(str) {
  if (!str) return '';
  return new Date(str).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' });
}

function formatEventDate(str) {
  if (!str) return '';
  return new Date(str).toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric', year: 'numeric' });
}

export default function NewsPage() {
  const [featured,      setFeatured]      = useState(null);
  const [newsList,      setNewsList]      = useState([]);
  const [eventsList,    setEventsList]    = useState([]);
  const [loadFeatured,  setLoadFeatured]  = useState(true);
  const [loadList,      setLoadList]      = useState(true);
  const [loadEvents,    setLoadEvents]    = useState(true);

  useEffect(() => {
    // Featured news
    fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/admin/news/featured`)
      .then(r => r.ok ? r.json() : { news: null })
      .then(d => setFeatured(d.news || null))
      .catch(() => setFeatured(null))
      .finally(() => setLoadFeatured(false));

    // Post listing
    fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/admin/news/public?limit=6`)
      .then(r => r.ok ? r.json() : { news: [] })
      .then(d => setNewsList(d.news || []))
      .catch(() => setNewsList([]))
      .finally(() => setLoadList(false));

    // Events
    fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/admin/events/public`)
      .then(r => r.ok ? r.json() : { events: [] })
      .then(d => setEventsList(d.events || []))
      .catch(() => setEventsList([]))
      .finally(() => setLoadEvents(false));
  }, []);

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
          <span className="bg-[#5dace0] px-2.5 py-0.5 font-bold uppercase text-[0.9rem] shrink-0">ADVISORY</span>
          <span className="text-xs sm:text-[0.9rem] uppercase tracking-wide">ALL UPDATES ON THIS PAGE ARE OFFICIAL NOTICES FROM BARANGAY PINYAHAN</span>
        </div>
      </div>

      {/* Featured Post */}
      {(loadFeatured || featured) && (
        <section className="w-[90%] max-w-[1200px] mx-auto py-5">
          <h3 className="text-xl md:text-[1.8rem] font-extrabold text-gray-800 uppercase mb-6">FEATURED POST</h3>
          {loadFeatured ? (
            <div className="h-[200px] md:h-[280px] rounded animate-shimmer" />
          ) : featured ? (
            <div className="bg-[#cfd8dc] flex flex-col md:flex-row mb-12 rounded-lg overflow-hidden">
              <div className="flex-1">
                <img src={getPhotoUrl(featured.photo_url) || 'https://placehold.co/600x400?text=No+Image'} alt={featured.title}
                  className="w-full h-[200px] md:h-full object-cover block" />
              </div>
              <div className="flex-[1.5] p-6 md:p-10 flex flex-col justify-center">
                <h2 className="text-lg md:text-[1.8rem] font-extrabold mb-2.5 uppercase leading-tight">
                  {featured.title} ({formatDate(featured.date_published)})
                </h2>
                <p className="text-sm md:text-lg mb-6">
                  {featured.description ? featured.description.substring(0, 200) + '…' : ''}
                </p>
                <Link href={`/news/${featured.id}`}
                  className="bg-[#004a80] hover:bg-[#003366] text-white px-5 py-2.5 no-underline font-bold inline-block w-fit rounded transition-colors">
                  Read more
                </Link>
              </div>
            </div>
          ) : null}
        </section>
      )}

      {/* ── UPCOMING EVENTS ──────────────────────────────────────── */}
      <section className="w-[90%] max-w-[1200px] mx-auto py-2.5 pb-10">
        <h3 className="text-xl md:text-[1.8rem] font-extrabold text-gray-800 uppercase mb-6">
          <i className="fas fa-calendar-alt mr-2.5 text-[#0056b3]" />UPCOMING EVENTS
        </h3>
        {loadEvents ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {[...Array(3)].map((_, i) => (
              <div key={i} className="h-[260px] rounded-lg animate-shimmer" />
            ))}
          </div>
        ) : eventsList.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {eventsList.map(ev => {
              const evImg = getPhotoUrl(ev.photo_url) || `https://placehold.co/400x200/003366/ffffff?text=${encodeURIComponent(ev.name || 'Event')}`;
              const eventDate = ev.date ? new Date(ev.date) : null;
              return (
                <Link href={`/events/${ev.id}`} key={ev.id} className="no-underline text-inherit">
                  <div className="rounded-lg overflow-hidden bg-[#f5f7fa] shadow-sm hover:-translate-y-1 hover:shadow-lg transition-all duration-200 cursor-pointer">
                    {/* Event Image */}
                    <div className="relative h-[160px] overflow-hidden">
                      <img src={evImg} alt={ev.name}
                        onError={e => { e.currentTarget.src = `https://placehold.co/400x200/003366/ffffff?text=Event`; }}
                        className="w-full h-full object-cover" />
                      {/* Date badge overlay */}
                      {eventDate && (
                        <div className="absolute top-2.5 right-2.5 bg-[#0056b3] text-white rounded-md px-2.5 py-1.5 text-center leading-none shadow-md">
                          <div className="text-xl font-extrabold">{eventDate.getDate()}</div>
                          <div className="text-[0.65rem] font-semibold uppercase">
                            {eventDate.toLocaleDateString('en-US', { month: 'short' })}
                          </div>
                        </div>
                      )}
                    </div>
                    {/* Event Info */}
                    <div className="px-4 py-3.5">
                      <h4 className="font-extrabold text-base uppercase mb-1.5 text-gray-800">{ev.name}</h4>
                      <p className="text-[0.8rem] text-gray-500 mb-1">
                        <i className="fas fa-calendar mr-1.5 text-[#0056b3] text-xs" />{formatEventDate(ev.date)}
                      </p>
                      {ev.location && (
                        <p className="text-[0.8rem] text-gray-500 m-0">
                          <i className="fas fa-map-marker-alt mr-1.5 text-[#0056b3] text-xs" />{ev.location}
                        </p>
                      )}
                    </div>
                  </div>
                </Link>
              );
            })}
          </div>
        ) : (
          <p className="text-gray-400 text-center">No upcoming events at this time.</p>
        )}
      </section>

      {/* ── POST LISTING (News) ──────────────────────────────────── */}
      <section className="w-[90%] max-w-[1200px] mx-auto pb-10">
        <h3 className="text-xl md:text-[1.8rem] font-extrabold text-gray-800 uppercase mb-6">
          <i className="fas fa-newspaper mr-2.5 text-[#0056b3]" />POST LISTING
        </h3>
        {loadList ? (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="h-[100px] rounded animate-shimmer" />
            ))}
          </div>
        ) : newsList.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            {newsList.map(n => {
              const imgSrc = getPhotoUrl(n.photo_url) || `https://placehold.co/150x150/006eb3/ffffff?text=No+Image`;
              return (
                <div key={n.id} className="bg-[#cfd8dc] flex items-center p-4 gap-4 md:gap-5 rounded-lg">
                  <img src={imgSrc} alt={n.title} onError={e => { e.currentTarget.src = 'https://placehold.co/150x150/cccccc/666666?text=Error'; }}
                    className="w-20 h-16 md:w-[120px] md:h-[90px] object-cover shrink-0 rounded" />
                  <div className="min-w-0">
                    <h4 className="font-extrabold uppercase text-sm md:text-lg mb-1 truncate">{n.title}</h4>
                    <p className="text-[0.9rem] mb-1 text-gray-600 line-clamp-2">{n.description ? n.description.substring(0, 60) + '…' : ''}</p>
                    <Link href={`/news/${n.id}`} className="text-[#0056b3] font-bold text-[0.9rem] underline">Read more &gt;&gt;</Link>
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          <p className="text-gray-400 text-center">No news articles yet.</p>
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
