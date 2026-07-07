'use client';
import { useState, useEffect } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import Link from 'next/link';

const SETUP_PATH = '/admin/setup-password';

export default function AdminLayout({ children }) {
  const router   = useRouter();
  const pathname = usePathname();

  const [adminName,    setAdminName]    = useState('Loading...');
  const [isNewAccount, setIsNewAccount] = useState(false);
  const [isLoading,    setIsLoading]    = useState(true);

  // ── Security + First-Login Enforcement ──────────────────────────────────
  useEffect(() => {
    const token      = localStorage.getItem('token');
    const newAccount = localStorage.getItem('isNewAccount') === 'true';

    // 1. No token → back to login
    if (!token) {
      router.replace('/login');
      setIsLoading(false);
      return;
    }

    // 2. Load display name
    const adminData = JSON.parse(localStorage.getItem('admin') || '{}');
    setAdminName(adminData.full_name || 'Admin');

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

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('admin');
    localStorage.removeItem('isNewAccount');
    router.push('/login');
  };

  const navItems = [
    { name: 'HOME',             icon: 'fa-home',            path: '/admin/dashboard'     },
    { name: 'COMPLAINTS',       icon: 'fa-exclamation-circle', path: '/admin/complaints' },
    { name: 'NEWS',             icon: 'fa-newspaper',       path: '/admin/news'           },
    { name: 'EVENTS',           icon: 'fa-calendar-alt',    path: '/admin/events'         },
    { name: 'SERVICES',         icon: 'fa-hands-helping',   path: '/admin/services'       },
    { name: 'REPORTS',          icon: 'fa-chart-line',      path: '/admin/reports'        },
    { name: 'NOTIFICATIONS',    icon: 'fa-bell',            path: '/admin/notifications'  },
    { name: 'ACCOUNTS SETTING', icon: 'fa-users-cog',       path: '/admin/accounts'       },
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
            <img src="/images/Brgy._Pinyahan_Seal.png" alt="Seal" className="w-12 h-12 object-contain" />
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

          <div className="p-4 border-t border-white/10 bg-black/10">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-white/20 flex items-center justify-center shrink-0">
                <i className="fas fa-user text-white"></i>
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-bold truncate">{adminName}</p>
                <p className="text-xs text-white/70">Administrator</p>
              </div>
              <button onClick={handleLogout} className="text-white/70 hover:text-white p-2 transition-colors">
                <i className="fas fa-sign-out-alt"></i>
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
          <div className="relative cursor-pointer w-10 h-10 flex items-center justify-center rounded-full bg-gray-50 hover:bg-gray-100 transition-colors">
            <i className="fas fa-bell text-gray-600 text-xl"></i>
            <span className="absolute top-2 right-2 w-2.5 h-2.5 bg-red-500 border-2 border-white rounded-full"></span>
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