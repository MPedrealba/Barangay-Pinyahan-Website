'use client';
import {
  PieChart, Pie, Cell, Tooltip, ResponsiveContainer,
  BarChart, Bar, XAxis, YAxis, CartesianGrid
} from 'recharts';
import { useState, useEffect, useCallback } from 'react';

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
  const [range,   setRange]   = useState('1_year');
  const [data,    setData]    = useState(null);
  const [loading, setLoading] = useState(true);

  const fetchAnalytics = useCallback(async (selectedRange) => {
    setLoading(true);
    try {
      const token = localStorage.getItem('token');
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/dashboard/analytics?range=${selectedRange}`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (res.ok) {
        const json = await res.json();
        setData(json);
      }
    } catch (err) {
      console.error('Failed to fetch analytics:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchAnalytics(range);
  }, [range, fetchAnalytics]);

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

  return (
    <div id="report-printable-area" className="p-8 max-w-7xl mx-auto">

      {/* ── Print Styles ── */}
      <style dangerouslySetInnerHTML={{__html: `
        @media print {
          body * { visibility: hidden; }
          #report-printable-area, #report-printable-area * { visibility: visible; }
          #report-printable-area { position: absolute; left: 0; top: 0; width: 100%; padding: 20px; }
        }
      `}} />

      {/* ── Header ── */}
      <div className="flex items-start justify-between mb-8">
        <div>
          <h1 className="text-xl font-black text-[#002B5B] flex items-center gap-2 uppercase tracking-wide">
            <i className="fas fa-chart-bar text-[#0056b3]"></i> Reports &amp; Analytics
          </h1>
          <p className="text-sm text-gray-500 mt-1">Barangay Complaint and System Overview</p>
        </div>
        <div className="flex items-center gap-3 print:hidden">
          {/* Time Range Filter */}
          <select
            value={range}
            onChange={(e) => setRange(e.target.value)}
            className="border border-gray-300 rounded-lg px-4 py-2.5 text-sm text-gray-700 bg-white focus:outline-none focus:ring-2 focus:ring-blue-200 font-semibold"
          >
            {RANGE_OPTIONS.map(opt => (
              <option key={opt.value} value={opt.value}>{opt.label}</option>
            ))}
          </select>
          <button
            onClick={() => window.print()}
            className="bg-[#0056b3] text-white px-6 py-2.5 rounded-lg font-bold flex items-center gap-2 hover:bg-blue-800 transition-colors shadow-sm"
          >
            <i className="fas fa-download"></i>
            Download PDF
          </button>
        </div>
      </div>

      {/* ── Loading State ── */}
      {loading && (
        <div className="flex items-center justify-center py-20">
          <div className="text-center">
            <i className="fas fa-spinner fa-spin text-3xl text-[#0056b3] mb-3"></i>
            <p className="text-sm text-gray-500 font-semibold">Loading analytics...</p>
          </div>
        </div>
      )}

      {!loading && data && (
      <div className="rounded-xl p-2" style={{ backgroundColor: '#f9fafb' }}>

      {/* ── Section 1: Quick Stats ── */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
        <StatCard icon="fas fa-exclamation-circle" iconBg="bg-red-50"    iconColor="text-red-500"   label="Total Complaints" value={totalComplaints}    sub={rangeLabel} />
        <StatCard icon="fas fa-check-circle"       iconBg="bg-green-50"  iconColor="text-green-600" label="Resolved Cases"   value={resolvedCount}      sub={`${resolvedPct}% resolution rate`} />
        <StatCard icon="fas fa-newspaper"          iconBg="bg-blue-50"   iconColor="text-blue-600"  label="Published News"   value={data.total_news}    sub="All time" />
        <StatCard icon="fas fa-calendar-check"     iconBg="bg-purple-50" iconColor="text-purple-600" label="Total Events"    value={data.total_events}  sub="All time" />
      </div>

      {/* ── Section 2: Urgency & Resolution ── */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">

        {/* Donut Chart – Urgency */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
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
            <div className="flex flex-col gap-4 flex-1">
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
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <h2 className="text-sm font-black text-gray-800 uppercase tracking-wide mb-4 flex items-center gap-2">
            <i className="fas fa-tasks text-[#0056b3]"></i> Resolution Rate
          </h2>

          {/* Big Percentage */}
          <div className="flex items-end gap-3 mb-6">
            <span className="text-5xl font-black text-green-600">{resolvedPct}%</span>
            <span className="text-sm text-gray-400 mb-2">of complaints resolved</span>
          </div>

          {/* Stacked bar */}
          <div className="w-full h-5 rounded-full bg-gray-100 overflow-hidden flex mb-4">
            <div className="h-full bg-green-500 rounded-l-full transition-all" style={{ width: `${resolvedPct}%` }}></div>
            <div className="h-full bg-yellow-400 rounded-r-full transition-all" style={{ width: `${pendingPct}%` }}></div>
          </div>

          {/* Breakdown rows */}
          <div className="space-y-4 mt-4">
            {[
              { label: 'Resolved',        value: resolvedCount,                       pct: resolvedPct, color: 'bg-green-500',  textColor: 'text-green-700',  badgeBg: 'bg-green-50' },
              { label: 'Pending / Active', value: totalComplaints - resolvedCount,     pct: pendingPct,  color: 'bg-yellow-400', textColor: 'text-yellow-700', badgeBg: 'bg-yellow-50' },
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
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <h2 className="text-sm font-black text-gray-800 uppercase tracking-wide mb-6 flex items-center gap-2">
            <i className="fas fa-tag text-[#0056b3]"></i> Complaints by Category
          </h2>
          {categoryData.length > 0 ? (
          <ResponsiveContainer width="100%" height={220}>
            <BarChart data={categoryData} margin={{ top: 0, right: 10, left: -20, bottom: 0 }} barSize={28}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f0f0f0" />
              <XAxis
                dataKey="category"
                tick={{ fontSize: 11, fill: '#6b7280', fontWeight: 600 }}
                axisLine={false}
                tickLine={false}
              />
              <YAxis
                tick={{ fontSize: 11, fill: '#6b7280' }}
                axisLine={false}
                tickLine={false}
              />
              <Tooltip
                cursor={{ fill: '#f0f6ff' }}
                contentStyle={{ fontSize: 12, borderRadius: 8, border: '1px solid #e5e7eb', backgroundColor: '#ffffff', color: '#111827' }}
                itemStyle={{ color: '#111827' }}
                labelStyle={{ color: '#111827' }}
                formatter={(val) => [`${val} complaints`, 'Count']}
              />
              <Bar dataKey="count" fill="#0056b3" radius={[6, 6, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
          ) : (
            <p className="text-center text-gray-400 py-8 text-sm">No category data for this period.</p>
          )}
        </div>

        {/* Top 5 Recent Complaints */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <div className="flex items-center justify-between mb-5">
            <h2 className="text-sm font-black text-gray-800 uppercase tracking-wide flex items-center gap-2">
              <i className="fas fa-list-ol text-[#0056b3]"></i> Top 5 Recent Complaints
            </h2>
            <span className="text-xs font-semibold text-gray-400">{rangeLabel}</span>
          </div>

          {recentList.length > 0 ? (
          <div className="space-y-3">
            {recentList.map((c, idx) => {
              const dateStr = new Date(c.submitted_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
              return (
                <div key={c.id} className="flex items-start gap-3 p-3 rounded-lg bg-gray-50 border border-gray-100">
                  {/* Rank */}
                  <span className="w-6 h-6 rounded-full bg-[#0056b3] text-white text-xs font-black flex items-center justify-center flex-shrink-0 mt-0.5">
                    {idx + 1}
                  </span>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold text-gray-800 truncate">{c.category || c.complaint_type} — {c.full_name}</p>
                    <p className="text-xs text-gray-400 mt-0.5">{dateStr} · {c.ref_no}</p>
                  </div>
                  <span className={`text-xs font-bold px-2 py-0.5 rounded-full flex-shrink-0 ${statusStyle(c.status)}`}>
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
      </div>/* end report content */
      )}
    </div>
  );
}
