'use client';
import { useState, useEffect, useRef, use } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

export default function EditNewsPage({ params }) {
  const unwrappedParams = use(params);
  const id = unwrappedParams.id;
  
  const router = useRouter();
  const fileInputRef = useRef(null);
  
  const [loading, setLoading] = useState(true);
  const [formData, setFormData] = useState({
    title: '',
    date_published: '',
    description: '',
    is_featured: false
  });
  
  const [existingPhotoUrl, setExistingPhotoUrl] = useState(null);
  const [photo, setPhoto] = useState(null);
  const [photoPreview, setPhotoPreview] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    const fetchNews = async () => {
      try {
        const token = localStorage.getItem('token');
        const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/admin/news/${id}`, {
          headers: { 'Authorization': `Bearer ${token}` }
        });
        
        if (res.ok) {
          const data = await res.json();
          const item = data.news;
          
          // Format date for <input type="date"> (YYYY-MM-DD)
          const dateObj = new Date(item.date_published);
          const formattedDate = !isNaN(dateObj.getTime()) 
            ? dateObj.toISOString().split('T')[0] 
            : '';

          setFormData({
            title: item.title || '',
            date_published: formattedDate,
            description: item.description || '',
            is_featured: !!item.is_featured
          });
          
          if (item.photo_url) {
            setExistingPhotoUrl(
              item.photo_url.startsWith('http') 
                ? item.photo_url 
                : `${process.env.NEXT_PUBLIC_API_URL}${item.photo_url.startsWith('/') ? '' : '/'}${item.photo_url}`
            );
          }
        } else {
          alert('Failed to load article details.');
        }
      } catch (err) {
        console.error('Error fetching article:', err);
      } finally {
        setLoading(false);
      }
    };
    fetchNews();
  }, [id]);

  const handleInputChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData(prev => ({ 
      ...prev, 
      [name]: type === 'checkbox' ? checked : value 
    }));
  };

  const handlePhotoChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setPhoto(file);
      setPhotoPreview(URL.createObjectURL(file));
    }
  };

  const handleRemoveNewPhoto = () => {
    setPhoto(null);
    setPhotoPreview(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      const token = localStorage.getItem('token');
      const submitData = new FormData();
      
      submitData.append('title', formData.title);
      submitData.append('date_published', formData.date_published);
      submitData.append('description', formData.description);
      submitData.append('is_featured', formData.is_featured);
      
      if (photo) {
        submitData.append('photo', photo);
      }

      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/admin/news/${id}`, {
        method: 'PUT',
        headers: { 'Authorization': `Bearer ${token}` },
        body: submitData
      });

      if (res.ok) {
        alert('✅ Article Updated Successfully!');
        router.push('/admin/news');
      } else {
        const errorData = await res.json();
        alert(`Failed to update article: ${errorData.error || 'Unknown error'}`);
      }
    } catch (err) {
      console.error('Error updating article:', err);
      alert('Error updating article.');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (loading) {
    return <div className="p-10 text-center text-gray-500 font-bold">Loading article details...</div>;
  }

  return (
    <div className="p-8 max-w-4xl mx-auto">
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
        
        {/* Header */}
        <div className="px-8 py-5 border-b border-gray-100 flex items-center justify-between bg-gray-50">
          <h2 className="text-[15px] font-black text-[#002B5B] flex items-center gap-2 uppercase tracking-wide">
            <i className="fas fa-edit text-[#0056b3]"></i> EDIT ARTICLE
          </h2>
          <Link
            href="/admin/news"
            className="text-gray-500 hover:text-[#0056b3] transition-colors text-sm font-bold flex items-center gap-2"
          >
            <i className="fas fa-arrow-left"></i> Back to News
          </Link>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-8">
          
          <div className="space-y-6">
            
            {/* Title */}
            <div>
              <label className="block text-[11px] font-bold text-gray-500 uppercase tracking-widest mb-2">Title <span className="text-red-500">*</span></label>
              <input 
                type="text" 
                name="title"
                value={formData.title}
                onChange={handleInputChange}
                required
                className="w-full px-4 py-3 rounded-lg border border-gray-300 focus:outline-none focus:ring-2 focus:ring-[#0056b3] text-sm font-medium text-gray-900"
              />
            </div>

            {/* Date Published */}
            <div>
              <label className="block text-[11px] font-bold text-gray-500 uppercase tracking-widest mb-2">Date Published <span className="text-red-500">*</span></label>
              <input 
                type="date" 
                name="date_published"
                value={formData.date_published}
                onChange={handleInputChange}
                required
                className="w-full px-4 py-3 rounded-lg border border-gray-300 focus:outline-none focus:ring-2 focus:ring-[#0056b3] text-sm font-medium text-gray-900"
              />
            </div>

            {/* Content / Description */}
            <div>
              <label className="block text-[11px] font-bold text-gray-500 uppercase tracking-widest mb-2">Content <span className="text-red-500">*</span></label>
              <textarea 
                name="description"
                value={formData.description}
                onChange={handleInputChange}
                required
                className="w-full min-h-[250px] px-4 py-3 rounded-lg border border-gray-300 focus:outline-none focus:ring-2 focus:ring-[#0056b3] text-sm font-medium text-gray-900 resize-y"
              ></textarea>
            </div>

            {/* Photo Upload */}
            <div>
              <label className="block text-[11px] font-bold text-gray-500 uppercase tracking-widest mb-2">Cover Image</label>
              
              {!photoPreview && !existingPhotoUrl ? (
                <div 
                  onClick={() => fileInputRef.current?.click()}
                  className="w-full h-40 border-2 border-dashed border-gray-300 rounded-lg flex flex-col items-center justify-center text-gray-400 hover:text-[#0056b3] hover:border-[#0056b3] hover:bg-blue-50 transition-colors cursor-pointer"
                >
                  <i className="fas fa-image text-3xl mb-2"></i>
                  <span className="text-sm font-bold uppercase tracking-wider">Click to Upload New Cover</span>
                </div>
              ) : photoPreview ? (
                // Show newly selected photo
                <div className="relative inline-block mt-2">
                  <p className="text-xs font-bold text-green-600 mb-2 uppercase tracking-wide">New Cover Selected:</p>
                  <img src={photoPreview} alt="New Preview" className="max-w-md w-full rounded-lg border border-gray-200 shadow-sm" />
                  <button 
                    type="button"
                    onClick={handleRemoveNewPhoto}
                    className="absolute top-8 right-2 bg-red-500 text-white w-8 h-8 rounded-full flex items-center justify-center shadow hover:bg-red-600 transition-colors"
                  >
                    <i className="fas fa-times"></i>
                  </button>
                </div>
              ) : (
                // Show existing photo
                <div className="mt-2">
                  <p className="text-xs font-bold text-gray-500 mb-2 uppercase tracking-wide">Current Cover:</p>
                  <img src={existingPhotoUrl} alt="Current Cover" className="max-w-md w-full rounded-lg border border-gray-200 shadow-sm mb-4" />
                  <button 
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    className="bg-gray-100 text-gray-700 px-4 py-2 rounded-lg text-sm font-bold hover:bg-gray-200 transition-colors flex items-center gap-2"
                  >
                    <i className="fas fa-upload"></i> Upload Replacement Cover
                  </button>
                </div>
              )}
              
              <input 
                type="file" 
                accept="image/*" 
                ref={fileInputRef}
                onChange={handlePhotoChange}
                className="hidden"
              />
            </div>
            
            {/* Featured Toggle */}
            <div className="flex items-center gap-3 bg-gray-50 p-4 rounded-lg border border-gray-200">
              <input 
                type="checkbox" 
                id="is_featured"
                name="is_featured"
                checked={formData.is_featured}
                onChange={handleInputChange}
                className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
              />
              <label htmlFor="is_featured" className="text-sm font-bold text-gray-700">
                Mark as Featured Article
              </label>
            </div>

          </div>

          {/* Action Buttons */}
          <div className="mt-8 pt-6 border-t border-gray-100 flex justify-end items-center gap-4">
            <Link 
              href="/admin/news" 
              className="text-gray-500 font-bold text-sm hover:text-gray-800 transition-colors"
            >
              Cancel
            </Link>
            <button 
              type="submit" 
              disabled={isSubmitting}
              className="bg-[#0056b3] text-white px-8 py-3 rounded-lg text-sm font-bold hover:bg-[#004494] active:scale-[0.98] transition-all flex items-center gap-2 disabled:opacity-70 disabled:cursor-not-allowed"
            >
              {isSubmitting ? (
                <><i className="fas fa-spinner fa-spin"></i> Saving...</>
              ) : (
                <><i className="fas fa-check"></i> Save Changes</>
              )}
            </button>
          </div>

        </form>
      </div>
    </div>
  );
}
