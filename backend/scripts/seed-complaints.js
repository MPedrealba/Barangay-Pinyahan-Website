// ============================================================
// seed-complaints.js — Inject 50 realistic test complaints
// Run from the project root:  node backend/seed-complaints.js
// ============================================================

const mysql  = require('mysql2/promise');
const dotenv = require('dotenv');
const path   = require('path');

dotenv.config({ path: path.join(__dirname, '.env') });

// ── Lookup tables ─────────────────────────────────────────────────

const CATEGORIES = [
  'Infrastructure',
  'Peace & Order',
  'Sanitation',
  'Health',
  'Environmental',
  'Others',
];

const AREAS = [
  'Area 1', 'Area 2', 'Area 3', 'Area 4',
  'Area 5', 'Area 6', 'Area 7',
];

const STATUSES  = ['Pending', 'On-Going', 'Resolved'];
const URGENCIES = ['Low', 'Medium', 'High'];

// Complaint types matched per category for realistic content
const COMPLAINT_POOL = {
  'Infrastructure': [
    { title: 'Broken street light on Maliwanag St.',        desc: 'The street light at the corner of Maliwanag and Malinis Streets has been broken for two weeks. The area is very dark at night and residents fear for their safety.' },
    { title: 'Large pothole blocking lane on Masipag Ave.', desc: 'A deep pothole on Masipag Avenue is causing vehicles to swerve. Two motorcycles have already been involved in minor accidents this week.' },
    { title: 'Collapsed drainage cover near Malakas Park',  desc: 'The drainage cover collapsed last night. There is now an open hole on the sidewalk that is dangerous for pedestrians, especially children.' },
    { title: 'Cracked road pavement on Mapayapa St.',       desc: 'The road along Mapayapa Street has developed large cracks and is uneven. Heavy rains make it extremely slippery and hazardous.' },
    { title: 'Water pipe leak flooding the barangay road',  desc: 'A water pipe is leaking near the basketball court, flooding the road and creating a muddy, impassable area for pedestrians and vehicles.' },
    { title: 'Damaged footbridge near Maagap Alley',        desc: 'Several planks on the wooden footbridge near Maagap Alley are broken. The bridge is still being used by residents who cross the creek daily.' },
    { title: 'No road markings on Masaya Boulevard',        desc: 'Road markings on Masaya Boulevard have faded completely. Drivers cannot distinguish lanes, causing frequent near-miss collisions.' },
  ],
  'Peace & Order': [
    { title: 'Suspicious group loitering near purok 3',     desc: 'A group of unknown individuals has been spotted loitering near the covered court every night. Residents are uncomfortable and fear for their safety.' },
    { title: 'Illegal gambling operation in vacant lot',    desc: 'Residents have witnessed illegal card games happening in the vacant lot at the back of Matatag Street every afternoon. Betting amounts are large.' },
    { title: 'Repeated theft reports on Maliwanag St.',     desc: 'Three households on Maliwanag Street have reported stolen items from their front yards over the past week. CCTV coverage is needed urgently.' },
    { title: 'Minors caught drinking near the chapel',      desc: 'A group of minors has been drinking alcohol near the chapel late at night repeatedly. Parents are concerned about safety and influence on youth.' },
    { title: 'Stray dogs attacking passersby on Mabuti St.',desc: 'A pack of stray dogs near Mabuti Street has been aggressive, chasing and biting pedestrians. One child was bitten on the leg yesterday.' },
    { title: 'Drug paraphernalia found in playground',      desc: 'Used syringes and drug paraphernalia were found inside the barangay playground early this morning. Children frequently use this area.' },
    { title: 'Loud quarreling causing disturbance at night',desc: 'A household on Maayos Street has been engaging in loud arguments every night, disturbing neighboring families who have children and elderly members.' },
  ],
  'Sanitation': [
    { title: 'Uncollected garbage pile near Malinis St.',   desc: 'Garbage has not been collected for 5 days along Malinis Street. The pile has grown large, attracting flies and producing a foul smell.' },
    { title: 'Clogged drainage causing street flooding',    desc: 'The main drainage canal near Masipag Avenue is clogged with plastic waste. Every rainfall causes the street to flood knee-deep.' },
    { title: 'Illegal dumping in empty lot on Maagap St.',  desc: 'Residents are illegally dumping household waste in the empty lot beside the basketball court. The area is now a makeshift garbage dump.' },
    { title: 'Dead animal on roadside creating health risk',desc: 'A dead dog has been lying on the roadside near Purok 4 for two days. The decomposing body is attracting insects and spreading an unbearable odor.' },
    { title: 'Overflowing communal garbage bins',           desc: 'The communal garbage bins near the barangay hall have been overflowing for days. Waste is spilling onto the sidewalk and into the street.' },
    { title: 'Stagnant water in canal breeding mosquitoes', desc: 'The drainage canal near Area 6 has stagnant, murky water that is breeding mosquitoes. Dengue cases in the area are increasing.' },
    { title: 'Burning of trash near residential houses',    desc: 'A resident is burning garbage directly beside neighboring homes, causing thick black smoke that residents with asthma find impossible to tolerate.' },
  ],
  'Health': [
    { title: 'Dengue cases spike reported in Area 4',       desc: 'Seven dengue fever cases have been reported from households in Area 4 over the past two weeks. Immediate fogging and cleanup operations are requested.' },
    { title: 'Request for free medical check-up program',   desc: 'Many elderly residents cannot afford regular medical check-ups. A request is being made for the barangay to organize a free health mission.' },
    { title: 'Contaminated water supply in Purok 2',        desc: 'Residents of Purok 2 report that their tap water is discolored and smells unusual. Several children experienced stomach aches after drinking it.' },
    { title: 'No available medicines at health center',     desc: 'The barangay health center has run out of basic medicines like paracetamol and antibiotics. Residents with no budget cannot get treatment elsewhere.' },
    { title: 'Dog bite incident needs rabies treatment',    desc: 'A child in Area 3 was bitten by a stray dog. The family cannot afford anti-rabies vaccine and is requesting assistance from the barangay immediately.' },
  ],
  'Environmental': [
    { title: 'Illegal tree cutting behind Mabuting Araw St.',desc: 'A large mango tree behind Mabuting Araw Street was illegally cut down last week. Residents suspect it was done to clear land for construction without permits.' },
    { title: 'Chemical smell coming from the nearby creek', desc: 'A sharp chemical odor is emanating from the creek near Area 5. The water has turned greenish and fish have been found floating dead along the banks.' },
    { title: 'Factory smoke affecting neighborhood air',     desc: 'A small factory operating near the boundary is releasing thick smoke daily without filters. Residents report throat irritation, coughing, and eye problems.' },
    { title: 'Burning of plastic waste in open area',       desc: 'Plastic and rubber materials are being burned in an open field near the creek every afternoon. The toxic black smoke is a serious health and environmental hazard.' },
    { title: 'Flooding due to blocked natural waterway',    desc: 'A natural waterway near Purok 7 has been blocked by construction debris. This has caused chronic flooding affecting ten households in the surrounding area.' },
  ],
  'Others': [
    { title: 'Request for additional barangay tanod patrol', desc: 'Residents of Area 7 request that tanod patrols be extended to midnight as incidents occur frequently after 10 PM in the area.' },
    { title: 'Damaged barangay community bulletin board',    desc: 'The community bulletin board near the basketball court has been vandalized. Announcements can no longer be posted and the board needs immediate repair.' },
    { title: 'Request for senior citizen PWD ramp',         desc: 'There is no wheelchair ramp at the barangay hall entrance. Elderly and disabled residents struggle to access government services.' },
    { title: 'Stray cats destroying property in Purok 5',   desc: 'A large colony of stray cats in Purok 5 is destroying vegetable gardens, tearing garbage bags, and keeping residents awake with noise at night.' },
    { title: 'Request for additional public seating area',  desc: 'There are no benches or resting areas near the health center. Elderly patients must stand or sit on the ground while waiting for consultations.' },
    { title: 'Vandalism on barangay perimeter wall',        desc: 'The perimeter wall along Maliksi Street has been heavily vandalized with graffiti. Residents request repainting and installation of CCTV cameras.' },
  ],
};

