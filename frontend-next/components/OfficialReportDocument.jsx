/* eslint-disable @next/next/no-img-element */
'use client';

import React from 'react';

// Status badge styling for the official table
const statusBadge = (status) => {
  if (status === 'Resolved') return 'bg-green-100 text-green-800 border-green-300';
  if (status === 'On-Going') return 'bg-blue-100 text-blue-800 border-blue-300';
  return 'bg-amber-100 text-amber-800 border-amber-300';
};

// Urgency badge styling for the official table
const urgencyBadge = (urgency) => {
  if (urgency === 'Critical') return 'bg-purple-100 text-purple-800 border-purple-300';
  if (urgency === 'High') return 'bg-red-100 text-red-800 border-red-300';
  if (urgency === 'Medium') return 'bg-amber-100 text-amber-800 border-amber-300';
  return 'bg-green-100 text-green-800 border-green-300';
};

export default function OfficialReportDocument({
  data,
  rangeLabel = 'Selected Period',
  adminName = 'Administrator',
  adminRole = 'Administrator',
  generatedAt = '',
  controlNo = 'BPR-OFFICIAL'
}) {
  if (!data) return null;

  const totalComplaints = data.total_complaints || 0;
  const resolvedCount   = data.resolved_complaints || 0;
  const resolvedPct     = data.resolution_rate || 0;
  const pendingCount    = Math.max(0, totalComplaints - resolvedCount);
  const pendingPct      = 100 - resolvedPct;

  const urgencyList = data.urgency || [];
  const urgencyTotal = urgencyList.reduce((s, u) => s + (u.count || 0), 0);

  const categoryList = data.categories || [];
  const categoryTotal = categoryList.reduce((s, c) => s + (c.count || 0), 0);

  const recentList = data.recent || [];

  return (
    <div className="bg-white text-gray-900 p-8 md:p-12 max-w-4xl mx-auto shadow-none font-sans text-xs md:text-sm print:p-0 print:max-w-none">
      
      {/* ═══════════════════════════════════════════════════════════
          OFFICIAL BARANGAY LETTERHEAD
      ═══════════════════════════════════════════════════════════ */}
      <div className="border-b-2 border-[#002B5B] pb-2 mb-3">
        <div className="flex items-center justify-between gap-4">
          {/* Left Seal: Quezon City Logo */}
          <div className="w-16 h-16 flex-shrink-0 flex items-center justify-center">
            <img
              src="/images/Quezon_City_logo.svg"
              alt="Quezon City Official Seal"
              className="w-16 h-16 object-contain"
            />
          </div>

          {/* Center Text: Official Republic & Barangay Hierarchy */}
          <div className="text-center flex-1">
            <p className="text-[10px] uppercase tracking-widest text-gray-600 font-semibold mb-0.5">
              Republic of the Philippines
            </p>
            <p className="text-[11px] uppercase tracking-wider text-gray-800 font-bold mb-0.5">
              National Capital Region • Quezon City
            </p>
            <h1 className="text-base md:text-lg font-black text-[#002B5B] tracking-wide uppercase mb-0.5">
              BARANGAY PINYAHAN
            </h1>
            <p className="text-[11px] font-bold text-[#0056b3] uppercase tracking-wider">
              OFFICE OF THE PUNONG BARANGAY
            </p>
            <p className="text-[9px] text-gray-500 mt-0.5">
              Barangay Hall, Malakas St. cor. Mapagkumbaba St., Diliman, Quezon City
            </p>
          </div>

          {/* Right Seal: Barangay Pinyahan Official Seal */}
          <div className="w-16 h-16 flex-shrink-0 flex items-center justify-center">
            <img
              src="/images/Brgy._Pinyahan_Seal.png"
              alt="Barangay Pinyahan Seal"
              className="w-16 h-16 object-contain"
            />
          </div>
        </div>

        {/* Decorative Dual Accent Bar */}
        <div className="mt-2 flex items-center gap-1">
          <div className="h-1 bg-[#002B5B] flex-1"></div>
          <div className="h-1 bg-[#f59e0b] w-24"></div>
        </div>
      </div>

      {/* ═══════════════════════════════════════════════════════════
          REPORT TITLE & CONTROL METADATA
      ═══════════════════════════════════════════════════════════ */}
      <div className="mb-4">
        <div className="text-center mb-2.5">
          <h2 className="text-sm md:text-base font-black text-gray-900 uppercase tracking-wide">
            OFFICIAL COMPLAINT &amp; INCIDENT ANALYTICS REPORT
          </h2>
          <p className="text-[11px] text-gray-500 font-medium italic mt-0.5">
            Statistical Summary and Incident Performance Evaluation
          </p>
        </div>

        {/* Metadata Grid */}
        <div className="grid grid-cols-4 gap-2 bg-gray-50 border border-gray-200 rounded-lg p-2.5 mb-4 text-xs">
          <div>
            <span className="text-[9px] font-bold text-gray-400 uppercase tracking-wider block">
              Reporting Period
            </span>
            <span className="font-extrabold text-gray-800 text-[11px]">{rangeLabel}</span>
          </div>
          <div>
            <span className="text-[9px] font-bold text-gray-400 uppercase tracking-wider block">
              Date &amp; Time Generated
            </span>
            <span className="font-extrabold text-gray-800 text-[11px]">{generatedAt || '—'}</span>
          </div>
          <div>
            <span className="text-[9px] font-bold text-gray-400 uppercase tracking-wider block">
              Prepared By
            </span>
            <span className="font-extrabold text-gray-800 text-[11px] truncate block" title={adminName}>
              {adminName}
            </span>
            <span className="text-[9px] text-gray-500 block">{adminRole}</span>
          </div>
          <div>
            <span className="text-[9px] font-bold text-gray-400 uppercase tracking-wider block">
              Document Control No.
            </span>
            <span className="font-mono font-bold text-[11px] text-[#0056b3]">
              {controlNo}
            </span>
          </div>
        </div>
      </div>

      {/* ═══════════════════════════════════════════════════════════
          SECTION 1: KEY PERFORMANCE INDICATORS (KPIs)
      ═══════════════════════════════════════════════════════════ */}
      <div className="mb-4 page-break-inside-avoid">
        <h3 className="text-xs font-black text-[#002B5B] uppercase tracking-wider pb-1 mb-2 border-b border-gray-200 flex items-center justify-between">
          <span>I. Executive Summary &amp; Key Performance Indicators</span>
          <span className="text-[10px] font-normal text-gray-500">Official Metrics</span>
        </h3>

        <div className="grid grid-cols-3 gap-2.5 mb-4">
          <div className="border border-gray-200 rounded-lg p-2.5 bg-white">
            <span className="text-[9px] font-bold text-gray-400 uppercase tracking-wider block">Total Complaints</span>
            <div className="flex items-baseline gap-1.5 mt-0.5">
              <span className="text-xl font-black text-gray-900">{totalComplaints}</span>
              <span className="text-[10px] text-gray-500 font-medium">cases</span>
            </div>
            <p className="text-[9px] text-gray-400 mt-0.5">Covering {rangeLabel.toLowerCase()}</p>
          </div>

          <div className="border border-green-200 rounded-lg p-2.5 bg-green-50/40">
            <span className="text-[9px] font-bold text-green-700 uppercase tracking-wider block">Resolved Cases</span>
            <div className="flex items-baseline gap-1.5 mt-0.5">
              <span className="text-xl font-black text-green-700">{resolvedCount}</span>
              <span className="text-[10px] font-bold text-green-600">({resolvedPct}%)</span>
            </div>
            <p className="text-[9px] text-green-600/80 mt-0.5">Successfully concluded</p>
          </div>

          <div className="border border-amber-200 rounded-lg p-2.5 bg-amber-50/40">
            <span className="text-[9px] font-bold text-amber-700 uppercase tracking-wider block">Active / Pending</span>
            <div className="flex items-baseline gap-1.5 mt-0.5">
              <span className="text-xl font-black text-amber-700">{pendingCount}</span>
              <span className="text-[10px] font-bold text-amber-600">({pendingPct}%)</span>
            </div>
            <p className="text-[9px] text-amber-600/80 mt-0.5">In progress / evaluation</p>
          </div>

          <div className="border border-blue-200 rounded-lg p-2.5 bg-blue-50/40">
            <span className="text-[9px] font-bold text-blue-700 uppercase tracking-wider block">Resolution Efficiency</span>
            <div className="flex items-baseline gap-1.5 mt-0.5">
              <span className="text-xl font-black text-[#0056b3]">{resolvedPct}%</span>
            </div>
            <p className="text-[9px] text-blue-600/80 mt-0.5">Total resolution rate</p>
          </div>

          <div className="border border-gray-200 rounded-lg p-2.5 bg-white">
            <span className="text-[9px] font-bold text-gray-400 uppercase tracking-wider block">Published News</span>
            <div className="flex items-baseline gap-1.5 mt-0.5">
              <span className="text-xl font-black text-gray-900">{data.total_news || 0}</span>
              <span className="text-[10px] text-gray-500 font-medium">advisories</span>
            </div>
            <p className="text-[9px] text-gray-400 mt-0.5">Public announcements</p>
          </div>

          <div className="border border-gray-200 rounded-lg p-2.5 bg-white">
            <span className="text-[9px] font-bold text-gray-400 uppercase tracking-wider block">Community Events</span>
            <div className="flex items-baseline gap-1.5 mt-0.5">
              <span className="text-xl font-black text-gray-900">{data.total_events || 0}</span>
              <span className="text-[10px] text-gray-500 font-medium">activities</span>
            </div>
            <p className="text-[9px] text-gray-400 mt-0.5">Barangay programs</p>
          </div>
        </div>
      </div>

      {/* ═══════════════════════════════════════════════════════════
          SECTION 2 & 3: URGENCY & CATEGORY SUMMARY TABLES
      ═══════════════════════════════════════════════════════════ */}
      <div className="grid grid-cols-2 gap-4 mb-4 page-break-inside-avoid">
        {/* Urgency Classification Table */}
        <div>
          <h3 className="text-xs font-black text-[#002B5B] uppercase tracking-wider pb-1 mb-2 border-b border-gray-200 flex items-center justify-between">
            <span>II. Urgency Classification</span>
            <span className="text-[9px] font-normal text-gray-500">AI Priority</span>
          </h3>

          <table className="w-full text-left border-collapse border border-gray-200 rounded-lg overflow-hidden text-xs">
            <thead>
              <tr className="bg-[#002B5B] text-white">
                <th className="py-1.5 px-2.5 font-bold">Priority Level</th>
                <th className="py-1.5 px-2.5 font-bold text-center">Cases</th>
                <th className="py-1.5 px-2.5 font-bold text-right">Share (%)</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200 bg-white">
              {urgencyList.length > 0 ? (
                urgencyList.map((u, i) => {
                  const pct = urgencyTotal > 0 ? Math.round((u.count / urgencyTotal) * 100) : 0;
                  return (
                    <tr key={i} className="hover:bg-gray-50">
                      <td className="py-1.5 px-2.5 font-semibold text-gray-800 flex items-center gap-1.5">
                        <span className={`w-2 h-2 rounded-full ${
                          u.urgency_level === 'Critical' ? 'bg-purple-600' :
                          u.urgency_level === 'High' ? 'bg-red-500' :
                          u.urgency_level === 'Medium' ? 'bg-amber-500' : 'bg-green-500'
                        }`} />
                        <span>{u.urgency_level || 'General'}</span>
                      </td>
                      <td className="py-1.5 px-2.5 text-center font-bold text-gray-900">{u.count}</td>
                      <td className="py-1.5 px-2.5 text-right font-medium text-gray-600">{pct}%</td>
                    </tr>
                  );
                })
              ) : (
                <tr>
                  <td colSpan={3} className="py-2 px-2.5 text-center text-gray-400 italic">
                    No urgency records for this period.
                  </td>
                </tr>
              )}
            </tbody>
            {urgencyList.length > 0 && (
              <tfoot>
                <tr className="bg-gray-50 font-bold border-t-2 border-gray-200 text-gray-900">
                  <td className="py-1.5 px-2.5">Total Processed</td>
                  <td className="py-1.5 px-2.5 text-center">{urgencyTotal}</td>
                  <td className="py-1.5 px-2.5 text-right">100%</td>
                </tr>
              </tfoot>
            )}
          </table>
        </div>

        {/* Complaints by Category Table */}
        <div>
          <h3 className="text-xs font-black text-[#002B5B] uppercase tracking-wider pb-1 mb-2 border-b border-gray-200 flex items-center justify-between">
            <span>III. Breakdown by Category</span>
            <span className="text-[9px] font-normal text-gray-500">Distribution</span>
          </h3>

          <table className="w-full text-left border-collapse border border-gray-200 rounded-lg overflow-hidden text-xs">
            <thead>
              <tr className="bg-[#002B5B] text-white">
                <th className="py-1.5 px-2.5 font-bold">Category</th>
                <th className="py-1.5 px-2.5 font-bold text-center">Cases</th>
                <th className="py-1.5 px-2.5 font-bold text-right">Share (%)</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200 bg-white">
              {categoryList.length > 0 ? (
                categoryList.map((c, i) => {
                  const pct = totalComplaints > 0 ? Math.round((c.count / totalComplaints) * 100) : 0;
                  return (
                    <tr key={i} className="hover:bg-gray-50">
                      <td className="py-1.5 px-2.5 font-semibold text-gray-800">{c.category || 'Uncategorized'}</td>
                      <td className="py-1.5 px-2.5 text-center font-bold text-gray-900">{c.count}</td>
                      <td className="py-1.5 px-2.5 text-right font-medium text-gray-600">{pct}%</td>
                    </tr>
                  );
                })
              ) : (
                <tr>
                  <td colSpan={3} className="py-2 px-2.5 text-center text-gray-400 italic">
                    No category records for this period.
                  </td>
                </tr>
              )}
            </tbody>
            {categoryList.length > 0 && (
              <tfoot>
                <tr className="bg-gray-50 font-bold border-t-2 border-gray-200 text-gray-900">
                  <td className="py-1.5 px-2.5">Total Reported</td>
                  <td className="py-1.5 px-2.5 text-center">{categoryTotal}</td>
                  <td className="py-1.5 px-2.5 text-right">100%</td>
                </tr>
              </tfoot>
            )}
          </table>
        </div>
      </div>

      {/* ═══════════════════════════════════════════════════════════
          SECTION 4: RECENT COMPLAINTS RECORD LOG (Page 2 Start)
      ═══════════════════════════════════════════════════════════ */}
      <div className="mb-4 break-before-page print:break-before-page">
        <h3 className="text-xs font-black text-[#002B5B] uppercase tracking-wider pb-1 mb-2 border-b border-gray-200 flex items-center justify-between">
          <span>IV. Recent Complaints &amp; Incident Case Log</span>
          <span className="text-[10px] font-normal text-gray-500">Latest Records</span>
        </h3>

        <div className="border border-gray-200 rounded-lg overflow-hidden">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="bg-[#002B5B] text-white">
                <th className="py-2 px-3 font-bold">Ref No.</th>
                <th className="py-2 px-3 font-bold">Date Filed</th>
                <th className="py-2 px-3 font-bold">Complainant</th>
                <th className="py-2 px-3 font-bold">Category</th>
                <th className="py-2 px-3 font-bold text-center">Urgency</th>
                <th className="py-2 px-3 font-bold text-center">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200 bg-white">
              {recentList.length > 0 ? (
                recentList.map((c, idx) => {
                  const dateStr = c.submitted_at
                    ? new Date(c.submitted_at).toLocaleDateString('en-US', {
                        month: 'short',
                        day: 'numeric',
                        year: 'numeric'
                      })
                    : '—';

                  return (
                    <tr key={c.id || idx} className="hover:bg-gray-50">
                      <td className="py-2 px-3 font-mono font-bold text-[#0056b3]">{c.ref_no || `BRGY-${c.id}`}</td>
                      <td className="py-2 px-3 text-gray-600">{dateStr}</td>
                      <td className="py-2 px-3 font-medium text-gray-900">{c.full_name || 'Anonymous Resident'}</td>
                      <td className="py-2 px-3 text-gray-700">{c.category || c.complaint_type || 'General'}</td>
                      <td className="py-2 px-3 text-center">
                        <span className={`inline-block px-2 py-0.5 rounded text-[10px] font-bold border ${urgencyBadge(c.urgency_level)}`}>
                          {c.urgency_level || 'Normal'}
                        </span>
                      </td>
                      <td className="py-2 px-3 text-center">
                        <span className={`inline-block px-2 py-0.5 rounded text-[10px] font-bold border ${statusBadge(c.status)}`}>
                          {c.status || 'Pending'}
                        </span>
                      </td>
                    </tr>
                  );
                })
              ) : (
                <tr>
                  <td colSpan={6} className="py-3 px-3 text-center text-gray-400 italic">
                    No individual complaint records found for this period.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* ═══════════════════════════════════════════════════════════
          SECTION 5: OFFICIAL CERTIFICATION & SIGNATURES
      ═══════════════════════════════════════════════════════════ */}
      <div className="pt-5 border-t-2 border-gray-200 page-break-inside-avoid">
        <div className="grid grid-cols-2 gap-8 md:gap-16">
          {/* Prepared By: Admin */}
          <div>
            <p className="text-[11px] font-bold uppercase text-gray-500 tracking-wider mb-8">
              Prepared &amp; Verified By:
            </p>
            <div className="border-b border-gray-400 pb-1 mb-1">
              <p className="text-sm font-black text-gray-900 uppercase tracking-wide">
                {adminName}
              </p>
            </div>
            <p className="text-xs font-semibold text-gray-700">{adminRole} / Records Officer</p>
            <p className="text-[10px] text-gray-400">Barangay Pinyahan Management System</p>
          </div>

          {/* Attested By: Punong Barangay */}
          <div>
            <p className="text-[11px] font-bold uppercase text-gray-500 tracking-wider mb-8">
              Attested &amp; Approved By:
            </p>
            <div className="border-b border-gray-400 pb-1 mb-1">
              <p className="text-sm font-black text-[#002B5B] uppercase tracking-wide">
                HON. RICARDO A. VILLAFLOR, MPA
              </p>
            </div>
            <p className="text-xs font-semibold text-gray-700">Punong Barangay</p>
            <p className="text-[10px] text-gray-400">Barangay Pinyahan, Quezon City</p>
          </div>
        </div>

        {/* Official Legal Footer Disclaimer */}
        <div className="mt-6 pt-3 border-t border-gray-100 text-center text-[10px] text-gray-400 space-y-0.5">
          <p className="font-semibold text-gray-500">
            BARANGAY PINYAHAN • CITY GOVERNMENT OF QUEZON • METRO MANILA
          </p>
          <p>
            This official analytics document is computer-generated and verified from the Barangay Pinyahan Official Portal database.
          </p>
          <p>
            Valid for administrative auditing, transparency reporting, and official city presentation without physical erasure.
          </p>
        </div>
      </div>

    </div>
  );
}
