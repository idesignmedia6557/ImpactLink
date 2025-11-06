import React, { createContext, useState, useContext, useEffect } from 'react';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Check if user is logged in (from localStorage or session)
    const storedUser = localStorage.getItem('impactlink_user');
    if (storedUser) {
      try {
        setUser(JSON.parse(storedUser));
      } catch (error) {
        console.error('Failed to parse stored user:', error);
        localStorage.removeItem('impactlink_user');
      }
    }
    setLoading(false);
  }, []);

  const login = (email, name) => {
    const userData = { email, name, loginTime: new Date().toISOString() };
    setUser(userData);
    localStorage.setItem('impactlink_user', JSON.stringify(userData));
  };

  const logout = () => {
    setUser(null);
    localStorage.removeItem('impactlink_user');
  };

  const value = {
    user,
    loading,
    isAuthenticated: !!user,
    userEmail: user?.email,
    userName: user?.name,
    login,
    logout,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export default AuthContext;
