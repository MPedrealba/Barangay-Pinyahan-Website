'use client';

import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { getPhotoUrl } from '@/lib/api';

export default function AdminProfilePage() {
  const router = useRouter();
  const fileInputRef = useRef(null);

  const [loading, setLoading] = useState(true);
  const [profile, setProfile] = useState(null);
  const [stats, setStats] = useState({ complaints_handled: 0, service_requests_processed: 0, total_actions: 0 });
  const [recentActivity, setRecentActivity] = useState([]);
  const [activeTab, setActiveTab] = useState('details'); // 'details' | 'security' | 'activity'

  // Edit Profile Form State
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [isSavingProfile, setIsSavingProfile] = useState(false);
  const [profileSuccessMsg, setProfileSuccessMsg] = useState('');
  const [profileErrorMsg, setProfileErrorMsg] = useState('');

  // Avatar Upload State
  const [isUploadingAvatar, setIsUploadingAvatar] = useState(false);
  const [avatarMsg, setAvatarMsg] = useState('');

  // Password Change Form State
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showCurrentPw, setShowCurrentPw] = useState(false);
  const [showNewPw, setShowNewPw] = useState(false);
  const [showConfirmPw, setShowConfirmPw] = useState(false);
  const [isSavingPw, setIsSavingPw] = useState(false);
  const [pwSuccessMsg, setPwSuccessMsg] = useState('');
  const [pwErrorMsg, setPwErrorMsg] = useState('');

  const API_BASE = process.env.NEXT_PUBLIC_API_URL || '';

  // ── Fetch Profile ────────────────────────────────────────────────────────
  const fetchProfile = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('token');
      if (!token) {
        router.replace('/login');
        return;
      }

      const res = await fetch(`${API_BASE}/api/admin/profile/me`, {
        headers: { Authorization: `Bearer ${token}` }
      });

      if (res.status === 401 || res.status === 403) {
        localStorage.removeItem('token');
        localStorage.removeItem('admin');
        localStorage.removeItem('isNewAccount');
        router.replace('/login?expired=true');
        return;
      }

      if (!res.ok) {
        throw new Error('Failed to load profile data.');
      }

      const data = await res.json();
      setProfile(data.profile);
      setStats(data.stats || { complaints_handled: 0, service_requests_processed: 0, total_actions: 0 });
      setRecentActivity(data.recent_activity || []);

      setFullName(data.profile.full_name || '');
      setEmail(data.profile.email || '');

      // Update localStorage cached admin object with freshest data
      const currentStored = JSON.parse(localStorage.getItem('admin') || '{}');
      const mergedAdmin = { ...currentStored, ...data.profile };
      localStorage.setItem('admin', JSON.stringify(mergedAdmin));
    } catch (err) {
      console.error('Profile fetch error:', err);
      setProfileErrorMsg(err.message || 'Failed to load profile.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProfile();
  }, []);

  // ── Save Personal Details ────────────────────────────────────────────────
  const handleSaveDetails = async (e) => {
    e.preventDefault();
    setProfileSuccessMsg('');
    setProfileErrorMsg('');

    if (!fullName.trim() || !email.trim()) {
      setProfileErrorMsg('Full Name and Email Address are required.');
      return;
    }

    try {
      setIsSavingProfile(true);
      const token = localStorage.getItem('token');
      const res = await fetch(`${API_BASE}/api/admin/profile/me`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({ full_name: fullName.trim(), email: email.trim() })
      });

      if (res.status === 401 || res.status === 403) {
        router.replace('/login?expired=true');
        return;
      }

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Failed to update profile.');
      }

      setProfile(prev => ({ ...prev, ...data.admin }));
      setProfileSuccessMsg('Profile information updated successfully!');

      // Update local storage
      const currentStored = JSON.parse(localStorage.getItem('admin') || '{}');
      localStorage.setItem('admin', JSON.stringify({ ...currentStored, ...data.admin }));

      setTimeout(() => setProfileSuccessMsg(''), 3500);
    } catch (err) {
      setProfileErrorMsg(err.message);
    } finally {
      setIsSavingProfile(false);
    }
  };

  // ── Handle Avatar Upload ─────────────────────────────────────────────────
  const handleAvatarChange = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Check size limit (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      alert('File size exceeds 5MB. Please choose a smaller image.');
      return;
    }

    try {
      setIsUploadingAvatar(true);
      setAvatarMsg('');

      const token = localStorage.getItem('token');
      const formData = new FormData();
      formData.append('avatar', file);

      const res = await fetch(`${API_BASE}/api/admin/profile/me/avatar`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` },
        body: formData
      });

      if (res.status === 401 || res.status === 403) {
        router.replace('/login?expired=true');
        return;
      }

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Failed to upload avatar.');
      }

      setProfile(prev => ({ ...prev, avatar_url: data.avatar_url }));
      setAvatarMsg('Profile photo updated!');

      // Update local storage
      const currentStored = JSON.parse(localStorage.getItem('admin') || '{}');
      localStorage.setItem('admin', JSON.stringify({ ...currentStored, avatar_url: data.avatar_url }));

      setTimeout(() => setAvatarMsg(''), 3000);
    } catch (err) {
      alert(err.message || 'Error uploading photo.');
    } finally {
      setIsUploadingAvatar(false);
    }
  };

  // ── Password Strength Calculation ────────────────────────────────────────
  const pwCriteria = [
    newPassword.length >= 8,
    /[A-Z]/.test(newPassword),
    /[0-9]/.test(newPassword),
    /[^A-Za-z0-9]/.test(newPassword)
  ];
  const metCount = pwCriteria.filter(Boolean).length;
  const strengthConfig = [
    { label: 'Weak', color: '#ef4444', percent: '25%' },
    { label: 'Fair', color: '#f97316', percent: '50%' },
    { label: 'Good', color: '#eab308', percent: '75%' },
    { label: 'Strong', color: '#22c55e', percent: '100%' }
  ];
  const currentStrength = metCount > 0 ? strengthConfig[metCount - 1] : { label: 'Empty', color: '#e2e8f0', percent: '0%' };

  // ── Handle Password Change ───────────────────────────────────────────────
  const handleChangePassword = async (e) => {
    e.preventDefault();
    setPwSuccessMsg('');
    setPwErrorMsg('');

    if (!currentPassword) {
      setPwErrorMsg('Please enter your current password.');
      return;
    }
    if (!newPassword) {
      setPwErrorMsg('Please enter your new password.');
      return;
    }
    if (newPassword.length < 8) {
      setPwErrorMsg('New password must be at least 8 characters long.');
      return;
    }
    if (newPassword !== confirmPassword) {
      setPwErrorMsg('New passwords do not match.');
      return;
    }
    if (metCount < 2) {
      setPwErrorMsg('Password is too weak. Please include letters, numbers, or symbols.');
      return;
    }

    try {
      setIsSavingPw(true);
      const token = localStorage.getItem('token');
      const res = await fetch(`${API_BASE}/api/admin/profile/me/password`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({ current_password: currentPassword, new_password: newPassword })
      });

      if (res.status === 401 || res.status === 403) {
        router.replace('/login?expired=true');
        return;
      }

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Failed to update password.');
      }

      setPwSuccessMsg('Your password has been changed successfully!');
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
      setTimeout(() => setPwSuccessMsg(''), 4000);
    } catch (err) {
      setPwErrorMsg(err.message);
    } finally {
      setIsSavingPw(false);
    }
  };

  if (loading) {
    return (
      <div className="flex h-[80vh] items-center justify-center">
        <div className="text-center">
          <i className="fas fa-spinner fa-spin text-4xl text-[#0056b3] mb-3"></i>
          <p className="text-sm font-semibold text-gray-500">Loading your profile dashboard…</p>
        </div>
      </div>
    );
  }

  const isSuperAdmin = profile?.role === 'Super Admin';
  const initialLetter = (profile?.full_name || profile?.username || 'A').charAt(0).toUpperCase();
  const avatarSrc = profile?.avatar_url ? getPhotoUrl(profile.avatar_url) : null;
  const memberSince = profile?.created_at
    ? new Date(profile.created_at).toLocaleDateString('en-US', { month: 'long', year: 'numeric' })
    : 'Active Member';

  return (
    <div className="min-h-screen bg-[#f4f6f8] pb-16">
      {/* ── Page Header & Breadcrumb ────────────────────────────────────── */}
      <div className="p-6 md:p-8 max-w-6xl mx-auto">
        <div className="flex flex-wrap items-center justify-between gap-4 mb-6">
          <div>
            <div className="flex items-center gap-2 text-xs font-bold text-gray-400 uppercase tracking-wider mb-1">
              <Link href="/admin/dashboard" className="hover:text-[#0056b3] transition-colors">Admin</Link>
              <i className="fas fa-chevron-right text-[10px]"></i>
              <span className="text-gray-600">Profile Dashboard</span>
            </div>
            <h1 className="text-2xl md:text-3xl font-black text-gray-900 tracking-tight">
              Personal Profile Dashboard
            </h1>
          </div>

          {isSuperAdmin && (
            <Link
              href="/admin/accounts"
              className="inline-flex items-center gap-2 px-4 py-2 bg-white border border-gray-200 text-gray-700 font-bold text-xs rounded-xl hover:bg-gray-50 transition-all shadow-sm"
            >
              <i className="fas fa-users-cog text-[#0056b3]"></i>
              <span>Manage Admin Accounts</span>
            </Link>
          )}
        </div>

        {/* ── Hero Identity Card ──────────────────────────────────────────── */}
        <div className="relative overflow-hidden rounded-3xl bg-gradient-to-r from-[#0056b3] via-[#004b99] to-[#003875] text-white p-6 md:p-10 shadow-xl mb-8">
          <div className="absolute -right-12 -bottom-12 w-64 h-64 bg-white/5 rounded-full blur-2xl pointer-events-none"></div>
          <div className="absolute right-1/4 -top-12 w-48 h-48 bg-blue-400/10 rounded-full blur-xl pointer-events-none"></div>

          <div className="relative z-10 flex flex-col md:flex-row items-center md:items-start gap-6 md:gap-8 text-center md:text-left">
            {/* Avatar with Camera Trigger */}
            <div className="relative group">
              <div className="w-28 h-28 md:w-32 md:h-32 rounded-3xl overflow-hidden border-4 border-white/30 shadow-2xl bg-white/10 flex items-center justify-center transition-transform group-hover:scale-105 duration-200">
                {avatarSrc ? (
                  <img
                    src={avatarSrc}
                    alt={profile.full_name}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <span className="text-4xl md:text-5xl font-black text-white">
                    {initialLetter}
                  </span>
                )}
              </div>

              {/* Quick photo update button overlay */}
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                disabled={isUploadingAvatar}
                className="absolute bottom-1 right-1 w-9 h-9 bg-white text-[#0056b3] rounded-2xl shadow-lg flex items-center justify-center hover:bg-blue-50 transition-all hover:scale-110 active:scale-95 disabled:opacity-75"
                title="Change profile picture"
              >
                {isUploadingAvatar ? (
                  <i className="fas fa-spinner fa-spin text-xs"></i>
                ) : (
                  <i className="fas fa-camera text-xs"></i>
                )}
              </button>

              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                onChange={handleAvatarChange}
                className="hidden"
              />
            </div>

            {/* Admin Info */}
            <div className="flex-1">
              <div className="flex flex-wrap items-center justify-center md:justify-start gap-2.5 mb-2">
                <span
                  className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[11px] font-extrabold uppercase tracking-wide border shadow-sm ${
                    isSuperAdmin
                      ? 'bg-purple-500/20 text-purple-200 border-purple-400/30'
                      : 'bg-blue-400/20 text-blue-100 border-blue-300/30'
                  }`}
                >
                  <i className={`fas ${isSuperAdmin ? 'fa-shield-alt' : 'fa-user-check'} text-[10px]`}></i>
                  {profile.role}
                </span>

                <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[11px] font-extrabold bg-emerald-500/20 text-emerald-200 border border-emerald-400/30">
                  <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
                  Active Session
                </span>
              </div>

              <h2 className="text-2xl md:text-3xl font-black tracking-tight mb-1 text-white">
                {profile.full_name || profile.username}
              </h2>
              <p className="text-blue-100/80 text-sm font-medium mb-4 flex items-center justify-center md:justify-start gap-2">
                <i className="fas fa-at text-xs opacity-70"></i>
                <span>{profile.username}</span>
                <span className="opacity-40">•</span>
                <i className="fas fa-envelope text-xs opacity-70"></i>
                <span>{profile.email}</span>
              </p>

              <div className="flex flex-wrap items-center justify-center md:justify-start gap-4 text-xs text-blue-100/70">
                <div className="flex items-center gap-1.5">
                  <i className="fas fa-calendar-alt text-blue-200/60"></i>
                  <span>Member since {memberSince}</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <i className="fas fa-id-badge text-blue-200/60"></i>
                  <span>Admin ID: #{profile.id}</span>
                </div>
              </div>

              {avatarMsg && (
                <p className="text-xs text-emerald-300 font-bold mt-2 animate-fadeIn">
                  <i className="fas fa-check mr-1"></i> {avatarMsg}
                </p>
              )}
            </div>
          </div>
        </div>

        {/* ── Metric KPI Cards ────────────────────────────────────────────── */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-5 mb-8">
          <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm flex items-center gap-4 hover:shadow-md transition-shadow">
            <div className="w-14 h-14 rounded-2xl bg-emerald-50 text-emerald-600 flex items-center justify-center text-2xl shrink-0">
              <i className="fas fa-clipboard-check"></i>
            </div>
            <div>
              <p className="text-2xl md:text-3xl font-black text-gray-900 leading-none">
                {stats.complaints_handled}
              </p>
              <p className="text-xs font-bold uppercase tracking-wider text-gray-400 mt-1.5">
                Complaints Resolved
              </p>
            </div>
          </div>

          <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm flex items-center gap-4 hover:shadow-md transition-shadow">
            <div className="w-14 h-14 rounded-2xl bg-blue-50 text-[#0056b3] flex items-center justify-center text-2xl shrink-0">
              <i className="fas fa-file-signature"></i>
            </div>
            <div>
              <p className="text-2xl md:text-3xl font-black text-gray-900 leading-none">
                {stats.service_requests_processed}
              </p>
              <p className="text-xs font-bold uppercase tracking-wider text-gray-400 mt-1.5">
                Service Requests Processed
              </p>
            </div>
          </div>

          <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm flex items-center gap-4 hover:shadow-md transition-shadow">
            <div className="w-14 h-14 rounded-2xl bg-amber-50 text-amber-600 flex items-center justify-center text-2xl shrink-0">
              <i className="fas fa-bolt"></i>
            </div>
            <div>
              <p className="text-2xl md:text-3xl font-black text-gray-900 leading-none">
                {stats.total_actions}
              </p>
              <p className="text-xs font-bold uppercase tracking-wider text-gray-400 mt-1.5">
                Administrative Actions
              </p>
            </div>
          </div>
        </div>

        {/* ── Main Tabbed Content Card ────────────────────────────────────── */}
        <div className="bg-white rounded-3xl border border-gray-200/80 shadow-sm overflow-hidden">
          {/* Tab Navigation */}
          <div className="flex border-b border-gray-100 bg-gray-50/50 p-2 gap-2">
            <button
              onClick={() => setActiveTab('details')}
              className={`flex-1 md:flex-initial px-6 py-3 rounded-2xl font-bold text-xs tracking-wide transition-all flex items-center justify-center gap-2 ${
                activeTab === 'details'
                  ? 'bg-white text-[#0056b3] shadow-sm'
                  : 'text-gray-500 hover:text-gray-800 hover:bg-gray-100/60'
              }`}
            >
              <i className="fas fa-user-edit"></i>
              <span>Personal Details</span>
            </button>

            <button
              onClick={() => setActiveTab('security')}
              className={`flex-1 md:flex-initial px-6 py-3 rounded-2xl font-bold text-xs tracking-wide transition-all flex items-center justify-center gap-2 ${
                activeTab === 'security'
                  ? 'bg-white text-[#0056b3] shadow-sm'
                  : 'text-gray-500 hover:text-gray-800 hover:bg-gray-100/60'
              }`}
            >
              <i className="fas fa-lock"></i>
              <span>Security & Password</span>
            </button>

            <button
              onClick={() => setActiveTab('activity')}
              className={`flex-1 md:flex-initial px-6 py-3 rounded-2xl font-bold text-xs tracking-wide transition-all flex items-center justify-center gap-2 ${
                activeTab === 'activity'
                  ? 'bg-white text-[#0056b3] shadow-sm'
                  : 'text-gray-500 hover:text-gray-800 hover:bg-gray-100/60'
              }`}
            >
              <i className="fas fa-history"></i>
              <span>Recent Activity ({recentActivity.length})</span>
            </button>
          </div>

          {/* Tab Body */}
          <div className="p-6 md:p-10">
            {/* ── TAB 1: PERSONAL DETAILS ─────────────────────────────────── */}
            {activeTab === 'details' && (
              <form onSubmit={handleSaveDetails} className="max-w-2xl">
                <div className="mb-6">
                  <h3 className="text-lg font-black text-gray-900">Personal Information</h3>
                  <p className="text-xs text-gray-500">Update your account name and contact email address.</p>
                </div>

                {profileSuccessMsg && (
                  <div className="p-4 mb-6 rounded-2xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-bold flex items-center gap-2">
                    <i className="fas fa-check-circle text-emerald-600 text-base"></i>
                    <span>{profileSuccessMsg}</span>
                  </div>
                )}

                {profileErrorMsg && (
                  <div className="p-4 mb-6 rounded-2xl bg-red-50 border border-red-200 text-red-800 text-xs font-bold flex items-center gap-2">
                    <i className="fas fa-exclamation-circle text-red-600 text-base"></i>
                    <span>{profileErrorMsg}</span>
                  </div>
                )}

                <div className="space-y-4">
                  {/* Full Name */}
                  <div>
                    <label className="block text-xs font-bold uppercase tracking-wider text-gray-500 mb-1.5">
                      Full Name
                    </label>
                    <div className="relative">
                      <i className="fas fa-user absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 text-sm"></i>
                      <input
                        type="text"
                        value={fullName}
                        onChange={(e) => setFullName(e.target.value)}
                        placeholder="e.g. John Doe"
                        className="w-full pl-11 pr-4 py-3 bg-gray-50 border border-gray-200 rounded-xl text-sm font-semibold text-gray-800 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-100 focus:border-[#0056b3] transition-all"
                        required
                      />
                    </div>
                  </div>

                  {/* Email */}
                  <div>
                    <label className="block text-xs font-bold uppercase tracking-wider text-gray-500 mb-1.5">
                      Email Address
                    </label>
                    <div className="relative">
                      <i className="fas fa-envelope absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 text-sm"></i>
                      <input
                        type="email"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        placeholder="e.g. johndoe@gmail.com"
                        className="w-full pl-11 pr-4 py-3 bg-gray-50 border border-gray-200 rounded-xl text-sm font-semibold text-gray-800 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-100 focus:border-[#0056b3] transition-all"
                        required
                      />
                    </div>
                  </div>

                  {/* Read-only info row */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2">
                    <div>
                      <label className="block text-xs font-bold uppercase tracking-wider text-gray-400 mb-1.5">
                        Username <span className="text-[10px] text-gray-400 normal-case">(Immutable)</span>
                      </label>
                      <input
                        type="text"
                        value={profile.username}
                        readOnly
                        className="w-full px-4 py-3 bg-gray-100/80 border border-gray-200 rounded-xl text-sm font-semibold text-gray-500 cursor-not-allowed"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-bold uppercase tracking-wider text-gray-400 mb-1.5">
                        Assigned Role
                      </label>
                      <input
                        type="text"
                        value={profile.role}
                        readOnly
                        className="w-full px-4 py-3 bg-gray-100/80 border border-gray-200 rounded-xl text-sm font-semibold text-gray-500 cursor-not-allowed"
                      />
                    </div>
                  </div>
                </div>

                <div className="mt-8 pt-6 border-t border-gray-100 flex justify-end">
                  <button
                    type="submit"
                    disabled={isSavingProfile}
                    className="px-6 py-3 bg-[#0056b3] text-white font-bold text-xs uppercase tracking-wider rounded-xl hover:bg-blue-800 active:scale-95 transition-all shadow-md flex items-center gap-2 disabled:opacity-60"
                  >
                    {isSavingProfile ? (
                      <>
                        <i className="fas fa-spinner fa-spin"></i>
                        <span>Saving Changes…</span>
                      </>
                    ) : (
                      <>
                        <i className="fas fa-save"></i>
                        <span>Save Profile Details</span>
                      </>
                    )}
                  </button>
                </div>
              </form>
            )}

            {/* ── TAB 2: SECURITY & PASSWORD ───────────────────────────────── */}
            {activeTab === 'security' && (
              <form onSubmit={handleChangePassword} className="max-w-2xl">
                <div className="mb-6">
                  <h3 className="text-lg font-black text-gray-900">Security Credentials</h3>
                  <p className="text-xs text-gray-500">
                    Change your account password. Ensure it has at least 8 characters with numbers and symbols.
                  </p>
                </div>

                {pwSuccessMsg && (
                  <div className="p-4 mb-6 rounded-2xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-bold flex items-center gap-2">
                    <i className="fas fa-check-circle text-emerald-600 text-base"></i>
                    <span>{pwSuccessMsg}</span>
                  </div>
                )}

                {pwErrorMsg && (
                  <div className="p-4 mb-6 rounded-2xl bg-red-50 border border-red-200 text-red-800 text-xs font-bold flex items-center gap-2">
                    <i className="fas fa-exclamation-circle text-red-600 text-base"></i>
                    <span>{pwErrorMsg}</span>
                  </div>
                )}

                <div className="space-y-4">
                  {/* Current Password */}
                  <div>
                    <label className="block text-xs font-bold uppercase tracking-wider text-gray-500 mb-1.5">
                      Current Password
                    </label>
                    <div className="relative">
                      <i className="fas fa-lock absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 text-sm"></i>
                      <input
                        type={showCurrentPw ? 'text' : 'password'}
                        value={currentPassword}
                        onChange={(e) => setCurrentPassword(e.target.value)}
                        placeholder="Enter your existing password"
                        className="w-full pl-11 pr-11 py-3 bg-gray-50 border border-gray-200 rounded-xl text-sm font-semibold text-gray-800 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-100 focus:border-[#0056b3] transition-all"
                        required
                      />
                      <button
                        type="button"
                        onClick={() => setShowCurrentPw(!showCurrentPw)}
                        className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-700 text-sm"
                      >
                        <i className={`fas ${showCurrentPw ? 'fa-eye-slash' : 'fa-eye'}`}></i>
                      </button>
                    </div>
                  </div>

                  {/* New Password */}
                  <div>
                    <label className="block text-xs font-bold uppercase tracking-wider text-gray-500 mb-1.5">
                      New Password
                    </label>
                    <div className="relative">
                      <i className="fas fa-key absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 text-sm"></i>
                      <input
                        type={showNewPw ? 'text' : 'password'}
                        value={newPassword}
                        onChange={(e) => setNewPassword(e.target.value)}
                        placeholder="Create a strong new password"
                        className="w-full pl-11 pr-11 py-3 bg-gray-50 border border-gray-200 rounded-xl text-sm font-semibold text-gray-800 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-100 focus:border-[#0056b3] transition-all"
                        required
                      />
                      <button
                        type="button"
                        onClick={() => setShowNewPw(!showNewPw)}
                        className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-700 text-sm"
                      >
                        <i className={`fas ${showNewPw ? 'fa-eye-slash' : 'fa-eye'}`}></i>
                      </button>
                    </div>

                    {/* Password Strength Indicator */}
                    {newPassword && (
                      <div className="mt-2.5 p-3 rounded-xl bg-gray-50 border border-gray-200/60">
                        <div className="flex items-center justify-between text-xs mb-1.5">
                          <span className="font-bold text-gray-600">Password Strength:</span>
                          <span className="font-extrabold" style={{ color: currentStrength.color }}>
                            {currentStrength.label}
                          </span>
                        </div>
                        <div className="w-full h-1.5 bg-gray-200 rounded-full overflow-hidden">
                          <div
                            className="h-full transition-all duration-300 rounded-full"
                            style={{ width: currentStrength.percent, background: currentStrength.color }}
                          ></div>
                        </div>
                        <div className="grid grid-cols-2 gap-1 mt-2 text-[11px] text-gray-500 font-medium">
                          <span className={pwCriteria[0] ? 'text-emerald-600 font-bold' : ''}>
                            <i className={`fas ${pwCriteria[0] ? 'fa-check-circle' : 'fa-circle text-[8px]'} mr-1`}></i>
                            At least 8 chars
                          </span>
                          <span className={pwCriteria[1] ? 'text-emerald-600 font-bold' : ''}>
                            <i className={`fas ${pwCriteria[1] ? 'fa-check-circle' : 'fa-circle text-[8px]'} mr-1`}></i>
                            Uppercase letter
                          </span>
                          <span className={pwCriteria[2] ? 'text-emerald-600 font-bold' : ''}>
                            <i className={`fas ${pwCriteria[2] ? 'fa-check-circle' : 'fa-circle text-[8px]'} mr-1`}></i>
                            Number digit
                          </span>
                          <span className={pwCriteria[3] ? 'text-emerald-600 font-bold' : ''}>
                            <i className={`fas ${pwCriteria[3] ? 'fa-check-circle' : 'fa-circle text-[8px]'} mr-1`}></i>
                            Special symbol
                          </span>
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Confirm Password */}
                  <div>
                    <label className="block text-xs font-bold uppercase tracking-wider text-gray-500 mb-1.5">
                      Confirm New Password
                    </label>
                    <div className="relative">
                      <i className="fas fa-check-double absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 text-sm"></i>
                      <input
                        type={showConfirmPw ? 'text' : 'password'}
                        value={confirmPassword}
                        onChange={(e) => setConfirmPassword(e.target.value)}
                        placeholder="Re-type your new password"
                        className="w-full pl-11 pr-11 py-3 bg-gray-50 border border-gray-200 rounded-xl text-sm font-semibold text-gray-800 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-100 focus:border-[#0056b3] transition-all"
                        required
                      />
                      <button
                        type="button"
                        onClick={() => setShowConfirmPw(!showConfirmPw)}
                        className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-700 text-sm"
                      >
                        <i className={`fas ${showConfirmPw ? 'fa-eye-slash' : 'fa-eye'}`}></i>
                      </button>
                    </div>
                  </div>
                </div>

                <div className="mt-8 pt-6 border-t border-gray-100 flex justify-end">
                  <button
                    type="submit"
                    disabled={isSavingPw}
                    className="px-6 py-3 bg-[#22c55e] text-white font-bold text-xs uppercase tracking-wider rounded-xl hover:bg-emerald-600 active:scale-95 transition-all shadow-md flex items-center gap-2 disabled:opacity-60"
                  >
                    {isSavingPw ? (
                      <>
                        <i className="fas fa-spinner fa-spin"></i>
                        <span>Updating Password…</span>
                      </>
                    ) : (
                      <>
                        <i className="fas fa-shield-alt"></i>
                        <span>Update Password</span>
                      </>
                    )}
                  </button>
                </div>
              </form>
            )}

            {/* ── TAB 3: RECENT ACTIVITY ─────────────────────────────────── */}
            {activeTab === 'activity' && (
              <div className="max-w-3xl">
                <div className="mb-6">
                  <h3 className="text-lg font-black text-gray-900">Activity Timeline</h3>
                  <p className="text-xs text-gray-500">
                    Chronological history of recent actions, audits, and status updates logged by your account.
                  </p>
                </div>

                {recentActivity.length === 0 ? (
                  <div className="text-center py-12 border-2 border-dashed border-gray-200 rounded-2xl p-6">
                    <i className="fas fa-history text-4xl text-gray-300 mb-3 block"></i>
                    <p className="text-sm font-bold text-gray-600">No recent activity found</p>
                    <p className="text-xs text-gray-400 mt-1">Actions you perform on complaints, services, and accounts will be recorded here.</p>
                  </div>
                ) : (
                  <div className="relative pl-6 border-l-2 border-blue-100 space-y-6">
                    {recentActivity.map((item) => (
                      <div key={item.id} className="relative group">
                        <div className="absolute -left-[31px] top-1 w-4 h-4 rounded-full bg-[#0056b3] border-4 border-white shadow-sm group-hover:scale-125 transition-transform"></div>
                        <div className="bg-gray-50/70 p-4 rounded-2xl border border-gray-100 hover:bg-white hover:shadow-sm transition-all">
                          <div className="flex flex-wrap items-center justify-between gap-2 mb-1">
                            <span className="inline-block px-2.5 py-0.5 rounded-lg text-[10px] font-extrabold uppercase tracking-wider bg-blue-100 text-[#0056b3]">
                              {item.action_type || 'System Action'}
                            </span>
                            <span className="text-[11px] font-semibold text-gray-400">
                              {new Date(item.created_at).toLocaleString('en-US', {
                                month: 'short',
                                day: 'numeric',
                                year: 'numeric',
                                hour: '2-digit',
                                minute: '2-digit'
                              })}
                            </span>
                          </div>
                          <p className="text-xs font-semibold text-gray-700 leading-relaxed">
                            {item.action_details}
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
