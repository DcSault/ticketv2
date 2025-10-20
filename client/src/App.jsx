import React, { useEffect } from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { authService } from './services/api';
import { registerServiceWorker } from './services/serviceWorkerManager';
import healthCheckService from './services/healthCheckService';
import OfflineBanner from './components/OfflineBanner';

// Pages
import Login from './pages/Login';
import Home from './pages/Home';
import App from './pages/App';
import Statistics from './pages/Statistics';
import Admin from './pages/Admin';
import AdminTenant from './pages/AdminTenant';
import Archives from './pages/Archives';
import DataManagement from './pages/DataManagement';
import Error404 from './pages/Error404';
import Error500 from './pages/Error500';
import ErrorOffline from './pages/ErrorOffline';

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
  useEffect(() => {
    // Enregistrer le Service Worker au montage du composant
    registerServiceWorker();

    // Initialiser le Health Check Worker
    healthCheckService.initialize()
      .then(() => {
        // Démarrer les vérifications de santé toutes les 30 secondes
        healthCheckService.start(30000);

        // Écouter les changements de statut
        healthCheckService.on('healthStatusChanged', (data) => {
          console.log('Server health status:', data.status ? 'Healthy' : 'Unhealthy');
        });

        healthCheckService.on('healthCheckError', (data) => {
          console.warn('Server health check error:', data.error);
        });
      })
      .catch((error) => {
        console.warn('Health Check Service not available:', error.message);
      });

    // Nettoyer le worker lors du démontage
    return () => {
      healthCheckService.terminate();
    };
  }, []);

  return (
    <>
      <OfflineBanner />
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
      
      {/* Routes d'erreur publiques (pas de protection) */}
      <Route path="/offline" element={<ErrorOffline />} />
      <Route path="/error-404" element={<Error404 />} />
      <Route path="/error-500" element={<Error500 />} />
      
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
    </>
  );
}

export default AppRouter;
