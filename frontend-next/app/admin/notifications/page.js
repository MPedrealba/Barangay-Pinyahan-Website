'use client';
import { useState, useEffect } from 'react';

// ── Time ago helper ──────────────────────────────────────────────
function timeAgo(dateStr) {
  if (!dateStr) return '';
  const diff = Date.now() - new Date(dateStr).getTime();
  const mins  = Math.floor(diff / 60000);
  const hours = Math.floor(diff / 3600000);
  const days  = Math.floor(diff / 86400000);
  if (mins  < 1)  return 'Just now';
  if (mins  < 60) return `${mins} minute${mins > 1 ? 's' : ''} ago`;
  if (hours < 24) return `${hours} hour${hours > 1 ? 's' : ''} ago`;
  if (days  < 30) return `${days} day${days > 1 ? 's' : ''} ago`;
  return new Date(dateStr).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
}

// ── Icon resolver: use icon_class from DB or fall back by keyword ─
function resolveIcon(iconClass, title = '', message = '') {
  if (iconClass) return iconClass;
  const text = `${title} ${message}`.toLowerCase();
  if (text.includes('complaint'))    return 'fas fa-exclamation-triangle';
  if (text.includes('news'))         return 'fas fa-newspaper';
  if (text.includes('event'))        return 'fas fa-calendar-alt';
  if (text.includes('user'))         return 'fas fa-user';
  if (text.includes('resolved'))     return 'fas fa-check-circle';
  return 'fas fa-bell';
}

function resolveIconColor(iconClass, title = '', message = '') {
  const text = `${iconClass || ''} ${title} ${message}`.toLowerCase();
  if (text.includes('triangle') || text.includes('complaint') || text.includes('warn'))
    return { ring: 'bg-red-100',    icon: 'text-red-500'    };
  if (text.includes('check') || text.includes('resolved'))
    return { ring: 'bg-green-100',  icon: 'text-green-600'  };
  if (text.includes('newspaper') || text.includes('news'))
    return { ring: 'bg-purple-100', icon: 'text-purple-600' };
  if (text.includes('calendar') || text.includes('event'))
    return { ring: 'bg-orange-100', icon: 'text-orange-500' };
  if (text.includes('user'))
    return { ring: 'bg-blue-100',   icon: 'text-blue-600'   };
  return   { ring: 'bg-gray-100',   icon: 'text-gray-500'   };
}

// ── Skeleton loader row ──────────────────────────────────────────
function SkeletonRow() {
  return (
    <div className="flex items-start gap-4 p-5 border-b border-gray-100 animate-pulse">
      <div className="w-10 h-10 rounded-full bg-gray-200 flex-shrink-0 mt-0.5"></div>
      <div className="flex-1 space-y-2">
        <div className="h-3.5 bg-gray-200 rounded w-2/5"></div>
        <div className="h-3 bg-gray-100 rounded w-3/4"></div>
        <div className="h-2.5 bg-gray-100 rounded w-1/4 mt-1"></div>
      </div>
      <div className="w-6 h-6 rounded-full bg-gray-200 flex-shrink-0 mt-1"></div>
    </div>
  );
}

