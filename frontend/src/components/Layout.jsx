import React from 'react';
import { Outlet, NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import {
  LayoutDashboard, Upload, Database, Building2, BarChart3,
  Settings, LogOut, TrendingUp, FileSpreadsheet, ChevronDown
} from 'lucide-react';

const adminNav = [
  { label: 'Dashboard', path: '/dashboard', icon: LayoutDashboard },
  { label: 'Upload Leads', path: '/upload', icon: Upload },
  { label: 'Master Leads', path: '/master-leads', icon: Database },
  { label: 'Dealers', path: '/dealers', icon: Building2 },
  { label: 'Campaign Metrics', path: '/campaign', icon: TrendingUp },
  { label: 'Reports', path: '/reports', icon: BarChart3 },
];

const dealerNav = [
  { label: 'Dashboard', path: '/dealer-dashboard', icon: LayoutDashboard },
  { label: 'My Leads', path: '/my-leads', icon: FileSpreadsheet },
];

export default function Layout() {
  const { user, logout, isDealer } = useAuth();
  const navigate = useNavigate();
  const navItems = isDealer ? dealerNav : adminNav.filter(item => {
    if (item.label === 'Upload Leads' && user?.role === 'admin') return false;
    return true;
  });

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const initials = (user?.full_name || user?.username || 'U')
    .split(' ').slice(0, 2).map(n => n[0]).join('').toUpperCase();

  const roleLabel = { admin: 'Administrator', campaign_team: 'Campaign Manager', dealer: 'Telecaller' };

  return (
    <div className="app-container">
      {/* Sidebar */}
      <aside className="sidebar">
        {/* Logo */}
        <div className="sidebar-logo">
          <div style={{
            width: 40, height: 40, borderRadius: 10,
            background: 'rgba(255,255,255,0.15)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: '1.1rem', fontWeight: 900, color: '#fff', flexShrink: 0
          }}>T</div>
          <div className="sidebar-logo-text">
            <span className="brand">TATA MOTORS</span>
            <span className="title">CRM Portal</span>
          </div>
        </div>

        {/* Navigation */}
        <nav className="sidebar-nav">
          <div className="nav-section-label">Main Menu</div>
          {navItems.map(item => (
            <NavLink
              key={item.path}
              to={item.path}
              className={({ isActive }) => `nav-item${isActive ? ' active' : ''}`}
            >
              <item.icon size={18} className="nav-icon" />
              {item.label}
            </NavLink>
          ))}
        </nav>

        {/* Footer */}
        <div className="sidebar-footer">
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '10px 8px', borderRadius: 10, background: 'rgba(255,255,255,0.06)', marginBottom: 8 }}>
            <div className="user-avatar" style={{ width: 34, height: 34, fontSize: '0.8rem' }}>{initials}</div>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ fontSize: '0.82rem', fontWeight: 600, color: '#fff', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{user?.full_name}</div>
              <div className="role-chip" style={{ marginTop: 2 }}>{roleLabel[user?.role]}</div>
            </div>
          </div>
          <button onClick={handleLogout} className="nav-item" style={{ color: 'rgba(255,100,100,0.85)', width: '100%' }}>
            <LogOut size={16} />
            Sign Out
          </button>
        </div>
      </aside>

      {/* Main */}
      <div className="main-layout">
        {/* Header */}
        <header className="main-header">
          <div className="header-left">
            <div>
              <div style={{ fontSize: '0.7rem', color: 'var(--grey-400)', fontWeight: 500, textTransform: 'uppercase', letterSpacing: '0.8px' }}>
                Tata Motors
              </div>
              <div style={{ fontSize: '1rem', fontWeight: 700, color: 'var(--grey-900)' }}>
                CRM Portal
              </div>
            </div>
          </div>
          <div className="header-right">
            <div className="user-info">
              <div className="user-avatar">{initials}</div>
              <div>
                <div className="user-name">{user?.full_name}</div>
                <div className="user-role">{roleLabel[user?.role]}</div>
              </div>
              <ChevronDown size={14} color="var(--grey-400)" />
            </div>
          </div>
        </header>

        {/* Content */}
        <main className="page-content">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
