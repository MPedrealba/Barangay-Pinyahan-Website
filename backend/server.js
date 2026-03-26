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
app.use(express.json());

// Parse URL-encoded form data (for HTML form submissions)
app.use(express.urlencoded({ extended: true }));

// Enable CORS so your frontend HTML files can call the API
// without getting blocked by the browser's same-origin policy
app.use(
  cors({
    origin: "*", // In production, replace with your actual domain
    methods: ["GET", "POST", "PUT", "DELETE"],
    allowedHeaders: ["Content-Type", "Authorization"],
  }),
);

// Serve uploaded files from the /uploads folder
app.use("/uploads", express.static(path.join(__dirname, "uploads")));

// Serve frontend files so you can access the website at localhost:3000
app.use(express.static(path.join(__dirname, "..", "frontend")));

// Redirect root to the homepage
app.get("/", (req, res) => {
  res.redirect("/html/homepage/about.html");
});

// ------------------------------------------
// STEP 5: Create MySQL connection pool
// ------------------------------------------
// A pool reuses connections instead of creating a new one
// for every request — much more efficient
const db = mysql.createPool({
  host: process.env.DB_HOST || "localhost",
  user: process.env.DB_USER || "root",
  password: process.env.DB_PASSWORD || "",
  database: process.env.DB_NAME || "barangay_pinyahan",
  port: process.env.DB_PORT || 3306,
  waitForConnections: true,
  connectionLimit: 10, // Max 10 simultaneous connections
  queueLimit: 0, // Unlimited queued requests
});

// ------------------------------------------
// STEP 6: Test the database connection
// ------------------------------------------
async function testConnection() {
  try {
    const connection = await db.getConnection();
    console.log("✅ Database connected successfully!");
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

app.use('/api/auth', authRoutes);
app.use('/api/complaints', complaintRoutes);
app.use('/api/admin/news', newsRoutes);
app.use('/api/admin/events', eventRoutes);
app.use('/api/admin/services', serviceRoutes);
app.use('/api/admin/accounts', accountRoutes);
app.use('/api/admin/notifications', notificationRoutes);
app.use('/api/dashboard', dashboardRoutes);

// ------------------------------------------
// STEP 10: Start the server
// ------------------------------------------
const PORT = process.env.PORT || 3000;

app.listen(PORT, () => {
  console.log("==========================================");
  console.log(`🚀 Server running on http://localhost:${PORT}`);
  console.log(`📡 API endpoint: http://localhost:${PORT}/api`);
  console.log("==========================================");
  testConnection(); // Test DB connection on startup
});

// Export db pool so route files can use it
module.exports = { app, db };
