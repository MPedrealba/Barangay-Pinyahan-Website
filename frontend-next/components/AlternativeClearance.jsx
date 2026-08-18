'use client';

import PrintableDocumentLayout from './PrintableDocumentLayout';

/**
 * AlternativeClearance
 *
 * Official Barangay Pinyahan Barangay Clearance document.
 *
 * Props:
 *   residentName     – Full name of the resident
 *   address          – Residential address within the barangay
 *   purpose          – Purpose for the clearance
 *   yearsOfResidency – Number of years residing in the barangay
 *   issueDay         – Day of issuance (e.g. "15th")
 *   issueMonth       – Month of issuance (e.g. "August")
 */

const blankClasses =
  'font-bold border-b border-black inline-block text-center px-4 mx-2';

function Blank({ value }) {
  return (
    <span className={blankClasses} style={{ minWidth: '8rem' }}>
      {value}
    </span>
  );
}

export default function AlternativeClearance({
  residentName,
  address,
  purpose,
  yearsOfResidency,
  issueDay,
  issueMonth,
}) {
  return (
    <PrintableDocumentLayout title="BARANGAY CLEARANCE">

      {/* ── Body Text ──────────────────────────────────────────────────── */}
      <p
        className="text-[12px] leading-[2.5rem] text-justify"
        style={{ textIndent: '2em', marginBottom: '1.5rem' }}
      >
        THIS IS TO CERTIFY THAT,
        <Blank value={residentName} />, of legal age, Filipino, and a bonafide
        resident of
        <Blank value={address} />, Barangay Pinyahan, Quezon City, Metro
        Manila, has applied for a Barangay Clearance for the purpose of
        applying for: <Blank value={purpose} />.
      </p>

      <p
        className="text-[12px] leading-[2.5rem] text-justify"
        style={{ textIndent: '2em', marginBottom: '1.5rem' }}
      >
        This clearance is issued upon verification that the applicant has no
        outstanding obligations or pending cases in this barangay, and is in
        good standing with the community.
      </p>

      <p
        className="text-[12px] leading-[2.5rem] text-justify"
        style={{ textIndent: '2em', marginBottom: '1.5rem' }}
      >
        The applicant has been a resident of this barangay for
        <Blank value={yearsOfResidency} /> years and has been a law-abiding
        citizen, adhering to all local ordinances and regulations.
      </p>

      <p
        className="text-[12px] leading-[2.5rem] text-justify"
        style={{ textIndent: '2em', marginBottom: '2.5rem' }}
      >
        Issued this <Blank value={issueDay} /> day of
        <Blank value={issueMonth} /> 2026, at Barangay Pinyahan, Quezon City.
      </p>

      {/* ── Signature Block ────────────────────────────────────────────── */}
      <div className="mt-16 flex justify-end">
        <div className="text-center">
          <p className="text-[12px] font-black tracking-[1px] uppercase m-0">
            HON. RICARDO A. VILLAFLOR, MPA
          </p>
          <p className="text-[10px] m-0 mt-1">Punong Barangay</p>
        </div>
      </div>
    </PrintableDocumentLayout>
  );
}
