// ============================================================
// seed-stealth-complaints.js
// Wipes the complaints table and injects 50 fresh records.
// Addresses use natural street names — the word "Area" never
// appears in any address string. Area is computed internally
// via detectAreaFromAddress() and stored in the `area` column.
//
// Run from the backend folder:
//   node seed-stealth-complaints.js
// ============================================================

const mysql  = require('mysql2/promise');
const dotenv = require('dotenv');
const path   = require('path');

dotenv.config({ path: path.join(__dirname, '.env') });

// ── Exact copy of the frontend utility (complaints/page.js) ──────────────────
/**
 * Returns the detected area string (e.g. "Area 4", "Area 1/Area 2")
 * or null if no known Pinyahan street is found.
 * Checked most-specific → least-specific to prevent false matches.
 */
function detectAreaFromAddress(addressString) {
  const s = (addressString || '').toLowerCase();

  // Area 4 — specific sub-streets checked before plain "malakas"
  if (
    s.includes('malakas lane')      ||
    s.includes('malakas upper')     ||
    s.includes('matatag upper')     ||
    s.includes('mapang-akit upper') ||
    s.includes('matapang')
  ) return 'Area 4';

  // Area 3 — checked before generic malakas overlap
  if (
    s.includes('matatag lower')     ||
    s.includes('matatag')           ||
    s.includes('mapang-akit lower') ||
    s.includes('mapang-akit')       ||
    s.includes('mabilis lower')     ||
    s.includes('maunawain')
  ) return 'Area 3';

  // Area 5
  if (
    s.includes('mabilis upper') ||
    s.includes('mabilis')       ||
    s.includes('masigasig')     ||
    s.includes('mapagbigay')    ||
    s.includes('maunlad')       ||
    s.includes('magiliw')
  ) return 'Area 5';

  // Area 6
  if (
    s.includes('matimpiin') ||
    s.includes('matapat')   ||
    s.includes('masikap')   ||
    s.includes('maginoo')   ||
    s.includes('matiyaga')  ||
    s.includes('maparaan')  ||
    s.includes('kalayaan')  ||
    s.includes('v. luna')
  ) return 'Area 6';

  // Area 7
  if (s.includes('nia road') || s.includes('nia') || s.includes('dpwh')) return 'Area 7';

  // Area 1
  if (
    s.includes('mapagmahal') ||
    s.includes('maliksi')    ||
    s.includes('kamias')
  ) return 'Area 1';

  // Area 2
  if (
    s.includes('makisig')  ||
    s.includes('magalang') ||
    s.includes('matipuno')
  ) return 'Area 2';

  // Area 1/Area 2 overlap — plain "malakas" without further qualifier
  if (s.includes('malakas')) return 'Area 1/Area 2';

  return null;
}

// ── Street pool — NO address string will contain the word "Area" ─────────────
const STREETS = [
  'Malakas Lane',      // Area 4
  'Malakas Upper',     // Area 4
  'Matatag Upper',     // Area 4
  'Mapang-Akit Upper', // Area 4
  'Matapang',          // Area 4
  'Matatag Lower',     // Area 3
  'Mapang-Akit Lower', // Area 3
  'Matatag',           // Area 3
  'Mapang-Akit',       // Area 3
  'Mabilis Lower',     // Area 3
  'Maunawain',         // Area 3
  'Mabilis Upper',     // Area 5
  'Mabilis',           // Area 5
  'Masigasig',         // Area 5
  'Mapagbigay',        // Area 5
  'Maunlad',           // Area 5
  'Magiliw',           // Area 5
  'Matimpiin',         // Area 6
  'Matapat',           // Area 6
  'Masikap',           // Area 6
  'Maginoo',           // Area 6
  'Matiyaga',          // Area 6
  'Maparaan',          // Area 6
  'Kalayaan',          // Area 6
  'V. Luna',           // Area 6
  'NIA Road',          // Area 7
  'DPWH',              // Area 7
  'Mapagmahal',        // Area 1
  'Maliksi',           // Area 1
  'Kamias',            // Area 1
  'Makisig',           // Area 2
  'Magalang',          // Area 2
  'Matipuno',          // Area 2
  'Malakas',           // Area 1/Area 2 (plain, no qualifier)
];

