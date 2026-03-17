import React, { useState, useEffect } from 'react';
import { BarChart3, Download, Filter, Calendar, TrendingUp, CheckCircle, Clock } from 'lucide-react';
import api from '../api/client';
import toast from 'react-hot-toast';
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer,
  PieChart, Pie, Cell, LineChart, Line
} from 'recharts';

const COLORS = ['#003A8F', '#12B76A', '#F79009', '#F04438', '#7C3AED'];

export default function Reports() {
  const [activeTab, setActiveTab] = useState('performance');
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState(null);
  const [dateRange, setDateRange] = useState({ 
    from: new Date(new Date().setDate(new Date().getDate() - 30)).toISOString().split('T')[0],
    to: new Date().toISOString().split('T')[0]
  });

  const fetchData = async () => {
    setLoading(true);
    try {
      let endpoint = '/reports/dealer-performance';

      const res = await api.get(endpoint, { 
        params: { date_from: dateRange.from, date_to: dateRange.to } 
      });
      const cleanedData = (res.data.data || []).map(d => ({
        ...d,
        dealer_name: d.dealer_name.replace(/\s*Dealer\s*Partner\s*/gi, '')
      }));
      setData(cleanedData);
    } catch (err) {
      toast.error('Failed to load report data');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchData(); }, [activeTab]);

  const handleExportCSV = () => {
    if (!data || data.length === 0) {
      toast.error('No data to export');
      return;
    }

    let csvContent = "data:text/csv;charset=utf-8,";
    
    csvContent += "Dealer Name,Total Leads,Completed,In Progress,On Call,Follow-ups Done,Completion Rate %\n";
    data.forEach(d => {
      csvContent += `"${d.dealer_name}",${d.total_leads},${d.completed},${d.in_progress},${d.on_call},${d.leads_with_followup},${d.conversion_rate}\n`;
    });

    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `TataMotors_CRM_${activeTab}_Report.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    toast.success('CSV Downloaded');
  };

  return (
    <div>
      <div className="page-header">
        <div className="page-header-left">
          <h2>Analytics & Reports</h2>
          <p>Export and analyze lead performance data</p>
        </div>
        <div className="page-header-actions">
          <div className="tab-bar">
            <button className={`tab-item active`}>Dealer Performance</button>
          </div>
        </div>
      </div>

      {/* Filters Row - Redesigned for premium look */}
      <div className="filters-row" style={{ 
        background: '#fff', 
        padding: '20px', 
        borderRadius: '16px', 
        boxShadow: '0 4px 15px rgba(0,0,0,0.03)', 
        border: '1px solid var(--grey-100)',
        marginBottom: '24px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <Calendar size={18} style={{ color: 'var(--tata-blue)' }} />
            <span style={{ fontSize: '0.85rem', fontWeight: 700, color: 'var(--grey-700)' }}>Period:</span>
          </div>
          
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, background: 'var(--grey-50)', padding: '6px 12px', borderRadius: '10px', border: '1px solid var(--grey-100)' }}>
            <input 
              type="date" 
              className="form-control" 
              style={{ width: 140, border: 'none', background: 'transparent', height: '32px', fontSize: '0.82rem', fontWeight: 600 }} 
              value={dateRange.from} 
              onChange={e => setDateRange(r => ({ ...r, from: e.target.value }))} 
            />
            <span style={{ color: 'var(--grey-300)', fontWeight: 700 }}>→</span>
            <input 
              type="date" 
              className="form-control" 
              style={{ width: 140, border: 'none', background: 'transparent', height: '32px', fontSize: '0.82rem', fontWeight: 600 }} 
              value={dateRange.to} 
              onChange={e => setDateRange(r => ({ ...r, to: e.target.value }))} 
            />
          </div>

          <button className="btn btn-primary" onClick={fetchData} style={{ borderRadius: '10px', padding: '10px 24px' }}>
            <Filter size={14} /> Apply Analytics
          </button>
        </div>

        <button className="btn btn-secondary" onClick={handleExportCSV} style={{ borderRadius: '10px', padding: '10px 20px', border: '1px solid var(--grey-200)' }}>
          <Download size={14} /> Export Report
        </button>
      </div>

      {loading ? (
        <div className="loading-overlay"><div className="spinner" /></div>
      ) : (
        <div className="dashboard-grid">
          <div className="card col-12">
            <div className="card-header" style={{ borderBottom: 'none' }}>
              <div className="card-title">Dealer Completion Velocity (%)</div>
            </div>
            <div className="card-body" style={{ padding: '0 24px 24px 24px' }}>
              <ResponsiveContainer width="100%" height={350}>
                <BarChart data={data || []} margin={{ top: 20 }}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="var(--grey-100)" />
                  <XAxis 
                    dataKey="dealer_name" 
                    tick={{fontSize: 10, fontWeight: 500, fill: 'var(--grey-500)'}} 
                    interval={0} 
                    angle={-30} 
                    textAnchor="end" 
                    height={80}
                    dy={10}
                  />
                  <YAxis tick={{fontSize: 11, fill: 'var(--grey-400)'}} unit="%" />
                  <Tooltip 
                    cursor={{fill: 'var(--grey-50)'}}
                    contentStyle={{ borderRadius: '10px', border: 'none', boxShadow: '0 8px 20px rgba(0,0,0,0.08)' }}
                  />
                  <Bar dataKey="conversion_rate" name="Completion Rate" fill="var(--tata-blue)" radius={[6, 6, 0, 0]} barSize={40} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
