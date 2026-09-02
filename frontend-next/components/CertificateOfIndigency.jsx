'use client';

import PrintableDocumentLayout from './PrintableDocumentLayout';

/**
 * CertificateOfIndigency
 *
 * Official Barangay Pinyahan Certificate of Indigency (Screenshot 2).
 */
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
    <PrintableDocumentLayout>
      <div className="text-[14px] text-black" style={{ lineHeight: '2.3' }}>
        {/* Document Title */}
        <h1 className="text-center text-[21px] font-bold tracking-[3px] uppercase mb-12 text-black">
          CERTIFICATE OF INDIGENCY
        </h1>

        {/* Paragraph 1 */}
        <p className="text-justify mb-7" style={{ textIndent: '3rem' }}>
          This is to certify that{' '}
          <span className="font-bold underline uppercase px-1">
            {residentName || '___________________________________'}
          </span>
          , Filipino, of legal age,{' '}
          <span className="font-bold underline px-1">
            {age || '________'}
          </span>
          , born on{' '}
          <span className="font-bold underline px-1">
            {birthdate || '__________________________'}
          </span>
          , is a resident of{' '}
          <span className="font-bold underline px-1">
            {address || '_______________________________'}
          </span>
          , Brgy. Pinyahan, Quezon City.
        </p>

        {/* Paragraph 2 */}
        <p className="text-justify mb-7" style={{ textIndent: '3rem' }}>
          This further certifies the above-mentioned name and his/her family is considered as{' '}
          <strong className="font-bold">&ldquo;INDIGENT&rdquo;</strong> in this barangay.
        </p>

        {/* Paragraph 3 */}
        <p className="text-justify mb-7" style={{ textIndent: '3rem' }}>
          This certification is being issued upon the request of{' '}
          <span className="font-bold underline uppercase px-1">
            {requestor || residentName || '____________________________________'}
          </span>
          .
        </p>

        {/* Paragraph 4 */}
        <p className="text-justify mb-7" style={{ textIndent: '3rem' }}>
          Purpose:{' '}
          <span className="font-bold underline px-1">
            {purpose || '________________________________'}
          </span>
        </p>

        {/* Paragraph 5 */}
        <p className="text-justify mb-16" style={{ textIndent: '3rem' }}>
          Issued this{' '}
          <span className="font-bold underline px-1">{issueDay || '_____'}</span>{' '}
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
