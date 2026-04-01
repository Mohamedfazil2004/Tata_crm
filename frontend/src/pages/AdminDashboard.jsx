import React, { useEffect, useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import {
  PieChart, Pie, Cell, BarChart, Bar, XAxis, YAxis, Tooltip,
  ResponsiveContainer, CartesianGrid, Legend
} from 'recharts';
import { Users, Phone, CheckCircle, Clock, TrendingUp, Activity, Building2, Calendar, MessageSquare, AlertCircle, X, Download, ChevronRight } from 'lucide-react';
import api from '../api/client';
import toast from 'react-hot-toast';

const COLORS = ['#003A8F', '#12B76A', '#F79009', '#F04438', '#7C3AED', '#FFBB28', '#FF8042', '#0088FE', '#00C49F'];
const STATUS_COLORS = { 'In Progress': '#F79009', 'On Call': '#003A8F', 'Completed': '#12B76A' };

function StatCard({ label, value, icon: Icon, color, sub, onClick }) {
  return (
    <div className={`stat-card ${onClick ? 'clickable' : ''}`} onClick={onClick} style={{ cursor: onClick ? 'pointer' : 'default' }}>
      <div className={`stat-icon ${color}`}><Icon size={20} /></div>
      <div className="stat-content">
        <div className="stat-label">{label}</div>
        <div className="stat-value">{value?.toLocaleString() ?? '—'}</div>
        {sub && <div className="stat-change">{sub}</div>}
      </div>
    </div>
  );
}

export default function AdminDashboard() {
  const navigate = useNavigate();
  const { dateFrom, setDateFrom, dateTo, setDateTo } = useAuth();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  const fetchData = useCallback(() => {
    if (!dateFrom || !dateTo) return;
    setLoading(true);
    api.get('/dashboard/admin', { params: { date_from: dateFrom, date_to: dateTo } })
      .then(r => setData(r.data.data))
      .catch(console.error)
      .finally(() => setLoading(false));
  }, [dateFrom, dateTo]);

  useEffect(() => { fetchData(); }, [fetchData]);

  const handleExport = async () => {
    if (!dateFrom || !dateTo) { toast.error('Please select both From and To dates'); return; }
    const loadingToast = toast.loading('Exporting...');
    try {
      const res = await api.get('/leads', { params: { date_from: dateFrom, date_to: dateTo, limit: 100000 } });
      const leads = res.data.data;
      if (!leads.length) { toast.error('No leads found'); toast.dismiss(loadingToast); return; }
      const headers = ['DATE', 'NAME', 'PHONE', 'LOCATION', 'VEHICLE', 'TELECALLER REMARK', 'DSE', 'CUSTOMER RESPONSE', 'DSE NEXT VISIT', 'STATUS'];
      const csv = [headers.join(','), ...leads.map(l => [
        l.lead_date, 
        l.full_name, 
        l.phone_number, 
        l.location, 
        l.model, 
        (l.telecaller_remark || '').replace(/,/g, ' '), 
        l.assigned_to_dse, 
        (l.customer_response || '').replace(/,/g, ' '), 
        l.dse_follow_up_date || '—', 
        l.status
      ].join(','))].join('\n');
      const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
      const link = document.createElement('a');
      link.href = URL.createObjectURL(blob);
      link.download = `Leads_Export_${dateFrom}_to_${dateTo}.csv`;
      link.click();
      toast.success('Downloaded!');
    } catch { toast.error('Export failed'); } finally { toast.dismiss(loadingToast); }
  };

  if (loading && !data) return <div className="loading-overlay"><div className="spinner" /></div>;

  const s = data?.summary || {};
  const convRate = s.conversion_rate || 0;
  const chartData = (data?.dealer_performance || []).map(d => ({
    ...d, dealer_name: (d.dealer_name || '').replace(/\s*Dealer\s*Partner\s*/gi, '')
  }));

  return (
    <div className="dashboard-container">
      <div className="page-header">
        <div className="page-header-left">
          <h2>Admin Dashboard</h2>
          <p>Global oversight of Tata Motors CRM performance</p>
        </div>
        <div className="page-header-actions">
          <div className="date-picker-wrap" style={{ display: 'flex', gap: 10, background: '#fff', padding: '6px 14px', borderRadius: 12, border: '1px solid var(--grey-200)', flexWrap: 'wrap' }}>
            <Calendar size={14} color="var(--grey-400)" />
            <input type="date" className="date-input-clean" value={dateFrom} onChange={e => setDateFrom(e.target.value)} style={{ border: 'none', fontSize: '0.82rem', fontWeight: 600, outline: 'none' }} />
            <span style={{ color: 'var(--grey-200)' }}>→</span>
            <input type="date" className="date-input-clean" value={dateTo} onChange={e => setDateTo(e.target.value)} style={{ border: 'none', fontSize: '0.82rem', fontWeight: 600, outline: 'none' }} />
          </div>
          <button className="btn btn-primary" onClick={handleExport}><Download size={16} /> Export</button>
        </div>
      </div>

      <div className="stats-grid" style={{ gridTemplateColumns: 'repeat(5, 1fr)', marginBottom: 24 }}>
        <StatCard label="Total Leads" value={s.total_leads} icon={Users} color="blue" sub="Overall" onClick={() => navigate('/dealers')} />
        <StatCard label="Pending" value={s.pending_leads} icon={AlertCircle} color="orange" sub="Awaiting action" />
        <StatCard label="Follow-ups" value={s.pending_followups} icon={Clock} color="purple" sub="Action needed" />
        <StatCard label="Completed" value={s.completed} icon={CheckCircle} color="green" sub="Total closed" />
        <StatCard label="Completion %" value={`${convRate}%`} icon={TrendingUp} color="blue" sub="Current accuracy" />
      </div>

      <div className="dashboard-grid">
        {/* Status Overview — Refined side-by-side Design (Modified to col-6) */}
        <div className="card col-6" style={{ border: 'none', boxShadow: '0 4px 20px rgba(0,0,0,0.05)', borderRadius: 18 }}>
          <div className="card-header" style={{ padding: '20px 24px', borderBottom: '1px solid var(--grey-50)' }}>
            <div className="card-title" style={{ fontSize: '1rem', fontWeight: 800, color: 'var(--grey-900)', display: 'flex', alignItems: 'center', gap: 10 }}>
              <Activity size={18} color="var(--tata-blue)" /> Status Overview
            </div>
          </div>
          <div className="card-body" style={{ display: 'flex', gap: 32, padding: '30px 24px', alignItems: 'center', flexWrap: 'wrap' }}>
            {/* LEFT SIDE: DONUT CHART (40%) */}
            <div style={{ flex: '0.4', minWidth: 220, position: 'relative' }}>
              <ResponsiveContainer width="100%" height={220}>
                <PieChart>
                  <Pie data={data?.status_distribution || []} dataKey="count" nameKey="status" cx="50%" cy="50%" innerRadius="65%" outerRadius="95%" paddingAngle={4} stroke="none">
                    {(data?.status_distribution || []).map((entry, i) => (
                      <Cell key={i} fill={STATUS_COLORS[entry.status] || COLORS[i % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip contentStyle={{ borderRadius: 12, border: 'none', boxShadow: 'var(--shadow-lg)' }} />
                </PieChart>
              </ResponsiveContainer>
              <div style={{ position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%, -50%)', textAlign: 'center' }}>
                <div style={{ fontSize: '0.6rem', color: 'var(--grey-400)', fontWeight: 700, textTransform: 'uppercase' }}>Leads</div>
                <div style={{ fontSize: '1.1rem', fontWeight: 900, color: 'var(--tata-blue)' }}>{(data?.status_distribution || []).reduce((a, b) => a + b.count, 0)}</div>
              </div>
            </div>
            {/* RIGHT SIDE: STATUS LIST (60%) */}
            <div style={{ flex: '0.6', minWidth: 260 }}>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                {(data?.status_distribution || []).map((item, i) => {
                  const total = (data?.status_distribution || []).reduce((a, b) => a + b.count, 0);
                  const percent = total > 0 ? Math.round((item.count / total) * 100) : 0;
                  return (
                    <div key={i} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '12px 18px', background: 'var(--grey-50)', borderRadius: 12, border: '1px solid var(--grey-100)' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                        <div style={{ width: 10, height: 10, borderRadius: '50%', background: STATUS_COLORS[item.status] || COLORS[i % COLORS.length], boxShadow: `0 0 0 3px ${(STATUS_COLORS[item.status] || COLORS[i % COLORS.length])}15` }} />
                        <span style={{ fontSize: '0.82rem', fontWeight: 700, color: 'var(--grey-700)' }}>{item.status}</span>
                      </div>
                      <span style={{ fontSize: '0.88rem', fontWeight: 800, color: 'var(--tata-blue)' }}>{percent}%</span>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        </div>

        {/* Telecaller Remark — Standardized side-by-side Layout (also col-6) */}
        <div className="card col-6" style={{ border: 'none', boxShadow: '0 4px 20px rgba(0,0,0,0.05)', borderRadius: 18 }}>
          <div className="card-header" style={{ padding: '20px 24px', borderBottom: '1px solid var(--grey-50)' }}>
            <div className="card-title" style={{ fontSize: '1rem', fontWeight: 800, color: 'var(--grey-900)', display: 'flex', alignItems: 'center', gap: 10 }}>
              <MessageSquare size={18} color="var(--tata-blue)" /> Telecaller Remark
            </div>
          </div>
          <div className="card-body" style={{ display: 'flex', gap: 32, padding: '30px 24px', alignItems: 'center', flexWrap: 'wrap' }}>
            {/* LEFT SIDE: DONUT CHART (40%) */}
            <div style={{ flex: '0.4', minWidth: 220, position: 'relative' }}>
              <ResponsiveContainer width="100%" height={220}>
                <PieChart>
                  <Pie data={data?.remark_distribution || []} dataKey="count" nameKey="status" cx="50%" cy="50%" innerRadius="65%" outerRadius="95%" paddingAngle={3} stroke="none">
                    {(data?.remark_distribution || []).map((entry, i) => (
                      <Cell key={i} fill={COLORS[i % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip contentStyle={{ borderRadius: 12, border: 'none', boxShadow: 'var(--shadow-lg)' }} />
                </PieChart>
              </ResponsiveContainer>
              <div style={{ position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%, -50%)', textAlign: 'center' }}>
                <div style={{ fontSize: '0.6rem', color: 'var(--grey-400)', fontWeight: 700, textTransform: 'uppercase' }}>Total</div>
                <div style={{ fontSize: '1.1rem', fontWeight: 900, color: 'var(--tata-blue)' }}>{(data?.remark_distribution || []).reduce((a, b) => a + b.count, 0)}</div>
              </div>
            </div>

            {/* RIGHT SIDE: STATUS LIST (60%) */}
            <div style={{ flex: '0.6', minWidth: 260, maxHeight: 220, overflowY: 'auto', paddingRight: 6 }}>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                {(data?.remark_distribution || []).map((item, i) => {
                  const total = (data?.remark_distribution || []).reduce((a, b) => a + b.count, 0);
                  const percent = total > 0 ? Math.round((item.count / total) * 100) : 0;
                  return (
                    <div key={i} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '12px 18px', background: 'var(--grey-50)', borderRadius: 12, border: '1px solid var(--grey-100)' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 10, overflow: 'hidden' }}>
                        <div style={{ width: 10, height: 10, borderRadius: '50%', background: COLORS[i % COLORS.length], boxShadow: `0 0 0 3px ${COLORS[i % COLORS.length]}15`, flexShrink: 0 }} />
                        <span style={{ fontSize: '0.8rem', fontWeight: 700, color: 'var(--grey-700)', whiteSpace: 'nowrap', textOverflow: 'ellipsis', overflow: 'hidden' }}>{item.status}</span>
                      </div>
                      <span style={{ fontSize: '0.85rem', fontWeight: 800, color: 'var(--tata-blue)' }}>{percent}%</span>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        </div>

        {/* Dealer Graph — Spacing Fix */}
        <div className="card col-12">
          <div className="card-header"><div className="card-title"><Building2 size={16} /> Telecaller Performance by Dealer</div></div>
          <div className="card-body" style={{ padding: '24px 10px' }}>
            <ResponsiveContainer width="100%" height={320}>
              <BarChart data={chartData.slice(0, 10)} margin={{ top: 20, right: 30, left: 10, bottom: 60 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="var(--grey-50)" />
                <XAxis dataKey="dealer_name" tick={{ fontSize: 10, fontWeight: 700 }} angle={-30} textAnchor="end" interval={0} dy={15} />
                <YAxis tick={{ fontSize: 11 }} />
                <Tooltip />
                <Legend verticalAlign="top" height={40} wrapperStyle={{ fontSize: '0.85rem', fontWeight: 600 }} />
                <Bar dataKey="total_leads" name="Total Leads" fill="#003A8F" radius={[4, 4, 0, 0]} barSize={32} />
                <Bar dataKey="completed" name="Completed" fill="#12B76A" radius={[4, 4, 0, 0]} barSize={32} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Campaign Metrics Summary — Professional High-Density Table */}
        <div className="card col-6" style={{ border: 'none', boxShadow: '0 4px 20px rgba(0,0,0,0.05)', borderRadius: 18, alignSelf: 'start' }}>
          <div className="card-header" style={{ padding: '18px 20px', borderBottom: '1px solid var(--grey-50)' }}>
            <div className="card-title" style={{ fontSize: '0.95rem', fontWeight: 800, display: 'flex', alignItems: 'center', gap: 10 }}>
              <TrendingUp size={18} color="var(--tata-blue)" /> Campaign Metrics
            </div>
          </div>
          <div className="card-body" style={{ padding: 0 }}>
            {/* TABLE HEADER */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr 1fr', padding: '12px 20px', background: 'var(--grey-50)', borderBottom: '1px solid var(--grey-100)', fontSize: '0.65rem', fontWeight: 800, textTransform: 'uppercase', color: 'var(--grey-400)', letterSpacing: '0.5px' }}>
              <span>Date</span>
              <span>Ad Spend</span>
              <span style={{ textAlign: 'center' }}>Leads</span>
              <span style={{ textAlign: 'right' }}>CPL</span>
            </div>
            
            <div className="metrics-table-body" style={{ maxHeight: 420, overflowY: 'auto' }}>
              {(data?.campaign_metrics || []).map((m, i) => {
                const cpl = m.total_leads > 0 ? (parseFloat(m.ad_spend) / m.total_leads).toFixed(0) : 0;
                return (
                  <div key={i} style={{ 
                    display: 'grid', gridTemplateColumns: '1fr 1fr 1fr 1fr', padding: '14px 20px', 
                    borderBottom: '1px solid var(--grey-50)', alignItems: 'center',
                    background: i % 2 === 0 ? '#fff' : 'var(--grey-50)66'
                  }}>
                    <div style={{ display: 'flex', flexDirection: 'column' }}>
                      <span style={{ fontWeight: 800, fontSize: '0.85rem', color: 'var(--grey-900)' }}>{m.date_label}</span>
                      <span style={{ fontSize: '0.65rem', color: 'var(--grey-400)' }}>Daily</span>
                    </div>
                    <span style={{ fontWeight: 700, color: 'var(--tata-blue)', fontSize: '0.88rem' }}>₹{parseFloat(m.ad_spend).toLocaleString()}</span>
                    <div style={{ textAlign: 'center' }}>
                      <span className="badge badge-blue-soft" style={{ fontSize: '0.68rem', fontWeight: 800, padding: '4px 10px', borderRadius: 6 }}>{m.total_leads}</span>
                    </div>
                    <span style={{ textAlign: 'right', fontWeight: 800, color: 'var(--green-600)', fontSize: '0.85rem' }}>₹{cpl}</span>
                  </div>
                );
              })}
              {(!data?.campaign_metrics || data?.campaign_metrics.length === 0) && (
                <div style={{ textAlign: 'center', padding: 30, color: 'var(--grey-400)', fontSize: '0.8rem' }}>No campaign data for this range</div>
              )}
            </div>
            {/* Small Footer to ensure card looks complete */}
            <div style={{ padding: '12px 20px', borderTop: '1px solid var(--grey-50)', background: 'var(--grey-50)44', textAlign: 'center' }}>
               <span style={{ fontSize: '0.7rem', color: 'var(--grey-400)', fontWeight: 600 }}>End of report</span>
            </div>
          </div>
        </div>

        {/* Recent Dealer Activity — Streamlined Feed Style */}
        <div className="card col-6">
          <div className="card-header"><div className="card-title"><Activity size={16} /> Recent Dealer Activity</div></div>
          <div className="card-body" style={{ padding: 0 }}>
            <div className="activity-feed">
              {(data?.recent_activity || []).map((r, i) => (
                <div key={i} className="activity-item" style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '14px 20px', borderBottom: i === 9 ? 'none' : '1px solid var(--grey-50)' }}>
                  <div style={{ width: 36, height: 36, borderRadius: '50%', background: 'var(--grey-50)', color: 'var(--tata-blue)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.9rem', fontWeight: 800, flexShrink: 0, border: '1px solid var(--grey-100)' }}>
                    {r.full_name.charAt(0)}
                  </div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <span style={{ fontWeight: 700, fontSize: '0.88rem', color: 'var(--grey-900)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{r.full_name}</span>
                      <span className={`badge status-${(r.status || '').toLowerCase().replace(/ /g, '-')}`} style={{ fontSize: '0.65rem' }}>{r.status}</span>
                    </div>
                    <div style={{ fontSize: '0.75rem', color: 'var(--grey-500)', marginTop: 2, display: 'flex', alignItems: 'center', gap: 4 }}>
                      <Building2 size={10} /> {r.dealer_name.replace(/\s*Partner\s*/gi, '')}
                    </div>
                  </div>
                </div>
              ))}
              {(!data?.recent_activity || data?.recent_activity.length === 0) && (
                <div style={{ textAlign: 'center', padding: 40, color: 'var(--grey-400)' }}>No activity found</div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

