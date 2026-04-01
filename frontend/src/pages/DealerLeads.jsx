import React, { useState, useEffect, useCallback, useRef } from 'react';
import { Search, Edit2, X, Phone, Calendar, Clock, CheckCircle, Eye, User, MapPin, Truck, Filter, ChevronDown, MessageSquare, Image, Upload, TrendingUp } from 'lucide-react';
import api from '../api/client';
import toast from 'react-hot-toast';
import { useAuth } from '../context/AuthContext';

// Options Constants
const STATUS_OPTIONS_DEALER = ['In Progress', 'Completed'];
const REMARK_OPTIONS = [
  'Intrested / purchased within 30 days',
  'Intrested / purchased within 60 days',
  'Intrested / purchased within 90 days',
  'not intrested',
  'not reachable',
  'want second hand vehicle',
  'already purchased',
  'competitive vehicle'
];
const INTERESTED_REMARKS = [
  'Intrested / purchased within 30 days',
  'Intrested / purchased within 60 days',
  'Intrested / purchased within 90 days'
];
const DSE_OPTIONS = ['Ramesh', 'Sam', 'Srinivasan'];
const VISIT_OPTIONS = ['Visited', 'Test Drive Done'];
const INTEREST_OPTIONS = ['High', 'Medium', 'Low'];
const STAGE_OPTIONS = ['Visited', 'Negotiation', 'Quotation Given', 'Booking Done', 'Lost'];
const TIMELINE_OPTIONS = ['0–30 days', '30–60 days', '60–90 days'];

const modelMap = {
  'ace_cng_2.0': 'Ace Gold Diesel',
  'tata_intra_': 'Intra V70 Gold',
  'tata_intra_v30_gold': 'Intra V30 Gold',
};

function formatModel(model) {
  if (!model) return '—';
  return modelMap[model] || model.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
}

// MULTI-SELECT DROPDOWN
function MultiSelectFilter({ label, options, selected, onChange }) {
  const [isOpen, setIsOpen] = useState(false);
  const ref = useRef(null);
  const [search, setSearch] = useState('');

  useEffect(() => {
    const handleClick = (e) => { if (ref.current && !ref.current.contains(e.target)) setIsOpen(false); };
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, []);

  const toggle = (opt) => {
    const next = selected.includes(opt) ? selected.filter(s => s !== opt) : [...selected, opt];
    onChange(next);
  };

  const filtered = options.filter(o => o?.toLowerCase().includes(search.toLowerCase()));

  return (
    <div ref={ref} style={{ position: 'relative', display: 'inline-block' }}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        style={{ background: 'none', border: 'none', color: selected.length ? 'var(--tata-blue)' : 'var(--grey-400)', display: 'flex', alignItems: 'center', gap: 4, cursor: 'pointer', padding: '4px 8px', borderRadius: 6 }}
      >
        <Filter size={12} fill={selected.length ? 'var(--tata-blue)' : 'none'} />
        <span style={{ fontSize: '0.65rem', fontWeight: 700, textTransform: 'uppercase' }}>{label}</span>
        {selected.length > 0 && <span style={{ background: 'var(--tata-blue)', color: '#fff', fontSize: '0.6rem', padding: '0 5px', borderRadius: 10 }}>{selected.length}</span>}
      </button>

      {isOpen && (
        <div style={{ position: 'absolute', top: '100%', left: 0, zIndex: 200, background: '#fff', border: '1px solid var(--grey-100)', borderRadius: 12, boxShadow: 'var(--shadow-lg)', minWidth: 220, padding: 12, marginTop: 8 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8, paddingBottom: 6, borderBottom: '1px solid var(--grey-50)' }}>
            <span style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--grey-900)' }}>Filter {label}</span>
            <button onClick={() => onChange([])} style={{ background: 'none', border: 'none', color: 'var(--tata-blue)', fontSize: '0.7rem', fontWeight: 600, cursor: 'pointer' }}>Clear</button>
          </div>
          {options.length > 8 && (
            <div style={{ marginBottom: 8, display: 'flex', alignItems: 'center', background: 'var(--grey-50)', padding: '5px 8px', borderRadius: 7 }}>
              <Search size={13} style={{ color: 'var(--grey-400)' }} />
              <input type="text" placeholder={`Search ${label}...`} value={search} onChange={e => setSearch(e.target.value)} style={{ border: 'none', background: 'none', fontSize: '0.75rem', paddingLeft: 7, width: '100%', outline: 'none' }} />
            </div>
          )}
          <div style={{ maxHeight: 200, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: 3 }}>
            {filtered.map(opt => (
              <label key={opt} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '7px 10px', borderRadius: 6, cursor: 'pointer', background: selected.includes(opt) ? 'var(--tata-blue-50)' : 'transparent' }}>
                <input type="checkbox" checked={selected.includes(opt)} onChange={() => toggle(opt)} style={{ width: 14, height: 14, cursor: 'pointer', margin: 0, accentColor: 'var(--tata-blue)' }} />
                <span style={{ fontSize: '0.72rem', color: selected.includes(opt) ? 'var(--tata-blue)' : 'var(--grey-700)', fontWeight: selected.includes(opt) ? 700 : 500, textTransform: 'uppercase', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{opt}</span>
              </label>
            ))}
            {!filtered.length && <div style={{ fontSize: '0.7rem', color: 'var(--grey-400)', textAlign: 'center', padding: 10 }}>No matches found</div>}
          </div>
        </div>
      )}
    </div>
  );
}