// ── Main Component ───────────────────────────────────────────────
export default function NotificationsPage() {
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading]             = useState(true);
  const [error, setError]                 = useState('');
  const [markingAll, setMarkingAll]       = useState(false);

  // ── Fetch ──
  useEffect(() => {
    const fetchNotifications = async () => {
      try {
        const token = localStorage.getItem('token');
        const res   = await fetch('http://localhost:3000/api/admin/notifications', {
          headers: { 'Authorization': `Bearer ${token}` }
        });

        if (!res.ok) {
          setError('Failed to load notifications. Backend server error.');
          return;
        }

        const data = await res.json();
        setNotifications(data.notifications || []);
      } catch (err) {
        console.error('Notification fetch error:', err);
        setError('Failed to load notifications. Backend server error.');
      } finally {
        setLoading(false);
      }
    };
    fetchNotifications();
  }, []);

  // ── Mark single as read ──
  const handleMarkRead = async (id) => {
    try {
      const token = localStorage.getItem('token');
      await fetch(`http://localhost:3000/api/admin/notifications/${id}/read`, {
        method: 'PUT',
        headers: { 'Authorization': `Bearer ${token}` }
      });
      setNotifications((prev) =>
        prev.map((n) => n.id === id ? { ...n, is_read: true } : n)
      );
    } catch (err) {
      console.error('Mark read error:', err);
    }
  };

  // ── Mark all as read ──
  const handleMarkAllRead = async () => {
    setMarkingAll(true);
    try {
      const token = localStorage.getItem('token');
      await fetch('http://localhost:3000/api/admin/notifications/read-all', {
        method: 'PUT',
        headers: { 'Authorization': `Bearer ${token}` }
      });
      setNotifications((prev) => prev.map((n) => ({ ...n, is_read: true })));
    } catch (err) {
      console.error('Mark all read error:', err);
    } finally {
      setMarkingAll(false);
    }
  };

  const unreadCount = notifications.filter((n) => !n.is_read).length;

  return (
    <div className="p-8 max-w-4xl mx-auto">

      {/* ── Header ── */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-[15px] font-black text-[#002B5B] flex items-center gap-2 uppercase tracking-wide">
            <i className="fas fa-bell text-[#0056b3]"></i> Notifications
          </h1>
          {!loading && !error && (
            <p className="text-sm text-gray-500 mt-1">
              {unreadCount > 0
                ? `You have ${unreadCount} unread notification${unreadCount > 1 ? 's' : ''}.`
                : 'All notifications are marked as read.'}
            </p>
          )}
        </div>

        {/* Mark All as Read */}
        {unreadCount > 0 && !loading && !error && (
          <button
            onClick={handleMarkAllRead}
            disabled={markingAll}
            className="text-gray-600 hover:text-blue-600 font-medium text-sm flex items-center gap-2 transition-colors disabled:opacity-50"
          >
            {markingAll
              ? <><i className="fas fa-spinner fa-spin"></i> Marking...</>
              : <><i className="fas fa-check-double"></i> Mark All as Read</>
            }
          </button>
        )}
      </div>

      {/* ── Main Card ── */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">

        {/* LOADING */}
        {loading && (
          <div>
            {[...Array(5)].map((_, i) => <SkeletonRow key={i} />)}
          </div>
        )}

        {/* ERROR */}
        {!loading && error && (
          <div className="flex items-start gap-4 p-6">
            <div className="w-10 h-10 rounded-full bg-red-100 flex items-center justify-center flex-shrink-0">
              <i className="fas fa-exclamation-circle text-red-500"></i>
            </div>
            <div>
              <p className="font-bold text-red-600 text-sm">Error Loading Notifications</p>
              <p className="text-sm text-gray-500 mt-1">{error}</p>
              <button
                onClick={() => window.location.reload()}
                className="mt-3 text-xs text-blue-600 hover:underline font-semibold"
              >
                Try again
              </button>
            </div>
          </div>
        )}

        {/* EMPTY */}
        {!loading && !error && notifications.length === 0 && (
          <div className="flex flex-col items-center justify-center py-20 px-6 text-center">
            <div className="w-16 h-16 rounded-full bg-gray-100 flex items-center justify-center mb-4">
              <i className="fas fa-bell-slash text-gray-300 text-2xl"></i>
            </div>
            <p className="text-gray-600 font-semibold text-base">You have no new notifications.</p>
            <p className="text-gray-400 text-sm mt-1">When something happens, it will appear here.</p>
          </div>
        )}

        {/* NOTIFICATION LIST */}
        {!loading && !error && notifications.length > 0 && (
          <ul>
            {notifications.map((notif, idx) => {
              const icon       = resolveIcon(notif.icon_class, notif.title, notif.message);
              const colors     = resolveIconColor(notif.icon_class, notif.title, notif.message);
              const isUnread   = !notif.is_read;
              const isLast     = idx === notifications.length - 1;

              return (
                <li
                  key={notif.id}
                  className={`flex items-start gap-4 p-5 transition-colors
                    ${isLast ? '' : 'border-b border-gray-100'}
                    ${isUnread ? 'bg-blue-50 hover:bg-blue-100' : 'hover:bg-gray-50'}
                  `}
                >
                  {/* Icon */}
                  <div className={`w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5 ${colors.ring}`}>
                    <i className={`${icon} text-sm ${colors.icon}`}></i>
                  </div>

                  {/* Content */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-0.5">
                      <p className={`text-sm font-bold text-gray-900 truncate ${isUnread ? 'text-gray-900' : 'text-gray-700'}`}>
                        {notif.title || 'Notification'}
                      </p>
                      {isUnread && (
                        <span className="w-2 h-2 rounded-full bg-blue-500 flex-shrink-0"></span>
                      )}
                    </div>
                    <p className="text-sm text-gray-600 line-clamp-2 leading-snug">
                      {notif.message || ''}
                    </p>
                    <p className="text-xs text-gray-400 mt-1.5 flex items-center gap-1">
                      <i className="fas fa-clock text-gray-300"></i>
                      {timeAgo(notif.created_at)}
                    </p>
                  </div>

                  {/* Mark as Read button */}
                  <div className="flex-shrink-0 mt-0.5">
                    {isUnread ? (
                      <button
                        onClick={() => handleMarkRead(notif.id)}
                        title="Mark as read"
                        className="w-7 h-7 rounded-full bg-white border border-gray-200 flex items-center justify-center text-gray-400 hover:border-blue-400 hover:text-blue-500 hover:bg-blue-50 transition-colors shadow-sm"
                      >
                        <i className="fas fa-check text-xs"></i>
                      </button>
                    ) : (
                      <div
                        title="Read"
                        className="w-7 h-7 rounded-full bg-green-50 border border-green-200 flex items-center justify-center"
                      >
                        <i className="fas fa-check text-xs text-green-500"></i>
                      </div>
                    )}
                  </div>
                </li>
              );
            })}
          </ul>
        )}
      </div>

      {/* Footer count */}
      {!loading && !error && notifications.length > 0 && (
        <p className="text-center text-xs text-gray-400 mt-4">
          Showing {notifications.length} notification{notifications.length > 1 ? 's' : ''}
        </p>
      )}
    </div>
  );
}
