'use client';

import React, { createContext, useContext, useState } from 'react';

interface AdminAuthContextType {
  isAdmin: boolean;
  adminUsername: string | null;
  login: (username: string, password: string) => Promise<boolean>;
  logout: () => void;
  verifyPassword: (password: string) => Promise<boolean>;
}

const AdminAuthContext = createContext<AdminAuthContextType | undefined>(undefined);

// Valid admin credentials
const VALID_ADMINS = ['Askar0171', 'Nithi0196', 'Navin0193'];
const ADMIN_PASSWORD = 'Solution_Seekers136';

export function AdminAuthProvider({ children }: { children: React.ReactNode }) {
  const [isAdmin, setIsAdmin] = useState(false);
  const [adminUsername, setAdminUsername] = useState<string | null>(null);

  const login = async (username: string, password: string) => {
    // Simple authentication check
    const isValidLogin = VALID_ADMINS.includes(username) && password === ADMIN_PASSWORD;
    
    if (isValidLogin) {
      setIsAdmin(true);
      setAdminUsername(username);
    }

    return isValidLogin;
  };

  const logout = () => {
    setIsAdmin(false);
    setAdminUsername(null);
  };

  const verifyPassword = async (password: string) => {
    return password === ADMIN_PASSWORD;
  };

  return (
    <AdminAuthContext.Provider value={{ isAdmin, adminUsername, login, logout, verifyPassword }}>
      {children}
    </AdminAuthContext.Provider>
  );
}

export function useAdminAuth() {
  const context = useContext(AdminAuthContext);
  if (context === undefined) {
    throw new Error('useAdminAuth must be used within an AdminAuthProvider');
  }
  return context;
}
