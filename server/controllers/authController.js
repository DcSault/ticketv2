const pool = require('../config/database');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const logger = require('../utils/logger');

// Login
exports.login = async (req, res) => {
  const { username, password } = req.body;

  try {
    // Trouver l'utilisateur
    const result = await pool.query(
      'SELECT u.*, t.name as tenant_name FROM users u LEFT JOIN tenants t ON u.tenant_id = t.id WHERE u.username = $1',
      [username]
    );

    if (result.rows.length === 0) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    const user = result.rows[0];

    // Si l'utilisateur a le flag no_password_login, ne pas vÃ©rifier le mot de passe
    if (!user.no_password_login) {
      // VÃ©rifier le mot de passe uniquement si no_password_login est false
      if (!password) {
        return res.status(401).json({ error: 'Password required' });
      }
      const validPassword = await bcrypt.compare(password, user.password);
      if (!validPassword) {
        return res.status(401).json({ error: 'Invalid credentials' });
      }
    }

    // CrÃ©er le token JWT
    const token = jwt.sign(
      {
        id: user.id,
        username: user.username,
        role: user.role,
        tenantId: user.tenant_id,
        tenantName: user.tenant_name
      },
      process.env.JWT_SECRET,
      { expiresIn: process.env.JWT_EXPIRES_IN || '7d' }
    );

    res.json({
      token,
      user: {
        id: user.id,
        username: user.username,
        fullName: user.full_name,
        role: user.role,
        tenantId: user.tenant_id,
        tenantName: user.tenant_name
      }
    });
  } catch (error) {
    logger.error('Login error:', error);
    res.status(500).json({ error: 'Server error' });
  }
};

// Get current user
exports.getCurrentUser = async (req, res) => {
  try {
    const result = await pool.query(
      'SELECT u.id, u.username, u.full_name, u.role, u.tenant_id, t.name as tenant_name FROM users u LEFT JOIN tenants t ON u.tenant_id = t.id WHERE u.id = $1',
      [req.user.id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'User not found' });
    }

    const user = result.rows[0];
    res.json({
      id: user.id,
      username: user.username,
      fullName: user.full_name,
      role: user.role,
      tenantId: user.tenant_id,
      tenantName: user.tenant_name
    });
  } catch (error) {
    logger.error('Get user error:', error);
    res.status(500).json({ error: 'Server error' });
  }
};

// Logout (cÃ´tÃ© client principalement)
exports.logout = (req, res) => {
  res.json({ message: 'Logged out successfully' });
};

// VÃ©rifier si un utilisateur nÃ©cessite un mot de passe
exports.checkUserPasswordRequired = async (req, res) => {
  const { username } = req.params;

  try {
    const result = await pool.query(
      'SELECT no_password_login FROM users WHERE username = $1',
      [username]
    );

    if (result.rows.length === 0) {
      return res.json({ exists: false, passwordRequired: true });
    }

    const user = result.rows[0];
    res.json({ 
      exists: true, 
      passwordRequired: !user.no_password_login 
    });
  } catch (error) {
    logger.error('Check user error:', error);
    res.status(500).json({ error: 'Server error' });
  }
};
