// ============================================
// utils/emailService.js — Email Notification Service
// ============================================
const nodemailer = require('nodemailer');

/**
 * Creates and returns a Nodemailer transport using Gmail.
 * Expects GMAIL_USER and GMAIL_APP_PASSWORD in environment.
 */
let cachedTransporter = null;

function getTransporter() {
    const rawUser = process.env.GMAIL_USER;
    const pass = process.env.GMAIL_APP_PASSWORD || process.env.GMAIL_PASS;

    if (!rawUser || !pass) {
        return null;
    }

    const user = rawUser.includes('@') ? rawUser : `${rawUser}@gmail.com`;

    if (!cachedTransporter) {
        cachedTransporter = nodemailer.createTransport({
            service: 'gmail',
            auth: {
                user,
                pass
            },
            connectionTimeout: 5000, // 5s timeout to prevent hanging on cloud hosts where SMTP is blocked
            greetingTimeout: 5000,
            socketTimeout: 5000
        });
    }

    return cachedTransporter;
}

/**
 * Send password reset email with 6-digit OTP code and direct reset link.
 *
 * Supports:
 * 1. Brevo HTTP REST API (Port 443 — works on Render Free Tier)
 * 2. Resend HTTP REST API (Port 443 — works on Render Free Tier)
 * 3. Nodemailer Gmail SMTP (Localhost or Paid Cloud with open SMTP ports)
 *
 * @param {object} params
 * @param {string} params.toEmail - Recipient email address
 * @param {string} params.recipientName - Full name of the admin
 * @param {string} params.otpCode - 6-digit verification code
 * @param {string} params.resetUrl - Full one-click reset URL
 */
