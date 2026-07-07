'use client';
import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import PublicShell from '@/components/PublicShell';

function formatDate(str) {
  if (!str) return '';
  return new Date(str).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' });
}

export default function NewsDetailPage() {
  const { id }    = useParams();
  const router    = useRouter();
  const [article, setArticle] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error,   setError]   = useState(false);

  useEffect(() => {
    if (!id) { router.push('/news'); return; }
    fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/admin/news/public/${id}`)
      .then(r => r.ok ? r.json() : Promise.reject())
      .then(d => setArticle(d.news || null))
      .catch(() => setError(true))
      .finally(() => setLoading(false));
  }, [id]);

  const imgSrc = article?.photo_url
    ? (article.photo_url.startsWith('http') ? article.photo_url : `${process.env.NEXT_PUBLIC_API_URL}${article.photo_url}`)
    : `https://placehold.co/800x350?text=${encodeURIComponent(article?.title || 'News')}`;

  return (
    <PublicShell activeHref="/news">
      {/* Hero */}
      <section style={{ backgroundColor: '#003366', backgroundImage: "url('/images/newly_elected_officials.jpg')", backgroundSize: 'cover', backgroundPosition: 'center top', height: 350, display: 'flex', alignItems: 'center', justifyContent: 'center', position: 'relative', overflow: 'hidden' }}>
        <div style={{ position: 'absolute', inset: 0, background: 'rgba(0,33,71,0.62)', zIndex: 1 }}></div>
        <div style={{ position: 'relative', zIndex: 2, padding: '15px 30px', borderRadius: 4, border: '2px solid rgba(255,255,255,0.25)' }}>
          <h1 style={{ color: 'white', fontSize: '2.2rem', fontWeight: 800, textTransform: 'uppercase', margin: 0, textShadow: '0 2px 8px rgba(0,0,0,0.5)' }}>BARANGAY NEWS AND UPDATES</h1>
        </div>
      </section>

      {/* Advisory Bar */}
      <div style={{ backgroundColor: '#0056b3', color: 'white', width: '100%', padding: '10px 0', marginBottom: 20 }}>
        <div style={{ width: '90%', maxWidth: 1200, margin: '0 auto', display: 'flex', alignItems: 'center', gap: 15 }}>
          <span style={{ backgroundColor: '#5dace0', padding: '2px 10px', fontWeight: 'bold', textTransform: 'uppercase', fontSize: '0.9rem' }}>ADVISORY</span>
          <span style={{ fontSize: '0.9rem', textTransform: 'uppercase', letterSpacing: '0.5px' }}>ALL UPDATES ON THIS PAGE ARE OFFICIAL NOTICES FROM BARANGAY PINYAHAN</span>
        </div>
      </div>

      {/* Article Content */}
      <section style={{ maxWidth: 800, margin: '0 auto', padding: '30px 20px' }}>
        {/* Back Button */}
        <Link href="/news"
          style={{ display: 'inline-flex', alignItems: 'center', gap: 8, color: '#0056b3', textDecoration: 'none', fontWeight: 600, fontSize: '0.9rem', marginBottom: 20, padding: '6px 14px', border: '1px solid #0056b3', borderRadius: 5, transition: 'all 0.2s' }}
          onMouseEnter={e => { e.currentTarget.style.background = '#0056b3'; e.currentTarget.style.color = 'white'; }}
          onMouseLeave={e => { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.color = '#0056b3'; }}>
          <i className="fas fa-arrow-left"></i> Back to News &amp; Events
        </Link>

        {loading && (
          <div>
            <div style={{ height: 28, background: 'linear-gradient(90deg,#d0d0d0 25%,#e8e8e8 50%,#d0d0d0 75%)', backgroundSize: '600px 100%', animation: 'shimmer 1.4s infinite linear', borderRadius: 4, marginBottom: 10, width: '70%' }} />
            <div style={{ height: 350, background: 'linear-gradient(90deg,#d0d0d0 25%,#e8e8e8 50%,#d0d0d0 75%)', backgroundSize: '600px 100%', animation: 'shimmer 1.4s infinite linear', borderRadius: 6 }} />
          </div>
        )}

        {!loading && (error || !article) && (
          <p style={{ color: '#c62828', fontWeight: 700, textAlign: 'center', marginTop: 40 }}>Unable to load news article.</p>
        )}

        {!loading && article && (
          <>
            <h1 style={{ fontSize: '1.4rem', fontWeight: 800, color: '#333', textDecoration: 'underline', marginBottom: 5 }}>
              {article.title}
            </h1>
            <p style={{ fontSize: '0.85rem', color: '#666', marginBottom: 20 }}>
              {formatDate(article.date_published)}
            </p>
            <img src={imgSrc} alt={article.title}
              style={{ width: '100%', maxHeight: 350, objectFit: 'cover', borderRadius: 6, display: 'block', marginBottom: 20 }} />
            <p style={{ fontSize: '0.95rem', color: '#444', lineHeight: 1.7, textAlign: 'justify' }}>
              {article.description || 'No description available.'}
            </p>
          </>
        )}
      </section>
      <style>{`@keyframes shimmer { 0% { background-position: -600px 0; } 100% { background-position: 600px 0; } }`}</style>
    </PublicShell>
  );
}
