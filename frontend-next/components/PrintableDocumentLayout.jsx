'use client';

/**
 * PrintableDocumentLayout
 * 
 * Master layout wrapper for all official Barangay Pinyahan documents.
 * Handles A4 paper sizing, print-specific CSS, the background watermark image,
 * and the Republic of the Philippines / Barangay header block.
 *
 * Usage:
 *   <PrintableDocumentLayout title="CERTIFICATE OF INDIGENCY">
 *     {/* document body content */}
 *   </PrintableDocumentLayout>
 */
export default function PrintableDocumentLayout({ title, children }) {
  return (
    <>
      {/* ── Print-specific styles ────────────────────────────────────────── */}
      <style jsx global>{`
        @media print {
          @page {
            size: 210mm 297mm;
            margin: 0;
          }
          html, body {
            margin: 0 !important;
            padding: 0 !important;
            -webkit-print-color-adjust: exact !important;
            print-color-adjust: exact !important;
          }
          /* Hide anything outside the document */
          body > *:not(#printable-document-root) {
            display: none !important;
          }
          #printable-document-root {
            box-shadow: none !important;
          }
        }
      `}</style>

      <div
        id="printable-document-root"
        className="bg-white mx-auto shadow-xl relative"
        style={{
          width: '210mm',
          minHeight: '297mm',
          padding: '18mm 22mm 16mm',
          fontFamily: "'Times New Roman', Times, serif",
          color: '#000',
          boxSizing: 'border-box',
        }}
      >
        {/* ── Background watermark ─────────────────────────────────────── */}
        <div
          className="absolute inset-0 pointer-events-none"
          style={{
            backgroundImage: "url('/images/brgy-doc-bg.jpg')",
            backgroundSize: 'cover',
            backgroundPosition: 'center',
            backgroundRepeat: 'no-repeat',
            opacity: 0.08,
            zIndex: 0,
          }}
        />

        {/* ── Content layer (above watermark) ──────────────────────────── */}
        <div className="relative" style={{ zIndex: 1 }}>

          {/* ── Republic of the Philippines Header ─────────────────────── */}
          <div className="text-center mb-3">
            <p className="text-[10px] tracking-[2px] uppercase m-0">
              Republic of the Philippines
            </p>
            <p className="text-[10px] tracking-[1px] m-0 mt-[2px]">
              City of Quezon
            </p>
            <p className="text-[10px] tracking-[1px] font-bold m-0 mt-[2px]">
              OFFICE OF THE BARANGAY CAPTAIN
            </p>
            <p className="text-[11px] font-black tracking-[1px] uppercase m-0 mt-[2px]">
              Barangay Pinyahan
            </p>
            <p className="text-[9px] text-gray-600 m-0 mt-[2px]">
              E. Rodriguez Jr. Avenue (Libis), Quezon City
            </p>
          </div>

          {/* ── Decorative double rule ─────────────────────────────────── */}
          <div
            className="mx-0 mt-[10px] mb-[6px]"
            style={{ borderTop: '3px double #000' }}
          />
          <div
            className="mx-0 mb-[18px]"
            style={{ borderTop: '1px solid #000' }}
          />

          {/* ── Document Title ─────────────────────────────────────────── */}
          {title && (
            <div className="text-center mb-7">
              <h1 className="text-[18px] font-black tracking-[3px] uppercase underline m-0">
                {title}
              </h1>
            </div>
          )}

          {/* ── Document Body (children) ───────────────────────────────── */}
          {children}
        </div>
      </div>
    </>
  );
}
