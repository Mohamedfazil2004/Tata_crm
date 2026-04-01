import React, { useState, useEffect } from 'react';
import { TrendingUp, AlertCircle, Calendar, DollarSign, Users, Award, Plus, X } from 'lucide-react';
import api from '../api/client';
import toast from 'react-hot-toast';
import { useAuth } from '../context/AuthContext';

function MetricCard({ label, value, icon: Icon, color }) {
  return (
    <div className="stat-card" style={{ padding: '16px 20px', borderRadius: 16 }}>
      <div className={`stat-icon ${color}`} style={{ width: 44, height: 44, borderRadius: 12 }}>
        <Icon size={20} />
      </div>
      <div className="stat-content">
        <div className="stat-label" style={{ fontSize: '0.72rem', letterSpacing: 0.5 }}>{label}</div>
        <div className="stat-value" style={{ fontSize: '1.2rem', fontWeight: 800 }}>{value}</div>
      </div>
    </div>
  );
}

export default function CampaignMetrics() {
  const { isCampaign } = useAuth();
  const [metrics, setMetrics] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showEntryModal, setShowEntryModal] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const [formData, setFormData] = useState({
    metric_date: new Date().toISOString().split('T')[0],
    total_leads: '',
    ad_spend: ''
  });

  const fetchMetrics = () => {
    setLoading(true);
    api.get('/campaign/metrics')
      .then(r => setMetrics(r.data.data))
      .catch(() => toast.error('Failed to load metrics'))
      .finally(() => setLoading(false));
  };

  useEffect(() => { fetchMetrics(); }, []);

  const totalSpend = metrics.reduce((acc, m) => acc + parseFloat(m.ad_spend || 0), 0);
  const totalLeads = metrics.reduce((acc, m) => acc + (m.total_leads || 0), 0);
  const avgCPL = totalLeads > 0 ? (totalSpend / totalLeads).toFixed(2) : '0.00';

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.metric_date || !formData.total_leads || !formData.ad_spend) {
      return toast.error('Please fill all fields');
    }

    setSubmitting(true);
    try {
      await api.post('/campaign/metrics', {
        ...formData,
        total_leads: parseInt(formData.total_leads),
        ad_spend: parseFloat(formData.ad_spend)
      });
      toast.success('Campaign metrics updated');
      setShowEntryModal(false);
      fetchMetrics();
      setFormData({
        metric_date: new Date().toISOString().split('T')[0],
        total_leads: '',
        ad_spend: ''
      });
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to save metrics');
    } finally {
      setSubmitting(false);
    }
  };

  const currentCpl = (formData.ad_spend && formData.total_leads && formData.total_leads > 0)
    ? (parseFloat(formData.ad_spend) / parseInt(formData.total_leads)).toFixed(2)
    : '0.00';

  return (
    <div className="campaign-metrics-page" style={{ maxWidth: 1200, margin: '0 auto' }}>
      <div className="page-header">
        <div className="page-header-left">
          <h2 style={{ fontSize: '1.5rem', fontWeight: 800 }}>Campaign Performance</h2>
          <p style={{ color: 'var(--grey-500)', fontSize: '0.85rem' }}>Historical daily ad spend and lead counts from Meta platforms</p>
        </div>
        {isCampaign && (
          <button 
            className="btn btn-primary" 
            onClick={() => setShowEntryModal(true)}
            style={{ display: 'flex', alignItems: 'center', gap: 8, borderRadius: 12, padding: '10px 18px' }}
          >
            <Plus size={18} /> Entry New Campaign
          </button>
        )}
      </div>

      <div className="stats-grid" style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', marginBottom: 24, gap: 16 }}>
        <MetricCard label="Global Ad Spend" value={`₹${totalSpend.toLocaleString('en-IN')}`} icon={DollarSign} color="blue" />
        <MetricCard label="Total Leads Captured" value={totalLeads.toLocaleString()} icon={Users} color="orange" />
        <MetricCard label="Average CPL" value={`₹${avgCPL}`} icon={Award} color="green" />
      </div>

      <div className="card" style={{ borderRadius: 16, border: '1px solid var(--grey-100)', overflow: 'hidden' }}>
        <div className="card-header" style={{ padding: '16px 20px', background: 'var(--grey-50)', borderBottom: '1px solid var(--grey-100)' }}>
          <div className="card-title" style={{ display: 'flex', alignItems: 'center', gap: 10, fontSize: '0.9rem', fontWeight: 800 }}>
            <TrendingUp size={18} color="var(--tata-blue)" /> Historical Daily Breakdown
          </div>
        </div>
        
        <div className="card-body" style={{ padding: 0 }}>
          {loading ? (
            <div style={{ padding: 60, textAlign: 'center' }}><div className="spinner" /></div>
          ) : metrics.length === 0 ? (
            <div className="empty-state" style={{ padding: 60 }}>
              <div className="empty-state-icon" style={{ background: 'var(--grey-50)', color: 'var(--grey-300)' }}><AlertCircle size={32} /></div>
              <h3>No metrics recorded</h3>
              <p>Daily ad spend data will appear here once entered by the Campaign Manager.</p>
            </div>
          ) : (
            <>
              <div className="desktop-table-view">
                <table className="data-table">
                  <thead>
                    <tr style={{ background: 'white' }}>
                      <th style={{ paddingLeft: 20 }}>Reporting Date</th>
                      <th>Leads Generated</th>
                      <th>Ad Spend</th>
                      <th style={{ paddingRight: 20 }}>Cost per Lead (CPL)</th>
                    </tr>
                  </thead>
                  <tbody>
                    {metrics.map(m => (
                      <tr key={m.id}>
                        <td style={{ paddingLeft: 20, fontWeight: 700, color: 'var(--grey-900)' }}>{new Date(m.metric_date).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })}</td>
                        <td><span className="badge badge-blue" style={{ minWidth: 60, justifyContent: 'center', fontWeight: 700 }}>{m.total_leads}</span></td>
                        <td style={{ fontWeight: 700, color: 'var(--grey-700)' }}>₹{parseFloat(m.ad_spend).toLocaleString('en-IN')}</td>
                        <td style={{ paddingRight: 20 }}>
                           <span style={{ fontWeight: 800, color: (m.ad_spend / (m.total_leads || 1)) > 50 ? 'var(--red-500)' : 'var(--green-500)' }}>
                             ₹{(m.ad_spend / (m.total_leads || 1)).toFixed(2)}
                           </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              <div className="mobile-only mobile-card-list" style={{ padding: 16 }}>
                {metrics.map(m => (
                  <div key={m.id} className="mobile-card-item" style={{ marginBottom: 12 }}>
                    <div className="card-list-row">
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8, fontWeight: 700, color: 'var(--grey-900)' }}>
                        <Calendar size={14} color="var(--tata-blue)" /> {new Date(m.metric_date).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })}
                      </div>
                      <span className="badge badge-blue">{m.total_leads} Leads</span>
                    </div>
                    <div className="card-list-row" style={{ marginTop: 8 }}>
                       <span className="card-list-label">Expenditure</span>
                       <span style={{ fontWeight: 800, color: 'var(--grey-900)' }}>₹{parseFloat(m.ad_spend).toLocaleString()}</span>
                    </div>
                    <div className="card-list-row">
                       <span className="card-list-label">Unit Cost (CPL)</span>
                       <span style={{ fontWeight: 800, color: (m.ad_spend / (m.total_leads || 1)) > 50 ? 'var(--red-500)' : 'var(--green-500)' }}>₹{(m.ad_spend / (m.total_leads || 1)).toFixed(2)}</span>
                    </div>
                  </div>
                ))}
              </div>
            </>
          )}
        </div>
      </div>

      {showEntryModal && (
        <div className="modal-overlay" style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', backdropFilter: 'blur(4px)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000, padding: 16 }}>
          <div className="modal-content card" style={{ maxWidth: 450, width: '100%', borderRadius: 20, animation: 'slideUp 0.3s ease-out' }}>
            <div className="modal-header" style={{ padding: '20px 24px', borderBottom: '1px solid var(--grey-100)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <h3 style={{ margin: 0, fontWeight: 800 }}>New Campaign Entry</h3>
              <button className="icon-btn" onClick={() => setShowEntryModal(false)}><X size={20} /></button>
            </div>
            <form onSubmit={handleSubmit} style={{ padding: 24 }}>
              <div className="form-group" style={{ marginBottom: 16 }}>
                <label className="form-label" style={{ display: 'block', marginBottom: 6, fontWeight: 600 }}>Campaign Date</label>
                <input 
                  type="date" 
                  className="form-control" 
                  value={formData.metric_date}
                  onChange={e => setFormData({ ...formData, metric_date: e.target.value })}
                  style={{ borderRadius: 10 }}
                />
              </div>
              <div className="form-grid" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, marginBottom: 16 }}>
                <div className="form-group">
                  <label className="form-label" style={{ display: 'block', marginBottom: 6, fontWeight: 600 }}>Leads Count</label>
                  <input 
                    type="number" 
                    className="form-control" 
                    placeholder="Enter count"
                    value={formData.total_leads}
                    onChange={e => setFormData({ ...formData, total_leads: e.target.value })}
                    style={{ borderRadius: 10 }}
                  />
                </div>
                <div className="form-group">
                  <label className="form-label" style={{ display: 'block', marginBottom: 6, fontWeight: 600 }}>Ad Spend (₹)</label>
                  <input 
                    type="number" 
                    className="form-control" 
                    placeholder="Enter amount"
                    value={formData.ad_spend}
                    onChange={e => setFormData({ ...formData, ad_spend: e.target.value })}
                    style={{ borderRadius: 10 }}
                  />
                </div>
              </div>

              <div style={{ background: 'var(--grey-50)', padding: 16, borderRadius: 12, marginBottom: 24 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span style={{ fontSize: '0.85rem', color: 'var(--grey-600)' }}>Calculated Cost Per Lead:</span>
                  <span style={{ fontWeight: 800, fontSize: '1.1rem', color: 'var(--tata-blue)' }}>₹{currentCpl}</span>
                </div>
              </div>

              <div style={{ display: 'flex', gap: 12 }}>
                <button type="button" className="btn btn-secondary" onClick={() => setShowEntryModal(false)} style={{ flex: 1, borderRadius: 12 }}>Cancel</button>
                <button type="submit" className="btn btn-primary" disabled={submitting} style={{ flex: 2, borderRadius: 12 }}>
                  {submitting ? 'Saving...' : 'Save Entry'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      <style>{`
        @keyframes slideUp {
          from { transform: translateY(20px); opacity: 0; }
          to { transform: translateY(0); opacity: 1; }
        }
      `}</style>
    </div>
  );
}

