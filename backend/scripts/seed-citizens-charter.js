// ============================================
// scripts/seed-citizens-charter.js
// ============================================
// Seeds the Citizen's Charter tables (barangay_services,
// service_requirements, service_steps) with standard ARTA charter data.
// ============================================

const mysql = require('mysql2/promise');
const path = require('path');
const dotenv = require('dotenv');

dotenv.config({ path: path.join(__dirname, '..', '.env') });

const DB_NAME = process.env.DB_NAME || 'test';

async function seedCitizensCharter(forceClean = false) {
    console.log('🚀 Checking Citizen\'s Charter data...');

    const db = await mysql.createPool({
        host: process.env.DB_HOST,
        user: process.env.DB_USER,
        password: process.env.DB_PASSWORD,
        database: DB_NAME,
        port: process.env.DB_PORT,
        ssl: { rejectUnauthorized: true },
    });

    try {
        const connection = await db.getConnection();
        await connection.query('USE `' + DB_NAME + '`');

        // Ensure columns exist
        await connection.query('ALTER TABLE service_requirements ADD COLUMN IF NOT EXISTS name VARCHAR(255) DEFAULT NULL');
        await connection.query('ALTER TABLE service_requirements ADD COLUMN IF NOT EXISTS requirement_name VARCHAR(255) DEFAULT NULL');
        await connection.query('ALTER TABLE service_steps ADD COLUMN IF NOT EXISTS agency_action TEXT DEFAULT NULL');
        await connection.query('ALTER TABLE service_steps ADD COLUMN IF NOT EXISTS action_taken TEXT DEFAULT NULL');

        const [existing] = await connection.query('SELECT COUNT(*) as count FROM barangay_services');
        if (existing[0].count > 0 && !forceClean) {
            console.log(`ℹ️ barangay_services already has ${existing[0].count} entries. Skipping seed.`);
            connection.release();
            await db.end();
            return;
        }

        // Clean out partial or stale data
        await connection.query('DELETE FROM service_steps');
        await connection.query('DELETE FROM service_requirements');
        await connection.query('DELETE FROM barangay_services');

        console.log('📝 Inserting Citizen\'s Charter services...');

        // 1. Barangay Clearance and Certifications
        await connection.query(`
            INSERT INTO barangay_services (id, service_name, office_division, classification, transaction_type, who_may_avail)
            VALUES (1, 'Barangay Clearance and Certifications', 'Administrative Division', 'Simple | Complex', 'G2C - Government to Citizens, G2G - Government to Government', 'Residents of the Barangay requiring a Barangay Clearance and Certification for government or private transactions')
        `);

        await connection.query(`
            INSERT INTO service_requirements (service_id, name, requirement_name, where_to_secure) VALUES
            (1, 'Accomplished Information Form', 'Accomplished Information Form', 'Administrative Division'),
            (1, 'Photocopy of valid ID address in Barangay Pinyahan (e.g Driver\\'s License, UMID, Postal ID, Senior Citizen\\'s ID, PWD ID, Voter\\'s ID)', 'Photocopy of valid ID address in Barangay Pinyahan (e.g Driver\\'s License, UMID, Postal ID, Senior Citizen\\'s ID, PWD ID, Voter\\'s ID)', 'LTO, Social Security System, Quezon City LGU, Comelec')
        `);

        await connection.query(`
            INSERT INTO service_steps (service_id, step_number, client_step, agency_action, action_taken, fees, processing_time, person_responsible) VALUES
            (1, 1, '1. Obtain an application form and fill out completely.', '1. Provide an information form to the applicants requiring Barangay Clearance or Certification', '1. Provide an information form to the applicants requiring Barangay Clearance or Certification', 'None', '10 minutes', 'Peter A. Guiyab'),
            (1, 2, '2. Submit the accomplished information form and supporting requirements at Cubicle No. 9 for evaluation.', '2.1 Receive the duly accomplished Information form and evaluate.', '2.1 Receive the duly accomplished Information form and evaluate.', 'None', '15 minutes', 'Jovie D. Parong')
        `);

        // 2. Barangay Certificate of Indigency
        await connection.query(`
            INSERT INTO barangay_services (id, service_name, office_division, classification, transaction_type, who_may_avail)
            VALUES (2, 'Barangay Certificate of Indigency', 'Administrative Division', 'Simple', 'G2C - Government to Citizens', 'Low-income earners, unemployed individuals, senior citizens, persons with disabilities (PWDs), indigenous people, solo parents and families or individuals living below the poverty line.')
        `);

        await connection.query(`
            INSERT INTO service_requirements (service_id, name, requirement_name, where_to_secure) VALUES
            (2, 'Accomplished Information Form', 'Accomplished Information Form', 'Administrative Division'),
            (2, 'Photocopy of valid ID address in Barangay Pinyahan (e.g Driver\\'s License, UMID, Postal ID, Senior Citizen\\'s ID, PWD ID, Voter\\'s ID)', 'Photocopy of valid ID address in Barangay Pinyahan (e.g Driver\\'s License, UMID, Postal ID, Senior Citizen\\'s ID, PWD ID, Voter\\'s ID)', 'LTO, Social Security System, Quezon City LGU, Comelec')
        `);

        await connection.query(`
            INSERT INTO service_steps (service_id, step_number, client_step, agency_action, action_taken, fees, processing_time, person_responsible) VALUES
            (2, 1, '1. Obtain an application form and fill out completely.', 'Provide an information form to the applicants requiring Certificate of Indigency.', 'Provide an information form to the applicants requiring Certificate of Indigency.', 'None', '10 minutes', 'Pedro A. Guiyab'),
            (2, 2, '2. Submit the accomplished information form and supporting requirements at Cubicle No. 9 for evaluation.', '2.1 Receive the duly accomplished Information form and evaluate.', '2.1 Receive the duly accomplished Information form and evaluate.', 'None', '15 minutes', 'Jovie D. Parong'),
            (2, 3, '3. Wait for the request to be processed.', '3.1 Forward the evaluated information form to the person in-charge of issuing clearance/certificate.', '3.1 Forward the evaluated information form to the person in-charge of issuing clearance/certificate.', 'None', '15 minutes', 'Paulo Rafael V. Del Rosario'),
            (2, 4, '4. Receive the requested certificate/ clearance.', 'Release the requested certificate/clearance.', 'Release the requested certificate/clearance.', 'None', '5 minutes', 'Randy B. Alberto')
        `);

        // 3. Barangay Business Clearance
        await connection.query(`
            INSERT INTO barangay_services (id, service_name, office_division, classification, transaction_type, who_may_avail)
            VALUES (3, 'Barangay Business Clearance', 'Administrative Division', 'Highly Technical', 'G2B - Government to Business', 'Sole Proprietors; Partnerships; Corporations, Other Businesses Entities; New Businesses; and Existing Businesses Renewing their Permits.')
        `);

        await connection.query(`
            INSERT INTO service_requirements (service_id, name, requirement_name, where_to_secure) VALUES
            (3, 'Accomplished Information Form', 'Accomplished Information Form', 'Administrative Division'),
            (3, 'Business Registration (DTI for Sole Proprietorship)', 'Business Registration (DTI for Sole Proprietorship)', 'Department of Trade and Industry (DTI) Offices'),
            (3, 'Business Registration (SEC Registration for Corporation)', 'Business Registration (SEC Registration for Corporation)', 'Securities and Exchange Commission (SEC) Offices'),
            (3, 'Contract of Lease (if renting) Title/Tax Declaration (Proof of ownership or tax payment for the property)', 'Contract of Lease (if renting) Title/Tax Declaration (Proof of ownership or tax payment for the property)', 'Lessor/Landlord'),
            (3, 'Neighbor\\'s consent within a 100-meter perimeter, atleast 10 signatures', 'Neighbor\\'s consent within a 100-meter perimeter, atleast 10 signatures', 'Neighbors'),
            (3, 'Title/Tax Declaration (Proof of ownership or tax payment of the property)', 'Title/Tax Declaration (Proof of ownership or tax payment of the property)', 'Land Registration Authority / Office of the Quezon City Assessor'),
            (3, 'Photocopy of valid ID address in Barangay Pinyahan (e.g Driver\\'s License, UMID, Postal ID, Senior Citizen\\'s ID, PWD ID, Voter\\'s ID)', 'Photocopy of valid ID address in Barangay Pinyahan (e.g Driver\\'s License, UMID, Postal ID, Senior Citizen\\'s ID, PWD ID, Voter\\'s ID)', 'LTO, Social Security System, Quezon City LGU, Comelec'),
            (3, 'List Employees', 'List Employees', 'Company'),
            (3, 'Other documents required by the barangay', 'Other documents required by the barangay', 'Administrative Division')
        `);

        await connection.query(`
            INSERT INTO service_steps (service_id, step_number, client_step, agency_action, action_taken, fees, processing_time, person_responsible) VALUES
            (3, 1, '1. Obtain an application form and fill out completely', '1.1 Provide an information form to the applicants requiring Barangay Business Clearance', '1.1 Provide an information form to the applicants requiring Barangay Business Clearance', 'None', '10 minutes', 'Peter A. Guiyab'),
            (3, 2, '2. Submit the accomplished information form and required documents at Cubicle No. 4 for evaluation', '2.1 Receive the duly accomplished Information form to review and evaluate the application.', '2.1 Receive the duly accomplished Information form to review and evaluate the application.', 'None', '15 minutes', 'Robert Jose C. Santos'),
            (3, 3, '3. Await the inspector\\'s visit to the business premises', '3.1 Inspection of the business premises may be conducted', '3.1 Inspection of the business premises may be conducted', 'None', '3 days', 'Edwin S. Adriano'),
            (3, 4, '4. Await council approval of their business application, which will be deliberated on during a council meeting (This process applies exclusively to new business application only)', '4.1 The information form together with the neighbor\\'s consent and Inspection Report, will be presented to the Punong Barangay and council for review and approval through a Barangay Resolution during the council meeting held twice a month', '4.1 The information form together with the neighbor\\'s consent and Inspection Report, will be presented to the Punong Barangay and council for review and approval through a Barangay Resolution during the council meeting held twice a month', 'None', '15 days', 'Sec. Joy B. Dellomas'),
            (3, 5, '5. Wait for a call from the barangay once their application is approved', '5.1 Notify the client to visit the barangay office to pay for and process the clearance', '5.1 Notify the client to visit the barangay office to pay for and process the clearance', 'None', '1 minute', 'Robert Jose C. Santos'),
            (3, 6, '6. Settle the fees at the cashier\\'s office', '6.1 Payment will be received and a receipt will be issued', '6.1 Payment will be received and a receipt will be issued', 'Fees may vary based on the nature of business and the number of employees, presence of signage, and sale/serving of liquor (This provision is covered under Barangay Revenue Ordinance No. 003, S-2014)', '10 minutes', 'John Frederick A. Villaflor and/or Anna Marie T. Arteta'),
            (3, 7, '7. Return to the Administrative Office for the processing and release of Business Clearance', '7.1 Start processing the request', '7.1 Start processing the request', 'None', '15 minutes', 'Robert Jose C. Santos'),
            (3, 8, '8. Receive the Barangay Business Clearance and Official Receipt (OR)', '8.1 Issuance of Barangay Business Clearance and Official Receipt (OR)', '8.1 Issuance of Barangay Business Clearance and Official Receipt (OR)', 'None', '2 minutes', 'Randy B. Alberto')
        `);

        console.log('✅ Citizen\'s Charter data seeded successfully!');
        connection.release();
    } catch (err) {
        console.error('❌ Seeding error:', err);
    } finally {
        await db.end();
    }
}

if (require.main === module) {
    seedCitizensCharter(process.argv.includes('--clean')).then(() => process.exit(0));
}

module.exports = seedCitizensCharter;
