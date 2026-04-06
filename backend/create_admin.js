const mysql = require('mysql2/promise');
const bcrypt = require('bcrypt');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '.env') });

async function fixAdminPassword() {
    console.log("⏳ Connecting to Database...");
    
    // Connect using exact server configuration
    const connection = await mysql.createConnection({
        host: process.env.DB_HOST,
        user: process.env.DB_USER,
        password: process.env.DB_PASSWORD,
        database: process.env.DB_NAME,
        port: process.env.DB_PORT,
        ssl: process.env.DB_SSL === "false" ? undefined : {
            minVersion: "TLSv1.2",
            rejectUnauthorized: true,
        }
    });

    console.log("✅ Connected successfully!");
    console.log("⏳ Generating secure bcrypt hash for 'admin123'...");

    try {
        // Hash 'admin123' with 10 salt rounds (matches schema needs)
        const hashedPassword = await bcrypt.hash('admin123', 10);
        
        console.log("⚙️ Updating database for user 'JohnDoe_1'...");
        
        // Update the dummy hash seeded by the sql file
        const [result] = await connection.execute(
            'UPDATE admins SET password_hash = ? WHERE username = ?',
            [hashedPassword, 'JohnDoe_1']
        );

        if (result.affectedRows > 0) {
            console.log("🎉 SUCCESS! The admin account is ready to use.");
            console.log("👉 You can now log in with:");
            console.log("   Username: JohnDoe_1");
            console.log("   Password: admin123");
        } else {
            console.log("⚠️ User 'JohnDoe_1' not found. Did you run setup_tidb.js?");
        }

    } catch (error) {
        console.error("❌ ERROR updating database:", error.message);
    } finally {
        await connection.end();
        console.log("🔌 Connection closed.");
    }
}

fixAdminPassword();
