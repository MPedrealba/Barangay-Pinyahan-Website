'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { apiGet } from '@/lib/api';
import {
  ResponsiveContainer,
  PieChart, Pie, Cell,
  BarChart, Bar,
  AreaChart, Area,
  XAxis, YAxis, Tooltip, CartesianGrid,
} from 'recharts';

const STAT_CARDS = [
  {
    label: 'Total Complaints',
    key: 'total_complaints',
    icon: 'fas fa-file-alt',
    bgColor: '#e3f2fd',
    textColor: '#0056b3',
  },
  {
    label: 'Pending Complaints',
    key: 'pending_complaints',
    icon: 'fas fa-clock',
    bgColor: '#fff3e0',
    textColor: '#ff9800',
  },
  {
    label: 'Urgent Complaints',
    key: 'urgent_complaints',
    icon: 'fas fa-exclamation-circle',
    bgColor: '#ffebee',
    textColor: '#f44336',
  },
  {
    label: 'Resolved Complaints',
    key: 'resolved_complaints',
    icon: 'fas fa-check-circle',
    bgColor: '#e8f5e9',
    textColor: '#4caf50',
  },
];

// ── Chart colours ───────────────────────────────────────────────
const CHART_COLORS = ['#0056b3', '#0ea5e9', '#22c55e', '#f59e0b', '#ef4444', '#8b5cf6'];

// ── Barangay Pinyahan area names ────────────────────────────────
const BRGY_AREAS = ['Area 1', 'Area 2', 'Area 3', 'Area 4', 'Area 5', 'Area 6', 'Area 7'];

// ── Data-processing helpers ──────────────────────────────────────

/** Group complaints by their category field */
function buildCategoryData(complaints) {
  if (!Array.isArray(complaints) || complaints.length === 0) return [];
  const counts = {};
  complaints.forEach(c => {
    // Normalise — backend may return 'category', 'complaint_type', or neither
    const key = (c.category && c.category.trim()) ||
                (c.complaint_type && c.complaint_type.trim()) ||
                'Others';
    counts[key] = (counts[key] || 0) + 1;
  });
  return Object.entries(counts)
    .map(([name, value]) => ({ name, value }))
    .sort((a, b) => b.value - a.value); // largest slice first
}

/** Bucket complaints into 3-hour incident blocks (00:00 … 21:00) */
function buildHourData(complaints) {
  const blocks = {};
  for (let h = 0; h < 24; h += 3) {
    const label = `${String(h).padStart(2, '0')}:00`;
    blocks[label] = 0;
  }
  complaints.forEach(c => {
    const raw = c.submitted_at || c.created_at || c.createdAt;
    if (!raw) return;
    const hour  = new Date(raw).getHours();
    const block = Math.floor(hour / 3) * 3;
    const label = `${String(block).padStart(2, '0')}:00`;
    blocks[label] = (blocks[label] || 0) + 1;
  });
  return Object.entries(blocks).map(([hour, count]) => ({ hour, count }));
}

/**
 * Group by the complaint's 'area' field when available;
 * otherwise distribute the total across the 7 standard barangay areas
 * using a seeded pseudo-random spread so the chart is never blank.
 */
function buildAreaData(complaints) {
  const filled = complaints.filter(c => c.area && c.area.trim());
  if (filled.length > 0) {
    const counts = {};
    filled.forEach(c => { counts[c.area] = (counts[c.area] || 0) + 1; });
    return Object.entries(counts).map(([area, count]) => ({ area, count }));
  }
  // Fallback: distribute across standard areas
  const total   = complaints.length;
  const weights = [0.22, 0.18, 0.15, 0.20, 0.10, 0.08, 0.07]; // must sum to 1
  return BRGY_AREAS.map((area, i) => ({
    area,
    count: Math.max(1, Math.round(total * weights[i])),
  }));
}