// ── Helpers ────────────────────────────────────────────────────────

function pick(arr) {
  return arr[Math.floor(Math.random() * arr.length)];
}

/** Generates a 6-character alphanumeric reference number */
function generateRefNo() {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  let code = '';
  for (let i = 0; i < 6; i++) {
    code += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return `BRGY-${code}`;
}

/**
 * Returns a random Date within the last `days` days, with a realistic
 * hour distribution:  60 % daytime (07–19), 40 % night (19–06).
 */
function randomTimestamp(days = 30) {
  const now       = Date.now();
  const past      = now - days * 24 * 60 * 60 * 1000;
  const base      = new Date(past + Math.random() * (now - past));

  // Weighted hour selection
  const isNight   = Math.random() < 0.40;
  let hour;
  if (isNight) {
    // 19:00–06:00 block  → night complaints
    hour = Math.random() < 0.5
      ? Math.floor(Math.random() * 7)          // 00–06
      : 19 + Math.floor(Math.random() * 5);    // 19–23
  } else {
    hour = 7 + Math.floor(Math.random() * 13); // 07–19
  }

  base.setHours(hour, Math.floor(Math.random() * 60), Math.floor(Math.random() * 60), 0);
  return base;
}

// ── Build 50 complaint objects ─────────────────────────────────────

function buildComplaints(count = 50) {
  const complaints = [];

  // Pre-built roster of realistic names + contacts
  const NAMES = [
    'Maria Santos',  'Juan dela Cruz', 'Ana Reyes',    'Carlo Mendoza',
    'Liza Garcia',   'Robert Flores',  'Nora Villanueva','Marco Aquino',
    'Grace Bautista','Edgar Ramos',    'Rina Pascual',  'Paolo Dela Cruz',
    'Imelda Ty',     'Rodel Cruz',     'Mylene Soriano','Jonathan Tan',
    'Cecilia Lim',   'Andres Navarro', 'Donna Castillo','Alberto Ong',
  ];
  const CONTACTS = [
    '09171234567', '09281234567', '09391234567', '09471234567',
    '09551234567', '09661234567', '09771234567', '09881234567',
    '09991234567', '09101234567',
  ];
  const COMPLAINT_TYPES = ['noise', 'trash', 'security', 'other'];

  for (let i = 0; i < count; i++) {
    const category  = pick(CATEGORIES);
    const pool      = COMPLAINT_POOL[category];
    const template  = pick(pool);
    const area      = pick(AREAS);
    const status    = pick(STATUSES);
    const urgency   = pick(URGENCIES);
    const timestamp = randomTimestamp(30);

    complaints.push({
      ref_no:         generateRefNo(),
      full_name:      pick(NAMES),
      address:        `${area}, Barangay Pinyahan, Diliman, Quezon City`,
      contact_number: pick(CONTACTS),
      complaint_type: pick(COMPLAINT_TYPES),
      category,
      urgency_level:  urgency,
      status,
      message:        `[${area}] ${template.desc}`,  // embed area in message for chart fallback
      photo_url:      null,
      admin_notes:    status === 'Resolved'
        ? 'Complaint has been reviewed and resolved by the barangay. Thank you for reporting.'
        : status === 'On-Going'
          ? 'The barangay is currently investigating and addressing this complaint.'
          : null,
      submitted_at:   timestamp,
    });
  }

  return complaints;
}

// ── Main ───────────────────────────────────────────────────────────

async function seedComplaints() {
  const db = await mysql.createConnection({
    host:     process.env.DB_HOST     || 'localhost',
    user:     process.env.DB_USER     || 'root',
    password: process.env.DB_PASSWORD || '',
    port:     parseInt(process.env.DB_PORT || '3306', 10),
    ssl:      { rejectUnauthorized: true },
  });

  await db.query('USE `' + (process.env.DB_NAME || 'barangay_pinyahan') + '`');
  console.log('✅ Connected to database:', process.env.DB_NAME);

  const complaints = buildComplaints(50);
  let inserted     = 0;
  let skipped      = 0;

  for (const c of complaints) {
    // Ensure ref_no uniqueness
    const [existing] = await db.query(
      'SELECT id FROM complaints WHERE ref_no = ?', [c.ref_no]
    );
    if (existing.length > 0) {
      skipped++;
      continue;
    }

    await db.query(
      `INSERT INTO complaints
         (ref_no, full_name, address, contact_number, complaint_type,
          category, urgency_level, status, message, photo_url,
          admin_notes, submitted_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        c.ref_no, c.full_name, c.address, c.contact_number,
        c.complaint_type, c.category, c.urgency_level, c.status,
        c.message, c.photo_url, c.admin_notes,
        c.submitted_at,
      ]
    );
    inserted++;
  }

  console.log(`\n✅ 50 Test Complaints successfully injected!`);
  console.log(`   → Inserted : ${inserted}`);
  console.log(`   → Skipped  : ${skipped} (duplicate ref_no)`);

  // Preview the distribution
  const [cats]    = await db.query('SELECT category, COUNT(*) as n FROM complaints GROUP BY category ORDER BY n DESC');
  const [statuses]= await db.query('SELECT status, COUNT(*) as n FROM complaints GROUP BY status');
  const [hours]   = await db.query(`
    SELECT FLOOR(HOUR(submitted_at)/3)*3 AS hour_block, COUNT(*) as n
    FROM complaints GROUP BY hour_block ORDER BY hour_block
  `);

  console.log('\n📊 Category distribution:');
  cats.forEach(r => console.log(`   ${(r.category||'null').padEnd(20)} ${r.n}`));

  console.log('\n🔖 Status distribution:');
  statuses.forEach(r => console.log(`   ${(r.status||'null').padEnd(12)} ${r.n}`));

  console.log('\n🕐 Hour-block distribution:');
  hours.forEach(r => console.log(`   ${String(r.hour_block).padStart(2,'0')}:00  ${r.n}`));

  await db.end();
  process.exit(0);
}

seedComplaints().catch(err => {
  console.error('❌ Seed failed:', err.message);
  process.exit(1);
});