// POPUP FOR TELECALLER DEALERS ONLY
function InterestedModal({ lead, onClose, onSave }) {
  const [form, setForm] = useState({
    assigned_to_dse: lead.assigned_to_dse || '',
    customer_appointment_date: lead.customer_appointment_date ? new Date(lead.customer_appointment_date).toLocaleDateString('en-CA') : '',
    customer_location: lead.customer_location || '',
    status: lead.status || 'In Progress'
  });
  const [saving, setSaving] = useState(false);

  const handleSave = async () => {
    setSaving(true);
    try {
      await api.put(`/leads/${lead.id}`, { telecaller_remark: lead.telecaller_remark, ...form });
      toast.success('Interest details saved');
      onSave(); onClose();
    } catch { toast.error('Save failed'); } finally { setSaving(false); }
  };

  return (
    <div className="modal-overlay" onClick={e => e.target === e.currentTarget && onClose()}>
      <div className="modal" style={{ maxWidth: 440 }}>
        <div className="modal-header">
          <h3>Customer Interest</h3>
          <button className="modal-close" onClick={onClose}><X size={18} /></button>
        </div>
        <div className="modal-body">
          <div className="form-group"><label className="form-label">Assigned to DSE</label>
            <select className="form-select" value={form.assigned_to_dse} onChange={e => setForm(f => ({ ...f, assigned_to_dse: e.target.value }))}>
              <option value="">— Select DSE —</option>{DSE_OPTIONS.map(d => <option key={d}>{d}</option>)}
            </select>
          </div>
          <div className="form-group"><label className="form-label">Appointment Date</label>
            <input type="date" className="form-control" value={form.customer_appointment_date} onChange={e => setForm(f => ({ ...f, customer_appointment_date: e.target.value }))} />
          </div>
          <div className="form-group"><label className="form-label">Location</label>
            <input type="text" className="form-control" value={form.customer_location} onChange={e => setForm(f => ({ ...f, customer_location: e.target.value }))} />
          </div>
        </div>
        <div className="modal-footer">
          <button className="btn btn-secondary" onClick={onClose}>Discard</button>
          <button className="btn btn-primary" onClick={handleSave} disabled={saving}>Confirm</button>
        </div>
      </div>
    </div>
  );
}

// FULL EDIT MODAL FOR DSE ONLY
function DSEEditModal({ lead, onClose, onSave }) {
  const [form, setForm] = useState({
    visit_status: lead.visit_status || '',
    interest_level: lead.interest_level || '',
    deal_stage: lead.deal_stage === 'New' ? '' : (lead.deal_stage || ''),
    expected_purchase_timeline: lead.expected_purchase_timeline || '',
    budget: lead.budget || '',
    customer_response: lead.customer_response || '',
    lost_reason: lead.lost_reason || '',
    dse_follow_up_date: lead.dse_follow_up_date ? new Date(lead.dse_follow_up_date).toLocaleDateString('en-CA') : '',
    status: 'Completed'
  });
  const [photo, setPhoto] = useState(null);
  const [saving, setSaving] = useState(false);

  const handleSave = async () => {
    // Validation: Identify which fields are missing (except budget and follow-up date)
    if (!form.visit_status) return toast.error('Visit Status: select this option');
    if (!form.interest_level) return toast.error('Interest Level: select this option');
    if (!form.deal_stage) return toast.error('Deal Stage: select this option');
    if (!form.expected_purchase_timeline) return toast.error('Timeline: select this option');
    if (!form.customer_response) return toast.error('Customer Response: select this option');
    
    if (form.deal_stage === 'Lost' && !form.lost_reason) return toast.error('Reason: select this option for Lost deals');
    
    setSaving(true);
    try {
      const formData = new FormData();
      Object.keys(form).forEach(key => { if (form[key] !== null && form[key] !== undefined) formData.append(key, form[key]); });
      if (photo) formData.append('jio_tag_photo', photo);
      await api.put(`/leads/${lead.id}`, formData, { headers: { 'Content-Type': 'multipart/form-data' } });
      toast.success('Update successful');
      onSave(); onClose();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Update failed');
    } finally { setSaving(false); }
  };

  return (
    <div className="modal-overlay" onClick={e => e.target === e.currentTarget && onClose()}>
      <div className="modal" style={{ maxWidth: 480 }}>
        <div className="modal-header">
          <h3>DSE Activity Log</h3>
          <button className="modal-close" onClick={onClose}><X size={18} /></button>
        </div>
        <div className="modal-body">
          {/* 2-col grid that collapses on mobile */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: 14 }}>
            <div className="form-group" style={{ margin: 0 }}><label className="form-label">Visit Status</label>
              <select className="form-select" value={form.visit_status} onChange={e => setForm(f => ({ ...f, visit_status: e.target.value }))}>
                <option value="">— Select —</option>{VISIT_OPTIONS.map(v => <option key={v}>{v}</option>)}
              </select>
            </div>
            <div className="form-group" style={{ margin: 0 }}><label className="form-label">Interest Level</label>
              <select className="form-select" value={form.interest_level} onChange={e => setForm(f => ({ ...f, interest_level: e.target.value }))}>
                <option value="">— Select —</option>{INTEREST_OPTIONS.map(i => <option key={i}>{i}</option>)}
              </select>
            </div>
            <div className="form-group" style={{ margin: 0 }}><label className="form-label">Deal Stage</label>
              <select className="form-select" value={form.deal_stage} onChange={e => setForm(f => ({ ...f, deal_stage: e.target.value }))}>
                <option value="">— Select —</option>{STAGE_OPTIONS.map(s => <option key={s}>{s}</option>)}
              </select>
            </div>
            <div className="form-group" style={{ margin: 0 }}><label className="form-label">Timeline</label>
              <select className="form-select" value={form.expected_purchase_timeline} onChange={e => setForm(f => ({ ...f, expected_purchase_timeline: e.target.value }))}>
                <option value="">— Select —</option>{TIMELINE_OPTIONS.map(t => <option key={t}>{t}</option>)}
              </select>
            </div>
            <div className="form-group" style={{ margin: 0 }}><label className="form-label">Budget Estimate</label>
              <input type="text" className="form-control" placeholder="e.g. 8-10 Lakhs" value={form.budget} onChange={e => setForm(f => ({ ...f, budget: e.target.value }))} />
            </div>
          </div>
          <div className="form-group" style={{ marginTop: 14 }}><label className="form-label">Next Field Follow-up Date</label>
            <input type="date" className="form-control" value={form.dse_follow_up_date} onChange={e => setForm(f => ({ ...f, dse_follow_up_date: e.target.value }))} />
          </div>
          {form.deal_stage === 'Lost' && (
            <div className="form-group"><label className="form-label">Reason</label>
              <textarea className="form-control" rows={2} value={form.lost_reason} onChange={e => setForm(f => ({ ...f, lost_reason: e.target.value }))} />
            </div>
          )}
          <div className="form-group">
            <label className="form-label">Customer Response</label>
            <select className="form-select" value={form.customer_response} onChange={e => setForm(f => ({ ...f, customer_response: e.target.value }))}>
              <option value="">— Select Response —</option>
              <option value="based on Telecaller remark">Based on Telecaller Remark</option>
              <option value="not intrested">Not Interested</option>
            </select>
          </div>
          <div className="form-group">
            <label className="form-label">Jio Tag Photo</label>
            <div
              onClick={() => document.getElementById('jio-upload').click()}
              style={{
                border: '2px dashed var(--grey-200)', borderRadius: 12, padding: '14px',
                textAlign: 'center', cursor: 'pointer', transition: 'all 0.2s',
                background: photo ? 'var(--tata-blue-50)' : 'transparent',
                borderColor: photo ? 'var(--tata-blue)' : 'var(--grey-200)'
              }}
            >
              <Upload size={20} style={{ color: photo ? 'var(--tata-blue)' : 'var(--grey-400)', marginBottom: 4 }} />
              <div style={{ fontSize: '0.78rem', fontWeight: 600, color: photo ? 'var(--tata-blue)' : 'var(--grey-500)' }}>
                {photo ? photo.name : 'Tap to Upload Jio Tag Photo'}
              </div>
            </div>
            <input id="jio-upload" type="file" accept="image/*" capture="environment" style={{ display: 'none' }} onChange={(e) => setPhoto(e.target.files[0])} />
          </div>
        </div>
        <div className="modal-footer">
          <button className="btn btn-secondary" onClick={onClose}>Cancel</button>
          <button className="btn btn-primary" onClick={handleSave} disabled={saving}>Save</button>
        </div>
      </div>
    </div>
  );
}

