import React, { useState, useEffect, useCallback } from 'react';
import { Search, Filter, Edit2, ChevronLeft, ChevronRight, X, Building2, AlertCircle } from 'lucide-react';
import api from '../api/client';
import toast from 'react-hot-toast';
import { useAuth } from '../context/AuthContext';

function EditDealerModal({ lead, dealers, onClose, onSave }) {
  const [selectedDealerId, setSelectedDealerId] = useState(lead.dealer_id || '');
  const [newLocation, setNewLocation] = useState(lead.location);
  const [saving, setSaving] = useState(false);
  const [fetchingLoc, setFetchingLoc] = useState(false);

  useEffect(() => {
    if (selectedDealerId && selectedDealerId !== lead.dealer_id) {
      setFetchingLoc(true);
      api.get(`/dealers/${selectedDealerId}`)
        .then(res => {
          if (res.data.data.districts && res.data.data.districts.length > 0) {
            const rawDist = res.data.data.districts[0].district;
            const formattedDist = rawDist.split('_').map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(' ');
            setNewLocation(formattedDist);
          } else {
            setNewLocation('Others');
          }
        })
        .finally(() => setFetchingLoc(false));
    } else if (selectedDealerId === lead.dealer_id) {
      setNewLocation(lead.location);
    }
  }, [selectedDealerId, lead.dealer_id, lead.location]);

  const handleSave = async () => {
    if (!selectedDealerId) {
      toast.error('Please select a dealer');
      return;
    }
    setSaving(true);
    try {
      await api.put(`/leads/${lead.id}`, { dealer_id: selectedDealerId });
      toast.success('Lead reassigned and location updated');
      onSave();
      onClose();
    } catch (err) {
      toast.error('Reassignment failed');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="modal-overlay" onClick={e => e.target === e.currentTarget && onClose()}>
      <div className="modal" style={{ maxWidth: 450, borderRadius: 16, overflow: 'hidden' }}>
        <div className="modal-header" style={{ background: 'var(--tata-blue)', color: '#fff', padding: '20px 24px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <div style={{ background: 'rgba(255,255,255,0.2)', padding: 8, borderRadius: 10 }}>
              <Edit2 size={20} />
            </div>
            <div>
              <h3 style={{ margin: 0, fontSize: '1.1rem' }}>Reassign Lead</h3>
              <p style={{ margin: 0, fontSize: '0.75rem', opacity: 0.8 }}>Handover to specialized dealer partner</p>
            </div>
          </div>
          <button className="modal-close" onClick={onClose} style={{ color: '#fff' }}><X size={20} /></button>
        </div>
        <div className="modal-body" style={{ padding: 24 }}>
          <div style={{ background: 'var(--grey-50)', padding: 16, borderRadius: 12, marginBottom: 24, border: '1px solid var(--grey-100)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 12 }}>
              <div>
                <p style={{ fontSize: '0.7rem', color: 'var(--grey-500)', margin: '0 0 4px 0', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Lead Name</p>
                <p style={{ fontWeight: 700, margin: 0, color: 'var(--grey-900)' }}>{lead.full_name}</p>
              </div>
              <div style={{ textAlign: 'right' }}>
                <p style={{ fontSize: '0.7rem', color: 'var(--grey-500)', margin: '0 0 4px 0', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Current Dealer</p>
                <span className="badge badge-blue" style={{ fontSize: '0.7rem' }}>{lead.dealer_name}</span>
              </div>
            </div>
            <div style={{ borderTop: '1px dashed var(--grey-200)', paddingTop: 12 }}>
              <p style={{ fontSize: '0.7rem', color: 'var(--grey-500)', margin: '0 0 4px 0', textTransform: 'uppercase', letterSpacing: '0.5px' }}>{selectedDealerId !== lead.dealer_id ? 'Target Location' : 'Current Location'}</p>
              <p style={{ fontWeight: 600, margin: 0, fontSize: '0.9rem', color: selectedDealerId !== lead.dealer_id ? 'var(--tata-blue)' : 'inherit' }}>
                {fetchingLoc ? 'Detecting...' : newLocation}
              </p>
            </div>
          </div>

          <div className="form-group">
            <label className="form-label" style={{ fontWeight: 600, color: 'var(--grey-700)' }}>Assign New Dealer Partner</label>
            <div style={{ position: 'relative' }}>
              <select 
                className="form-select" 
                value={selectedDealerId} 
                onChange={e => setSelectedDealerId(e.target.value)}
                style={{ height: 48, borderRadius: 10, border: '2px solid var(--grey-100)', paddingLeft: 12 }}
              >
                <option value="">— Select Dealer —</option>
                {dealers.map(d => (
                  <option key={d.id} value={d.id}>{d.dealer_name}</option>
                ))}
              </select>
            </div>
            <p style={{ fontSize: '0.75rem', color: 'var(--grey-400)', marginTop: 8 }}>
              <AlertCircle size={12} style={{ verticalAlign: 'middle', marginRight: 4 }} />
              Updating the dealer will automatically update the lead's location to the dealer's primary district.
            </p>
          </div>
        </div>
        <div className="modal-footer" style={{ padding: '16px 24px', background: 'var(--grey-50)', borderTop: '1px solid var(--grey-100)' }}>
          <button className="btn btn-secondary" onClick={onClose} style={{ borderRadius: 8, fontWeight: 600 }}>Cancel</button>
          <button 
            className="btn btn-primary" 
            onClick={handleSave} 
            disabled={saving || fetchingLoc}
            style={{ borderRadius: 8, fontWeight: 600, padding: '10px 24px', boxShadow: '0 4px 12px rgba(0, 58, 143, 0.2)' }}
          >
            {saving ? (
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <div className="spinner" style={{ width: 14, height: 14, borderWidth: 2 }} />
                <span>Reassigning...</span>
              </div>
            ) : 'Update Assignment'}
          </button>
        </div>
      </div>
    </div>
  );
}

export default function MasterLeads() {
  const { user } = useAuth();
  const isAdmin = user?.role === 'admin';
  const [leads, setLeads] = useState([]);
  const [pagination, setPagination] = useState({ total: 0, page: 1, limit: 50, total_pages: 1 });
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [dealerFilter, setDealerFilter] = useState('');
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');
  const [dealers, setDealers] = useState([]);
  const [editLead, setEditLead] = useState(null);

  useEffect(() => {
    api.get('/dealers').then(r => setDealers(r.data.data)).catch(() => {});
  }, []);

  const fetchLeads = useCallback(async (page = 1) => {
    setLoading(true);
    try {
      const params = { page, limit: 50, search, status: statusFilter, date_from: dateFrom, date_to: dateTo, dealer_id: dealerFilter };
      const res = await api.get('/leads', { params });
      setLeads(res.data.data);
      setPagination(res.data.pagination);
    } catch (err) {
      toast.error('Failed to load leads');
    } finally {
      setLoading(false);
    }
  }, [search, statusFilter, dateFrom, dateTo, dealerFilter]);

  useEffect(() => { fetchLeads(1); }, [fetchLeads]);

  const sno = (i) => (pagination.page - 1) * pagination.limit + i + 1;

  const formatDate = (dateStr) => {
    if (!dateStr) return '—';
    try {
      const date = new Date(dateStr.split('T')[0]);
      return date.toLocaleDateString('en-IN', { day: '2-digit', month: '2-digit', year: 'numeric' });
    } catch (e) { return dateStr; }
  };

  return (
    <div>
      <div className="page-header">
        <div className="page-header-left">
          <h2>Master Leads</h2>
          <p>Global lead repository for administrative oversight</p>
        </div>
      </div>

      <div className="filters-row" style={{ 
        background: '#fff', 
        padding: '20px', 
        borderRadius: '16px', 
        boxShadow: '0 4px 15px rgba(0,0,0,0.03)', 
        marginBottom: '24px',
        display: 'flex',
        alignItems: 'center',
        gap: '12px',
        border: '1px solid var(--grey-100)',
        flexWrap: 'nowrap'
      }}>
        <div className="search-bar" style={{ flex: '1', maxWidth: '350px', background: 'var(--grey-50)', height: '42px' }}>
          <Search size={16} className="search-icon" />
          <input 
            placeholder="Search name, phone, location..." 
            value={search}
            onChange={e => setSearch(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && fetchLeads(1)} 
          />
          {search && <button onClick={() => setSearch('')} style={{ border: 'none', background: 'none', cursor: 'pointer', color: 'var(--grey-400)', padding: '0' }}><X size={14} /></button>}
        </div>
        
        <select className="form-select" style={{ width: '140px', height: '42px', background: 'var(--grey-50)', borderRadius: '10px' }} value={statusFilter} onChange={e => setStatusFilter(e.target.value)}>
          <option value="">All Status</option>
          {['In Progress', 'On Call', 'Completed'].map(s => <option key={s} value={s}>{s}</option>)}
        </select>

        <select className="form-select" style={{ width: '180px', height: '42px', background: 'var(--grey-50)', borderRadius: '10px' }} value={dealerFilter} onChange={e => setDealerFilter(e.target.value)}>
          <option value="">All Dealer Partners</option>
          {dealers.map(d => (
            <option key={d.id} value={d.id}>{d.dealer_name.replace(/\s*Dealer\s*Partner\s*/gi, '')}</option>
          ))}
        </select>

        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', background: 'var(--grey-50)', padding: '0 12px', borderRadius: '10px', border: '1px solid var(--grey-200)', height: '42px' }}>
          <span style={{ fontSize: '0.7rem', fontWeight: 600, color: 'var(--grey-400)', textTransform: 'uppercase' }}>Period</span>
          <input type="date" className="form-control" style={{ width: '125px', border: 'none', background: 'transparent', height: '38px', fontSize: '0.8rem' }} value={dateFrom} onChange={e => setDateFrom(e.target.value)} />
          <span style={{ color: 'var(--grey-200)' }}>|</span>
          <input type="date" className="form-control" style={{ width: '125px', border: 'none', background: 'transparent', height: '38px', fontSize: '0.8rem' }} value={dateTo} onChange={e => setDateTo(e.target.value)} />
        </div>

        <button 
          className="btn btn-primary btn-apply" 
          onClick={() => fetchLeads(1)}
          style={{ 
            height: '42px',
            padding: '0 24px', 
            fontWeight: 700, 
            borderRadius: '10px',
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            background: 'var(--tata-blue)',
            border: 'none',
            fontSize: '0.85rem'
          }}
        >
          <Filter size={16} /> Apply Filter
        </button>
      </div>

      {/* Table */}
      <div className="table-wrapper" style={{ borderRadius: 12, border: '1px solid var(--grey-100)', overflow: 'hidden' }}>
        {loading ? (
          <div className="loading-overlay" style={{ background: 'rgba(255,255,255,0.7)' }}><div className="spinner" /></div>
        ) : leads.length === 0 ? (
          <div className="empty-state" style={{ padding: 60 }}>
            <div className="empty-state-icon" style={{ background: 'var(--grey-50)', color: 'var(--grey-300)' }}><Search size={32} /></div>
            <h3>No Leads Found</h3>
            <p>We couldn't find any leads matching your criteria.</p>
          </div>
        ) : (
          <table className="data-table">
            <thead>
              <tr style={{ background: 'var(--grey-50)' }}>
                <th>S.No</th>
                <th>Date</th>
                <th>Lead Information</th>
                <th>Vehicle & Location</th>
                <th>Assigned Dealer Partner</th>
                {isAdmin && <th style={{ textAlign: 'right' }}>Actions</th>}
              </tr>
            </thead>
            <tbody>
              {leads.map((l, i) => (
                <tr key={l.id} className="hover-row">
                  <td style={{ color: 'var(--grey-400)', fontSize: '0.75rem', fontWeight: 600 }}>{sno(i)}</td>
                  <td style={{ fontSize: '0.8rem', whiteSpace: 'nowrap', color: 'var(--grey-600)' }}>{formatDate(l.lead_date)}</td>
                  <td>
                    <div>
                      <div style={{ fontWeight: 700, color: 'var(--grey-900)', fontSize: '0.9rem' }}>{l.full_name}</div>
                      <div style={{ fontSize: '0.8rem', marginTop: 2 }}>
                        <a href={`tel:${l.phone_number}`} style={{ color: 'var(--tata-blue)', fontWeight: 500 }}>{l.phone_number}</a>
                      </div>
                    </div>
                  </td>
                  <td>
                    <div>
                      <div style={{ fontSize: '0.82rem', fontWeight: 600, color: 'var(--grey-700)' }}>{l.model}</div>
                      <div style={{ fontSize: '0.75rem', color: 'var(--grey-400)', display: 'flex', alignItems: 'center', gap: 4 }}>
                        <Building2 size={12} /> {l.location}
                      </div>
                    </div>
                  </td>
                  <td>
                    <span className="badge badge-blue-soft" style={{ background: 'rgba(0, 58, 143, 0.05)', color: 'var(--tata-blue)', fontWeight: 600, fontSize: '0.75rem', border: '1px solid rgba(0, 58, 143, 0.1)' }}>
                      {l.dealer_name}
                    </span>
                  </td>
                  {isAdmin && (
                    <td style={{ textAlign: 'right' }}>
                      <button 
                        className="btn-edit-action" 
                        onClick={() => setEditLead(l)}
                        title="Reassign Dealer"
                        style={{
                          background: 'none',
                          border: 'none',
                          color: 'var(--tata-blue)',
                          cursor: 'pointer',
                          padding: '8px',
                          borderRadius: '8px',
                          transition: 'all 0.2s',
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: 6,
                          fontSize: '0.8rem',
                          fontWeight: 600
                        }}
                      >
                        <Edit2 size={14} /> <span>Reassign</span>
                      </button>
                    </td>
                  )}
                </tr>
              ))}
            </tbody>
          </table>
        )}

        {/* Pagination */}
        {pagination.total_pages > 1 && (
          <div className="pagination">
            <span className="pagination-info">
              Showing {((pagination.page - 1) * pagination.limit) + 1}–{Math.min(pagination.page * pagination.limit, pagination.total)} of {pagination.total.toLocaleString()} leads
            </span>
            <div className="pagination-controls">
              <button className="page-btn" disabled={pagination.page <= 1} onClick={() => fetchLeads(pagination.page - 1)}>
                <ChevronLeft size={14} />
              </button>
              {Array.from({ length: Math.min(5, pagination.total_pages) }, (_, i) => {
                const pg = Math.max(1, pagination.page - 2) + i;
                if (pg > pagination.total_pages) return null;
                return <button key={pg} className={`page-btn${pg === pagination.page ? ' active' : ''}`} onClick={() => fetchLeads(pg)}>{pg}</button>;
              })}
              <button className="page-btn" disabled={pagination.page >= pagination.total_pages} onClick={() => fetchLeads(pagination.page + 1)}>
                <ChevronRight size={14} />
              </button>
            </div>
          </div>
        )}
      </div>

      {editLead && (
        <EditDealerModal 
          lead={editLead} 
          dealers={dealers} 
          onClose={() => setEditLead(null)} 
          onSave={() => fetchLeads(pagination.page)} 
        />
      )}
    </div>
  );
}
