'use client';
import { useState, useEffect, useRef, use } from 'react';
import { useRouter } from 'next/navigation';

// ── Helpers ─────────────────────────────────────────────────────────────────
function formatDate(str) {
  if (!str) return '—';
  return new Date(str).toLocaleDateString('en-US', {
    year: 'numeric', month: 'long', day: 'numeric',
  });
}

function toOrdinal(n) {
  const s = ['th', 'st', 'nd', 'rd'];
  const v = n % 100;
  return n + (s[(v - 20) % 10] || s[v] || s[0]);
}

// ── Admin PDF View Page ──────────────────────────────────────────────────────
export default function ServicePDFPage({ params }) {
  const { id }   = use(params);
  const router   = useRouter();
  const printRef = useRef(null);

  const [request,      setRequest]      = useState(null);
  const [loading,      setLoading]      = useState(true);
  const [downloading,  setDownloading]  = useState(false);
  const [error,        setError]        = useState('');

  useEffect(() => {
    const fetchRequest = async () => {
      try {
        const token = localStorage.getItem('token');
        const res = await fetch(
          `${process.env.NEXT_PUBLIC_API_URL}/api/admin/service-requests/${id}`,
          { headers: { 'Authorization': `Bearer ${token}` } }
        );
        if (!res.ok) throw new Error('Request not found.');
        const data = await res.json();
        setRequest(data.request);
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };
    fetchRequest();
  }, [id]);

  // ── PDF Download ─────────────────────────────────────────────────────────
  const handleDownloadPDF = async () => {
    if (!printRef.current || !request) return;
    setDownloading(true);
    try {
      // Dynamic import to avoid SSR issues
      const html2canvas = (await import('html2canvas')).default;
      const { jsPDF }   = await import('jspdf');

      const canvas = await html2canvas(printRef.current, {
        scale:           2,           // high-DPI
        useCORS:         true,
        backgroundColor: '#ffffff',
        logging:         false,
      });

      const imgData  = canvas.toDataURL('image/png');
      const pdf      = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' });
      const pageW    = pdf.internal.pageSize.getWidth();
      const pageH    = pdf.internal.pageSize.getHeight();
      const imgProps = pdf.getImageProperties(imgData);
      const imgH     = (imgProps.height * pageW) / imgProps.width;

      // If content is longer than one page, add pages
      let heightLeft = imgH;
      let position   = 0;
      pdf.addImage(imgData, 'PNG', 0, position, pageW, imgH);
      heightLeft -= pageH;
      while (heightLeft > 0) {
        position = heightLeft - imgH;
        pdf.addPage();
        pdf.addImage(imgData, 'PNG', 0, position, pageW, imgH);
        heightLeft -= pageH;
      }

      pdf.save(`${request.tracking_no}_Clearance.pdf`);
    } catch (err) {
      console.error('PDF generation error:', err);
      alert('Failed to generate PDF. Please try again.');
    } finally {
      setDownloading(false);
    }
  };

  // ── Computed values ──────────────────────────────────────────────────────
  const today         = formatDate(new Date().toISOString());
  const issuedDate    = formatDate(request?.created_at);
  const residentName  = request?.resident_name  || '________________';
  const age           = request?.age            || '__';
  const civilStatus   = request?.civil_status   || '________________';
  const address       = request?.address        || '________________';
  const purpose       = request?.purpose        || '________________';
  const serviceType   = request?.service_type   || 'BARANGAY CLEARANCE';
  const trackingNo    = request?.tracking_no    || '—';

  // Map service type to document title for the certificate header
  const DOC_TITLES = {
    'Barangay Clearance':          'BARANGAY CLEARANCE',
    'Business Permit Application': 'BARANGAY BUSINESS CLEARANCE',
    'Certificate of Indigency':    'CERTIFICATE OF INDIGENCY',
    'Certificate of Residency':    'CERTIFICATE OF RESIDENCY',
    'Health Services':             'HEALTH ASSISTANCE REFERRAL',
    'Disaster Response':           'DISASTER RESPONSE ASSISTANCE',
  };
  const docTitle = DOC_TITLES[serviceType] || 'BARANGAY CLEARANCE';

  // Body text per service type
  const bodyText = {
    'Barangay Clearance': `This is to certify that ${residentName}, ${age} years old, ${civilStatus}, residing at ${address}, is a bonafide resident of Barangay Pinyahan, Quezon City and has no derogatory record on file in this office. This certification is being issued upon the request of the above-mentioned person for ${purpose} purposes.`,
    'Business Permit Application': `This is to certify that ${residentName}, ${age} years old, ${civilStatus}, residing at ${address}, is a bonafide resident of Barangay Pinyahan, Quezon City. This office interposes no objection to the operation of his/her business within this barangay. This certification is issued upon the request of the above-named person for the purpose of ${purpose}.`,
    'Certificate of Indigency': `This is to certify that ${residentName}, ${age} years old, ${civilStatus}, residing at ${address}, is a bonafide resident of Barangay Pinyahan, Quezon City and is known to belong to an indigent family in this barangay. This certification is being issued upon the request of the above-mentioned person for ${purpose} purposes.`,
    'Certificate of Residency': `This is to certify that ${residentName}, ${age} years old, ${civilStatus}, is a bonafide resident of ${address}, Barangay Pinyahan, Quezon City. This certification is being issued upon the request of the above-mentioned person for ${purpose} purposes.`,
    'Health Services': `This is to certify that ${residentName}, ${age} years old, ${civilStatus}, residing at ${address}, has requested health assistance from Barangay Pinyahan, Quezon City for the purpose of ${purpose}. This referral is issued to facilitate access to appropriate health services.`,
    'Disaster Response': `This is to certify that ${residentName}, ${age} years old, ${civilStatus}, residing at ${address}, is a registered resident of Barangay Pinyahan, Quezon City and is hereby requesting disaster response assistance for ${purpose}. This certification is issued to support the processing of appropriate aid.`,
  };
  const certBody = bodyText[serviceType] || bodyText['Barangay Clearance'];

  // ── Render ───────────────────────────────────────────────────────────────
  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen bg-gray-50">
        <i className="fas fa-spinner fa-spin text-[#0056b3] text-3xl"></i>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center h-screen gap-4">
        <i className="fas fa-exclamation-triangle text-red-400 text-4xl"></i>
        <p className="text-red-600 font-bold">{error}</p>
        <button onClick={() => router.back()} className="text-blue-600 underline text-sm">← Go Back</button>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-100 py-8 px-4">

      {/* ── Top action bar ──────────────────────────────────────────────── */}
      <div className="max-w-[900px] mx-auto mb-6 flex flex-wrap items-center justify-between gap-4">
        <button
          onClick={() => router.back()}
          className="flex items-center gap-2 text-sm font-bold text-gray-600 hover:text-gray-900 transition-colors"
        >
          <i className="fas fa-arrow-left"></i> Back
        </button>

        <div className="flex items-center gap-3">
          <div className="text-right">
            <p className="text-xs text-gray-500 font-semibold">{trackingNo}</p>
            <p className="text-xs text-gray-400">{serviceType}</p>
          </div>
          <button
            onClick={handleDownloadPDF}
            disabled={downloading}
            className="flex items-center gap-2 bg-[#0056b3] hover:bg-blue-800 disabled:bg-gray-400 text-white font-bold text-sm px-6 py-2.5 rounded-lg transition-colors shadow-sm"
          >
            <i className={`fas ${downloading ? 'fa-spinner fa-spin' : 'fa-download'}`}></i>
            {downloading ? 'Generating PDF…' : `Download as PDF`}
          </button>
        </div>
      </div>

      {/* ── A4 Document Template ─────────────────────────────────────────── */}
      {/* The printRef div is what gets captured by html2canvas */}
      <div
        ref={printRef}
        className="max-w-[900px] mx-auto bg-white shadow-xl"
        style={{
          width: '210mm',
          minHeight: '297mm',
          padding: '20mm 22mm',
          fontFamily: "'Times New Roman', Times, serif",
          color: '#000',
          boxSizing: 'border-box',
          position: 'relative',
        }}
      >
        {/* ── Republic Header ───────────────────────────────────────── */}
        <div style={{ textAlign: 'center', marginBottom: 12 }}>
          <p style={{ fontSize: 10, letterSpacing: 2, textTransform: 'uppercase', margin: 0 }}>Republic of the Philippines</p>
          <p style={{ fontSize: 10, letterSpacing: 1, margin: '2px 0' }}>City of Quezon</p>
          <p style={{ fontSize: 10, letterSpacing: 1, margin: '2px 0', fontWeight: 700 }}>OFFICE OF THE BARANGAY CAPTAIN</p>
          <p style={{ fontSize: 11, fontWeight: 900, letterSpacing: 1, margin: '2px 0', textTransform: 'uppercase' }}>Barangay Pinyahan</p>
          <p style={{ fontSize: 9, color: '#444', margin: '2px 0' }}>E. Rodriguez Jr. Avenue (Libis), Quezon City</p>
        </div>

        {/* ── Horizontal rule ───────────────────────────────────────── */}
        <div style={{ borderTop: '3px double #000', margin: '10px 0 6px' }}></div>
        <div style={{ borderTop: '1px solid #000', marginBottom: 18 }}></div>

        {/* ── Document Title ────────────────────────────────────────── */}
        <div style={{ textAlign: 'center', marginBottom: 28 }}>
          <h1 style={{ fontSize: 18, fontWeight: 900, letterSpacing: 3, textTransform: 'uppercase', margin: 0, textDecoration: 'underline' }}>
            {docTitle}
          </h1>
        </div>

        {/* ── Salutation ────────────────────────────────────────────── */}
        <p style={{ fontSize: 12, marginBottom: 20 }}>To Whom It May Concern:</p>

        {/* ── Body Text ─────────────────────────────────────────────── */}
        <p style={{ fontSize: 12, lineHeight: 2, textAlign: 'justify', textIndent: '2em', marginBottom: 28 }}>
          {certBody}
        </p>

        {/* ── Additional notice ─────────────────────────────────────── */}
        <p style={{ fontSize: 12, lineHeight: 2, textAlign: 'justify', marginBottom: 40 }}>
          This certification is issued upon the request of the interested party for whatever legal purpose it may serve and is valid for <strong>ninety (90) days</strong> from the date of issuance.
        </p>

        {/* ── Date & OR ─────────────────────────────────────────────── */}
        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 48, fontSize: 11 }}>
          <p style={{ margin: 0 }}>Issued this <strong>{today}</strong> at Barangay Pinyahan, Quezon City.</p>
          <p style={{ margin: 0 }}>O.R. No.: ______________</p>
        </div>

        {/* ── Signature Block ───────────────────────────────────────── */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 32 }}>
          {/* Prepared by */}
          <div style={{ textAlign: 'center' }}>
            <p style={{ fontSize: 10, color: '#555', margin: '0 0 40px' }}>Prepared by:</p>
            <div style={{ borderTop: '1px solid #000', paddingTop: 6 }}>
              <p style={{ fontSize: 12, fontWeight: 700, margin: 0, letterSpacing: 0.5 }}>________________________________</p>
              <p style={{ fontSize: 10, margin: '4px 0 0' }}>Barangay Secretary</p>
            </div>
          </div>
          {/* Approved by */}
          <div style={{ textAlign: 'center' }}>
            <p style={{ fontSize: 10, color: '#555', margin: '0 0 40px' }}>Approved by:</p>
            <div style={{ borderTop: '1px solid #000', paddingTop: 6 }}>
              <p style={{ fontSize: 12, fontWeight: 900, margin: 0, letterSpacing: 1, textTransform: 'uppercase' }}>HON. ________________________________</p>
              <p style={{ fontSize: 10, margin: '4px 0 0' }}>Punong Barangay</p>
            </div>
          </div>
        </div>

        {/* ── Footer watermark ──────────────────────────────────────── */}
        <div style={{ marginTop: 56, borderTop: '1px solid #ccc', paddingTop: 10, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <p style={{ fontSize: 9, color: '#888', margin: 0 }}>
            Tracking No.: <strong>{trackingNo}</strong> &nbsp;|&nbsp; Issued: {issuedDate}
          </p>
          <p style={{ fontSize: 9, color: '#888', margin: 0 }}>
            Barangay Pinyahan, Quezon City — Official Document
          </p>
        </div>
      </div>

      {/* ── Disclaimer below the doc ────────────────────────────────────── */}
      <p className="text-center text-xs text-gray-400 mt-6 max-w-[900px] mx-auto">
        <i className="fas fa-info-circle mr-1"></i>
        This preview matches the downloadable PDF. Ensure the resident's information is complete before downloading.
      </p>

    </div>
  );
}
