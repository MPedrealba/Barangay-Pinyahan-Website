'use client';
import { useState, useEffect, use } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

export default function ViewEventPage({ params }) {
  const unwrappedParams = use(params);
  const id = unwrappedParams.id;
  
  const router = useRouter();
  const [event, setEvent] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchEvent = async () => {
      try {
        const token = localStorage.getItem('token');
        const res = await fetch(`http://localhost:3000/api/admin/events/${id}`, {
          headers: { 'Authorization': `Bearer ${token}` }
        });
        
        if (res.ok) {
          const data = await res.json();
          setEvent(data.event);
        }
      } catch (err) {
        console.error('Error fetching event:', err);
      } finally {
        setLoading(false);
      }
    };
    fetchEvent();
  }, [id]);

  if (loading) {
    return <div className="p-10 text-center text-gray-500 font-bold mt-10">Loading event details...</div>;
  }

  if (!event) {
    return <div className="p-10 text-center text-red-500 font-bold mt-10">Event not found.</div>;
  }

  const dateStr = new Date(event.date).toLocaleDateString('en-US', {
    weekday: 'long', month: 'long', day: 'numeric', year: 'numeric'
  });

  return (
    <div className="p-8 max-w-4xl mx-auto">
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
        
        {/* Header */}
        <div className="px-8 py-5 border-b border-gray-100 flex items-center justify-between bg-gray-50">
          <h2 className="text-[15px] font-black text-[#002B5B] flex items-center gap-2 uppercase tracking-wide">
            <i className="fas fa-eye text-[#0056b3]"></i> EVENT DETAILS
          </h2>
          <div className="flex gap-4 items-center">
            <Link
              href={`/admin/events/edit/${event.id}`}
              className="text-[#0056b3] hover:text-[#004494] transition-colors text-sm font-bold flex items-center gap-1"
            >
              <i className="fas fa-edit"></i> Edit
            </Link>
            <Link
              href="/admin/events"
              className="text-gray-500 hover:text-gray-800 transition-colors text-sm font-bold flex items-center gap-1"
            >
              <i className="fas fa-arrow-left"></i> Back
            </Link>
          </div>
        </div>

        {/* Content Body */}
        <div className="p-8 space-y-8">
          
          {/* Main Info Box */}
          <div className="bg-blue-50/50 p-6 rounded-xl border border-blue-100 flex flex-col md:flex-row gap-6 items-start">
            <div className="bg-white w-16 h-16 rounded-lg shadow-sm border border-blue-100 flex flex-col items-center justify-center shrink-0">
              <span className="text-xs font-bold text-gray-500 uppercase">{new Date(event.date).toLocaleDateString('en-US', { month: 'short' })}</span>
              <span className="text-xl font-black text-[#0056b3]">{new Date(event.date).getDate()}</span>
            </div>
            <div>
              <h3 className="text-2xl font-black text-gray-900 mb-2">{event.name}</h3>
              <div className="flex flex-col gap-2 text-sm font-medium text-gray-600">
                <span className="flex items-center gap-2">
                  <i className="fas fa-calendar w-4 text-center text-[#0056b3]"></i> {dateStr}
                </span>
                <span className="flex items-center gap-2">
                  <i className="fas fa-clock w-4 text-center text-[#0056b3]"></i> {event.time}
                </span>
                <span className="flex items-center gap-2">
                  <i className="fas fa-map-marker-alt w-4 text-center text-[#0056b3]"></i> {event.location}
                </span>
              </div>
            </div>
          </div>

          {/* Description */}
          {event.description && (
            <div>
              <h4 className="text-[11px] font-bold text-gray-400 uppercase tracking-widest mb-3">About the Event</h4>
              <div className="text-gray-800 text-[15px] leading-relaxed whitespace-pre-wrap bg-gray-50 p-5 rounded-lg border border-gray-100">
                {event.description}
              </div>
            </div>
          )}

          {/* Photo */}
          {event.photo_url && (
            <div>
              <h4 className="text-[11px] font-bold text-gray-400 uppercase tracking-widest mb-3">Event Photo</h4>
              <img 
                src={`http://localhost:3000${event.photo_url.startsWith('/') ? '' : '/'}${event.photo_url}`} 
                alt={event.name} 
                className="max-w-2xl w-full rounded-xl border border-gray-200 shadow-sm"
              />
            </div>
          )}

        </div>
      </div>
    </div>
  );
}
