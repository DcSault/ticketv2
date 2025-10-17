import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { authService } from './services/api';

// Pages
import Login from './pages/Login';
import Home from './pages/Home';
import App from './pages/App';
import Statistics from './pages/Statistics';
import Admin from './pages/Admin';
import AdminTenant from './pages/AdminTenant';
import Archives from './pages/Archives';
import DataManagement from './pages/DataManagement';

// Protected Route Component
function ProtectedRoute({ children }) {
  if (!authService.isAuthenticated()) {
    return <Navigate to="/login" replace />;
  }
  return children;
}

// Admin Route Component
function AdminRoute({ children }) {
  const user = authService.getCurrentUser();
  
  if (!authService.isAuthenticated()) {
    return <Navigate to="/login" replace />;
  }
  
  if (user?.role !== 'global_admin') {
    return <Navigate to="/" replace />;
  }
  
  return children;
}

// Tenant Admin Route Component
function TenantAdminRoute({ children }) {
  const user = authService.getCurrentUser();
  
  if (!authService.isAuthenticated()) {
    return <Navigate to="/login" replace />;
  }
  
  if (user?.role !== 'tenant_admin' && user?.role !== 'global_admin') {
    return <Navigate to="/" replace />;
  }
  
  return children;
}

function AppRouter() {
  return (
    <Routes>
      <Route 
        path="/login" 
        element={
          authService.isAuthenticated() ? <Navigate to="/" replace /> : <Login />
        } 
      />
      
      <Route
        path="/"
        element={
          <ProtectedRoute>
            <Home />
          </ProtectedRoute>
        }
      />
      
      <Route
        path="/app"
        element={
          <ProtectedRoute>
            <App />
          </ProtectedRoute>
        }
      />
      
      <Route
        path="/statistics"
        element={
          <ProtectedRoute>
            <Statistics />
          </ProtectedRoute>
        }
      />
      
      <Route
        path="/archives"
        element={
          <ProtectedRoute>
            <Archives />
          </ProtectedRoute>
        }
      />
      
      <Route
        path="/admin"
        element={
          <AdminRoute>
            <Admin />
          </AdminRoute>
        }
      />
      
      <Route
        path="/admin-tenant"
        element={
          <TenantAdminRoute>
            <AdminTenant />
          </TenantAdminRoute>
        }
      />
      
      <Route
        path="/data-management"
        element={
          <TenantAdminRoute>
            <DataManagement />
          </TenantAdminRoute>
        }
      />
      
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}

export default AppRouter;
