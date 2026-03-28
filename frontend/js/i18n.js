const translationDict = {
    // Nav 
    "HOME": "HOME",
    "ABOUT US": "TUNGKOL SA AMIN",
    "SERVICES": "MGA SERBISYO",
    "NEWS & EVENTS": "BALITA AT KAGANAPAN",
    "CITIZENS CHARTER": "TSARTER NG MAMAMAYAN",
    "SUBMIT COMPLAINT": "MAGSUMITE NG REKLAMO",
    "TRACK COMPLAINT": "ALAMIN ANG STATUS",

    // Home
    "WELCOME TO BARANGAY PINYAHAN": "MALIGAYANG PAGDATING SA BARANGAY PINYAHAN",
    "Stay informed and connected with your community. Discover the latest news, events, and services right here.": "Manatiling konektado sa komunidad. Tuklasin ang pinakabagong balita, kaganapan, at serbisyo dito.",

    // General UI
    "LATEST NEWS": "PINAKABAGONG BALITA",
    "UPCOMING EVENTS": "MGA NALALAPIT NA KAGANAPAN",
    "LEARN MORE": "ALAMIN PA",
    "CONTACT INFORMATION": "IMPORMASYON SA PAKIKIPAG-UGNAYAN",
    "MAP LOCATION": "MAPA NG LOKASYON",
    "EMERGENCY HOTLINE": "HOTLINE NG EMERHENSIYA",
    "REPUBLIC OF THE PHILIPPINES": "REPUBLIKA NG PILIPINAS",
    "All content is in the public domain unless otherwise stated.": "Lahat ng nilalaman ay pampublikong domain maliban kung nakasaad.",
    "ADDRESS: Malakas St, Diliman, Quezon City": "LOKASYON: Malakas St, Diliman, Lungsod Quezon",
    "Back to Homepage": "Bumalik sa Homepage",
    "Back to News & Events": "Bumalik sa Balita",

    // Complaint Forms
    "SUBMIT A COMPLAINT": "MAGSAKDAL NG REKLAMO",
    "Track Your Complaint": "Sundan ang Iyong Reklamo",
    "Address": "Address / Tirahan",
    "Contact Number": "Numero (Contact)",
    "Type of Complaint": "Uri ng Reklamo",
    "Message": "Mensahe / Detalye",
    "Complaint Reference Number": "Numero ng Reperensiya",
    "Full Name": "Buong Pangalan",
    "Track Complaint": "Itract ang Reklamo",
    "ADD PHOTO": "MAGDAGDAG NG LARAWAN",
    "(Optional)": "(Opsyonal)",

    // About Us
    "HISTORY OF BARANGAY PINYAHAN": "KASAYSAYAN NG BARANGAY PINYAHAN",
    "MISSION & VISION": "MISYON AT BISYON",
    "ORGANIZATIONAL CHART": "ORGANISASYON NG BARANGAY",

    // Citizens Charter
    "CITIZEN'S CHARTER": "TSARTER NG MGA MAMAMAYAN",
    "FRONTLINE SERVICES": "MGA SERBISYONG FRONTLINE",
    "Steps": "Hakbang",
    "Agency Action": "Aksyon ng Ahensya",
    "Fees": "Bayarin",
    "Time": "Oras",
    "Responsible": "Responsable",
    "None": "Wala",
    "Client Steps": "Hakbang ng Kliyente",
    "Fees to be Paid": "Bayarin",
    "Processing Time": "Oras ng Proseso",
    "Person Responsible": "Taong Responsable",
    "Issuance of Barangay Clearance": "Pagkuha ng Barangay Clearance",
    "Issuance of Certificate of Indigency": "Pagkuha ng Katibayan ng Kalagayang Mahirap"
};

let textNodesData = [];

