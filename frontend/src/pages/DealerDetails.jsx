import React, { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  ChevronLeft, Search, Filter, Calendar,
  Phone, User, MessageSquare, Clock,
  AlertCircle, TrendingUp, MoreVertical, X, MapPin, Truck, CheckCircle, Image, Activity
} from 'lucide-react';
import api from '../api/client';
import toast from 'react-hot-toast';

// REUSABLE COMPONENTS
function DetailRow({ label, value, icon: Icon }) {
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
              <p style={{ margin: 0, fontSize: '0.75rem', color: 'var(--grey-400)' }}>Updates by {lead.assigned_to_dse}</p>
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
              value={(lead.status === 'Completed' && lead.last_updated_by === 'DSE') ? '✅ Completed' : '⏳ In Progress'} 
            />
            <DetailRow label="Visit Status" value={lead.visit_status} />
            <DetailRow label="Expected Timeline" value={lead.expected_purchase_timeline} />
            {lead.budget && <DetailRow label="Budget Estimate" value={lead.budget} />}
            {lead.deal_stage === 'Lost' && <DetailRow label="Lost Reason" value={lead.lost_reason} />}
            {lead.dse_follow_up_date && (
              <DetailRow 
                label="Next Follow-up" 
                value={new Date(lead.dse_follow_up_date).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })} 
              />
            )}
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