const CATEGORIES  = ['Infrastructure', 'Peace & Order', 'Sanitation', 'Noise', 'Others'];
const STATUSES    = ['Pending', 'On-Going', 'Resolved'];
const URGENCIES   = ['High', 'Medium', 'Low'];
const COMPLAINT_TYPES = ['noise', 'trash', 'security', 'other'];

// Map category → the most relevant complaint_type enum value
const CATEGORY_TO_TYPE = {
  'Infrastructure': 'other',
  'Peace & Order':  'security',
  'Sanitation':     'trash',
  'Noise':          'noise',
  'Others':         'other',
};

// ── Realistic complaint content per category ─────────────────────────────────
const COMPLAINT_POOL = {
  'Infrastructure': [
    { title: 'Broken street light causing safety hazard',     desc: 'The street light at this corner has been broken for over a week. Residents feel unsafe walking at night, especially elderly and children going to and from school.' },
    { title: 'Deep pothole blocking half of the road',        desc: 'A large pothole has formed and is causing vehicles to swerve dangerously. Two motorists have reported near-accidents at this location this week alone.' },
    { title: 'Collapsed drainage cover on main sidewalk',     desc: 'The metal drainage cover collapsed. There is now an exposed gap on the pedestrian path roughly 60 cm wide, posing a serious injury risk.' },
    { title: 'Cracked road pavement becoming worse',          desc: 'The pavement along this stretch has developed severe cracks. After rains it becomes slippery and unusable for tricycles and motorcycles.' },
    { title: 'Water pipe leak flooding the road',             desc: 'A burst water pipe is flooding the street and has turned the road into a muddy impassable section for the past two days.' },
    { title: 'Damaged footbridge still in daily use',         desc: 'Several wooden planks on the footbridge are broken. Residents continue crossing it daily as there is no alternate route across the creek.' },
  ],
  'Peace & Order': [
    { title: 'Suspicious individuals loitering at night',     desc: 'Groups of unknown individuals have been gathering in front of the vacant lot late at night, making residents feel threatened and unable to sleep.' },
    { title: 'Illegal gambling activity in the area',         desc: 'Residents have observed open card-gambling sessions happening in the alley every afternoon. This activity is drawing in youth from the neighborhood.' },
    { title: 'Repeated theft of outdoor property',            desc: 'Several households have reported missing potted plants, shoes, and other outdoor items over the past two weeks. Residents believe a specific individual is responsible.' },
    { title: 'Minors buying alcohol from nearby store',       desc: 'A nearby sari-sari store is openly selling alcoholic beverages to minors. This has been observed on multiple occasions by concerned parents.' },
    { title: 'Public disturbance caused by drunk individuals',desc: 'Intoxicated individuals have been shouting profanities and disturbing peace late at night. Children and elderly residents are particularly affected.' },
  ],
  'Sanitation': [
    { title: 'Garbage not collected for over one week',       desc: 'Garbage bags have been piling up on the street corner for more than a week. The stench is overwhelming and is attracting stray animals and insects.' },
    { title: 'Illegal dumping of large waste items',          desc: 'Old appliances and construction debris have been dumped on the vacant lot. Rats and mosquitoes are now breeding in the accumulated waste.' },
    { title: 'Clogged drainage causing localized flooding',   desc: 'The street drainage is completely blocked with trash and debris. Even light rain is enough to cause knee-deep flooding in front of several homes.' },
    { title: 'Stagnant water near the drainage canal',        desc: 'Water has been standing still near the canal for days. Residents are concerned about dengue mosquito breeding in this stagnant water.' },
    { title: 'Dead animal carcass left uncollected',          desc: 'A dead dog has been lying on the side of the road for three days. The odor is unbearable and it is a health risk for the entire neighborhood.' },
  ],
  'Noise': [
    { title: 'Karaoke machine running until 3 AM',            desc: 'A household has been operating a karaoke machine until the early hours of the morning every weekend. Residents cannot sleep and productivity at work is suffering.' },
    { title: 'Construction noise starting at 5 AM daily',     desc: 'A nearby construction project starts extremely loud drilling and hammering before sunrise. This wakes up the entire block including infants and night-shift workers.' },
    { title: 'Ongoing loud parties every weekend night',      desc: 'Loud parties with amplified music have been happening every Friday and Saturday night. Multiple residents have already complained but the homeowner ignores warnings.' },
    { title: 'Rooster crowing starting at 2 AM',              desc: 'A neighbor keeps multiple roosters that start crowing from 2 AM onward. The noise is unrelenting and residents have been unable to get adequate rest.' },
    { title: 'Vehicle engine revving at midnight',            desc: 'Modified motorcycles gather and rev their engines loudly at the corner every midnight. The noise echoes through the entire street and wakes up households.' },
  ],
  'Others': [
    { title: 'Stray dogs aggressively chasing pedestrians',   desc: 'A pack of aggressive stray dogs has bitten two residents in the past month. Pedestrians and children are afraid to walk along this street.' },
    { title: 'Electrical wire dangling dangerously low',      desc: 'A downed electrical wire is hanging very low across the road. It is at head-height for pedestrians and has already brushed against passing tricycles.' },
    { title: 'Overcrowded sidewalk blocking wheelchair access',desc: 'Vendors and parked motorcycles have completely blocked the sidewalk. Wheelchair users and senior citizens cannot pass without going on the road.' },
    { title: 'Unauthorized structures blocking emergency exit',desc: 'Improvised extensions have been built and now block the only emergency exit from the compound. In case of fire, residents will have no safe escape route.' },
    { title: 'Broken public bench and vandalized lamp post',   desc: 'The public bench and nearby lamp post in the waiting shed have been vandalized and broken. Elderly residents waiting for transport have nowhere to sit safely.' },
  ],
};

