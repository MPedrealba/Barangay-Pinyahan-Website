'use client';
import { useState, useEffect } from 'react';
import PublicShell from '@/components/PublicShell';

// ── Static fallback data (used when no DB records exist) ─────
const STATIC_SERVICES = [
  {
    service_name: 'Barangay Clearance and Certifications',
    icon: 'fas fa-file-invoice',
    office_division: 'Administrative Division',
    classification: 'Simple | Complex',
    transaction_type: 'G2C - Government to Citizens, G2G - Government to Government',
    who_may_avail: 'Residents of the Barangay requiring a Barangay Clearance and Certification for government or private transactions',
    requirements: [
      { name: 'Accomplished Information Form', where_to_secure: 'Administrative Division' },
      { name: 'Photocopy of valid ID address in Barangay Pinyahan (e.g Driver\'s License, UMID, Postal ID, Senior Citizen\'s ID, PWD ID, Voter\'s ID)', where_to_secure: 'LTO, Social Security System, Quezon City LGU, Comelec' },
    ],
    steps: [
      { step_number: 1, client_step: '1. Obtain an application form and fill out completely.', agency_action: '1. Provide an information form to the applicants requiring Barangay Clearance or Certification', fees: 'None', processing_time: '10 minutes', person_responsible: 'Peter A. Guiyab' },
      { step_number: 2, client_step: '2. Submit the accomplished information form and supporting requirements at Cubicle No. 9 for evaluation.', agency_action: '2.1 Receive the duly accomplished Information form and evaluate.', fees: 'None', processing_time: '15 minutes', person_responsible: 'Jovie D. Parong' },
    ],
  },
  {
    service_name: 'Barangay Certificate of Indigency',
    icon: 'fas fa-file-lines',
    office_division: 'Administrative Division',
    classification: 'Simple',
    transaction_type: 'G2C - Government to Citizens',
    who_may_avail: 'Low-income earners, unemployed individuals, senior citizens, persons with disabilities (PWDs), indigenous people, solo parents and families or individuals living below the poverty line.',
    requirements: [
      { name: 'Accomplished Information Form', where_to_secure: 'Administrative Division' },
      { name: 'Photocopy of valid ID address in Barangay Pinyahan (e.g Driver\'s License, UMID, Postal ID, Senior Citizen\'s ID, PWD ID, Voter\'s ID)', where_to_secure: 'LTO, Social Security System, Quezon City LGU, Comelec' },
    ],
    steps: [
      { step_number: 1, client_step: '1. Obtain an application form and fill out completely.', agency_action: 'Provide an information form to the applicants requiring Certificate of Indigency.', fees: 'None', processing_time: '10 minutes', person_responsible: 'Pedro A. Guiyab' },
      { step_number: 2, client_step: '2. Submit the accomplished information form and supporting requirements at Cubicle No. 9 for evaluation.', agency_action: '2.1 Receive the duly accomplished Information form and evaluate.', fees: 'None', processing_time: '15 minutes', person_responsible: 'Jovie D. Parong' },
      { step_number: 3, client_step: '3. Wait for the request to be processed.', agency_action: '3.1 Forward the evaluated information form to the person in-charge of issuing clearance/certificate.', fees: 'None', processing_time: '15 minutes', person_responsible: 'Paulo Rafael V. Del Rosario' },
      { step_number: 4, client_step: '4. Receive the requested certificate/ clearance.', agency_action: 'Release the requested certificate/clearance.', fees: 'None', processing_time: '5 minutes', person_responsible: 'Randy B. Alberto' },
    ],
  },
  {
    service_name: 'Barangay Business Clearance',
    icon: 'fas fa-building',
    office_division: 'Administrative Division',
    classification: 'Highly Technical',
    transaction_type: 'G2B - Government to Business',
    who_may_avail: 'Sole Proprietors; Partnerships; Corporations, Other Businesses Entities; New Businesses; and Existing Businesses Renewing their Permits.',
    requirements: [
      { name: 'Accomplished Information Form', where_to_secure: 'Administrative Division' },
      { name: 'Business Registration: DTI for Sole Proprietorship', where_to_secure: 'Department of Trade and Industry (DTI) Offices' },
      { name: 'Business Registration: SEC Registration for Corporation', where_to_secure: 'Securities and Exchange Commission (SEC) Offices' },
      { name: 'Contract of Lease (if renting) Title/Tax Declaration (Proof of ownership or tax payment for the property)', where_to_secure: 'Lessor/Landlord' },
      { name: 'Neighbor\'s consent within a 100-meter perimeter, atleast 10 signatures', where_to_secure: 'Neighbors' },
      { name: 'Title/Tax Declaration (Proof of ownership or tax payment of the property)', where_to_secure: 'Land Registration Authority / Office of the Quezon City Assessor' },
      { name: 'Photocopy of valid ID address in Barangay Pinyahan (e.g Driver\'s License, UMID, Postal ID, Senior Citizen\'s ID, PWD ID, Voter\'s ID)', where_to_secure: 'LTO, Social Security System, Quezon City LGU, Comelec' },
      { name: 'List Employees', where_to_secure: 'Company' },
      { name: 'Other documents required by the barangay', where_to_secure: 'Administrative Division' },
    ],
    steps: [
      { step_number: 1, client_step: '1. Obtain an application form and fill out completely', agency_action: '1.1 Provide an information form to the applicants requiring Barangay Business Clearance', fees: 'None', processing_time: '10 minutes', person_responsible: 'Peter A. Guiyab' },
      { step_number: 2, client_step: '2. Submit the accomplished information form and required documents at Cubicle No. 4 for evaluation', agency_action: '2.1 Receive the duly accomplished Information form to review and evaluate the application.', fees: 'None', processing_time: '15 minutes', person_responsible: 'Robert Jose C. Santos' },
      { step_number: 3, client_step: '3. Await the inspector\'s visit to the business premises', agency_action: '3.1 Inspection of the business premises may be conducted', fees: 'None', processing_time: '3 days', person_responsible: 'Edwin S. Adriano' },
      { step_number: 4, client_step: '4. Await council approval of their business application, which will be deliberated on during a council meeting (This process applies exclusively to new business application only)', agency_action: '4.1 The information form together with the neighbor\'s consent and Inspection Report, will be presented to the Punong Barangay and council for review and approval through a Barangay Resolution during the council meeting held twice a month', fees: 'None', processing_time: '15 days', person_responsible: 'Sec. Joy B. Dellomas' },
      { step_number: 5, client_step: '5. Wait for a call from the barangay once their application is approved', agency_action: '5.1 Notify the client to visit the barangay office to pay for and process the clearance', fees: 'None', processing_time: '1 minute', person_responsible: 'Robert Jose C. Santos' },
      { step_number: 6, client_step: '6. Settle the fees at the cashier\'s office', agency_action: '6.1 Payment will be received and a receipt will be issued', fees: 'Fees may vary based on the nature of business and the number of employees, presence of signage, and sale/serving of liquor (This provision is covered under Barangay Revenue Ordinance No. 003, S-2014)', processing_time: '10 minutes', person_responsible: 'John Frederick A. Villaflor and/or Anna Marie T. Arteta' },
      { step_number: 7, client_step: '7. Return to the Administrative Office for the processing and release of Business Clearance', agency_action: '7.1 Start processing the request', fees: 'None', processing_time: '15 minutes', person_responsible: 'Robert Jose C. Santos' },
      { step_number: 8, client_step: '8. Receive the Barangay Business Clearance and Official Receipt (OR)', agency_action: '8.1 Issuance of Barangay Business Clearance and Official Receipt (OR)', fees: 'None', processing_time: '2 minutes', person_responsible: 'Randy B. Alberto' },
    ],
  },
];

