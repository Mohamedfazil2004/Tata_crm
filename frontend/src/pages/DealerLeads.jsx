import React, { useState, useEffect, useCallback } from 'react';
import { Search, Edit2, ChevronLeft, ChevronRight, X, Phone, Calendar, Clock } from 'lucide-react';
import api from '../api/client';
import toast from 'react-hot-toast';
import { useAuth } from '../context/AuthContext';

const STATUS_OPTIONS = ['In Progress', 'On Call', 'Completed'];
const REMARK_OPTIONS = [
  'Not Interested', 'Already Purchased', 'Loan Not Approved', 'Follow-up Needed',
  'Demo Scheduled', 'Quotation Given', 'Negotiation in Progress', 'Deal Confirmed',
  'Invalid Lead', 'Switched Off', 'Not Reachable', 'Other',
];

function EditModal({ lead, onClose, onSave }) {
  const [form, setForm] = useState({
    follow_up_date: lead.follow_up_date ? new Date(lead.follow_up_date).toLocaleDateString('en-CA') : '',
    voice_of_customer: lead.voice_of_customer || '',
    consolidated_remark: lead.consolidated_remark || '',
    status: lead.status || 'In Progress',
  });
  const [saving, setSaving] = useState(false);
  const today = new Date().toLocaleDateString('en-CA');

  const handleSave = async () => {
    if (form.status === 'Completed' && !form.consolidated_remark) {
      toast.error('Consolidated remarks are required when status is Completed');
      return;
    }

    if (form.status !== 'Completed' && form.follow_up_date && form.follow_up_date < today) {
      toast.error('Follow-up date must be today or a future date');
      return;
    }

    setSaving(true);
    try {
      await api.put(`/leads/${lead.id}`, form);
      toast.success('Lead updated');
      onSave();
      onClose();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Update failed');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="modal-overlay" onClick={e => e.target === e.currentTarget && onClose()}>
      <div className="modal">
        <div className="modal-header">
          <h3>Update Lead</h3>
          <button className="modal-close" onClick={onClose}><X size={16} /></button>
        </div>
        <div className="modal-body">
          <div style={{ background: 'var(--tata-blue-50)', borderRadius: 8, padding: '12px 16px', marginBottom: 16, border: '1px solid var(--tata-blue-pale)' }}>
            <div style={{ fontSize: '0.95rem', fontWeight: 600, color: 'var(--grey-900)', marginBottom: 4 }}>{lead.full_name}</div>
            <div style={{ display: 'flex', gap: 16, fontSize: '0.82rem', color: 'var(--grey-500)' }}>
              <span>📍 {lead.location}</span>
              <span>🚗 {lead.model}</span>
              <span>📞 {lead.phone_number}</span>
            </div>
          </div>

          <div className="form-group">
            <label className="form-label">Status *</label>
            <select className="form-select" value={form.status} onChange={e => setForm(f => ({ ...f, status: e.target.value }))}>
              {STATUS_OPTIONS.map(s => <option key={s}>{s}</option>)}
            </select>
          </div>

          <div className="form-group">
            <label className="form-label">Follow-up Date</label>
            <input type="date" className="form-control" value={form.follow_up_date}
              min={today}
              onChange={e => setForm(f => ({ ...f, follow_up_date: e.target.value }))} />
          </div>

          <div className="form-group">
            <label className="form-label">Voice of Customer</label>
            <textarea className="form-control" rows={3}
              placeholder="Describe the conversation, customer interest, objections..."
              value={form.voice_of_customer}
              onChange={e => setForm(f => ({ ...f, voice_of_customer: e.target.value }))} />
          </div>

          <div className="form-group">
            <label className="form-label">
              Consolidated Remarks {form.status === 'Completed' && <span style={{ color: 'var(--red-500)' }}>*</span>}
            </label>
            <select className="form-select" value={form.consolidated_remark}
              onChange={e => setForm(f => ({ ...f, consolidated_remark: e.target.value }))}>
              <option value="">— Select —</option>
              {REMARK_OPTIONS.map(r => <option key={r}>{r}</option>)}
            </select>
            {form.status === 'Completed' && !form.consolidated_remark && (
              <div style={{ fontSize: '0.78rem', color: 'var(--red-500)', marginTop: 4 }}>Required when status is Completed</div>
            )}
          </div>
        </div>
        <div className="modal-footer">
          <button className="btn btn-secondary" onClick={onClose}>Cancel</button>
          <button className="btn btn-primary" onClick={handleSave} disabled={saving}>
            {saving ? 'Saving...' : 'Save Changes'}
          </button>
        </div>
      </div>
    </div>
  );
}

function LeadTable({ leads, onEdit, loading, emptyMessage }) {
  if (loading) return <div className="loading-overlay"><div className="spinner" /></div>;
  if (leads.length === 0) return <div className="empty-state" style={{ padding: '24px' }}><p>{emptyMessage}</p></div>;

  return (
    <table className="data-table">
      <thead>
        <tr>
          <th style={{ width: '50px' }}>S.No</th>
          <th>Name</th>
          <th>Location</th>
          <th>Model</th>
          <th>Phone Number</th>
          <th>Voice of Customer</th>
          <th>Remarks</th>
          <th>Status</th>
          <th>Action</th>
        </tr>
      </thead>
      <tbody>
        {leads.map((l, i) => (
          <tr key={l.id}>
            <td style={{ color: 'var(--grey-400)', fontSize: '0.8rem' }}>{i + 1}</td>
            <td style={{ fontWeight: 600, color: 'var(--tata-blue)' }}>{l.full_name}</td>
            <td style={{ fontSize: '0.82rem' }}>{l.location}</td>
            <td style={{ fontSize: '0.8rem', color: 'var(--grey-500)' }}>{l.model}</td>
            <td>
              <a href={`tel:${l.phone_number}`} style={{ color: 'var(--tata-blue)', fontWeight: 500, display: 'flex', alignItems: 'center', gap: 4 }}>
                <Phone size={13} /> {l.phone_number}
              </a>
            </td>
            <td style={{ fontSize: '0.8rem', maxWidth: 200 }}>
              <div style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }} title={l.voice_of_customer}>
                {l.voice_of_customer || '—'}
              </div>
            </td>
            <td style={{ fontSize: '0.8rem' }}>{l.consolidated_remark || '—'}</td>
            <td>
              <span className={`badge status-${l.status?.toLowerCase().replace(/ /g, '-')}`} style={{ fontSize: '0.7rem' }}>
                {l.status}
              </span>
            </td>
            <td>
              <button className="btn btn-primary btn-sm" onClick={() => onEdit(l)} style={{ padding: '4px 8px' }}>
                <Edit2 size={12} />
              </button>
            </td>
          </tr>
        ))}
      </tbody>
    </table>
  );
}

