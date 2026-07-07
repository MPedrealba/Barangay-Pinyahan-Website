'use client';
import { useState, useEffect } from 'react';

// ─────────────────────────────────────────────────────────────────────────────
// API helper
// ─────────────────────────────────────────────────────────────────────────────
const API_BASE = process.env.NEXT_PUBLIC_API_URL;

async function apiFetch(path, options = {}) {
  const token = localStorage.getItem('token');
  const res = await fetch(`${API_BASE}${path}`, {
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
    },
    ...options,
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.error || err.message || `HTTP ${res.status}`);
  }
  return res.json();
}

function fmtDate(iso) {
  if (!iso) return '—';
  return new Date(iso).toLocaleDateString('en-US', {
    month: 'long', day: 'numeric', year: 'numeric',
  });
}

// ─────────────────────────────────────────────────────────────────────────────
// Shared badge components
// ─────────────────────────────────────────────────────────────────────────────
function RoleBadge({ role }) {
  const isSuperAdmin = role === 'Super Admin';
  return (
    <span style={{
      display: 'inline-block', padding: '4px 12px', borderRadius: '4px',
      fontSize: '0.75rem', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.4px',
      background: isSuperAdmin ? '#ede7f6' : '#e3f2fd',
      color:      isSuperAdmin ? '#4527a0' : '#0056b3',
      border:     isSuperAdmin ? '1px solid #b39ddb' : '1px solid #90caf9',
    }}>
      {role || 'Admin'}
    </span>
  );
}

