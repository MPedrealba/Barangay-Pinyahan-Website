'use client';
import { useState, useEffect, use } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

export default function ViewNewsPage({ params }) {
  const unwrappedParams = use(params);
  const id = unwrappedParams.id;
  
  const router = useRouter();
  const [news, setNews] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchNews = async () => {
      try {
        const token = localStorage.getItem('token');
        const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/admin/news/${id}`, {
          headers: { 'Authorization': `Bearer ${token}` }
        });
        
        if (res.ok) {
          const data = await res.json();
          setNews(data.news);
        }
      } catch (err) {
        console.error('Error fetching article:', err);
      } finally {
        setLoading(false);
      }
    };
    fetchNews();
  }, [id]);

  if (loading) {
    return <div className="p-10 text-center text-gray-500 font-bold mt-10">Loading article details...</div>;
  }

  if (!news) {
    return <div className="p-10 text-center text-red-500 font-bold mt-10">Article not found.</div>;
  }

  const dateStr = new Date(news.date_published).toLocaleDateString('en-US', {
    weekday: 'long', month: 'long', day: 'numeric', year: 'numeric'
  });

  return (
    <div className="p-8 max-w-4xl mx-auto">
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
        
        {/* Header */}
        <div className="px-8 py-5 border-b border-gray-100 flex items-center justify-between bg-gray-50">
          <h2 className="text-[15px] font-black text-[#002B5B] flex items-center gap-2 uppercase tracking-wide">
            <i className="fas fa-eye text-[#0056b3]"></i> ARTICLE DETAILS
          </h2>
          <div className="flex gap-4 items-center">
            <Link
              href={`/admin/news/edit/${news.id}`}
              className="text-[#0056b3] hover:text-[#004494] transition-colors text-sm font-bold flex items-center gap-1"
            >
              <i className="fas fa-edit"></i> Edit
            </Link>
            <Link
              href="/admin/news"
              className="text-gray-500 hover:text-gray-800 transition-colors text-sm font-bold flex items-center gap-1"
            >
              <i className="fas fa-arrow-left"></i> Back
            </Link>
          </div>
        </div>

        {/* Content Body */}
        <div className="p-8 space-y-8">
          
          {/* Main Info Box */}
          <div className="flex flex-col gap-4">
            {news.is_featured ? (
              <div className="inline-flex w-max items-center gap-2 bg-yellow-100 text-yellow-800 px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider">
                <i className="fas fa-star"></i> Featured Article
              </div>
            ) : null}
            
            <h3 className="text-3xl font-black text-gray-900 leading-tight">{news.title}</h3>
            
            <div className="flex flex-wrap items-center gap-6 text-sm font-medium text-gray-600">
              <span className="flex items-center gap-2">
                <i className="fas fa-calendar-alt text-[#0056b3]"></i> {dateStr}
              </span>
              <span className="flex items-center gap-2">
                <i className="fas fa-user text-[#0056b3]"></i> {news.author || 'Admin'}
              </span>
              <span className="flex items-center gap-2">
                <i className="fas fa-circle text-[8px] text-[#0056b3]"></i> Status: 
                <span className={`px-2 py-0.5 rounded text-xs font-bold uppercase ${
                  (news.status || '').toLowerCase() === 'published' ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-700'
                }`}>
                  {news.status || 'Draft'}
                </span>
              </span>
            </div>
          </div>

          {/* Photo */}
          {news.photo_url && (
            <div className="rounded-xl overflow-hidden border border-gray-200 shadow-sm max-w-2xl">
              <img 
                src={news.photo_url.startsWith('http') ? news.photo_url : `${process.env.NEXT_PUBLIC_API_URL}${news.photo_url.startsWith('/') ? '' : '/'}${news.photo_url}`} 
                alt={news.title} 
                className="w-full h-auto object-cover"
              />
            </div>
          )}

          {/* Description */}
          {news.description && (
            <div>
              <div className="text-gray-800 text-[16px] leading-relaxed whitespace-pre-wrap">
                {news.description}
              </div>
            </div>
          )}

        </div>
      </div>
    </div>
  );
}
