import React, { useState } from 'react';
import { authService } from '../services/api';
import axios from 'axios';

function Login() {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [passwordRequired, setPasswordRequired] = useState(true);
  const [userChecked, setUserChecked] = useState(false);

  const checkUserPasswordRequired = async (usernameValue) => {
    if (!usernameValue) {
      setPasswordRequired(true);
      setUserChecked(false);
      return;
    }

    try {
      const response = await axios.get(`/api/auth/check-user/${usernameValue}`);
      setPasswordRequired(response.data.passwordRequired);
      setUserChecked(response.data.exists);
    } catch (err) {
      console.error('Error checking user:', err);
      setPasswordRequired(true);
      setUserChecked(false);
    }
  };

  const handleUsernameChange = (e) => {
    const value = e.target.value;
    setUsername(value);
    // Vérifier après un court délai pour éviter trop de requêtes
    if (value) {
      const timeoutId = setTimeout(() => checkUserPasswordRequired(value), 500);
      return () => clearTimeout(timeoutId);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      await authService.login(username, passwordRequired ? password : '');
      window.location.href = '/';
    } catch (err) {
      setError(err.response?.data?.error || 'Erreur de connexion');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4">
      <div className="card max-w-md w-full">
        <div className="card-header">
          <h2 className="text-lg">CallFixV2 - Connexion</h2>
        </div>
        
        <div style={{ padding: '20px' }}>
          <form onSubmit={handleSubmit} className="space-y-4">
            {error && (
              <div className="error">
                {error}
              </div>
            )}

            <div>
              <label htmlFor="username" className="block text-sm font-medium mb-2">
                Identifiant
              </label>
              <input
                id="username"
                type="text"
                className="input"
                value={username}
                onChange={handleUsernameChange}
                required
                autoFocus
              />
              {userChecked && !passwordRequired && (
                <p className="success" style={{ marginTop: '8px', padding: '4px' }}>
                  Connexion sans mot de passe activée
                </p>
              )}
            </div>

            {passwordRequired && (
              <div>
                <label htmlFor="password" className="block text-sm font-medium mb-2">
                  Mot de passe
                </label>
                <input
                  id="password"
                  type="password"
                  className="input"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                />
              </div>
            )}

            <div style={{ display: 'flex', justifyContent: 'center', gap: '8px', marginTop: '16px' }}>
              <button
                type="submit"
                className="btn"
                disabled={loading}
              >
                {loading ? 'Connexion...' : 'OK'}
              </button>
              <button
                type="button"
                className="btn"
                disabled={loading}
              >
                Annuler
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}

export default Login;
