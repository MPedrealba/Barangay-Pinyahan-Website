'use client';

import PrintableDocumentLayout from './PrintableDocumentLayout';

/**
 * BarangayClearance
 *
 * Official Barangay Pinyahan Barangay Clearance (Certification Format - Screenshot 1).
 */
export default function BarangayClearance({
  residentName,
  address,
  purpose,
  issueDay,
  issueMonth,
}) {
  return (
    <PrintableDocumentLayout>
      <div className="text-[14px] text-black" style={{ lineHeight: '2.3' }}>
        {/* Document Title */}
        <h1 className="text-center text-[21px] font-bold tracking-[4px] uppercase mb-12 text-black">
          BARANGAY CLEARANCE
        </h1>

        {/* Paragraph 1 */}
        <p className="text-justify mb-7" style={{ textIndent: '3rem' }}>
          This is to certify that,{' '}
          <span className="font-bold underline uppercase px-1">
            {residentName || '____________________________________'}
          </span>
          , of legal age, Filipino, and a bonafide resident of{' '}
          <span className="font-bold underline px-1">
            {address || '_____________________'}
          </span>
          , Barangay Pinyahan, Quezon City, Metro Manila, has applied for a Barangay Certification and has been verified to have{' '}
          <strong className="font-bold">no derogatory record</strong> or{' '}
          <strong className="font-bold">pending cases</strong> in this office.
        </p>

        {/* Paragraph 2 */}
        <p className="text-justify mb-7" style={{ textIndent: '3rem' }}>
          This certification is issued for{' '}
          <span className="font-bold underline px-1">
            {purpose || '____________________________________________________'}
          </span>{' '}
          purposes, and is valid for a period of six (6) months from the date of issuance.
        </p>

        {/* Paragraph 3 */}
        <p className="text-justify mb-16" style={{ textIndent: '3rem' }}>
          Issued this{' '}
          <span className="font-bold underline px-1">{issueDay || '___'}</span>{' '}
          day of{' '}
          <span className="font-bold underline px-1">{issueMonth || '__________________'}</span>{' '}
          2026, at Barangay Pinyahan, Quezon City.
        </p>
      </div>

      {/* Signature Block */}
      <div className="flex justify-end pb-12">
        <div className="text-center" style={{ minWidth: '260px' }}>
          <p className="font-bold text-[14px] tracking-[1px] uppercase m-0 text-black">
            HON. RICARDO A. VILLAFLOR, MPA
          </p>
          <p className="text-[12px] m-0 mt-1 text-gray-800">Punong Barangay</p>
        </div>
      </div>
    </PrintableDocumentLayout>
  );
}
