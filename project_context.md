# Barangay Pinyahan Website — Full Project Context

> **Purpose of this document:** Provide an external AI with complete understanding of this project's architecture, codebase, conventions, and current state so it can assist with development.

---

## 1. Project Overview

**Barangay Pinyahan Website** is a full-stack web application for a Philippine barangay (village-level government unit) in Diliman, Quezon City. It serves two audiences:

1. **Public-facing homepage** — Residents can browse news, events, services, submit complaints, and track complaint status.
2. **Admin panel** — Authenticated barangay administrators manage complaints, news, events, services, accounts, notifications, and view dashboard analytics and reports.

**GitHub repo:** `https://github.com/MPedrealba/Barangay-Pinyahan-Website`

---

## 2. Tech Stack

| Layer | Technology |
|---|---|
| **Backend** | Node.js + Express 5 (CommonJS modules) |
| **Database** | MySQL-compatible — **TiDB Cloud Serverless** (hosted, AP-Southeast-1) |
| **ORM/Driver** | `mysql2/promise` (raw SQL queries, connection pool) |
| **Authentication** | JWT (`jsonwebtoken`) + bcrypt password hashing |
| **File Uploads** | `multer` (memory storage) → **Supabase Storage** (bucket: `barangay-pinyahan-images`) |
| **AI Classification** | OpenRouter API (GPT-3.5-turbo) for auto-classifying complaint category & urgency |
| **Frontend** | Vanilla HTML/CSS/JS (no framework, no build step) |
| **i18n** | Custom client-side English/Tagalog translation system (`data-i18n` attributes) |
| **Icons** | Font Awesome 6.4.0 (CDN) |
| **Deployment** | **Render** (backend as Node web service + static frontend) with Vercel config also present |

---

## 3. Project Structure

