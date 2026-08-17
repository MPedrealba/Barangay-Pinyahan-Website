'use client';

import PrintableDocumentLayout from './PrintableDocumentLayout';

/**
 * CertificateOfResidency
 *
 * Official Barangay Pinyahan Certificate of Residency document.
 *
 * Props:
 *   residentName    – Full name of the resident
 *   civilStatus     – Civil status (e.g. "Single", "Married")
 *   birthdate       – Date of birth (formatted string)
 *   address         – Residential address within the barangay
 *   yearsOfResidency – Number of years residing in the barangay
 *   purpose         – Purpose for issuing the certificate
 *   issueDay        – Day of issuance (e.g. "15th")
 *   issueMonth      – Month of issuance (e.g. "August")
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

export default function CertificateOfResidency({
  residentName,
  civilStatus,
  birthdate,
  address,
  yearsOfResidency,
  purpose,
  issueDay,
  issueMonth,
}) {
  return (
    <PrintableDocumentLayout title="CERTIFICATE OF RESIDENCY">

      {/* ── Salutation ─────────────────────────────────────────────────── */}
      <p className="text-[12px] mb-5 font-bold">TO WHOM IT MAY CONCERN:</p>

      {/* ── Body Text ──────────────────────────────────────────────────── */}
      <p
        className="text-[12px] leading-[2.5rem] text-justify"
        style={{ textIndent: '2em', marginBottom: '1.5rem' }}
      >
        This is to certify that
        <Blank value={residentName} />, of legal age, Filipino,
        <Blank value={civilStatus} />, born on
        <Blank value={birthdate} />, is a bonafide resident of
        <Blank value={address} />, Barangay Pinyahan, Quezon City, Philippines.
      </p>

      <p
        className="text-[12px] leading-[2.5rem] text-justify"
        style={{ textIndent: '2em', marginBottom: '1.5rem' }}
      >
        The undersigned has certified that after a reasonable inquiry, I have
        verified the authenticity of barangay residency showing that the
        applicant has been residing in the barangay for at least
        <Blank value={yearsOfResidency} /> prior to the application of this
        Affidavit of Residency.
      </p>

      <p
        className="text-[12px] leading-[2.5rem] text-justify"
        style={{ textIndent: '2em', marginBottom: '1.5rem' }}
      >
        This certification is being issued upon the request of the
        above-mentioned name for <Blank value={purpose} />.
      </p>

      <p
        className="text-[12px] leading-[2.5rem] text-justify"
        style={{ textIndent: '2em', marginBottom: '2.5rem' }}
      >
        Issued this <Blank value={issueDay} /> day of
        <Blank value={issueMonth} /> 2026, at Barangay Pinyahan, District IV,
        Quezon City, Philippines.
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

      {/* ── Bottom Layout: Picture / Thumbmark / Signature ─────────────── */}
      <div className="mt-14 grid grid-cols-3 gap-6 items-end">
        {/* Applicant's Picture */}
        <div className="flex flex-col items-center">
          <div
            className="border-2 border-black"
            style={{ width: '2.5cm', height: '2.5cm' }}
          />
          <p className="text-[9px] text-center mt-1 m-0">
            Applicant&apos;s Picture
          </p>
        </div>

        {/* Applicant's Thumbmark (right) */}
        <div className="flex flex-col items-center">
          <div
            className="border-2 border-black"
            style={{ width: '2.5cm', height: '2.5cm' }}
          />
          <p className="text-[9px] text-center mt-1 m-0">
            Applicant&apos;s Thumbmark (right)
          </p>
        </div>

        {/* Applicant's Signature */}
        <div className="flex flex-col items-center">
          <div
            className="border-b-2 border-black"
            style={{ width: '100%', height: '1px', marginTop: '2.2cm' }}
          />
          <p className="text-[9px] text-center mt-1 m-0">
            Applicant&apos;s Signature
          </p>
        </div>
      </div>

      {/* ── Validity Notice ────────────────────────────────────────────── */}
      <div className="mt-8 border-t border-gray-300 pt-3">
        <p className="text-[8px] text-gray-600 italic m-0 leading-relaxed">
          *This certification document is not valid without Official Dry Seal,
          Barangay Chairman Signature/Stamp.
        </p>
        <p className="text-[8px] text-gray-600 italic m-0 mt-1 leading-relaxed">
          *Officials and Applicants who will submit false certification or
          Documents shall be held liable for Administrative/Criminal
          Liabilities.
        </p>
      </div>
    </PrintableDocumentLayout>
  );
}
