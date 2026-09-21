'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { apiGet, apiPatch, apiDelete, getPhotoUrl } from '@/lib/api';

export default function NewsPage() {
  const [news, setNews] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [updatingId, setUpdatingId] = useState(null);
  const [toast, setToast] = useState(null);

  const showToast = (type, message) => {
    setToast({ type, message });
    setTimeout(() => setToast(null), 3000);
  };

  const fetchNews = async () => {
    try {
      const data = await apiGet('/api/admin/news');
      setNews(data?.news || []);
    } catch (err) {
      console.error('Failed to fetch news:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchNews();
  }, []);

  const handleStatusChange = async (id, newStatus) => {
    if (updatingId === id) return;
    setUpdatingId(id);

    try {
      await apiPatch(`/api/admin/news/${id}/status`, { status: newStatus });
      setNews((prev) =>
        prev.map((item) => (item.id === id ? { ...item, status: newStatus } : item))
      );
      showToast('success', `Article status changed to ${newStatus}.`);
    } catch (err) {
      console.error('Failed to update article status:', err);
      showToast('error', err.message || 'Failed to update article status.');
    } finally {
      setUpdatingId(null);
    }
  };

  const handleDelete = async (id, title) => {
    if (!confirm(`Are you sure you want to delete "${title || 'this article'}"? This action cannot be undone.`)) return;

    try {
      await apiDelete(`/api/admin/news/${id}`);
      setNews((prev) => prev.filter((item) => item.id !== id));
      showToast('success', 'Article deleted successfully.');
    } catch (err) {
      console.error('Error deleting article:', err);
      showToast('error', err.message || 'Failed to delete article.');
    }
  };

  // Filter news by search query (case-insensitive title match)
  const filteredNews = news.filter((item) =>
    (item.title || '').toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="p-8 max-w-7xl mx-auto relative">
      {/* Floating Toast Notification */}
      {toast && (
        <div
          className={`fixed bottom-6 right-6 z-50 px-4 py-3 rounded-xl shadow-lg border text-sm font-semibold flex items-center gap-2.5 transition-all ${
            toast.type === 'success'
              ? 'bg-emerald-50 text-emerald-800 border-emerald-200 shadow-emerald-900/10'
              : 'bg-red-50 text-red-800 border-red-200 shadow-red-900/10'
          }`}
        >
          <i
            className={`fas ${
              toast.type === 'success' ? 'fa-check-circle text-emerald-600' : 'fa-exclamation-circle text-red-600'
            }`}
          />
          <span>{toast.message}</span>
        </div>
      )}

      {/* Header Bar */}
      <div className="flex flex-wrap items-center justify-between gap-4 mb-8">
        <div>
          <h1 className="text-xl font-black text-[#002B5B] flex items-center gap-2 uppercase tracking-wide m-0">
            <i className="fas fa-newspaper text-[#0056b3]"></i> News Management
          </h1>
          <p className="text-sm text-gray-500 mt-1">Manage, publish, and draft barangay news announcements</p>
        </div>

        <div className="flex items-center gap-3">
          {/* Search Bar */}
          <div className="relative">
            <i className="fas fa-search absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 text-xs"></i>
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search articles..."
              className="pl-9 pr-4 py-2.5 rounded-lg border border-gray-300 text-sm text-gray-700 focus:outline-none focus:ring-2 focus:ring-[#0056b3] focus:border-transparent w-56"
            />
          </div>
          {/* Add Button */}
          <Link
            href="/admin/news/create"
            className="bg-[#0056b3] text-white px-5 py-2.5 rounded-lg shadow-sm font-bold text-sm hover:bg-blue-800 transition-colors flex items-center gap-2 no-underline"
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
              <tr className="bg-gray-50 text-gray-500 text-xs uppercase tracking-wider border-b border-gray-100">
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
                    <i className="fas fa-spinner fa-spin mr-2 text-[#0056b3]"></i>
                    Loading articles...
                  </td>
                </tr>
              ) : filteredNews.length > 0 ? (
                filteredNews.map((item) => {
                  const dateStr = item.date_published
                    ? new Date(item.date_published).toLocaleDateString('en-US', {
                        month: 'short',
                        day: 'numeric',
                        year: 'numeric'
                      })
                    : 'N/A';

                  const photoSrc = getPhotoUrl(item.photo_url);

                  const isPublished = (item.status || 'Published').toLowerCase() === 'published';

                  return (
                    <tr key={item.id} className="hover:bg-gray-50 transition-colors text-sm text-gray-700">
                      <td className="px-6 py-4">
                        {photoSrc ? (
                          <img
                            src={photoSrc}
                            alt={item.title}
                            className="w-16 h-10 object-cover rounded-md border border-gray-200"
                          />
                        ) : (
                          <div className="w-16 h-10 bg-gray-100 rounded-md border border-gray-200 flex items-center justify-center">
                            <i className="fas fa-image text-gray-400 text-xs"></i>
                          </div>
                        )}
                      </td>
                      <td className="px-6 py-4 font-bold text-gray-900 max-w-xs truncate" title={item.title}>
                        {item.title}
                      </td>
                      <td className="px-6 py-4 text-gray-600">{dateStr}</td>
                      <td className="px-6 py-4 text-gray-600">{item.author || 'Admin'}</td>

                      {/* Interactive Status Dropdown */}
                      <td className="px-6 py-4">
                        <div className="relative inline-flex items-center">
                          <select
                            value={item.status || 'Published'}
                            disabled={updatingId === item.id}
                            onChange={(e) => handleStatusChange(item.id, e.target.value)}
                            className={`text-xs font-bold rounded-lg pl-3 pr-8 py-1.5 border appearance-none cursor-pointer outline-none transition-all disabled:opacity-50 ${
                              isPublished
                                ? 'bg-emerald-50 text-emerald-800 border-emerald-300 hover:bg-emerald-100 focus:ring-2 focus:ring-emerald-400/20'
                                : 'bg-gray-100 text-gray-700 border-gray-300 hover:bg-gray-200 focus:ring-2 focus:ring-gray-400/20'
                            }`}
                            title="Click to change article status"
                          >
                            <option value="Published">Published</option>
                            <option value="Draft">Draft</option>
                          </select>
                          <div className="absolute right-2.5 pointer-events-none text-xs">
                            {updatingId === item.id ? (
                              <i className="fas fa-spinner fa-spin text-blue-600" />
                            ) : (
                              <i
                                className={`fas fa-chevron-down text-[10px] ${
                                  isPublished ? 'text-emerald-700' : 'text-gray-500'
                                }`}
                              />
                            )}
                          </div>
                        </div>
                      </td>

                      {/* Actions */}
                      <td className="px-6 py-4 text-center">
                        <div className="flex justify-center gap-2 items-center">
                          <Link
                            href={`/admin/news/view/${item.id}`}
                            className="bg-white border border-gray-200 text-gray-700 px-3 py-1.5 rounded-lg text-xs font-bold hover:text-[#0056b3] hover:border-[#0056b3] transition-colors no-underline shadow-2xs inline-flex items-center gap-1"
                          >
                            <i className="fas fa-eye text-[11px]" />
                            <span>View</span>
                          </Link>
                          <Link
                            href={`/admin/news/edit/${item.id}`}
                            className="bg-[#0056b3] text-white px-3 py-1.5 rounded-lg text-xs font-bold hover:bg-blue-800 transition-colors no-underline shadow-2xs inline-flex items-center gap-1"
                          >
                            <i className="fas fa-edit text-[11px]" />
                            <span>Edit</span>
                          </Link>
                          <button
                            type="button"
                            onClick={() => handleDelete(item.id, item.title)}
                            className="bg-red-500 text-white px-3 py-1.5 rounded-lg text-xs font-bold hover:bg-red-600 transition-colors cursor-pointer border-0 shadow-2xs inline-flex items-center gap-1"
                          >
                            <i className="fas fa-trash-alt text-[11px]" />
                            <span>Delete</span>
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
