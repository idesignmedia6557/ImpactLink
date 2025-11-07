// auth.js - Authentication utility service for ImpactLink

const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000/api';

/**
 * Login user with email and password
 * @param {string} email 
 * @param {string} password 
 * @returns {Promise<Object>} User data and token
 */
export const login = async (email, password) => {
  try {
    const response = await fetch(`${API_BASE_URL}/auth/login`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ email, password }),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || 'Login failed');
    }

    const data = await response.json();
    
    // Store token and user data
    localStorage.setItem('token', data.token);
    localStorage.setItem('user', JSON.stringify(data.user));
    
    return data;
  } catch (error) {
    console.error('Login error:', error);
    throw error;
  }
};

/**
 * Register a new user
 * @param {Object} userData - User registration data
 * @returns {Promise<Object>} User data and token
 */
export const register = async (userData) => {
  try {
    const response = await fetch(`${API_BASE_URL}/auth/register`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(userData),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || 'Registration failed');
    }

    const data = await response.json();
    
    // Store token and user data
    localStorage.setItem('token', data.token);
    localStorage.setItem('user', JSON.stringify(data.user));
    
    return data;
  } catch (error) {
    console.error('Registration error:', error);
    throw error;
  }
};

/**
 * Logout current user
 */
export const logout = () => {
  localStorage.removeItem('token');
  localStorage.removeItem('user');
};

/**
 * Get current user from localStorage
 * @returns {Object|null} User object or null
 */
export const getCurrentUser = () => {
  try {
    const user = localStorage.getItem('user');
    return user ? JSON.parse(user) : null;
  } catch (error) {
    console.error('Error getting current user:', error);
    return null;
  }
};

/**
 * Get authentication token
 * @returns {string|null} Token or null
 */
export const getToken = () => {
  return localStorage.getItem('token');
};

/**
 * Check if user is authenticated
 * @returns {boolean} True if user is logged in
 */
export const isAuthenticated = () => {
  return !!getToken();
};

/**
 * Check if user has specific role
 * @param {string} role - Role to check (DONOR, CHARITY, CORPORATE, ADMIN)
 * @returns {boolean} True if user has the role
 */
export const hasRole = (role) => {
  const user = getCurrentUser();
  return user && user.userType === role;
};

/**
 * Verify email with token
 * @param {string} token - Email verification token
 * @returns {Promise<Object>} Verification response
 */
export const verifyEmail = async (token) => {
  try {
    const response = await fetch(`${API_BASE_URL}/auth/verify-email`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ token }),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || 'Email verification failed');
    }

    return await response.json();
  } catch (error) {
    console.error('Email verification error:', error);
    throw error;
  }
};

/**
 * Request password reset
 * @param {string} email - User email
 * @returns {Promise<Object>} Reset request response
 */
export const requestPasswordReset = async (email) => {
  try {
    const response = await fetch(`${API_BASE_URL}/auth/forgot-password`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ email }),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || 'Password reset request failed');
    }

    return await response.json();
  } catch (error) {
    console.error('Password reset request error:', error);
    throw error;
  }
};

/**
 * Reset password with token
 * @param {string} token - Password reset token
 * @param {string} newPassword - New password
 * @returns {Promise<Object>} Reset response
 */
export const resetPassword = async (token, newPassword) => {
  try {
    const response = await fetch(`${API_BASE_URL}/auth/reset-password`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ token, newPassword }),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || 'Password reset failed');
    }

    return await response.json();
  } catch (error) {
    console.error('Password reset error:', error);
    throw error;
  }
};

/**
 * Update user profile
 * @param {Object} updates - Profile updates
 * @returns {Promise<Object>} Updated user data
 */
export const updateProfile = async (updates) => {
  try {
    const token = getToken();
    if (!token) {
      throw new Error('No authentication token');
    }

    const response = await fetch(`${API_BASE_URL}/auth/profile`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`,
      },
      body: JSON.stringify(updates),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || 'Profile update failed');
    }

    const data = await response.json();
    
    // Update stored user data
    localStorage.setItem('user', JSON.stringify(data.user));
    
    return data;
  } catch (error) {
    console.error('Profile update error:', error);
    throw error;
  }
};

export default {
  login,
  register,
  logout,
  getCurrentUser,
  getToken,
  isAuthenticated,
  hasRole,
  verifyEmail,
  requestPasswordReset,
  resetPassword,
  updateProfile,
};
