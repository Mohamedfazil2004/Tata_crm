import React, { useEffect, useState } from 'react';
import {
  PieChart, Pie, Cell, BarChart, Bar, XAxis, YAxis, Tooltip,
  ResponsiveContainer, LineChart, Line, CartesianGrid, Legend
} from 'recharts';
import { Users, Phone, CheckCircle, Clock, TrendingUp, Activity, Building2 } from 'lucide-react';
import api from '../api/client';

const COLORS = ['#003A8F', '#12B76A', '#F79009', '#F04438', '#7C3AED'];

const STATUS_COLORS = {
  'In Progress': '#F79009',
  'On Call': '#003A8F',
  'Completed': '#12B76A',
};

function StatCard({ label, value, icon: Icon, color, sub }) {
  return (
    <div className="stat-card">
      <div className={`stat-icon ${color}`}>
        <Icon size={22} />
      </div>
      <div className="stat-content">
        <div className="stat-label">{label}</div>
        <div className="stat-value">{value?.toLocaleString() ?? '—'}</div>
        {sub && <div className="stat-change">{sub}</div>}
      </div>
    </div>
  );
}

export default function AdminDashboard() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get('/dashboard/admin')
      .then(r => setData(r.data.data))
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  if (loading) return (
    <div className="loading-overlay">
      <div className="spinner" />
      <span className="loading-text">Loading dashboard analytics...</span>
    </div>
  );

  const s = data?.summary || {};
  const convRate = s.conversion_rate || 0;

  // Clean dealer names for charts
  const chartData = (data?.dealer_performance || []).map(d => ({
    ...d,
    dealer_name: d.dealer_name.replace(/\s*Dealer\s*Partner\s*/gi, '')
  }));

  return (
    <div>
      <div className="page-header">
        <div className="page-header-left">
          <h2>Admin Dashboard</h2>
          <p>Real-time analytics for Tata Motors advertisement leads</p>
        </div>
        <div className="page-header-actions">
          <span style={{ fontSize: '0.8rem', color: 'var(--grey-400)' }}>
            {new Date().toLocaleDateString('en-IN', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
          </span>
        </div>
      </div>

      {/* Stat Cards */}
      <div className="stats-grid" style={{ gridTemplateColumns: 'repeat(4, 1fr)' }}>
        <StatCard label="Total Leads" value={s.total_leads} icon={Users} color="blue" sub="All time" />
        <StatCard label="Pending Follow-ups" value={s.pending_followups} icon={Clock} color="orange" sub="Action needed" />
        <StatCard label="Completed" value={s.completed} icon={CheckCircle} color="green" sub="Completed" />
        <StatCard label="Conversion Rate" value={`${convRate}%`} icon={TrendingUp} color="purple" sub="Completion rate" />
      </div>

      {/* Charts Row 1 */}
      <div className="dashboard-grid" style={{ marginBottom: 20 }}>
        {/* Lead Status Pie */}
        <div className="card col-4">
          <div className="card-header">
            <div className="card-title"><Activity size={16} />Lead Status Overview</div>
          </div>
          <div className="card-body">
            <ResponsiveContainer width="100%" height={220}>
              <PieChart>
                <Pie
                  data={data?.status_distribution || []}
                  dataKey="count"
                  nameKey="status"
                  cx="50%"
                  cy="50%"
                  innerRadius={55}
                  outerRadius={85}
                  paddingAngle={3}
                >
                  {(data?.status_distribution || []).map((entry, i) => (
                    <Cell key={i} fill={STATUS_COLORS[entry.status] || COLORS[i]} />
                  ))}
                </Pie>
                <Tooltip formatter={(v, n) => [v.toLocaleString(), n]} />
              </PieChart>
            </ResponsiveContainer>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 6, marginTop: 8 }}>
              {(data?.status_distribution || []).map((d, i) => (
                <div key={i} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '0.82rem' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <div style={{ width: 10, height: 10, borderRadius: 2, background: STATUS_COLORS[d.status] || COLORS[i] }} />
                    <span style={{ color: 'var(--grey-600)' }}>{d.status}</span>
                  </div>
                  <span style={{ fontWeight: 700, color: 'var(--grey-900)' }}>{d.count?.toLocaleString()}</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Daily Trend */}
        <div className="card col-8">
          <div className="card-header">
            <div className="card-title"><TrendingUp size={16} />Lead Upload Trend (Last 30 Days)</div>
          </div>
          <div className="card-body">
            <ResponsiveContainer width="100%" height={240}>
              <LineChart data={data?.daily_trend || []}>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--grey-100)" />
                <XAxis dataKey="date_label" tick={{ fontSize: 11, fill: 'var(--grey-400)' }} />
                <YAxis tick={{ fontSize: 11, fill: 'var(--grey-400)' }} />
                <Tooltip />
                <Line type="monotone" dataKey="count" stroke="#003A8F" strokeWidth={2.5} dot={{ r: 3, fill: '#003A8F' }} name="Leads" />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* Charts Row 2 */}
      <div className="dashboard-grid" style={{ marginBottom: 20 }}>
        {/* Dealer Performance Bar */}
        <div className="card col-8">
          <div className="card-header">
            <div className="card-title"><Building2 size={16} />Telecalling Performance by Dealer</div>
          </div>
          <div className="card-body">
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={chartData.slice(0, 12)} margin={{ top: 20, right: 30, left: 0, bottom: 60 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--grey-100)" vertical={false} />
                <XAxis 
                  dataKey="dealer_name" 
                  tick={{ fontSize: 10, fill: 'var(--grey-500)', fontWeight: 500 }} 
                  interval={0} 
                  angle={-30} 
                  textAnchor="end"
                  dy={10}
                />
                <YAxis tick={{ fontSize: 11, fill: 'var(--grey-400)' }} />
                <Tooltip contentStyle={{ borderRadius: 8, border: 'none', boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }} />
                <Legend verticalAlign="top" height={36} wrapperStyle={{ fontSize: '0.8rem', paddingTop: '0px' }} />
                <Bar dataKey="total_leads" name="Total Leads" fill="#003A8F" radius={[4, 4, 0, 0]} barSize={32} />
                <Bar dataKey="completed" name="Completed" fill="#12B76A" radius={[4, 4, 0, 0]} barSize={32} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Lead Conversion */}
        <div className="card col-4">
          <div className="card-header">
            <div className="card-title"><TrendingUp size={16} />Lead Conversion Rate</div>
          </div>
          <div className="card-body" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '30px 20px' }}>
            {/* Gauge-style display */}
            <div style={{
              width: 140, height: 140, borderRadius: '50%',
              background: `conic-gradient(#003A8F ${convRate * 3.6}deg, var(--grey-100) 0deg)`,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              position: 'relative', marginBottom: 16
            }}>
              <div style={{
                width: 100, height: 100, borderRadius: '50%', background: '#fff',
                display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
              }}>
                <div style={{ fontSize: '1.6rem', fontWeight: 800, color: 'var(--tata-blue)' }}>{convRate}%</div>
              </div>
            </div>
            <div style={{ width: '100%' }}>
              {(data?.dealer_performance || []).slice(0, 5).map((d, i) => (
                <div key={i} style={{ marginBottom: 10 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.78rem', color: 'var(--grey-600)', marginBottom: 3 }}>
                    <span>{d.dealer_name.replace(/\s*Dealer\s*Partner\s*/gi, '')}</span>
                    <span style={{ fontWeight: 600 }}>{d.conversion_rate || 0}%</span>
                  </div>
                  <div className="progress-bar">
                    <div className="progress-fill" style={{ width: `${d.conversion_rate || 0}%` }} />
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Campaign Metrics & Recent Activity */}
      <div className="dashboard-grid">
        {/* Campaign Metrics */}
        <div className="card col-6">
          <div className="card-header">
            <div className="card-title"><TrendingUp size={16} />Campaign Metrics</div>
          </div>
          <div className="table-wrapper" style={{ border: 'none', borderRadius: 0 }}>
            <table className="data-table">
              <thead>
                <tr>
                  <th>Date</th>
                  <th>Total Leads</th>
                  <th>Ad Spend (₹)</th>
                </tr>
              </thead>
              <tbody>
                {(data?.campaign_metrics || []).slice(0, 8).map((m, i) => (
                  <tr key={i}>
                    <td>{m.date_label}</td>
                    <td><span className="badge badge-blue">{m.total_leads}</span></td>
                    <td>₹{parseFloat(m.ad_spend || 0).toLocaleString('en-IN')}</td>
                  </tr>
                ))}
                {(!data?.campaign_metrics?.length) && (
                  <tr><td colSpan={3} style={{ textAlign: 'center', color: 'var(--grey-400)', padding: 20 }}>No campaign data yet</td></tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Recent Activity */}
        <div className="card col-6">
          <div className="card-header">
            <div className="card-title"><Activity size={16} />Recent Activity</div>
          </div>
          <div className="table-wrapper" style={{ border: 'none', borderRadius: 0 }}>
            <table className="data-table">
              <thead>
                <tr>
                  <th>Lead Name</th>
                  <th>Dealer</th>
                  <th>Status</th>
                  <th>Time</th>
                </tr>
              </thead>
              <tbody>
                {(data?.recent_activity || []).map((r, i) => (
                  <tr key={i}>
                    <td style={{ fontWeight: 500 }}>{r.full_name}</td>
                    <td style={{ fontSize: '0.8rem', color: 'var(--grey-400)' }}>{r.dealer_name.replace(/\s*Dealer\s*Partner\s*/gi, '')}</td>
                    <td>
                      <span className={`badge status-${r.status?.toLowerCase().replace(' ', '-')}`}>{r.status}</span>
                    </td>
                    <td style={{ fontSize: '0.78rem', color: 'var(--grey-400)' }}>
                      {new Date(r.updated_at).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })}
                    </td>
                  </tr>
                ))}
                {(!data?.recent_activity?.length) && (
                  <tr><td colSpan={4} style={{ textAlign: 'center', color: 'var(--grey-400)', padding: 20 }}>No recent activity</td></tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}
