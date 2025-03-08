// src/components/auth/SocialAuthCallback.jsx
import { useEffect, useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import api from '../../services/api';

export default function SocialAuthCallback() {
  const [status, setStatus] = useState('Procesare autentificare...');
  const navigate = useNavigate();
  const location = useLocation();
  const { setUser } = useAuth();
  
  useEffect(() => {
    const handleCallback = async () => {
      try {
        const params = new URLSearchParams(location.search);
        const token = params.get('token');
        const error = params.get('error');
        
        if (error) {
          setStatus('Autentificare eșuată');
          setTimeout(() => navigate('/login', { state: { error: 'Autentificare eșuată' } }), 2000);
          return;
        }
        
        if (!token) {
          setStatus('Token invalid');
          setTimeout(() => navigate('/login'), 2000);
          return;
        }
        
        // Salvăm token-ul
        localStorage.setItem('token', token);
        
        // Obținem informațiile utilizatorului
        const response = await api.get('/auth/me');
        setUser(response.data.user);
        
        setStatus('Autentificare reușită! Redirecționare...');
        setTimeout(() => navigate('/'), 1500);
      } catch (error) {
        console.error('Eroare la procesarea callback-ului:', error);
        setStatus('A apărut o eroare. Redirecționare...');
        setTimeout(() => navigate('/login'), 2000);
      }
    };
    
    handleCallback();
  }, [location, navigate, setUser]);
  
  return (
    <div className="flex items-center justify-center min-h-screen bg-gray-100">
      <div className="bg-white p-8 rounded-lg shadow-md max-w-md w-full text-center">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-purple-500 mx-auto mb-4"></div>
        <h2 className="text-xl font-semibold text-gray-800 mb-2">{status}</h2>
      </div>
    </div>
  );
}