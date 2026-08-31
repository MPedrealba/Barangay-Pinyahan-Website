// ============================================
// utils/cronJobs.js — Automated Cleanup Worker
// ============================================
// Deletes service_requests older than 3 days (72 hours).
// Runs every day at midnight: '0 0 * * *'
// ============================================

const cron = require('node-cron');

/**
 * Start the daily cleanup cron job.
 * @param {import('mysql2/promise').Pool} db - MySQL connection pool
 */
function startCleanupCron(db) {
  // Schedule: every day at midnight (00:00)
  cron.schedule('0 0 * * *', async () => {
    const timestamp = new Date().toISOString();
    console.log(`\n[CRON] 🕛 Running 3-day retention cleanup at ${timestamp}`);

    try {
      // Delete all service requests where created_at is older than 72 hours
      const [result] = await db.query(
        `DELETE FROM service_requests
         WHERE created_at < DATE_SUB(NOW(), INTERVAL 3 DAY)`
      );

      const purged = result.affectedRows || 0;

      if (purged > 0) {
        console.log(`[CRON] 🗑️  Purged ${purged} expired service request(s) older than 3 days.`);
      } else {
        console.log(`[CRON] ✅ No expired service requests found. Nothing to delete.`);
      }
    } catch (err) {
      console.error(`[CRON] ❌ Cleanup job failed:`, err.message);
    }
  });

  console.log('🕐 Cron job scheduled: Delete expired service requests daily at midnight.');
}

module.exports = { startCleanupCron };
