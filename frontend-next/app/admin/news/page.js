'use client';
import { useState, useEffect } from 'react';
import Link from 'next/link';

export default function NewsPage() {
  const [news, setNews] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    const fetchNews = async () => {
      try {
        const token = localStorage.getItem('token');
        const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/admin/news`), {
          headers: { 'Authorization': `Bearer ${token}` }
        });

        if (res.ok) {
          const data = await res.json();
          setNews(data.news || []);
        }
      } catch (err) {
        console.error('Failed to fetch news:', err);
      } finally {
        setLoading(false);
      }
    };
    fetchNews();
  }, []);

  const handleDelete = async (id) => {
    if (!confirm('Are you sure you want to delete this article?')) return;

    try {
      const token = localStorage.getItem('token');
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/admin/news/${id}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${token}` }
      });

      if (res.ok) {
        setNews((prev) => prev.filter((item) => item.id !== id));
        alert('Article deleted successfully.');
      } else {
        alert('Failed to delete article.');
      }
    } catch (err) {
      console.error('Error deleting article:', err);
      alert('Error deleting article.');
    }
  };

  const getStatusBadge = (status) => {
    const s = (status || '').toLowerCase();
    if (s === 'published') return 'bg-green-100 text-green-700';
    return 'bg-gray-100 text-gray-700';
  };

  // Filter news by search query (case-insensitive title match)
  const filteredNews = news.filter((item) =>
    (item.title || '').toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="p-8 max-w-7xl mx-auto">

      {/* Header Bar */}
      <div className="flex items-center justify-between mb-8">
        <h2 className="text-sm font-black text-gray-800 flex items-center gap-2 uppercase tracking-wide">
          <i className="fas fa-newspaper text-blue-700"></i> NEWS MANAGEMENT
        </h2>
        <div className="flex items-center gap-3">
          {/* Search Bar */}
          <div className="relative">
            <i className="fas fa-search absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 text-xs"></i>
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search articles..."
              className="pl-9 pr-4 py-2.5 rounded-lg border border-gray-300 text-sm text-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent w-56"
            />
          </div>
          {/* Add Button */}
          <Link
            href="/admin/news/create"
            className="bg-blue-600 text-white px-5 py-2.5 rounded-lg shadow-sm font-bold text-sm hover:bg-blue-700 transition-colors flex items-center gap-2 no-underline"
          >
            <i className="fas fa-plus"></i> Add New Article
          </Link>
        </div>
      </div>

      {/* Table Card */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-gray-50 text-gray-500 text-xs uppercase tracking-wider">
                <th className="px-6 py-4 font-bold">Image</th>
                <th className="px-6 py-4 font-bold">Title</th>
                <th className="px-6 py-4 font-bold">Date Published</th>
                <th className="px-6 py-4 font-bold">Author</th>
                <th className="px-6 py-4 font-bold">Status</th>
                <th className="px-6 py-4 font-bold text-center">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {loading ? (
                <tr>
                  <td colSpan="6" className="px-6 py-12 text-center text-gray-400 text-sm">
                    Loading articles...
                  </td>
                </tr>
              ) : filteredNews.length > 0 ? (
                filteredNews.map((item) => {
                  const dateStr = item.date_published
                    ? new Date(item.date_published).toLocaleDateString('en-US', {
                        month: 'short', day: 'numeric', year: 'numeric'
                      })
                    : 'N/A';

                  // photo_url from Supabase is always a full HTTPS URL
                  // Fallback: prepend backend origin only for legacy /uploads/ paths
                  const photoSrc = item.photo_url
                    ? (item.photo_url.startsWith('http')
                        ? item.photo_url
                        : `${process.env.NEXT_PUBLIC_API_URL}/${item.photo_url.replace(/^\//, '')}`)
                    : null;

                  return (
                    <tr key={item.id} className="hover:bg-gray-50 transition-colors text-sm text-gray-700">
                      <td className="px-6 py-4">
                        {photoSrc ? (
                          <img
                            src={photoSrc}
                            alt={item.title}
                            className="w-16 h-10 object-cover rounded border border-gray-200"
                          />
                        ) : (
                          <div className="w-16 h-10 bg-gray-100 rounded border border-gray-200 flex items-center justify-center">
                            <i className="fas fa-image text-gray-400 text-xs"></i>
                          </div>
                        )}
                      </td>
                      <td className="px-6 py-4 font-bold text-gray-900 max-w-xs truncate">{item.title}</td>
                      <td className="px-6 py-4">{dateStr}</td>
                      <td className="px-6 py-4">{item.author || 'Admin'}</td>
                      <td className="px-6 py-4">
                        <span className={`px-3 py-1 rounded-md text-xs font-bold uppercase tracking-wider ${getStatusBadge(item.status)}`}>
                          {item.status || 'Draft'}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-center">
                        <div className="flex justify-center gap-2 items-center">
                          <Link
                            href={`/admin/news/view/${item.id}`}
                            className="bg-[#0056b3] text-white px-3 py-1.5 rounded-md text-xs font-bold hover:bg-blue-800 transition-colors no-underline"
                          >
                            View
                          </Link>
                          <Link
                            href={`/admin/news/edit/${item.id}`}
                            className="bg-green-600 text-white px-3 py-1.5 rounded-md text-xs font-bold hover:bg-green-700 transition-colors no-underline"
                          >
                            Edit
                          </Link>
                          <button
                            onClick={() => handleDelete(item.id)}
                            className="bg-red-500 text-white px-3 py-1.5 rounded-md text-xs font-bold hover:bg-red-600 transition-colors"
                          >
                            Delete
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              ) : (
                <tr>
                  <td colSpan="6" className="px-6 py-12 text-center text-gray-500 font-medium">
                    No news articles found.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

    </div>
  );
}
