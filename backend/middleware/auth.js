// ============================================
// middleware/auth.js — JWT Authentication Middleware
// ============================================
const jwt = require('jsonwebtoken');

// Middleware to verify JWT token on protected routes
function verifyToken(req, res, next) {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1]; // "Bearer <token>"

    if (!token) {
        return res.status(401).json({ error: 'Access denied. No token provided.' });
    }

    try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        req.admin = decoded; // { id, username, full_name, role }
        next();
    } catch (error) {
        return res.status(403).json({ error: 'Invalid or expired token.' });
    }
}

module.exports = verifyToken;
