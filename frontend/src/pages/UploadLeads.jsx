import React, { useState, useEffect } from 'react';
import { Upload, FileSpreadsheet, CheckCircle, XCircle, AlertCircle, Clock, RefreshCw, X, FileText } from 'lucide-react';
import api from '../api/client';
import toast from 'react-hot-toast';

export default function UploadLeads() {
  const [files, setFiles] = useState([]);
  const [dragging, setDragging] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [uploadResults, setUploadResults] = useState([]); // Array of { name, success, message, data }
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

  const handleFiles = (newFiles) => {
    const validFiles = Array.from(newFiles).filter(f => 
      ['application/vnd.openxmlformats-officedocument.spreadsheetml.sheet', 'application/vnd.ms-excel', 'text/csv'].includes(f.type) ||
      f.name.endsWith('.xlsx') || f.name.endsWith('.xls') || f.name.endsWith('.csv')
    );
    
    if (validFiles.length < Array.from(newFiles).length) {
      toast.error('Some files were rejected. Only Excel and CSV are supported.');
    }
    
    setFiles(prev => [...prev, ...validFiles]);
  };

  const removeFile = (index) => {
    setFiles(prev => prev.filter((_, i) => i !== index));
  };

  const handleDrop = (e) => {
    e.preventDefault();
    setDragging(false);
    if (e.dataTransfer.files) handleFiles(e.dataTransfer.files);
  };

  const handleUpload = async () => {
    if (files.length === 0) return;
    
    setUploading(true);
    setUploadResults([]);
    
    const results = [];
    
    // Process all files
    const uploadPromises = files.map(async (file) => {
      const formData = new FormData();
      formData.append('file', file);
      
      try {
        const res = await api.post('/upload/leads', formData, {
          headers: { 'Content-Type': 'multipart/form-data' }
        });
        const result = { name: file.name, success: true, message: res.data.message, data: res.data.data };
        setUploadResults(prev => [result, ...prev]);
        return result;
      } catch (err) {
        const msg = err.response?.data?.message || 'Upload failed';
        const result = { name: file.name, success: false, message: msg };
        setUploadResults(prev => [result, ...prev]);
        return result;
      }
    });

    try {
      await Promise.all(uploadPromises);
      const successCount = (await Promise.all(uploadPromises)).filter(r => r.success).length;
      if (successCount > 0) {
        toast.success(`Successfully processed ${successCount} files`);
        setFiles([]);
        loadBatches();
      }
    } catch (err) {
      console.error('Batch upload error:', err);
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
          <p>Multi-batch processing: Upload multiple Facebook/Instagram Excel files simultaneously</p>
        </div>
      </div>

      <div className="dashboard-grid">
        {/* Upload Zone */}
        <div className="col-6">
          <div className="card" style={{ marginBottom: 24 }}>
            <div className="card-header">
              <div className="card-title"><Upload size={16} />Batch Upload Files</div>
            </div>
            <div className="card-body">
              <div className="alert alert-info" style={{ marginBottom: 16 }}>
                <AlertCircle size={16} style={{ flexShrink: 0 }} />
                <div style={{ fontSize: '0.85rem' }}>
                  <strong>Batch Mode:</strong> You can now select and process multiple Excel files at once. Each file will be tracked as a separate upload batch.
                </div>
              </div>

              {/* Drop zone */}
              <div
                className={`upload-zone${dragging ? ' dragging' : ''}`}
                onDragOver={e => { e.preventDefault(); setDragging(true); }}
                onDragLeave={() => setDragging(false)}
                onDrop={handleDrop}
                onClick={() => document.getElementById('fileInput').click()}
                style={{ minHeight: 180 }}
              >
                <div className="upload-zone-icon">
                  <Upload size={32} />
                </div>
                <div style={{ fontWeight: 700, color: 'var(--grey-700)', marginBottom: 4 }}>Drop multiple files here</div>
                <div style={{ fontSize: '0.8rem', color: 'var(--grey-400)' }}>or click to browse — Select multiple files with Ctrl/Shift</div>
              </div>
              <input id="fileInput" type="file" accept=".xlsx,.xls,.csv" multiple style={{ display: 'none' }}
                onChange={e => handleFiles(e.target.files)} />

              {/* Selected Files List */}
              {files.length > 0 && (
                <div style={{ marginTop: 20 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 10 }}>
                    <span style={{ fontSize: '0.8rem', fontWeight: 800, color: 'var(--grey-500)', textTransform: 'uppercase' }}>Selected Files ({files.length})</span>
                    <button onClick={() => setFiles([])} style={{ fontSize: '0.75rem', background: 'none', border: 'none', color: 'var(--red-500)', cursor: 'pointer', fontWeight: 700 }}>Clear All</button>
                  </div>
                  <div style={{ maxHeight: 200, overflowY: 'auto' }}>
                    {files.map((f, i) => (
                      <div key={i} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', background: 'var(--grey-50)', padding: '10px 12px', borderRadius: 10, marginBottom: 8, border: '1px solid var(--grey-100)' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 10, overflow: 'hidden' }}>
                          <FileText size={16} color="var(--tata-blue)" />
                          <div style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', fontSize: '0.85rem', fontWeight: 600 }}>{f.name}</div>
                        </div>
                        <button onClick={(e) => { e.stopPropagation(); removeFile(i); }} style={{ padding: 4, borderRadius: 6, background: 'none', border: 'none', color: 'var(--grey-400)', cursor: 'pointer' }}>
                          <X size={14} />
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              <button className="btn btn-primary btn-lg" style={{ width: '100%', marginTop: 20, borderRadius: 12, height: 50 }}
                onClick={handleUpload} disabled={files.length === 0 || uploading}>
                {uploading ? (
                  <><div className="spinner" style={{ width: 18, height: 18, borderWidth: 2 }} /> Processing Batch...</>
                ) : (
                  <><Upload size={18} /> Process {files.length} Files</>
                )}
              </button>
            </div>
          </div>

          {/* Individual Results List */}
          {uploadResults.length > 0 && (
            <div style={{ marginTop: 24 }}>
              <div style={{ fontSize: '0.8rem', fontWeight: 800, color: 'var(--grey-500)', textTransform: 'uppercase', marginBottom: 12 }}>Upload Results</div>
              {uploadResults.map((res, i) => (
                <div key={i} className={`alert ${res.success ? 'alert-success' : 'alert-error'}`} style={{ marginBottom: 10, borderRadius: 12 }}>
                  {res.success ? <CheckCircle size={16} style={{ flexShrink: 0 }} /> : <XCircle size={16} style={{ flexShrink: 0 }} />}
                  <div style={{ overflow: 'hidden' }}>
                    <div style={{ fontWeight: 700, fontSize: '0.85rem' }}>{res.name}</div>
                    <div style={{ fontSize: '0.78rem', marginTop: 2 }}>
                      {res.success ? (
                        <>Success: {res.data.processed} leads added</>
                      ) : (
                        <>{res.message}</>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
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

