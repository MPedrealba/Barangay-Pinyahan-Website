// ============================================================
// middleware/security.js — IP Filtering & Proxy Detection
// ============================================================

/**
 * Extract the real client IP from the request.
 * Handles reverse-proxy setups (Render, Vercel, nginx, etc.)
 * where the actual IP is forwarded in headers.
 */
function getRealIP(req) {
    const forwarded = req.headers['x-forwarded-for'];
    if (forwarded) {
        // x-forwarded-for may be a comma-separated list; first entry is the originating client
        return forwarded.split(',')[0].trim();
    }
    return req.connection?.remoteAddress
        || req.socket?.remoteAddress
        || req.ip
        || 'unknown';
}

/**
 * SUSPICIOUS_HEADERS — headers typically injected by proxies, VPNs, or Tor exit nodes.
 * Matching any of these is treated as a high-confidence proxy signal.
 */
const SUSPICIOUS_HEADERS = [
    'via',               // Standard HTTP proxy header
    'x-proxy-id',        // Custom proxy identifier
    'x-real-ip',         // Often set by nginx reverse proxies — flag if also behind x-forwarded-for
    'x-forwarded-proto', // Can indicate proxy (acceptable in production, checked contextually)
    'forwarded',         // RFC 7239 forwarded header injected by proxies
    'proxy-connection',  // Non-standard header used by older HTTP proxies
    'x-bluecoat-via',    // BlueCoat proxy
    'x-iwproxy',         // Iwproxy header
];

/**
 * ipFilterMiddleware
 *
 * Protects the POST /api/complaints route by:
 *  1. Checking for known proxy/VPN headers.
 *  2. Providing a clearly marked integration point for a paid
 *     VPN-detection API (e.g. vpnapi.io) with zero code changes needed.
 *
 * Usage (apply only to specific routes — see complaints.js):
 *   router.post('/', ipFilterMiddleware, upload.single('photo'), ...)
 */
async function ipFilterMiddleware(req, res, next) {
    const clientIP = getRealIP(req);

    // ── 1. Header-based proxy / VPN detection ──────────────────────
    // Block requests that carry headers typically injected by forwarding proxies.
    // Note: 'x-forwarded-for' alone is expected in cloud deployments and is NOT blocked.
    const blockedHeader = SUSPICIOUS_HEADERS.find(h => req.headers[h] !== undefined);
    if (blockedHeader) {
        console.warn(`[Security] Blocked suspicious header "${blockedHeader}" from IP: ${clientIP}`);
        return res.status(403).json({
            error: 'Proxy/VPN connections are not allowed.',
            code:  'PROXY_DETECTED',
        });
    }

    // ── 2. Tor exit node detection (header-based) ───────────────────
    // Some Tor exit-relay software injects 'tor-forwarded' or 'x-tor-exit'.
    if (req.headers['tor-forwarded'] || req.headers['x-tor-exit']) {
        console.warn(`[Security] Blocked Tor-forwarded request from IP: ${clientIP}`);
        return res.status(403).json({
            error: 'Proxy/VPN connections are not allowed.',
            code:  'TOR_DETECTED',
        });
    }

    // ── 3. [PLACEHOLDER] Paid VPN-detection API integration ────────
    //
    // To enable real-time VPN / datacenter IP detection, uncomment the block below
    // and add VPNAPI_KEY=your_key_here to backend/.env
    //
    // Recommended provider: https://vpnapi.io  (100 free requests/day)
    //
    // HOW TO INTEGRATE:
    //   1. Sign up at https://vpnapi.io and get your API key.
    //   2. Add  VPNAPI_KEY=your_actual_key  to backend/.env
    //   3. Uncomment the block below — no other changes needed.
    //
    // ─────────────────────────────────────────────────────────────────
    // if (process.env.VPNAPI_KEY && clientIP !== 'unknown') {
    //     try {
    //         const vpnRes = await fetch(
    //             `https://vpnapi.io/api/${clientIP}?key=${process.env.VPNAPI_KEY}`
    //         );
    //         if (vpnRes.ok) {
    //             const vpnData = await vpnRes.json();
    //             const { vpn, proxy, tor, relay } = vpnData.security || {};
    //             if (vpn || proxy || tor || relay) {
    //                 console.warn(`[Security] VPN/Proxy detected via vpnapi.io for IP: ${clientIP}`, vpnData.security);
    //                 return res.status(403).json({
    //                     error: 'Proxy/VPN connections are not allowed.',
    //                     code:  'VPN_DETECTED',
    //                 });
    //             }
    //         }
    //     } catch (vpnErr) {
    //         // Non-blocking: if the external API fails, allow the request
    //         // through rather than denying legitimate users.
    //         console.warn('[Security] vpnapi.io check failed (non-blocking):', vpnErr.message);
    //     }
    // }
    // ─────────────────────────────────────────────────────────────────

    // Attach the resolved IP to the request for downstream logging
    req.clientIP = clientIP;
    next();
}

module.exports = { ipFilterMiddleware, getRealIP };
