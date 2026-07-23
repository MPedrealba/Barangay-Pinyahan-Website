'use client';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';

export default function SetupPasswordPage() {
  const router = useRouter();

  const [newPassword,     setNewPassword]     = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error,           setError]           = useState('');
  const [success,         setSuccess]         = useState('');
  const [loading,         setLoading]         = useState(false);

  // Redirect away if the user somehow arrives here without needing a password change
  useEffect(() => {
    const admin = JSON.parse(localStorage.getItem('admin') || '{}');
    const token = localStorage.getItem('token');
    if (!token) {
      router.replace('/login');
    } else if (!admin.requires_password_change) {
      router.replace('/admin/dashboard');
    }
  }, [router]);

  // Password strength criteria
  const criteria = [
    { label: '8+ characters',       met: newPassword.length >= 8         },
    { label: 'Uppercase letter',     met: /[A-Z]/.test(newPassword)       },
    { label: 'Number',               met: /[0-9]/.test(newPassword)       },
    { label: 'Special character',    met: /[^A-Za-z0-9]/.test(newPassword)},
  ];
  const metCount = criteria.filter((c) => c.met).length;
  const strengthLabel = ['', 'Weak', 'Fair', 'Good', 'Strong'][metCount];
  const strengthColor = ['', '#ef5350', '#ff9800', '#66bb6a', '#2e7d32'][metCount];

  async function handleSubmit(e) {
    e.preventDefault();
    setError('');

    if (!newPassword || !confirmPassword) {
      setError('Please fill in both fields.');
      return;
    }
    if (newPassword !== confirmPassword) {
      setError('Passwords do not match.');
      return;
    }
    if (metCount < 3) {
      setError('Password is too weak. Please meet at least 3 of the 4 criteria.');
      return;
    }

    setLoading(true);
    try {
      const admin = JSON.parse(localStorage.getItem('admin') || '{}');

      // Backend endpoint: PUT /api/auth/force-change-password
      // Body: { username, new_password }
      // This also sets requires_password_change = FALSE in the DB
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/auth/force-change-password`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          username:     admin.username,
          new_password: newPassword,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.error || data.message || 'Failed to update password.');
        return;
      }

      // Update the local admin object so the flag no longer triggers a redirect
      const updatedAdmin = { ...admin, requires_password_change: false };
      localStorage.setItem('admin', JSON.stringify(updatedAdmin));

      // Step 3: Clear the first-login gate flag so the layout stops intercepting
      localStorage.removeItem('isNewAccount');
      localStorage.setItem('isNewAccount', 'false');

      setSuccess('Password set successfully! Redirecting to your dashboard…');
      setTimeout(() => router.replace('/admin/dashboard'), 1800);
    } catch (err) {
      console.error('Setup password error:', err);
      setError('Could not connect to server. Please try again.');
    } finally {
      setLoading(false);
    }
  }

  return (
    <main
      className="min-h-screen w-full bg-cover bg-center flex items-center justify-start px-8 md:px-16 lg:px-32"
      style={{ backgroundImage: "url('/images/barangay_pinyahan_admin_seal.png')" }}
    >
      <div className="w-full max-w-sm bg-white p-10 rounded-[2.5rem] shadow-2xl">

        {/* Icon + Title */}
        <div className="flex flex-col items-center mb-6">
          <div
            style={{
              width: '58px', height: '58px', borderRadius: '50%',
              background: 'linear-gradient(135deg, #0056b3, #003d80)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              boxShadow: '0 6px 20px rgba(0,86,179,0.3)', marginBottom: '14px',
            }}
          >
            <i className="fas fa-shield-alt" style={{ color: 'white', fontSize: '1.5rem' }} />
          </div>
          <h2 className="text-xl font-black text-gray-900 text-center leading-snug">
            Welcome! Please<br />secure your account.
          </h2>
          <p className="text-xs text-gray-400 text-center mt-2">
            You must set a new password before continuing.
          </p>
        </div>

        {/* Error banner */}
        {error && (
          <div className="p-3 mb-4 text-sm text-red-700 bg-red-100 rounded-lg text-center font-semibold flex items-center gap-2 justify-center">
            <i className="fas fa-exclamation-circle" />
            {error}
          </div>
        )}

        {/* Success banner */}
        {success && (
          <div className="p-3 mb-4 text-sm text-green-700 bg-green-100 rounded-lg text-center font-semibold flex items-center gap-2 justify-center">
            <i className="fas fa-check-circle" />
            {success}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">

          {/* New Password */}
          <div>
            <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-1">
              New Password
            </label>
            <div className="relative">
              <i className="fas fa-lock absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 text-sm" />
              <input
                type="password"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                placeholder="Create a strong password"
                autoComplete="new-password"
                required
                className="w-full pl-11 pr-5 py-3 border border-gray-200 rounded-full bg-slate-50 focus:outline-none focus:ring-2 focus:ring-[#0056b3] focus:bg-white transition-all text-sm"
              />
            </div>
          </div>

          {/* Password strength meter */}
          {newPassword && (
            <div className="px-1">
              {/* Bar */}
              <div className="flex gap-1.5 mb-2">
                {criteria.map((_, i) => (
                  <div
                    key={i}
                    style={{
                      flex: 1, height: '5px', borderRadius: '4px',
                      background: i < metCount ? strengthColor : '#e5e7eb',
                      transition: 'background 0.3s',
                    }}
                  />
                ))}
              </div>
              {/* Label */}
              <div className="flex justify-between items-center mb-1">
                <span className="text-[0.7rem] font-bold" style={{ color: strengthColor }}>
                  {strengthLabel}
                </span>
                <span className="text-[0.7rem] text-gray-400">{metCount}/4</span>
              </div>
              {/* Criteria list */}
              <ul className="space-y-0.5">
                {criteria.map((c) => (
                  <li key={c.label} className="flex items-center gap-2 text-[0.72rem]" style={{ color: c.met ? '#2e7d32' : '#9ca3af' }}>
                    <i className={`fas ${c.met ? 'fa-check-circle' : 'fa-circle'}`} style={{ fontSize: '0.6rem' }} />
                    {c.label}
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* Confirm Password */}
          <div>
            <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-1">
              Confirm New Password
            </label>
            <div className="relative">
              <i className="fas fa-lock absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 text-sm" />
              <input
                type="password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder="Re-enter password"
                autoComplete="new-password"
                required
                className={`w-full pl-11 pr-5 py-3 border rounded-full bg-slate-50 focus:outline-none focus:ring-2 focus:bg-white transition-all text-sm ${
                  confirmPassword && newPassword !== confirmPassword
                    ? 'border-red-400 focus:ring-red-300'
                    : 'border-gray-200 focus:ring-[#0056b3]'
                }`}
              />
            </div>
            {confirmPassword && newPassword !== confirmPassword && (
              <p className="text-xs text-red-500 mt-1.5 ml-2 flex items-center gap-1">
                <i className="fas fa-exclamation-circle" /> Passwords do not match.
              </p>
            )}
          </div>

          {/* Submit */}
          <button
            type="submit"
            disabled={loading || !!success}
            className="w-4/5 mx-auto block py-3 mt-3 font-bold text-white bg-[#0056b3] rounded-full hover:bg-blue-800 transition-colors shadow-md disabled:opacity-60 disabled:cursor-not-allowed"
          >
            {loading
              ? <><i className="fas fa-spinner fa-spin mr-2" />Setting up…</>
              : 'Set Password & Continue'
            }
          </button>
        </form>
      </div>
    </main>
  );
}
