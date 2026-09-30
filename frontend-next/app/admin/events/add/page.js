'use client';
import { useState, useRef } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { apiPost } from '@/lib/api';

export default function AddEventPage() {
  const router = useRouter();
  const fileInputRef = useRef(null);
  
  const [formData, setFormData] = useState({
    name: '',
    date: '',
    time: '',
    location: '',
    description: '',
    status: 'Published'
  });
  const [photo, setPhoto] = useState(null);
  const [photoPreview, setPhotoPreview] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handlePhotoChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setPhoto(file);
      setPhotoPreview(URL.createObjectURL(file));
    }
  };

  const handleRemovePhoto = () => {
    setPhoto(null);
    setPhotoPreview(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleSave = async (targetStatus) => {
    const finalStatus = targetStatus || formData.status || 'Published';

    if (!formData.name.trim() || !formData.date || !formData.time || !formData.location.trim() || !formData.description.trim()) {
      alert('Please fill in all required fields (Name, Date, Time, Location, and Description).');
      return;
    }

    setIsSubmitting(true);

    try {
      const submitData = new FormData();
      submitData.append('name', formData.name.trim());
      submitData.append('date', formData.date);
      submitData.append('time', formData.time);
      submitData.append('location', formData.location.trim());
      submitData.append('description', formData.description.trim());
      submitData.append('status', finalStatus);
      
      if (photo) {
        submitData.append('photo', photo);
      }

      await apiPost('/api/admin/events', submitData);

      if (finalStatus === 'Published') {
        alert('🎉 Event published successfully! It is now live on the public website.');
      } else {
        alert('📝 Event saved as Draft. It remains hidden from the public website.');
      }
      router.push('/admin/events');
    } catch (err) {
      console.error('Error adding event:', err);
      alert(`Failed to add event: ${err.message || 'Unknown error'}`);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    handleSave(formData.status);
  };

  return (
    <div className="p-8 max-w-4xl mx-auto">
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
        
        {/* Header */}
        <div className="px-8 py-5 border-b border-gray-100 flex items-center justify-between bg-gray-50">
          <h2 className="text-[15px] font-black text-[#002B5B] flex items-center gap-2 uppercase tracking-wide">
            <i className="fas fa-plus-circle text-[#0056b3]"></i> ADD NEW EVENT
          </h2>
          <Link
            href="/admin/events"
            className="text-gray-500 hover:text-[#0056b3] transition-colors text-sm font-bold flex items-center gap-2"
          >
            <i className="fas fa-arrow-left"></i> Back to Events
          </Link>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-8">
          
          <div className="space-y-6">
            
            {/* Name */}
            <div>
              <label className="block text-[11px] font-bold text-gray-500 uppercase tracking-widest mb-2">Name of Event <span className="text-red-500">*</span></label>
              <input 
                type="text" 
                name="name"
                value={formData.name}
                onChange={handleInputChange}
                required
                placeholder="Enter event name"
                className="w-full px-4 py-3 rounded-lg border border-gray-300 focus:outline-none focus:ring-2 focus:ring-[#0056b3] text-sm font-medium text-gray-900"
              />
            </div>

            {/* Date, Time & Status Row */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div>
                <label className="block text-[11px] font-bold text-gray-500 uppercase tracking-widest mb-2">Date <span className="text-red-500">*</span></label>
                <input 
                  type="date" 
                  name="date"
                  value={formData.date}
                  onChange={handleInputChange}
                  required
                  className="w-full px-4 py-3 rounded-lg border border-gray-300 focus:outline-none focus:ring-2 focus:ring-[#0056b3] text-sm font-medium text-gray-900"
                />
              </div>
              <div>
                <label className="block text-[11px] font-bold text-gray-500 uppercase tracking-widest mb-2">Time <span className="text-red-500">*</span></label>
                <input 
                  type="time" 
                  name="time"
                  value={formData.time}
                  onChange={handleInputChange}
                  required
                  className="w-full px-4 py-3 rounded-lg border border-gray-300 focus:outline-none focus:ring-2 focus:ring-[#0056b3] text-sm font-medium text-gray-900"
                />
              </div>
              <div>
                <label className="block text-[11px] font-bold text-gray-500 uppercase tracking-widest mb-2">Status <span className="text-red-500">*</span></label>
                <select
                  name="status"
                  value={formData.status}
                  onChange={handleInputChange}
                  className="w-full px-4 py-3 rounded-lg border border-gray-300 focus:outline-none focus:ring-2 focus:ring-[#0056b3] text-sm font-semibold text-gray-800 bg-white"
                >
                  <option value="Published">Published (visible on website)</option>
                  <option value="Draft">Draft (saved internally, hidden)</option>
                </select>
              </div>
            </div>

            {/* Location */}
            <div>
              <label className="block text-[11px] font-bold text-gray-500 uppercase tracking-widest mb-2">Location <span className="text-red-500">*</span></label>
              <input 
                type="text" 
                name="location"
                value={formData.location}
                onChange={handleInputChange}
                required
                placeholder="Enter event location"
                className="w-full px-4 py-3 rounded-lg border border-gray-300 focus:outline-none focus:ring-2 focus:ring-[#0056b3] text-sm font-medium text-gray-900"
              />
            </div>

            {/* Photo Upload */}
            <div>
              <label className="block text-[11px] font-bold text-gray-500 uppercase tracking-widest mb-2">Event Photo</label>
              
              {!photoPreview ? (
                <div 
                  onClick={() => fileInputRef.current?.click()}
                  className="w-full h-40 border-2 border-dashed border-gray-300 rounded-lg flex flex-col items-center justify-center text-gray-400 hover:text-[#0056b3] hover:border-[#0056b3] hover:bg-blue-50 transition-colors cursor-pointer"
                >
                  <i className="fas fa-image text-3xl mb-2"></i>
                  <span className="text-sm font-bold uppercase tracking-wider">Click to Add Photo</span>
                </div>
              ) : (
                <div className="relative inline-block">
                  <img src={photoPreview} alt="Preview" className="max-w-md w-full rounded-lg border border-gray-200 shadow-sm" />
                  <button 
                    type="button"
                    onClick={handleRemovePhoto}
                    className="absolute top-2 right-2 bg-red-500 text-white w-8 h-8 rounded-full flex items-center justify-center shadow hover:bg-red-600 transition-colors"
                  >
                    <i className="fas fa-times"></i>
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

            {/* Description */}
            <div>
              <label className="block text-[11px] font-bold text-gray-500 uppercase tracking-widest mb-2">Description <span className="text-red-500">*</span></label>
              <textarea 
                name="description"
                value={formData.description}
                onChange={handleInputChange}
                required
                placeholder="Enter event description"
                className="w-full min-h-[150px] px-4 py-3 rounded-lg border border-gray-300 focus:outline-none focus:ring-2 focus:ring-[#0056b3] text-sm font-medium text-gray-900 resize-y"
              ></textarea>
            </div>

          </div>

          {/* Action Buttons */}
          <div className="mt-8 pt-6 border-t border-gray-100 flex flex-wrap justify-end items-center gap-3">
            <Link 
              href="/admin/events" 
              className="bg-gray-100 text-gray-700 px-5 py-2.5 rounded-lg text-sm font-bold hover:bg-gray-200 transition-colors no-underline"
            >
              Cancel
            </Link>
            <button 
              type="button" 
              onClick={() => handleSave('Draft')}
              disabled={isSubmitting}
              className="bg-white border-2 border-gray-300 text-gray-700 hover:bg-gray-50 px-5 py-2.5 rounded-lg text-sm font-bold transition-all flex items-center gap-2 disabled:opacity-70 cursor-pointer shadow-2xs"
            >
              <i className="fas fa-file-alt text-gray-500"></i>
              <span>Save as Draft</span>
            </button>
            <button 
              type="button" 
              onClick={() => handleSave('Published')}
              disabled={isSubmitting}
              className="bg-emerald-600 hover:bg-emerald-700 text-white px-6 py-2.5 rounded-lg text-sm font-bold shadow-sm transition-all flex items-center gap-2 disabled:opacity-70 cursor-pointer"
            >
              {isSubmitting ? (
                <><i className="fas fa-spinner fa-spin"></i> Processing...</>
              ) : (
                <><i className="fas fa-paper-plane"></i> Publish Event</>
              )}
            </button>
          </div>

        </form>
      </div>
    </div>
  );
}
