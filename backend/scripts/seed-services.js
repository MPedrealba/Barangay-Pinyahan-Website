// ============================================================
// seed-services.js — Seed the 5 default barangay services
// Run: node backend/seed-services.js
// ============================================================
const mysql  = require('mysql2/promise');
const dotenv = require('dotenv');
const path   = require('path');

dotenv.config({ path: path.join(__dirname, '.env') });

const SERVICES = [
  {
    name:         'Barangay Clearance',
    description:  'Official clearance issued to residents for employment, business, or other legal purposes.',
    icon_class:   'fas fa-file-invoice',
    icon_color:   'blue',
    requirements: ['Barangay Clearance Application Form', 'Valid Government-issued ID', 'Proof of Residency', 'Cedula (Community Tax Certificate)'],
    procedures:   ['Submit requirements to the Barangay Office', 'Verification of documents', 'Pay clearance fee', 'Processing and approval', 'Release of Barangay Clearance'],
    status: 'Active',
  },
  {
    name:         'Business Permit Application',
    description:  'Required barangay permit for all business operations within Barangay Pinyahan.',
    icon_class:   'fas fa-store',
    icon_color:   'blue',
    requirements: ['Duly accomplished Business Permit Application Form', 'Valid Government-issued ID of the owner', 'Barangay Clearance', 'DTI/SEC/CDA Registration', 'Lease Contract or Land Title (if applicable)'],
    procedures:   ['Secure and accomplish the application form', 'Submit complete requirements to the Barangay Office', 'Inspection of the business location', 'Assessment and payment of applicable fees', 'Release of Barangay Business Permit'],
    status: 'Active',
  },
  {
    name:         'Certificate of Indigency',
    description:  'Certificate issued to qualified indigent residents for medical, educational, or legal assistance.',
    icon_class:   'fas fa-file-lines',
    icon_color:   'blue',
    requirements: ['Request letter or filled-out application form', 'Valid Government-issued ID', 'Proof of Residency in Barangay Pinyahan', 'Barangay Clearance (if required by the requesting institution)'],
    procedures:   ['Go to the Barangay Hall and state your purpose', 'Submit required documents to the receiving clerk', 'Verification of residency and financial status', 'Processing and signing by the Punong Barangay', 'Release of Certificate of Indigency'],
    status: 'Active',
  },
  {
    name:         'Health Services',
    description:  'Free health consultations, medicines, and referrals available at the Barangay Health Center.',
    icon_class:   'fas fa-heart',
    icon_color:   'blue',
    requirements: ['Valid Government-issued ID or Barangay ID', 'Proof of Residency in Barangay Pinyahan', 'PhilHealth ID (if available)', 'Referral letter (for specialist consultations)'],
    procedures:   ['Register at the Barangay Health Center', 'Present required documents', 'Wait for queue number and consultation schedule', 'Consultation with the Barangay Health Worker or Physician', 'Receive medicines or referral as needed'],
    status: 'Active',
  },
  {
    name:         'Disaster Response',
    description:  'Emergency assistance and relief services for residents affected by disasters or calamities.',
    icon_class:   'fas fa-bell',
    icon_color:   'blue',
    requirements: ['Valid Government-issued ID or Barangay ID', 'Proof of residency in the affected area', 'Disaster/Calamity Report (if available)', 'Request for Assistance Form'],
    procedures:   ['Report the disaster/emergency to the Barangay Hall or BDRRMC', 'Assessment of damage and affected families', 'Coordination with DRRMC and relevant agencies', 'Distribution of relief goods and temporary shelter (if needed)', 'Post-disaster monitoring and rehabilitation assistance'],
    status: 'Active',
  },
];

async function seedServices() {
  const db = await mysql.createConnection({
    host:     process.env.DB_HOST,
    user:     process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    port:     parseInt(process.env.DB_PORT || '3306', 10),
    ssl:      { rejectUnauthorized: true },
  });

  await db.query('USE `' + (process.env.DB_NAME || 'barangay_pinyahan') + '`');
  console.log('✅ Connected to database:', process.env.DB_NAME);

  let inserted = 0;
  let skipped  = 0;

  for (const svc of SERVICES) {
    const [existing] = await db.query('SELECT id FROM services WHERE name = ?', [svc.name]);
    if (existing.length > 0) {
      console.log('  ⏩ Skip (already exists):', svc.name);
      skipped++;
      continue;
    }
    await db.query(
      `INSERT INTO services (name, description, icon_class, icon_color, requirements, procedures, status)
       VALUES (?, ?, ?, ?, ?, ?, ?)`,
      [
        svc.name,
        svc.description,
        svc.icon_class,
        svc.icon_color,
        JSON.stringify(svc.requirements),
        JSON.stringify(svc.procedures),
        svc.status,
      ]
    );
    console.log('  ✅ Inserted:', svc.name);
    inserted++;
  }

  const [rows] = await db.query('SELECT id, name, status FROM services ORDER BY id');
  console.log('\n📋 All services in database:');
  rows.forEach(r => console.log(`   [${r.id}] ${r.name} — ${r.status}`));
  console.log(`\n✅ Done! Inserted: ${inserted} | Skipped: ${skipped}`);

  await db.end();
  process.exit(0);
}

seedServices().catch(err => {
  console.error('❌ Seed failed:', err.message);
  process.exit(1);
});
