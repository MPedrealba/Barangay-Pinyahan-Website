// ============================================
// scripts/add-broad-category.js
// Run once: node scripts/add-broad-category.js
// Adds broad_category column to complaint_categories
// and seeds default mappings for existing categories.
// ============================================
require('dotenv').config();
const mysql = require('mysql2/promise');

// Default broad_category per complaint category name (case-insensitive)
const DEFAULTS = [
    // Peace & Order
    { name: 'Noise Complaint',       broad: 'Peace & Order' },
    { name: 'Vandalism',             broad: 'Peace & Order' },
    { name: 'Public Intoxication',   broad: 'Peace & Order' },
    { name: 'Disturbance',           broad: 'Peace & Order' },
    { name: 'Illegal Gambling',      broad: 'Peace & Order' },
    { name: 'Theft',                 broad: 'Peace & Order' },
    { name: 'Trespassing',           broad: 'Peace & Order' },
    // Sanitation
    { name: 'Garbage Collection',    broad: 'Sanitation'    },
    { name: 'Illegal Dumping',       broad: 'Sanitation'    },
    { name: 'Drainage Issue',        broad: 'Sanitation'    },
    { name: 'Pest Infestation',      broad: 'Sanitation'    },
    // Infrastructure
    { name: 'Potholes',              broad: 'Infrastructure' },
    { name: 'Broken Streetlights',   broad: 'Infrastructure' },
    { name: 'Damaged Road',          broad: 'Infrastructure' },
    { name: 'Flooded Area',          broad: 'Infrastructure' },
    // Environmental
    { name: 'Air Pollution',         broad: 'Environmental' },
    { name: 'Water Pollution',       broad: 'Environmental' },
    { name: 'Illegal Logging',       broad: 'Environmental' },
    // Health
    { name: 'Food Safety',           broad: 'Health'        },
    { name: 'Health Hazard',         broad: 'Health'        },
];

async function migrate() {
    const db = await mysql.createConnection({
        host:     process.env.DB_HOST,
        port:     parseInt(process.env.DB_PORT) || 4000,
        user:     process.env.DB_USER,
        password: process.env.DB_PASSWORD,
        database: process.env.DB_NAME,
        ssl:      { rejectUnauthorized: true },
    });

    console.log('✅ Connected to database.');

    // 1. Add broad_category column if missing
    const [cols] = await db.query(
        `SELECT COLUMN_NAME FROM INFORMATION_SCHEMA.COLUMNS
         WHERE TABLE_NAME = 'complaint_categories' AND COLUMN_NAME = 'broad_category'`
    );

    if (cols.length > 0) {
        console.log('⚠️  Column "broad_category" already exists. Skipping ALTER.');
    } else {
        await db.query(
            `ALTER TABLE complaint_categories ADD COLUMN broad_category VARCHAR(100) DEFAULT 'Others'`
        );
        console.log('✅ Added column "broad_category" with default "Others".');
    }

    // 2. Seed broad_category for any existing rows that match our defaults
    for (const entry of DEFAULTS) {
        await db.query(
            `UPDATE complaint_categories SET broad_category = ? WHERE LOWER(name) = LOWER(?) AND (broad_category IS NULL OR broad_category = 'Others')`,
            [entry.broad, entry.name]
        );
    }
    console.log('✅ Seeded broad_category for matching categories.');

    await db.end();
    console.log('🎉 Migration complete.');
}

migrate().catch(err => {
    console.error('❌ Failed:', err);
    process.exit(1);
});
