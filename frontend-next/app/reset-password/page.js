'use client';

import { useState, useEffect, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';

function ResetPasswordForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const token = searchParams.get('token') || '';

  const [verifyingToken, setVerifyingToken] = useState(true);
  const [tokenValid, setTokenValid] = useState(false);
  const [accountEmail, setAccountEmail] = useState('');

  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showNewPw, setShowNewPw] = useState(false);
  const [showConfirmPw, setShowConfirmPw] = useState(false);

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const API_BASE = process.env.NEXT_PUBLIC_API_URL ||
    (typeof window !== 'undefined' && window.location.hostname.includes('onrender.com')
      ? 'https://barangay-pinyahan-website-bz6q.onrender.com'
      : 'http://localhost:5000');

  // ── Verify Token on Mount ────────────────────────────────────────────────
  useEffect(() => {
    if (!token) {
      setVerifyingToken(false);
      setTokenValid(false);
      setError('No recovery token was found in the link. Please request a new password recovery link.');
      return;
    }

    const verifyToken = async () => {
      try {
        setVerifyingToken(true);
        setError('');

        const res = await fetch(`${API_BASE}/api/auth/verify-reset-code`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ token }),
        });

        let data;
        try {
          data = await res.json();
        } catch {
          throw new Error(`Server returned status ${res.status} (${res.statusText || 'Error'}). Please check backend connection.`);
        }

        if (!res.ok) {
          throw new Error(data?.error || 'This recovery link has expired or has already been used.');
        }

        setTokenValid(true);
        if (data.email) {
          setAccountEmail(data.email);
        }
      } catch (err) {
        setTokenValid(false);
        setError(err.message || 'Invalid or expired recovery link.');
      } finally {
        setVerifyingToken(false);
      }
    };

    verifyToken();
  }, [token, API_BASE]);

  // ── Submit New Password ──────────────────────────────────────────────────
  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (newPassword.length < 8) {
      setError('New password must be at least 8 characters long.');
      return;
    }
    if (newPassword !== confirmPassword) {
      setError('Passwords do not match.');
      return;
    }

    try {
      setLoading(true);
      const res = await fetch(`${API_BASE}/api/auth/reset-password`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          token,
          new_password: newPassword,
        }),
      });

      let data;
      try {
        data = await res.json();
      } catch {
        throw new Error(`Server returned status ${res.status} (${res.statusText || 'Error'}). Please check backend connection.`);
      }

      if (!res.ok) {
        throw new Error(data?.error || 'Failed to reset password.');
      }

      // Success: redirect to login with query param
      router.push('/login?reset=success');
    } catch (err) {
      setError(err.message || 'Failed to update password. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="w-full max-w-md bg-white shadow-md rounded-lg border border-gray-200 p-8 sm:p-10 relative overflow-hidden">
      {/* Top Animated Progress Bar */}
      {loading && (
        <div className="absolute top-0 left-0 right-0 h-1 bg-blue-100 overflow-hidden">
          <div className="h-full bg-gradient-to-r from-blue-500 via-[#0056b3] to-blue-600 animate-pulse w-full"></div>
        </div>
      )}
      {/* LGU Official Header */}
      <div className="flex items-center gap-3.5 pb-5 mb-5 border-b border-gray-200">
        <img
          src="/images/Brgy._Pinyahan_Seal.png"
          alt="Barangay Pinyahan Seal"
          className="w-12 h-12 object-contain"
        />
        <div>
          <p className="text-[11px] font-semibold tracking-wider text-gray-500 uppercase">
            Republic of the Philippines • Quezon City
          </p>
          <h1 className="text-base font-bold text-gray-900 leading-tight">
            Barangay Pinyahan Portal
          </h1>
        </div>
      </div>

      {/* Back Link */}
      <div className="mb-4">
        <Link
          href="/login"
          className="inline-flex items-center gap-1.5 text-xs font-semibold text-gray-600 hover:text-blue-700 transition-colors"
        >
          <i className="fas fa-arrow-left text-[10px]"></i>
          <span>Back to Admin Login</span>
        </Link>
      </div>

      <h2 className="text-xl font-bold text-gray-900 tracking-tight mb-1">Set New Password</h2>
      <p className="text-xs text-gray-600 mb-6 leading-relaxed">
        {accountEmail
          ? `Configuring a new administrator password for ${accountEmail}`
          : 'Enter and confirm your new administrator account password.'}
      </p>

      {/* Loading state while checking token */}
      {verifyingToken && (
        <div className="py-10 text-center text-gray-500 flex flex-col items-center justify-center gap-2">
          <i className="fas fa-circle-notch fa-spin text-2xl text-[#0056b3]"></i>
          <p className="text-xs font-semibold text-gray-600">Validating security recovery link…</p>
        </div>
      )}

      {/* Invalid or Expired Token State */}
      {!verifyingToken && !tokenValid && (
        <div className="space-y-4">
          <div className="p-3.5 text-xs text-red-800 bg-red-50 border border-red-200 rounded-md flex items-start gap-2.5 font-medium">
            <i className="fas fa-exclamation-circle text-red-600 mt-0.5"></i>
            <span>{error || 'This recovery link is invalid, expired, or has already been used.'}</span>
          </div>

          <Link
            href="/forgot-password"
            className="w-full py-2.5 px-4 text-sm font-semibold text-center text-white bg-[#0056b3] hover:bg-blue-800 active:bg-blue-900 rounded-md transition-colors shadow-sm block"
          >
            Request New Recovery Code
          </Link>
        </div>
      )}

      {/* Valid Token - New Password Form */}
      {!verifyingToken && tokenValid && (
        <form onSubmit={handleSubmit} className="space-y-4">
          {error && (
            <div className="p-3.5 mb-5 text-xs text-red-800 bg-red-50 border border-red-200 rounded-md flex items-start gap-2.5 font-medium">
              <i className="fas fa-exclamation-circle text-red-600 mt-0.5"></i>
              <span>{error}</span>
            </div>
          )}

          {/* New Password */}
          <div>
            <label htmlFor="new-password" className="block text-xs font-semibold text-gray-700 uppercase tracking-wider mb-1.5">
              New Password
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-gray-400">
                <i className="fas fa-lock text-xs"></i>
              </div>
              <input
                id="new-password"
                type={showNewPw ? 'text' : 'password'}
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                placeholder="Minimum 8 characters"
                className="w-full pl-9 pr-10 py-2.5 text-sm text-gray-900 placeholder-gray-400 bg-white border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-600 focus:border-blue-600 transition-colors"
                required
              />
              <button
                type="button"
                onClick={() => setShowNewPw(!showNewPw)}
                className="absolute inset-y-0 right-0 pr-3.5 flex items-center text-gray-400 hover:text-gray-600"
              >
                <i className={`fas ${showNewPw ? 'fa-eye-slash' : 'fa-eye'} text-xs`}></i>
              </button>
            </div>
          </div>

          {/* Confirm Password */}
          <div>
            <label htmlFor="confirm-password" className="block text-xs font-semibold text-gray-700 uppercase tracking-wider mb-1.5">
              Confirm New Password
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-gray-400">
                <i className="fas fa-lock text-xs"></i>
              </div>
              <input
                id="confirm-password"
                type={showConfirmPw ? 'text' : 'password'}
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder="Re-enter new password"
                className="w-full pl-9 pr-10 py-2.5 text-sm text-gray-900 placeholder-gray-400 bg-white border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-600 focus:border-blue-600 transition-colors"
                required
              />
              <button
                type="button"
                onClick={() => setShowConfirmPw(!showConfirmPw)}
                className="absolute inset-y-0 right-0 pr-3.5 flex items-center text-gray-400 hover:text-gray-600"
              >
                <i className={`fas ${showConfirmPw ? 'fa-eye-slash' : 'fa-eye'} text-xs`}></i>
              </button>
            </div>
          </div>

          {/* Loading Indicator Banner */}
          {loading && (
            <div className="p-3 bg-blue-50/90 border border-blue-200 rounded-md flex items-center gap-3 animate-pulse">
              <div className="w-5 h-5 border-2 border-[#0056b3] border-t-transparent rounded-full animate-spin shrink-0"></div>
              <div className="text-xs text-blue-900">
                <p className="font-bold">Updating Password...</p>
                <p className="text-[11px] text-blue-700">Encrypting credentials and updating your account. Please wait...</p>
              </div>
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full py-2.5 px-4 text-sm font-semibold text-white bg-[#0056b3] hover:bg-blue-800 active:bg-blue-900 rounded-md transition-all shadow-sm disabled:opacity-80 disabled:cursor-not-allowed flex items-center justify-center gap-2.5"
          >
            {loading ? (
              <>
                <svg className="animate-spin h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z"></path>
                </svg>
                <span className="tracking-wide">Updating Password…</span>
              </>
            ) : (
              <span>Save New Password & Log In</span>
            )}
          </button>
        </form>
      )}

      {/* Footer Link */}
      <div className="mt-8 pt-4 border-t border-gray-200 text-center">
        <Link href="/" className="text-xs font-semibold text-gray-600 hover:text-blue-700 transition-colors">
          ← Return to Barangay Pinyahan Portal Home
        </Link>
      </div>
    </div>
  );
}

export default function ResetPasswordPage() {
  return (
    <main
      className="min-h-screen w-full bg-cover bg-center flex items-center justify-start p-4 sm:p-8 md:p-12 lg:px-24"
      style={{ backgroundImage: "url('/images/barangay_pinyahan_admin_seal.png')" }}
    >
      <Suspense
        fallback={
          <div className="w-full max-w-md bg-white shadow-md rounded-lg border border-gray-200 p-8 sm:p-10 text-center py-16">
            <i className="fas fa-circle-notch fa-spin text-2xl text-[#0056b3] mb-2"></i>
            <p className="text-xs font-semibold text-gray-600">Loading…</p>
          </div>
        }
      >
        <ResetPasswordForm />
      </Suspense>
    </main>
  );
}
