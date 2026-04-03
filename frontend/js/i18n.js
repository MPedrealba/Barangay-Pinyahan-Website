/**
 * i18n.js — Barangay Pinyahan Language System
 * Handles:
 *  1. Language selection modal (first-time visit)
 *  2. localStorage persistence of language choice
 *  3. Dynamic page-text translation (EN / TL)
 */

// ─── Translation Dictionary ──────────────────────────────────────────────────

const TRANSLATIONS = {
    en: {
        // Navigation
        'nav.home':             'HOME',
        'nav.about':            'ABOUT US',
        'nav.services':         'SERVICES',
        'nav.news':             'NEWS & EVENTS',
        'nav.charter':          'CITIZENS CHARTER',
        'nav.complaint':        'SUBMIT COMPLAINT',
        'nav.track':            'TRACK COMPLAINT',

        // Homepage sections
        'home.welcome.title':   'Welcome to the Barangay Pinyahan Official Website!',
        'home.welcome.p1':      "We're happy to have you here! This space was created to keep our community informed, connected, and involved. Whether you're looking for the latest announcements, ongoing projects, public services, or ways to participate in our programs, everything you need is just a few clicks away.",
        'home.welcome.p2':      "Our barangay thrives because of the people who call it home—and we hope this website makes it easier for you to stay updated, raise concerns, and engage with us. Thank you for being an important part of our community. Together, let's continue building a safe, caring, and progressive barangay.",
        'home.events.title':    'EVENTS',
        'home.news.title':      'NEWS & UPDATES',

        // Footer
        'footer.contact.title':     'CONTACT INFORMATION',
        'footer.contact.facebook':  'Facebook:',
        'footer.contact.email':     'Email:',
        'footer.contact.tel':       'Tel:',
        'footer.contact.address':   'Malakas St, Diliman, Quezon City',
        'footer.map.title':         'MAP LOCATION',
        'footer.map.address':       'Malakas St, Diliman, Quezon City, Metro Manila',
        'footer.hotlines.title':    'EMERGENCY HOTLINES',
        'footer.hotlines.national': 'National Emergency',
        'footer.hotlines.pnp':      'Philippine National Police',
        'footer.hotlines.redcross': 'Philippine Red Cross',
        'footer.hotlines.bfp':      'Bureau of Fire Protection',
        'footer.hotlines.dswd':     'DSWD',
        'footer.hotlines.coastguard': 'Coast Guard',
        'footer.gov.republic':      'REPUBLIC OF THE PHILIPPINES',
        'footer.gov.domain':        'All content is in the public domain unless otherwise stated.',
        'footer.admin.link':        'Admin Login',
        'footer.copy':              '© 2025 Barangay Pinyahan. All rights reserved.',

        // Submit Complaint
        'complaint.title':          'SUBMIT A COMPLAINT',
        'complaint.fullname':       'Full Name',
        'complaint.address':        'Address',
        'complaint.contact':        'Contact Number',
        'complaint.type':           'Type of Complaint',
        'complaint.type.noise':     'Noise Complaint',
        'complaint.type.trash':     'Garbage/Trash Issue',
        'complaint.type.security':  'Security Concern',
        'complaint.type.other':     'Other',
        'complaint.message':        'Message',
        'complaint.photo':          'ADD PHOTO',
        'complaint.photo.opt':      '(Optional)',
        'complaint.submit':         'SUBMIT COMPLAINT',

        // Track Complaint
        'track.title':              'Track Your Complaint',
        'track.refno':              'Complaint Reference Number',
        'track.fullname':           'Full Name',
        'track.btn':                'Track Complaint',

        // About
        'about.history.title':      'BARANGAY HISTORY',
        'about.mission':            'MISSION:',
        'about.vision':             'VISION:',
        'about.org.title':          'ORGANIZATIONAL CHART',

        // Services
        'services.title':           'SERVICE LISTING',
        'services.hero':            'BARANGAY COMMUNITY SERVICES',
        'services.process':         'PROCESS',
        'services.req':             'REQUIREMENTS:',
        'services.proc':            'PROCEDURE:',
        'services.other':           'OTHER SERVICES:',
        'services.learnmore':       'LEARN MORE',
    },

    tl: {
        // Navigation
        'nav.home':             'TAHANAN',
        'nav.about':            'TUNGKOL SA AMIN',
        'nav.services':         'MGA SERBISYO',
        'nav.news':             'BALITA AT KAGANAPAN',
        'nav.charter':          'CITIZENS CHARTER',
        'nav.complaint':        'MAGSUMITE NG REKLAMO',
        'nav.track':            'SUBAYBAYAN ANG REKLAMO',

        // Homepage sections
        'home.welcome.title':   'Maligayang pagdating sa opisyal na website ng Barangay Pinyahan!',
        'home.welcome.p1':      "Masaya kaming nasa dito ka! Ang puwang na ito ay nilikha upang mapanatiling may kaalaman, konektado, at kasangkot ang aming komunidad. Kung naghahanap ka ng pinakabagong anunsyo, mga proyektong nagpapatuloy, serbisyong pampubliko, o mga paraan upang lumahok sa aming mga programa, lahat ng kailangan mo ay nasa ilang click lamang.",
        'home.welcome.p2':      "Ang aming barangay ay umuunlad dahil sa mga taong tinatawag itong tahanan—at umaasa kaming gawing mas madali ng website na ito ang pananatiling updated, pagpapahayag ng mga alalahanin, at pakikipag-ugnayan sa amin. Salamat sa pagiging mahalagang bahagi ng aming komunidad. Sama-sama, ipagpatuloy nating itayo ang isang ligtas, mapagmahal, at progresibong barangay.",
        'home.events.title':    'MGA KAGANAPAN',
        'home.news.title':      'BALITA AT MGA UPDATE',

        // Footer
        'footer.contact.title':     'IMPORMASYON SA PAKIKIPAG-UGNAYAN',
        'footer.contact.facebook':  'Facebook:',
        'footer.contact.email':     'Email:',
        'footer.contact.tel':       'Tel:',
        'footer.contact.address':   'Malakas St, Diliman, Quezon City',
        'footer.map.title':         'LOKASYON SA MAPA',
        'footer.map.address':       'Malakas St, Diliman, Quezon City, Metro Manila',
        'footer.hotlines.title':    'MGA HOTLINE SA EMERHENSYA',
        'footer.hotlines.national': 'Pambansang Emerhensya',
        'footer.hotlines.pnp':      'Pambansang Pulisya ng Pilipinas',
        'footer.hotlines.redcross': 'Philippine Red Cross',
        'footer.hotlines.bfp':      'Bureau of Fire Protection',
        'footer.hotlines.dswd':     'DSWD',
        'footer.hotlines.coastguard': 'Tanod-Dagat',
        'footer.gov.republic':      'REPUBLIKA NG PILIPINAS',
        'footer.gov.domain':        'Lahat ng nilalaman ay para sa pampublikong domain maliban kung iba ang nakatala.',
        'footer.admin.link':        'Login ng Admin',
        'footer.copy':              '© 2025 Barangay Pinyahan. Lahat ng karapatan ay nakalaan.',

        // Submit Complaint
        'complaint.title':          'MAGSUMITE NG REKLAMO',
        'complaint.fullname':       'Buong Pangalan',
        'complaint.address':        'Address',
        'complaint.contact':        'Numero ng Kontak',
        'complaint.type':           'Uri ng Reklamo',
        'complaint.type.noise':     'Reklamo sa Ingay',
        'complaint.type.trash':     'Isyu sa Basura',
        'complaint.type.security':  'Alalahanin sa Seguridad',
        'complaint.type.other':     'Iba pa',
        'complaint.message':        'Mensahe',
        'complaint.photo':          'MAGDAGDAG NG LARAWAN',
        'complaint.photo.opt':      '(Opsyonal)',
        'complaint.submit':         'ISUMITE ANG REKLAMO',

        // Track Complaint
        'track.title':              'Subaybayan ang Iyong Reklamo',
        'track.refno':              'Reference Number ng Reklamo',
        'track.fullname':           'Buong Pangalan',
        'track.btn':                'Subaybayan ang Reklamo',

        // About
        'about.history.title':      'KASAYSAYAN NG BARANGAY',
        'about.mission':            'MISYON:',
        'about.vision':             'BISYON:',
        'about.org.title':          'TSART NG ORGANISASYON',

        // Services
        'services.title':           'LISTAHAN NG SERBISYO',
        'services.hero':            'MGA SERBISYO NG KOMUNIDAD NG BARANGAY',
        'services.process':         'PROSESO',
        'services.req':             'MGA KINAKAILANGAN:',
        'services.proc':            'PAMAMARAAN:',
        'services.other':           'IBA PANG SERBISYO:',
        'services.learnmore':       'ALAMIN PA',
    }
};

