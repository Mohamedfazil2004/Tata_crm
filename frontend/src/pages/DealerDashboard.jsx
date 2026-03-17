import React, { useEffect, useState } from 'react';
import {
  PieChart, Pie, Cell, BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid
} from 'recharts';
import { Phone, CheckCircle, Clock, TrendingUp, AlertCircle, Users, Activity } from 'lucide-react';
import api from '../api/client';
import { useAuth } from '../context/AuthContext';

const STATUS_COLORS = { 'In Progress': '#F79009', 'On Call': '#003A8F', 'Completed': '#12B76A' };

function StatCard({ label, value, icon: Icon, color, sub }) {
  return (
    <div className="stat-card">
      <div className={`stat-icon ${color}`}><Icon size={22} /></div>
      <div className="stat-content">
        <div className="stat-label">{label}</div>
        <div className="stat-value">{value?.toLocaleString() ?? '—'}</div>
        {sub && <div className="stat-change">{sub}</div>}
      </div>
    </div>
  );
}

export default function DealerDashboard() {
  const { user } = useAuth();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get('/dashboard/dealer')
      .then(r => setData(r.data.data))
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <div className="loading-overlay"><div className="spinner" /><span className="loading-text">Loading...</span></div>;

  const s = data?.summary || {};

  return (
    <div>
      <div className="page-header">
        <div className="page-header-left">
          <h2>Telecaller Dashboard</h2>
          <p>Welcome back, {user?.full_name} — {user?.dealer_name} Dealer Partner</p>
        </div>
        <span style={{ fontSize: '0.8rem', color: 'var(--grey-400)' }}>
          {new Date().toLocaleDateString('en-IN', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
        </span>
      </div>

      {/* Stats */}
      <div className="stats-grid" style={{ gridTemplateColumns: 'repeat(4, 1fr)' }}>
        <StatCard label="Total Leads" value={s.total_leads} icon={Users} color="blue" />
        <StatCard label="Follow-ups Today" value={s.followups_today} icon={Phone} color="orange" />
        <StatCard label="Completed" value={s.completed} icon={CheckCircle} color="green" />
        <StatCard label="Conversion Rate" value={`${s.conversion_rate || 0}%`} icon={TrendingUp} color="purple" />
      </div>

      <div className="dashboard-grid" style={{ marginBottom: 20 }}>
        {/* Status distribution */}
        <div className="card col-4">
          <div className="card-header"><div className="card-title">Lead Status Overview</div></div>
          <div className="card-body">
            <ResponsiveContainer width="100%" height={200}>
              <PieChart>
                <Pie data={data?.status_distribution || []} dataKey="count" nameKey="status"
                  cx="50%" cy="50%" innerRadius={50} outerRadius={80} paddingAngle={3}>
                  {(data?.status_distribution || []).map((e, i) => (
                    <Cell key={i} fill={STATUS_COLORS[e.status] || '#ccc'} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 4, marginTop: 8 }}>
              {(data?.status_distribution || []).map((d, i) => (
                <div key={i} style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.82rem' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <div style={{ width: 10, height: 10, borderRadius: 2, background: STATUS_COLORS[d.status] }} />
                    <span style={{ color: 'var(--grey-600)' }}>{d.status}</span>
                  </div>
                  <span style={{ fontWeight: 700 }}>{d.count}</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Unified Models & Conversion Row */}
        <div className="card col-8">
          <div className="card-header">
            <div className="card-title" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', width: '100%' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}><Activity size={16} /> Performance & Interest Analytics</div>
              <span className="badge badge-blue">Real-time</span>
            </div>
          </div>
          <div className="card-body" style={{ display: 'flex', alignItems: 'center', gap: 32, padding: '24px 32px' }}>
            {/* Models Half */}
            <div style={{ flex: 1.2 }}>
              <div style={{ fontSize: '0.8rem', fontWeight: 600, color: 'var(--grey-400)', marginBottom: 16, textTransform: 'uppercase', letterSpacing: '0.5px' }}>Top Models Interested</div>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 12 }}>
                {(data?.model_distribution || []).slice(0, 4).map((m, i) => (
                  <div key={i} style={{ 
                    background: 'var(--grey-50)', 
                    padding: '10px 16px', 
                    borderRadius: '12px', 
                    border: '1px solid var(--grey-100)',
                    display: 'flex',
                    flexDirection: 'column',
                    minWidth: 100
                  }}>
                    <span style={{ fontSize: '0.85rem', fontWeight: 700, color: 'var(--tata-blue)' }}>{m.model}</span>
                    <span style={{ fontSize: '0.72rem', color: 'var(--grey-400)', marginTop: 2 }}>{m.count} Leads</span>
                  </div>
                ))}
                {!data?.model_distribution?.length && <div style={{ color: 'var(--grey-300)', fontSize: '0.875rem' }}>No data available</div>}
              </div>
            </div>

            {/* Divider */}
            <div style={{ width: 1, height: 80, background: 'var(--grey-100)' }} />

            {/* Conversion Half */}
            <div style={{ flex: 0.8, display: 'flex', alignItems: 'center', gap: 20 }}>
              <div style={{ position: 'relative', width: 80, height: 80 }}>
                <svg width="80" height="80" viewBox="0 0 100 100">
                  <circle cx="50" cy="50" r="42" fill="none" stroke="var(--grey-50)" strokeWidth="8" />
                  <circle cx="50" cy="50" r="42" fill="none" stroke="var(--green-500)" strokeWidth="8" 
                    strokeDasharray={`${(s.conversion_rate || 0) * 2.64} 264`} 
                    strokeLinecap="round" transform="rotate(-90 50 50)" />
                </svg>
                <div style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1rem', fontWeight: 800, color: 'var(--grey-900)' }}>
                  {s.conversion_rate || 0}%
                </div>
              </div>
              <div>
                <div style={{ fontSize: '0.8rem', fontWeight: 600, color: 'var(--grey-400)', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: 4 }}>Lead Conversion</div>
                <div style={{ fontSize: '1.25rem', fontWeight: 800, color: 'var(--green-500)' }}>Excellent</div>
                <div style={{ fontSize: '0.72rem', color: 'var(--grey-500)' }}>{s.completed} deals won out of {s.total_leads}</div>
              </div>
            </div>
          </div>
        </div>
      </div>


    </div>
  );
}
