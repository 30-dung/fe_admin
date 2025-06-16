import React, { createContext, useContext, useState, useEffect } from 'react';

const AuthContext = createContext<any>(null);

export const AuthProvider = ({ children }: { children: React.ReactNode }) => {
  const [user, setUser] = useState<any>(null);

  useEffect(() => {
    // Lấy user từ localStorage hoặc API
    const token = localStorage.getItem('token');
    if (token) {
      // Giả định parse token để lấy user
      const payload = JSON.parse(atob(token.split('.')[1])); // Giả định JWT
      setUser({ id: payload.sub, roles: payload.roles });
    }
  }, []);

  return <AuthContext.Provider value={{ user, setUser }}>{children}</AuthContext.Provider>;
};

export const useAuth = () => useContext(AuthContext);