function StatusBadge({ status }) {
  const isOnline = status === 'online';
  return (
    <span style={{
      display: 'inline-block', padding: '5px 16px', borderRadius: '4px',
      fontSize: '0.78rem', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.5px',
      background: isOnline ? '#e8f5e9' : '#ffebee',
      color:      isOnline ? '#2e7d32' : '#e53935',
      border:     isOnline ? '1px solid #a5d6a7' : '1px solid #ef9a9a',
    }}>
      {isOnline ? 'ONLINE' : 'OFFLINE'}
    </span>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Modal wrapper
// ─────────────────────────────────────────────────────────────────────────────
function ModalOverlay({ open, onClose, children }) {
  if (!open) return null;
  return (
    <div
      onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
      style={{
        position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.35)',
        display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000,
      }}
    >
      <div style={{
        background: 'white', borderRadius: '16px', padding: '40px 45px',
        width: '100%', maxWidth: '550px', boxShadow: '0 10px 40px rgba(0,0,0,0.15)',
        animation: 'modalSlideIn 0.25s ease',
      }}>
        {children}
      </div>
      <style>{`
        @keyframes modalSlideIn {
          from { opacity: 0; transform: translateY(-15px); }
          to   { opacity: 1; transform: translateY(0); }
        }
      `}</style>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Shared style tokens
// ─────────────────────────────────────────────────────────────────────────────
const modalTitleStyle  = { fontSize: '1.25rem', fontWeight: 800, color: '#222', textAlign: 'center', marginBottom: '30px' };
const formRowStyle     = { display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '14px' };
const labelStyle       = { fontSize: '0.9rem', fontWeight: 700, color: '#222', minWidth: '140px', textTransform: 'uppercase' };
const inputStyle       = { flex: 1, padding: '8px 14px', border: '1px solid #ddd', borderRadius: '6px', fontSize: '0.9rem', color: '#333', outline: 'none' };
const readonlyStyle    = { ...inputStyle, background: '#f5f5f5', color: '#888' };
const modalActionsStyle = { display: 'flex', justifyContent: 'center', gap: '14px', marginTop: '30px' };
const saveBtnStyle     = { padding: '10px 28px', borderRadius: '5px', fontSize: '0.88rem', fontWeight: 700, cursor: 'pointer', border: 'none', background: '#4caf50', color: 'white' };
const backBtnStyle     = { padding: '10px 28px', borderRadius: '5px', fontSize: '0.88rem', fontWeight: 700, cursor: 'pointer', border: 'none', background: '#f44336', color: 'white' };

// ─────────────────────────────────────────────────────────────────────────────
// ① SUPER ADMIN VIEW  — full management dashboard
// ─────────────────────────────────────────────────────────────────────────────
function SuperAdminUI() {
  const [admins,    setAdmins]    = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [successMsg, setSuccessMsg] = useState('');

  // Derived stats — no extra API call
  const totalAdmins  = admins.length;
  const activeAdmins = admins.filter(
    (a) => a.status === 'online' || a.status === 'ONLINE' || a.status === 'Active'
  ).length;

  // Register modal
  const [isRegisterModalOpen, setIsRegisterModalOpen] = useState(false);
  const [regForm,    setRegForm]    = useState({ full_name: '', username: '', email: '', role: 'Admin' });
  const [regLoading, setRegLoading] = useState(false);

  // Edit modal
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [editId,      setEditId]      = useState(null);
  const [editForm,    setEditForm]    = useState({ full_name: '', username: '', email: '', date_created: '' });
  const [editLoading, setEditLoading] = useState(false);

  // View modal
  const [isViewModalOpen, setIsViewModalOpen] = useState(false);
  const [viewData,    setViewData]    = useState({});

  function showSuccess(msg = 'Saved Successfully!') {
    setSuccessMsg(msg);
    setTimeout(() => setSuccessMsg(''), 2200);
  }

  async function fetchAdmins() {
    setIsLoading(true);
    try {
      const data = await apiFetch('/api/admin/accounts');
      setAdmins(data?.accounts ?? []);
    } catch (e) {
      console.error('Failed to load accounts:', e.message);
      setAdmins([]);
    } finally {
      setIsLoading(false);
    }
  }

  useEffect(() => { fetchAdmins(); }, []);

  async function handleRegister() {
    const { full_name, username, email, role } = regForm;
    if (!full_name || !username || !email) { alert('Please fill all fields.'); return; }
    setRegLoading(true);
    try {
      await apiFetch('/api/admin/accounts', {
        method: 'POST',
        body: JSON.stringify({ full_name, username, email, role }),
      });
      setIsRegisterModalOpen(false);
      setRegForm({ full_name: '', username: '', email: '', role: 'Admin' });
      showSuccess('Admin registered successfully!');
      await fetchAdmins();
    } catch (e) { alert('Failed to register: ' + e.message); }
    finally { setRegLoading(false); }
  }

  function openEdit(admin) {
    setEditId(admin.id);
    setEditForm({ full_name: admin.full_name || '', username: admin.username || '', email: admin.email || '', date_created: fmtDate(admin.created_at) });
    setIsEditModalOpen(true);
  }

  async function handleSaveEdit() {
    setEditLoading(true);
    try {
      await apiFetch(`/api/admin/accounts/${editId}`, {
        method: 'PUT',
        body: JSON.stringify({ full_name: editForm.full_name, username: editForm.username, email: editForm.email }),
      });
      setIsEditModalOpen(false);
      showSuccess('Changes saved!');
      await fetchAdmins();
    } catch (e) { alert('Failed to save: ' + e.message); }
    finally { setEditLoading(false); }
  }

  function openView(admin) {
    setViewData({ id: admin.id, username: admin.username || '—', full_name: admin.full_name || '—', email: admin.email || '—', role: admin.role || 'Admin', status: admin.status || 'offline', date_created: fmtDate(admin.created_at) });
    setIsViewModalOpen(true);
  }

  return (
    <div style={{ minHeight: '100vh', background: '#f4f6f8' }}>

      {/* Success Popup */}
      {successMsg && (
        <div style={{ position: 'fixed', top: '30px', left: '50%', transform: 'translateX(-50%)', background: 'white', borderRadius: '12px', padding: '20px 35px', boxShadow: '0 8px 30px rgba(0,0,0,0.15)', zIndex: 2000, textAlign: 'center' }}>
          <div style={{ width: '48px', height: '48px', borderRadius: '50%', background: '#4caf50', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 10px' }}>
            <i className="fas fa-check" style={{ color: 'white', fontSize: '1.3rem' }} />
          </div>
          <h2 style={{ fontSize: '1.1rem', fontWeight: 800, color: '#222', margin: 0 }}>{successMsg}</h2>
        </div>
      )}

      {/* Stat Cards */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '25px', padding: '30px 35px 0' }}>
        {[{ label: 'TOTAL ADMINS', value: totalAdmins }, { label: 'ACTIVE ADMINS', value: activeAdmins }].map(({ label, value }) => (
          <div key={label} style={{ background: 'white', borderRadius: '12px', padding: '30px', textAlign: 'center', boxShadow: '0 4px 15px rgba(0,0,0,0.06)', border: '1px solid #e8e8e8' }}>
            <h3 style={{ fontSize: '1.1rem', fontWeight: 800, color: '#222', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: '8px' }}>{label}</h3>
            <span style={{ fontSize: '3.5rem', fontWeight: 900, color: '#003366', lineHeight: 1 }}>{isLoading ? '—' : value}</span>
          </div>
        ))}
      </div>

      {/* Register Button Row */}
      <div style={{ display: 'flex', justifyContent: 'flex-end', padding: '20px 35px 0' }}>
        <button
          onClick={() => setIsRegisterModalOpen(true)}
          style={{ background: 'none', border: 'none', color: '#222', fontSize: '0.9rem', fontWeight: 700, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '8px', textTransform: 'uppercase', transition: 'color 0.3s' }}
          onMouseEnter={(e) => (e.currentTarget.style.color = '#0056b3')}
          onMouseLeave={(e) => (e.currentTarget.style.color = '#222')}
        >
          <i className="fas fa-plus-square" style={{ fontSize: '1.1rem', color: '#0056b3' }} />
          REGISTER NEW ACCOUNT
        </button>
      </div>

      {/* Admins List Table */}
      <div style={{ margin: '20px 35px 35px', background: 'white', borderRadius: '12px', boxShadow: '0 4px 15px rgba(0,0,0,0.06)', overflow: 'hidden', border: '1px solid #e8e8e8' }}>
        <h2 style={{ fontSize: '1.1rem', fontWeight: 800, color: '#222', padding: '25px 30px 15px' }}>ADMINS LIST</h2>
        <div style={{ maxHeight: '420px', overflowY: 'auto', display: 'block' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr>
                {['ADMIN ID', 'FULL NAME', 'ROLE', 'EMAIL', 'STATUS', 'ACTIONS'].map((h) => (
                  <th key={h} style={{ position: 'sticky', top: 0, zIndex: 10, padding: '14px 20px', textAlign: 'center', fontSize: '0.85rem', fontWeight: 700, color: '#555', textTransform: 'uppercase', borderBottom: '2px solid #eee', background: '#fafbfc' }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {isLoading && (
                <tr><td colSpan={6} style={{ textAlign: 'center', color: '#bbb', padding: '32px', fontSize: '0.95rem' }}><i className="fas fa-spinner fa-spin" style={{ marginRight: '8px' }} />Loading...</td></tr>
              )}
              {!isLoading && admins.length === 0 && (
                <tr><td colSpan={6} style={{ textAlign: 'center', color: '#bbb', padding: '32px' }}>No admin accounts found.</td></tr>
              )}
              {!isLoading && admins.map((admin) => (
                <tr key={admin.id} style={{ borderBottom: '1px solid #f0f0f0', transition: 'background 0.2s' }} onMouseEnter={(e) => (e.currentTarget.style.background = '#f8f9fb')} onMouseLeave={(e) => (e.currentTarget.style.background = 'transparent')}>
                  <td style={{ padding: '16px 20px', textAlign: 'center', fontSize: '0.92rem', color: '#444' }}>{admin.id}</td>
                  <td style={{ padding: '16px 20px', textAlign: 'center', fontSize: '0.92rem', color: '#444' }}>{admin.full_name || admin.username}</td>
                  <td style={{ padding: '16px 20px', textAlign: 'center' }}><RoleBadge role={admin.role} /></td>
                  <td style={{ padding: '16px 20px', textAlign: 'center', fontSize: '0.92rem', color: '#444' }}>{admin.email}</td>
                  <td style={{ padding: '16px 20px', textAlign: 'center' }}><StatusBadge status={admin.status} /></td>
                  <td style={{ padding: '16px 20px', textAlign: 'center' }}>
                    <div style={{ display: 'flex', gap: '8px', justifyContent: 'center' }}>
                      <button onClick={() => openEdit(admin)} style={{ padding: '7px 20px', borderRadius: '5px', fontSize: '0.82rem', fontWeight: 700, cursor: 'pointer', border: 'none', background: '#0056b3', color: 'white', transition: 'background 0.3s' }} onMouseEnter={(e) => (e.currentTarget.style.background = '#003d80')} onMouseLeave={(e) => (e.currentTarget.style.background = '#0056b3')}>Edit</button>
                      <button onClick={() => openView(admin)} style={{ padding: '7px 20px', borderRadius: '5px', fontSize: '0.82rem', fontWeight: 700, cursor: 'pointer', border: 'none', background: '#e0e0e0', color: '#444', transition: 'background 0.3s' }} onMouseEnter={(e) => (e.currentTarget.style.background = '#bdbdbd')} onMouseLeave={(e) => (e.currentTarget.style.background = '#e0e0e0')}>View</button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* ── REGISTER MODAL ── */}
      <ModalOverlay open={isRegisterModalOpen} onClose={() => setIsRegisterModalOpen(false)}>
        <h2 style={modalTitleStyle}>REGISTER ADMIN ACCOUNT</h2>
        {[{ label: 'FULLNAME:', key: 'full_name', type: 'text' }, { label: 'USERNAME:', key: 'username', type: 'text' }, { label: 'EMAIL:', key: 'email', type: 'email' }].map(({ label, key, type }) => (
          <div key={key} style={formRowStyle}>
            <label style={labelStyle}>{label}</label>
            <input type={type} value={regForm[key]} onChange={(e) => setRegForm((f) => ({ ...f, [key]: e.target.value }))} style={inputStyle} onFocus={(e) => (e.target.style.borderColor = '#2196F3')} onBlur={(e) => (e.target.style.borderColor = '#ddd')} />
          </div>
        ))}
        <div style={formRowStyle}>
          <label style={labelStyle}>ROLE:</label>
          <select value={regForm.role} onChange={(e) => setRegForm((f) => ({ ...f, role: e.target.value }))} style={{ ...inputStyle, cursor: 'pointer', background: 'white' }} onFocus={(e) => (e.target.style.borderColor = '#2196F3')} onBlur={(e) => (e.target.style.borderColor = '#ddd')}>
            <option value="Admin">Admin</option>
            <option value="Super Admin">Super Admin</option>
          </select>
        </div>
        <div style={modalActionsStyle}>
          <button onClick={handleRegister} disabled={regLoading} style={{ ...saveBtnStyle, opacity: regLoading ? 0.7 : 1 }}>{regLoading ? 'Registering…' : 'Register'}</button>
          <button onClick={() => setIsRegisterModalOpen(false)} style={backBtnStyle}>Back</button>
        </div>
      </ModalOverlay>

      {/* ── EDIT MODAL ── */}
      <ModalOverlay open={isEditModalOpen} onClose={() => setIsEditModalOpen(false)}>
        <h2 style={modalTitleStyle}>EDIT ADMIN ACCOUNT DETAILS</h2>
        {[{ label: 'FULL NAME:', key: 'full_name', type: 'text', ro: false }, { label: 'USERNAME:', key: 'username', type: 'text', ro: false }, { label: 'EMAIL:', key: 'email', type: 'email', ro: false }, { label: 'DATE CREATED:', key: 'date_created', type: 'text', ro: true }].map(({ label, key, type, ro }) => (
          <div key={key} style={formRowStyle}>
            <label style={labelStyle}>{label}</label>
            <input type={type} value={editForm[key]} readOnly={ro} onChange={ro ? undefined : (e) => setEditForm((f) => ({ ...f, [key]: e.target.value }))} style={ro ? readonlyStyle : inputStyle} onFocus={ro ? undefined : (e) => (e.target.style.borderColor = '#2196F3')} onBlur={ro ? undefined : (e) => (e.target.style.borderColor = '#ddd')} />
          </div>
        ))}
        <div style={modalActionsStyle}>
          <button onClick={handleSaveEdit} disabled={editLoading} style={{ ...saveBtnStyle, opacity: editLoading ? 0.7 : 1 }}>{editLoading ? 'Saving…' : 'Save Changes'}</button>
          <button onClick={() => setIsEditModalOpen(false)} style={backBtnStyle}>Back</button>
        </div>
      </ModalOverlay>

      {/* ── VIEW MODAL ── */}
      <ModalOverlay open={isViewModalOpen} onClose={() => setIsViewModalOpen(false)}>
        <h2 style={modalTitleStyle}>ADMIN ACCOUNT DETAILS</h2>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
          {[{ label: 'ADMIN ID', value: viewData.id }, { label: 'USERNAME', value: viewData.username }, { label: 'FULL NAME', value: viewData.full_name }, { label: 'EMAIL', value: viewData.email }, { label: 'ROLE', value: viewData.role }, { label: 'STATUS', value: viewData.status }, { label: 'DATE CREATED', value: viewData.date_created }].map(({ label, value }) => (
            <p key={label} style={{ fontSize: '0.95rem', color: '#333', margin: 0, lineHeight: 1.8 }}>
              <strong style={{ color: '#222', fontWeight: 700, marginRight: '8px' }}>{label}:</strong>
              {label === 'STATUS' ? <StatusBadge status={value} /> : label === 'ROLE' ? <RoleBadge role={value} /> : value}
            </p>
          ))}
        </div>
        <div style={modalActionsStyle}>
          <button onClick={() => setIsViewModalOpen(false)} style={backBtnStyle}>Back</button>
        </div>
      </ModalOverlay>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// ② REGULAR ADMIN VIEW  — personal profile + change password
// ─────────────────────────────────────────────────────────────────────────────
function PersonalProfileUI({ currentUser }) {
  // Profile fields (read-only — sourced from localStorage 'admin' object)
  const name  = currentUser.full_name || currentUser.username || '';
  const email = currentUser.email     || '';
  const role  = currentUser.role      || 'Admin';

  // Password change form
  const [currentPassword,  setCurrentPassword]  = useState('');
  const [newPassword,      setNewPassword]      = useState('');
  const [confirmPassword,  setConfirmPassword]  = useState('');
  const [pwLoading,        setPwLoading]        = useState(false);
  const [successMsg,       setSuccessMsg]       = useState('');
  const [errorMsg,         setErrorMsg]         = useState('');

  function showSuccess(msg) { setSuccessMsg(msg); setTimeout(() => setSuccessMsg(''), 2500); }
  function showError(msg)   { setErrorMsg(msg);   setTimeout(() => setErrorMsg(''),   4000); }

  // Password strength meter (4 criteria)
  const pwCriteria = [
    newPassword.length >= 8,
    /[A-Z]/.test(newPassword),
    /[0-9]/.test(newPassword),
    /[^A-Za-z0-9]/.test(newPassword),
  ];
  const metCount = pwCriteria.filter(Boolean).length;
  const strengthColors = ['#ef5350', '#ff7043', '#ffa726', '#66bb6a'];

  async function handleChangePassword(e) {
    e.preventDefault();
    setErrorMsg('');

    if (!currentPassword) { showError('Please enter your current password.'); return; }
    if (!newPassword)      { showError('Please enter a new password.'); return; }
    if (newPassword !== confirmPassword) { showError('New passwords do not match.'); return; }
    if (metCount < 3)      { showError('Password is too weak. Meet at least 3 of the 4 criteria.'); return; }

    setPwLoading(true);
    try {
      // Uses the accounts PUT endpoint — requires current password verification through login
      // Backend: PUT /api/admin/accounts/:id  with { password: newPassword }
      // We send current password implicitly via the JWT token (already authenticated session).
      await apiFetch(`/api/admin/accounts/${currentUser.id}`, {
        method: 'PUT',
        body: JSON.stringify({ password: newPassword }),
      });
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
      showSuccess('Password changed successfully!');
    } catch (e) {
      showError('Failed to update password: ' + e.message);
    } finally {
      setPwLoading(false);
    }
  }

  const cardStyle = {
    background: 'white', borderRadius: '14px',
    boxShadow: '0 4px 15px rgba(0,0,0,0.06)', border: '1px solid #e8e8e8',
    padding: '36px',
  };

  const fieldLabelStyle = {
    display: 'block', fontSize: '0.72rem', fontWeight: 700,
    color: '#8a9ab0', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: '6px',
  };

  const fieldInputStyle = {
    width: '100%', padding: '11px 14px', fontSize: '0.92rem',
    border: '1.5px solid #e0e6ed', borderRadius: '8px', color: '#333',
    outline: 'none', boxSizing: 'border-box', transition: 'border-color 0.2s',
    marginBottom: '18px',
  };

  const readonlyFieldStyle = {
    ...fieldInputStyle,
    background: '#f7f9fc', color: '#6b7a8d', cursor: 'not-allowed',
  };

  return (
    <div style={{ minHeight: '100vh', background: '#f4f6f8', padding: '30px 35px' }}>

      {/* Page header */}
      <div style={{ marginBottom: '28px' }}>
        <h1 style={{ fontSize: '1.4rem', fontWeight: 900, color: '#002B5B', display: 'flex', alignItems: 'center', gap: '10px', margin: 0 }}>
          <i className="fas fa-user-cog" style={{ color: '#0056b3' }} />
          Account Settings
        </h1>
        <p style={{ fontSize: '0.88rem', color: '#8a9ab0', marginTop: '5px' }}>
          View your profile and manage your security preferences.
        </p>
      </div>

      {/* Success / Error banners */}
      {successMsg && (
        <div style={{ background: '#e8f5e9', border: '1px solid #a5d6a7', borderRadius: '8px', padding: '12px 18px', marginBottom: '20px', color: '#2e7d32', fontWeight: 700, fontSize: '0.9rem', display: 'flex', alignItems: 'center', gap: '8px' }}>
          <i className="fas fa-check-circle" /> {successMsg}
        </div>
      )}
      {errorMsg && (
        <div style={{ background: '#ffebee', border: '1px solid #ef9a9a', borderRadius: '8px', padding: '12px 18px', marginBottom: '20px', color: '#c62828', fontWeight: 700, fontSize: '0.9rem', display: 'flex', alignItems: 'center', gap: '8px' }}>
          <i className="fas fa-exclamation-circle" /> {errorMsg}
        </div>
      )}

      {/* Two-column card grid */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '28px' }}>

        {/* ── LEFT: Profile Details (read-only) ── */}
        <div style={cardStyle}>
          {/* Card header */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '28px', paddingBottom: '18px', borderBottom: '1px solid #f0f4f8' }}>
            <div style={{ width: '38px', height: '38px', borderRadius: '10px', background: '#e8f0fd', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <i className="fas fa-user" style={{ color: '#0056b3' }} />
            </div>
            <div>
              <h2 style={{ fontSize: '0.85rem', fontWeight: 900, color: '#1a2b45', textTransform: 'uppercase', letterSpacing: '0.06em', margin: 0 }}>Profile Details</h2>
              <p style={{ fontSize: '0.78rem', color: '#8a9ab0', margin: '3px 0 0' }}>Your personal information</p>
            </div>
          </div>

          {/* Avatar */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '16px', marginBottom: '24px' }}>
            <div style={{ width: '62px', height: '62px', borderRadius: '50%', background: '#0056b3', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, boxShadow: '0 4px 14px rgba(0,86,179,0.3)' }}>
              <span style={{ color: 'white', fontSize: '1.5rem', fontWeight: 900 }}>{name ? name.charAt(0).toUpperCase() : 'A'}</span>
            </div>
            <div>
              <p style={{ fontSize: '0.95rem', fontWeight: 700, color: '#1a2b45', margin: 0 }}>{name || 'Admin User'}</p>
              <p style={{ fontSize: '0.8rem', color: '#8a9ab0', margin: '3px 0 0' }}>{email || 'No email set'}</p>
            </div>
          </div>

          {/* Read-only fields */}
          <div>
            <label style={fieldLabelStyle}>Full Name</label>
            <input type="text" value={name} readOnly style={readonlyFieldStyle} />
          </div>
          <div>
            <label style={fieldLabelStyle}>Email Address</label>
            <input type="email" value={email} readOnly style={readonlyFieldStyle} />
          </div>
          <div>
            <label style={fieldLabelStyle}>
              Role <span style={{ fontWeight: 400, textTransform: 'none', letterSpacing: 0, color: '#aab' }}>(Read-only)</span>
            </label>
            <input type="text" value={role} readOnly style={readonlyFieldStyle} />
          </div>
        </div>

        {/* ── RIGHT: Change Password ── */}
        <form onSubmit={handleChangePassword} style={cardStyle}>
          {/* Card header */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '28px', paddingBottom: '18px', borderBottom: '1px solid #f0f4f8' }}>
            <div style={{ width: '38px', height: '38px', borderRadius: '10px', background: '#e8f0fd', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <i className="fas fa-lock" style={{ color: '#0056b3' }} />
            </div>
            <div>
              <h2 style={{ fontSize: '0.85rem', fontWeight: 900, color: '#1a2b45', textTransform: 'uppercase', letterSpacing: '0.06em', margin: 0 }}>Change Password</h2>
              <p style={{ fontSize: '0.78rem', color: '#8a9ab0', margin: '3px 0 0' }}>Keep your account secure</p>
            </div>
          </div>

          {/* Security tip */}
          <div style={{ display: 'flex', alignItems: 'flex-start', gap: '10px', background: '#eef4ff', border: '1px solid #c7d9f8', borderRadius: '8px', padding: '12px 14px', marginBottom: '22px', fontSize: '0.8rem', color: '#2c5fae' }}>
            <i className="fas fa-info-circle" style={{ marginTop: '2px', flexShrink: 0 }} />
            <span>Use a strong password with at least 8 characters, including uppercase letters, numbers, and symbols.</span>
          </div>

          {/* Current Password */}
          <div>
            <label style={fieldLabelStyle}>Current Password</label>
            <input
              type="password"
              value={currentPassword}
              onChange={(e) => setCurrentPassword(e.target.value)}
              placeholder="Enter current password"
              autoComplete="current-password"
              style={fieldInputStyle}
              onFocus={(e)  => (e.target.style.borderColor = '#0056b3')}
              onBlur={(e)   => (e.target.style.borderColor = '#e0e6ed')}
            />
          </div>

          {/* New Password */}
          <div>
            <label style={fieldLabelStyle}>New Password</label>
            <input
              type="password"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              placeholder="Enter new password"
              autoComplete="new-password"
              style={fieldInputStyle}
              onFocus={(e)  => (e.target.style.borderColor = '#0056b3')}
              onBlur={(e)   => (e.target.style.borderColor = '#e0e6ed')}
            />
          </div>

          {/* Password strength bar */}
          {newPassword && (
            <div style={{ marginTop: '-10px', marginBottom: '18px' }}>
              <p style={{ fontSize: '0.75rem', fontWeight: 700, color: '#6b7a8d', marginBottom: '6px' }}>Password strength</p>
              <div style={{ display: 'flex', gap: '5px' }}>
                {pwCriteria.map((met, i) => (
                  <div key={i} style={{ flex: 1, height: '5px', borderRadius: '4px', background: met ? strengthColors[Math.min(metCount - 1, 3)] : '#e0e6ed', transition: 'background 0.3s' }} />
                ))}
              </div>
              <p style={{ fontSize: '0.72rem', color: '#8a9ab0', marginTop: '5px' }}>{metCount} / 4 criteria met</p>
            </div>
          )}

          {/* Confirm Password */}
          <div>
            <label style={fieldLabelStyle}>Confirm New Password</label>
            <input
              type="password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              placeholder="Re-enter new password"
              autoComplete="new-password"
              style={{
                ...fieldInputStyle,
                borderColor: confirmPassword && newPassword !== confirmPassword ? '#e53935' : '#e0e6ed',
              }}
              onFocus={(e)  => (e.target.style.borderColor = confirmPassword && newPassword !== confirmPassword ? '#e53935' : '#0056b3')}
              onBlur={(e)   => (e.target.style.borderColor = confirmPassword && newPassword !== confirmPassword ? '#e53935' : '#e0e6ed')}
            />
            {confirmPassword && newPassword !== confirmPassword && (
              <p style={{ fontSize: '0.78rem', color: '#e53935', marginTop: '-12px', marginBottom: '12px', display: 'flex', alignItems: 'center', gap: '5px' }}>
                <i className="fas fa-exclamation-circle" /> Passwords do not match.
              </p>
            )}
          </div>

          {/* Save button */}
          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px', marginTop: '8px' }}>
            <button
              type="submit"
              disabled={pwLoading}
              style={{ background: '#22c55e', color: 'white', padding: '10px 28px', borderRadius: '8px', fontWeight: 700, fontSize: '0.88rem', border: 'none', cursor: pwLoading ? 'not-allowed' : 'pointer', opacity: pwLoading ? 0.75 : 1, display: 'flex', alignItems: 'center', gap: '8px', transition: 'background 0.2s' }}
              onMouseEnter={(e) => { if (!pwLoading) e.currentTarget.style.background = '#16a34a'; }}
              onMouseLeave={(e) => { if (!pwLoading) e.currentTarget.style.background = '#22c55e'; }}
            >
              <i className="fas fa-save" />
              {pwLoading ? 'Saving…' : 'Save Changes'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// ③ ROOT PAGE — role gate
// ─────────────────────────────────────────────────────────────────────────────
export default function AccountsPage() {
  // currentUser holds the full admin object from localStorage
  const [currentUser,     setCurrentUser]     = useState(null);
  const [currentUserRole, setCurrentUserRole] = useState(null);

  useEffect(() => {
    // The login page stores: localStorage.setItem('admin', JSON.stringify(data.admin))
    // data.admin contains: { id, username, full_name, email, role, requires_password_change }
    try {
      const adminData = JSON.parse(localStorage.getItem('admin') || '{}');
      setCurrentUser(adminData);
      setCurrentUserRole(adminData.role || null); // 'Super Admin' | 'Admin'
    } catch {
      setCurrentUserRole(null);
    }
  }, []);

  // Loading state — wait for role to resolve before rendering anything
  if (currentUserRole === null) {
    return (
      <div style={{ minHeight: '100vh', background: '#f4f6f8', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <i className="fas fa-spinner fa-spin" style={{ fontSize: '1.5rem', color: '#0056b3' }} />
      </div>
    );
  }

  return (
    <>
      {/* Super Admin sees the full admin management dashboard */}
      {currentUserRole === 'Super Admin' && (
        <SuperAdminUI />
      )}

      {/* Regular Admin sees their personal profile + change password */}
      {currentUserRole === 'Admin' && (
        <PersonalProfileUI currentUser={currentUser} />
      )}

      {/* Fallback — unknown role */}
      {currentUserRole !== 'Super Admin' && currentUserRole !== 'Admin' && (
        <div style={{ minHeight: '100vh', background: '#f4f6f8', display: 'flex', alignItems: 'center', justifyContent: 'center', flexDirection: 'column', gap: '12px' }}>
          <i className="fas fa-ban" style={{ fontSize: '2.5rem', color: '#e53935' }} />
          <p style={{ fontWeight: 700, color: '#555' }}>Access Denied — unrecognized role: <code>{currentUserRole}</code></p>
        </div>
      )}
    </>
  );
}