```
Barangay Pinyahan Website/
├── backend/
│   ├── .env                          # Environment variables (DB, JWT, Supabase, OpenRouter)
│   ├── server.js                     # Express app entry point
│   ├── config/
│   │   ├── multer.js                 # Multer config (memoryStorage, image filter, 5MB limit)
│   │   ├── supabase.js               # Supabase client initialization
│   │   └── uploadToSupabase.js       # Upload helper: buffer → Supabase → public URL
│   ├── middleware/
│   │   └── auth.js                   # JWT verification middleware (verifyToken)
│   ├── routes/
│   │   ├── auth.js                   # Login/logout
│   │   ├── complaints.js             # Public submit/track + admin CRUD + AI classification
│   │   ├── news.js                   # Public list/featured + admin CRUD
│   │   ├── events.js                 # Public list + admin CRUD
│   │   ├── services.js               # Public list + admin CRUD
│   │   ├── accounts.js               # Admin account management (CRUD)
│   │   ├── notifications.js          # Admin notifications (list, unread count, mark read)
│   │   ├── dashboard.js              # Dashboard stats & chart data
│   │   └── reports.js                # Report metrics, charts, audit logs
│   ├── create_admin.js               # One-off script to fix admin password hash
│   ├── seed.js                       # Seed script: hash all admin passwords to "admin123"
│   ├── setup_tidb.js                 # Run tidb_import.sql against TiDB Cloud
│   └── uploads/                      # Legacy local upload directory (no longer used)
├── frontend/
│   ├── index.html                    # Homepage (hero, events grid, news carousel)
│   ├── js/
│   │   ├── api.js                    # API_BASE, auth helpers, apiCall/apiGet/apiPost/apiPut/apiDelete, getPhotoUrl
│   │   ├── admin-common.js           # Shared admin page init (auth check, sidebar, logout, notification badge)
│   │   ├── i18n.js                   # EN/TL translation dictionary + language modal + applyTranslations()
│   │   └── popup.js                  # Styled popup system (replaces alert())
│   ├── css/
│   │   ├── homepage/
│   │   │   ├── homepage.css          # All public page styles (~37KB, comprehensive)
│   │   │   ├── admin-login.css       # Admin login page styles
│   │   │   └── service-detail.css    # Service detail page styles
│   │   ├── admin/
│   │   │   ├── admin-dashboard.css
│   │   │   ├── complaint-dashboard.css
│   │   │   ├── complaint-view.css
│   │   │   ├── events-dashboard.css
│   │   │   ├── events-edit.css
│   │   │   ├── events-view.css
│   │   │   ├── news-dashboard.css
│   │   │   ├── news-edit.css
│   │   │   ├── news-view.css
│   │   │   ├── notifications.css
│   │   │   ├── reports-dashboard.css
│   │   │   ├── services-dashboard.css
│   │   │   ├── services-view.css
│   │   │   ├── accounts-setting.css
│   │   │   └── success-popup.css
│   │   ├── lang-modal.css            # Language selection modal styles
│   │   └── popup.css                 # Global popup overlay styles
│   ├── html/
│   │   ├── homepage/                 # Public-facing pages
│   │   │   ├── about.html
│   │   │   ├── admin_login.html
│   │   │   ├── citizens-charter.html
│   │   │   ├── event-view.html
│   │   │   ├── news&upd.html
│   │   │   ├── news-detail.html
│   │   │   ├── services.html
│   │   │   ├── submit_complaint.html
│   │   │   └── track_complaint.html
│   │   └── admin/                    # Admin panel pages (27 HTML files)
│   │       ├── admin-dashboard.html
│   │       ├── complaint-dashboard.html
│   │       ├── complaint-history.html
│   │       ├── complaint-view.html
│   │       ├── events-add.html
│   │       ├── events-dashboard.html
│   │       ├── events-edit.html
│   │       ├── events-view.html
│   │       ├── news-add.html
│   │       ├── news-dashboard.html
│   │       ├── news-edit.html
│   │       ├── news-view.html
│   │       ├── notifications.html
│   │       ├── reports-dashboard.html
│   │       ├── services-add.html
│   │       ├── services-dashboard.html
│   │       ├── services-edit.html          # Generic service edit
│   │       ├── services-edit-business.html # Service-specific edit variants
│   │       ├── services-edit-disaster.html
│   │       ├── services-edit-health.html
│   │       ├── services-edit-indigency.html
│   │       ├── services-view.html          # Generic service view
│   │       ├── services-view-business.html # Service-specific view variants
│   │       ├── services-view-disaster.html
│   │       ├── services-view-health.html
│   │       ├── services-view-indigency.html
│   │       └── accounts-setting.html
│   └── images/
│       ├── Admin Login.png
│       ├── Brgy._Pinyahan_Seal.png
│       ├── Quezon_City_logo.svg
│       └── newly_elected_officials.jpg
├── database/
│   ├── barangay_pinyahan.sql         # Full schema + seed data (MySQL/MariaDB)
│   └── tidb_import.sql              # Same schema adapted for TiDB (no CREATE DATABASE)
├── package.json
├── vercel.json                       # Vercel deployment config (rewrites for API + static)
├── .gitignore
└── cloudflared.exe                   # Cloudflare tunnel binary (for local dev tunneling)
```

---

## 4. Database Schema

The database is named `test` on TiDB Cloud (originally designed as `barangay_pinyahan`). It has **7 tables**:

### 4.1 `admins`
```sql
CREATE TABLE admins (
    id INT AUTO_INCREMENT PRIMARY KEY,
    username VARCHAR(50) NOT NULL UNIQUE,
    full_name VARCHAR(100) NOT NULL,
    email VARCHAR(100) NOT NULL UNIQUE,
    password_hash VARCHAR(255) NOT NULL,           -- bcrypt hash
    status ENUM('online', 'offline') DEFAULT 'offline',
    role VARCHAR(50) DEFAULT 'Administrator',
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);
```

