// src/components/auth/SocialAuthCallback.jsx
import { useEffect, useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth';
import api from '../../services/api';

export default function SocialAuthCallback() {
  const [status, setStatus] = useState('Processing authentication...');
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
          setStatus('Authentication failed');
          setTimeout(() => navigate('/login', { state: { error: 'Authentication failed' } }), 2000);
          return;
        }
        
        if (!token) {
          setStatus('Invalid token');
          setTimeout(() => navigate('/login'), 2000);
          return;
        }
        
        // Save token
        localStorage.setItem('token', token);
        localStorage.setItem('authType', 'persistent');
        
        // Get user information
        const response = await api.get('/auth/me');
        setUser(response.data.user);

        console.log("Token received:", token ? "Yes (Length: " + token.length + ")" : "No");
        
        setStatus('Authentication successful! Redirecting...');
        setTimeout(() => navigate('/'), 1500);
      } catch (error) {
        console.error('Error processing callback:', error);
        setStatus('An error occurred. Redirecting...');
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