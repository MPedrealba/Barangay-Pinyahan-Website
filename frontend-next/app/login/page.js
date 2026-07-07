'use client';
import { useState } from 'react';
import { useRouter } from 'next/navigation';

export default function LoginPage() {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const router = useRouter();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    
    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/auth/login`), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, password }),
      });
      
      const data = await res.json();

      if (res.ok && data.token) {
        localStorage.setItem('token', data.token);

        if (data.admin) {
          localStorage.setItem('admin', JSON.stringify(data.admin));
        }

        // Persist first-login flag so the layout enforcer can lock the sidebar
        // requires_password_change comes directly from the backend DB field
        const isNew = data.admin?.requires_password_change === true;
        localStorage.setItem('isNewAccount', isNew ? 'true' : 'false');

        // New accounts registered by a Super Admin have requires_password_change = true.
        // Send them to the setup page instead of the dashboard.
        if (isNew) {
          router.push('/admin/setup-password');
        } else {
          router.push('/admin/dashboard');
        }
      } else {
        setError(data.message || 'Invalid credentials');
      }
    } catch (err) {
      console.error("Fetch Error:", err);
      setError('Failed to connect to server');
    }
  };

  return (
    <main 
      className="min-h-screen w-full bg-cover bg-center flex items-center justify-start px-8 md:px-16 lg:px-32"
      style={{ backgroundImage: "url('/images/Admin Login.png')" }}
    >
      <div className="w-full max-w-sm bg-white p-10 rounded-[2.5rem] shadow-2xl">
        <h2 className="text-2xl font-black text-gray-900 mb-8 text-left">
          Admin Login
        </h2>

        {error && (
          <div className="p-3 mb-6 text-sm text-red-700 bg-red-100 rounded-lg text-center font-semibold">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-5">
          <div className="relative">
             <i className="fas fa-user absolute left-5 top-1/2 -translate-y-1/2 text-gray-400 text-sm"></i>
             <input
              type="text"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              placeholder="Username"
              className="w-full pl-12 pr-5 py-3 border border-gray-200 rounded-full bg-slate-50 focus:outline-none focus:ring-2 focus:ring-[#0056b3] focus:bg-white transition-all"
              required
            />
          </div>

          <div className="relative">
             <i className="fas fa-lock absolute left-5 top-1/2 -translate-y-1/2 text-gray-400 text-sm"></i>
             <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              className="w-full pl-12 pr-5 py-3 border border-gray-200 rounded-full bg-slate-50 focus:outline-none focus:ring-2 focus:ring-[#0056b3] focus:bg-white transition-all"
              required
            />
          </div>

          <button
            type="submit"
            className="w-4/5 mx-auto block py-3 mt-4 font-bold text-white bg-[#0056b3] rounded-full hover:bg-blue-800 transition-colors shadow-md"
          >
            Login
          </button>
        </form>

        <div className="mt-6 text-center">
          <a href="/" className="text-xs font-bold text-[#0056b3] hover:underline">
            Back to Homepage
          </a>
        </div>
      </div>
    </main>
  );
}