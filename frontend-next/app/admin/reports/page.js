'use client';
import {
  PieChart, Pie, Cell, Tooltip, ResponsiveContainer,
  BarChart, Bar, XAxis, YAxis, CartesianGrid
} from 'recharts';
import { useState, useEffect } from 'react';
import OfficialReportDocument from '@/components/OfficialReportDocument';

// ── Constants ───────────────────────────────────────────────────
const URGENCY_COLORS = { High: '#ef4444', Medium: '#f59e0b', Low: '#22c55e', Critical: '#7c3aed' };
const RANGE_OPTIONS = [
  { value: '3_days',   label: 'Last 3 Days' },
  { value: '7_days',   label: 'Last 7 Days' },
  { value: '1_month',  label: 'Last Month' },
  { value: '3_months', label: 'Last 3 Months' },
  { value: '6_months', label: 'Last 6 Months' },
  { value: '1_year',   label: 'Last Year' },
];

// ── Helpers ─────────────────────────────────────────────────────
const statusStyle = (status) => {
  if (status === 'Resolved')  return 'bg-green-100 text-green-700';
  if (status === 'On-Going')  return 'bg-blue-100  text-blue-700';
  return 'bg-yellow-100 text-yellow-700';
};

const CustomDonutLabel = ({ cx, cy, total }) => (
  <>
    <text x={cx} y={cy - 8}  textAnchor="middle" className="fill-gray-800" style={{ fontSize: 26, fontWeight: 700 }}>{total}</text>
    <text x={cx} y={cy + 14} textAnchor="middle" className="fill-gray-400" style={{ fontSize: 12 }}>Total</text>
  </>
);

// ── Stat Card ────────────────────────────────────────────────────
function StatCard({ icon, iconBg, iconColor, label, value, sub }) {
  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 flex items-center gap-4">
      <div className={`w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0 ${iconBg}`}>
        <i className={`${icon} text-xl ${iconColor}`}></i>
      </div>
      <div>
        <p className="text-xs text-gray-500 font-semibold uppercase tracking-wider mb-0.5">{label}</p>
        <p className="text-2xl font-black text-gray-900">{value}</p>
        {sub && <p className="text-xs text-gray-400 mt-0.5">{sub}</p>}
      </div>
    </div>
  );
}