// ── Helpers ──────────────────────────────────────────────────────────────────
function pick(arr) {
  return arr[Math.floor(Math.random() * arr.length)];
}

function generateRefNo() {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  let code = '';
  for (let i = 0; i < 6; i++) code += chars[Math.floor(Math.random() * chars.length)];
  return `BRGY-${code}`;
}

/**
 * Random timestamp within the last 30 days with a realistic hour distribution.
 * Hours are weighted toward complaint-heavy times (morning, evening).
 */
function randomTimestamp() {
  const now       = Date.now();
  const thirtyDays = 30 * 24 * 60 * 60 * 1000;
  const base      = new Date(now - Math.random() * thirtyDays);

  // Hour distribution: heavier in the morning (6-9) and evening (18-23)
  const hourPool = [
    6, 7, 7, 8, 8, 8, 9, 9,          // morning rush
    10, 11, 12, 13, 14,               // midday
    15, 16, 17,                       // afternoon
    18, 18, 19, 19, 20, 20, 21, 22,   // evening (most complaints)
    23, 0, 1,                         // late night
  ];
  base.setHours(pick(hourPool), Math.floor(Math.random() * 60), Math.floor(Math.random() * 60), 0);
  return base;
}

// ── Build 50 complaint objects ────────────────────────────────────────────────
function buildComplaints(count) {
  const list = [];

  for (let i = 0; i < count; i++) {
    const street    = pick(STREETS);
    const houseNo   = Math.floor(Math.random() * 200) + 1;
    // Natural address — never contains the word "Area"
    const address   = `${houseNo} ${street}, Barangay Pinyahan, Diliman, Quezon City`;
    const area      = detectAreaFromAddress(address); // computed, stored in DB column

    const category  = pick(CATEGORIES);
    const pool      = COMPLAINT_POOL[category];
    const template  = pick(pool);
    const status    = pick(STATUSES);
    const urgency   = pick(URGENCIES);
    const timestamp = randomTimestamp();

    list.push({
      ref_no:         generateRefNo(),
      full_name:      pick([
        'Maria Santos',    'Juan dela Cruz',  'Ana Reyes',      'Carlo Mendoza',
        'Luz Villanueva',  'Rey Aquino',      'Grace Tolentino', 'Mark Castillo',
        'Nora Bautista',   'Felix Ocampo',    'Helen Torres',   'Roberto Lim',
        'Cecilia Ramos',   'Allan Navarro',   'Josefa Guevarra','Dante Pascual',
        'Marites Cruz',    'Armando Flores',  'Teresita Gomez', 'Eduardo Chavez',
      ]),
      address,
      area,   // e.g. "Area 3", "Area 6", "Area 1/Area 2" — never "Area" in the address string
      contact_number: pick([
        '09171234567', '09281234567', '09391234567', '09501234567',
        '09611234567', '09721234567', '09831234567', '09941234567',
      ]),
      complaint_type: CATEGORY_TO_TYPE[category] || 'other',
      category,
      urgency_level:  urgency,
      status,
      message:        template.desc,
      title:          template.title,
      photo_url:      null,
      admin_notes:    status === 'Resolved'
        ? 'Complaint has been reviewed and resolved by the barangay. Thank you for your report.'
        : status === 'On-Going'
          ? 'The barangay is currently investigating and addressing this concern.'
          : null,
      submitted_at:   timestamp,
    });
  }

  return list;
}