### 4.2 `complaints`
```sql
CREATE TABLE complaints (
    id INT AUTO_INCREMENT PRIMARY KEY,
    ref_no VARCHAR(20) NOT NULL UNIQUE,             -- Format: BRGY-XXXXXX (6 random alphanumeric)
    full_name VARCHAR(100) NOT NULL,
    address VARCHAR(255) NOT NULL,
    contact_number VARCHAR(20) NOT NULL,
    complaint_type ENUM('noise', 'trash', 'security', 'other') NOT NULL,
    category VARCHAR(50) DEFAULT NULL,              -- AI-classified: Peace & Order, Sanitation, Infrastructure, Health, Environmental, Others
    message TEXT NOT NULL,
    photo_url VARCHAR(255) DEFAULT NULL,            -- Supabase public URL or legacy /uploads/ path
    status ENUM('Pending', 'On-Going', 'Resolved') DEFAULT 'Pending',
    urgency_level ENUM('Low', 'Medium', 'High') DEFAULT 'Low',
    admin_notes TEXT DEFAULT NULL,
    submitted_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    resolved_at DATETIME DEFAULT NULL,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);
```

### 4.3 `news`
```sql
CREATE TABLE news (
    id INT AUTO_INCREMENT PRIMARY KEY,
    title VARCHAR(255) NOT NULL,
    date_published DATE NOT NULL,
    description TEXT NOT NULL,
    photo_url VARCHAR(255) DEFAULT NULL,
    is_featured BOOLEAN DEFAULT FALSE,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);
```

### 4.4 `events`
```sql
CREATE TABLE events (
    id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    date DATE NOT NULL,
    time TIME NOT NULL,
    location VARCHAR(255) NOT NULL,
    description TEXT DEFAULT NULL,
    photo_url VARCHAR(255) DEFAULT NULL,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);
```

### 4.5 `services`
```sql
CREATE TABLE services (
    id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    description VARCHAR(255) DEFAULT NULL,
    icon_class VARCHAR(50) DEFAULT 'fas fa-file-alt',   -- Font Awesome class
    icon_color VARCHAR(20) DEFAULT 'blue',
    requirements JSON DEFAULT NULL,                      -- JSON array of strings
    procedures JSON DEFAULT NULL,                        -- JSON array of strings
    status ENUM('Active', 'Inactive') DEFAULT 'Active',
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);
```

### 4.6 `notifications`
```sql
CREATE TABLE notifications (
    id INT AUTO_INCREMENT PRIMARY KEY,
    admin_id INT DEFAULT NULL,                    -- NULL = visible to all admins
    title VARCHAR(100) NOT NULL,
    message VARCHAR(255) NOT NULL,
    icon_class VARCHAR(50) DEFAULT 'fas fa-bell',
    is_read BOOLEAN DEFAULT FALSE,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (admin_id) REFERENCES admins(id) ON DELETE SET NULL
);
```
> **Note:** The notifications route also SELECTs `notification_type`, `target_id`, and `urgency` columns — these may have been added directly to the live DB but are NOT in the SQL schema files. This is a known discrepancy.

### 4.7 `audit_logs`
```sql
CREATE TABLE audit_logs (
    id INT AUTO_INCREMENT PRIMARY KEY,
    admin_id INT,
    action_type VARCHAR(50) NOT NULL,
    action_details VARCHAR(255) NOT NULL,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (admin_id) REFERENCES admins(id) ON DELETE SET NULL
);
```

---

## 5. Backend API — Complete Endpoint Reference

**Base URL:** `http://localhost:3000` (local) or `https://barangay-pinyahan-website-bz6q.onrender.com` (production)

All admin routes require `Authorization: Bearer <JWT>` header.

### 5.1 Authentication (`/api/auth`)
| Method | Endpoint | Auth | Description |
|---|---|---|---|
| POST | `/api/auth/login` | No | Login with `{ username, password }`. Returns `{ token, admin }` |
| POST | `/api/auth/logout` | Optional | Sets admin status to "offline" |

- JWT payload: `{ id, username, full_name, role }` — expires in 8 hours
- On login, admin status set to "online"; on logout, set to "offline"

### 5.2 Complaints (`/api/complaints`)
| Method | Endpoint | Auth | Description |
|---|---|---|---|
| POST | `/api/complaints` | No | Submit complaint (multipart/form-data with optional `photo`). AI auto-classifies category & urgency. Creates notification. Returns `{ ref_no, category, urgency_level }` |
| POST | `/api/complaints/track` | No | Track complaint by `{ ref_no, full_name }` |
| GET | `/api/complaints/admin` | Yes | List active complaints (non-Resolved) |
| GET | `/api/complaints/admin/history` | Yes | List resolved complaints |
| GET | `/api/complaints/admin/:id` | Yes | Get single complaint |
| PUT | `/api/complaints/admin/:id` | Yes | Update `{ status, urgency_level, admin_notes, category }` |

