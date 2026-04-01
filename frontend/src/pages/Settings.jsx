import React, { useState } from 'react';
import { User, Lock, Bell, Shield, LogOut, Save } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import api from '../api/client';
import toast from 'react-hot-toast';

export default function Settings() {
  const { user, isAdmin } = useAuth();
  const [passForm, setPassForm] = useState({ current: '', new: '', confirm: '' });
  const [loading, setLoading] = useState(false);

  const handlePassChange = async (e) => {
    e.preventDefault();
    if (passForm.new !== passForm.confirm) {
      toast.error('New passwords do not match');
      return;
    }
    setLoading(true);
    try {
      await api.put('/auth/change-password', {
        current_password: passForm.current,
        new_password: passForm.new
      });
      toast.success('Password updated successfully');
      setPassForm({ current: '', new: '', confirm: '' });
    } catch (err) {
      toast.error(err.response?.data?.message || 'Password update failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ maxWidth: 800 }}>
      <div className="page-header">
        <div className="page-header-left">
          <h2>Project Settings</h2>
          <p>Manage your account and system preferences</p>
        </div>
      </div>

      <div className="dashboard-grid">
        {/* Profile Info */}
        <div className="card col-12">
          <div className="card-header"><div className="card-title"><User size={16} />Profile Information</div></div>
          <div className="card-body">
            <div style={{ display: 'flex', gap: 24, alignItems: 'center', marginBottom: 24 }}>
              <div className="user-avatar" style={{ width: 80, height: 80, fontSize: '2rem' }}>
                {(user?.full_name || 'U').split(' ').map(n=>n[0]).join('')}
              </div>
              <div style={{ flex: 1 }}>
                <h3 style={{ marginBottom: 4 }}>{user?.full_name}</h3>
                <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
                  <span className="badge badge-blue">{user?.role === 'admin' ? 'System Administrator' : user?.role === 'campaign_team' ? 'Campaign Specialist' : 'Telemarketing Head'}</span>
                  <span style={{ fontSize: '0.875rem', color: 'var(--grey-400)' }}>{user?.username}@tatamotors.com</span>
                </div>
                {user?.dealer_name && (
                  <div style={{ marginTop: 8, fontSize: '0.85rem', color: 'var(--tata-blue)', fontWeight: 600 }}>
                    Official Dealer: {user?.dealer_name}
                  </div>
                )}
              </div>
            </div>
            
            <div className="alert alert-info" style={{ margin: 0 }}>
              <Shield size={16} />
              <div>To update your profile information or contact details, please contact the System Administrator.</div>
            </div>
          </div>
        </div>

        {/* Change Password */}
        <div className="card col-12">
          <div className="card-header"><div className="card-title"><Lock size={16} />Security Settings</div></div>
          <div className="card-body">
            <h4 style={{ marginBottom: 16 }}>Change Password</h4>
            <form onSubmit={handlePassChange} style={{ maxWidth: 400 }}>
              <div className="form-group">
                <label className="form-label">Current Password</label>
                <input type="password" name='current' className="form-control" value={passForm.current} onChange={e=>setPassForm(f=>({...f, current: e.target.value}))} />
              </div>
              <div className="form-group">
                <label className="form-label">New Password</label>
                <input type="password" name='new' className="form-control" value={passForm.new} onChange={e=>setPassForm(f=>({...f, new: e.target.value}))} />
              </div>
              <div className="form-group">
                <label className="form-label">Confirm New Password</label>
                <input type="password" name='confirm' className="form-control" value={passForm.confirm} onChange={e=>setPassForm(f=>({...f, confirm: e.target.value}))} />
              </div>
              <button type="submit" className="btn btn-primary" disabled={loading}>
                {loading ? 'Changing...' : <><Save size={16} /> Update Password</>}
              </button>
            </form>
          </div>
        </div>

        {/* System Settings (Admin Only) */}
        {isAdmin && (
          <>
            <div className="card col-12">
              <div className="card-header"><div className="card-title"><Bell size={16} />System Preferences</div></div>
              <div className="card-body">
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '12px 0', borderBottom: '1px solid var(--grey-100)' }}>
                  <div>
                    <div style={{ fontWeight: 600, fontSize: '0.9rem' }}>Email Notifications</div>
                    <div style={{ fontSize: '0.8rem', color: 'var(--grey-400)' }}>Notify dealers when new leads are assigned</div>
                  </div>
                  <div style={{ width: 44, height: 24, borderRadius: 100, background: 'var(--tata-blue)', position: 'relative', cursor: 'pointer' }}>
                    <div style={{ width: 18, height: 18, borderRadius: '50%', background: '#fff', position: 'absolute', right: 3, top: 3 }} />
                  </div>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '12px 0' }}>
                  <div>
                    <div style={{ fontWeight: 600, fontSize: '0.9rem' }}>Automated Date Adjustment</div>
                    <div style={{ fontSize: '0.8rem', color: 'var(--grey-400)' }}>Convert old lead dates to previous day</div>
                  </div>
                  <div style={{ width: 44, height: 24, borderRadius: 100, background: 'var(--tata-blue)', position: 'relative', cursor: 'pointer' }}>
                    <div style={{ width: 18, height: 18, borderRadius: '50%', background: '#fff', position: 'absolute', right: 3, top: 3 }} />
                  </div>
                </div>
              </div>
            </div>

            <div className="card col-12" style={{ borderColor: 'var(--red-200)', background: 'var(--red-50)08' }}>
              <div className="card-header" style={{ borderBottomColor: 'var(--red-100)' }}>
                <div className="card-title" style={{ color: 'var(--red-600)' }}><Shield size={16} /> Danger Zone</div>
              </div>
              <div className="card-body">
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <div>
                    <div style={{ fontWeight: 700, fontSize: '0.95rem', color: 'var(--grey-900)' }}>Wipe All CRM Data</div>
                    <div style={{ fontSize: '0.82rem', color: 'var(--grey-500)', marginTop: 4 }}>This will permanently delete all leads, campaign metrics, and upload history. This action cannot be undone.</div>
                  </div>
                  <button 
                    className="btn btn-danger" 
                    onClick={async () => {
                      if (window.confirm("⚠️ ARE YOU SURE? This will permanently delete ALL leads and campaign data! This cannot be undone.")) {
                        const loadingToast = toast.loading("Clearing all data...");
                        try {
                          await api.delete('/admin/clear-all');
                          toast.success("All data cleared successfully!");
                          window.location.reload();
                        } catch (err) {
                          toast.error(err.response?.data?.message || "Failed to clear data.");
                        } finally {
                          toast.dismiss(loadingToast);
                        }
                      }
                    }}
                  >
                    Clear All Data
                  </button>
                </div>
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
