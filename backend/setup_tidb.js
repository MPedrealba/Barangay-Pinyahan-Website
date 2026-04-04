const mysql = require('mysql2/promise');
const fs = require('fs');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '.env') });

async function setupDatabase() {
    console.log("⏳ Connecting to TiDB Cloud Database...");
    
    // Create connection with multipleStatements true so it can run the entire SQL file
    const connection = await mysql.createConnection({
        host: process.env.DB_HOST,
        user: process.env.DB_USER,
        password: process.env.DB_PASSWORD,
        database: process.env.DB_NAME,
        port: process.env.DB_PORT,
        multipleStatements: true,
        ssl: process.env.DB_SSL === "false" ? undefined : {
            minVersion: "TLSv1.2",
            rejectUnauthorized: true,
        }
    });

    console.log("✅ Connected successfully!");
    console.log("⏳ Reading tidb_import.sql file...");

    try {
        const sqlFilePath = path.join(__dirname, '..', 'database', 'tidb_import.sql');
        const sqlStatements = fs.readFileSync(sqlFilePath, 'utf8');

        console.log("⚙️ Executing SQL script. This might take a few seconds...");
        await connection.query(sqlStatements);
        
        console.log("🎉 SUCCESS: Database schema and seed data inserted perfectly!");

    } catch (error) {
        console.error("❌ ERROR setting up database:", error.message);
    } finally {
        await connection.end();
        console.log("🔌 Connection closed.");
    }
}

setupDatabase();
