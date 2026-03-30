// ============================================
// js/api.js — Shared API utility for all pages
// ============================================

// Determine API base URL dynamically
const isLocal = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1' || window.location.protocol === 'file:';
const API_BASE = isLocal ? 'http://localhost:3000' : '';

// Get stored auth token
function getToken() {
    return localStorage.getItem('token');
}

// Get stored admin info
function getAdmin() {
    const data = localStorage.getItem('admin');
    return data ? JSON.parse(data) : null;
}

// Save auth data after login
function saveAuth(token, admin) {
    localStorage.setItem('token', token);
    localStorage.setItem('admin', JSON.stringify(admin));
}

// Clear auth data on logout
function clearAuth() {
    localStorage.removeItem('token');
    localStorage.removeItem('admin');
}

// Check if logged in, redirect to login if not
function requireAuth() {
    if (!getToken()) {
        window.location.href = '../homepage/admin_login.html';
        return false;
    }
    return true;
}

// Generic API call with auth header
async function apiCall(endpoint, options = {}) {
    const token = getToken();
    const headers = options.headers || {};

    if (token) {
        headers['Authorization'] = `Bearer ${token}`;
    }

    // Don't set Content-Type for FormData (file uploads)
    if (!(options.body instanceof FormData)) {
        headers['Content-Type'] = 'application/json';
    }

    const response = await fetch(`${API_BASE}${endpoint}`, {
        ...options,
        headers
    });

    const data = await response.json();

    if (response.status === 401 || response.status === 403) {
        clearAuth();
        window.location.href = '../homepage/admin_login.html';
        return null;
    }

    if (!response.ok) {
        throw new Error(data.error || 'Something went wrong');
    }

    return data;
}

// Shorthand helpers
async function apiGet(endpoint) {
    return apiCall(endpoint, { method: 'GET' });
}

async function apiPost(endpoint, body) {
    if (body instanceof FormData) {
        return apiCall(endpoint, { method: 'POST', body });
    }
    return apiCall(endpoint, { method: 'POST', body: JSON.stringify(body) });
}

async function apiPut(endpoint, body) {
    if (body instanceof FormData) {
        return apiCall(endpoint, { method: 'PUT', body });
    }
    return apiCall(endpoint, { method: 'PUT', body: JSON.stringify(body) });
}

async function apiDelete(endpoint) {
    return apiCall(endpoint, { method: 'DELETE' });
}
