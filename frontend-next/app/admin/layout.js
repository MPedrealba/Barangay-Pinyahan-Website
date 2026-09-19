'use client';
import { useState, useEffect, useRef } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import Link from 'next/link';
import { getPhotoUrl } from '@/lib/api';

const SETUP_PATH = '/admin/setup-password';

function isTokenExpired(token) {
  if (!token) return true;
  try {
    const parts = token.split('.');
    if (parts.length !== 3) return true;
    const payload = JSON.parse(atob(parts[1]));
    if (payload.exp && payload.exp * 1000 <= Date.now()) {
      return true;
    }
    return false;
  } catch {
    return true;
  }
}

export default function AdminLayout({ children }) {
  const router   = useRouter();
  const pathname = usePathname();

  const [adminName,         setAdminName]         = useState('Loading...');
  const [adminRole,         setAdminRole]         = useState('Administrator');
  const [adminAvatar,       setAdminAvatar]       = useState(null);
  const [isNewAccount,      setIsNewAccount]      = useState(false);
  const [isLoading,         setIsLoading]         = useState(true);
  const [unreadNotifCount,  setUnreadNotifCount]  = useState(0);
  const [recentNotifs,      setRecentNotifs]      = useState([]);
  const [notifDropdownOpen, setNotifDropdownOpen] = useState(false);
  const notifDropdownRef                          = useRef(null);

  // ── Periodic & Focus-based Expiration Listener ────────────────────────────
  useEffect(() => {
    const checkToken = () => {
      const token = localStorage.getItem('token');
      if (!token || isTokenExpired(token)) {
        localStorage.removeItem('token');
        localStorage.removeItem('admin');
        localStorage.removeItem('isNewAccount');
        router.replace('/login?expired=true');
      }
    };

    const interval = setInterval(checkToken, 30000);
    window.addEventListener('focus', checkToken);
    return () => {
      clearInterval(interval);
      window.removeEventListener('focus', checkToken);
    };
  }, [router]);

  // ── Security + First-Login Enforcement ──────────────────────────────────
  useEffect(() => {
    const token      = localStorage.getItem('token');
    const newAccount = localStorage.getItem('isNewAccount') === 'true';

    // 1. No token or expired token → clear and redirect to login
    if (!token || isTokenExpired(token)) {
      localStorage.removeItem('token');
      localStorage.removeItem('admin');
      localStorage.removeItem('isNewAccount');
      router.replace('/login?expired=true');
      setIsLoading(false);
      return;
    }

    // 2. Load display name & profile
    const adminData = JSON.parse(localStorage.getItem('admin') || '{}');
    setAdminName(adminData.full_name || adminData.username || 'Admin');
    setAdminRole(adminData.role || 'Administrator');
    setAdminAvatar(adminData.avatar_url || null);

    // 3. Enforce first-login gate
    setIsNewAccount(newAccount);

    if (newAccount && pathname !== SETUP_PATH) {
      // New account trying to access any page other than setup → force them back
      router.replace(SETUP_PATH);
      // Keep isLoading true so the page content doesn't flash
      return;
    }

    if (!newAccount && pathname === SETUP_PATH) {
      // Established user accidentally hitting setup page → send to dashboard
      router.replace('/admin/dashboard');
      return;
    }

    // All checks passed — render normally
    setIsLoading(false);
  }, [pathname, router]);

  // ── Header Notifications & Unread Listener ──────────────────────────────
  const fetchHeaderNotifications = async () => {
    try {
      const token = localStorage.getItem('token');
      if (!token) return;
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/admin/notifications`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (res.ok) {
        const data = await res.json();
        const list = data.notifications || [];
        setRecentNotifs(list.slice(0, 5));
        setUnreadNotifCount(list.filter((n) => !n.is_read).length);
      }
    } catch (err) {
      console.error('Failed to load header notifications:', err);
    }
  };

  useEffect(() => {
    fetchHeaderNotifications();
    const interval = setInterval(fetchHeaderNotifications, 30000);
    window.addEventListener('focus', fetchHeaderNotifications);
    return () => {
      clearInterval(interval);
      window.removeEventListener('focus', fetchHeaderNotifications);
    };
  }, []);

  // Close dropdown on click outside
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (notifDropdownRef.current && !notifDropdownRef.current.contains(e.target)) {
        setNotifDropdownOpen(false);
      }
    };
    if (notifDropdownOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [notifDropdownOpen]);

  const handleHeaderNotifClick = async (notif) => {
    setNotifDropdownOpen(false);
    if (!notif.is_read) {
      try {
        const token = localStorage.getItem('token');
        await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/admin/notifications/${notif.id}/read`, {
          method: 'PUT',
          headers: { 'Authorization': `Bearer ${token}` }
        });
        setRecentNotifs((prev) =>
          prev.map((n) => (n.id === notif.id ? { ...n, is_read: true } : n))
        );
        setUnreadNotifCount((prev) => Math.max(0, prev - 1));
      } catch (err) {
        console.error('Error marking read:', err);
      }
    }
    if (notif.link) {
      router.push(notif.link);
    }
  };

  const handleHeaderMarkAllRead = async () => {
    try {
      const token = localStorage.getItem('token');
      await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/admin/notifications/read-all`, {
        method: 'PUT',
        headers: { 'Authorization': `Bearer ${token}` }
      });
      setRecentNotifs((prev) => prev.map((n) => ({ ...n, is_read: true })));
      setUnreadNotifCount(0);
    } catch (err) {
      console.error('Error marking all read:', err);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('admin');
    localStorage.removeItem('isNewAccount');
    router.push('/login');
  };

  const navItems = [
    { name: 'HOME',              icon: 'fa-home',               path: '/admin/dashboard'          },
    { name: 'COMPLAINTS',        icon: 'fa-exclamation-circle', path: '/admin/complaints'         },
    { name: 'SERVICES',          icon: 'fa-hands-helping',      path: '/admin/services'           },
    { name: 'SERVICE REQUESTS',  icon: 'fa-file-alt',           path: '/admin/service-requests'   },
    { name: "CITIZEN'S CHARTER", icon: 'fa-scroll',             path: '/admin/citizens-charter'   },
    { name: 'NEWS',              icon: 'fa-newspaper',          path: '/admin/news'               },
    { name: 'EVENTS',            icon: 'fa-calendar-alt',       path: '/admin/events'             },
    { name: 'REPORTS',           icon: 'fa-chart-line',         path: '/admin/reports'            },
    { name: 'NOTIFICATIONS',     icon: 'fa-bell',               path: '/admin/notifications'      },
    { name: 'ACCOUNTS SETTING',  icon: 'fa-users-cog',          path: '/admin/accounts'           },
  ];

  // ── Blank loading screen prevents dashboard flash before redirect ────────
  if (isLoading) {
    return (
      <div className="flex h-screen items-center justify-center bg-[#f4f7f6]">
        <i className="fas fa-spinner fa-spin text-[#0056b3] text-3xl" />
      </div>
    );
  }

  // ── Setup-password view: full-screen, no sidebar, no header ─────────────
  if (isNewAccount) {
    return <>{children}</>;
  }

  // ── Normal authenticated view ────────────────────────────────────────────
  return (
    <div className="flex h-screen bg-[#f4f7f6] overflow-hidden">

      {/* Sidebar — hidden for new accounts (enforced above, this is belt-and-suspenders) */}
      {!isNewAccount && (
        <aside className="w-[260px] bg-[#0056b3] text-white flex flex-col shadow-xl z-20 shrink-0">
          <div className="p-5 flex items-center gap-4 border-b border-white/10">
            <img src="/images/brgypinyahanseal.jpg" alt="Seal" className="w-12 h-12 object-contain" />
            <h2 className="text-lg font-bold leading-tight">Barangay<br />Pinyahan</h2>
          </div>

          <ul className="flex-1 overflow-y-auto py-4 space-y-1">
            {navItems.map((item) => {
              const isActive = pathname === item.path || pathname.startsWith(item.path + '/');
              return (
                <li key={item.name}>
                  <Link href={item.path}>
                    <div className={`px-6 py-3 flex items-center gap-4 text-sm font-semibold transition-colors
                      ${isActive
                        ? 'bg-white/10 border-l-4 border-[#ff9800] text-white'
                        : 'text-white/80 hover:bg-white/5 hover:text-white border-l-4 border-transparent'
                      }`}>
                      <i className={`fas ${item.icon} w-5 text-center`}></i>
                      {item.name}
                    </div>
                  </Link>
                </li>
              );
            })}
          </ul>

          <div className="p-3.5 border-t border-white/10 bg-black/20">
            <div className="flex items-center justify-between gap-2">
              <Link
                href="/admin/profile"
                className={`flex items-center gap-3 flex-1 min-w-0 p-1.5 rounded-xl transition-all group ${
                  pathname === '/admin/profile'
                    ? 'bg-white/20 ring-1 ring-white/30'
                    : 'hover:bg-white/10'
                }`}
                title="View Personal Profile Dashboard"
              >
                <div className="w-9 h-9 rounded-xl bg-white/20 overflow-hidden flex items-center justify-center shrink-0 border border-white/20 shadow-sm">
                  {adminAvatar ? (
                    <img
                      src={getPhotoUrl(adminAvatar)}
                      alt="Avatar"
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <span className="text-white font-black text-sm">
                      {adminName.charAt(0).toUpperCase()}
                    </span>
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-bold text-white truncate group-hover:text-amber-300 transition-colors">
                    {adminName}
                  </p>
                  <p className="text-[11px] text-white/70 truncate flex items-center gap-1">
                    <span>{adminRole}</span>
                    <i className="fas fa-chevron-right text-[8px] opacity-0 group-hover:opacity-100 transition-opacity"></i>
                  </p>
                </div>
              </Link>
              <button
                onClick={handleLogout}
                className="w-8 h-8 rounded-lg text-white/70 hover:text-white hover:bg-white/10 flex items-center justify-center transition-colors shrink-0"
                title="Sign Out"
              >
                <i className="fas fa-sign-out-alt text-sm"></i>
              </button>
            </div>
          </div>
        </aside>
      )}

      {/* Main Content Area */}
      <main className="flex-1 flex flex-col min-w-0">
        {/* Top Header */}
        <header className="h-[70px] bg-white flex justify-between items-center px-8 shadow-sm shrink-0 z-10">
          <h1 className="text-2xl font-bold text-gray-800 tracking-tight">
            Welcome, {adminName.split(' ')[0]}!
          </h1>
          {/* Notification Bell with Interactive Dropdown */}
          <div className="relative" ref={notifDropdownRef}>
            <button
              onClick={() => setNotifDropdownOpen((prev) => !prev)}
              title="Notifications"
              className="relative cursor-pointer w-10 h-10 flex items-center justify-center rounded-full bg-gray-50 hover:bg-gray-100 transition-colors border border-gray-200 shadow-sm"
            >
              <i className="fas fa-bell text-gray-600 text-lg"></i>
              {unreadNotifCount > 0 && (
                <span className="absolute -top-1 -right-1 min-w-[18px] h-[18px] px-1 bg-red-500 text-white text-[10px] font-black rounded-full flex items-center justify-center border-2 border-white shadow-sm">
                  {unreadNotifCount > 99 ? '99+' : unreadNotifCount}
                </span>
              )}
            </button>

            {/* Dropdown Menu */}
            {notifDropdownOpen && (
              <div className="absolute right-0 mt-3 w-80 sm:w-96 bg-white rounded-xl shadow-2xl border border-gray-200 z-50 overflow-hidden animate-in fade-in slide-in-from-top-2 duration-150">
                <div className="px-4 py-3 bg-gray-50 border-b border-gray-100 flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-sm text-gray-800">Notifications</span>
                    {unreadNotifCount > 0 && (
                      <span className="px-2 py-0.5 text-[10px] font-black rounded-full bg-blue-100 text-blue-700">
                        {unreadNotifCount} new
                      </span>
                    )}
                  </div>
                  {unreadNotifCount > 0 && (
                    <button
                      onClick={handleHeaderMarkAllRead}
                      className="text-xs text-blue-600 hover:text-blue-800 font-semibold transition-colors"
                    >
                      Mark all read
                    </button>
                  )}
                </div>

                <div className="max-h-80 overflow-y-auto divide-y divide-gray-100">
                  {recentNotifs.length === 0 ? (
                    <div className="py-8 text-center text-gray-400">
                      <i className="fas fa-bell-slash text-2xl mb-1 text-gray-300 block"></i>
                      <p className="text-xs font-medium">No notifications yet</p>
                    </div>
                  ) : (
                    recentNotifs.map((n) => (
                      <div
                        key={n.id}
                        onClick={() => handleHeaderNotifClick(n)}
                        className={`p-3.5 flex items-start gap-3 hover:bg-blue-50/50 transition-colors cursor-pointer group ${
                          !n.is_read ? 'bg-blue-50/30' : ''
                        }`}
                      >
                        <div className="w-8 h-8 rounded-full bg-blue-50 border border-blue-100 flex items-center justify-center shrink-0 mt-0.5 text-blue-600 group-hover:scale-105 transition-transform">
                          <i className={`${n.icon_class || 'fas fa-bell'} text-xs`}></i>
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center justify-between gap-1 mb-0.5">
                            <p className="text-xs font-bold text-gray-900 truncate group-hover:text-blue-700">
                              {n.title}
                            </p>
                            {!n.is_read && (
                              <span className="w-2 h-2 rounded-full bg-blue-500 shrink-0"></span>
                            )}
                          </div>
                          <p className="text-xs text-gray-600 line-clamp-2 leading-tight">
                            {n.message}
                          </p>
                        </div>
                      </div>
                    ))
                  )}
                </div>

                <div className="p-2.5 bg-gray-50 border-t border-gray-100 text-center">
                  <Link
                    href="/admin/notifications"
                    onClick={() => setNotifDropdownOpen(false)}
                    className="text-xs font-bold text-[#0056b3] hover:text-blue-800 hover:underline block py-1"
                  >
                    View all notifications &rarr;
                  </Link>
                </div>
              </div>
            )}
          </div>
        </header>

        {/* Dynamic Page Content */}
        <div className="flex-1 overflow-auto">
          {children}
        </div>
      </main>
    </div>
  );
}