import React, { useState } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import { AuthProvider, useAuth } from './context/AuthContext';
import Layout from './components/Layout';
import LoginPage from './pages/LoginPage';
import AdminDashboard from './pages/AdminDashboard';
import DealerDashboard from './pages/DealerDashboard';
import MasterLeads from './pages/MasterLeads';
import DealerLeads from './pages/DealerLeads';
import UploadLeads from './pages/UploadLeads';
import Dealers from './pages/Dealers';
import Reports from './pages/Reports';
import CampaignMetrics from './pages/CampaignMetrics';
import DealerDetails from './pages/DealerDetails';

function ProtectedRoute({ children, allowedRoles }) {
  const { user, loading } = useAuth();
  if (loading) return <div className="loading-overlay"><div className="spinner" /><span className="loading-text">Loading...</span></div>;
  if (!user) return <Navigate to="/login" replace />;
  if (allowedRoles && !allowedRoles.includes(user.role)) return <Navigate to="/" replace />;
  return children;
}

function AppRoutes() {
  const { user, loading } = useAuth();

  if (loading) return <div className="loading-overlay"><div className="spinner" /><span className="loading-text">Initializing Tata Motors CRM...</span></div>;

  if (!user) {
    return (
      <Routes>
        <Route path="/login" element={<LoginPage />} />
        <Route path="*" element={<Navigate to="/login" replace />} />
      </Routes>
    );
  }

  // Redirect root based on role
  const defaultRoute = user.role === 'dealer' ? '/dealer-dashboard' : '/dashboard';

  return (
    <Routes>
      <Route path="/login" element={<Navigate to={defaultRoute} replace />} />
      <Route path="/" element={<Navigate to={defaultRoute} replace />} />

      <Route element={<Layout />}>
        {/* Admin & Campaign Routes */}
        <Route path="/dashboard" element={
          <ProtectedRoute allowedRoles={['admin', 'campaign_team']}>
            <AdminDashboard />
          </ProtectedRoute>
        } />
        <Route path="/upload" element={
          <ProtectedRoute allowedRoles={['campaign_team']}>
            <UploadLeads />
          </ProtectedRoute>
        } />
        <Route path="/master-leads" element={
          <ProtectedRoute allowedRoles={['admin', 'campaign_team']}>
            <MasterLeads />
          </ProtectedRoute>
        } />
        <Route path="/dealers" element={
          <ProtectedRoute allowedRoles={['admin', 'campaign_team']}>
            <Dealers />
          </ProtectedRoute>
        } />
        <Route path="/dealers/:id" element={
          <ProtectedRoute allowedRoles={['admin', 'campaign_team']}>
            <DealerDetails />
          </ProtectedRoute>
        } />
        <Route path="/reports" element={
          <ProtectedRoute allowedRoles={['admin', 'campaign_team']}>
            <Reports />
          </ProtectedRoute>
        } />
        <Route path="/campaign" element={
          <ProtectedRoute allowedRoles={['admin', 'campaign_team']}>
            <CampaignMetrics />
          </ProtectedRoute>
        } />


        {/* Dealer Routes */}
        <Route path="/dealer-dashboard" element={
          <ProtectedRoute allowedRoles={['dealer']}>
            <DealerDashboard />
          </ProtectedRoute>
        } />
        <Route path="/my-leads" element={
          <ProtectedRoute allowedRoles={['dealer']}>
            <DealerLeads />
          </ProtectedRoute>
        } />
      </Route>

      <Route path="*" element={<Navigate to={defaultRoute} replace />} />
    </Routes>
  );
}

export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <Toaster
          position="top-right"
          toastOptions={{
            duration: 4000,
            style: {
              background: '#1D2939',
              color: '#fff',
              borderRadius: '10px',
              padding: '12px 16px',
              fontSize: '0.875rem',
              boxShadow: '0 8px 24px rgba(0,0,0,0.15)',
            },
            success: { iconTheme: { primary: '#12B76A', secondary: '#fff' } },
            error: { iconTheme: { primary: '#F04438', secondary: '#fff' } },
          }}
        />
        <AppRoutes />
      </AuthProvider>
    </BrowserRouter>
  );
}
