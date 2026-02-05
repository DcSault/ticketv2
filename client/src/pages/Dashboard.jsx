import React, { useState, useEffect } from 'react';
import { authService, callService, adminService } from '../services/api';

// Components
import Navbar from '../components/Navbar';
import CallForm from '../components/CallForm';
import CallList from '../components/CallList';
import QuickAddModal from '../components/QuickAddModal';

function Dashboard() {
  const user = authService.getCurrentUser();

  const [calls, setCalls] = useState([]);
  const [loading, setLoading] = useState(true);

  // Tenant selection for global_admin and viewer
  const canSelectTenant = user?.role === 'global_admin' || user?.role === 'viewer';
  const [tenants, setTenants] = useState([]);
  const [selectedTenant, setSelectedTenant] = useState(
    canSelectTenant
      ? localStorage.getItem('selectedTenantId') || 'all'
      : null
  );

  // Suggestions state (managed here to be shared if needed)
  const [suggestions, setSuggestions] = useState({ callers: [], reasons: [], tags: [] });
  const [quickSuggestions, setQuickSuggestions] = useState({ callers: [], reasons: [], tags: [] });

  // Modal state
  const [showQuickForm, setShowQuickForm] = useState(false);

  useEffect(() => {
    if (canSelectTenant) {
      loadTenants();
    }
    loadQuickSuggestions();
  }, []);

  useEffect(() => {
    loadCalls();
    loadSuggestions();
  }, [selectedTenant]);

  const loadTenants = async () => {
    try {
      const response = await adminService.getTenants();
      setTenants(response.data);
    } catch (error) {
      console.error('Error loading tenants:', error);
    }
  };

  const handleTenantChange = (tenantId) => {
    setSelectedTenant(tenantId);
    if (tenantId === 'all') {
      localStorage.removeItem('selectedTenantId');
    } else {
      localStorage.setItem('selectedTenantId', tenantId);
    }
  };

  const loadCalls = async () => {
    try {
      const params = {
        limit: 100,
        archived: 'false' // Active calls only
      };
      if (canSelectTenant && selectedTenant && selectedTenant !== 'all') {
        params.tenantId = selectedTenant;
      }
      const response = await callService.getCalls(params);
      setCalls(response.data);
    } catch (error) {
      console.error('Error loading calls:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadSuggestions = async () => {
    try {
      const [callers, reasons, tags] = await Promise.all([
        callService.getSuggestions('callers'),
        callService.getSuggestions('reasons'),
        callService.getSuggestions('tags')
      ]);
      setSuggestions({
        callers: callers.data,
        reasons: reasons.data,
        tags: tags.data
      });
    } catch (error) {
      console.error('Error loading suggestions:', error);
    }
  };

  const loadQuickSuggestions = async () => {
    try {
      const response = await callService.getQuickSuggestions();
      setQuickSuggestions(response.data);
    } catch (error) {
      console.error('Error loading quick suggestions:', error);
    }
  };

  const handleCreateCall = async (formData, onSuccess) => {
    try {
      const response = await callService.createCall(formData);
      setCalls([response.data, ...calls]);

      if (onSuccess) onSuccess();

      // Reload suggestions to include new data
      await loadSuggestions();
      await loadCalls(); // Ensure sort/order
    } catch (error) {
      console.error('Error creating call:', error);
      alert('Erreur lors de la création de l\'appel');
    }
  };

  const handleQuickSubmit = async (formData) => {
    try {
      await handleCreateCall({
        ...formData,
        isGlpi: false,
        glpiNumber: null
      });
      setShowQuickForm(false);
      // Refresh quick suggestions potentially
      loadQuickSuggestions();
    } catch (error) {
      console.error('Error quick creating call:', error);
    }
  };

  const handleUpdate = async (id, updates) => {
    try {
      const response = await callService.updateCall(id, updates);
      setCalls(calls.map(call => call.id === id ? response.data : call));

      // Reload suggestions
      await loadSuggestions();
    } catch (error) {
      console.error('Error updating call:', error);
      alert('Erreur lors de la modification');
    }
  };

  const handleDelete = async (id) => {
    if (!confirm('Êtes-vous sûr de vouloir supprimer cet appel ?')) return;

    try {
      await callService.deleteCall(id);
      setCalls(calls.filter(call => call.id !== id));
    } catch (error) {
      console.error('Error deleting call:', error);
      alert('Erreur lors de la suppression');
    }
  };

  const handleArchive = async (id) => {
    if (!confirm('Archiver cet appel ? Il sera déplacé dans les archives.')) return;

    try {
      await callService.archiveCall(id);
      setCalls(calls.filter(call => call.id !== id));
      alert('✅ Appel archivé avec succès');
    } catch (error) {
      console.error('Error archiving call:', error);
      alert('Erreur lors de l\'archivage');
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar
        user={user}
        authService={authService}
        tenants={tenants}
        selectedTenant={selectedTenant}
        handleTenantChange={handleTenantChange}
      />

      {/* Quick Add Modal */}
      <QuickAddModal
        isOpen={showQuickForm}
        onClose={() => setShowQuickForm(false)}
        onSubmit={handleQuickSubmit}
        suggestions={quickSuggestions}
      />

      <div className="max-w-7xl mx-auto px-4 py-8">

        {/* Main Form - Hidden for viewers */}
        {user?.role !== 'viewer' && (
          <>
            <div className="flex justify-end mb-4">
              <button
                type="button"
                onClick={() => setShowQuickForm(true)}
                className="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 font-medium flex items-center gap-2 shadow-sm"
              >
                ⚡ Ajout Rapide
              </button>
            </div>
            <CallForm
              onSubmit={handleCreateCall}
              suggestions={suggestions}
              userRole={user?.role}
            />
          </>
        )}

        {/* Call List */}
        <CallList
          calls={calls}
          loading={loading}
          onUpdate={handleUpdate}
          onDelete={handleDelete}
          onArchive={handleArchive}
        />
      </div>
    </div>
  );
}

export default Dashboard;