export default function DealerDetails() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [dealer, setDealer] = useState(null);
  const [leads, setLeads] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [dateRange, setDateRange] = useState({ from: '', to: '' });
  const [viewLead, setViewLead] = useState(null);

  const fetchDealerData = useCallback(async () => {
    setLoading(true);
    try {
      const dRes = await api.get(`/dealers/${id}`);
      setDealer(dRes.data.data);

      const params = {
        dealer_id: id,
        search,
        status: statusFilter,
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

  return (
    <div className="dealer-details-page">
      <div className="page-header" style={{ flexDirection: 'column', alignItems: 'flex-start', gap: 12 }}>
        <button className="btn btn-secondary btn-sm" onClick={() => navigate('/dealers')} style={{ padding: '6px 12px', borderRadius: 8 }}>
          <ChevronLeft size={16} /> Back to Dealers
        </button>
        <div style={{ width: '100%' }}>
          <h2 style={{ fontSize: '1.5rem', fontWeight: 800 }}>{dealer?.dealer_name.replace(/\s*Dealer\s*Partner\s*/gi, '') || 'Dealer'} Leads</h2>
          <p style={{ color: 'var(--grey-500)', fontSize: '0.85rem' }}>Global oversight of this partner's lead performance</p>
        </div>
      </div>

      {/* Filters Row — Responsive */}
      <div className="card" style={{ marginBottom: 20, borderRadius: 16 }}>
        <div className="card-body" style={{ padding: '16px', display: 'flex', alignItems: 'center', gap: 12, flexWrap: 'wrap' }}>
          <div className="search-bar" style={{ flex: '1 1 280px' }}>
            <Search size={16} className="search-icon" />
            <input
              placeholder="Search by name, phone..."
              value={search}
              onChange={e => setSearch(e.target.value)}
            />
          </div>

          <select 
            className="form-select" 
            style={{ flex: '1 1 150px', background: 'var(--grey-50)', height: 42, borderRadius: 10 }} 
            value={statusFilter} 
            onChange={e => setStatusFilter(e.target.value)}
          >
            <option value="">All Status</option>
            <option value="In Progress">In Progress</option>
            <option value="On Call">On Call</option>
            <option value="Completed">Completed</option>
          </select>

          <div style={{ 
            display: 'flex', alignItems: 'center', gap: 8, background: 'var(--grey-50)', 
            padding: '0 12px', borderRadius: 10, border: '1px solid var(--grey-200)', 
            height: 42, flex: '1 1 280px', flexWrap: 'wrap'
          }}>
            <Calendar size={14} color="var(--grey-400)" />
            <input type="date" className="form-control" style={{ flex: 1, border: 'none', background: 'transparent', fontSize: '0.82rem', height: 38, minHeight: 'auto' }} value={dateRange.from} onChange={e => setDateRange(prev => ({ ...prev, from: e.target.value }))} />
            <span style={{ color: 'var(--grey-300)' }}>-</span>
            <input type="date" className="form-control" style={{ flex: 1, border: 'none', background: 'transparent', fontSize: '0.82rem', height: 38, minHeight: 'auto' }} value={dateRange.to} onChange={e => setDateRange(prev => ({ ...prev, to: e.target.value }))} />
          </div>

          <button className="btn btn-primary" style={{ padding: '0 24px', height: 42, borderRadius: 10 }} onClick={fetchDealerData}>Apply</button>
        </div>
      </div>

      {/* Desktop Table View */}
      <div className="table-wrapper dealers-desktop-table" style={{ borderRadius: 16, border: '1px solid var(--grey-100)' }}>
        {loading ? (
          <div className="loading-overlay" style={{ background: 'rgba(255,255,255,0.7)' }}><div className="spinner" /></div>
        ) : leads.length === 0 ? (
          <div className="empty-state" style={{ padding: 60 }}>
            <div className="empty-state-icon"><User size={32} /></div>
            <h3>No Leads Found</h3>
            <p>No leads match your criteria for this dealer.</p>
          </div>
        ) : (
          <table className="data-table">
            <thead>
              <tr style={{ background: 'var(--grey-50)' }}>
                <th style={{ paddingLeft: 20 }}>Assigned Date</th>
                <th>Customer Name</th>
                <th>Contact info</th>
                <th>Current Status</th>
                <th>TLC Follow up</th>
                <th>Last Update</th>
                <th>Telecaller Remark</th>
                <th style={{ paddingRight: 20 }}>DSE Remark</th>
              </tr>
            </thead>
            <tbody>
              {leads.map(l => (
                <tr key={l.id}>
                  <td style={{ paddingLeft: 20, fontWeight: 700, color: 'var(--grey-600)', fontSize: '0.85rem' }}>{formatDate(l.lead_date)}</td>
                  <td style={{ fontWeight: 800, color: 'var(--tata-blue)', fontSize: '0.9rem' }}>{l.full_name}</td>
                  <td>
                    <div style={{ display: 'flex', flexDirection: 'column' }}>
                      <a href={`tel:${l.phone_number}`} style={{ fontWeight: 600, color: 'var(--green-500)', fontSize: '0.85rem' }}>{l.phone_number}</a>
                      <span style={{ fontSize: '0.72rem', color: 'var(--grey-400)', display: 'flex', alignItems: 'center', gap: 4 }}>
                        <MapPin size={10} /> {l.location}
                      </span>
                    </div>
                  </td>
                  <td>
                    <span className={`badge status-${l.status?.toLowerCase().replace(/ /g, '-')}`} style={{ fontWeight: 700 }}>
                      {l.status}
                    </span>
                  </td>
                  <td>
                    {l.follow_up_date ? (
                      <div style={{ display: 'flex', alignItems: 'center', gap: 5, fontSize: '0.8rem', color: 'var(--grey-700)', fontWeight: 600 }}>
                        <Clock size={12} color="var(--orange-500)" />
                        {formatDate(l.follow_up_date)}
                      </div>
                    ) : <span style={{ color: 'var(--grey-300)' }}>—</span>}
                  </td>
                  <td style={{ fontSize: '0.8rem', color: 'var(--grey-500)' }}>{formatDate(l.updated_at)}</td>
                  <td style={{ maxWidth: 200 }}>
                     <div style={{ fontSize: '0.8rem', color: 'var(--grey-700)', fontWeight: 500, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }} title={l.telecaller_remark}>
                        {l.telecaller_remark || '—'}
                     </div>
                  </td>
                  <td style={{ paddingRight: 20 }}>
                      {l.assigned_to_dse && l.assigned_to_dse !== 'Unassigned' ? (
                        <button className="btn btn-secondary btn-sm" style={{ padding: '4px 10px', fontSize: '0.7rem' }} onClick={() => setViewLead(l)}>View Log</button>
                      ) : <span style={{ color: 'var(--grey-300)', fontSize: '0.7rem italic' }}>No DSE</span>}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {viewLead && <DSEViewModal lead={viewLead} onClose={() => setViewLead(null)} />}

      {/* Mobile Card View */}
      <div className="dealers-mobile-cards">
        {loading ? (
          <div style={{ padding: 40, textAlign: 'center' }}><div className="spinner" /></div>
        ) : leads.map((l) => (
          <div key={l.id} style={{
            background: '#fff', borderRadius: 14, border: '1px solid var(--grey-100)',
            boxShadow: 'var(--shadow-xs)', padding: 14, marginBottom: 10
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 10 }}>
              <div style={{ flex: 1 }}>
                <div style={{ fontWeight: 800, color: 'var(--tata-blue)', fontSize: '0.95rem' }}>{l.full_name}</div>
                <div style={{ fontSize: '0.75rem', color: 'var(--grey-500)', marginTop: 2, display: 'flex', alignItems: 'center', gap: 4 }}>
                  <MapPin size={10} /> {l.location}
                </div>
              </div>
              <span className={`badge status-${l.status?.toLowerCase().replace(/ /g, '-')}`} style={{ flexShrink: 0 }}>
                {l.status}
              </span>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, marginBottom: 12 }}>
              <div style={{ background: 'var(--grey-50)', padding: '6px 10px', borderRadius: 8 }}>
                <div style={{ fontSize: '0.65rem', color: 'var(--grey-400)', fontWeight: 700, textTransform: 'uppercase', marginBottom: 2 }}>Phone</div>
                <a href={`tel:${l.phone_number}`} style={{ fontSize: '0.85rem', fontWeight: 700, color: 'var(--green-500)' }}>{l.phone_number}</a>
              </div>
              <div style={{ background: 'var(--grey-50)', padding: '6px 10px', borderRadius: 8 }}>
                <div style={{ fontSize: '0.65rem', color: 'var(--grey-400)', fontWeight: 700, textTransform: 'uppercase', marginBottom: 2 }}>Lead Date</div>
                <div style={{ fontSize: '0.85rem', fontWeight: 700, color: 'var(--grey-800)' }}>{formatDate(l.lead_date)}</div>
              </div>
            </div>

            {l.follow_up_date && (
              <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 10, padding: '6px 0', borderTop: '1px dashed var(--grey-200)' }}>
                <Clock size={12} color="var(--orange-500)" />
                <span style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--grey-600)' }}>Next Follow-up: </span>
                <span style={{ fontSize: '0.75rem', fontWeight: 800, color: 'var(--orange-500)' }}>{formatDate(l.follow_up_date)}</span>
              </div>
            )}

            {l.telecaller_remark && (
              <div style={{ background: 'rgba(0,58,143,0.03)', padding: 10, borderRadius: 10, border: '1px solid rgba(0,58,143,0.08)' }}>
                <div style={{ fontSize: '0.65rem', color: 'var(--tata-blue)', fontWeight: 800, textTransform: 'uppercase', marginBottom: 4 }}>Telecaller Remark</div>
                <div style={{ fontSize: '0.8rem', color: 'var(--grey-700)', fontWeight: 500, lineHeight: 1.4 }}>
                  {l.telecaller_remark}
                </div>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
