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
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center p-4">
      <div className="card max-w-md w-full">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-gray-800">TicketV2</h1>
          <p className="text-gray-600 mt-2">Connexion à votre espace</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          {error && (
            <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded">
              {error}
            </div>
          )}

          <div>
            <label htmlFor="username" className="block text-sm font-medium text-gray-700 mb-2">
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
              <p className="text-xs text-green-600 mt-1">
                🔓 Connexion sans mot de passe activée
              </p>
            )}
          </div>

          {passwordRequired && (
            <div>
              <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-2">
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

          <button
            type="submit"
            className="btn btn-primary w-full"
            disabled={loading}
          >
            {loading ? 'Connexion...' : 'Se connecter'}
          </button>
        </form>
      </div>
    </div>
  );
}

export default Login;
