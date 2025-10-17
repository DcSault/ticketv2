import React from 'react';
import { useNavigate } from 'react-router-dom';
import { authService } from '../services/api';
import ThemeToggle from '../components/ThemeToggle';

function Home() {
  const navigate = useNavigate();
  const user = authService.getCurrentUser();

  return (
    <div className="min-h-screen">
      <nav className="nav">
        <div className="max-w-7xl mx-auto px-4 py-4 flex justify-between items-center">
          <div className="flex items-center gap-3">
            <h1 className="text-2xl font-bold">CallFixV2</h1>
          </div>
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2 px-4 py-2 rounded-lg">
              <div className="text-sm">
                <div className="font-medium">{user?.fullName || user?.username}</div>
                {user?.tenantName && <div className="text-xs">{user.tenantName}</div>}
              </div>
            </div>
            <ThemeToggle />
            <button
              onClick={() => authService.logout()}
              className="btn"
            >
              Déconnexion
            </button>
          </div>
        </div>
      </nav>

      <div className="max-w-4xl mx-auto px-4 py-16">
        <div className="text-center mb-12">
          <h2 className="text-5xl font-bold mb-4">
            Bienvenue {user?.fullName || user?.username}
          </h2>
          <p className="text-lg">
            Que souhaitez-vous faire aujourd'hui ?
          </p>
        </div>

        <div className="grid md:grid-cols-2 gap-6">
          <button
            onClick={() => navigate('/app')}
            className="card text-left"
            style={{ cursor: 'pointer' }}
          >
            <div className="card-header">
              <h3 className="text-lg font-bold">Application</h3>
            </div>
            <div style={{ padding: '16px' }}>
              <p>
                Saisir des appels, consulter l'historique et gérer les tickets
              </p>
            </div>
          </button>

          <button
            onClick={() => navigate('/statistics')}
            className="card text-left"
            style={{ cursor: 'pointer' }}
          >
            <div className="card-header">
              <h3 className="text-lg font-bold">Statistiques</h3>
            </div>
            <div style={{ padding: '16px' }}>
              <p>
                Consulter les statistiques et exporter les données
              </p>
            </div>
          </button>

          {user?.role === 'global_admin' && (
            <button
              onClick={() => navigate('/admin')}
              className="card text-left md:col-span-2"
              style={{ cursor: 'pointer' }}
            >
              <div className="card-header">
                <h3 className="text-lg font-bold">Administration</h3>
              </div>
              <div style={{ padding: '16px' }}>
                <p>
                  Gérer les tenants, utilisateurs et consulter les statistiques globales
                </p>
              </div>
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

export default Home;
