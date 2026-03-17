import React, { useState, useEffect } from 'react';
import { Upload, FileSpreadsheet, CheckCircle, XCircle, AlertCircle, Clock, RefreshCw } from 'lucide-react';
import api from '../api/client';
import toast from 'react-hot-toast';

export default function UploadLeads() {
  const [file, setFile] = useState(null);
  const [dragging, setDragging] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [result, setResult] = useState(null);
  const [batches, setBatches] = useState([]);
  const [loadingBatches, setLoadingBatches] = useState(true);

  const loadBatches = () => {
    setLoadingBatches(true);
    api.get('/upload/batches')
      .then(r => setBatches(r.data.data))
      .catch(() => {})
      .finally(() => setLoadingBatches(false));
  };

  useEffect(() => { loadBatches(); }, []);

  const handleDrop = (e) => {
    e.preventDefault();
    setDragging(false);
    const f = e.dataTransfer.files[0];
    if (f) setFile(f);
  };

  const handleUpload = async () => {
    if (!file) return;
    setUploading(true);
    setResult(null);
    const formData = new FormData();
    formData.append('file', file);
    try {
      const res = await api.post('/upload/leads', formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
      setResult({ success: true, ...res.data });
      toast.success(res.data.message);
      setFile(null);
      loadBatches();
    } catch (err) {
      const msg = err.response?.data?.message || 'Upload failed';
      setResult({ success: false, message: msg });
      toast.error(msg);
    } finally {
      setUploading(false);
    }
  };

  const statusIcon = (status) => {
    if (status === 'completed') return <CheckCircle size={16} color="var(--green-500)" />;
    if (status === 'failed') return <XCircle size={16} color="var(--red-500)" />;
    return <Clock size={16} color="var(--yellow-500)" />;
  };

  return (
    <div>
      <div className="page-header">
        <div className="page-header-left">
          <h2>Upload Leads</h2>
          <p>Upload Meta advertisement leads from Facebook and Instagram Excel files</p>
        </div>
      </div>

      <div className="dashboard-grid">
        {/* Upload Zone */}
        <div className="col-6">
          <div className="card">
            <div className="card-header">
              <div className="card-title"><Upload size={16} />Upload Excel File</div>
            </div>
            <div className="card-body">
              {/* Info */}
              <div className="alert alert-info" style={{ marginBottom: 16 }}>
                <AlertCircle size={16} style={{ flexShrink: 0 }} />
                <div>
                  <strong>Auto-processing:</strong> The system will automatically remove unwanted columns, map Tamil fields to English, adjust lead dates, and assign leads to the correct dealer based on district.
                </div>
              </div>

              {/* Drop zone */}
              <div
                className={`upload-zone${dragging ? ' dragging' : ''}`}
                onClick={() => document.getElementById('fileInput').click()}
                onDragOver={e => { e.preventDefault(); setDragging(true); }}
                onDragLeave={() => setDragging(false)}
                onDrop={handleDrop}
              >
                <div className="upload-zone-icon">
                  <FileSpreadsheet size={28} />
                </div>
                {file ? (
                  <>
                    <div style={{ fontWeight: 600, color: 'var(--grey-900)', marginBottom: 4 }}>{file.name}</div>
                    <div style={{ fontSize: '0.8rem', color: 'var(--grey-400)' }}>{(file.size / 1024).toFixed(1)} KB — Click to change</div>
                  </>
                ) : (
                  <>
                    <div style={{ fontWeight: 600, color: 'var(--grey-700)', marginBottom: 4 }}>Drop your Excel file here</div>
                    <div style={{ fontSize: '0.8rem', color: 'var(--grey-400)' }}>or click to browse — .xlsx, .xls files supported</div>
                  </>
                )}
              </div>
              <input id="fileInput" type="file" accept=".xlsx,.xls,.csv" style={{ display: 'none' }}
                onChange={e => setFile(e.target.files[0])} />

              <button className="btn btn-primary btn-lg" style={{ width: '100%', marginTop: 16 }}
                onClick={handleUpload} disabled={!file || uploading}>
                {uploading ? (
                  <><div className="spinner" style={{ width: 18, height: 18, borderWidth: 2 }} /> Processing Leads...</>
                ) : (
                  <><Upload size={18} /> Upload & Process</>
                )}
              </button>
            </div>
          </div>

          {/* Result */}
          {result && (
            <div className={`alert ${result.success ? 'alert-success' : 'alert-error'}`} style={{ marginTop: 16 }}>
              {result.success ? <CheckCircle size={16} style={{ flexShrink: 0 }} /> : <XCircle size={16} style={{ flexShrink: 0 }} />}
              <div>
                <strong>{result.message}</strong>
                {result.data && (
                  <div style={{ marginTop: 6, fontSize: '0.82rem' }}>
                    Total rows: {result.data.total_rows} | Processed: {result.data.processed}
                    {result.data.errors?.length > 0 && (
                      <div style={{ marginTop: 4 }}>
                        Errors: {result.data.errors.map((e, i) => <div key={i}>{e}</div>)}
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Column mapping info */}
          <div className="card" style={{ marginTop: 16 }}>
            <div className="card-header">
              <div className="card-title">Column Mapping</div>
            </div>
            <div className="card-body" style={{ padding: '12px 16px' }}>
              <table style={{ width: '100%', fontSize: '0.82rem', borderCollapse: 'collapse' }}>
                <thead>
                  <tr>
                    <th style={{ textAlign: 'left', padding: '6px 8px', color: 'var(--grey-500)', fontWeight: 600 }}>Excel Column</th>
                    <th style={{ textAlign: 'left', padding: '6px 8px', color: 'var(--grey-500)', fontWeight: 600 }}>CRM Field</th>
                  </tr>
                </thead>
                <tbody>
                  {[
                    ['உங்கள்_மாவட்டம்', 'Location'],
                    ['உங்களுக்கு_விருப்பப்பட்ட_வாகனம்', 'Model'],
                    ['full name', 'Name'],
                    ['phone_number', 'Phone Number'],
                  ].map(([from, to]) => (
                    <tr key={from} style={{ borderTop: '1px solid var(--grey-100)' }}>
                      <td style={{ padding: '8px 8px', color: 'var(--grey-600)', fontFamily: 'monospace', fontSize: '0.8rem' }}>{from}</td>
                      <td style={{ padding: '8px 8px' }}>
                        <span className="badge badge-blue">{to}</span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>

        {/* Upload History */}
        <div className="col-6">
          <div className="card">
            <div className="card-header">
              <div className="card-title"><Clock size={16} />Upload History</div>
              <button className="btn btn-secondary btn-sm" onClick={loadBatches}>
                <RefreshCw size={14} />
              </button>
            </div>
            <div className="table-wrapper" style={{ border: 'none', borderRadius: 0 }}>
              {loadingBatches ? (
                <div className="loading-overlay"><div className="spinner" /></div>
              ) : batches.length === 0 ? (
                <div className="empty-state" style={{ padding: 32 }}>
                  <h3>No uploads yet</h3>
                  <p>Upload history will appear here</p>
                </div>
              ) : (
                <table className="data-table">
                  <thead>
                    <tr><th>Date</th><th>File Name</th><th>Records</th><th>Status</th><th>By</th></tr>
                  </thead>
                  <tbody>
                    {batches.map(b => (
                      <tr key={b.id}>
                        <td style={{ fontSize: '0.8rem', whiteSpace: 'nowrap' }}>{new Date(b.created_at).toLocaleDateString('en-IN')}</td>
                        <td style={{ fontSize: '0.8rem', maxWidth: 160, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }} title={b.file_name}>{b.file_name}</td>
                        <td>
                          <span style={{ fontSize: '0.82rem' }}>{b.processed_records} / {b.total_records}</span>
                        </td>
                        <td>
                          <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                            {statusIcon(b.status)}
                            <span style={{ fontSize: '0.78rem', textTransform: 'capitalize' }}>{b.status}</span>
                          </div>
                        </td>
                        <td style={{ fontSize: '0.8rem', color: 'var(--grey-400)' }}>{b.uploaded_by_name}</td>
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