// VIEW DSE MODAL
function DetailRow({ label, value }) {
  if (!value) return null;
  return (
    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '12px 14px', background: 'var(--grey-50)', borderRadius: 10, border: '1px solid var(--grey-100)', marginBottom: 8 }}>
      <div style={{ fontSize: '0.72rem', color: 'var(--grey-400)', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.5px' }}>{label}</div>
      <div style={{ fontSize: '0.88rem', fontWeight: 800, color: 'var(--grey-800)' }}>{value}</div>
    </div>
  );
}

function DSEViewModal({ lead, onClose }) {
  return (
    <div className="modal-overlay" onClick={e => e.target === e.currentTarget && onClose()}>
      <div className="modal" style={{ maxWidth: 480 }}>
        <div className="modal-header">
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <div style={{ width: 44, height: 44, borderRadius: 12, background: 'var(--tata-blue)', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <TrendingUp size={20} />
            </div>
            <div>
              <h3 style={{ margin: 0 }}>DSE Activity Log</h3>
              <p style={{ margin: 0, fontSize: '0.75rem', color: 'var(--grey-400)' }}>Updates by {lead.assigned_to_dse || 'DSE'}</p>
            </div>
          </div>
          <button className="modal-close" onClick={onClose}><X size={18} /></button>
        </div>
        <div className="modal-body" style={{ background: '#fff' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 20 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <div style={{ width: 40, height: 40, borderRadius: '50%', background: 'var(--grey-100)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 800, color: 'var(--tata-blue)' }}>
                {lead.full_name?.charAt(0)}
              </div>
              <div style={{ display: 'flex', flexDirection: 'column' }}>
                <span style={{ fontWeight: 800, fontSize: '1rem', color: 'var(--grey-900)' }}>{lead.full_name}</span>
                <span style={{ fontSize: '0.75rem', color: 'var(--grey-400)', fontWeight: 600 }}>ID: #{lead.id}</span>
              </div>
            </div>
            {lead.interest_level && (
              <div style={{ textAlign: 'right' }}>
                <span style={{ fontSize: '0.65rem', color: 'var(--grey-500)', fontWeight: 800, display: 'block', marginBottom: 5, letterSpacing: 0.5 }}>INTEREST LEVEL</span>
                <span className={`badge badge-${lead.interest_level === 'High' ? 'red' : lead.interest_level === 'Medium' ? 'yellow' : 'blue'}`} style={{ fontSize: '0.8rem', padding: '5px 12px' }}>
                  {lead.interest_level}
                </span>
              </div>
            )}
          </div>
          <div style={{ marginBottom: 20 }}>
            <DetailRow 
              label="Field Work Status" 
              value={(lead.dse_status === 'Completed') ? '✅ Completed' : '⏳ In Progress'} 
            />
            <DetailRow label="Visit Status" value={lead.visit_status} />
            <DetailRow label="Expected Purchase Timeline" value={lead.expected_purchase_timeline} />
            {lead.budget && <DetailRow label="Budget Estimate" value={lead.budget} />}
            {lead.deal_stage === 'Lost' && <DetailRow label="Lost Reason" value={lead.lost_reason} />}
            {lead.dse_follow_up_date && <DetailRow label="Next Visit" value={new Date(lead.dse_follow_up_date).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })} />}
          </div>
          <div style={{ padding: 14, background: 'rgba(0,58,143,0.03)', borderRadius: 12, border: '1px solid rgba(0,58,143,0.1)' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 8 }}>
              <MessageSquare size={15} color="var(--tata-blue)" />
              <span style={{ fontSize: '0.72rem', fontWeight: 800, color: 'var(--tata-blue)', letterSpacing: 0.5 }}>CUSTOMER RESPONSE</span>
            </div>
            <p style={{ margin: 0, fontSize: '0.88rem', color: 'var(--grey-800)', lineHeight: '1.6', fontWeight: 500 }}>
              {lead.customer_response || <span style={{ color: 'var(--grey-400)', fontStyle: 'italic' }}>No response recorded.</span>}
            </p>
          </div>
          {lead.jio_tag_photo && (
            <div style={{ marginTop: 20 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 10 }}>
                <Image size={15} color="var(--tata-blue)" />
                <span style={{ fontSize: '0.72rem', fontWeight: 800, color: 'var(--tata-blue)', letterSpacing: 0.5 }}>FIELD VISIT PHOTO</span>
              </div>
              <a href={lead.jio_tag_photo} target="_blank" rel="noreferrer">
                <img src={lead.jio_tag_photo} alt="Jio Tag" style={{ width: '100%', borderRadius: 12, boxShadow: 'var(--shadow-sm)', border: '1px solid var(--grey-100)' }} onError={(e) => e.target.style.display='none'} />
              </a>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// ── MOBILE LEAD CARD for each lead ──
function MobileLeadCard({ lead, role, type, onRefresh, showFieldInsight, showFollowupDate }) {
  const isDSE = role === 'dse';
  const isCompleted = type === 'completed';
  const [activeLead, setActiveLead] = useState(null);
  const [viewLead, setViewLead] = useState(null);

  const currentStatus = isDSE ? (lead.dse_status || 'In Progress') : lead.status;
  const statusColor = currentStatus === 'Completed' ? 'var(--green-700)' : 'var(--yellow-700)';
  const statusBg = currentStatus === 'Completed' ? 'var(--green-50)' : 'var(--yellow-50)';

  return (
    <div style={{
      background: '#fff', borderRadius: 14, border: '1px solid var(--grey-100)',
      boxShadow: 'var(--shadow-xs)', padding: 14, marginBottom: 10
    }}>
      {/* Top row: Name + Status badge */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 10, gap: 8 }}>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ fontWeight: 700, color: 'var(--tata-blue)', fontSize: '0.95rem', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{lead.full_name}</div>
          <div style={{ fontSize: '0.75rem', color: 'var(--grey-500)', marginTop: 2, display: 'flex', alignItems: 'center', gap: 4 }}>
            <MapPin size={10} /> {lead.location}
          </div>
          {isDSE && lead.customer_appointment_date && (
            <div style={{ marginTop: 4 }}>
              <span style={{ fontSize: '0.68rem', color: 'var(--orange-500)', fontWeight: 800, background: 'var(--yellow-50)', padding: '2px 8px', borderRadius: 6, display: 'inline-flex', alignItems: 'center', gap: 4 }}>
                <Calendar size={10} />
                Appt: {new Date(lead.customer_appointment_date).toLocaleDateString('en-IN', { day: '2-digit', month: 'short' })}
              </span>
            </div>
          )}
        </div>
        <span style={{ padding: '4px 10px', borderRadius: 100, fontSize: '0.72rem', fontWeight: 700, background: statusBg, color: statusColor, flexShrink: 0 }}>
          {currentStatus}
        </span>
      </div>

      {/* Info grid */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8, marginBottom: 10 }}>
        <div style={{ background: 'var(--grey-50)', borderRadius: 8, padding: '7px 10px' }}>
          <div style={{ fontSize: '0.62rem', fontWeight: 700, color: 'var(--grey-400)', textTransform: 'uppercase', letterSpacing: 0.4, marginBottom: 2 }}>Phone</div>
          <a href={`tel:${lead.phone_number}`} style={{ color: 'var(--green-500)', fontWeight: 700, fontSize: '0.82rem' }}>
            <Phone size={10} style={{ marginRight: 4 }} />{lead.phone_number}
          </a>
        </div>
        <div style={{ background: 'var(--grey-50)', borderRadius: 8, padding: '7px 10px' }}>
          <div style={{ fontSize: '0.62rem', fontWeight: 700, color: 'var(--grey-400)', textTransform: 'uppercase', letterSpacing: 0.4, marginBottom: 2 }}>Vehicle</div>
          <div style={{ fontSize: '0.8rem', fontWeight: 600, color: 'var(--grey-700)', display: 'flex', alignItems: 'center', gap: 4 }}>
            <Truck size={10} /> {formatModel(lead.model)}
          </div>
        </div>
        <div style={{ background: 'var(--grey-50)', borderRadius: 8, padding: '7px 10px' }}>
          <div style={{ fontSize: '0.62rem', fontWeight: 700, color: 'var(--grey-400)', textTransform: 'uppercase', letterSpacing: 0.4, marginBottom: 2 }}>Lead Date</div>
          <div style={{ fontSize: '0.8rem', fontWeight: 600, color: 'var(--grey-700)' }}>
            {lead.lead_date ? new Date(lead.lead_date).toLocaleDateString('en-IN', { day: '2-digit', month: 'short' }) : '—'}
          </div>
        </div>
        {!isDSE && (
          <div style={{ background: 'var(--grey-50)', borderRadius: 8, padding: '7px 10px' }}>
            <div style={{ fontSize: '0.62rem', fontWeight: 700, color: 'var(--grey-400)', textTransform: 'uppercase', letterSpacing: 0.4, marginBottom: 2 }}>DSE</div>
            <div style={{ fontSize: '0.8rem', fontWeight: 600, color: 'var(--grey-700)' }}>{lead.assigned_to_dse || 'Unassigned'}</div>
          </div>
        )}
      </div>

      {/* Telecaller Remark — full width */}
      {!isDSE && (
        <div style={{ marginBottom: 10 }}>
          <div style={{ fontSize: '0.62rem', fontWeight: 700, color: 'var(--grey-400)', textTransform: 'uppercase', letterSpacing: 0.4, marginBottom: 4 }}>Telecaller Remark</div>
          <select
            className="form-select"
            style={{ fontSize: '0.8rem', height: 40, background: '#F3F4F6', minHeight: 'auto' }}
            value={lead.telecaller_remark || ''}
            onChange={async (e) => {
              const val = e.target.value;
              if (INTERESTED_REMARKS.includes(val)) {
                setActiveLead({ ...lead, telecaller_remark: val });
              } else {
                try {
                  await api.put(`/leads/${lead.id}`, { telecaller_remark: val });
                  toast.success('Remark updated');
                  onRefresh();
                } catch (err) {
                  toast.error(err.response?.data?.message || 'Update failed');
                }
              }
            }}
          >
            <option value="">— Select Remark —</option>
            {REMARK_OPTIONS.map(r => <option key={r} value={r}>{r}</option>)}
          </select>
        </div>
      )}

      {/* Follow-up date */}
      {showFollowupDate && !isDSE && (
        <div style={{ marginBottom: 10 }}>
          <div style={{ fontSize: '0.62rem', fontWeight: 700, color: 'var(--grey-400)', textTransform: 'uppercase', letterSpacing: 0.4, marginBottom: 4 }}>Follow-up Date</div>
          <div style={{ display: 'flex', gap: 8 }}>
            <input
              type="date"
              id={`date-mob-${lead.id}`}
              className="form-control"
              style={{ height: 42, fontSize: '0.82rem', minHeight: 'auto', flex: 1 }}
              defaultValue={lead.follow_up_date ? new Date(lead.follow_up_date).toLocaleDateString('en-CA') : ''}
            />
            <button
              className="btn btn-primary"
              style={{ width: 42, padding: 0, display: 'flex', alignItems: 'center', justifyContent: 'center' }}
              onClick={async () => {
                const val = document.getElementById(`date-mob-${lead.id}`).value;
                if (!val) return toast.error('Selection required');
                try {
                  await api.put(`/leads/${lead.id}`, { follow_up_date: val });
                  toast.success('Scheduled');
                  onRefresh();
                } catch (err) {
                  toast.error(err.response?.data?.message || 'Update failed');
                }
              }}
            >
              <CheckCircle size={18} />
            </button>
          </div>
        </div>
      )}

      {/* Status change (Dealer) */}
      {!isDSE && (
        <div style={{ marginBottom: 10 }}>
          <div style={{ fontSize: '0.62rem', fontWeight: 700, color: 'var(--grey-400)', textTransform: 'uppercase', letterSpacing: 0.4, marginBottom: 4 }}>Progress</div>
          <select
            className="form-select"
            style={{ fontWeight: 700, fontSize: '0.8rem', background: lead.status === 'Completed' ? 'var(--green-50)' : 'var(--yellow-50)', color: lead.status === 'Completed' ? 'var(--green-700)' : 'var(--yellow-700)', height: 40, minHeight: 'auto' }}
            value={lead.status}
            onChange={async (e) => {
              const newStatus = e.target.value;
              if (newStatus === 'Completed' && !lead.telecaller_remark) {
                toast.error('Please select a Telecaller Remark before marking as Completed');
                return;
              }
              try {
                await api.put(`/leads/${lead.id}`, { status: newStatus });
                toast.success(`Marked as ${newStatus}`);
                onRefresh();
              } catch { toast.error('Failed to update status'); }
            }}
          >
            {STATUS_OPTIONS_DEALER.map(s => <option key={s} value={s}>{s}</option>)}
          </select>
        </div>
      )}

      {/* Action row */}
      <div style={{ display: 'flex', gap: 8, paddingTop: 10, borderTop: '1px solid var(--grey-100)', flexWrap: 'wrap' }}>
        {showFieldInsight && lead.last_updated_by === 'DSE' && (
          <button
            onClick={() => setViewLead(lead)}
            style={{ flex: 1, background: 'none', border: '1px solid var(--tata-blue)', color: 'var(--tata-blue)', padding: '8px 12px', borderRadius: 8, fontSize: '0.78rem', fontWeight: 700, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6, minHeight: 42 }}
          >
            <Eye size={14} /> View Log
          </button>
        )}
        {isDSE && (
          <button
            className="btn btn-primary"
            style={{ flex: 1, minHeight: 42 }}
            onClick={() => setActiveLead(lead)}
          >
            <Edit2 size={15} /> Update Lead
          </button>
        )}
      </div>

      {/* Modals */}
      {activeLead && !isDSE && <InterestedModal lead={activeLead} onClose={() => setActiveLead(null)} onSave={onRefresh} />}
      {activeLead && isDSE && <DSEEditModal lead={activeLead} onClose={() => setActiveLead(null)} onSave={onRefresh} />}
      {viewLead && <DSEViewModal lead={viewLead} onClose={() => setViewLead(null)} />}
    </div>
  );
}

// ── DESKTOP TABLE ──
function LeadTable({ leads, onRefresh, role, type, filters, onFilterChange, filterOptions }) {
  const isDSE = role === 'dse';
  const isCompleted = type === 'completed';
  const showFieldInsight = true; // Enabled for all sections as per Dealer request
  const showFollowupDate = type === 'active' || type === 'scheduled';

  const [activeLead, setActiveLead] = useState(null);
  const [viewLead, setViewLead] = useState(null);

  const { nameOptions = [], locationOptions = [], modelOptions = [], dseOptions = [], statusOptions = [] } = filterOptions || {};

  if (!leads.length) return null;

  return (
    <>
      {/* Desktop table */}
      <div className="card lead-table-desktop" style={{ border: 'none', boxShadow: 'var(--shadow-sm)', overflow: 'visible', borderRadius: 16 }}>
        <table className="data-table">
          <thead>
            <tr>
              <th style={{ width: 180, paddingLeft: 20 }}>
                <MultiSelectFilter label={isDSE ? "Name & Appt" : "Name"} options={nameOptions} selected={filters.name || []} onChange={(v) => onFilterChange('name', v)} />
              </th>
              <th style={{ width: 180 }}>
                <MultiSelectFilter label="Location & Phone" options={locationOptions} selected={filters.location || []} onChange={(v) => onFilterChange('location', v)} />
              </th>
              <th><MultiSelectFilter label="Vehicle" options={modelOptions} selected={filters.model || []} onChange={(v) => onFilterChange('model', v)} /></th>
              <th><MultiSelectFilter label="Telecaller Remark" options={REMARK_OPTIONS} selected={filters.remark || []} onChange={(v) => onFilterChange('remark', v)} /></th>
              {!isDSE && showFollowupDate && <th style={{ width: 145 }}>TLC Follow up</th>}
              {!isDSE && <th><MultiSelectFilter label="DSE" options={dseOptions.length ? dseOptions : DSE_OPTIONS} selected={filters.allocation || []} onChange={(v) => onFilterChange('allocation', v)} /></th>}
              {showFieldInsight && <th style={{ textAlign: 'center', fontSize: '0.72rem', fontWeight: 800, color: 'var(--grey-500)', textTransform: 'uppercase', letterSpacing: 0.5 }}>DSE REMARK</th>}
              <th style={{ minWidth: 140 }}><MultiSelectFilter label="Progress" options={statusOptions} selected={filters.progress || []} onChange={(v) => onFilterChange('progress', v)} /></th>
              {isDSE && <th style={{ width: 70, paddingRight: 20 }}>Edit</th>}
            </tr>
          </thead>
          <tbody>
            {(leads || []).map((l) => (
              <tr key={l.id}>
                <td style={{ paddingLeft: 20 }}>
                  <div style={{ display: 'flex', flexDirection: 'column' }}>
                    <span style={{ fontWeight: 700, color: 'var(--tata-blue)', fontSize: '0.9rem' }}>{l.full_name}</span>
                    {isDSE && l.customer_appointment_date && (
                      <div style={{ marginTop: 6 }}>
                        <span style={{ fontSize: '0.72rem', color: 'var(--orange-500)', fontWeight: 800, background: 'var(--yellow-50)', padding: '2px 8px', borderRadius: 6, display: 'inline-flex', alignItems: 'center', gap: 4, border: '1px solid rgba(247, 144, 9, 0.1)' }}>
                          <Calendar size={10} />
                          Appt: {new Date(l.customer_appointment_date).toLocaleDateString('en-IN', { day: '2-digit', month: 'short' })}
                        </span>
                      </div>
                    )}
                  </div>
                </td>
                <td>
                  <div style={{ display: 'flex', flexDirection: 'column' }}>
                    <span style={{ fontSize: '0.75rem', color: 'var(--grey-500)' }}><MapPin size={10} style={{ marginRight: 3 }} /> {l.location}</span>
                    <a href={`tel:${l.phone_number}`} style={{ color: 'var(--green-500)', fontWeight: 600, fontSize: '0.78rem', marginTop: 2 }}><Phone size={10} style={{ marginRight: 3 }} />{l.phone_number}</a>
                  </div>
                </td>
                <td>
                  <div style={{ display: 'inline-flex', alignItems: 'center', gap: 6, padding: '4px 10px', background: 'var(--tata-blue-50)', color: 'var(--tata-blue)', borderRadius: 7, fontSize: '0.75rem', fontWeight: 700, whiteSpace: 'nowrap' }}>
                    <Truck size={12} /> {formatModel(l.model)}
                  </div>
                </td>
                <td>
                  {!isDSE ? (
                    <select className="form-select" style={{ minWidth: 150, height: 36, background: '#F3F4F6', fontSize: '0.78rem', minHeight: 'auto' }} value={l.telecaller_remark || ''} onChange={async (e) => {
                      const val = e.target.value;
                      if (INTERESTED_REMARKS.includes(val)) setActiveLead({ ...l, telecaller_remark: val });
                      else {
                        try { await api.put(`/leads/${l.id}`, { telecaller_remark: val }); toast.success('Remark updated'); onRefresh(); }
                        catch (err) { toast.error(err.response?.data?.message || 'Update failed'); }
                      }
                    }}>
                      <option value="">— Select —</option>
                      {REMARK_OPTIONS.map(r => <option key={r} value={r}>{r}</option>)}
                    </select>
                  ) : <span style={{ fontSize: '0.82rem' }}>{l.telecaller_remark || '—'}</span>}
                </td>
                {!isDSE && showFollowupDate && (
                  <td>
                    <div style={{ display: 'flex', gap: 5, alignItems: 'center' }}>
                      <input 
                        type="date" 
                        className="form-control" 
                        style={{ height: 36, fontSize: '0.78rem', width: 130, minHeight: 'auto' }} 
                        id={`date-${l.id}`}
                        defaultValue={l.follow_up_date ? new Date(l.follow_up_date).toLocaleDateString('en-CA') : ''} 
                      />
                      <button 
                        className="btn btn-primary" 
                        title="Confirm Schedule"
                        style={{ padding: '0 8px', height: 36, minWidth: 'auto', background: 'var(--green-500)', borderColor: 'var(--green-600)' }}
                        onClick={async () => {
                          const val = document.getElementById(`date-${l.id}`).value;
                          if (!val) return toast.error('Selection required');
                          try { 
                            await api.put(`/leads/${l.id}`, { follow_up_date: val }); 
                            toast.success('Scheduled'); 
                            onRefresh(); 
                          } catch (err) { 
                            toast.error(err.response?.data?.message || 'Update failed'); 
                          }
                        }}
                      >
                        <CheckCircle size={15} />
                      </button>
                    </div>
                  </td>
                )}
                {!isDSE && (
                  <td style={{ minWidth: 140 }}>
                    <div style={{ display: 'flex', flexDirection: 'column' }}>
                      <span style={{ fontSize: '0.82rem', fontWeight: 600, color: 'var(--grey-700)' }}>{l.assigned_to_dse || 'Unassigned'}</span>
                      {l.customer_appointment_date && (
                        <span style={{ fontSize: '0.68rem', color: 'var(--orange-600)', fontWeight: 800, textTransform: 'uppercase', marginTop: 2 }}>
                          Appt: {new Date(l.customer_appointment_date).toLocaleDateString('en-IN', { day: '2-digit', month: 'short' })}
                        </span>
                      )}
                      {l.dse_follow_up_date && (
                        <span style={{ fontSize: '0.68rem', color: 'var(--tata-blue)', fontWeight: 800, textTransform: 'uppercase', marginTop: 2 }}>
                          Next: {new Date(l.dse_follow_up_date).toLocaleDateString('en-IN', { day: '2-digit', month: 'short' })}
                        </span>
                      )}
                    </div>
                  </td>
                )}
                {showFieldInsight && (
                  <td style={{ textAlign: 'center' }}>
                    {(l.customer_response || (l.visit_status && l.visit_status !== 'Not Visited') || l.deal_stage) ? (
                      <button 
                        onClick={() => setViewLead(l)} 
                        style={{ 
                          background: 'white', 
                          border: '1.2px solid var(--tata-blue)', 
                          color: 'var(--tata-blue)', 
                          padding: '6px 16px', 
                          borderRadius: 100, 
                          fontSize: '0.7rem', 
                          fontWeight: 700, 
                          cursor: 'pointer' 
                        }}
                      >
                        View Log
                      </button>
                    ) : !l.assigned_to_dse ? (
                      <span style={{ fontSize: '0.72rem', color: 'var(--grey-300)', fontWeight: 600 }}>-</span>
                    ) : (
                      <span style={{ fontSize: '0.72rem', color: 'var(--grey-400)', fontWeight: 600, fontStyle: 'italic' }}>No Logs</span>
                    )}
                  </td>
                )}
                <td style={{ textAlign: 'center' }}>
                  {!isDSE ? (
                    <select 
                      className={`badge status-${l.status?.toLowerCase().replace(' ', '-')}`} 
                      style={{ 
                        fontWeight: 800, 
                        fontSize: '0.76rem', 
                        height: 32, 
                        minWidth: 125, 
                        cursor: 'pointer',
                        padding: '0 12px',
                        border: '1px solid currentColor',
                        borderRadius: 100,
                        textAlign: 'center',
                        appearance: 'none'
                      }} 
                      value={l.status} 
                      onChange={async (e) => {
                        const newStatus = e.target.value;
                        const dateInput = document.getElementById(`date-${l.id}`);
                        const pendingDate = dateInput ? dateInput.value : null;

                        if (newStatus === 'Completed' && !l.telecaller_remark) { 
                          toast.error('Please select a Telecaller Remark before marking as Completed'); 
                          return; 
                        }

                        try { 
                          const data = { status: newStatus };
                          if (pendingDate) data.follow_up_date = pendingDate;
                          
                          await api.put(`/leads/${l.id}`, data); 
                          toast.success('Lead updated successfully'); 
                          onRefresh(); 
                        } catch (err) { 
                          toast.error(err.response?.data?.message || 'Update failed'); 
                        }
                    }}>
                      {STATUS_OPTIONS_DEALER.map(s => <option key={s} value={s}>{s}</option>)}
                    </select>
                  ) : (
                    <span 
                      className={`badge status-${(l.dse_status || 'In Progress').toLowerCase().replace(' ', '-')}`}
                      style={{ 
                        display: 'inline-flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        minWidth: 125,
                        height: 32,
                        fontSize: '0.76rem',
                        fontWeight: 800,
                        borderRadius: 100,
                        textAlign: 'center'
                      }}
                    >
                      {l.dse_status || 'In Progress'}
                    </span>
                  )}
                </td>
                {isDSE && <td style={{ paddingRight: 20 }}><button className="btn btn-primary btn-icon" onClick={() => setActiveLead(l)}><Edit2 size={15} /></button></td>}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Mobile cards */}
      <div className="lead-table-mobile">
        {(leads || []).map(l => (
          <MobileLeadCard
            key={l.id}
            lead={l}
            role={role}
            type={type}
            onRefresh={onRefresh}
            showFieldInsight={showFieldInsight}
            showFollowupDate={showFollowupDate}
          />
        ))}
      </div>

      {(activeLead && !isDSE) && <InterestedModal lead={activeLead} onClose={() => setActiveLead(null)} onSave={onRefresh} />}
      {(activeLead && isDSE) && <DSEEditModal lead={activeLead} onClose={() => setActiveLead(null)} onSave={onRefresh} />}
      {viewLead && <DSEViewModal lead={viewLead} onClose={() => setViewLead(null)} />}
    </>
  );
}

export default function DealerLeads() {
  const { user, dateFrom, setDateFrom, dateTo, setDateTo } = useAuth();
  const [leads, setLeads] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [filters, setFilters] = useState({ name: [], location: [], model: [], remark: [], allocation: [], progress: [] });

  const fetchLeads = useCallback(async () => {
    setLoading(true);
    try {
      const res = await api.get('/leads', { params: { search, date_from: dateFrom, date_to: dateTo } });
      setLeads(res.data.data);
    } catch { toast.error('Sync failed'); } finally { setLoading(false); }
  }, [search, dateFrom, dateTo]);

  useEffect(() => { fetchLeads(); }, [fetchLeads]);

  const handleFilterChange = (key, val) => setFilters(prev => ({ ...prev, [key]: val }));

  const isDSE = user?.role === 'dse';
  let rawActive, rawFollowup, rawCompleted;

  const isInRange = (dateStr) => {
    if (!dateStr || !dateFrom || !dateTo) return true;
    const d = new Date(dateStr).setHours(0,0,0,0);
    const start = new Date(dateFrom).setHours(0,0,0,0);
    const end = new Date(dateTo).setHours(0,0,0,0);
    return d >= start && d <= end;
  };

  const now = new Date().setHours(0, 0, 0, 0);

  // A lead is scheduled if it has a follow-up date within the selected range AND that date is today or in the future
  const isScheduled = (l) => {
    if (!l.follow_up_date || !isInRange(l.follow_up_date)) return false;
    
    // RULE (DSE): "Only leads with a Follow-up Date entered by the DSE should appear in Scheduled Follow-ups."
    if (isDSE && l.last_updated_by !== 'DSE') return false;

    const fDate = new Date(l.follow_up_date).setHours(0, 0, 0, 0);
    return fDate >= now;
  };

  rawFollowup = leads.filter(l => isScheduled(l));

  if (isDSE) {
    // DSE LOGIC: Priority on Scheduling and Personal Completion
    // 1. Scheduled: Leads with future follow-up dates entered by DSE
    rawFollowup = leads.filter(l => isScheduled(l));
    
    // 2. Completed: Leads marked Completed personally (tracked by dse_status)
    rawCompleted = leads.filter(l => l.dse_status === 'Completed' && !isScheduled(l));
    
    // 3. Active (Pending): Leads assigned to them that are neither scheduled nor personally completed
    rawActive = leads.filter(l => !rawFollowup.includes(l) && !rawCompleted.includes(l));
  } else {
    // DEALER LOGIC: Priority on Scheduling for Global Persistence
    // 1. Scheduled: ANY active or completed lead with a future follow-up date stays here
    rawFollowup = leads.filter(l => isScheduled(l));
    
    // 2. Completed: Only leads marked Completed that are NO LONGER scheduled
    rawCompleted = leads.filter(l => l.status === 'Completed' && !isScheduled(l));
    
    // 3. Pending (Active): Everything else that is not yet Completed or Scheduled
    rawActive = leads.filter(l => l.status !== 'Completed' && !rawFollowup.includes(l));
  }

  const getUniqueOpts = (data, key, formatter = v => v) =>
    Array.from(new Set(data.map(l => formatter(l[key])).filter(v => v && v !== '—'))).sort();

  const createOptions = (dataset) => ({
    nameOptions: getUniqueOpts(dataset, 'full_name'),
    locationOptions: getUniqueOpts(dataset, 'location'),
    modelOptions: getUniqueOpts(dataset, 'model', formatModel),
    dseOptions: getUniqueOpts(dataset, 'assigned_to_dse'),
    statusOptions: Array.from(new Set(dataset.map(l => l.status)))
  });

  const activeOptions = createOptions(rawActive);
  const followupOptions = createOptions(rawFollowup);
  const completedOptions = createOptions(rawCompleted);

  const applyFilters = (dataset) => dataset.filter(l => {
    if (filters.name.length && !filters.name.includes(l.full_name)) return false;
    if (filters.location.length && !filters.location.includes(l.location)) return false;
    if (filters.model.length && !filters.model.includes(formatModel(l.model))) return false;
    if (filters.remark.length && !filters.remark.includes(l.voice_of_customer)) return false;
    if (filters.allocation.length && !filters.allocation.includes(l.assigned_to_dse)) return false;
    if (filters.progress.length && !filters.progress.includes(l.status)) return false;
    return true;
  });

  const active = applyFilters(rawActive);
  const followup = applyFilters(rawFollowup);
  const completed = applyFilters(rawCompleted);

  return (
    <div style={{ maxWidth: 1400, margin: '0 auto' }}>
      {/* Header — stacks vertically on mobile */}
      <div className="page-header dealer-leads-header">
        <div>
          <h2 style={{ fontWeight: 800 }}>Lead Workspace</h2>
        </div>
        {/* Date picker */}
        <div style={{
          display: 'flex', gap: 8, background: '#fff', padding: '8px 14px',
          borderRadius: 14, boxShadow: 'var(--shadow-sm)', flexWrap: 'wrap',
          alignItems: 'center', border: '1px solid var(--grey-100)'
        }}>
          <Calendar size={16} style={{ color: 'var(--tata-blue)', flexShrink: 0 }} />
          <input
            type="date"
            style={{ border: 'none', fontWeight: 600, color: 'var(--tata-blue)', outline: 'none', background: 'transparent', minWidth: 110, fontSize: '0.85rem' }}
            value={dateFrom}
            onChange={e => setDateFrom(e.target.value)}
          />
          <span style={{ color: 'var(--grey-300)' }}>→</span>
          <input
            type="date"
            style={{ border: 'none', fontWeight: 600, color: 'var(--tata-blue)', outline: 'none', background: 'transparent', minWidth: 110, fontSize: '0.85rem' }}
            value={dateTo}
            onChange={e => setDateTo(e.target.value)}
          />
        </div>
      </div>

      {/* Search */}
      <div className="search-bar" style={{ maxWidth: 440, borderRadius: 12, padding: '10px 16px', background: '#fff', border: '1px solid #EAECF0', marginBottom: 24 }}>
        <Search size={18} className="search-icon" style={{ color: 'var(--tata-blue)' }} />
        <input placeholder="Quick Lead Lookup..." value={search} onChange={e => setSearch(e.target.value)} />
      </div>

      {/* DSE stats strip removed as per request */}

      <div style={{ display: 'flex', flexDirection: 'column', gap: 36, paddingBottom: 80 }}>
        {active.length > 0 && (
          <section>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 14, flexWrap: 'wrap' }}>
              <Calendar size={18} />
              <h3 style={{ margin: 0, fontSize: '1.05rem' }}>Pending &amp; Actionable Leads</h3>
              <span className="badge badge-blue">{active.length}</span>
            </div>
            <LeadTable leads={active} onRefresh={fetchLeads} role={user?.role} type="active" filters={filters} onFilterChange={handleFilterChange} filterOptions={activeOptions} />
          </section>
        )}
        {followup.length > 0 && (
          <section>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 14, flexWrap: 'wrap' }}>
              <Clock size={18} />
              <h3 style={{ margin: 0, fontSize: '1.05rem' }}>Scheduled Follow-ups</h3>
              <span className="badge badge-yellow">{followup.length}</span>
            </div>
            <LeadTable leads={followup} onRefresh={fetchLeads} role={user?.role} type="scheduled" filters={filters} onFilterChange={handleFilterChange} filterOptions={followupOptions} />
          </section>
        )}
        {completed.length > 0 && (
          <section>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 14, flexWrap: 'wrap' }}>
              <CheckCircle size={18} />
              <h3 style={{ margin: 0, fontSize: '1.05rem' }}>Completed Workspace</h3>
              <span className="badge badge-green">{completed.length}</span>
            </div>
            <LeadTable leads={completed} onRefresh={fetchLeads} role={user?.role} type="completed" filters={filters} onFilterChange={handleFilterChange} filterOptions={completedOptions} />
          </section>
        )}
        {(!loading && !active.length && !followup.length && !completed.length) && (
          <div style={{ textAlign: 'center', padding: '80px 0' }}>
            <div style={{ background: 'var(--grey-50)', width: 72, height: 72, borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 16px' }}>
              <Search size={30} style={{ color: 'var(--grey-300)' }} />
            </div>
            <h3 style={{ color: 'var(--grey-900)' }}>No leads found</h3>
            <p style={{ color: 'var(--grey-500)' }}>Try adjusting your date range or search filters.</p>
          </div>
        )}
      </div>
    </div>
  );
}
