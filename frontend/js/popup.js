// ============================================
// js/popup.js — Styled popup system (replaces alert())
// ============================================

function showPopup(title, message, type = 'info') {
    // Remove any existing popup
    const existing = document.getElementById('globalPopup');
    if (existing) existing.remove();

    const iconMap = {
        success: 'fas fa-check',
        error: 'fas fa-times',
        info: 'fas fa-info'
    };

    const overlay = document.createElement('div');
    overlay.className = 'popup-overlay';
    overlay.id = 'globalPopup';
    overlay.innerHTML = `
        <div class="popup-box">
            <div class="popup-icon ${type}">
                <i class="${iconMap[type] || iconMap.info}"></i>
            </div>
            <h2 class="popup-title">${title}</h2>
            <p class="popup-message">${message}</p>
            <button class="popup-btn ${type}" onclick="closePopup()">OK</button>
        </div>
    `;

    document.body.appendChild(overlay);

    // Trigger animation
    requestAnimationFrame(() => overlay.classList.add('active'));

    // Close on overlay click
    overlay.addEventListener('click', function (e) {
        if (e.target === overlay) closePopup();
    });

    return new Promise(resolve => {
        overlay.querySelector('.popup-btn').addEventListener('click', resolve);
        window._popupResolve = resolve;
    });
}

function closePopup() {
    const overlay = document.getElementById('globalPopup');
    if (overlay) {
        overlay.classList.remove('active');
        setTimeout(() => overlay.remove(), 300);
    }
    if (window._popupResolve) {
        window._popupResolve();
        delete window._popupResolve;
    }
}
