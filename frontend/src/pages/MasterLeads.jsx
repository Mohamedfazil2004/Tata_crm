import React, { useState, useEffect, useCallback, useRef } from 'react';
import { Search, Filter, Edit2, ChevronLeft, ChevronRight, X, Building2, AlertCircle, Calendar, MapPin, Truck, Phone } from 'lucide-react';
import api from '../api/client';
import toast from 'react-hot-toast';
import { useAuth } from '../context/AuthContext';

const REMARK_OPTIONS = [
  'Intrested / purchased within 30 days',
  'Intrested / purchased within 60 days',
  'Intrested / purchased within 90 days',
  'not intrested',
  'not reachable',
  'already purchased',
  'competitive vehicle'
];

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
        className="filter-btn"
        style={{
          background: selected.length ? 'rgba(0,58,143,0.05)' : 'none',
          border: 'none',
          color: selected.length ? 'var(--tata-blue)' : 'var(--grey-500)',
          display: 'flex',
          alignItems: 'center',
          gap: 8,
          cursor: 'pointer',
          padding: '6px 10px',
          borderRadius: 8,
          transition: 'all 0.2s ease',
          textAlign: 'left'
        }}
      >
        <span style={{ fontSize: '0.74rem', fontWeight: 900, textTransform: 'uppercase', letterSpacing: 0.6, opacity: selected.length ? 1 : 0.8 }}>{label}</span>
        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
          <Filter size={13} strokeWidth={2.5} fill={selected.length ? 'var(--tata-blue)' : 'none'} style={{ opacity: selected.length ? 1 : 0.6 }} />
          {selected.length > 0 && <span style={{ background: 'var(--tata-blue)', color: '#fff', fontSize: '0.62rem', padding: '0 6px', borderRadius: 10, fontWeight: 900 }}>{selected.length}</span>}
        </div>
      </button>

      {isOpen && (
        <div style={{ position: 'absolute', top: '100%', left: 0, zIndex: 200, background: '#fff', border: '1px solid var(--grey-100)', borderRadius: 12, boxShadow: 'var(--shadow-lg)', minWidth: 200, padding: 12, marginTop: 8 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8, paddingBottom: 6, borderBottom: '1px solid var(--grey-50)' }}>
            <span style={{ fontSize: '0.72rem', fontWeight: 800, color: 'var(--grey-900)' }}>Filter {label}</span>
            <button onClick={() => onChange([])} style={{ background: 'none', border: 'none', color: 'var(--tata-blue)', fontSize: '0.7rem', fontWeight: 700, cursor: 'pointer' }}>Clear</button>
          </div>
          {options.length > 5 && (
            <div style={{ marginBottom: 8, display: 'flex', alignItems: 'center', background: 'var(--grey-50)', padding: '5px 8px', borderRadius: 7 }}>
              <Search size={12} style={{ color: 'var(--grey-400)' }} />
              <input type="text" placeholder={`Search...`} value={search} onChange={e => setSearch(e.target.value)} style={{ border: 'none', background: 'none', fontSize: '0.72rem', paddingLeft: 6, width: '100%', outline: 'none' }} />
            </div>
          )}
          <div style={{ maxHeight: 200, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: 2 }}>
            {filtered.map(opt => (
              <label key={opt} style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '6px 8px', borderRadius: 6, cursor: 'pointer', background: selected.includes(opt) ? 'rgba(0,58,143,0.05)' : 'transparent' }}>
                <input type="checkbox" checked={selected.includes(opt)} onChange={() => toggle(opt)} style={{ width: 14, height: 14, cursor: 'pointer', margin: 0, accentColor: 'var(--tata-blue)' }} />
                <span style={{ fontSize: '0.72rem', color: selected.includes(opt) ? 'var(--tata-blue)' : 'var(--grey-700)', fontWeight: selected.includes(opt) ? 700 : 500, textTransform: 'uppercase', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{opt}</span>
              </label>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

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
            const rawDist = res.data.data.districts[0].dealer_district;
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
    if (!selectedDealerId) { toast.error('Please select a dealer'); return; }
    setSaving(true);
    try {
      await api.put(`/leads/${lead.id}`, { dealer_id: selectedDealerId });
      toast.success('Lead reassigned');
      onSave(); onClose();
    } catch {
      toast.error('Reassignment failed');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="modal-overlay" onClick={e => e.target === e.currentTarget && onClose()}>
      <div className="modal" style={{ maxWidth: 420 }}>
        <div className="modal-header">
          <h3>Reassign Lead</h3>
          <button className="modal-close" onClick={onClose}><X size={18} /></button>
        </div>
        <div className="modal-body">
          <div className="form-group"><label className="form-label">Assign New Dealer Partner</label>
            <select className="form-select" value={selectedDealerId} onChange={e => setSelectedDealerId(e.target.value)}>
              <option value="">— Select Dealer —</option>
              {dealers.map(d => (<option key={d.id} value={d.id}>{d.dealer_name}</option>))}
            </select>
          </div>
          <div style={{ background: 'var(--grey-50)', padding: 12, borderRadius: 10, marginTop: 16 }}>
            <span style={{ fontSize: '0.72rem', color: 'var(--grey-500)', fontWeight: 700 }}>PREVIEW LOCATION</span>
            <div style={{ fontWeight: 800, color: 'var(--tata-blue)', marginTop: 4 }}>{fetchingLoc ? 'Detecting...' : newLocation}</div>
          </div>
        </div>
        <div className="modal-footer">
          <button className="btn btn-secondary" onClick={onClose}>Cancel</button>
          <button className="btn btn-primary" onClick={handleSave} disabled={saving || fetchingLoc}>Confirm</button>
        </div>
      </div>
    </div>
  );
}

export default function MasterLeads() {
  const { user, dateFrom, setDateFrom, dateTo, setDateTo } = useAuth();
  const isAdmin = user?.role === 'admin';
  const [rawLeads, setRawLeads] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [dealers, setDealers] = useState([]);
  const [editLead, setEditLead] = useState(null);
  const [filters, setFilters] = useState({ name: [], location: [], model: [], remark: [], allocation: [], progress: [] });

  useEffect(() => {
    api.get('/dealers').then(r => setDealers(r.data.data)).catch(() => {});
  }, []);

  const fetchLeads = useCallback(async () => {
    if (!dateFrom || !dateTo) return;
    setLoading(true);
    try {
      const res = await api.get('/leads', { params: { search, date_from: dateFrom, date_to: dateTo, limit: 2000 } });
      setRawLeads(res.data.data);
    } catch {
      toast.error('Failed to load leads');
    } finally {
      setLoading(false);
    }
  }, [search, dateFrom, dateTo]);

  useEffect(() => { fetchLeads(); }, [fetchLeads]);

  const handleFilterChange = (key, val) => setFilters(prev => ({ ...prev, [key]: val }));

  const formatModel = (m) => m ? m.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase()) : '—';
  const formatDate = (dateStr) => dateStr ? new Date(dateStr).toLocaleDateString('en-GB') : '—';

  const getUniqueOpts = (data, key, formatter = v => v) =>
    Array.from(new Set(data.map(l => l[key] ? formatter(l[key]) : '').filter(v => v && v !== '—'))).sort();

  const filterOptions = {
    nameOptions: getUniqueOpts(rawLeads, 'full_name'),
    locationOptions: getUniqueOpts(rawLeads, 'location'),
    modelOptions: getUniqueOpts(rawLeads, 'model', formatModel),
    remarkOptions: getUniqueOpts(rawLeads, 'telecaller_remark'),
    allocationOptions: getUniqueOpts(rawLeads, 'dealer_name', v => (v || '').replace(/\s*Dealer\s*Partner\s*/gi, '')),
    progressOptions: Array.from(new Set(rawLeads.map(l => l.status)))
  };

  const filteredLeads = rawLeads.filter(l => {
    if (filters.name.length && !filters.name.includes(l.full_name)) return false;
    if (filters.location.length && !filters.location.includes(l.location)) return false;
    if (filters.model.length && !filters.model.includes(formatModel(l.model))) return false;
    if (filters.remark.length && !filters.remark.includes(l.telecaller_remark)) return false;
    if (filters.allocation.length && !filters.allocation.includes((l.dealer_name || '').replace(/\s*Dealer\s*Partner\s*/gi, ''))) return false;
    if (filters.progress.length && !filters.progress.includes(l.status)) return false;
    return true;
  });

  return (
    <div className="master-leads-page">
      <div className="page-header" style={{ marginBottom: 20 }}>
        <div className="page-header-left">
          <h2>Master Lead Workspace</h2>
          <p>Global lead repository — {filteredLeads.length.toLocaleString()} Records</p>
        </div>
      </div>

      <div style={{ display: 'flex', gap: 12, marginBottom: 24, flexWrap: 'wrap', alignItems: 'center' }}>
        <div className="search-bar" style={{ maxWidth: 400, flex: 1 }}>
          <Search size={16} className="search-icon" />
          <input placeholder="Search name, phone, location..." value={search} onChange={e => setSearch(e.target.value)} onKeyDown={e => e.key === 'Enter' && fetchLeads()} />
        </div>
        <div style={{ display: 'flex', gap: 8, background: '#fff', padding: '6px 14px', borderRadius: 12, border: '1px solid var(--grey-200)', alignItems: 'center' }}>
          <Calendar size={14} color="var(--grey-400)" />
          <input type="date" className="date-input-clean" value={dateFrom} onChange={e => setDateFrom(e.target.value)} style={{ border: 'none', fontSize: '0.82rem', fontWeight: 600, outline: 'none' }} />
          <span style={{ color: 'var(--grey-200)' }}>→</span>
          <input type="date" className="date-input-clean" value={dateTo} onChange={e => setDateTo(e.target.value)} style={{ border: 'none', fontSize: '0.82rem', fontWeight: 600, outline: 'none' }} />
        </div>
      </div>

      {loading ? (
        <div style={{ padding: 100, textAlign: 'center' }}><div className="spinner" /></div>
      ) : filteredLeads.length === 0 ? (
        <div className="empty-state"><h3>No results found</h3><p>Try broadening your filter criteria.</p></div>
      ) : (
        <>
          <div className="table-wrapper desktop-table-view" style={{ borderRadius: 16, overflow: 'visible' }}>
            <table className="data-table">
              <thead>
                <tr style={{ background: 'var(--grey-50)' }}>
                  <th style={{ paddingLeft: 20, width: 60 }}>S.No</th>
                  <th style={{ width: 100 }}>Date</th>
                  <th style={{ minWidth: 200 }}>
                    <MultiSelectFilter label="Lead Info" options={filterOptions.nameOptions} selected={filters.name} onChange={v => handleFilterChange('name', v)} />
                  </th>
                  <th style={{ minWidth: 160 }}>
                    <MultiSelectFilter label="Vehicle" options={filterOptions.modelOptions} selected={filters.model} onChange={v => handleFilterChange('model', v)} />
                  </th>
                  <th style={{ minWidth: 140 }}>
                    <MultiSelectFilter label="Location" options={filterOptions.locationOptions} selected={filters.location} onChange={v => handleFilterChange('location', v)} />
                  </th>
                  <th style={{ minWidth: 160 }}>
                    <MultiSelectFilter label="Allocation" options={filterOptions.allocationOptions} selected={filters.allocation} onChange={v => handleFilterChange('allocation', v)} />
                  </th>
                  <th style={{ minWidth: 120 }}>
                    <MultiSelectFilter label="Status" options={filterOptions.progressOptions} selected={filters.progress} onChange={v => handleFilterChange('progress', v)} />
                  </th>
                  {isAdmin && <th style={{ textAlign: 'right', paddingRight: 20, width: 80 }}>Action</th>}
                </tr>
              </thead>
              <tbody>
                {filteredLeads.map((l, i) => (
                  <tr key={l.id}>
                    <td style={{ paddingLeft: 20, color: 'var(--grey-400)', fontSize: '0.75rem', fontWeight: 700 }}>{i + 1}</td>
                    <td style={{ fontSize: '0.8rem', whiteSpace: 'nowrap' }}>{formatDate(l.lead_date)}</td>
                    <td>
                      <div style={{ fontWeight: 800, color: 'var(--tata-blue)', fontSize: '0.9rem' }}>{l.full_name}</div>
                      <a href={`tel:${l.phone_number}`} style={{ fontSize: '0.82rem', color: 'var(--green-500)', fontWeight: 600 }}>{l.phone_number}</a>
                    </td>
                    <td>
                      <div style={{ fontSize: '0.82rem', fontWeight: 700, color: 'var(--grey-800)' }}>{formatModel(l.model)}</div>
                    </td>
                    <td>
                      <div style={{ fontSize: '0.78rem', color: 'var(--grey-500)', display: 'flex', alignItems: 'center', gap: 4 }}><MapPin size={10} /> {l.location}</div>
                    </td>
                    <td>
                      <span className="badge badge-blue" style={{ fontSize: '0.72rem', fontWeight: 700 }}>{(l.dealer_name || '').replace(/\s*Dealer\s*Partner\s*/gi, '')}</span>
                    </td>
                    <td>
                      <span className={`badge status-${(l.status || '').toLowerCase().replace(/ /g, '-')}`} style={{ fontSize: '0.65rem' }}>{l.status}</span>
                    </td>
                    {isAdmin && (
                      <td style={{ textAlign: 'right', paddingRight: 20 }}>
                        <button onClick={() => setEditLead(l)} style={{ background: 'none', border: 'none', color: 'var(--tata-blue)', cursor: 'pointer', fontWeight: 700, fontSize: '0.78rem' }}><Edit2 size={14} /></button>
                      </td>
                    )}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="mobile-card-list">
            {filteredLeads.map((l, i) => (
              <div key={l.id} style={{ background: '#fff', borderRadius: 16, border: '1px solid var(--grey-100)', padding: 16, boxShadow: 'var(--shadow-xs)' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 10 }}>
                  <div>
                    <div style={{ fontSize: '1rem', fontWeight: 800, color: 'var(--tata-blue)' }}>{l.full_name}</div>
                    <div style={{ fontSize: '0.75rem', color: 'var(--grey-400)', marginTop: 2, display: 'flex', alignItems: 'center', gap: 6 }}>
                      <Calendar size={12} /> {formatDate(l.lead_date)}
                    </div>
                  </div>
                  <span className={`badge status-${l.status?.toLowerCase().replace(' ', '-')}`} style={{ fontSize: '0.65rem' }}>{l.status}</span>
                </div>
                
                <div style={{ display: 'flex', gap: 12, paddingBottom: 12, marginBottom: 12, borderBottom: '1px solid var(--grey-50)' }}>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontSize: '0.65rem', fontWeight: 800, color: 'var(--grey-300)', textTransform: 'uppercase', marginBottom: 2 }}>Vehicle</div>
                    <div style={{ fontSize: '0.85rem', fontWeight: 700, color: 'var(--grey-900)' }}>{formatModel(l.model)}</div>
                  </div>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontSize: '0.65rem', fontWeight: 800, color: 'var(--grey-300)', textTransform: 'uppercase', marginBottom: 2 }}>Partner</div>
                    <div style={{ fontSize: '0.85rem', fontWeight: 700, color: 'var(--grey-900)' }}>{(l.dealer_name || '').replace(/\s*Partner\s*/gi, '')}</div>
                  </div>
                </div>

                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <a href={`tel:${l.phone_number}`} style={{ background: 'var(--green-50)', color: 'var(--green-700)', padding: '6px 12px', borderRadius: 8, fontSize: '0.82rem', fontWeight: 700, display: 'flex', alignItems: 'center', gap: 6 }}>
                    <Phone size={14} /> Call Lead
                  </a>
                  {isAdmin && (
                    <button onClick={() => setEditLead(l)} style={{ background: 'var(--tata-blue-pale)', color: 'var(--tata-blue)', border: 'none', padding: '6px 14px', borderRadius: 8, fontSize: '0.75rem', fontWeight: 700, display: 'flex', alignItems: 'center', gap: 6 }}>
                      <Edit2 size={14} /> Edit
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        </>
      )}

      {editLead && <EditDealerModal lead={editLead} dealers={dealers} onClose={() => setEditLead(null)} onSave={() => fetchLeads()} />}
      
      <style>{`
        .filter-btn:hover {
          background: var(--grey-100) !important;
          color: var(--tata-blue) !important;
        }
        .filter-btn:hover span {
          opacity: 1 !important;
        }
        .filter-btn:hover svg {
          opacity: 1 !important;
        }
      `}</style>
    </div>
  );
}