// ── Icon mapping for dynamic services ────────────────────────
function getServiceIcon(name) {
  const lower = (name || '').toLowerCase();
  if (lower.includes('clearance'))   return 'fas fa-file-invoice';
  if (lower.includes('indigency'))   return 'fas fa-file-lines';
  if (lower.includes('residency'))   return 'fas fa-house-user';
  if (lower.includes('business'))    return 'fas fa-building';
  if (lower.includes('permit'))      return 'fas fa-stamp';
  return 'fas fa-file-alt';
}

export default function CitizensCharterPage() {
  const [services, setServices] = useState(null);
  const [loading, setLoading]   = useState(true);

  useEffect(() => {
    const fetchCharters = async () => {
      try {
        const res = await fetch(
          `${process.env.NEXT_PUBLIC_API_URL}/api/citizens-charter/public`
        );
        if (res.ok) {
          const data = await res.json();
          if (data.services && data.services.length > 0) {
            setServices(data.services);
          } else {
            // No DB records — use static fallback
            setServices(STATIC_SERVICES);
          }
        } else {
          setServices(STATIC_SERVICES);
        }
      } catch (err) {
        console.error('Failed to fetch charter data:', err);
        setServices(STATIC_SERVICES);
      } finally {
        setLoading(false);
      }
    };
    fetchCharters();
  }, []);

  // Use static data as immediate fallback while loading
  const displayServices = services || STATIC_SERVICES;

  return (
    <PublicShell activeHref="/citizens-charter">
      <section className="w-[90%] max-w-[1200px] mx-auto mt-10 mb-16">
        <h2 className="text-xl md:text-[1.8rem] font-extrabold text-gray-800 uppercase mb-6">
          CITIZEN&apos;S CHARTER
        </h2>

        <div className="text-justify mb-8 leading-relaxed md:leading-loose text-sm md:text-base text-gray-600">
          <p>
            <strong>Mandate:</strong> Republic Act No. 11032 or the Ease of Doing Business
            and Efficient Government Service Delivery Act of 2018. This Citizen&apos;s Charter
            details the frontline services available to our citizens, the step-by-step
            procedures, requirements, processing times, and the designated personnel
            responsible for each action. We are committed to transparency, efficiency, and
            excellent public service delivery.
          </p>
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-20 text-gray-400 text-sm gap-2">
            <i className="fas fa-spinner fa-spin"></i> Loading charter services...
          </div>
        ) : (
          displayServices.map((svc, svcIdx) => {
            const icon = svc.icon || getServiceIcon(svc.service_name);
            const requirements = svc.requirements || [];
            const steps = svc.steps || [];

            return (
              <div key={svc.id || svcIdx} className="mb-12 bg-white rounded-lg shadow-sm overflow-hidden">

                {/* ── Service Header ── */}
                <div className="bg-[#006eb3] text-white px-5 py-4 flex items-center gap-4">
                  <i className={`${icon} text-2xl`} />
                  <h3 className="m-0 text-base md:text-xl font-extrabold uppercase">
                    {svc.service_name || svc.title}
                  </h3>
                </div>

                {/* ── Core Service Details (ARTA grid) ── */}
                {(svc.office_division || svc.classification || svc.transaction_type || svc.who_may_avail) && (
                  <div className="border-b border-gray-200">
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 divide-y md:divide-y-0 md:divide-x divide-gray-200">
                      {svc.office_division && (
                        <div className="px-5 py-4">
                          <p className="text-[11px] font-bold text-gray-400 uppercase tracking-wider mb-1">
                            Office or Division
                          </p>
                          <p className="text-sm font-semibold text-gray-800">
                            {svc.office_division}
                          </p>
                        </div>
                      )}
                      {svc.classification && (
                        <div className="px-5 py-4">
                          <p className="text-[11px] font-bold text-gray-400 uppercase tracking-wider mb-1">
                            Classification
                          </p>
                          <p className="text-sm font-semibold text-gray-800">
                            {svc.classification}
                          </p>
                        </div>
                      )}
                      {svc.transaction_type && (
                        <div className="px-5 py-4">
                          <p className="text-[11px] font-bold text-gray-400 uppercase tracking-wider mb-1">
                            Type of Transaction
                          </p>
                          <p className="text-sm font-semibold text-gray-800">
                            {svc.transaction_type}
                          </p>
                        </div>
                      )}
                      {svc.who_may_avail && (
                        <div className="px-5 py-4">
                          <p className="text-[11px] font-bold text-gray-400 uppercase tracking-wider mb-1">
                            Who May Avail
                          </p>
                          <p className="text-sm font-semibold text-gray-800">
                            {svc.who_may_avail}
                          </p>
                        </div>
                      )}
                    </div>
                  </div>
                )}

                {/* ── Requirements List ── */}
                {requirements.length > 0 && (
                  <div className="border-b border-gray-200 px-5 py-4">
                    <p className="text-[11px] font-bold text-gray-400 uppercase tracking-wider mb-3">
                      Checklist of Requirements
                    </p>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                      {requirements.map((req, ri) => (
                        <div key={ri} className="flex items-start gap-2.5 bg-gray-50 rounded-md px-3 py-2">
                          <span className="w-2 h-2 rounded-full bg-[#006eb3] mt-1.5 shrink-0"></span>
                          <div>
                            <p className="text-sm text-gray-800 font-medium">
                              {typeof req === 'string' ? req : (req.name || req.requirement_name)}
                            </p>
                            {req.where_to_secure && (
                              <p className="text-xs text-gray-400 mt-0.5">
                                Where to secure: {req.where_to_secure}
                              </p>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* ── Processing Steps Table — Desktop ── */}
                {steps.length > 0 && (
                  <>
                    <div className="hidden md:block overflow-x-auto">
                      <table className="w-full border-collapse">
                        <thead>
                          <tr className="bg-gray-50">
                            {[
                              { label: 'Client Steps', width: '25%' },
                              { label: 'Agency Action', width: '30%' },
                              { label: 'Fees', width: '12%' },
                              { label: 'Processing Time', width: '13%' },
                              { label: 'Person Responsible', width: '20%' },
                            ].map((h) => (
                              <th
                                key={h.label}
                                className="px-5 py-4 border-b border-gray-200 text-left align-top font-bold text-gray-800 uppercase text-[0.8rem]"
                                style={{ width: h.width }}
                              >
                                {h.label}
                              </th>
                            ))}
                          </tr>
                        </thead>
                        <tbody>
                          {steps.map((row, ri) => (
                            <tr key={ri} className="border-b border-gray-200 hover:bg-gray-50 transition-colors">
                              <td className="px-5 py-4 align-top text-[0.95rem]">
                                {row.client_step || row.clientStep}
                              </td>
                              <td className="px-5 py-4 align-top text-[0.95rem]">
                                {row.agency_action || row.action_taken || row.agencyAction}
                              </td>
                              <td className="px-5 py-4 align-top">
                                <span className="bg-gray-200 px-2 py-1 rounded font-bold text-[0.85rem]">
                                  {row.fees || row.fee || 'None'}
                                </span>
                              </td>
                              <td className="px-5 py-4 align-top text-[0.95rem]">
                                {row.processing_time || row.time}
                              </td>
                              <td className="px-5 py-4 align-top text-[0.95rem]">
                                {row.person_responsible || row.responsible}
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>

                    {/* ── Processing Steps — Mobile Cards ── */}
                    <div className="md:hidden divide-y divide-gray-100">
                      {steps.map((row, ri) => (
                        <div key={ri} className="p-4 space-y-3">
                          <div>
                            <p className="text-xs font-bold text-gray-400 uppercase mb-1">Client Step</p>
                            <div className="text-sm text-gray-700">{row.client_step || row.clientStep}</div>
                          </div>
                          <div>
                            <p className="text-xs font-bold text-gray-400 uppercase mb-1">Agency Action</p>
                            <p className="text-sm text-gray-700">{row.agency_action || row.action_taken || row.agencyAction}</p>
                          </div>
                          <div className="flex gap-4 flex-wrap">
                            <div>
                              <p className="text-xs font-bold text-gray-400 uppercase mb-1">Fees</p>
                              <span className="bg-gray-200 px-2 py-0.5 rounded text-xs font-bold">
                                {row.fees || row.fee || 'None'}
                              </span>
                            </div>
                            <div>
                              <p className="text-xs font-bold text-gray-400 uppercase mb-1">Time</p>
                              <p className="text-sm text-gray-700">{row.processing_time || row.time}</p>
                            </div>
                            <div>
                              <p className="text-xs font-bold text-gray-400 uppercase mb-1">Responsible</p>
                              <p className="text-sm text-gray-700">{row.person_responsible || row.responsible}</p>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </>
                )}
              </div>
            );
          })
        )}
      </section>
    </PublicShell>
  );
}
