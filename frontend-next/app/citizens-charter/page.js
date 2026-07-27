'use client';
import PublicShell from '@/components/PublicShell';

const SERVICES = [
  {
    icon: 'fas fa-file-invoice',
    title: 'Issuance of Barangay Clearance',
    rows: [
      {
        clientStep: <>1. Secure application form and present requirements:<ul className="list-disc pl-5 mt-2.5 text-gray-500 space-y-1"><li>Valid Government-issued ID</li><li>Proof of Residency</li><li>Cedula</li></ul></>,
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
      <section className="w-[90%] max-w-[1200px] mx-auto mt-10 mb-16">
        <h2 className="text-xl md:text-[1.8rem] font-extrabold text-gray-800 uppercase mb-6">CITIZEN&apos;S CHARTER</h2>

        <div className="text-justify mb-8 leading-relaxed md:leading-loose text-sm md:text-base text-gray-600">
          <p><strong>Mandate:</strong> Republic Act No. 11032 or the Ease of Doing Business and Efficient Government Service Delivery Act of 2018. This Citizen&apos;s Charter details the frontline services available to our citizens, the step-by-step procedures, requirements, processing times, and the designated personnel responsible for each action. We are committed to transparency, efficiency, and excellent public service delivery.</p>
        </div>

        {SERVICES.map((svc) => (
          <div key={svc.title} className="mb-12 bg-white rounded-lg shadow-sm overflow-hidden">
            {/* Service Header */}
            <div className="bg-[#006eb3] text-white px-5 py-4 flex items-center gap-4">
              <i className={`${svc.icon} text-2xl`} />
              <h3 className="m-0 text-base md:text-xl font-extrabold uppercase">{svc.title}</h3>
            </div>

            {/* Table — Desktop */}
            <div className="hidden md:block overflow-x-auto">
              <table className="w-full border-collapse">
                <thead>
                  <tr className="bg-gray-50">
                    {[
                      { label: 'Client Steps', width: '25%' },
                      { label: 'Agency Action', width: '35%' },
                      { label: 'Fees', width: '15%' },
                      { label: 'Time', width: '10%' },
                      { label: 'Responsible', width: '15%' },
                    ].map((h) => (
                      <th key={h.label} className="px-5 py-4 border-b border-gray-200 text-left align-top font-bold text-gray-800 uppercase text-[0.9rem]"
                        style={{ width: h.width }}>
                        {h.label}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {svc.rows.map((row, ri) => (
                    <tr key={ri} className="border-b border-gray-200 hover:bg-gray-50 transition-colors">
                      <td className="px-5 py-4 align-top text-[0.95rem]">{row.clientStep}</td>
                      <td className="px-5 py-4 align-top text-[0.95rem]">{row.agencyAction}</td>
                      <td className="px-5 py-4 align-top">
                        <span className="bg-gray-200 px-2 py-1 rounded font-bold text-[0.85rem]">{row.fee}</span>
                      </td>
                      <td className="px-5 py-4 align-top text-[0.95rem]">{row.time}</td>
                      <td className="px-5 py-4 align-top text-[0.95rem]">{row.responsible}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Cards — Mobile */}
            <div className="md:hidden divide-y divide-gray-100">
              {svc.rows.map((row, ri) => (
                <div key={ri} className="p-4 space-y-3">
                  <div>
                    <p className="text-xs font-bold text-gray-400 uppercase mb-1">Client Step</p>
                    <div className="text-sm text-gray-700">{row.clientStep}</div>
                  </div>
                  <div>
                    <p className="text-xs font-bold text-gray-400 uppercase mb-1">Agency Action</p>
                    <p className="text-sm text-gray-700">{row.agencyAction}</p>
                  </div>
                  <div className="flex gap-4 flex-wrap">
                    <div>
                      <p className="text-xs font-bold text-gray-400 uppercase mb-1">Fees</p>
                      <span className="bg-gray-200 px-2 py-0.5 rounded text-xs font-bold">{row.fee}</span>
                    </div>
                    <div>
                      <p className="text-xs font-bold text-gray-400 uppercase mb-1">Time</p>
                      <p className="text-sm text-gray-700">{row.time}</p>
                    </div>
                    <div>
                      <p className="text-xs font-bold text-gray-400 uppercase mb-1">Responsible</p>
                      <p className="text-sm text-gray-700">{row.responsible}</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        ))}
      </section>
    </PublicShell>
  );
}
