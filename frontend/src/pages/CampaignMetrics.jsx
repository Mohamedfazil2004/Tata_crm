import React, { useState, useEffect } from 'react';
import { TrendingUp, Plus, Calendar, Save, Trash2, AlertCircle } from 'lucide-react';
import api from '../api/client';
import toast from 'react-hot-toast';

export default function CampaignMetrics() {
  const [metrics, setMetrics] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showAdd, setShowAdd] = useState(false);
  const [form, setForm] = useState({
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

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.metric_date || form.total_leads === '' || form.ad_spend === '') {
      toast.error('All fields are required');
      return;
    }
    try {
      await api.post('/campaign/metrics', form);
      toast.success('Metrics saved successfully');
      setShowAdd(false);
      setForm({ metric_date: new Date().toISOString().split('T')[0], total_leads: '', ad_spend: '' });
      fetchMetrics();
    } catch (err) {
      toast.error('Failed to save metrics');
    }
  };

  const handleDelete = async (date) => {
    if (!window.confirm('Are you sure you want to delete this metric?')) return;
    try {
      await api.delete(`/campaign/metrics/${date}`);
      toast.success('Metric deleted');
      fetchMetrics();
    } catch (err) {
      toast.error('Failed to delete');
    }
  };

  return (
    <div>
      <div className="page-header">
        <div className="page-header-left">
          <h2>Campaign Metrics</h2>
          <p>Update daily ad spend and lead counts from Meta platforms</p>
        </div>
        <button className="btn btn-primary" onClick={() => setShowAdd(!showAdd)}>
          <Plus size={16} /> Enter Daily Numbers
        </button>
      </div>

      <div className="dashboard-grid">
        {showAdd && (
          <div className="col-12">
            <div className="card" style={{ border: '1px solid var(--tata-blue)', boxShadow: 'var(--shadow-lg)' }}>
              <div className="card-header" style={{ background: 'var(--tata-blue-50)' }}>
                <div className="card-title" style={{ color: 'var(--tata-blue)' }}>Entry Daily Performance</div>
              </div>
              <div className="card-body">
                <form onSubmit={handleSubmit} style={{ display: 'flex', gap: 20, alignItems: 'flex-end', flexWrap: 'wrap' }}>
                  <div className="form-group" style={{ flex: 1, minWidth: 200, marginBottom: 0 }}>
                    <label className="form-label">Date</label>
                    <input type="date" className="form-control" value={form.metric_date} onChange={e => setForm(f => ({ ...f, metric_date: e.target.value }))} />
                  </div>
                  <div className="form-group" style={{ flex: 1, minWidth: 150, marginBottom: 0 }}>
                    <label className="form-label">Total Leads (Meta)</label>
                    <input type="number" className="form-control" placeholder="0" value={form.total_leads} onChange={e => setForm(f => ({ ...f, total_leads: e.target.value }))} />
                  </div>
                  <div className="form-group" style={{ flex: 1, minWidth: 150, marginBottom: 0 }}>
                    <label className="form-label">Ad Spend (₹)</label>
                    <input type="number" className="form-control" placeholder="0.00" value={form.ad_spend} onChange={e => setForm(f => ({ ...f, ad_spend: e.target.value }))} />
                  </div>
                  <div style={{ display: 'flex', gap: 10 }}>
                    <button type="button" className="btn btn-secondary" onClick={() => setShowAdd(false)}>Cancel</button>
                    <button type="submit" className="btn btn-primary"><Save size={16} /> Save Entries</button>
                  </div>
                </form>
              </div>
            </div>
          </div>
        )}

        <div className="col-12">
          <div className="card">
            <div className="card-header"><div className="card-title"><TrendingUp size={16} />Historical Data</div></div>
            <div className="table-wrapper" style={{ border: 'none', borderRadius: 0 }}>
              {loading ? (
                <div className="loading-overlay"><div className="spinner" /></div>
              ) : metrics.length === 0 ? (
                <div className="empty-state">
                  <div className="empty-state-icon"><AlertCircle size={28} /></div>
                  <h3>No metrics entered yet</h3>
                  <p>Daily ad spend data will appear here</p>
                </div>
              ) : (
                <table className="data-table">
                  <thead>
                    <tr>
                      <th>Date</th>
                      <th>Total Leads</th>
                      <th>Ad Spend (₹)</th>
                      <th>Cost per Lead (CPL)</th>
                      <th>Updated By</th>
                      <th style={{ textAlign: 'right' }}>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {metrics.map(m => (
                      <tr key={m.id}>
                        <td style={{ fontWeight: 600 }}>{new Date(m.metric_date).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })}</td>
                        <td><span className="badge badge-blue">{m.total_leads}</span></td>
                        <td style={{ fontWeight: 600 }}>₹{parseFloat(m.ad_spend).toLocaleString('en-IN')}</td>
                        <td>₹{(m.ad_spend / (m.total_leads || 1)).toFixed(2)}</td>
                        <td style={{ fontSize: '0.8rem', color: 'var(--grey-500)' }}>{m.entered_by_name}</td>
                        <td style={{ textAlign: 'right' }}>
                          <button className="btn btn-secondary btn-sm btn-icon" style={{ borderColor: 'var(--red-50)' }} onClick={() => handleDelete(m.metric_date)}>
                            <Trash2 size={14} color="var(--red-500)" />
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
