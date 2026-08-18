'use client';

import PrintableDocumentLayout from './PrintableDocumentLayout';

/**
 * CertificateOfIndigency
 *
 * Official Barangay Pinyahan Certificate of Indigency document.
 *
 * Props:
 *   residentName  – Full name of the resident
 *   age           – Age of the resident
 *   birthdate     – Date of birth (formatted string)
 *   address       – Residential address within the barangay
 *   requestor     – Name of the person requesting the certificate
 *   purpose       – Purpose for issuing the certificate
 *   issueDay      – Day of issuance (e.g. "15th")
 *   issueMonth    – Month of issuance (e.g. "August")
 */

/* Reusable inline blank style */
const blankClasses =
  'font-bold border-b border-black inline-block text-center px-4 mx-2';

function Blank({ value }) {
  return (
    <span className={blankClasses} style={{ minWidth: '8rem' }}>
      {value}
    </span>
  );
}

export default function CertificateOfIndigency({
  residentName,
  age,
  birthdate,
  address,
  requestor,
  purpose,
  issueDay,
  issueMonth,
}) {
  return (
    <PrintableDocumentLayout title="CERTIFICATE OF INDIGENCY">

      {/* ── Body Text ──────────────────────────────────────────────────── */}
      <p
        className="text-[12px] leading-[2.5rem] text-justify"
        style={{ textIndent: '2em', marginBottom: '1.5rem' }}
      >
        This is to certify that
        <Blank value={residentName} />, Filipino, of legal age,
        <Blank value={age} />, born on
        <Blank value={birthdate} />, is a resident of
        <Blank value={address} />, Brgy. Pinyahan, Quezon City.
      </p>

      <p
        className="text-[12px] leading-[2.5rem] text-justify"
        style={{ textIndent: '2em', marginBottom: '1.5rem' }}
      >
        This further certifies the above-mentioned name and his/her family is
        considered as &ldquo;INDIGENT&rdquo; in this barangay.
      </p>

      <p
        className="text-[12px] leading-[2.5rem] text-justify"
        style={{ textIndent: '2em', marginBottom: '1.5rem' }}
      >
        This certification is being issued upon the request of
        <Blank value={requestor} />.
      </p>

      <p
        className="text-[12px] leading-[2.5rem] text-justify"
        style={{ textIndent: '2em', marginBottom: '1.5rem' }}
      >
        Purpose: <Blank value={purpose} />.
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
