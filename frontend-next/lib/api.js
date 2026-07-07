// ============================================
// lib/api.js — Shared API utility for Next.js
// Port of frontend/js/api.js for React/Next.js
// ============================================

const API_BASE = process.env.NEXT_PUBLIC_API_URL;

// ── localStorage helpers ──

export function getToken() {
  if (typeof window === 'undefined') return null;
  return localStorage.getItem('token');
}

export function getAdmin() {
  if (typeof window === 'undefined') return null;
  const data = localStorage.getItem('admin');
  return data ? JSON.parse(data) : null;
}

export function saveAuth(token, admin) {
  localStorage.setItem('token', token);
  localStorage.setItem('admin', JSON.stringify(admin));
}

export function clearAuth() {
  localStorage.removeItem('token');
  localStorage.removeItem('admin');
}

// ── Core API call with auth header ──

export async function apiCall(endpoint, options = {}) {
  const token = getToken();
  const headers = options.headers ? { ...options.headers } : {};

  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  // Don't set Content-Type for FormData (file uploads)
  if (!(options.body instanceof FormData)) {
    headers['Content-Type'] = 'application/json';
  }

  const response = await fetch(`${API_BASE}${endpoint}`, {
    ...options,
    headers,
  });

  const data = await response.json();

  // Handle unauthorized — clear auth and redirect to login
  if (response.status === 401 || response.status === 403) {
    clearAuth();
    if (typeof window !== 'undefined' && !window.location.pathname.includes('/login')) {
      window.location.href = '/login';
      return null;
    }
  }

  if (!response.ok) {
    throw new Error(data.error || 'Something went wrong');
  }

  return data;
}

// ── Shorthand helpers ──

export async function apiGet(endpoint) {
  return apiCall(endpoint, { method: 'GET' });
}

export async function apiPost(endpoint, body) {
  if (body instanceof FormData) {
    return apiCall(endpoint, { method: 'POST', body });
  }
  return apiCall(endpoint, { method: 'POST', body: JSON.stringify(body) });
}

export async function apiPut(endpoint, body) {
  if (body instanceof FormData) {
    return apiCall(endpoint, { method: 'PUT', body });
  }
  return apiCall(endpoint, { method: 'PUT', body: JSON.stringify(body) });
}

export async function apiDelete(endpoint) {
  return apiCall(endpoint, { method: 'DELETE' });
}

/**
 * Resolve a photo_url from the database to a displayable image URL.
 * Handles two cases:
 *  1. Legacy: '/uploads/filename.jpg'  → prepend API_BASE
 *  2. New: 'https://...supabase.co/...' → use directly
 * @param {string|null} photoUrl - The photo_url value from the DB
 * @returns {string|null} - A full displayable URL, or null
 */
export function getPhotoUrl(photoUrl) {
  if (!photoUrl) return null;
  if (photoUrl.startsWith('http://') || photoUrl.startsWith('https://')) {
    return photoUrl; // Already a full URL (Supabase)
  }
  return API_BASE + photoUrl; // Legacy local path
}