// ── Main Page ────────────────────────────────────────────────────
export default function ReportsPage() {
  const [range,             setRange]             = useState('1_year');
  const [data,              setData]              = useState(null);
  const [loading,           setLoading]           = useState(true);
  const [showPreviewModal,  setShowPreviewModal]  = useState(false);

  // Lazy Initializers for Client Session Metadata
  const [adminName] = useState(() => {
    if (typeof window === 'undefined') return 'Administrator';
    try {
      const a = JSON.parse(localStorage.getItem('admin') || '{}');
      return a.full_name || a.username || 'Administrator';
    } catch {
      return 'Administrator';
    }
  });

  const [adminRole] = useState(() => {
    if (typeof window === 'undefined') return 'Administrator';
    try {
      const a = JSON.parse(localStorage.getItem('admin') || '{}');
      return a.role || 'Administrator';
    } catch {
      return 'Administrator';
    }
  });

  const [generatedDate] = useState(() => {
    if (typeof window === 'undefined') return '';
    return new Date().toLocaleString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      hour12: true
    });
  });

  const [controlNo] = useState(() => {
    if (typeof window === 'undefined') return 'BPR-OFFICIAL';
    return `BPR-${new Date().getFullYear()}-${Math.floor(10000 + Math.random() * 90000)}`;
  });

  // Fetch Analytics without triggering setState in effect body
  useEffect(() => {
    let isCancelled = false;

    async function loadAnalytics() {
      try {
        const token = localStorage.getItem('token');
        const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/dashboard/analytics?range=${range}`, {
          headers: { 'Authorization': `Bearer ${token}` }
        });
        if (res.ok) {
          const json = await res.json();
          if (!isCancelled) {
            setData(json);
          }
        }
      } catch (err) {
        console.error('Failed to fetch analytics:', err);
      } finally {
        if (!isCancelled) {
          setLoading(false);
        }
      }
    }

    loadAnalytics();

    return () => {
      isCancelled = true;
    };
  }, [range]);

  // ── Derived chart data ──
  const urgencyData = (data?.urgency || []).map(u => ({
    name: u.urgency_level || 'Unknown',
    value: u.count,
    color: URGENCY_COLORS[u.urgency_level] || '#94a3b8',
  }));

  const categoryData = (data?.categories || []).map(c => ({
    category: c.category || 'Uncategorized',
    count: c.count,
  }));

  const urgencyTotal    = urgencyData.reduce((s, d) => s + d.value, 0);
  const totalComplaints = data?.total_complaints || 0;
  const resolvedCount   = data?.resolved_complaints || 0;
  const resolvedPct     = data?.resolution_rate || 0;
  const pendingPct      = 100 - resolvedPct;
  const recentList      = data?.recent || [];

  const rangeLabel = RANGE_OPTIONS.find(r => r.value === range)?.label || 'Selected period';

  // ── CSV Export Handler ──
  const exportToCSV = () => {
    if (!data) return;

    const lines = [];
    lines.push(['REPUBLIC OF THE PHILIPPINES']);
    lines.push(['CITY OF QUEZON - BARANGAY PINYAHAN']);
    lines.push(['OFFICIAL COMPLAINT & INCIDENT ANALYTICS REPORT']);
    lines.push([]);
    lines.push(['Reporting Period:', rangeLabel]);
    lines.push(['Date Generated:', generatedDate || new Date().toLocaleString()]);
    lines.push(['Prepared By:', `${adminName} (${adminRole})`]);
    lines.push(['Control Number:', controlNo]);
    lines.push([]);
    lines.push(['I. EXECUTIVE SUMMARY & KPIS']);
    lines.push(['Metric', 'Value', 'Details']);
    lines.push(['Total Complaints Filed', totalComplaints, `Covering ${rangeLabel}`]);
    lines.push(['Resolved Cases', resolvedCount, `${resolvedPct}% Resolution Rate`]);
    lines.push(['Active / Pending Cases', totalComplaints - resolvedCount, `${pendingPct}% Pending`]);
    lines.push(['Resolution Efficiency', `${resolvedPct}%`, 'Overall Resolution Rate']);
    lines.push(['Published News Advisories', data.total_news || 0, 'Public announcements']);
    lines.push(['Community Events Scheduled', data.total_events || 0, 'Barangay activities']);
    lines.push([]);
    lines.push(['II. URGENCY CLASSIFICATION BREAKDOWN']);
    lines.push(['Priority Level', 'Case Count', 'Share (%)']);
    urgencyData.forEach((u) => {
      const pct = urgencyTotal > 0 ? Math.round((u.value / urgencyTotal) * 100) : 0;
      lines.push([u.name, u.value, `${pct}%`]);
    });
    lines.push(['Total', urgencyTotal, '100%']);
    lines.push([]);
    lines.push(['III. COMPLAINTS BY CATEGORY BREAKDOWN']);
    lines.push(['Category', 'Reported Cases', 'Share (%)']);
    categoryData.forEach((c) => {
      const pct = totalComplaints > 0 ? Math.round((c.count / totalComplaints) * 100) : 0;
      lines.push([c.category, c.count, `${pct}%`]);
    });
    lines.push(['Total', totalComplaints, '100%']);
    lines.push([]);
    lines.push(['IV. RECENT COMPLAINTS & INCIDENT RECORDS']);
    lines.push(['Ref No.', 'Date Filed', 'Complainant', 'Category', 'Urgency', 'Status']);
    recentList.forEach((c) => {
      const d = c.submitted_at ? new Date(c.submitted_at).toLocaleDateString('en-US') : '—';
      lines.push([
        c.ref_no || `BRGY-${c.id}`,
        d,
        c.full_name || 'Anonymous Resident',
        c.category || c.complaint_type || 'General',
        c.urgency_level || 'Normal',
        c.status || 'Pending'
      ]);
    });
    lines.push([]);
    lines.push(['V. SIGNATORIES']);
    lines.push(['Prepared By:', adminName, `${adminRole} / Records Officer`]);
    lines.push(['Attested & Approved By:', 'HON. RICARDO A. VILLAFLOR, MPA', 'Punong Barangay']);

    const csvContent = lines
      .map(row => row.map(val => `"${String(val).replace(/"/g, '""')}"`).join(','))
      .join('\r\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `Barangay_Pinyahan_Report_${range}_${new Date().toISOString().slice(0, 10)}.csv`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="relative print:static print:overflow-visible">
      {/* ── Global Print Styles: Enforce Clean In-Flow Official Letterhead Output ── */}
      <style dangerouslySetInnerHTML={{__html: `
        @media print {
          @page {
            size: A4 portrait;
            margin: 10mm 12mm;
          }
          html, body, main, div {
            overflow: visible !important;
            height: auto !important;
          }
          body {
            background-color: #ffffff !important;
            print-color-adjust: exact !important;
            -webkit-print-color-adjust: exact !important;
          }
          .print\\:hidden, aside, header, nav {
            display: none !important;
          }
          #official-printable-section {
            display: block !important;
            position: static !important;
            width: 100% !important;
            margin: 0 !important;
            padding: 0 !important;
            visibility: visible !important;
          }
          .page-break-inside-avoid {
            break-inside: avoid !important;
            page-break-inside: avoid !important;
          }
          .break-before-page {
            break-before: page !important;
            page-break-before: always !important;
          }
        }
      `}} />

      {/* ═══════════════════════════════════════════════════════════
          SCREEN VIEW: Interactive Analytics Dashboard (Hidden when printing)
      ═══════════════════════════════════════════════════════════ */}
      <div className="p-6 md:p-8 max-w-7xl mx-auto print:hidden">

        {/* ── Header & Action Controls ── */}
        <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-4 mb-8">
          <div>
            <h1 className="text-2xl font-black text-[#002B5B] flex items-center gap-2.5 uppercase tracking-wide">
              <i className="fas fa-chart-bar text-[#0056b3]"></i> Reports &amp; Analytics
            </h1>
            <p className="text-sm text-gray-500 mt-1">Barangay Pinyahan Incident &amp; Performance Evaluation</p>
          </div>

          <div className="flex flex-wrap items-center gap-2.5">
            {/* Time Range Filter */}
            <select
              value={range}
              onChange={(e) => {
                setLoading(true);
                setRange(e.target.value);
              }}
              className="border border-gray-300 rounded-xl px-4 py-2.5 text-sm text-gray-700 bg-white focus:outline-none focus:ring-2 focus:ring-blue-200 font-semibold shadow-xs"
            >
              {RANGE_OPTIONS.map(opt => (
                <option key={opt.value} value={opt.value}>{opt.label}</option>
              ))}
            </select>

            {/* Preview Official Letterhead Modal Button */}
            <button
              type="button"
              onClick={() => setShowPreviewModal(true)}
              className="bg-white hover:bg-gray-50 text-gray-700 border border-gray-300 px-4 py-2.5 rounded-xl font-bold text-sm flex items-center gap-2 transition-all shadow-xs"
              title="Preview Official Barangay Letterhead Report"
            >
              <i className="fas fa-eye text-[#0056b3]"></i>
              <span>Preview Official Report</span>
            </button>

            {/* Export CSV Spreadsheet Button */}
            <button
              type="button"
              onClick={exportToCSV}
              className="bg-emerald-600 hover:bg-emerald-700 text-white px-4 py-2.5 rounded-xl font-bold text-sm flex items-center gap-2 transition-all shadow-xs"
              title="Download CSV spreadsheet dataset"
            >
              <i className="fas fa-file-csv"></i>
              <span>Export CSV</span>
            </button>

            {/* Download Official PDF (Triggers Print to PDF) */}
            <button
              type="button"
              onClick={() => window.print()}
              className="bg-[#0056b3] hover:bg-blue-800 text-white px-5 py-2.5 rounded-xl font-bold text-sm flex items-center gap-2 transition-all shadow-sm hover:shadow-md"
              title="Download Official PDF Report"
            >
              <i className="fas fa-file-pdf"></i>
              <span>Download PDF</span>
            </button>
          </div>
        </div>

        {/* ── Loading State ── */}
        {loading && (
          <div className="flex items-center justify-center py-24">
            <div className="text-center">
              <i className="fas fa-spinner fa-spin text-3xl text-[#0056b3] mb-3"></i>
              <p className="text-sm text-gray-500 font-semibold">Loading analytics records...</p>
            </div>
          </div>
        )}

        {!loading && data && (
          <div className="space-y-8">

            {/* ── Section 1: Quick Stat Cards ── */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
              <StatCard icon="fas fa-exclamation-circle" iconBg="bg-red-50"    iconColor="text-red-500"   label="Total Complaints" value={totalComplaints}    sub={rangeLabel} />
              <StatCard icon="fas fa-check-circle"       iconBg="bg-green-50"  iconColor="text-green-600" label="Resolved Cases"   value={resolvedCount}      sub={`${resolvedPct}% resolution rate`} />
              <StatCard icon="fas fa-newspaper"          iconBg="bg-blue-50"   iconColor="text-blue-600"  label="Published News"   value={data.total_news}    sub="Official advisories" />
              <StatCard icon="fas fa-calendar-check"     iconBg="bg-purple-50" iconColor="text-purple-600" label="Total Events"    value={data.total_events}  sub="Community programs" />
            </div>

            {/* ── Section 2: Urgency & Resolution ── */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">

              {/* Donut Chart – Urgency */}
              <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6">
                <h2 className="text-sm font-black text-gray-800 uppercase tracking-wide mb-4 flex items-center gap-2">
                  <i className="fas fa-brain text-[#0056b3]"></i> AI Urgency Classification
                </h2>
                {urgencyData.length > 0 ? (
                  <div className="flex flex-col sm:flex-row items-center gap-6">
                    <ResponsiveContainer width={200} height={200}>
                      <PieChart>
                        <Pie
                          data={urgencyData}
                          cx="50%"
                          cy="50%"
                          innerRadius={62}
                          outerRadius={88}
                          paddingAngle={3}
                          dataKey="value"
                          labelLine={false}
                        >
                          {urgencyData.map((entry, idx) => (
                            <Cell key={idx} fill={entry.color} />
                          ))}
                        </Pie>
                        <Tooltip
                          formatter={(val, name) => [`${val} cases`, name]}
                          contentStyle={{ backgroundColor: '#ffffff', borderColor: '#e5e7eb', borderRadius: '8px', color: '#111827' }}
                          itemStyle={{ color: '#111827' }}
                          labelStyle={{ color: '#111827' }}
                        />
                        <CustomDonutLabel cx={100} cy={100} total={urgencyTotal} />
                      </PieChart>
                    </ResponsiveContainer>

                    {/* Legend */}
                    <div className="flex flex-col gap-4 flex-1 w-full">
                      {urgencyData.map((d) => (
                        <div key={d.name} className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <span className="w-3 h-3 rounded-full flex-shrink-0" style={{ backgroundColor: d.color }}></span>
                            <span className="text-sm font-semibold text-gray-700">{d.name} Priority</span>
                          </div>
                          <div className="flex items-center gap-3">
                            <div className="w-24 h-2 bg-gray-100 rounded-full overflow-hidden">
                              <div
                                className="h-2 rounded-full"
                                style={{ width: `${urgencyTotal > 0 ? Math.round((d.value / urgencyTotal) * 100) : 0}%`, backgroundColor: d.color }}
                              ></div>
                            </div>
                            <span className="text-sm font-black text-gray-800 w-6 text-right">{d.value}</span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                ) : (
                  <p className="text-center text-gray-400 py-8 text-sm">No urgency data for this period.</p>
                )}
              </div>

              {/* Resolution Rate */}
              <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6">
                <h2 className="text-sm font-black text-gray-800 uppercase tracking-wide mb-4 flex items-center gap-2">
                  <i className="fas fa-tasks text-[#0056b3]"></i> Resolution Rate
                </h2>

                {/* Big Percentage */}
                <div className="flex items-end gap-3 mb-6">
                  <span className="text-5xl font-black text-green-600">{resolvedPct}%</span>
                  <span className="text-sm text-gray-400 mb-2">of complaints resolved</span>
                </div>

                {/* Stacked bar */}
                <div className="w-full h-4 rounded-full bg-gray-100 overflow-hidden flex mb-4">
                  <div className="h-full bg-green-500 rounded-l-full transition-all" style={{ width: `${resolvedPct}%` }}></div>
                  <div className="h-full bg-yellow-400 rounded-r-full transition-all" style={{ width: `${pendingPct}%` }}></div>
                </div>

                {/* Breakdown rows */}
                <div className="space-y-4 mt-4">
                  {[
                    { label: 'Resolved',        value: resolvedCount,                   pct: resolvedPct, color: 'bg-green-500',  textColor: 'text-green-700',  badgeBg: 'bg-green-50' },
                    { label: 'Pending / Active', value: totalComplaints - resolvedCount, pct: pendingPct,  color: 'bg-yellow-400', textColor: 'text-yellow-700', badgeBg: 'bg-yellow-50' },
                  ].map((row) => (
                    <div key={row.label} className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <span className={`w-3 h-3 rounded-full ${row.color}`}></span>
                        <span className="text-sm font-semibold text-gray-700">{row.label}</span>
                      </div>
                      <div className="flex items-center gap-3">
                        <span className={`text-xs font-bold px-2 py-0.5 rounded-full ${row.badgeBg} ${row.textColor}`}>{row.pct}%</span>
                        <span className="text-sm font-black text-gray-800 w-8 text-right">{row.value}</span>
                      </div>
                    </div>
                  ))}
                </div>

                {/* Divider + Total */}
                <div className="mt-5 pt-4 border-t border-gray-100 flex justify-between text-xs text-gray-400">
                  <span>Total complaints tracked ({rangeLabel.toLowerCase()})</span>
                  <span className="font-black text-gray-700">{totalComplaints}</span>
                </div>
              </div>
            </div>

            {/* ── Section 3: Categories & Top Complaints ── */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">

              {/* Bar Chart – Complaints by Category */}
              <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6">
                <h2 className="text-sm font-black text-gray-800 uppercase tracking-wide mb-6 flex items-center gap-2">
                  <i className="fas fa-tag text-[#0056b3]"></i> Complaints by Category
                </h2>
                {categoryData.length > 0 ? (
                  <ResponsiveContainer width="100%" height={Math.max(260, categoryData.length * 36)}>
                    <BarChart
                      layout="vertical"
                      data={categoryData}
                      margin={{ top: 5, right: 30, left: 10, bottom: 5 }}
                    >
                      <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#f0f0f0" />
                      <XAxis 
                        type="number" 
                        tick={{ fontSize: 11, fill: '#6b7280' }} 
                        allowDecimals={false} 
                        axisLine={false}
                        tickLine={false}
                      />
                      <YAxis
                        type="category"
                        dataKey="category"
                        width={150}
                        interval={0}
                        tick={{ fontSize: 11, fill: '#374151', fontWeight: 600 }}
                        axisLine={false}
                        tickLine={false}
                      />
                      <Tooltip
                        cursor={{ fill: '#f0f6ff' }}
                        contentStyle={{ 
                          fontSize: 12, 
                          borderRadius: 8, 
                          border: '1px solid #e5e7eb', 
                          backgroundColor: '#ffffff', 
                          color: '#111827' 
                        }}
                        formatter={(val) => [`${val} complaints`, 'Count']}
                      />
                      <Bar dataKey="count" fill="#0056b3" radius={[0, 6, 6, 0]} barSize={18} />
                    </BarChart>
                  </ResponsiveContainer>
                ) : (
                  <p className="text-center text-gray-400 py-8 text-sm">No category data for this period.</p>
                )}
              </div>

              {/* Top Recent Complaints */}
              <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6">
                <div className="flex items-center justify-between mb-5">
                  <h2 className="text-sm font-black text-gray-800 uppercase tracking-wide flex items-center gap-2">
                    <i className="fas fa-list-ol text-[#0056b3]"></i> Recent Complaints Record
                  </h2>
                  <span className="text-xs font-semibold text-gray-400">{rangeLabel}</span>
                </div>

                {recentList.length > 0 ? (
                  <div className="space-y-3">
                    {recentList.map((c, idx) => {
                      const dateStr = new Date(c.submitted_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
                      return (
                        <div key={c.id} className="flex items-start gap-3 p-3 rounded-xl bg-gray-50 border border-gray-100 hover:border-gray-200 transition-colors">
                          <span className="w-6 h-6 rounded-full bg-[#0056b3] text-white text-xs font-black flex items-center justify-center flex-shrink-0 mt-0.5">
                            {idx + 1}
                          </span>
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-semibold text-gray-800 truncate">{c.category || c.complaint_type} — {c.full_name}</p>
                            <p className="text-xs text-gray-400 mt-0.5">{dateStr} · {c.ref_no}</p>
                          </div>
                          <span className={`text-xs font-bold px-2.5 py-0.5 rounded-full flex-shrink-0 ${statusStyle(c.status)}`}>
                            {c.status}
                          </span>
                        </div>
                      );
                    })}
                  </div>
                ) : (
                  <p className="text-center text-gray-400 py-8 text-sm">No complaints in this period.</p>
                )}
              </div>

            </div>

          </div>
        )}
      </div>

      {/* ═══════════════════════════════════════════════════════════
          OFFICIAL REPORT PREVIEW MODAL (Screen Interactive Preview)
      ═══════════════════════════════════════════════════════════ */}
      {showPreviewModal && data && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4 overflow-y-auto print:hidden">
          <div className="bg-white rounded-2xl shadow-2xl max-w-5xl w-full max-h-[92vh] flex flex-col overflow-hidden animate-in fade-in duration-200">
            {/* Modal Header */}
            <div className="px-6 py-4 bg-[#002B5B] text-white flex items-center justify-between shrink-0">
              <div className="flex items-center gap-3">
                <i className="fas fa-file-alt text-xl text-amber-400" />
                <div>
                  <h3 className="font-bold text-base">Official Barangay Report Document Preview</h3>
                  <p className="text-xs text-white/70">Official Letterhead format ready for PDF export or printing</p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <button
                  type="button"
                  onClick={() => {
                    setShowPreviewModal(false);
                    setTimeout(() => window.print(), 150);
                  }}
                  className="bg-[#0056b3] hover:bg-blue-700 text-white font-bold text-xs px-4 py-2 rounded-xl flex items-center gap-2 transition-colors shadow-sm"
                >
                  <i className="fas fa-print" />
                  <span>Print / Save as PDF</span>
                </button>
                <button
                  type="button"
                  onClick={() => setShowPreviewModal(false)}
                  className="w-8 h-8 rounded-full bg-white/10 hover:bg-white/20 text-white flex items-center justify-center transition-colors"
                >
                  <i className="fas fa-times text-sm" />
                </button>
              </div>
            </div>

            {/* Modal Body: Scaled Official Document */}
            <div className="p-6 md:p-8 overflow-y-auto bg-gray-100 flex justify-center">
              <div className="bg-white shadow-xl rounded-lg border border-gray-200 max-w-4xl w-full">
                <OfficialReportDocument
                  data={data}
                  rangeLabel={rangeLabel}
                  adminName={adminName}
                  adminRole={adminRole}
                  generatedAt={generatedDate}
                  controlNo={controlNo}
                />
              </div>
            </div>

            {/* Modal Footer */}
            <div className="px-6 py-3.5 bg-gray-50 border-t border-gray-200 flex items-center justify-between text-xs text-gray-500 shrink-0">
              <span>Paper Size: Standard A4 • Document includes official Quezon City &amp; Barangay seals</span>
              <button
                type="button"
                onClick={() => setShowPreviewModal(false)}
                className="px-4 py-1.5 rounded-lg border border-gray-300 text-gray-700 font-semibold hover:bg-gray-100 transition-colors"
              >
                Close Preview
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ═══════════════════════════════════════════════════════════
          OFFICIAL PRINT DOCUMENT (Targeted by @media print)
      ═══════════════════════════════════════════════════════════ */}
      <div id="official-printable-section" className="hidden print:block w-full bg-white">
        <OfficialReportDocument
          data={data}
          rangeLabel={rangeLabel}
          adminName={adminName}
          adminRole={adminRole}
          generatedAt={generatedDate}
          controlNo={controlNo}
        />
      </div>

    </div>
  );
}
