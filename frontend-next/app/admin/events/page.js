'use client';
import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';

export default function EventsPage() {
  const router = useRouter();
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchEvents = async () => {
      try {
        const token = localStorage.getItem('token');
        const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/admin/events`, {
          headers: { 'Authorization': `Bearer ${token}` }
        });

        if (res.ok) {
          const data = await res.json();
          setEvents(data.events || []);
        }
      } catch (err) {
        console.error('Failed to fetch events:', err);
      } finally {
        setLoading(false);
      }
    };
    fetchEvents();
  }, []);

  const handleDelete = async (id) => {
    if (!confirm('Are you sure you want to delete this event?')) return;

    try {
      const token = localStorage.getItem('token');
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/admin/events/${id}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${token}` }
      });

      if (res.ok) {
        setEvents((prev) => prev.filter((event) => event.id !== id));
        alert('Event deleted successfully.');
      } else {
        alert('Failed to delete event.');
      }
    } catch (err) {
      console.error('Error deleting event:', err);
      alert('Error deleting event.');
    }
  };

  return (
    <div className="p-8 max-w-7xl mx-auto">
      {/* Header Bar */}
      <div className="flex items-center justify-between mb-8">
        <h2 className="text-[15px] font-black text-[#002B5B] flex items-center gap-2 uppercase tracking-wide">
          <i className="fas fa-calendar-alt text-[#0056b3]"></i> EVENTS DASHBOARD
        </h2>
        <Link
          href="/admin/events/add"
          className="bg-[#0056b3] text-white px-5 py-2.5 rounded-lg shadow-sm font-bold text-sm hover:bg-[#004494] transition-colors flex items-center gap-2 no-underline"
        >
          <i className="fas fa-plus"></i> ADD NEW EVENT
        </Link>
      </div>

      {/* Events Table Card */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-gray-50 text-gray-500 text-xs uppercase tracking-wider">
                <th className="px-6 py-4 font-bold">Image</th>
                <th className="px-6 py-4 font-bold">Event Name</th>
                <th className="px-6 py-4 font-bold">Date</th>
                <th className="px-6 py-4 font-bold">Time</th>
                <th className="px-6 py-4 font-bold">Location</th>
                <th className="px-6 py-4 font-bold text-center">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {loading ? (
                <tr>
                  <td colSpan="6" className="px-6 py-12 text-center text-gray-400 text-sm">
                    Loading events...
                  </td>
                </tr>
              ) : events.length > 0 ? (
                events.map((event) => {
                  const dateStr = new Date(event.date).toLocaleDateString('en-US', {
                    month: 'short', day: 'numeric', year: 'numeric'
                  });

                  const photoSrc = event.photo_url
                    ? (event.photo_url.startsWith('http')
                        ? event.photo_url
                        : `${process.env.NEXT_PUBLIC_API_URL}/${event.photo_url.replace(/^\//, '')}`)
                    : null;

                  return (
                    <tr key={event.id} className="hover:bg-gray-50 transition-colors text-sm text-gray-700">
                      {/* Image column */}
                      <td className="px-6 py-4">
                        {photoSrc ? (
                          <img
                            src={photoSrc}
                            alt={event.name}
                            className="w-16 h-10 object-cover rounded border border-gray-200"
                          />
                        ) : (
                          <div className="w-16 h-10 bg-gray-100 rounded border border-gray-200 flex items-center justify-center">
                            <i className="fas fa-image text-gray-400 text-xs"></i>
                          </div>
                        )}
                      </td>
                      <td className="px-6 py-4 font-bold text-gray-900">{event.name}</td>
                      <td className="px-6 py-4">{dateStr}</td>
                      <td className="px-6 py-4">{event.time}</td>
                      <td className="px-6 py-4">{event.location}</td>
                      <td className="px-6 py-4 text-center">
                        <div className="flex justify-center gap-2 items-center">
                          <Link
                            href={`/admin/events/view/${event.id}`}
                            className="bg-[#0056b3] text-white px-3 py-1.5 rounded-md text-xs font-bold hover:bg-blue-800 transition-colors no-underline"
                          >
                            View
                          </Link>
                          <Link
                            href={`/admin/events/edit/${event.id}`}
                            className="bg-green-600 text-white px-3 py-1.5 rounded-md text-xs font-bold hover:bg-green-700 transition-colors no-underline"
                          >
                            Edit
                          </Link>
                          <button
                            onClick={() => handleDelete(event.id)}
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
                    No events found.
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