export default function DealerLeads() {
  const { user } = useAuth();
  const [leads, setLeads] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [editLead, setEditLead] = useState(null);

  const today = new Date().toISOString().split('T')[0];

  const fetchLeads = useCallback(async () => {
    setLoading(true);
    try {
      // Fetch all dealer leads for partitioning (or a larger limit for now)
      const params = { limit: 200, search, status: statusFilter };
      const res = await api.get('/leads', { params });
      setLeads(res.data.data);
    } catch {
      toast.error('Failed to load leads');
    } finally {
      setLoading(false);
    }
  }, [search, statusFilter]);

  useEffect(() => { fetchLeads(); }, [fetchLeads]);

  // Partition leads
  const activeLeads = leads.filter(l => {
    const lDate = l.lead_date?.split('T')[0];
    const fDate = l.follow_up_date?.split('T')[0];
    
    if (l.status === 'Completed') return false;
    
    // Future follow-up leads go to the other table
    const isFutureFollowup = fDate && fDate > today;
    if (isFutureFollowup) return false;

    // Everything else (Today's, Past Pending)
    return true;
  });

  const followupLeads = leads.filter(l => {
    const fDate = l.follow_up_date?.split('T')[0];
    return l.status !== 'Completed' && fDate && fDate > today;
  });

  const completedLeads = leads.filter(l => l.status === 'Completed');

  return (
    <div style={{ maxWidth: '1400px', margin: '0 auto' }}>
      <div className="page-header" style={{ marginBottom: 20 }}>
        <div className="page-header-left">
          <h2 style={{ fontSize: '1.25rem', display: 'flex', alignItems: 'center', gap: 10 }}>
            My Leads
            <span style={{ fontSize: '0.8rem', fontWeight: 400, color: 'var(--grey-400)', background: 'var(--grey-100)', padding: '2px 8px', borderRadius: 4 }}>
              {user?.dealer_name}
            </span>
          </h2>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, background: 'var(--white)', padding: '6px 12px', borderRadius: 8, border: '1px solid var(--grey-100)', boxShadow: 'var(--shadow-xs)' }}>
          <Clock size={16} style={{ color: 'var(--tata-blue)' }} />
          <span style={{ fontSize: '0.9rem', fontWeight: 600, color: 'var(--grey-700)' }}>
            {new Date().toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })}
          </span>
        </div>
      </div>

      <div className="filters-row" style={{ marginBottom: 20, justifyContent: 'space-between' }}>
        <div className="search-bar" style={{ flex: 1, maxWidth: 400 }}>
          <Search size={16} className="search-icon" />
          <input placeholder="Search name, phone, location..." value={search} onChange={e => setSearch(e.target.value)} />
          {search && <button onClick={() => setSearch('')} style={{ border: 'none', background: 'none', cursor: 'pointer' }}><X size={14} /></button>}
        </div>
        <select className="form-select" style={{ width: 160 }} value={statusFilter} onChange={e => setStatusFilter(e.target.value)}>
          <option value="">All Status</option>
          {STATUS_OPTIONS.map(s => <option key={s}>{s}</option>)}
        </select>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 32 }}>
        {/* Main Leads Table */}
        <section>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 12 }}>
            <Calendar size={18} style={{ color: 'var(--tata-blue)' }} />
            <h3 style={{ fontSize: '1rem', color: 'var(--grey-800)' }}>Today's & Pending Leads</h3>
            <span className="badge badge-blue">{activeLeads.length}</span>
          </div>
          <div className="table-wrapper" style={{ boxShadow: 'var(--shadow-sm)', border: 'none' }}>
            <LeadTable 
              leads={activeLeads} 
              onEdit={setEditLead} 
              loading={loading} 
              emptyMessage="No today's or pending leads found"
            />
          </div>
        </section>

        {/* Follow-up Table */}
        <section>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 12 }}>
            <Clock size={18} style={{ color: 'var(--orange-500)' }} />
            <h3 style={{ fontSize: '1rem', color: 'var(--grey-800)' }}>Future Follow-ups</h3>
            <span className="badge badge-yellow" style={{ background: 'var(--yellow-50)', color: 'var(--yellow-700)' }}>{followupLeads.length}</span>
          </div>
          <div className="table-wrapper" style={{ boxShadow: 'var(--shadow-sm)', border: 'none' }}>
            <LeadTable 
              leads={followupLeads} 
              onEdit={setEditLead} 
              loading={loading} 
              emptyMessage="No future follow-ups scheduled"
            />
          </div>
        </section>

        {/* Completed Table */}
        <section>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 12 }}>
            <div style={{ color: 'var(--green-500)', background: 'var(--green-50)', width: 24, height: 24, borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 12, fontWeight: 'bold' }}>✓</div>
            <h3 style={{ fontSize: '1rem', color: 'var(--grey-800)' }}>Completed Leads</h3>
            <span className="badge badge-green" style={{ background: 'var(--green-50)', color: 'var(--green-700)' }}>{completedLeads.length}</span>
          </div>
          <div className="table-wrapper" style={{ boxShadow: 'var(--shadow-sm)', border: 'none', opacity: 0.9 }}>
            <LeadTable 
              leads={completedLeads} 
              onEdit={setEditLead} 
              loading={loading} 
              emptyMessage="No completed leads found"
            />
          </div>
        </section>
      </div>

      {editLead && <EditModal lead={editLead} onClose={() => setEditLead(null)} onSave={fetchLeads} />}
    </div>
  );
}
