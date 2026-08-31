'use client';

import PrintableDocumentLayout from './PrintableDocumentLayout';

/**
 * CertificateOfResidency
 *
 * Official Barangay Pinyahan Certificate of Residency (Screenshot 4).
 */
export default function CertificateOfResidency({
  residentName,
  civilStatus,
  birthdate,
  address,
  yearsOfResidency,
  purpose,
  photo,
  issueDay,
  issueMonth,
}) {
  return (
    <PrintableDocumentLayout>
      <div className="text-[13px] text-black" style={{ lineHeight: '2.0' }}>
        {/* Document Title (Blue) */}
        <h1 className="text-center text-[21px] font-bold tracking-[3px] uppercase mb-6 text-[#0044cc]">
          CERTIFICATE OF RESIDENCY
        </h1>

        {/* Salutation */}
        <p className="font-bold mb-4 tracking-wide text-black">
          TO WHOM IT MAY CONCERN:
        </p>

        {/* Paragraph 1 */}
        <p className="text-justify mb-5" style={{ textIndent: '3rem' }}>
          This is to certify that{' '}
          <span className="font-bold underline uppercase px-1">
            {residentName || '__________________________________________'}
          </span>
          , of legal age, Filipino,{' '}
          <span className="font-bold underline px-1">
            {civilStatus || '________________________'}
          </span>
          , born on{' '}
          <span className="font-bold underline px-1">
            {birthdate || '____________________________'}
          </span>
          , is a bonafide resident of{' '}
          <span className="font-bold underline px-1">
            {address || '_________________________________________'}
          </span>
          , Barangay Pinyahan, Quezon City, Philippines.
        </p>

        {/* Paragraph 2 */}
        <p className="text-justify mb-5" style={{ textIndent: '3rem' }}>
          The undersigned has certified that after a reasonable inquiry, I have verified the authenticity of barangay residency showing that the applicant has been residing in the barangay for at least{' '}
          <span className="font-bold underline px-1">
            {yearsOfResidency ? `${yearsOfResidency} years` : '_____________________________'}
          </span>{' '}
          prior to the application of this Affidavit of Residency.
        </p>

        {/* Paragraph 3 */}
        <p className="text-justify mb-5" style={{ textIndent: '3rem' }}>
          This certification is being issued upon the request of the above-mentioned name for{' '}
          <span className="font-bold underline px-1">
            {purpose || '____________________________________'}
          </span>
          .
        </p>

        {/* Paragraph 4 */}
        <p className="text-justify mb-8" style={{ textIndent: '3rem' }}>
          Issued this{' '}
          <span className="font-bold underline px-1">{issueDay || '_____'}</span>{' '}
          day of{' '}
          <span className="font-bold underline px-1">{issueMonth || '____________________________'}</span>{' '}
          2026, at Barangay Pinyahan, District IV, Quezon City, Philippines.
        </p>

        {/* Signature Block */}
        <div className="flex justify-end mb-6">
          <div className="text-center" style={{ minWidth: '260px' }}>
            <p className="font-bold text-[13.5px] tracking-[1px] uppercase m-0 text-black">
              HON. RICARDO A. VILLAFLOR, MPA
            </p>
            <p className="text-[11.5px] m-0 mt-0.5 text-gray-800">Punong Barangay</p>
          </div>
        </div>

        {/* Bottom Section: Picture, Thumbmark, Signature */}
        <div className="grid grid-cols-3 gap-6 items-end mb-4">
          {/* Picture Box */}
          <div className="flex flex-col items-center">
            {photo ? (
              <img
                src={photo}
                alt="Applicant"
                className="w-[85px] h-[85px] object-cover border border-black bg-white"
              />
            ) : (
              <div className="w-[85px] h-[85px] border border-black bg-white" />
            )}
            <span className="text-[10px] text-red-600 mt-1">Applicant&apos;s Picture</span>
          </div>

          {/* Thumbmark Box */}
          <div className="flex flex-col items-center">
            <div className="w-[85px] h-[85px] border border-black bg-white" />
            <span className="text-[10px] text-red-600 mt-1">Applicant&apos;s Thumbmark (right)</span>
          </div>

          {/* Signature Line */}
          <div className="flex flex-col items-center">
            <div className="w-full border-b border-black mb-1" />
            <span className="text-[10px] text-black">Applicant&apos;s Signature</span>
          </div>
        </div>

        {/* Meta details & Disclaimer */}
        <div className="flex justify-between items-end text-[9.5px] leading-tight text-gray-800">
          <div className="space-y-0.5">
            <p className="m-0"><strong>Issued at:</strong> Pinyahan Barangay Hall</p>
            <p className="m-0"><strong>Issued on:</strong></p>
            <p className="m-0"><strong>Valid until:</strong> December 31, 2026</p>
          </div>
          <div className="w-48" />
        </div>

        <div className="mt-3 text-[8px] italic text-gray-600 leading-normal">
          <p className="m-0">*This certification document is not valid without Official Dry Seal, Barangay Chairman Signature/Stamp.</p>
          <p className="m-0">*Officials and Applicants who will submit false certification or Documents shall be held liable for Administrative/Criminal Liabilities.</p>
        </div>
      </div>
    </PrintableDocumentLayout>
  );
}
