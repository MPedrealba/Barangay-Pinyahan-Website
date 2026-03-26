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