**AI Classification flow:**
1. Complaint message sent to OpenRouter API (GPT-3.5-turbo)
2. Model returns `{ category, urgency_level }` in JSON
3. Valid categories: `Peace & Order`, `Sanitation`, `Infrastructure`, `Health`, `Environmental`, `Others`
4. Valid urgency levels: `Low`, `Medium`, `High`, `Critical`
5. Falls back to `{ category: 'Others', urgency_level: 'Medium' }` on any error

### 5.3 News (`/api/admin/news`)
| Method | Endpoint | Auth | Description |
|---|---|---|---|
| GET | `/api/admin/news/public` | No | List published news (accepts `?limit=N`, default 10) |
| GET | `/api/admin/news/featured` | No | Get latest featured news article |
| GET | `/api/admin/news` | Yes | List all news |
| GET | `/api/admin/news/:id` | Yes | Get single news |
| POST | `/api/admin/news` | Yes | Create news (multipart with optional `photo`) |
| PUT | `/api/admin/news/:id` | Yes | Update news (multipart with optional `photo`) |
| DELETE | `/api/admin/news/:id` | Yes | Delete news |

### 5.4 Events (`/api/admin/events`)
| Method | Endpoint | Auth | Description |
|---|---|---|---|
| GET | `/api/admin/events/public` | No | List events (accepts `?limit=N`, default 8) |
| GET | `/api/admin/events` | Yes | List all events |
| GET | `/api/admin/events/:id` | Yes | Get single event |
| POST | `/api/admin/events` | Yes | Create event (multipart with optional `photo`) |
| PUT | `/api/admin/events/:id` | Yes | Update event (multipart with optional `photo`) |
| DELETE | `/api/admin/events/:id` | Yes | Delete event |

### 5.5 Services (`/api/admin/services`)
| Method | Endpoint | Auth | Description |
|---|---|---|---|
| GET | `/api/admin/services/public` | No | List active services |
| GET | `/api/admin/services` | Yes | List all services |
| GET | `/api/admin/services/:id` | Yes | Get single service |
| POST | `/api/admin/services` | Yes | Create service (JSON body with `requirements` and `procedures` as arrays) |
| PUT | `/api/admin/services/:id` | Yes | Update service |
| DELETE | `/api/admin/services/:id` | Yes | Delete service |

### 5.6 Accounts (`/api/admin/accounts`)
| Method | Endpoint | Auth | Description |
|---|---|---|---|
| GET | `/api/admin/accounts` | Yes | List all admin accounts |
| GET | `/api/admin/accounts/stats` | Yes | Get total & active admin count |
| GET | `/api/admin/accounts/:id` | Yes | Get single admin |
| POST | `/api/admin/accounts` | Yes | Register new admin `{ full_name, username, email, password, role }`. Roles: `Admin`, `Super Admin` |
| PUT | `/api/admin/accounts/:id` | Yes | Update admin `{ full_name, username, email, password }` |
| DELETE | `/api/admin/accounts/:id` | Yes | Delete admin (cannot delete yourself) |

### 5.7 Notifications (`/api/admin/notifications`)
| Method | Endpoint | Auth | Description |
|---|---|---|---|
| GET | `/api/admin/notifications` | Yes | List all notifications (global + targeted to current admin) |
| GET | `/api/admin/notifications/unread-count` | Yes | Get unread notification count |
| PUT | `/api/admin/notifications/read-all` | Yes | Mark all as read |
| PUT | `/api/admin/notifications/:id/read` | Yes | Mark single as read |

### 5.8 Dashboard (`/api/dashboard`)
| Method | Endpoint | Auth | Description |
|---|---|---|---|
| GET | `/api/dashboard/stats` | Yes | Returns `{ total_complaints, pending_complaints, urgent_complaints, resolved_complaints, total_news, total_events }` |
| GET | `/api/dashboard/charts` | Yes | Returns `{ by_category, by_hour, by_status }` for chart rendering |

