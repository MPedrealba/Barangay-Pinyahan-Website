// ============================================
// scripts/test-force-change-password.js
// ============================================
// Verifies:
// 1. New admin creation with requires_password_change = TRUE
// 2. Login response returns strict boolean true
// 3. Force-change-password endpoint updates password and clears flag
// 4. Subsequent login returns strict boolean false
// 5. Cleanup test record
// ============================================

const mysql = require('mysql2/promise');
const bcrypt = require('bcrypt');
const path = require('path');
const dotenv = require('dotenv');

dotenv.config({ path: path.join(__dirname, '..', '.env') });

const DB_NAME = process.env.DB_NAME || 'test';

async function runTest() {
    console.log('🧪 Starting Forced Password Change Verification Test...');

    const db = await mysql.createPool({
        host: process.env.DB_HOST,
        user: process.env.DB_USER,
        password: process.env.DB_PASSWORD,
        database: DB_NAME,
        port: process.env.DB_PORT,
        ssl: { rejectUnauthorized: true },
    });

    const testUsername = 'test_verify_admin_' + Date.now();
    const defaultPassword = 'admin123';
    const newPassword = 'NewSecretPassword@2026';

    try {
        const hash = await bcrypt.hash(defaultPassword, 10);

        // 1. Insert test admin with requires_password_change = TRUE
        await db.query(
            `INSERT INTO admins (full_name, username, email, password_hash, role, requires_password_change)
             VALUES (?, ?, ?, ?, 'Admin', TRUE)`,
            ['Test Admin', testUsername, `${testUsername}@example.com`, hash]
        );
        console.log(`✅ Created test admin: ${testUsername} (requires_password_change = TRUE)`);

        // 2. Test login via API
        const loginRes = await fetch('http://localhost:5000/api/auth/login', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ username: testUsername, password: defaultPassword })
        });

        if (!loginRes.ok) {
            throw new Error(`Login failed with status ${loginRes.status}`);
        }

        const loginData = await loginRes.json();
        console.log('Login Response Admin:', loginData.admin);

        if (typeof loginData.admin.requires_password_change !== 'boolean') {
            throw new Error(`Expected boolean type for requires_password_change, got ${typeof loginData.admin.requires_password_change}`);
        }

        if (loginData.admin.requires_password_change !== true) {
            throw new Error(`Expected requires_password_change === true, got ${loginData.admin.requires_password_change}`);
        }
        console.log('✅ PASS: requires_password_change is strictly boolean `true`');

        // 3. Test force-change-password API
        const changeRes = await fetch('http://localhost:5000/api/auth/force-change-password', {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ username: testUsername, new_password: newPassword })
        });

        if (!changeRes.ok) {
            throw new Error(`Force change password failed with status ${changeRes.status}`);
        }
        console.log('✅ PASS: Force change password API updated password successfully');

        // 4. Test login with new password
        const newLoginRes = await fetch('http://localhost:5000/api/auth/login', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ username: testUsername, password: newPassword })
        });

        if (!newLoginRes.ok) {
            throw new Error(`New login failed with status ${newLoginRes.status}`);
        }

        const newLoginData = await newLoginRes.json();
        if (newLoginData.admin.requires_password_change !== false) {
            throw new Error(`Expected requires_password_change === false after change, got ${newLoginData.admin.requires_password_change}`);
        }
        console.log('✅ PASS: After password change, requires_password_change is strictly boolean `false`');

        // 5. Cleanup
        await db.query('DELETE FROM admins WHERE username = ?', [testUsername]);
        console.log(`✅ Cleaned up test admin: ${testUsername}`);

        console.log('\n🎉 ALL TESTS PASSED! Forced password change is strictly enforced.');
    } catch (err) {
        console.error('❌ Test failed:', err.message);
        await db.query('DELETE FROM admins WHERE username = ?', [testUsername]).catch(() => {});
        process.exit(1);
    } finally {
        await db.end();
        process.exit(0);
    }
}

runTest();
