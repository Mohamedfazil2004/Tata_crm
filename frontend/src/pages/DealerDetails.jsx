import React, { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  ChevronLeft, Search, Filter, Calendar,
  Phone, User, MessageSquare, Clock,
  AlertCircle, TrendingUp, MoreVertical, X
} from 'lucide-react';
import api from '../api/client';
import toast from 'react-hot-toast';

export default function DealerDetails() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [dealer, setDealer] = useState(null);
  const [leads, setLeads] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [priorityFilter, setPriorityFilter] = useState('');
  const [dateRange, setDateRange] = useState({ from: '', to: '' });

  const fetchDealerData = useCallback(async () => {
    setLoading(true);
    try {
      const dRes = await api.get(`/dealers/${id}`);
      setDealer(dRes.data.data);

      const params = {
        dealer_id: id,
        search,
        status: statusFilter,
        priority: priorityFilter,
        date_from: dateRange.from,
        date_to: dateRange.to,
        limit: 100
      };

      const lRes = await api.get('/leads', { params });
      setLeads(lRes.data.data);
    } catch (err) {
      toast.error('Failed to load dealer details');
    } finally {
      setLoading(false);
    }
  }, [id, search, statusFilter, dateRange]);

  useEffect(() => {
    fetchDealerData();
  }, [fetchDealerData]);

  const formatDate = (dateStr) => {
    if (!dateStr) return '—';
    return new Date(dateStr).toLocaleDateString('en-IN', {
      day: '2-digit', month: 'short', year: 'numeric'
    });
  };

  const priorityBadge = (p) => {
    const colors = { Hot: 'red', Warm: 'yellow', Cold: 'blue' };
    const color = colors[p] || 'grey';
    return <span className={`badge badge-${color}`}>{p || 'Warm'}</span>;
  };

  return (
    <div className="dealer-details-page">
      <div className="page-header">
        <div className="page-header-left">
          <button className="btn btn-secondary btn-sm" onClick={() => navigate('/dealers')} style={{ marginBottom: 12, padding: '6px 10px' }}>
            <ChevronLeft size={16} /> Back to Dealers
          </button>
          <h2>{dealer?.dealer_name || 'Dealer'} Leads</h2>
          <p>Detailed performance and lead tracking for this partner</p>
        </div>
      </div>

      {/* Filters Row */}
      <div className="card" style={{ marginBottom: 20 }}>
        <div className="card-body" style={{ padding: '16px 20px', display: 'flex', alignItems: 'center', gap: 12, flexWrap: 'wrap' }}>
          <div className="search-bar" style={{ flex: '1 1 300px', maxWidth: 400 }}>
            <Search size={16} className="search-icon" />
            <input
              placeholder="Search by name, phone..."
              value={search}
              onChange={e => setSearch(e.target.value)}
            />
          </div>

          <select className="form-select" style={{ width: 150 }} value={statusFilter} onChange={e => setStatusFilter(e.target.value)}>
            <option value="">All Status</option>
            <option value="New">New</option>
            <option value="In Progress">In Progress</option>
            <option value="On Call">On Call</option>
            <option value="Completed">Completed</option>
          </select>

          <div style={{ display: 'flex', alignItems: 'center', gap: 8, background: 'var(--white)', padding: '0 12px', borderRadius: 8, border: '1px solid var(--grey-200)', height: 42 }}>
            <Calendar size={14} color="var(--grey-400)" />
            <input type="date" className="form-control" style={{ width: 130, border: 'none', background: 'transparent', fontSize: '0.82rem' }} value={dateRange.from} onChange={e => setDateRange(prev => ({ ...prev, from: e.target.value }))} />
            <span style={{ color: 'var(--grey-300)' }}>-</span>
            <input type="date" className="form-control" style={{ width: 130, border: 'none', background: 'transparent', fontSize: '0.82rem' }} value={dateRange.to} onChange={e => setDateRange(prev => ({ ...prev, to: e.target.value }))} />
          </div>

          <button className="btn btn-primary" onClick={fetchDealerData}>Apply</button>
        </div>
      </div>

      <div className="table-wrapper">
        {loading ? (
          <div className="loading-overlay"><div className="spinner" /></div>
        ) : leads.length === 0 ? (
          <div className="empty-state">
            <div className="empty-state-icon"><User size={32} /></div>
            <h3>No Leads Found</h3>
            <p>No leads match your current filter criteria for this dealer.</p>
          </div>
        ) : (
          <table className="data-table">
            <thead>
              <tr>
                <th>Lead ID</th>
                <th>Customer Name</th>
                <th>Phone Number</th>
                <th>Status</th>
                <th>Next Follow-up</th>
                <th>Last Contacted</th>
                <th>Remarks</th>
              </tr>
            </thead>
            <tbody>
              {leads.map(l => (
                <tr key={l.id} className={l.follow_up_date && new Date(l.follow_up_date) < new Date() && l.status !== 'Completed' ? 'overdue-row' : ''} style={{
                  background: l.follow_up_date && new Date(l.follow_up_date) < new Date() && l.status !== 'Completed' ? 'rgba(240, 68, 56, 0.03)' : 'inherit'
                }}>
                  <td style={{ fontWeight: 600, color: 'var(--grey-400)', fontSize: '0.75rem' }}>#{l.id}</td>
                  <td style={{ fontWeight: 700, color: 'var(--tata-blue)' }}>{l.full_name}</td>
                  <td>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                      <Phone size={12} color="var(--grey-400)" />
                      <a href={`tel:${l.phone_number}`} style={{ fontWeight: 500 }}>{l.phone_number}</a>
                    </div>
                  </td>
                  <td>
                    <span className={`badge status-${l.status?.toLowerCase().replace(/ /g, '-')}`}>
                      {l.status}
                    </span>
                  </td>
                  <td>
                    {l.follow_up_date && new Date(l.follow_up_date).toLocaleDateString('en-CA') > new Date().toLocaleDateString('en-CA') ? (
                      <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                        <Clock size={12} />
                        <span style={{ fontWeight: 500 }}>{formatDate(l.follow_up_date)}</span>
                      </div>
                    ) : (
                      <span style={{ color: 'var(--grey-300)' }}>—</span>
                    )}
                  </td>
                  <td>
                    <span style={{ fontSize: '0.8rem', color: 'var(--grey-500)' }}>{formatDate(l.last_contacted_date)}</span>
                  </td>
                  <td style={{ maxWidth: 200 }}>
                    <div style={{ fontSize: '0.8rem', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }} title={l.consolidated_remark}>
                      {l.consolidated_remark || '—'}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
