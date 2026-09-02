// ============================================
// server.js — Barangay Pinyahan Backend Server
// ============================================

// ------------------------------------------
// STEP 1: Import required packages
// ------------------------------------------
const express = require("express"); // Web framework for handling routes
const cors = require("cors"); // Allows frontend to call backend APIs
const dotenv = require("dotenv"); // Loads variables from .env file
const mysql = require("mysql2/promise"); // MySQL driver with async/await support
const path = require("path"); // For resolving file paths
const { startCleanupCron } = require("./utils/cronJobs"); // Automated 3-day retention cleanup

// ------------------------------------------
// STEP 2: Load environment variables
// ------------------------------------------
// This reads the .env file inside the backend folder
// and makes all variables available via process.env
dotenv.config({ path: path.join(__dirname, ".env") });

// ------------------------------------------
// STEP 3: Create the Express app
// ------------------------------------------
const app = express();

// ------------------------------------------
// STEP 4: Configure middleware
// ------------------------------------------

// Parse incoming JSON request bodies (for POST/PUT requests)
app.use(express.json({ limit: '10mb' }));

// Parse URL-encoded form data (for HTML form submissions)
app.use(express.urlencoded({ limit: '10mb', extended: true }));

// Enable CORS so your frontend HTML files can call the API
// without getting blocked by the browser's same-origin policy
// Set ALLOWED_ORIGIN env var in Render to restrict to your deployed frontend URL.
app.use(
  cors({
    origin: [
      process.env.ALLOWED_ORIGIN || 'https://barangay-pinyahan-website-bz6q.onrender.com',
      'https://barangay-pinyahan-website-prod.onrender.com',
      'http://localhost:3001',
    ],
    methods: ["GET", "POST", "PUT", "PATCH", "DELETE"],
    allowedHeaders: ["Content-Type", "Authorization"],
  }),
);

// Serve uploaded files from the /uploads folder
app.use("/uploads", express.static(path.join(__dirname, "uploads")));

// Root health-check — frontend is served by Next.js (port 3001)
app.get("/", (req, res) => {
  res.json({ message: "Barangay Pinyahan API is running!", status: "OK" });
});

// ------------------------------------------
// STEP 5: Create MySQL connection pool
// ------------------------------------------
const DB_NAME = process.env.DB_NAME || 'test';

const db = mysql.createPool({
  host: process.env.DB_HOST,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: DB_NAME,
  port: process.env.DB_PORT,
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0,
  enableKeepAlive: true,
  keepAliveInitialDelay: 10000,
  ssl: {
    rejectUnauthorized: true,
  },
});

// Handle pool errors so connection drops/resets don't crash the server
db.pool.on('error', (err) => {
  console.error('⚠️ MySQL Pool Warning (reconnecting):', err.message);
});

// Automatically select the database on every new pool connection
// (bypasses TiDB Cloud Serverless handshake rejection for custom DB names)
db.pool.on('connection', (connection) => {
  connection.query('USE `' + DB_NAME + '`', (err) => {
    if (err) {
      console.error('Error selecting database on connection:', err.message);
    }
  });
});

// ------------------------------------------
// STEP 6: Test the database connection
// ------------------------------------------
async function testConnection() {
  try {
    const connection = await db.getConnection();
    await connection.query('USE `' + DB_NAME + '`');
    console.log("✅ Database connected successfully! Using: " + DB_NAME);
    connection.release(); // Return connection back to the pool
  } catch (error) {
    console.error("❌ Database connection failed:", error.message);
    console.error(
      "   Make sure MySQL is running and your .env credentials are correct.",
    );
  }
}

// ------------------------------------------
// STEP 7: Make the db pool available to routes
// ------------------------------------------
// This attaches the db pool to every request object
// so route handlers can access it via req.db
app.use((req, res, next) => {
  req.db = db;
  next();
});