async function sendPasswordResetEmail({ toEmail, recipientName, otpCode, resetUrl }) {
    const rawUser = process.env.GMAIL_USER || 'barangaypinyahan1@gmail.com';
    const fromAddress = rawUser.includes('@') ? rawUser : `${rawUser}@gmail.com`;

    const htmlContent = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <title>Password Reset Request - Barangay Pinyahan</title>
      <style>
        body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; background-color: #f4f7f6; margin: 0; padding: 20px; }
        .container { max-width: 560px; margin: 0 auto; background: #ffffff; border-radius: 16px; overflow: hidden; box-shadow: 0 4px 20px rgba(0,0,0,0.06); border: 1px solid #e2e8f0; }
        .header { background: #0056b3; padding: 28px 24px; text-align: center; color: #ffffff; }
        .header h1 { margin: 0; font-size: 20px; font-weight: 800; letter-spacing: 0.5px; }
        .header p { margin: 4px 0 0; font-size: 12px; opacity: 0.85; text-transform: uppercase; letter-spacing: 1px; }
        .content { padding: 32px 28px; color: #2d3748; line-height: 1.6; }
        .otp-box { margin: 24px 0; padding: 18px; background: #ebf4ff; border: 2px dashed #0056b3; border-radius: 12px; text-align: center; }
        .otp-code { font-size: 32px; font-weight: 900; letter-spacing: 6px; color: #0056b3; font-family: monospace; }
        .btn-container { text-align: center; margin: 28px 0; }
        .btn { display: inline-block; background: #0056b3; color: #ffffff !important; text-decoration: none; padding: 12px 28px; font-weight: 700; font-size: 14px; border-radius: 8px; box-shadow: 0 4px 12px rgba(0,86,179,0.25); }
        .footer { padding: 20px 28px; background: #f8fafc; border-top: 1px solid #edf2f7; text-align: center; font-size: 11px; color: #a0aec0; }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <h1>Barangay Pinyahan</h1>
          <p>Administrative Portal • Security Verification</p>
        </div>
        <div class="content">
          <p>Hello <strong>${recipientName || 'Administrator'}</strong>,</p>
          <p>We received a request to reset your password for the Barangay Pinyahan Administrative Portal. You can verify your identity using the 6-digit code below or by clicking the direct reset button.</p>

          <div class="otp-box">
            <div style="font-size: 11px; font-weight: 800; color: #4a5568; text-transform: uppercase; letter-spacing: 1px; margin-bottom: 6px;">Your 6-Digit Verification Code</div>
            <div class="otp-code">${otpCode}</div>
            <div style="font-size: 11px; color: #718096; margin-top: 6px;">Valid for 15 minutes</div>
          </div>

          <div class="btn-container">
            <a href="${resetUrl}" class="btn" target="_blank">Reset Password Directly</a>
          </div>

          <p style="font-size: 12px; color: #718096; margin-top: 24px;">
            If you did not request a password reset, please disregard this email. Your password will remain unchanged and your account remains secure.
          </p>
        </div>
        <div class="footer">
          &copy; ${new Date().getFullYear()} Barangay Pinyahan Administration. All rights reserved.
        </div>
      </div>
    </body>
    </html>
    `;

    // ── METHOD 1: Brevo HTTP REST API (Port 443 — Unrestricted on Render Free Tier) ──
    if (process.env.BREVO_API_KEY) {
        try {
            const res = await fetch('https://api.brevo.com/v3/smtp/email', {
                method: 'POST',
                headers: {
                    'api-key': process.env.BREVO_API_KEY.trim(),
                    'Content-Type': 'application/json',
                    'Accept': 'application/json'
                },
                body: JSON.stringify({
                    sender: { name: 'Barangay Pinyahan Admin', email: fromAddress },
                    to: [{ email: toEmail, name: recipientName || 'Administrator' }],
                    subject: 'Password Reset Verification Code - Barangay Pinyahan',
                    htmlContent: htmlContent,
                    textContent: `Your password reset code is: ${otpCode}. You can also reset via this link: ${resetUrl} (expires in 15 minutes).`
                })
            });
            const data = await res.json();
            if (res.ok) {
                console.log(`✉️ Password reset email dispatched via Brevo HTTP API to ${toEmail} (Message ID: ${data.messageId})`);
                return { sent: true };
            } else {
                console.error('❌ Brevo HTTP API returned error:', data);
            }
        } catch (apiErr) {
            console.error('❌ Failed to dispatch via Brevo HTTP API:', apiErr.message);
        }
    }

    // ── METHOD 2: Resend HTTP REST API (Port 443 — Unrestricted on Render Free Tier) ──
    if (process.env.RESEND_API_KEY) {
        try {
            const res = await fetch('https://api.resend.com/emails', {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${process.env.RESEND_API_KEY.trim()}`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    from: process.env.RESEND_FROM || 'Barangay Pinyahan <onboarding@resend.dev>',
                    to: [toEmail],
                    subject: 'Password Reset Verification Code - Barangay Pinyahan',
                    html: htmlContent,
                    text: `Your password reset code is: ${otpCode}. You can also reset via this link: ${resetUrl} (expires in 15 minutes).`
                })
            });
            const data = await res.json();
            if (res.ok) {
                console.log(`✉️ Password reset email dispatched via Resend HTTP API to ${toEmail} (ID: ${data.id})`);
                return { sent: true };
            } else {
                console.error('❌ Resend HTTP API returned error:', data);
            }
        } catch (apiErr) {
            console.error('❌ Failed to dispatch via Resend HTTP API:', apiErr.message);
        }
    }

    // ── METHOD 3: Nodemailer SMTP (Works on Localhost or Paid Cloud instances) ──────
    const transporter = getTransporter();

    if (transporter) {
        try {
            const info = await transporter.sendMail({
                from: `"Barangay Pinyahan Admin" <${fromAddress}>`,
                to: toEmail,
                subject: 'Password Reset Verification Code - Barangay Pinyahan',
                text: `Your password reset code is: ${otpCode}. You can also reset via this link: ${resetUrl} (expires in 15 minutes).`,
                html: htmlContent
            });
            console.log(`✉️ Password reset email successfully dispatched via SMTP to ${toEmail} (Message ID: ${info.messageId})`);
            return { sent: true };
        } catch (mailErr) {
            console.error('❌ Failed to send reset email via Gmail SMTP:', mailErr.message);
            return { sent: false, error: mailErr.message };
        }
    } else {
        console.warn('⚠️ No email delivery service configured (GMAIL_USER/APP_PASSWORD, BREVO_API_KEY, or RESEND_API_KEY). Email not sent.');
        return { sent: false, error: 'No email service credentials configured' };
    }
}

module.exports = {
    sendPasswordResetEmail,
    getTransporter
};
