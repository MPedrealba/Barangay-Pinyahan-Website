-- ============================================
-- Citizen's Charter — Database Migration
-- TiDB / MySQL Compatible
-- ============================================
-- Run this script in your TiDB console to create
-- the three tables required by the Citizen's Charter module.
-- ============================================


-- ============================================
-- 1. BARANGAY_SERVICES (Core Charter Data)
-- ============================================
CREATE TABLE IF NOT EXISTS barangay_services (
    id INT AUTO_INCREMENT PRIMARY KEY,
    service_name VARCHAR(255) NOT NULL,
    office_division VARCHAR(255) DEFAULT NULL,
    classification VARCHAR(100) DEFAULT NULL,
    transaction_type VARCHAR(100) DEFAULT NULL,
    who_may_avail TEXT DEFAULT NULL,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);


-- ============================================
-- 2. SERVICE_REQUIREMENTS (FK → barangay_services)
-- ============================================
CREATE TABLE IF NOT EXISTS service_requirements (
    id INT AUTO_INCREMENT PRIMARY KEY,
    service_id INT NOT NULL,
    name VARCHAR(255) NOT NULL,
    where_to_secure VARCHAR(255) DEFAULT NULL,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (service_id) REFERENCES barangay_services(id) ON DELETE CASCADE
);


-- ============================================
-- 3. SERVICE_STEPS (FK → barangay_services)
-- ============================================
CREATE TABLE IF NOT EXISTS service_steps (
    id INT AUTO_INCREMENT PRIMARY KEY,
    service_id INT NOT NULL,
    step_number INT NOT NULL DEFAULT 1,
    client_step TEXT DEFAULT NULL,
    agency_action TEXT DEFAULT NULL,
    fees VARCHAR(100) DEFAULT NULL,
    processing_time VARCHAR(100) DEFAULT NULL,
    person_responsible VARCHAR(255) DEFAULT NULL,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (service_id) REFERENCES barangay_services(id) ON DELETE CASCADE
);


-- ============================================
-- SAFEGUARD: ALTER TABLE (if barangay_services
-- already exists but is missing columns)
-- ============================================
-- TiDB supports ADD COLUMN IF NOT EXISTS as of v6.2+.
-- If your TiDB version doesn't support it, you can
-- safely ignore errors for columns that already exist.
-- ============================================

ALTER TABLE barangay_services ADD COLUMN IF NOT EXISTS office_division VARCHAR(255) DEFAULT NULL;
ALTER TABLE barangay_services ADD COLUMN IF NOT EXISTS classification VARCHAR(100) DEFAULT NULL;
ALTER TABLE barangay_services ADD COLUMN IF NOT EXISTS transaction_type VARCHAR(100) DEFAULT NULL;
ALTER TABLE barangay_services ADD COLUMN IF NOT EXISTS who_may_avail TEXT DEFAULT NULL;
