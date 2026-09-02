'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import PublicShell from '@/components/PublicShell';

// ── Only the 4 services with Word document templates ───────────────────────
// Requirements & Procedures sourced from the official Barangay Pinyahan
// Citizen's Charter documents (ARTA-mandated)
const SERVICES = [
  {
    key: 'clearance',
    title: 'Barangay Clearance and Certifications',
    icon: 'fas fa-file-invoice',
    description: 'This service allows citizens to obtain Barangay Clearance and Certification, documents that certify their compliance with barangay regulations and requirements.',
    requirements: [
      'Accomplished Information Form',
      'Photocopy of valid ID address in Barangay Pinyahan (e.g Driver\'s License, UMID, Postal ID, Senior Citizen\'s ID, PWD ID, Voter\'s ID)'
    ],
    procedure: [
      'Obtain an application form and fill out completely',
      'Submit the accomplished information form and supporting requirements at Cubicle No. 9 for evaluation'
    ]
  },
  {
    key: 'clearance-no-derogatory',
    title: 'Barangay Clearance - No Derogatory',
    icon: 'fas fa-shield-alt',
    description: 'Certification that the applicant has no derogatory record or pending cases in the barangay, issued for employment and general requirements.',
    requirements: [
      'Accomplished Information Form',
      'Photocopy of valid ID address in Barangay Pinyahan (e.g Driver\'s License, UMID, Postal ID, Senior Citizen\'s ID, PWD ID, Voter\'s ID)'
    ],
    procedure: [
      'Obtain an application form and fill out completely',
      'Submit the accomplished information form and supporting requirements at Cubicle No. 9 for evaluation'
    ]
  },
  {
    key: 'indigency',
    title: 'Barangay Certificate of Indigency',
    icon: 'fas fa-file-lines',
    description: 'Issued to residents who require financial assistance for various purposes, such as medical treatment, burial, and other essential needs.',
    requirements: [
      'Accomplished Information Form',
      'Photocopy of valid ID address in Barangay Pinyahan (e.g Driver\'s License, UMID, Postal ID, Senior Citizen\'s ID, PWD ID, Voter\'s ID)'
    ],
    procedure: [
      'Obtain an application form and fill out completely',
      'Submit the accomplished information form and supporting requirements at Cubicle No. 9 for evaluation',
      'Wait for the request to be processed',
      'Receive the requested certificate/clearance'
    ]
  },
  {
    key: 'residency',
    title: 'Certificate of Residency',
    icon: 'fas fa-house-user',
    description: 'Official proof of residency within the barangay, verifying that the applicant is a bonafide resident of Barangay Pinyahan.',
    requirements: [
      'Accomplished Information Form',
      'Photocopy of valid ID address in Barangay Pinyahan (e.g Driver\'s License, UMID, Postal ID, Senior Citizen\'s ID, PWD ID, Voter\'s ID)'
    ],
    procedure: [
      'Obtain an application form and fill out completely',
      'Submit the accomplished information form and supporting requirements at Cubicle No. 9 for evaluation',
      'Wait for the request to be processed',
      'Receive the requested certificate/clearance'
    ]
  }
];

