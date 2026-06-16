// ============================================
// js/admin-common.js — Shared admin page logic
// Include this on every admin page AFTER api.js
// ============================================

document.addEventListener('DOMContentLoaded', function () {
    // Check authentication
    if (!requireAuth()) return;

    const admin = getAdmin();
    if (!admin) {
        window.location.href = '../homepage/admin_login.html';
        return;
    }

    // Update sidebar admin profile
    const adminNameEls = document.querySelectorAll('.admin-name');
    const adminRoleEls = document.querySelectorAll('.admin-role');

    adminNameEls.forEach(el => el.textContent = admin.full_name);
    adminRoleEls.forEach(el => el.textContent = admin.role);

    // Update welcome greeting if it exists
    const greeting = document.querySelector('.greeting h1');
    if (greeting) {
        greeting.textContent = `Welcome, ${admin.full_name}!`;
    }

    // ── Role-Based Access Control (RBAC) ──
    const adminData = JSON.parse(localStorage.getItem('admin'));

    if (adminData && adminData.role !== 'Super Admin') {
        // Hide the Accounts Setting sidebar link for non-Super Admins
        const accountsLink = document.querySelector('a[href*="accounts-setting.html"]');
        if (accountsLink) {
            accountsLink.closest('li').style.display = 'none';
        }

        // Kick non-Super Admins off the accounts page if they navigate there directly
        if (window.location.href.includes('accounts-setting.html')) {
            window.location.replace('admin-dashboard.html');
            return;
        }
    }

    if (adminData && adminData.requires_password_change === 1) {
        // 1. Create a full-screen, non-dismissible overlay
        const overlay = document.createElement('div');
        overlay.style.position = 'fixed';
        overlay.style.top = '0';
        overlay.style.left = '0';
        overlay.style.width = '100vw';
        overlay.style.height = '100vh';
        overlay.style.backgroundColor = 'rgba(0, 0, 0, 0.9)';
        overlay.style.zIndex = '9999';
        overlay.style.display = 'flex';
        overlay.style.justifyContent = 'center';
        overlay.style.alignItems = 'center';

        // 2. Build the forced change UI
        overlay.innerHTML = `
            <div style="background: white; padding: 30px; border-radius: 8px; text-align: center; max-width: 400px; width: 90%;">
                <h2 style="color: #d9534f; margin-bottom: 10px;">Security Alert</h2>
                <p style="margin-bottom: 20px;">You are currently using the default password. For security reasons, you must change it before accessing the dashboard.</p>
                <input type="password" id="forced-new-password" placeholder="New Password" style="width: 100%; padding: 10px; margin-bottom: 15px; border: 1px solid #ccc; border-radius: 4px;">
                <input type="password" id="forced-confirm-password" placeholder="Confirm Password" style="width: 100%; padding: 10px; margin-bottom: 15px; border: 1px solid #ccc; border-radius: 4px;">
                <button id="forced-change-btn" style="background: #006eb3; color: white; border: none; padding: 10px 20px; border-radius: 4px; cursor: pointer; width: 100%; font-weight: bold;">Update Password</button>
                <p id="forced-error-msg" style="color: red; margin-top: 10px; display: none;"></p>
            </div>
        `;
        
        document.body.appendChild(overlay);

        // 3. Handle the submission
        document.getElementById('forced-change-btn').addEventListener('click', async () => {
            const newPassword = document.getElementById('forced-new-password').value;
            const confirmPassword = document.getElementById('forced-confirm-password').value;
            const errorMsg = document.getElementById('forced-error-msg');

            // Check if both fields are filled
            if (!newPassword || !confirmPassword) {
                errorMsg.textContent = 'Please fill in both password fields.';
                errorMsg.style.display = 'block';
                return;
            }

            // Check if passwords match
            if (newPassword !== confirmPassword) {
                errorMsg.textContent = 'Passwords do not match. Please try again.';
                errorMsg.style.display = 'block';
                return;
            }

            // Check minimum length
            if (newPassword.length < 6) {
                errorMsg.textContent = 'Password must be at least 6 characters.';
                errorMsg.style.display = 'block';
                return;
            }

            try {
                const response = await fetch(API_BASE + '/api/auth/force-change-password', {
                    method: 'PUT',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ 
                        username: adminData.username, 
                        new_password: newPassword 
                    })
                });

                if (response.ok) {
                    // Update local storage so the prompt disappears
                    adminData.requires_password_change = 0;
                    localStorage.setItem('admin', JSON.stringify(adminData));
                    
                    alert('Password updated successfully! Welcome to the dashboard.');
                    overlay.remove(); // Remove the lockout screen
                } else {
                    const data = await response.json();
                    errorMsg.textContent = data.error || 'Failed to update password.';
                    errorMsg.style.display = 'block';
                }
            } catch (error) {
                errorMsg.textContent = 'A network error occurred.';
                errorMsg.style.display = 'block';
            }
        });
    }

    // Wire up logout button
    const logoutBtns = document.querySelectorAll('.logout-btn');
    logoutBtns.forEach(btn => {
        btn.addEventListener('click', async function (e) {
            e.preventDefault();
            try {
                await apiPost('/api/auth/logout', {});
            } catch (err) {
                // Ignore errors on logout
            }
            clearAuth();
            window.location.href = '../homepage/admin_login.html';
        });
    });

    // Load notification badge count
    loadNotificationBadge();
});

async function loadNotificationBadge() {
    try {
        const data = await apiGet('/api/admin/notifications/unread-count');
        if (data) {
            const badges = document.querySelectorAll('.notification-dot, .badge');
            badges.forEach(badge => {
                if (data.unread_count > 0) {
                    badge.style.display = 'inline-block';
                    if (badge.classList.contains('badge')) {
                        badge.textContent = data.unread_count;
                    }
                } else {
                    badge.style.display = 'none';
                }
            });
        }
    } catch (err) {
        // Silently fail
    }
}
