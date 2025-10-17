import React, { useState } from 'react';
import { authService } from '../services/api';
import axios from 'axios';
import { Window, Button, Icon } from '../components/win98';

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
    <div className="win98-body" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '100vh' }}>
      <Window 
        title="Bienvenue sur Windows" 
        icon={<Icon type="windows" size={16} />}
        width="400px"
        height="auto"
      >
        <div style={{ padding: '20px', backgroundColor: '#c0c0c0' }}>
          <div style={{ textAlign: 'center', marginBottom: '20px' }}>
            <Icon type="user" size={64} />
            <h2 style={{ margin: '10px 0', fontSize: '14px', fontWeight: 'bold' }}>CallFixV2</h2>
            <p style={{ fontSize: '11px', color: '#000080' }}>Entrez vos informations d'identification</p>
          </div>

          <form onSubmit={handleSubmit}>
            {error && (
              <div style={{ 
                padding: '8px', 
                marginBottom: '12px', 
                backgroundColor: '#fff', 
                border: '2px solid #ff0000',
                display: 'flex',
                alignItems: 'center',
                gap: '8px'
              }}>
                <Icon type="error" size={16} />
                <span style={{ fontSize: '11px' }}>{error}</span>
              </div>
            )}

            <div className="win98-fieldset" style={{ marginBottom: '12px' }}>
              <legend className="win98-legend">Identifiant</legend>
              <input
                type="text"
                className="win98-input"
                style={{ width: '100%' }}
                value={username}
                onChange={handleUsernameChange}
                required
                autoFocus
              />
              {userChecked && !passwordRequired && (
                <div style={{ marginTop: '4px', fontSize: '10px', color: '#008000', display: 'flex', alignItems: 'center', gap: '4px' }}>
                  <Icon type="success" size={12} />
                  <span>Connexion sans mot de passe</span>
                </div>
              )}
            </div>

            {passwordRequired && (
              <div className="win98-fieldset" style={{ marginBottom: '12px' }}>
                <legend className="win98-legend">Mot de passe</legend>
                <input
                  type="password"
                  className="win98-input"
                  style={{ width: '100%' }}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                />
              </div>
            )}

            <div style={{ display: 'flex', justifyContent: 'center', gap: '8px', marginTop: '20px' }}>
              <Button type="submit" isDefault disabled={loading}>
                {loading ? 'Connexion...' : 'OK'}
              </Button>
              <Button type="button" disabled={loading}>
                Annuler
              </Button>
            </div>
          </form>
        </div>
      </Window>
    </div>
  );
}

export default Login;
