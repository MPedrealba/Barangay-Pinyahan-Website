-- ============================================================
-- Fix Services Table: Replace old data with official
-- Citizen's Charter requirements & procedures
-- Run this in your TiDB Console
-- ============================================================

-- Step 1: Remove all old services (including Business Permit, Health Services, Disaster Response)
DELETE FROM services;

-- Step 2: Insert only the 4 services with Word document templates
-- Requirements & Procedures from official Barangay Pinyahan Citizen's Charter
INSERT INTO services (name, description, icon_class, icon_color, requirements, procedures, status) VALUES
('Barangay Clearance and Certifications',
 'This service allows citizens to obtain Barangay Clearance and Certification, documents that certify their compliance with barangay regulations and requirements.',
 'fas fa-file-alt', 'blue',
 '["Accomplished Information Form", "Photocopy of valid ID address in Barangay Pinyahan (e.g Driver''s License, UMID, Postal ID, Senior Citizen''s ID, PWD ID, Voter''s ID)"]',
 '["Obtain an application form and fill out completely", "Submit the accomplished information form and supporting requirements at Cubicle No. 9 for evaluation"]',
 'Active'),

('Barangay Clearance - No Derogatory',
 'Certification that the applicant has no derogatory record or pending cases in the barangay, issued for employment and general requirements.',
 'fas fa-shield-alt', 'blue',
 '["Accomplished Information Form", "Photocopy of valid ID address in Barangay Pinyahan (e.g Driver''s License, UMID, Postal ID, Senior Citizen''s ID, PWD ID, Voter''s ID)"]',
 '["Obtain an application form and fill out completely", "Submit the accomplished information form and supporting requirements at Cubicle No. 9 for evaluation"]',
 'Active'),

('Barangay Certificate of Indigency',
 'Issued to residents who require financial assistance for various purposes, such as medical treatment, burial, and other essential needs.',
 'fas fa-certificate', 'blue',
 '["Accomplished Information Form", "Photocopy of valid ID address in Barangay Pinyahan (e.g Driver''s License, UMID, Postal ID, Senior Citizen''s ID, PWD ID, Voter''s ID)"]',
 '["Obtain an application form and fill out completely", "Submit the accomplished information form and supporting requirements at Cubicle No. 9 for evaluation", "Wait for the request to be processed", "Receive the requested certificate/clearance"]',
 'Active'),

('Certificate of Residency',
 'Official proof of residency within the barangay, verifying that the applicant is a bonafide resident of Barangay Pinyahan.',
 'fas fa-house-user', 'blue',
 '["Accomplished Information Form", "Photocopy of valid ID address in Barangay Pinyahan (e.g Driver''s License, UMID, Postal ID, Senior Citizen''s ID, PWD ID, Voter''s ID)"]',
 '["Obtain an application form and fill out completely", "Submit the accomplished information form and supporting requirements at Cubicle No. 9 for evaluation", "Wait for the request to be processed", "Receive the requested certificate/clearance"]',
 'Active');
