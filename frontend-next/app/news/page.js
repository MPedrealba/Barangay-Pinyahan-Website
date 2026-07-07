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

export default function NewsPage() {
  const [featured,      setFeatured]      = useState(null);
  const [newsList,      setNewsList]      = useState([]);
  const [loadFeatured,  setLoadFeatured]  = useState(true);
  const [loadList,      setLoadList]      = useState(true);

  useEffect(() => {
    // Featured
    fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/admin/news/featured`))
      .then(r => r.ok ? r.json() : { news: null })
      .then(d => setFeatured(d.news || null))
      .catch(() => setFeatured(null))
      .finally(() => setLoadFeatured(false));

    // Post listing
    fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/admin/news/public?limit=6`))
      .then(r => r.ok ? r.json() : { news: [] })
      .then(d => setNewsList(d.news || []))
      .catch(() => setNewsList([]))
      .finally(() => setLoadList(false));
  }, []);

  return (
    <PublicShell activeHref="/news">
      {/* Hero */}
      <section style={{ backgroundColor: '#003366', backgroundImage: "url('/images/newly_elected_officials.jpg')", backgroundSize: 'cover', backgroundPosition: 'center top', height: 350, display: 'flex', alignItems: 'center', justifyContent: 'center', position: 'relative', overflow: 'hidden' }}>
        <div style={{ position: 'absolute', inset: 0, background: 'rgba(0,33,71,0.62)', zIndex: 1 }}></div>
        <div style={{ position: 'relative', zIndex: 2, padding: '15px 30px', borderRadius: 4, border: '2px solid rgba(255,255,255,0.25)' }}>
          <h1 style={{ color: 'white', fontSize: '2.2rem', fontWeight: 800, textTransform: 'uppercase', margin: 0, textShadow: '0 2px 8px rgba(0,0,0,0.5)' }}>BARANGAY NEWS &amp; EVENTS</h1>
        </div>
      </section>

      {/* Advisory Bar */}
      <div style={{ backgroundColor: '#0056b3', color: 'white', width: '100%', padding: '10px 0', marginBottom: 20 }}>
        <div style={{ width: '90%', maxWidth: 1200, margin: '0 auto', display: 'flex', alignItems: 'center', gap: 15 }}>
          <span style={{ backgroundColor: '#5dace0', padding: '2px 10px', fontWeight: 'bold', textTransform: 'uppercase', fontSize: '0.9rem' }}>ADVISORY</span>
          <span style={{ fontSize: '0.9rem', textTransform: 'uppercase', letterSpacing: '0.5px' }}>ALL UPDATES ON THIS PAGE ARE OFFICIAL NOTICES FROM BARANGAY PINYAHAN</span>
        </div>
      </div>

      {/* Featured Post */}
      {(loadFeatured || featured) && (
        <section style={{ width: '90%', maxWidth: 1200, margin: '0 auto 0', padding: '20px 0' }}>
          <h3 style={{ fontSize: '1.8rem', fontWeight: 800, color: '#333', textTransform: 'uppercase', marginBottom: 25 }}>FEATURED POST</h3>
          {loadFeatured ? (
            <div style={{ backgroundColor: '#cfd8dc', height: 280, borderRadius: 4, animation: 'shimmer 1.4s infinite linear', background: 'linear-gradient(90deg,#d0d0d0 25%,#e8e8e8 50%,#d0d0d0 75%)', backgroundSize: '600px 100%' }} />
          ) : featured ? (
            <div style={{ backgroundColor: '#cfd8dc', display: 'flex', marginBottom: 50 }} className="featured-card-resp">
              <div style={{ flex: 1 }}>
                <img src={getPhotoUrl(featured.photo_url) || 'https://placehold.co/600x400?text=No+Image'} alt={featured.title}
                  style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }} />
              </div>
              <div style={{ flex: 1.5, padding: 40, display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
                <h2 style={{ fontSize: '1.8rem', fontWeight: 800, marginBottom: 10, textTransform: 'uppercase' }}>
                  {featured.title} ({formatDate(featured.date_published)})
                </h2>
                <p style={{ fontSize: '1.1rem', marginBottom: 25 }}>
                  {featured.description ? featured.description.substring(0, 200) + '…' : ''}
                </p>
                <Link href={`/news/${featured.id}`}
                  style={{ backgroundColor: '#004a80', color: 'white', padding: '10px 20px', textDecoration: 'none', fontWeight: 'bold', display: 'inline-block', width: 'fit-content', borderRadius: 4 }}>
                  Read more
                </Link>
              </div>
            </div>
          ) : null}
        </section>
      )}

      {/* Post Listing */}
      <section style={{ width: '90%', maxWidth: 1200, margin: '0 auto', padding: '0 0 40px' }}>
        <h3 style={{ fontSize: '1.8rem', fontWeight: 800, color: '#333', textTransform: 'uppercase', marginBottom: 25 }}>POST LISTING</h3>
        {loadList ? (
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20 }}>
            {[...Array(4)].map((_, i) => (
              <div key={i} style={{ height: 100, borderRadius: 4, background: 'linear-gradient(90deg,#d0d0d0 25%,#e8e8e8 50%,#d0d0d0 75%)', backgroundSize: '600px 100%', animation: 'shimmer 1.4s infinite linear' }} />
            ))}
          </div>
        ) : newsList.length > 0 ? (
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20 }} className="news-grid-resp">
            {newsList.map(n => {
              const imgSrc = getPhotoUrl(n.photo_url) || `https://placehold.co/150x150/006eb3/ffffff?text=No+Image`;
              return (
                <div key={n.id} style={{ backgroundColor: '#cfd8dc', display: 'flex', alignItems: 'center', padding: 15, gap: 20 }}>
                  <img src={imgSrc} alt={n.title} onError={e => { e.currentTarget.src = 'https://placehold.co/150x150/cccccc/666666?text=Error'; }}
                    style={{ width: 120, height: 90, objectFit: 'cover', flexShrink: 0 }} />
                  <div>
                    <h4 style={{ fontWeight: 800, textTransform: 'uppercase', fontSize: '1.1rem', marginBottom: 5 }}>{n.title}</h4>
                    <p style={{ fontSize: '0.9rem', marginBottom: 5, color: '#444' }}>{n.description ? n.description.substring(0, 60) + '…' : ''}</p>
                    <Link href={`/news/${n.id}`} style={{ color: '#0056b3', fontWeight: 'bold', fontSize: '0.9rem', textDecoration: 'underline' }}>Read more &gt;&gt;</Link>
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          <p style={{ color: '#888', textAlign: 'center' }}>No news articles yet.</p>
        )}
      </section>

      <style>{`
        @keyframes shimmer { 0% { background-position: -600px 0; } 100% { background-position: 600px 0; } }
        @media (max-width: 768px) { .featured-card-resp { flex-direction: column !important; } .news-grid-resp { grid-template-columns: 1fr !important; } }
      `}</style>
    </PublicShell>
  );
}
