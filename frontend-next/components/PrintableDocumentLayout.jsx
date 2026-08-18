import React from 'react';

export default function PrintableDocumentLayout({ children }) {
  return (
    <div 
      className="relative mx-auto shadow-2xl bg-white font-sans text-black overflow-hidden print:shadow-none print:m-0 print:w-[210mm] print:h-[297mm]"
      style={{
        width: '210mm',
        height: '297mm', /* Locks it exactly to A4 height */
        backgroundImage: 'url(/brgy-doc-bg.jpg)',
        backgroundSize: '100% 100%', /* Forces the image to stretch corner-to-corner */
        backgroundPosition: 'top center',
        backgroundRepeat: 'no-repeat'
      }}
    >
      {/* 
        pt-[220px] pushes the dynamic text down so it doesn't overlap the blue image header.
        px-[80px] gives it wide, formal margins.
      */}
      <div className="relative z-10 px-[80px] pt-[220px]">
        {children}
      </div>
    </div>
  );
}
