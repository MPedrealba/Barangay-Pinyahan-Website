'use client';
import PublicShell from '@/components/PublicShell';

const SERVICES = [
  {
    icon: 'fas fa-file-invoice',
    title: 'Issuance of Barangay Clearance',
    rows: [
      {
        clientStep: <>1. Secure application form and present requirements:<ul className="req-list"><li>Valid Government-issued ID</li><li>Proof of Residency</li><li>Cedula</li></ul></>,
        agencyAction: 'Receive and verify the submitted documents. Provide the application form if not yet filled.',
        fee: 'None', time: '5 mins', responsible: 'Barangay Secretary / Receiving Clerk',
      },
      { clientStep: '2. Pay the corresponding clearance fee.', agencyAction: 'Accept payment and issue an Official Receipt (OR).', fee: '₱ 50.00', time: '3 mins', responsible: 'Barangay Treasurer' },
      { clientStep: '3. Present Official Receipt and wait.', agencyAction: "Encode details, print the Clearance, and route for Punong Barangay's signature.", fee: 'None', time: '10 mins', responsible: 'Admin Staff / Punong Barangay' },
      { clientStep: '4. Receive the signed Barangay Clearance.', agencyAction: 'Log the transaction and release the document to the citizen.', fee: 'None', time: '2 mins', responsible: 'Releasing Clerk' },
    ],
  },
  {
    icon: 'fas fa-file-lines',
    title: 'Issuance of Certificate of Indigency',
    rows: [
      { clientStep: '1. Approach the desk, state purpose, and present Valid ID / Proof of Residency.', agencyAction: 'Verify residency and socio-economic status records of the requesting individual.', fee: 'None', time: '5 mins', responsible: 'Barangay Secretary / Social Worker' },
      { clientStep: '2. Wait for the processing of the document.', agencyAction: 'Type the Certificate of Indigency and have it signed by the Punong Barangay.', fee: 'None', time: '10 mins', responsible: 'Admin Staff / Punong Barangay' },
      { clientStep: '3. Sign the logbook and receive the certificate.', agencyAction: 'Release the signed Certificate of Indigency.', fee: 'None', time: '2 mins', responsible: 'Releasing Clerk' },
    ],
  },
];

export default function CitizensCharterPage() {
  return (
    <PublicShell activeHref="/citizens-charter">
      <section style={{ width: '90%', maxWidth: 1200, margin: '40px auto 60px' }}>
        <h2 style={{ fontSize: '1.8rem', fontWeight: 800, color: '#333', textTransform: 'uppercase', marginBottom: 25 }}>CITIZEN&apos;S CHARTER</h2>

        <div style={{ textAlign: 'justify', marginBottom: 30, lineHeight: 1.8, color: '#444' }}>
          <p><strong>Mandate:</strong> Republic Act No. 11032 or the Ease of Doing Business and Efficient Government Service Delivery Act of 2018. This Citizen's Charter details the frontline services available to our citizens, the step-by-step procedures, requirements, processing times, and the designated personnel responsible for each action. We are committed to transparency, efficiency, and excellent public service delivery.</p>
        </div>

        {SERVICES.map((svc) => (
          <div key={svc.title} style={{ marginBottom: 50, backgroundColor: 'white', borderRadius: 8, boxShadow: '0 2px 10px rgba(0,0,0,0.05)', overflow: 'hidden' }}>
            {/* Service Header */}
            <div style={{ backgroundColor: '#006eb3', color: 'white', padding: '15px 25px', display: 'flex', alignItems: 'center', gap: 15 }}>
              <i className={svc.icon} style={{ fontSize: '1.5rem' }}></i>
              <h3 style={{ margin: 0, fontSize: '1.3rem', textTransform: 'uppercase' }}>{svc.title}</h3>
            </div>

            {/* Table */}
            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                <thead>
                  <tr style={{ backgroundColor: '#f8f9fa' }}>
                    {['Client Steps', 'Agency Action', 'Fees', 'Time', 'Responsible'].map((h, i) => (
                      <th key={h} style={{ padding: '15px 20px', borderBottom: '1px solid #eee', textAlign: 'left', verticalAlign: 'top', fontWeight: 'bold', color: '#333', textTransform: 'uppercase', fontSize: '0.9rem',
                        width: i === 0 ? '25%' : i === 1 ? '35%' : i === 2 ? '15%' : i === 3 ? '10%' : '15%' }}>
                        {h}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {svc.rows.map((row, ri) => (
                    <tr key={ri} style={{ borderBottom: '1px solid #eee' }}
                      onMouseEnter={e => e.currentTarget.style.backgroundColor = '#fafbfc'}
                      onMouseLeave={e => e.currentTarget.style.backgroundColor = ''}>
                      <td style={{ padding: '15px 20px', verticalAlign: 'top', fontSize: '0.95rem' }}>{row.clientStep}</td>
                      <td style={{ padding: '15px 20px', verticalAlign: 'top', fontSize: '0.95rem' }}>{row.agencyAction}</td>
                      <td style={{ padding: '15px 20px', verticalAlign: 'top' }}>
                        <span style={{ backgroundColor: '#e9ecef', padding: '4px 8px', borderRadius: 4, fontWeight: 'bold', fontSize: '0.85rem' }}>{row.fee}</span>
                      </td>
                      <td style={{ padding: '15px 20px', verticalAlign: 'top', fontSize: '0.95rem' }}>{row.time}</td>
                      <td style={{ padding: '15px 20px', verticalAlign: 'top', fontSize: '0.95rem' }}>{row.responsible}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        ))}
      </section>

      {/* Req-list style */}
      <style>{`.req-list { list-style: disc; padding-left: 20px; margin-top: 10px; color: #555; }`}</style>
    </PublicShell>
  );
}