// ── Main ──────────────────────────────────────────────────────────────────────
async function seedStealthComplaints() {
  const db = await mysql.createConnection({
    host:     process.env.DB_HOST     || 'localhost',
    user:     process.env.DB_USER     || 'root',
    password: process.env.DB_PASSWORD || '',
    port:     parseInt(process.env.DB_PORT || '3306', 10),
    ssl:      { rejectUnauthorized: true },
  });

  await db.query('USE `' + (process.env.DB_NAME || 'barangay_pinyahan') + '`');
  console.log('✅ Connected to database:', process.env.DB_NAME);

  // ── Step 1: Wipe existing complaints ─────────────────────────────
  console.log('🗑️  Wiping all existing complaints...');
  await db.query('DELETE FROM complaints');
  // Reset auto-increment so IDs start from 1 again
  await db.query('ALTER TABLE complaints AUTO_INCREMENT = 1');
  console.log('✅ Complaints table cleared.');

  // ── Step 2: Check if `area` column exists; add it if not ─────────
  const [cols] = await db.query(`
    SELECT COLUMN_NAME FROM INFORMATION_SCHEMA.COLUMNS
    WHERE TABLE_SCHEMA = ? AND TABLE_NAME = 'complaints' AND COLUMN_NAME = 'area'
  `, [process.env.DB_NAME || 'barangay_pinyahan']);

  if (cols.length === 0) {
    console.log('⚙️  Adding missing `area` column to complaints table...');
    await db.query(`ALTER TABLE complaints ADD COLUMN area VARCHAR(30) DEFAULT NULL AFTER address`);
    console.log('✅ `area` column added.');
  }

  // ── Step 3: Generate and insert 50 records ────────────────────────
  const complaints = buildComplaints(50);
  let inserted = 0;

  for (const c of complaints) {
    await db.query(
      `INSERT INTO complaints
         (ref_no, full_name, address, area, contact_number, complaint_type,
          category, urgency_level, status, message, photo_url,
          admin_notes, submitted_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        c.ref_no, c.full_name, c.address, c.area, c.contact_number,
        c.complaint_type, c.category, c.urgency_level, c.status,
        c.message, c.photo_url, c.admin_notes, c.submitted_at,
      ]
    );
    inserted++;
  }

  console.log(`\n✅ Database wiped and ${inserted} stealth complaints successfully injected!`);

  // ── Step 4: Distribution preview ─────────────────────────────────
  const [cats]     = await db.query('SELECT category, COUNT(*) as n FROM complaints GROUP BY category ORDER BY n DESC');
  const [statuses] = await db.query('SELECT status, COUNT(*) as n FROM complaints GROUP BY status');
  const [areas]    = await db.query('SELECT area, COUNT(*) as n FROM complaints GROUP BY area ORDER BY area');
  const [hours]    = await db.query(`
    SELECT FLOOR(HOUR(submitted_at)/3)*3 AS hour_block, COUNT(*) as n
    FROM complaints GROUP BY hour_block ORDER BY hour_block
  `);

  console.log('\n📊 Category distribution:');
  cats.forEach(r => console.log(`   ${(r.category || 'null').padEnd(20)} ${r.n}`));

  console.log('\n🔖 Status distribution:');
  statuses.forEach(r => console.log(`   ${(r.status || 'null').padEnd(15)} ${r.n}`));

  console.log('\n🗺️  Area distribution:');
  areas.forEach(r => console.log(`   ${(r.area || 'undetected').padEnd(20)} ${r.n}`));

  console.log('\n🕐 Hour-block distribution (complaints per 3-hour window):');
  hours.forEach(r => console.log(`   ${String(r.hour_block).padStart(2, '0')}:00–${String(r.hour_block + 3).padStart(2, '0')}:00  ${r.n}`));

  await db.end();
  process.exit(0);
}

seedStealthComplaints().catch(err => {
  console.error('❌ Seed failed:', err.message);
  process.exit(1);
});