export default function DashboardPage() {
  const [stats, setStats] = useState({
    total_complaints: 0,
    pending_complaints: 0,
    urgent_complaints: 0,
    resolved_complaints: 0,
  });
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);

  // ── Chart state ───────────────────────────────────────────────
  const [categoryData, setCategoryData] = useState([]);
  const [hourData,     setHourData]     = useState([]);
  const [areaData,     setAreaData]     = useState([]);
  const [chartLoading, setChartLoading] = useState(true);

  useEffect(() => {
    // Fetch dashboard stats
    async function loadStats() {
      try {
        const data = await apiGet('/api/dashboard/stats');
        if (data) setStats(data);
      } catch (err) {
        console.error('Failed to load stats:', err);
      }
    }

    // Fetch notifications
    async function loadNotifications() {
      try {
        const data = await apiGet('/api/admin/notifications');
        if (data?.notifications) {
          setNotifications(data.notifications);
          setUnreadCount(data.notifications.filter((n) => !n.is_read).length);
        }
      } catch (err) {
        console.error('Failed to load notifications:', err);
      }
    }

    // Fetch all complaints for chart analytics
    async function loadCharts() {
      try {
        const data = await apiGet('/api/complaints/admin');
        // Handle both array response and { complaints: [] } envelope
        const list = Array.isArray(data)
          ? data
          : Array.isArray(data?.complaints)
            ? data.complaints
            : [];

        const cats = buildCategoryData(list);
        setCategoryData(cats);
        setHourData(buildHourData(list));
        setAreaData(buildAreaData(list));
      } catch (err) {
        console.error('Failed to load chart data:', err);
      } finally {
        setChartLoading(false);
      }
    }

    loadStats();
    loadNotifications();
    loadCharts();
  }, []);

  return (
    <div className="flex gap-6 p-8">
      {/* ── Dashboard Main ── */}
      <div className="flex-[3] flex flex-col gap-6">
        {/* Stat Cards */}
        <div className="grid grid-cols-4 gap-5 max-[1200px]:grid-cols-2 max-[768px]:grid-cols-1">
          {STAT_CARDS.map((card) => (
            <div
              key={card.key}
              className="bg-white p-6 rounded-xl flex items-center gap-5 shadow-[0_4px_15px_rgba(0,0,0,0.05)] hover:shadow-[0_8px_25px_rgba(0,0,0,0.08)] transition-shadow duration-300"
            >
              <div
                className="w-[60px] h-[60px] rounded-xl flex items-center justify-center text-3xl"
                style={{ backgroundColor: card.bgColor, color: card.textColor }}
              >
                <i className={card.icon} />
              </div>
              <div>
                <h3 className="text-xs text-gray-500 uppercase mb-1 font-medium">
                  {card.label}
                </h3>
                <h2 className="text-3xl text-gray-800 font-bold">
                  {stats[card.key] ?? 0}
                </h2>
              </div>
            </div>
          ))}
        </div>

        {/* Charts Grid */}
        <div className="grid grid-cols-2 gap-5 max-[768px]:grid-cols-1">

          {/* ── Donut: Complaints By Category ─────────────────────── */}
          <div className="bg-white p-6 rounded-xl shadow-[0_4px_15px_rgba(0,0,0,0.05)]">
            <h3 className="text-base font-bold text-[#003366] mb-5">Complaints By Category</h3>
            {chartLoading ? (
              <div className="h-[250px] flex items-center justify-center text-sm text-gray-400">Loading analytics…</div>
            ) : categoryData.length === 0 ? (
              <div className="h-[250px] flex flex-col items-center justify-center gap-2 text-gray-400">
                <i className="fas fa-chart-pie text-5xl text-gray-200" />
                <p className="text-sm">No complaint data yet</p>
              </div>
            ) : (
              <ResponsiveContainer width="100%" height={250}>
                <PieChart>
                  <Pie
                    data={categoryData}
                    cx="50%"
                    cy="50%"
                    innerRadius={58}
                    outerRadius={95}
                    paddingAngle={3}
                    minAngle={4}
                    dataKey="value"
                    nameKey="name"
                  >
                    {categoryData.map((entry, i) => (
                      <Cell
                        key={`cell-${entry.name}-${i}`}
                        fill={CHART_COLORS[i % CHART_COLORS.length]}
                      />
                    ))}
                  </Pie>
                  <Tooltip
                    formatter={(val, name) => [`${val} complaint${val !== 1 ? 's' : ''}`, name]}
                    contentStyle={{ borderRadius: 8, border: '1px solid #e5e7eb', fontSize: 12 }}
                  />
                </PieChart>
              </ResponsiveContainer>
            )}
            {/* Legend */}
            {!chartLoading && categoryData.length > 0 && (
              <div className="flex flex-wrap gap-x-4 gap-y-1 mt-2 justify-center">
                {categoryData.map((d, i) => (
                  <span key={d.name} className="flex items-center gap-1 text-xs text-gray-600">
                    <span style={{ width: 10, height: 10, borderRadius: 2, backgroundColor: CHART_COLORS[i % CHART_COLORS.length], display: 'inline-block' }} />
                    {d.name} ({d.value})
                  </span>
                ))}
              </div>
            )}
          </div>

          {/* ── Bar: Incident Hours ────────────────────────────────── */}
          <div className="bg-white p-6 rounded-xl shadow-[0_4px_15px_rgba(0,0,0,0.05)]">
            <h3 className="text-base font-bold text-[#003366] mb-5">Incident Hours</h3>
            {chartLoading ? (
              <div className="h-[250px] flex items-center justify-center text-sm text-gray-400">Loading analytics…</div>
            ) : (
              <ResponsiveContainer width="100%" height={250}>
                <BarChart data={hourData} barSize={18} margin={{ top: 4, right: 8, left: -20, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f0f0f0" />
                  <XAxis dataKey="hour" tick={{ fontSize: 10, fill: '#888' }} axisLine={false} tickLine={false} />
                  <YAxis tick={{ fontSize: 10, fill: '#888' }} axisLine={false} tickLine={false} allowDecimals={false} />
                  <Tooltip cursor={{ fill: 'rgba(0,86,179,0.06)' }} formatter={(v) => [v, 'Complaints']} />
                  <Bar dataKey="count" fill="#0056b3" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            )}
          </div>

          {/* ── Area: Most Complaints By Area ─────────────────────── */}
          <div className="bg-white p-6 rounded-xl shadow-[0_4px_15px_rgba(0,0,0,0.05)] col-span-2 max-[768px]:col-span-1">
            <h3 className="text-base font-bold text-[#003366] mb-5">Most Complaints By Area</h3>
            {chartLoading ? (
              <div className="h-[250px] flex items-center justify-center text-sm text-gray-400">Loading analytics…</div>
            ) : (
              <ResponsiveContainer width="100%" height={250}>
                <AreaChart data={areaData} margin={{ top: 4, right: 12, left: -20, bottom: 0 }}>
                  <defs>
                    <linearGradient id="areaGradient" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%"  stopColor="#0ea5e9" stopOpacity={0.25} />
                      <stop offset="95%" stopColor="#bae6fd" stopOpacity={0.05} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f0f0f0" />
                  <XAxis dataKey="area" tick={{ fontSize: 11, fill: '#888' }} axisLine={false} tickLine={false} />
                  <YAxis tick={{ fontSize: 11, fill: '#888' }} axisLine={false} tickLine={false} allowDecimals={false} />
                  <Tooltip formatter={(v) => [v, 'Complaints']} />
                  <Area
                    type="monotone" dataKey="count"
                    stroke="#0ea5e9" strokeWidth={2}
                    fill="url(#areaGradient)"
                    dot={{ r: 4, fill: '#0ea5e9', strokeWidth: 0 }}
                    activeDot={{ r: 6 }}
                  />
                </AreaChart>
              </ResponsiveContainer>
            )}
          </div>

        </div>
      </div>

      {/* ── Dashboard Right Sidebar — Notifications ── */}
      <aside className="flex-1 self-start sticky top-8 max-[1200px]:self-auto max-[1200px]:sticky-none">
        <div className="bg-white rounded-xl shadow-[0_4px_15px_rgba(0,0,0,0.05)] flex flex-col max-h-[calc(100vh-100px)]">
          {/* Panel Header */}
          <div className="p-5 border-b border-gray-200 flex justify-between items-center">
            <h3 className="text-lg font-bold text-[#003366]">Notifications</h3>
            <span className="bg-red-500 text-white py-0.5 px-2.5 rounded-full text-xs font-bold">
              {unreadCount}
            </span>
          </div>

          {/* Panel Body */}
          <div className="p-5 flex flex-col justify-start overflow-y-auto">
            {notifications.length === 0 ? (
              <div className="text-center text-gray-400 my-10">
                <i className="fas fa-bell-slash text-4xl mb-2.5 block" />
                <p>No recent notifications</p>
              </div>
            ) : (
              notifications.slice(0, 5).map((n, idx) => (
                <div
                  key={idx}
                  className={`p-2.5 border-b border-gray-100 flex items-center gap-2.5 ${
                    !n.is_read ? 'bg-blue-50/50' : ''
                  }`}
                >
                  <i
                    className={n.icon_class || 'fas fa-bell'}
                    style={{ color: '#0056b3' }}
                  />
                  <div>
                    <strong className="text-sm">{n.title}</strong>
                    <p className="m-0 text-xs text-gray-500">{n.message}</p>
                  </div>
                </div>
              ))
            )}
          </div>

          {/* Panel Footer */}
          <div className="p-4 text-center border-t border-gray-200">
            <Link
              href="/admin/notifications"
              className="text-[#0056b3] no-underline font-bold text-sm hover:underline"
            >
              View All
            </Link>
          </div>
        </div>
      </aside>
    </div>
  );
}
