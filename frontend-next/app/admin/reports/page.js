'use client';
import {
  PieChart, Pie, Cell, Tooltip, Legend, ResponsiveContainer,
  BarChart, Bar, XAxis, YAxis, CartesianGrid
} from 'recharts';
import { useState } from 'react';

// ── Placeholder Data ────────────────────────────────────────────
const urgencyData = [
  { name: 'High',   value: 45, color: '#ef4444' },
  { name: 'Medium', value: 60, color: '#f59e0b' },
  { name: 'Low',    value: 37, color: '#22c55e' },
];

const categoryData = [
  { category: 'Peace & Order', count: 50 },
  { category: 'Infrastructure', count: 35 },
  { category: 'Sanitation',     count: 20 },
  { category: 'Noise',          count: 15 },
];

const recentComplaints = {
  'This Week': [
    { title: 'Noise disturbance at Purok 3',   date: 'Jun 27, 2026', status: 'Pending'  },
    { title: 'Broken streetlight on Main St.',  date: 'Jun 26, 2026', status: 'On-Going' },
    { title: 'Clogged drainage near Blk 5',    date: 'Jun 26, 2026', status: 'Resolved' },
    { title: 'Stray dogs reported in Area B',  date: 'Jun 25, 2026', status: 'Pending'  },
    { title: 'Illegal dumping – Purok 7',       date: 'Jun 25, 2026', status: 'On-Going' },
  ],
  'This Month': [
    { title: 'Road damage along Pinyahan Ave.', date: 'Jun 20, 2026', status: 'Resolved' },
    { title: 'Flooding complaint – Sitio 2',    date: 'Jun 18, 2026', status: 'Pending'  },
    { title: 'Loud videoke – Blk 3 Lot 7',     date: 'Jun 15, 2026', status: 'On-Going' },
    { title: 'Garbage not collected – Purok 1', date: 'Jun 12, 2026', status: 'Resolved' },
    { title: 'Squatting issue – Vacant Lot',    date: 'Jun 10, 2026', status: 'Pending'  },
  ],
  'This Year': [
    { title: 'Water supply interruption',       date: 'Mar 5, 2026',  status: 'Resolved' },
    { title: 'Vandalism – Covered Court',       date: 'Feb 20, 2026', status: 'Resolved' },
    { title: 'Illegal construction – Blk 9',   date: 'Jan 30, 2026', status: 'On-Going' },
    { title: 'Pothole complaint – Purok 4',    date: 'Jan 15, 2026', status: 'Resolved' },
    { title: 'Domestic dispute – Blk 2',       date: 'Jan 8, 2026',  status: 'Resolved' },
  ],
};

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
  const [timeFilter, setTimeFilter] = useState('This Week');
  const complaints = recentComplaints[timeFilter];
  const total = urgencyData.reduce((s, d) => s + d.value, 0);
  const resolved = 98;
  const totalComplaints = 142;
  const resolvedPct = Math.round((resolved / totalComplaints) * 100);
  const pendingPct   = 100 - resolvedPct;

  return (
    <div id="report-printable-area" className="p-8 max-w-7xl mx-auto">

      {/* ── Print Styles ── */}
      <style dangerouslySetInnerHTML={{__html: `
        @media print {
          body * {
            visibility: hidden;
          }
          #report-printable-area, #report-printable-area * {
            visibility: visible;
          }
          #report-printable-area {
            position: absolute;
            left: 0;
            top: 0;
            width: 100%;
            padding: 20px;
          }
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
        <button
          onClick={() => window.print()}
          className="bg-[#0056b3] text-white px-6 py-2.5 rounded-lg font-bold flex items-center gap-2 hover:bg-blue-800 transition-colors shadow-sm print:hidden"
        >
          <i className="fas fa-download"></i>
          Download PDF Report
        </button>
      </div>

      {/* ── Report Content ── */}
      <div className="rounded-xl p-2" style={{ backgroundColor: '#f9fafb' }}>

      {/* ── Section 1: Quick Stats ── */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
        <StatCard icon="fas fa-exclamation-circle" iconBg="bg-red-50"    iconColor="text-red-500"   label="Total Complaints" value="142"   sub="All time" />
        <StatCard icon="fas fa-check-circle"       iconBg="bg-green-50"  iconColor="text-green-600" label="Resolved Cases"   value="98"    sub="69% resolution rate" />
        <StatCard icon="fas fa-users"              iconBg="bg-blue-50"   iconColor="text-blue-600"  label="Active Users"     value="1,024" sub="Registered residents" />
        <StatCard icon="fas fa-newspaper"          iconBg="bg-purple-50" iconColor="text-purple-600" label="Published News"  value="12"    sub="Articles live" />
      </div>

      {/* ── Section 2: Urgency & Resolution ── */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">

        {/* Donut Chart – Urgency */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <h2 className="text-sm font-black text-gray-800 uppercase tracking-wide mb-4 flex items-center gap-2">
            <i className="fas fa-brain text-[#0056b3]"></i> AI Urgency Classification
          </h2>
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
                <CustomDonutLabel cx={100} cy={100} total={total} />
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
                        style={{ width: `${Math.round((d.value / total) * 100)}%`, backgroundColor: d.color }}
                      ></div>
                    </div>
                    <span className="text-sm font-black text-gray-800 w-6 text-right">{d.value}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
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
              { label: 'Resolved',        value: resolved,                     pct: resolvedPct, color: 'bg-green-500',  textColor: 'text-green-700',  badgeBg: 'bg-green-50' },
              { label: 'Pending / Active', value: totalComplaints - resolved,   pct: pendingPct,  color: 'bg-yellow-400', textColor: 'text-yellow-700', badgeBg: 'bg-yellow-50' },
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
            <span>Total complaints tracked</span>
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
        </div>

        {/* Top 5 Recent Complaints */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <div className="flex items-center justify-between mb-5">
            <h2 className="text-sm font-black text-gray-800 uppercase tracking-wide flex items-center gap-2">
              <i className="fas fa-list-ol text-[#0056b3]"></i> Top 5 Recent Complaints
            </h2>
            <select
              value={timeFilter}
              onChange={(e) => setTimeFilter(e.target.value)}
              className="text-xs border border-gray-300 rounded-lg px-3 py-1.5 text-gray-600 bg-white focus:outline-none focus:ring-2 focus:ring-blue-200 font-semibold"
            >
              <option>This Week</option>
              <option>This Month</option>
              <option>This Year</option>
            </select>
          </div>

          <div className="space-y-3">
            {complaints.map((c, idx) => (
              <div key={idx} className="flex items-start gap-3 p-3 rounded-lg bg-gray-50 border border-gray-100">
                {/* Rank */}
                <span className="w-6 h-6 rounded-full bg-[#0056b3] text-white text-xs font-black flex items-center justify-center flex-shrink-0 mt-0.5">
                  {idx + 1}
                </span>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold text-gray-800 truncate">{c.title}</p>
                  <p className="text-xs text-gray-400 mt-0.5">{c.date}</p>
                </div>
                <span className={`text-xs font-bold px-2 py-0.5 rounded-full flex-shrink-0 ${statusStyle(c.status)}`}>
                  {c.status}
                </span>
              </div>
            ))}
          </div>
        </div>

      </div>
      </div>{/* end report content */}
    </div>
  );
}