// ─── Core helpers ─────────────────────────────────────────────────────────────

const LANG_KEY = 'brgy-pinyahan-lang';

/** Read current language (default: 'en') */
function getCurrentLang() {
    return localStorage.getItem(LANG_KEY) || null;
}

/** Persist a language choice */
function setLang(lang) {
    localStorage.setItem(LANG_KEY, lang);
}

/** Get a translated string by key */
function t(key) {
    const lang = getCurrentLang() || 'en';
    return (TRANSLATIONS[lang] && TRANSLATIONS[lang][key]) ||
           (TRANSLATIONS['en'] && TRANSLATIONS['en'][key]) ||
           key;
}

// ─── Apply translations to DOM elements that carry data-i18n ─────────────────

function applyTranslations() {
    const lang = getCurrentLang() || 'en';
    document.querySelectorAll('[data-i18n]').forEach(el => {
        const key = el.getAttribute('data-i18n');
        const translation = (TRANSLATIONS[lang] && TRANSLATIONS[lang][key]) ||
                            (TRANSLATIONS['en']  && TRANSLATIONS['en'][key])  ||
                            key;
        // For inputs/textareas, update placeholder; for others, update text
        if (el.tagName === 'INPUT' || el.tagName === 'TEXTAREA') {
            el.placeholder = translation;
        } else if (el.tagName === 'OPTION') {
            el.textContent = translation;
        } else {
            el.textContent = translation;
        }
    });
}

