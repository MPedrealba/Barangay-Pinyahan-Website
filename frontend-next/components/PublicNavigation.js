'use client';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useState, useEffect } from 'react';

const navLinks = [
  { name: 'Home',            href: '/',           icon: 'fa-home'           },
  { name: 'Services',        href: '/services',   icon: 'fa-handshake'      },
  { name: 'News',            href: '/news',       icon: 'fa-newspaper'      },
  { name: 'File a Complaint',href: '/complaints', icon: 'fa-exclamation-circle' },
];

export default function PublicNavigation() {
  const pathname = usePathname();
  const router   = useRouter();
  const [isLoggedIn, setIsLoggedIn] = useState(false);

  useEffect(() => {
    setIsLoggedIn(!!localStorage.getItem('token'));
  }, []);

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('admin');
    setIsLoggedIn(false);
    router.push('/');
  };

  return (
    <header className="w-full bg-white shadow-sm border-b border-gray-100 sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">

        {/* Brand */}
        <Link href="/" className="flex items-center gap-3 no-underline group">
          <img
            src="/images/brgypinyahanseal.jpg"
            alt="Barangay Pinyahan Seal"
            className="w-10 h-10 object-contain"
          />
          <div className="leading-tight">
            <p className="text-[13px] font-black text-[#0056b3] uppercase tracking-wide group-hover:text-blue-800 transition-colors">
              Barangay Pinyahan
            </p>
            <p className="text-[10px] text-gray-400 font-medium">Quezon City, Philippines</p>
          </div>
        </Link>

        {/* Desktop Nav */}
        <nav className="hidden md:flex items-center gap-1">
          {navLinks.map((link) => {
            const active = pathname === link.href || (link.href !== '/' && pathname.startsWith(link.href));
            return (
              <Link
                key={link.href}
                href={link.href}
                className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-semibold transition-colors no-underline
                  ${active
                    ? 'bg-blue-50 text-[#0056b3]'
                    : 'text-gray-600 hover:bg-gray-50 hover:text-[#0056b3]'}`}
              >
                <i className={`fas ${link.icon} text-xs`}></i>
                {link.name}
              </Link>
            );
          })}
        </nav>

        {/* Right side: Admin Login + optional Logout — bottom-left positioning via flex */}
        <div className="flex justify-start items-center gap-4 mt-auto">
          <Link
            href="/admin/dashboard"
            className="flex items-center gap-2 text-sm font-semibold text-gray-500 hover:text-[#0056b3] transition-colors no-underline"
          >
            <i className="fas fa-user-shield text-xs"></i>
            Admin Login
          </Link>
          {isLoggedIn && (
            <button
              onClick={handleLogout}
              className="flex items-center gap-2 text-sm font-semibold text-gray-400 hover:text-red-500 transition-colors"
            >
              <i className="fas fa-sign-out-alt text-xs"></i>
              Logout
            </button>
          )}
        </div>
      </div>

      {/* Mobile Nav */}
      <div className="md:hidden border-t border-gray-100 px-4 py-2 flex gap-1 overflow-x-auto">
        {navLinks.map((link) => {
          const active = pathname === link.href || (link.href !== '/' && pathname.startsWith(link.href));
          return (
            <Link
              key={link.href}
              href={link.href}
              className={`flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-semibold whitespace-nowrap transition-colors no-underline flex-shrink-0
                ${active ? 'bg-blue-50 text-[#0056b3]' : 'text-gray-600 hover:bg-gray-50'}`}
            >
              <i className={`fas ${link.icon}`}></i>
              {link.name}
            </Link>
          );
        })}
      </div>
    </header>
  );
}
