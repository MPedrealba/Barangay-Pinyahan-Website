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
      <section
        className="bg-[#003366] bg-cover bg-center bg-no-repeat h-[200px] sm:h-[280px] md:h-[350px] flex items-center justify-center relative overflow-hidden"
        style={{ backgroundImage: "url('/images/newly_elected_officials.jpg')" }}
      >
        <div className="absolute inset-0 bg-[rgba(0,33,71,0.62)] z-[1]" />
        <div className="relative z-[2] px-5 py-3 md:px-8 md:py-4 rounded border-2 border-white/25">
          <h1 className="text-white text-lg sm:text-xl md:text-[2.2rem] font-extrabold uppercase m-0 drop-shadow-lg">BARANGAY NEWS AND UPDATES</h1>
        </div>
      </section>

      {/* Advisory Bar */}
      <div className="bg-[#0056b3] text-white w-full py-2.5 mb-5">
        <div className="w-[90%] max-w-[1200px] mx-auto flex flex-col sm:flex-row items-start sm:items-center gap-2 sm:gap-4">
          <span className="bg-[#5dace0] px-2.5 py-0.5 font-bold uppercase text-[0.9rem] shrink-0">ADVISORY</span>
          <span className="text-xs sm:text-[0.9rem] uppercase tracking-wide">ALL UPDATES ON THIS PAGE ARE OFFICIAL NOTICES FROM BARANGAY PINYAHAN</span>
        </div>
      </div>

      {/* Article Content */}
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

        {!loading && (error || !article) && (
          <p className="text-red-700 font-bold text-center mt-10">Unable to load news article.</p>
        )}

        {!loading && article && (
          <>
            <h1 className="text-lg md:text-xl font-extrabold text-gray-800 underline mb-1.5">
              {article.title}
            </h1>
            <p className="text-[0.85rem] text-gray-500 mb-5">
              {formatDate(article.date_published)}
            </p>
            <img src={imgSrc} alt={article.title}
              className="w-full max-h-[350px] object-cover rounded-md block mb-5" />
            <p className="text-sm md:text-[0.95rem] text-gray-600 leading-relaxed md:leading-loose text-justify">
              {article.description || 'No description available.'}
            </p>
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
