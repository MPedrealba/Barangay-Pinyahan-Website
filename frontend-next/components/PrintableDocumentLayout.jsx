import React from 'react';

export default function PrintableDocumentLayout({ children }) {
  return (
    <div 
      className="relative mx-auto bg-white overflow-hidden text-black font-sans shadow-lg"
      style={{
        width: '210mm',
        height: '297mm',
        minHeight: '297mm',
        boxSizing: 'border-box',
        fontFamily: "'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif",
      }}
    >
      {/* Background with Barangay header, seal watermark, and gradient footer */}
      <img 
        src="/images/brgy-doc-bg.jpg" 
        alt="Official Background" 
        className="absolute top-0 left-0 w-full h-full z-0 pointer-events-none"
        style={{ 
          objectFit: 'fill',
          width: '100%',
          height: '100%',
        }}
      />

      {/* The Text Container positioned perfectly below the top banner */}
      <div className="relative z-10 pt-[190px] px-[65px] pb-[30px] h-full box-border flex flex-col justify-between">
        {children}
      </div>
    </div>
  );
}
