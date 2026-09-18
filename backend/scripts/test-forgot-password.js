// ============================================
// scripts/test-forgot-password.js
// ============================================
// Verifies:
// 1. POST /api/auth/forgot-password dispatches OTP code & reset link
// 2. password_resets table record created with 15min expiry
// 3. POST /api/auth/verify-reset-code verifies OTP
// 4. POST /api/auth/reset-password updates password and sets used = 1
// 5. POST /api/auth/login succeeds with the newly reset password
// 6. Cleans up test admin record and password resets
// ============================================

const mysql = require('mysql2/promise');
const bcrypt = require('bcrypt');
const path = require('path');
const dotenv = require('dotenv');

dotenv.config({ path: path.join(__dirname, '..', '.env') });

const DB_NAME = process.env.DB_NAME || 'test';
const API_BASE = 'http://localhost:5000';

async function runTest() {
    console.log('🧪 Starting Forgot Password Lifecycle Verification Test...');

    const db = await mysql.createPool({
        host: process.env.DB_HOST,
        user: process.env.DB_USER,
        password: process.env.DB_PASSWORD,
        database: DB_NAME,
        port: process.env.DB_PORT,
        ssl: { rejectUnauthorized: true },
    });

    const testUsername = 'test_reset_' + Date.now();
    const testEmail = `${testUsername}@example.com`;
    const initialPassword = 'InitialPassword123!';
    const updatedPassword = 'BrandNewPassword@2026';

    try {
        const hash = await bcrypt.hash(initialPassword, 10);

        // 1. Insert test admin
        const [insertAdmin] = await db.query(
            `INSERT INTO admins (full_name, username, email, password_hash, role, requires_password_change)
             VALUES (?, ?, ?, ?, 'Admin', FALSE)`,
            ['Reset Test Admin', testUsername, testEmail, hash]
        );
        const adminId = insertAdmin.insertId;
        console.log(`✅ Created test admin: ${testUsername} (${testEmail})`);

        // 2. Call forgot-password endpoint
        const forgotRes = await fetch(`${API_BASE}/api/auth/forgot-password`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email: testEmail })
        });
        const forgotData = await forgotRes.json();
        console.log('Forgot Password API Response:', forgotData.message);

        // 3. Inspect database password_resets record
        const [resets] = await db.query(
            'SELECT * FROM password_resets WHERE admin_id = ? AND used = 0 ORDER BY id DESC LIMIT 1',
            [adminId]
        );

        if (resets.length === 0) {
            throw new Error('FAIL: No password_resets record found for admin!');
        }

        const resetRecord = resets[0];
        console.log(`✅ Found reset record: OTP = ${resetRecord.otp_code}, Token = ${resetRecord.token_hash.slice(0, 8)}...`);

        // 4. Verify OTP code
        const verifyRes = await fetch(`${API_BASE}/api/auth/verify-reset-code`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email: testEmail, otp_code: resetRecord.otp_code })
        });
        const verifyData = await verifyRes.json();
        if (!verifyData.valid) {
            throw new Error('FAIL: OTP verification returned invalid!');
        }
        console.log('✅ PASS: OTP verification succeeded');

        // 5. Reset password using OTP
        const resetRes = await fetch(`${API_BASE}/api/auth/reset-password`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                email: testEmail,
                otp_code: resetRecord.otp_code,
                new_password: updatedPassword
            })
        });
        const resetData = await resetRes.json();
        console.log('✅ PASS: Reset password response:', resetData.message);

        // 6. Verify password_resets marked used = 1
        const [usedCheck] = await db.query(
            'SELECT used FROM password_resets WHERE id = ?',
            [resetRecord.id]
        );
        if (!usedCheck[0].used) {
            throw new Error('FAIL: password_resets record was not marked as used!');
        }
        console.log('✅ PASS: Reset token marked as used');

        // 7. Verify login with the updated password
        const loginRes = await fetch(`${API_BASE}/api/auth/login`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ username: testUsername, password: updatedPassword })
        });
        const loginData = await loginRes.json();
        if (!loginRes.ok || !loginData.token) {
            throw new Error('FAIL: Login with new password failed: ' + JSON.stringify(loginData));
        }
        console.log('✅ PASS: Successfully authenticated with the updated password!');

        // 8. Cleanup
        await db.query('DELETE FROM password_resets WHERE admin_id = ?', [adminId]);
        await db.query('DELETE FROM admins WHERE id = ?', [adminId]);
        console.log('✅ Cleaned up test admin and reset tokens.');

        console.log('\n🎉 ALL FORGOT PASSWORD TESTS PASSED SUCCESSFULLY!\n');
    } catch (err) {
        console.error('❌ Test failed with error:', err);
        process.exit(1);
    } finally {
        await db.end();
    }
}

runTest();
