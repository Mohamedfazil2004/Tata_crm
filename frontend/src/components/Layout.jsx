import React, { useState, useEffect } from 'react';
import { Outlet, NavLink, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import {
  LayoutDashboard, Upload, Database, Building2, BarChart3,
  Settings, LogOut, TrendingUp, FileSpreadsheet, Menu, X
} from 'lucide-react';
import InstallPWA from './InstallPWA';

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
  const { user, logout, isDealer, isDSE } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const navItems = (isDealer || isDSE) ? dealerNav : adminNav.filter(item => {
    if (item.label === 'Upload Leads' && user?.role === 'admin') return false;
    return true;
  });

  // Close sidebar on route change (mobile)
  useEffect(() => {
    setSidebarOpen(false);
  }, [location.pathname]);

  // Close sidebar on outside click (mobile)
  useEffect(() => {
    if (!sidebarOpen) return;
    const handler = (e) => {
      if (!e.target.closest('.sidebar') && !e.target.closest('.hamburger-btn')) {
        setSidebarOpen(false);
      }
    };
    document.addEventListener('mousedown', handler);
    document.addEventListener('touchstart', handler);
    return () => {
      document.removeEventListener('mousedown', handler);
      document.removeEventListener('touchstart', handler);
    };
  }, [sidebarOpen]);

  // Prevent body scroll when mobile sidebar open
  useEffect(() => {
    if (sidebarOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => { document.body.style.overflow = ''; };
  }, [sidebarOpen]);

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const initials = (user?.full_name || user?.username || 'U')
    .split(' ').slice(0, 2).map(n => n[0]).join('').toUpperCase();

  const roleLabel = {
    admin: 'Administrator',
    campaign_team: 'Campaign Manager',
    dealer: 'Telecaller',
    dse: 'Sales Executive'
  };

  return (
    <div className="app-container">
      {/* Mobile Overlay */}
      {sidebarOpen && (
        <div
          className="sidebar-overlay"
          onClick={() => setSidebarOpen(false)}
          aria-hidden="true"
        />
      )}

      {/* Sidebar */}
      <aside className={`sidebar${sidebarOpen ? ' sidebar-open' : ''}`}>
        {/* Logo */}
        <div className="sidebar-logo">
          <img
            src="https://upload.wikimedia.org/wikipedia/commons/8/8e/Tata_logo.svg"
            alt="Tata Motors"
            style={{ height: '32px', filter: 'brightness(0) invert(1)' }}
          />
          <div className="sidebar-logo-text" style={{ borderLeft: '1px solid rgba(255,255,255,0.2)', paddingLeft: '12px' }}>
            <span className="brand" style={{ fontSize: '1rem', letterSpacing: '1px' }}>CRM</span>
            <span className="title" style={{ fontSize: '0.65rem', opacity: 0.7 }}>PORTAL</span>
          </div>
          <button
            className="sidebar-close-btn"
            onClick={() => setSidebarOpen(false)}
            aria-label="Close menu"
          >
            <X size={20} />
          </button>
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

      {/* Main Container */}
      <div className="main-layout">
        <header className="main-header">
          <div className="header-left">
            <button
              className="hamburger-btn"
              onClick={() => setSidebarOpen(true)}
              aria-label="Open menu"
            >
              <Menu size={22} />
            </button>
            <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
              <img
                src="https://upload.wikimedia.org/wikipedia/commons/8/8e/Tata_logo.svg"
                alt="Tata"
                className="header-logo"
              />
              <div style={{ width: '1px', height: '20px', background: 'var(--grey-200)' }} />
              <div>
                <div style={{ fontSize: '0.9rem', fontWeight: 700, color: 'var(--grey-900)' }}>CRM Portal</div>
                <div className="header-subtitle">Advertisement Lead Management</div>
              </div>
            </div>
          </div>
          <div className="header-right">
            <div className="user-info">
              <div className="user-avatar">{initials}</div>
              <div className="user-info-text">
                <div className="user-name">{user?.full_name}</div>
                <div className="user-role">{roleLabel[user?.role]}</div>
              </div>
            </div>
          </div>
        </header>

        <main className="page-content">
          <Outlet />
        </main>
      </div>

      {/* DSE-only Install UI */}
      {user?.role === 'dse' && <InstallPWA />}
    </div>
  );
}