### 5.9 Reports (`/api/admin/reports`)
| Method | Endpoint | Auth | Description |
|---|---|---|---|
| GET | `/api/admin/reports/metrics` | No* | Returns `{ total_complaints, resolved_complaints, total_services }` |
| GET | `/api/admin/reports/charts` | No* | Returns complaints grouped by category |
| GET | `/api/admin/reports/logs` | No* | Returns latest 20 audit log entries with admin names |

> *Note: Reports routes do NOT use `verifyToken` middleware — this may be intentional or an oversight.

---

## 6. Frontend Architecture

### 6.1 Key Conventions
- **No build step** — plain HTML/CSS/JS files served statically
- Every page includes `js/api.js` via `<script src="../../js/api.js">` for the shared `API_BASE`, auth helpers, and `apiCall()`
- Admin pages additionally include `js/admin-common.js` which handles: auth checks, sidebar profile population, logout wiring, and notification badge loading
- Homepage pages include `js/i18n.js` for English/Tagalog translation
- Custom popup system (`popup.js` + `popup.css`) replaces native `alert()`

### 6.2 API Base URL Logic (`api.js`)
```javascript
const RENDER_BACKEND_URL = 'https://barangay-pinyahan-website-bz6q.onrender.com';
const isLocal = window.location.hostname === 'localhost'
    || window.location.hostname === '127.0.0.1'
    || window.location.protocol === 'file:';
const API_BASE = isLocal ? 'http://localhost:3000' : RENDER_BACKEND_URL;
```

### 6.3 Photo URL Resolution (`api.js`)
```javascript
function getPhotoUrl(photoUrl) {
    if (!photoUrl) return null;
    if (photoUrl.startsWith('http://') || photoUrl.startsWith('https://')) {
        return photoUrl; // Supabase full URL
    }
    return API_BASE + photoUrl; // Legacy /uploads/ path
}
```
This handles both old images (stored as `/uploads/filename.jpg`) and new images (stored as full Supabase URLs).

### 6.4 Auth Flow
1. Admin goes to `admin_login.html`, enters username + password
2. Frontend POSTs to `/api/auth/login`, receives `{ token, admin }`
3. Token and admin object stored in `localStorage`
4. `admin-common.js` checks `localStorage` on every admin page load — redirects to login if no token
5. All API calls include `Authorization: Bearer <token>` header
6. Backend middleware verifies token; returns 401/403 if invalid
7. On 401/403 response, frontend clears auth and redirects to login

### 6.5 i18n System
- Two languages: English (`en`) and Tagalog (`tl`)
- On first visit, a modal asks the user to pick a language
- Choice stored in `localStorage` under key `brgy-pinyahan-lang`
- HTML elements with `data-i18n="key"` attributes get their text replaced by `applyTranslations()`
- Translation keys cover: nav, homepage, footer, complaint forms, about, services

### 6.6 Public Pages
| Page | Path | Purpose |
|---|---|---|
| Home | `frontend/index.html` | Hero banner, welcome text, events grid (API), news carousel (API) |
| About | `html/homepage/about.html` | Barangay history, mission/vision, org chart |
| Services | `html/homepage/services.html` | Service listing from API |
| News & Events | `html/homepage/news&upd.html` | News & events listing |
| News Detail | `html/homepage/news-detail.html` | Single news article view |
| Event View | `html/homepage/event-view.html` | Single event view |
| Citizens Charter | `html/homepage/citizens-charter.html` | Government citizen's charter info |
| Submit Complaint | `html/homepage/submit_complaint.html` | Complaint form (with photo upload) |
| Track Complaint | `html/homepage/track_complaint.html` | Lookup complaint by ref_no + name |
| Admin Login | `html/homepage/admin_login.html` | Login form |

