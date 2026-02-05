import React from 'react';
import { useNavigate } from 'react-router-dom';

function Navbar({ user, authService, tenants, selectedTenant, handleTenantChange }) {
    const navigate = useNavigate();
    const canSelectTenant = user?.role === 'global_admin' || user?.role === 'viewer';

    return (
        <nav className="bg-white shadow-sm">
            <div className="max-w-7xl mx-auto px-4 py-4 flex justify-between items-center">
                <div className="flex items-center gap-4">
                    <button
                        onClick={() => navigate('/')}
                        className="text-2xl font-bold text-gray-800 hover:text-blue-600"
                    >
                        ← CallFixV2
                    </button>
                    <span className="text-gray-300">|</span>
                    <span className="text-gray-600">Application</span>
                </div>
                <div className="flex items-center gap-4">
                    <button
                        onClick={() => navigate('/statistics')}
                        className="text-sm text-gray-600 hover:text-blue-600 font-medium"
                    >
                        Statistiques
                    </button>
                    <button
                        onClick={() => navigate('/archives')}
                        className="text-sm text-gray-600 hover:text-blue-600 font-medium"
                    >
                        Archives
                    </button>
                    {canSelectTenant && tenants.length > 0 && (
                        <select
                            value={selectedTenant || 'all'}
                            onChange={(e) => handleTenantChange(e.target.value)}
                            className="text-sm border border-gray-300 rounded-lg px-3 py-1.5 focus:ring-2 focus:ring-blue-500"
                        >
                            <option value="all">Tous les tenants</option>
                            {tenants.map(tenant => (
                                <option key={tenant.id} value={tenant.id}>
                                    {tenant.display_name}
                                </option>
                            ))}
                        </select>
                    )}
                    {user?.role === 'global_admin' && (
                        <button
                            onClick={() => navigate('/admin')}
                            className="text-sm text-gray-600 hover:text-blue-600 font-medium transition-colors"
                        >
                            Admin
                        </button>
                    )}
                    {user?.role === 'tenant_admin' && (
                        <button
                            onClick={() => navigate('/admin-tenant')}
                            className="text-sm text-gray-600 hover:text-blue-600 font-medium"
                        >
                            👥 Admin Tenant
                        </button>
                    )}
                    <span className="text-gray-300">|</span>
                    <span className="text-sm text-gray-600">
                        {user?.fullName || user?.username}
                    </span>
                    <button
                        onClick={() => authService.logout()}
                        className="btn btn-secondary text-sm"
                    >
                        Déconnexion
                    </button>
                </div>
            </div>
        </nav>
    );
}

export default Navbar;