export default function ServicesPage() {
  const [activeDetail, setActiveDetail] = useState(null);
  const [lastScroll, setLastScroll] = useState(0);

  const showDetail = (card) => {
    setLastScroll(window.scrollY);
    setActiveDetail(card);
    window.scrollTo({ top: 0, behavior: 'instant' });
  };

  const showListing = () => {
    setActiveDetail(null);
    setTimeout(() => window.scrollTo({ top: lastScroll, behavior: 'instant' }), 10);
  };

  const otherCards = activeDetail
    ? SERVICES.filter((c) => c.key !== activeDetail.key)
    : [];

  return (
    <PublicShell activeHref="/services">
      {/* ═══════════ LISTING VIEW ═══════════ */}
      {!activeDetail && (
        <>
          {/* Hero */}
          <section
            className="bg-cover bg-center h-[200px] sm:h-[280px] md:h-[350px] flex items-center justify-center relative px-[5%]"
            style={{ backgroundImage: "url('https://placehold.co/1200x400?text=Community+Park+Image')" }}
          >
            <div className="bg-[rgba(0,51,102,0.6)] px-6 py-4 md:px-10 md:py-5 rounded-md text-center mx-auto">
              <h1 className="text-white text-xl sm:text-2xl md:text-[2.5rem] font-extrabold uppercase text-center drop-shadow-lg m-0">
                BARANGAY COMMUNITY SERVICES
              </h1>
            </div>
          </section>

          {/* Online Service Request CTA */}
          <section className="bg-gradient-to-br from-[#1565c0] to-[#0d47a1] py-6 md:py-8 px-[5%]">
            <div className="max-w-[1200px] mx-auto flex flex-col sm:flex-row items-center justify-between gap-4">
              <div className="text-center sm:text-left">
                <p className="text-white/80 text-xs font-bold uppercase tracking-wider mb-1">
                  <i className="fas fa-bolt mr-1.5" />New — Online Service Request
                </p>
                <h2 className="text-white font-extrabold text-lg md:text-xl m-0">
                  Skip the queue. Request your documents online!
                </h2>
                <p className="text-white/75 text-sm mt-1">
                  Submit requests for Barangay Clearance, Certificates, and more — get a tracking number instantly.
                </p>
              </div>
              <Link
                href="/services/request"
                className="bg-white text-[#1565c0] px-7 py-3 rounded-full font-extrabold text-[0.92rem] no-underline flex items-center gap-2 whitespace-nowrap shadow-lg hover:bg-gray-50 transition-colors shrink-0"
              >
                <i className="fas fa-file-alt" /> Request a Service
              </Link>
            </div>
          </section>

          {/* Service Listing */}
          <section className="w-[90%] max-w-[1200px] mx-auto py-8 md:py-12">
            <h3 className="text-xl md:text-[1.8rem] font-extrabold text-gray-800 uppercase mb-6 text-center">
              SERVICE LISTING
            </h3>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mt-10">
              {SERVICES.map((card) => (
                <ServiceCard key={card.key} card={card} onLearnMore={() => showDetail(card)} />
              ))}
            </div>
          </section>
        </>
      )}

      {/* ═══════════ DETAIL VIEW ═══════════ */}
      {activeDetail && (
        <>
          {/* Title Banner */}
          <div className="w-[90%] max-w-[1200px] mx-auto mt-8">
            <div className="bg-[#006eb3] text-white px-5 py-4 border-[3px] border-[#003d80] rounded-md w-full flex items-center justify-between shadow-lg">
              <button
                onClick={showListing}
                className="text-white text-2xl font-bold bg-white/15 hover:bg-white/30 rounded-lg px-4 py-1.5 shrink-0 cursor-pointer border-0 transition-colors flex items-center justify-center"
              >
                &#8592;
              </button>
              <h2 className="flex-1 text-center text-lg sm:text-xl md:text-[1.8rem] font-extrabold uppercase m-0 tracking-wider text-white px-3">
                {activeDetail.title}
              </h2>
              <span className="invisible text-2xl font-bold px-4 py-1.5 shrink-0">&#8592;</span>
            </div>
          </div>

          {/* Process Section — Side by Side */}
          <section className="w-[90%] max-w-[1200px] mx-auto pt-9 pb-9">
            <h3 className="text-xl md:text-2xl font-extrabold text-gray-800 uppercase mb-6 tracking-wide">PROCESS</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-7">
              {/* Requirements */}
              <div className="border-2 border-[#006eb3] rounded-xl p-6 md:p-8 bg-white min-h-[260px] shadow-sm">
                <h4 className="text-[1.05rem] font-extrabold text-[#006eb3] uppercase mb-4 tracking-wide border-b-2 border-blue-100 pb-2.5">
                  REQUIREMENTS:
                </h4>
                {activeDetail.requirements && activeDetail.requirements.length > 0 ? (
                  <ul className="list-disc pl-5 text-gray-600 space-y-3 text-sm md:text-base leading-relaxed">
                    {activeDetail.requirements.map((r, i) => (
                      <li key={i}>{r}</li>
                    ))}
                  </ul>
                ) : (
                  <p className="text-sm text-gray-400 italic">No specific requirements listed.</p>
                )}
              </div>

              {/* Procedure */}
              <div className="border-2 border-[#006eb3] rounded-xl p-6 md:p-8 bg-white min-h-[260px] shadow-sm">
                <h4 className="text-[1.05rem] font-extrabold text-[#006eb3] uppercase mb-4 tracking-wide border-b-2 border-blue-100 pb-2.5">
                  PROCEDURE:
                </h4>
                {activeDetail.procedure && activeDetail.procedure.length > 0 ? (
                  <ol className="list-decimal pl-5 text-gray-600 space-y-3 text-sm md:text-base leading-relaxed">
                    {activeDetail.procedure.map((p, i) => (
                      <li key={i}>{p}</li>
                    ))}
                  </ol>
                ) : (
                  <p className="text-sm text-gray-400 italic">No specific procedure listed.</p>
                )}
              </div>
            </div>

            {/* Request CTA inside detail */}
            <div className="mt-8 flex justify-center">
              <Link
                href="/services/request"
                className="bg-[#1565c0] hover:bg-[#0d47a1] text-white px-8 py-3.5 rounded-full font-extrabold text-[0.95rem] no-underline flex items-center gap-2.5 shadow-md transition-colors"
              >
                <i className="fas fa-paper-plane" /> Request This Document Online
              </Link>
            </div>
          </section>

          {/* Other Services */}
          {otherCards.length > 0 && (
            <section className="w-[90%] max-w-[1200px] mx-auto pt-2.5 pb-12">
              <h3 className="text-lg md:text-xl font-extrabold text-gray-800 uppercase mb-6 tracking-wide">OTHER SERVICES:</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 w-full">
                {otherCards.map((card) => (
                  <ServiceCard key={card.key} card={card} compact onLearnMore={() => showDetail(card)} />
                ))}
              </div>
            </section>
          )}
        </>
      )}
    </PublicShell>
  );
}

// ── Service Card Component ────────────────────────────────────────────────────
function ServiceCard({ card, onLearnMore, compact }) {
  return (
    <div className="bg-white rounded-2xl shadow-md p-6 md:p-8 flex items-center gap-5 md:gap-6 transition-transform duration-300 hover:-translate-y-1.5 hover:shadow-lg">
      <div className="text-5xl md:text-[3.5rem] text-[#006eb3] min-w-[70px] text-center shrink-0">
        <i className={card.icon || 'fas fa-file-invoice'} aria-hidden="true" />
      </div>
      <div className="flex-1 flex flex-col gap-3 md:gap-4 min-w-0">
        <h4 className="text-base md:text-xl font-bold text-gray-800 m-0">{card.title}</h4>
        {card.description && !compact && (
          <p className="text-[0.88rem] text-gray-500 m-0 leading-snug">{card.description}</p>
        )}
        <button
          onClick={onLearnMore}
          className="inline-block bg-[#006eb3] hover:bg-[#004a80] text-white px-5 md:px-6 py-2.5 rounded-md font-bold text-[0.9rem] text-center self-start whitespace-nowrap no-underline transition-colors cursor-pointer border-0"
        >
          LEARN MORE
        </button>
      </div>
    </div>
  );
}