### 6.7 Admin Pages
| Page | Path | Purpose |
|---|---|---|
| Dashboard | `admin/admin-dashboard.html` | Stats cards + charts |
| Complaints | `admin/complaint-dashboard.html` | Active complaints table |
| Complaint History | `admin/complaint-history.html` | Resolved complaints |
| Complaint View | `admin/complaint-view.html` | Single complaint detail + update status |
| News Dashboard | `admin/news-dashboard.html` | News listing table |
| News Add | `admin/news-add.html` | Create news form |
| News Edit | `admin/news-edit.html` | Edit news form |
| News View | `admin/news-view.html` | Preview single news |
| Events Dashboard | `admin/events-dashboard.html` | Events listing table |
| Events Add | `admin/events-add.html` | Create event form |
| Events Edit | `admin/events-edit.html` | Edit event form |
| Events View | `admin/events-view.html` | Preview single event |
| Services Dashboard | `admin/services-dashboard.html` | Services listing |
| Services Add | `admin/services-add.html` | Create service form |
| Services Edit | `admin/services-edit.html` + variants | Edit service (with service-specific variants) |
| Services View | `admin/services-view.html` + variants | View service |
| Notifications | `admin/notifications.html` | Notification list + mark as read |
| Reports | `admin/reports-dashboard.html` | Metrics, charts, audit logs |
| Accounts | `admin/accounts-setting.html` | Admin user management (CRUD) |

---

## 7. File Upload Pipeline

1. Frontend sends `multipart/form-data` with a `photo` field
2. `multer` (configured with `memoryStorage`) receives file into `req.file.buffer`
3. `uploadToSupabase(req.file)` is called:
   - Generates unique filename: `{timestamp}-{original_name}` (spaces → underscores)
   - Uploads buffer to Supabase Storage bucket `barangay-pinyahan-images`
   - Returns the permanent public URL
4. The public URL is stored in the DB `photo_url` column
5. On the frontend, `getPhotoUrl()` resolves both legacy `/uploads/` paths and new Supabase URLs

**File constraints:**
- Allowed types: JPEG, JPG, PNG, GIF, WebP
- Max size: 5MB

---

## 8. Environment Variables

Located at `backend/.env`:

```env
PORT=3000

# TiDB Cloud Serverless
DB_HOST=gateway01.ap-southeast-1.prod.aws.tidbcloud.com
DB_USER=2eTPsrArjzbkUc8.root
DB_PASSWORD=<redacted>
DB_NAME=test
DB_PORT=4000
DB_SSL=true

# JWT
JWT_SECRET=<secret_key>

# OpenRouter API (AI classification)
OPENROUTER_API_KEY=<api_key>

# Supabase Storage
SUPABASE_URL=https://xzyboapjbxhvgmoybpxk.supabase.co
SUPABASE_SERVICE_KEY=<service_key>
```

---

## 9. Deployment

### 9.1 Render (Current Production)
- **Backend URL:** `https://barangay-pinyahan-website-bz6q.onrender.com`
- Entry point: `node backend/server.js`
- Express serves the frontend statically from `frontend/` directory
- CORS configured to allow the Render frontend origin
- Root `/` redirects to `/html/homepage/about.html`

### 9.2 Vercel (Alternative Config Present)
```json
{
  "builds": [
    { "src": "backend/server.js", "use": "@vercel/node" },
    { "src": "frontend/**", "use": "@vercel/static" }
  ],
  "rewrites": [
    { "source": "/api/(.*)", "destination": "/backend/server.js" },
    { "source": "/", "destination": "/frontend/index.html" },
    { "source": "/(.*)", "destination": "/frontend/$1" }
  ]
}
```

### 9.3 Local Development
```bash
npm start                    # Starts server on port 3000
# or
node backend/server.js
```
Access at `http://localhost:3000`

### 9.4 Database Setup Scripts
```bash
node backend/setup_tidb.js   # Creates tables + seeds from tidb_import.sql
node backend/seed.js          # Hashes all admin passwords to "admin123"
node backend/create_admin.js  # Fixes password for JohnDoe_1 specifically
```

---

## 10. Key Patterns & Conventions

### 10.1 Database Access Pattern
The `db` connection pool is attached to every request via middleware:
```javascript
app.use((req, res, next) => {
    req.db = db;
    next();
});
```
Routes access it as `req.db.query(...)`.

