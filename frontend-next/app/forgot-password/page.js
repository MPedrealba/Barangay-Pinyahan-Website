'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

export default function ForgotPasswordPage() {
  const router = useRouter();

  // Step 1: 'request' (email), Step 2: 'verify' (otp + new password)
  const [step, setStep] = useState('request');
  const [email, setEmail] = useState('');
  const [otpCode, setOtpCode] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showNewPw, setShowNewPw] = useState(false);
  const [showConfirmPw, setShowConfirmPw] = useState(false);

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  // Resend countdown timer
  const [resendCooldown, setResendCooldown] = useState(0);

  const API_BASE = process.env.NEXT_PUBLIC_API_URL ||
    (typeof window !== 'undefined' && window.location.hostname.includes('onrender.com')
      ? 'https://barangay-pinyahan-website-bz6q.onrender.com'
      : 'http://localhost:5000');

  useEffect(() => {
    let timer;
    if (resendCooldown > 0) {
      timer = setInterval(() => {
        setResendCooldown((prev) => prev - 1);
      }, 1000);
    }
    return () => clearInterval(timer);
  }, [resendCooldown]);

  // ── Step 1: Request Password Reset ──────────────────────────────────────
  const handleRequestReset = async (e) => {
    e?.preventDefault?.();
    setError('');
    setSuccess('');

    if (!email.trim()) {
      setError('Please enter your registered administrative email address.');
      return;
    }

    try {
      setLoading(true);
      const res = await fetch(`${API_BASE}/api/auth/forgot-password`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: email.trim() }),
      });

      let data;
      try {
        data = await res.json();
      } catch {
        throw new Error(`Server returned status ${res.status} (${res.statusText || 'Error'}). Please check backend connection.`);
      }

      if (!res.ok) {
        throw new Error(data?.error || 'Failed to process password recovery request.');
      }

      setStep('verify');
      setResendCooldown(60);
      setSuccess('Verification code sent! Please check your email inbox.');
    } catch (err) {
      setError(err.message || 'Something went wrong. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  // ── Step 2: Verify OTP & Reset Password ─────────────────────────────────
  const handleResetPassword = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    if (!otpCode.trim()) {
      setError('Please enter the 6-digit verification code.');
      return;
    }
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
          email: email.trim(),
          otp_code: otpCode.trim(),
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

      // Success: redirect back to login with success flag
      router.push('/login?reset=success');
    } catch (err) {
      setError(err.message || 'Failed to reset password.');
    } finally {
      setLoading(false);
    }
  };

  // ── Resend Code Handler ──────────────────────────────────────────────────
  const handleResendCode = async () => {
    if (resendCooldown > 0 || loading) return;
    await handleRequestReset();
  };

  return (
    <main
      className="min-h-screen w-full bg-cover bg-center flex items-center justify-start p-4 sm:p-8 md:p-12 lg:px-24"
      style={{ backgroundImage: "url('/images/barangay_pinyahan_admin_seal.png')" }}
    >
      {/* Grounded Administrative Panel */}
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

        <h2 className="text-xl font-bold text-gray-900 tracking-tight mb-1">
          {step === 'request' ? 'Password Recovery' : 'Verify & Reset Password'}
        </h2>
        <p className="text-xs text-gray-600 mb-6 leading-relaxed">
          {step === 'request'
            ? 'Enter your registered administrative email address to receive a 6-digit verification code.'
            : `Enter the 6-digit verification code sent to ${email} along with your new password.`}
        </p>

        {/* Error Alert */}
        {error && (
          <div className="p-3 mb-5 text-xs text-red-800 bg-red-50 border border-red-200 rounded-md flex items-start gap-2.5 font-medium">
            <i className="fas fa-exclamation-circle text-red-600 mt-0.5"></i>
            <span>{error}</span>
          </div>
        )}

        {/* Success Alert */}
        {success && !error && (
          <div className="p-3 mb-5 text-xs text-emerald-800 bg-emerald-50 border border-emerald-200 rounded-md flex items-start gap-2.5 font-medium">
            <i className="fas fa-check-circle text-emerald-600 mt-0.5"></i>
            <span>{success}</span>
          </div>
        )}

        {/* ── STEP 1: REQUEST CODE ────────────────────────────────────────── */}
        {step === 'request' && (
          <form onSubmit={handleRequestReset} className="space-y-4">
            <div>
              <label htmlFor="email" className="block text-xs font-semibold text-gray-700 uppercase tracking-wider mb-1.5">
                Official Admin Email
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-gray-400">
                  <i className="fas fa-envelope text-xs"></i>
                </div>
                <input
                  id="email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="admin@barangaypinyahan.gov.ph"
                  className="w-full pl-9 pr-3.5 py-2.5 text-sm text-gray-900 placeholder-gray-400 bg-white border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-600 focus:border-blue-600 transition-colors"
                  required
                />
              </div>
            </div>

            {/* Loading Indicator Banner */}
            {loading && (
              <div className="p-3 bg-blue-50/90 border border-blue-200 rounded-md flex items-center gap-3 animate-pulse">
                <div className="w-5 h-5 border-2 border-[#0056b3] border-t-transparent rounded-full animate-spin shrink-0"></div>
                <div className="text-xs text-blue-900">
                  <p className="font-bold">Dispatching Verification Code...</p>
                  <p className="text-[11px] text-blue-700">Connecting to secure mail server. Please wait...</p>
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
                  <span className="tracking-wide">Sending Verification Code…</span>
                </>
              ) : (
                <span>Send Verification Code</span>
              )}
            </button>
          </form>
        )}

        {/* ── STEP 2: VERIFY OTP & RESET PASSWORD ────────────────────────── */}
        {step === 'verify' && (
          <form onSubmit={handleResetPassword} className="space-y-4">
            {/* OTP Code */}
            <div>
              <label htmlFor="otp" className="block text-xs font-semibold text-gray-700 uppercase tracking-wider mb-1.5">
                6-Digit Verification Code
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-gray-400">
                  <i className="fas fa-shield-alt text-xs"></i>
                </div>
                <input
                  id="otp"
                  type="text"
                  maxLength={6}
                  value={otpCode}
                  onChange={(e) => setOtpCode(e.target.value.replace(/\D/g, ''))}
                  placeholder="000000"
                  className="w-full pl-9 pr-3.5 py-2.5 text-sm font-mono tracking-widest font-bold text-gray-900 placeholder-gray-400 bg-white border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-600 focus:border-blue-600 transition-colors"
                  required
                />
              </div>
            </div>

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
                  <p className="font-bold">Resetting Password...</p>
                  <p className="text-[11px] text-blue-700">Updating your administrative credentials. Please wait...</p>
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
                <span>Reset Password & Log In</span>
              )}
            </button>

            {/* Resend & Back actions */}
            <div className="pt-2 flex items-center justify-between text-xs text-gray-600">
              <button
                type="button"
                onClick={handleResendCode}
                disabled={resendCooldown > 0 || loading}
                className="font-semibold text-blue-700 hover:text-blue-900 hover:underline disabled:text-gray-400 disabled:no-underline"
              >
                {resendCooldown > 0 ? `Resend code in ${resendCooldown}s` : 'Resend Code'}
              </button>
              <button
                type="button"
                onClick={() => {
                  setStep('request');
                  setOtpCode('');
                  setNewPassword('');
                  setConfirmPassword('');
                  setError('');
                }}
                className="font-medium text-gray-600 hover:text-gray-900 hover:underline"
              >
                Change Email
              </button>
            </div>
          </form>
        )}

        {/* Footer Link */}
        <div className="mt-8 pt-4 border-t border-gray-200 text-center">
          <Link href="/" className="text-xs font-semibold text-gray-600 hover:text-blue-700 transition-colors">
            ← Return to Barangay Pinyahan Portal Home
          </Link>
        </div>
      </div>
    </main>
  );
}
