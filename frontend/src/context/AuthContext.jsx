// src/context/AuthContext.jsx
import { createContext, useState, useEffect } from 'react';
import api from '../services/api';

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const checkAuth = async () => {
      // Verificăm întâi în sessionStorage
      let token = sessionStorage.getItem('token');
      
      // Dacă nu există în sessionStorage, verificăm în localStorage
      if (!token) {
        const authType = localStorage.getItem('authType');
        
        // Folosim token-ul din localStorage doar dacă tipul de autentificare este persistent
        if (authType === 'persistent') {
          token = localStorage.getItem('token');
        }
      }
      
      if (token) {
        try {
          // Configurăm header-ul de autorizare pentru toate cererile viitoare
          api.defaults.headers.common['Authorization'] = `Bearer ${token}`;
          
          const response = await api.get('/auth/me');
          setUser(response.data.user);
        } catch (err) {
          console.error('Error verifying authentication:', err);
          
          // Curățăm datele de autentificare în caz de eroare
          sessionStorage.removeItem('token');
          localStorage.removeItem('token');
          localStorage.removeItem('authType');
          delete api.defaults.headers.common['Authorization'];
        }
      }
      
      setLoading(false);
    };
  
    checkAuth();
  }, []);

  const login = async (email, password, rememberMe = false) => {
    setError(null);
    try {
      const response = await api.post('/auth/login', { email, password });
      
      // Salvăm token-ul în funcție de opțiunea "Ține-mă minte"
      if (rememberMe) {
        localStorage.setItem('token', response.data.token);
        localStorage.setItem('authType', 'persistent');
      } else {
        sessionStorage.setItem('token', response.data.token);
        localStorage.setItem('authType', 'session');
      }
      
      setUser(response.data.user);
      return response.data;
    } catch (err) {
      setError(err.response?.data?.error || 'A apărut o eroare la autentificare');
      throw err;
    }
  };

  const register = async (userData) => {
    setError(null);
    try {
      const response = await api.post('/auth/register', userData);
      return response.data;
    } catch (err) {
      setError(err.response?.data?.error || 'A apărut o eroare la înregistrare');
      throw err;
    }
  };

  const logout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('authType');
    sessionStorage.removeItem('token');
    setUser(null);
  };

  const socialLogin = (provider) => {
    window.location.href = `${api.defaults.baseURL}/auth/${provider}`;
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        loading,
        error,
        login,
        register,
        logout,
        socialLogin,
        setUser
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export default AuthContext;