### 10.2 Route Structure Pattern
Every route file follows this pattern:
```javascript
const express = require('express');
const router = express.Router();
const verifyToken = require('../middleware/auth');

// Public routes (no verifyToken)
router.get('/public', async (req, res) => { ... });

// Admin routes (with verifyToken)
router.get('/', verifyToken, async (req, res) => { ... });
router.post('/', verifyToken, async (req, res) => { ... });
router.put('/:id', verifyToken, async (req, res) => { ... });
router.delete('/:id', verifyToken, async (req, res) => { ... });

module.exports = router;
```

### 10.3 Dynamic Update Pattern
PUT routes build SQL dynamically — only provided fields are updated:
```javascript
const fields = [];
const values = [];
if (title) { fields.push('title = ?'); values.push(title); }
if (description) { fields.push('description = ?'); values.push(description); }
// ... etc
values.push(req.params.id);
await req.db.query(`UPDATE table SET ${fields.join(', ')} WHERE id = ?`, values);
```

### 10.4 Frontend API Call Pattern
Admin pages use the shared `apiCall()` wrapper from `api.js`:
```javascript
// GET
const data = await apiGet('/api/admin/news');

// POST with JSON
const result = await apiPost('/api/admin/news', { title, description, ... });

// POST with file (FormData)
const fd = new FormData();
fd.append('title', title);
fd.append('photo', fileInput.files[0]);
const result = await apiPost('/api/admin/news', fd);
```

---

## 11. Known Issues / Discrepancies

1. **Notifications table schema mismatch:** The route queries `notification_type`, `target_id`, and `urgency` columns, but these are NOT in the SQL schema files. They may exist only in the live TiDB database.

2. **Reports routes have no auth:** The `/api/admin/reports/*` endpoints do not use `verifyToken` middleware. This may be intentional (for public report access) or an oversight.

3. **Service-specific edit/view pages:** There are hardcoded HTML variants for specific services (business, disaster, health, indigency) plus a generic version. This could be consolidated into a single dynamic page.

4. **Legacy upload paths:** Some older database records may still have `photo_url` values like `/uploads/filename.jpg` from before the Supabase migration. The `getPhotoUrl()` function handles both formats.

5. **Database name:** The `.env` uses `DB_NAME=test` (TiDB default), while the SQL schema uses `CREATE DATABASE barangay_pinyahan`. The `tidb_import.sql` version omits the CREATE DATABASE statement.

6. **CORS origin:** Currently hardcoded to the Render URL in `server.js`. The `ALLOWED_ORIGIN` env var can override it.

---

## 12. Seed Data Summary

The SQL files include seed data for testing:
- **5 admin accounts** (JohnDoe_1, JaneReyes_2, JohnLopez_3, Eleven_4, Mike_5) — all with placeholder password hashes (need `seed.js` to fix)
- **3 sample complaints** with different types and urgency levels
- **1 sample news article** (featured)
- **1 sample event**
- **5 services** (Barangay Clearance, Business Permit, Certificate of Indigency, Health Services, Disaster Response)
- **2 sample notifications**
- **3 audit log entries**

Default login after running `seed.js`: **Username:** `JohnDoe_1` | **Password:** `admin123`

---

## 13. Dependencies

```json
{
  "@supabase/supabase-js": "^2.49.4",
  "bcrypt": "^6.0.0",
  "cors": "^2.8.6",
  "dotenv": "^17.3.1",
  "express": "^5.2.1",
  "jsonwebtoken": "^9.0.3",
  "multer": "^2.1.1",
  "mysql2": "^3.19.1"
}
```

---

## 14. Git History (Recent Commits)

| Hash | Date | Summary |
|---|---|---|
| `0b03f8f` | Apr 29, 2026 | Fix: Updated Supabase bucket name to `barangay-pinyahan-images` |
| `fe7ffc9` | Apr 29, 2026 | Feat: Supabase Storage integration, permanent image uploads, fix API_BASE, fix hero-news CSS |
| `d468df9` | Apr 15, 2026 | Fix API base URL, update notifications UI, enhance accounts setting |
| `d216c4f` | Earlier | Fix database connection and API fetch URLs for Render deployment |
| `c755cdc` | Earlier | Fix database connection and API fetch URLs for Render deployment |

**Current state:** Working tree clean, up to date with `origin/master`.
