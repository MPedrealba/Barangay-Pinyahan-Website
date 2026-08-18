'use client';
import { useState, useEffect, useRef, use } from 'react';
import { useRouter } from 'next/navigation';
import AlternativeClearance    from '@/components/AlternativeClearance';
import CertificateOfIndigency  from '@/components/CertificateOfIndigency';
import CertificateOfResidency  from '@/components/CertificateOfResidency';

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
  const residentName      = request?.resident_name      || '________________';
  const age               = request?.age                || '__';
  const civilStatus       = request?.civil_status       || '________________';
  const address           = request?.address            || '________________';
  const purpose           = request?.purpose            || '________________';
  const serviceType       = request?.service_type       || 'Barangay Clearance';
  const trackingNo        = request?.tracking_no        || '—';
  const birthdate         = request?.birthdate          ? formatDate(request.birthdate) : '________________';
  const yearsOfResidency  = request?.years_of_residency || '________________';
  const requestor         = request?.requestor          || residentName;

  // ── Derive issueDay / issueMonth from the request's created_at (or today) ──
  const issueDate  = request?.created_at ? new Date(request.created_at) : new Date();
  const issueDay   = toOrdinal(issueDate.getDate());
  const issueMonth = issueDate.toLocaleDateString('en-US', { month: 'long' });


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

      {/* ── Document rendered via reusable certificate components ────────── */}
      {/* The printRef div is what gets captured by html2canvas */}
      <div ref={printRef} className="max-w-[900px] mx-auto">
        {serviceType === 'Certificate of Indigency' ? (
          <CertificateOfIndigency
            residentName={residentName}
            age={age}
            birthdate={birthdate}
            address={address}
            requestor={requestor}
            purpose={purpose}
            issueDay={issueDay}
            issueMonth={issueMonth}
          />
        ) : serviceType === 'Certificate of Residency' ? (
          <CertificateOfResidency
            residentName={residentName}
            civilStatus={civilStatus}
            birthdate={birthdate}
            address={address}
            yearsOfResidency={yearsOfResidency}
            purpose={purpose}
            issueDay={issueDay}
            issueMonth={issueMonth}
          />
        ) : (
          /* Barangay Clearance (default) — also covers Business Permit,
             Health Services, Disaster Response, and any unknown types */
          <AlternativeClearance
            residentName={residentName}
            address={address}
            purpose={purpose}
            yearsOfResidency={yearsOfResidency}
            issueDay={issueDay}
            issueMonth={issueMonth}
          />
        )}
      </div>

      {/* ── Disclaimer below the doc ────────────────────────────────────── */}
      <p className="text-center text-xs text-gray-400 mt-6 max-w-[900px] mx-auto">
        <i className="fas fa-info-circle mr-1"></i>
        This preview matches the downloadable PDF. Ensure the resident's information is complete before downloading.
      </p>

    </div>
  );
}
