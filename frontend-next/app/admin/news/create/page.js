'use client';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

export default function CreateNewsPage() {
  const router = useRouter();

  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [datePublished, setDatePublished] = useState('');
  const [isFeatured, setIsFeatured] = useState(false);
  const [image, setImage] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!title || !content || !datePublished) {
      alert('Please fill in the Title, Date, and Content fields.');
      return;
    }

    setIsSubmitting(true);

    try {
      const token = localStorage.getItem('token');
      const formData = new FormData();
      formData.append('title', title);
      formData.append('description', content);
      formData.append('date_published', datePublished);
      formData.append('is_featured', isFeatured);

      if (image) {
        formData.append('photo', image);
      }

      const res = await fetch('http://localhost:3000/api/admin/news', {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${token}` },
        body: formData
      });

      if (res.ok) {
        alert('✅ Article created successfully!');
        router.push('/admin/news');
      } else {
        const errorData = await res.json();
        alert(`Failed to create article: ${errorData.error || 'Unknown error'}`);
      }
    } catch (err) {
      console.error('Error creating article:', err);
      alert('Error creating article.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="p-8 max-w-4xl mx-auto">
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">

        {/* Header */}
        <div className="px-8 py-5 border-b border-gray-100 flex items-center justify-between bg-gray-50">
          <h2 className="text-sm font-black text-gray-800 flex items-center gap-2 uppercase tracking-wide">
            <i className="fas fa-plus-circle text-blue-700"></i> ADD NEW ARTICLE
          </h2>
          <Link
            href="/admin/news"
            className="text-gray-500 hover:text-blue-700 transition-colors text-sm font-bold flex items-center gap-2"
          >
            <i className="fas fa-arrow-left"></i> Back to News
          </Link>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-8 space-y-6">

          {/* Title */}
          <div>
            <label className="block text-xs font-bold text-gray-500 uppercase tracking-widest mb-2">
              Title <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Enter article title"
              required
              className="w-full px-4 py-3 rounded-lg border border-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm font-medium text-gray-900"
            />
          </div>

          {/* Date Published */}
          <div>
            <label className="block text-xs font-bold text-gray-500 uppercase tracking-widest mb-2">
              Date Published <span className="text-red-500">*</span>
            </label>
            <input
              type="date"
              value={datePublished}
              onChange={(e) => setDatePublished(e.target.value)}
              required
              className="w-full px-4 py-3 rounded-lg border border-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm font-medium text-gray-900"
            />
          </div>

          {/* Content / Description */}
          <div>
            <label className="block text-xs font-bold text-gray-500 uppercase tracking-widest mb-2">
              Content <span className="text-red-500">*</span>
            </label>
            <textarea
              value={content}
              onChange={(e) => setContent(e.target.value)}
              placeholder="Write the article content here..."
              required
              className="w-full px-4 py-3 rounded-lg border border-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm font-medium text-gray-900 resize-y"
              style={{ minHeight: '200px' }}
            ></textarea>
          </div>

          {/* Image Upload */}
          <div>
            <label className="block text-xs font-bold text-gray-500 uppercase tracking-widest mb-2">
              Cover Image
            </label>
            <input
              type="file"
              accept="image/*"
              onChange={(e) => setImage(e.target.files[0] || null)}
              className="w-full text-sm text-gray-600 file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-bold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100 cursor-pointer"
            />
          </div>

          {/* Featured Toggle */}
          <div className="flex items-center gap-3">
            <input
              type="checkbox"
              id="isFeatured"
              checked={isFeatured}
              onChange={(e) => setIsFeatured(e.target.checked)}
              className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
            />
            <label htmlFor="isFeatured" className="text-sm font-medium text-gray-700">
              Mark as Featured Article
            </label>
          </div>

          {/* Action Buttons */}
          <div className="pt-6 border-t border-gray-100 flex justify-end gap-3">
            <Link
              href="/admin/news"
              className="bg-gray-500 text-white px-6 py-2.5 rounded-lg text-sm font-bold hover:bg-gray-600 transition-colors no-underline"
            >
              Cancel
            </Link>
            <button
              type="submit"
              disabled={isSubmitting}
              className="bg-green-600 text-white px-6 py-2.5 rounded-lg text-sm font-bold hover:bg-green-700 transition-colors flex items-center gap-2 disabled:opacity-70 disabled:cursor-not-allowed"
            >
              {isSubmitting ? (
                <><i className="fas fa-spinner fa-spin"></i> Saving...</>
              ) : (
                <><i className="fas fa-save"></i> Save Article</>
              )}
            </button>
          </div>

        </form>
      </div>
    </div>
  );
}