function parseDOMNodes() {
    textNodesData = [];
    const walker = document.createTreeWalker(document.body, NodeFilter.SHOW_TEXT, null, false);
    let node;
    while ((node = walker.nextNode())) {
        if (node.nodeValue.trim() !== '') {
            const parentTagName = node.parentElement ? node.parentElement.tagName : '';
            // Ignore script, style, and icon tags
            if (parentTagName !== 'SCRIPT' && parentTagName !== 'STYLE' && parentTagName !== 'I') {
                textNodesData.push({
                    node: node,
                    originalText: node.nodeValue
                });
            }
        }
    }
}

function applyTranslations(lang) {
    if (textNodesData.length === 0) parseDOMNodes();

    // Text Nodes
    textNodesData.forEach(item => {
        const trimmedStr = item.originalText.trim();
        if (lang === 'tl' && translationDict[trimmedStr]) {
            item.node.nodeValue = item.originalText.replace(trimmedStr, translationDict[trimmedStr]);
        } else {
            item.node.nodeValue = item.originalText;
        }
    });

    // Placeholders and Buttons
    const elements = document.querySelectorAll('input[placeholder], textarea[placeholder], button');
    elements.forEach(el => {
        if (!el.dataset.i18nOrig) {
            el.dataset.i18nOrig = el.getAttribute('placeholder') || el.textContent.trim();
        }
        const orig = el.dataset.i18nOrig;
        if (lang === 'tl' && translationDict[orig]) {
            if (el.hasAttribute('placeholder')) el.setAttribute('placeholder', translationDict[orig]);
            if (el.tagName === 'BUTTON' && el.childNodes.length === 1) el.textContent = translationDict[orig];
        } else {
            if (el.hasAttribute('placeholder')) el.setAttribute('placeholder', orig);
            if (el.tagName === 'BUTTON' && el.childNodes.length === 1) el.textContent = orig;
        }
    });
}

function initI18n() {
    // Inject lang toggle switch into the header content automatically
    const headerBlock = document.querySelector('.header-content');
    if (!headerBlock) return;

    const toggleContainer = document.createElement('div');
    toggleContainer.className = 'i18n-toggle';
    toggleContainer.innerHTML = `
        <span class="i18n-btn" id="lang-en">ENG</span>
        <span style="color:#2073bd;">|</span>
        <span class="i18n-btn" id="lang-tl">TAG</span>
    `;

    // Only append if it doesn't already exist
    if (!document.querySelector('.i18n-toggle')) {
        headerBlock.appendChild(toggleContainer);
    }

    // Add minimal CSS for the toggle
    const style = document.createElement('style');
    style.textContent = `
        .i18n-toggle { display: inline-flex; align-items: center; gap: 8px; background: #e8f0fa; padding: 6px 14px; border-radius: 20px; font-weight: bold; font-size: 0.9rem; margin-left: auto; border: 1px solid #c8dcf0;}
        .i18n-btn { cursor: pointer; color: #555; transition: color 0.2s; }
        .i18n-btn:hover { color: #0056b3; }
        .i18n-active { color: #0056b3; text-decoration: underline; text-underline-offset: 4px;}
        @media(max-width:768px){ .i18n-toggle { margin: 10px auto; } }
    `;
    document.head.appendChild(style);

    // Initial load state
    const savedLang = localStorage.getItem('pinyahan_lang') || 'en';
    document.getElementById('lang-' + savedLang).classList.add('i18n-active');
    
    // We delay parsing DOM slightly to let UI settle if needed visually
    setTimeout(() => {
        applyTranslations(savedLang);
    }, 50);

    // Event listeners
    document.querySelector('.i18n-toggle').addEventListener('click', (e) => {
        if (e.target.classList.contains('i18n-btn')) {
            const chosenLang = e.target.id === 'lang-en' ? 'en' : 'tl';
            localStorage.setItem('pinyahan_lang', chosenLang);
            
            document.querySelectorAll('.i18n-btn').forEach(b => b.classList.remove('i18n-active'));
            e.target.classList.add('i18n-active');
            
            applyTranslations(chosenLang);
        }
    });
}

// Start listener
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initI18n);
} else {
    initI18n();
}