// ─── Language Modal ───────────────────────────────────────────────────────────

/**
 * Resolve the correct relative path to the images/ folder from the current page.
 * – index.html lives at /frontend/ → images/ is one level up (images/)
 * – All subpages live at /frontend/html/homepage/ → ../../images/
 */
function resolveImgPath() {
    const path = window.location.pathname;
    if (path.includes('/html/homepage/') || path.includes('\\html\\homepage\\')) {
        return '../../images/';
    }
    return 'images/';
}

function buildModal() {
    const imgBase = resolveImgPath();

    const overlay = document.createElement('div');
    overlay.id = 'lang-modal-overlay';
    overlay.setAttribute('role', 'dialog');
    overlay.setAttribute('aria-modal', 'true');
    overlay.setAttribute('aria-labelledby', 'lang-modal-heading');

    overlay.innerHTML = `
        <div id="lang-modal">
            <div class="lang-modal-seals">
                <img src="${imgBase}Quezon_City_logo.svg" alt="Quezon City Official Seal">
                <div class="seal-dot"></div>
                <img src="${imgBase}Brgy._Pinyahan_Seal.png" alt="Barangay Pinyahan Official Seal">
            </div>

            <span class="lang-modal-badge">Official Portal</span>

            <h2 id="lang-modal-heading">Welcome to Barangay Pinyahan!</h2>

            <p class="lang-modal-sub">Please select your preferred language</p>
            <p class="lang-modal-sub-tl">Mangyaring piliin ang iyong wika</p>

            <div class="lang-modal-divider"></div>

            <div class="lang-modal-btns">
                <button class="lang-btn" id="btn-english" aria-label="Select English language">
                    <span class="lang-flag">🇺🇸</span>
                    <strong>English</strong>
                    <span class="lang-label">English</span>
                </button>
                <button class="lang-btn" id="btn-tagalog" aria-label="Piliin ang wikang Tagalog">
                    <span class="lang-flag">🇵🇭</span>
                    <strong>Filipino</strong>
                    <span class="lang-label">Tagalog</span>
                </button>
            </div>

            <p class="lang-modal-note">
                Your preference will be remembered for future visits.<br>
                Ang iyong kagustuhan ay itatago para sa mga susunod na pagbisita.
            </p>
        </div>
    `;

    return overlay;
}

function showLangModal() {
    // Inject CSS link if not already present
    if (!document.getElementById('lang-modal-css')) {
        const cssPath = resolveImgPath().replace('images/', 'css/lang-modal.css');
        const link = document.createElement('link');
        link.id = 'lang-modal-css';
        link.rel = 'stylesheet';
        link.href = cssPath;
        document.head.appendChild(link);
    }

    const overlay = buildModal();
    document.body.appendChild(overlay);
    document.body.style.overflow = 'hidden'; // prevent background scroll

    // Trap focus inside modal
    const firstBtn = overlay.querySelector('#btn-english');
    if (firstBtn) firstBtn.focus();

    function pickLang(lang) {
        setLang(lang);
        // Animate out
        overlay.style.transition = 'opacity 0.28s ease';
        overlay.style.opacity = '0';
        setTimeout(() => {
            overlay.remove();
            document.body.style.overflow = '';
            applyTranslations();
        }, 290);
    }

    overlay.querySelector('#btn-english').addEventListener('click', () => pickLang('en'));
    overlay.querySelector('#btn-tagalog').addEventListener('click', () => pickLang('tl'));

    // Keyboard: Escape closes and defaults to English
    overlay.addEventListener('keydown', e => {
        if (e.key === 'Escape') pickLang('en');
    });
}

// ─── Bootstrap on DOMContentLoaded ───────────────────────────────────────────

document.addEventListener('DOMContentLoaded', function () {
    const savedLang = getCurrentLang(); // null if first visit

    if (!savedLang) {
        // First-time visitor — show the modal
        showLangModal();
    } else {
        // Returning visitor — silently apply translations
        applyTranslations();
    }
});