// ------------------------------------------
// STEP 8: Basic test route
// ------------------------------------------
app.get("/api", (req, res) => {
  res.json({
    message: "Barangay Pinyahan API is running!",
    status: "OK",
    timestamp: new Date().toISOString(),
  });
});

// ------------------------------------------
// STEP 9: Import and use route files
// ------------------------------------------
const authRoutes = require('./routes/auth');
const complaintRoutes = require('./routes/complaints');
const newsRoutes = require('./routes/news');
const eventRoutes = require('./routes/events');
const serviceRoutes = require('./routes/services');
const accountRoutes = require('./routes/accounts');
const notificationRoutes = require('./routes/notifications');
const dashboardRoutes = require('./routes/dashboard');
const reportsRoutes = require('./routes/reports');
const categoryRoutes = require('./routes/categories');
const citizensCharterRoutes = require('./routes/citizensCharter');

app.use('/api/auth', authRoutes);
app.use('/api/complaints', complaintRoutes);
app.use('/api/admin/news', newsRoutes);
app.use('/api/news', newsRoutes);
app.use('/api/admin/events', eventRoutes);
app.use('/api/events', eventRoutes);
app.use('/api/admin/services', serviceRoutes);
app.use('/api/services', serviceRoutes);
app.use('/api/admin/accounts', accountRoutes);
app.use('/api/admin/notifications', notificationRoutes);
app.use('/api/dashboard', dashboardRoutes);
app.use('/api/admin/reports', reportsRoutes);
app.use('/api/admin/categories', categoryRoutes);
app.use('/api/citizens-charter', citizensCharterRoutes);        // public: /public
app.use('/api/admin/citizens-charter', citizensCharterRoutes);  // admin: CRUD

// ------------------------------------------
// ONE-SHOT DB FIX: complaint_type ENUM → VARCHAR(100)
// Hit GET /api/admin/fix-db ONCE after deploying to Render.
// Safe to call multiple times — checks current type first.
// REMOVE this route after the fix has been confirmed.
// ------------------------------------------
app.get('/api/admin/fix-db', async (req, res) => {
  try {
    // 1. Check current column type
    const [cols] = await db.query(`
      SELECT COLUMN_TYPE
      FROM INFORMATION_SCHEMA.COLUMNS
      WHERE TABLE_NAME   = 'complaints'
        AND COLUMN_NAME  = 'complaint_type'
      LIMIT 1
    `);
    const currentType = cols[0]?.COLUMN_TYPE || 'unknown';

    if (currentType.toLowerCase().startsWith('varchar')) {
      return res.json({
        status:  'already_fixed',
        message: `complaint_type is already ${currentType}. No change needed.`,
      });
    }

    // 2. Apply the fix
    await db.query(`ALTER TABLE complaints MODIFY COLUMN complaint_type VARCHAR(100) NOT NULL`);

    // 3. Verify
    const [after] = await db.query(`
      SELECT COLUMN_TYPE
      FROM INFORMATION_SCHEMA.COLUMNS
      WHERE TABLE_NAME  = 'complaints'
        AND COLUMN_NAME = 'complaint_type'
      LIMIT 1
    `);

    res.json({
      status:   'success',
      message:  'complaint_type column altered successfully.',
      before:   currentType,
      after:    after[0]?.COLUMN_TYPE || 'unknown',
    });
  } catch (err) {
    console.error('[fix-db] Error:', err);
    res.status(500).json({ status: 'error', error: err.message });
  }
});

// ------------------------------------------
// STEP 10: Start the server
// ------------------------------------------
const PORT = process.env.PORT || 3000;

app.listen(PORT, () => {
  console.log("==========================================");
  console.log(`🚀 Server running on port ${PORT}`);
  console.log(`📡 API endpoint: http://localhost:${PORT}/api`);
  console.log("==========================================");
  testConnection();
  startCleanupCron(db); // Start the automated 3-day retention cleanup
});

module.exports = app;
