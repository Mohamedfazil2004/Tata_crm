import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  Building2, Search, X, PieChart as PieIcon, 
  Users, Clock, CheckCircle, AlertCircle, 
  Calendar, TrendingUp, ChevronRight 
} from 'lucide-react';
import api from '../api/client';
import toast from 'react-hot-toast';

function KPIStatCard({ label, value, icon: Icon, color, isCritical }) {
  return (
    <div className={`stat-card ${isCritical ? 'critical' : ''}`} style={{
      borderLeft: isCritical ? '4px solid var(--red-500)' : 'none',
      background: isCritical ? 'rgba(240, 68, 56, 0.02)' : 'var(--white)'
    }}>
      <div className={`stat-icon ${color}`}>
        <Icon size={22} />
      </div>
      <div className="stat-content">
        <div className="stat-label">{label}</div>
        <div className="stat-value">{value?.toLocaleString() || 0}</div>
      </div>
    </div>
  );
}

export default function Dealers() {
  const navigate = useNavigate();
  const [dealers, setDealers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');

  useEffect(() => {
    fetchDealers();
  }, []);

  const fetchDealers = async () => {
    setLoading(true);
    try {
      const res = await api.get('/dealers');
      setDealers(res.data.data);
    } catch (err) {
      toast.error('Failed to load dealers');
    } finally {
      setLoading(false);
    }
  };

  const filtered = useMemo(() => {
    return dealers.filter(d => 
      d.dealer_name.toLowerCase().includes(search.toLowerCase())
    );
  }, [dealers, search]);

  const stats = useMemo(() => {
    return dealers.reduce((acc, d) => ({
      total: acc.total + (d.total_leads || 0),
      pending: acc.pending + (d.pending_leads || 0),
      completed: acc.completed + (d.completed_leads || 0),
      today: acc.today + (d.today_followups || 0),
      overdue: acc.overdue + (d.overdue_followups || 0)
    }), { total: 0, pending: 0, completed: 0, today: 0, overdue: 0 });
  }, [dealers]);

  const formatDate = (dateStr) => {
    if (!dateStr) return '—';
    return new Date(dateStr).toLocaleDateString('en-IN', {
      day: '2-digit', month: '2-digit', year: 'numeric'
    });
  };

  if (loading) return <div className="loading-overlay"><div className="spinner" /></div>;

  return (
    <div className="dealers-management">
      <div className="page-header">
        <div className="page-header-left">
          <h2>Dealer Management</h2>
          <p>Global oversight of dealer performance and follow-up metrics</p>
        </div>
        <div className="page-header-actions">
           <button className="btn btn-secondary" onClick={fetchDealers}><TrendingUp size={16} /> Refresh Analytics</button>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="stats-grid">
        <KPIStatCard label="Total Leads" value={stats.total} icon={Users} color="blue" />
        <KPIStatCard label="Total Pending" value={stats.pending} icon={Clock} color="orange" />
        <KPIStatCard label="Total Completed" value={stats.completed} icon={CheckCircle} color="green" />
        <KPIStatCard label="Today Follow-ups" value={stats.today} icon={Calendar} color="red" />
        <KPIStatCard label="Overdue Follow-ups" value={stats.overdue} icon={AlertCircle} color="red" isCritical={stats.overdue > 0} />
      </div>

      {/* Interface Row */}
      <div className="card" style={{ marginBottom: 20 }}>
        <div className="card-body" style={{ padding: '16px 20px', display: 'flex', alignItems: 'center', gap: 16 }}>
          <div className="search-bar" style={{ flex: 1, maxWidth: 350 }}>
            <Search size={16} className="search-icon" />
            <input 
              placeholder="Search by dealer name..." 
              value={search} 
              onChange={e => setSearch(e.target.value)} 
            />
            {search && <X size={14} style={{ cursor: 'pointer' }} onClick={() => setSearch('')} />}
          </div>
          
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginLeft: 'auto' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, background: 'var(--grey-50)', padding: '6px 12px', borderRadius: 8, border: '1px solid var(--grey-100)' }}>
              <span style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--grey-500)' }}>PERIOD:</span>
              <input type="date" className="form-control" style={{ width: 130, border: 'none', background: 'transparent', height: 30, fontSize: '0.8rem' }} value={dateFrom} onChange={e => setDateFrom(e.target.value)} />
              <span style={{ color: 'var(--grey-300)' }}>-</span>
              <input type="date" className="form-control" style={{ width: 130, border: 'none', background: 'transparent', height: 30, fontSize: '0.8rem' }} value={dateTo} onChange={e => setDateTo(e.target.value)} />
            </div>
          </div>
        </div>
      </div>

      <div className="table-wrapper">
        <table className="data-table">
          <thead>
            <tr>
              <th>S.No</th>
              <th>Dealer Name</th>
              <th style={{ textAlign: 'center' }}>Total Leads</th>
              <th style={{ textAlign: 'center' }}>Pending</th>
              <th style={{ textAlign: 'center' }}>Completed</th>
              <th style={{ textAlign: 'center' }}>Today</th>
              <th style={{ textAlign: 'center' }}>Upcoming</th>
              <th style={{ textAlign: 'center' }}>Overdue</th>
              <th>Last Follow-up</th>
              <th></th>
            </tr>
          </thead>
          <tbody>
            {filtered.map((d, i) => (
              <tr 
                key={d.id} 
                className="hover-row clickable-row" 
                onClick={() => navigate(`/dealers/${d.id}`)}
                style={{ cursor: 'pointer' }}
              >
                <td style={{ color: 'var(--grey-400)', fontSize: '0.8rem', fontWeight: 600 }}>{i + 1}</td>
                <td>
                   <div style={{ fontWeight: 700, color: 'var(--tata-blue)' }}>{d.dealer_name.replace(/\s*Dealer\s*Partner\s*/gi, '')}</div>
                   <div style={{ fontSize: '0.72rem', color: 'var(--grey-400)' }}>{d.contact_person || 'No Contact'}</div>
                </td>
                <td style={{ textAlign: 'center' }}>
                  <span className="badge badge-blue" style={{ minWidth: 40, justifyContent: 'center' }}>{d.total_leads || 0}</span>
                </td>
                <td style={{ textAlign: 'center' }}>
                  <span className="badge badge-yellow" style={{ minWidth: 40, justifyContent: 'center' }}>{d.pending_leads || 0}</span>
                </td>
                <td style={{ textAlign: 'center' }}>
                   <span className="badge badge-green" style={{ minWidth: 40, justifyContent: 'center' }}>{d.completed_leads || 0}</span>
                </td>
                <td style={{ textAlign: 'center' }}>
                   <span className="badge badge-red" style={{ minWidth: 40, background: 'rgba(240, 68, 56, 0.1)', color: 'var(--red-500)',  justifyContent: 'center' }}>{d.today_followups || 0}</span>
                </td>
                <td style={{ textAlign: 'center' }}>
                   <span className="badge" style={{ minWidth: 40, background: 'rgba(124, 58, 237, 0.1)', color: '#7C3AED', justifyContent: 'center' }}>{d.upcoming_followups || 0}</span>
                </td>
                <td style={{ textAlign: 'center' }}>
                   <span className="badge" style={{ 
                     minWidth: 40, 
                     background: d.overdue_followups > 0 ? 'rgba(180, 0, 0, 0.1)' : 'var(--grey-50)', 
                     color: d.overdue_followups > 0 ? '#B40000' : 'var(--grey-300)',
                     justifyContent: 'center',
                     gap: 4
                   }}>
                     {d.overdue_followups > 0 && <AlertCircle size={10} />}
                     {d.overdue_followups || 0}
                   </span>
                </td>
                <td style={{ fontSize: '0.82rem', color: 'var(--grey-500)' }}>{formatDate(d.last_followup)}</td>
                <td style={{ textAlign: 'right' }}><ChevronRight size={18} color="var(--grey-300)" /></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
