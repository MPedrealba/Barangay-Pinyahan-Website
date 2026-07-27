import PublicNavigation from '@/components/PublicNavigation';
import Link from 'next/link';

export default function PublicLayout({ children }) {
  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      <PublicNavigation />
      <main className="flex-1">
        {children}
      </main>

      {/* ═══ Footer ═══ */}
      <footer className="bg-[#0056b3] text-white py-8 mt-12">
        <div className="max-w-7xl mx-auto px-6 flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <img src="/images/brgypinyahanseal.jpg" alt="Seal" className="w-9 h-9 object-contain opacity-90" />
            <div>
              <p className="font-bold text-sm">Barangay Pinyahan</p>
              <p className="text-xs text-white/70">Quezon City, Philippines</p>
            </div>
          </div>
          <p className="text-xs text-white/60 text-center">
            © {new Date().getFullYear()} Barangay Pinyahan Digital Portal. All rights reserved.
          </p>
          <div className="flex items-center gap-4 text-xs text-white/70">
            <a href="/services"   className="hover:text-white transition-colors no-underline">Services</a>
            <a href="/news"       className="hover:text-white transition-colors no-underline">News</a>
            <a href="/complaints" className="hover:text-white transition-colors no-underline">File Complaint</a>
          </div>
        </div>
      </footer>

      {/* ═══ Sub-Footer: Admin Login ═══ */}
      <div className="bg-[#003366] flex flex-wrap justify-between items-center px-6 py-2 text-xs gap-2">
        <Link
          href="/login"
          className="text-white/50 hover:text-white/90 no-underline inline-flex items-center gap-1.5 min-h-[44px] transition-colors"
        >
          <i className="fas fa-lock" aria-hidden="true" />
          <span>Admin Login</span>
        </Link>
        <span className="text-white/40">
          © {new Date().getFullYear()} Barangay Pinyahan. All rights reserved.
        </span>
      </div>
    </div>
  );
}
