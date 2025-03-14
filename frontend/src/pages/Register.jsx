// src/pages/Register.jsx
import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { FaFacebook, FaGoogle, FaUser, FaEnvelope, FaLock, FaCheckCircle, FaTimesCircle } from 'react-icons/fa';
import { useAuth } from '../hooks/useAuth';

export default function Register() {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    confirmPassword: ''
  });
  
  const [validation, setValidation] = useState({
    name: { valid: false, message: '' },
    email: { valid: false, message: '' },
    password: { valid: false, message: '' },
    confirmPassword: { valid: false, message: '' },
  });
  
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  
  const { register, socialLogin } = useAuth();
  const navigate = useNavigate();
  
  // Validare în timp real
  useEffect(() => {
    // Validare nume
    if (formData.name.trim().length > 0) {
      if (formData.name.trim().length < 3) {
        setValidation(prev => ({
          ...prev, 
          name: { valid: false, message: 'Numele trebuie să aibă cel puțin 3 caractere' }
        }));
      } else {
        setValidation(prev => ({
          ...prev, 
          name: { valid: true, message: '' }
        }));
      }
    }
    
    // Validare email
    if (formData.email.trim().length > 0) {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(formData.email)) {
        setValidation(prev => ({
          ...prev, 
          email: { valid: false, message: 'Adresa de email nu este validă' }
        }));
      } else {
        setValidation(prev => ({
          ...prev, 
          email: { valid: true, message: '' }
        }));
      }
    }
    
    // Validare parolă
    if (formData.password.length > 0) {
      if (formData.password.length < 6) {
        setValidation(prev => ({
          ...prev, 
          password: { valid: false, message: 'Parola trebuie să aibă cel puțin 6 caractere' }
        }));
      } else {
        setValidation(prev => ({
          ...prev, 
          password: { valid: true, message: '' }
        }));
      }
    }
    
    // Validare confirmare parolă
    if (formData.confirmPassword.length > 0) {
      if (formData.confirmPassword !== formData.password) {
        setValidation(prev => ({
          ...prev, 
          confirmPassword: { valid: false, message: 'Parolele nu coincid' }
        }));
      } else {
        setValidation(prev => ({
          ...prev, 
          confirmPassword: { valid: true, message: '' }
        }));
      }
    }
  }, [formData]);
  
  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };
  
  const isFormValid = () => {
    return (
      validation.name.valid && 
      validation.email.valid && 
      validation.password.valid && 
      validation.confirmPassword.valid
    );
  };
  
  const handleRegister = async (e) => {
    e.preventDefault();
    setError('');
    
    if (!isFormValid()) {
      setError('Te rugăm să corectezi erorile din formular');
      return;
    }
    
    setLoading(true);
    
    try {
      await register({
        name: formData.name,
        email: formData.email,
        password: formData.password
      });
      
      // Redirecționare către login cu mesaj de succes
      navigate('/login', { 
        state: { 
          successMessage: 'Cont creat cu succes! Te poți autentifica acum.' 
        } 
      });
    } catch (err) {
      setError(err.response?.data?.error || 'A apărut o eroare la înregistrare');
    } finally {
      setLoading(false);
    }
  };
  
  const handleSocialLogin = (provider) => {
    socialLogin(provider);
  };
  
  const renderValidationIcon = (field) => {
    if (formData[field] && formData[field].length > 0) {
      return validation[field].valid ? 
        <FaCheckCircle className="absolute right-3 text-green-500" /> : 
        <FaTimesCircle className="absolute right-3 text-red-500" />;
    }
    return null;
  };
  
  const renderValidationMessage = (field) => {
    if (formData[field] && formData[field].length > 0 && !validation[field].valid) {
      return (
        <p className="text-xs text-red-500 mt-1">{validation[field].message}</p>
      );
    }
    return null;
  };
  
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8 bg-white p-10 rounded-xl shadow-md">
        <div className="text-center">
          <h2 className="mt-6 text-3xl font-extrabold text-gray-900">
            Înregistrare
          </h2>
          <p className="mt-2 text-sm text-gray-600">
            Sau{' '}
            <Link to="/login" className="font-medium text-purple-600 hover:text-purple-500">
              autentifică-te în contul tău
            </Link>
          </p>
        </div>
        
        {error && (
          <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded relative" role="alert">
            <span className="block sm:inline">{error}</span>
          </div>
        )}
        
        <form className="mt-8 space-y-6" onSubmit={handleRegister}>
          <div className="space-y-4">
            <div>
              <label htmlFor="name" className="sr-only">Nume</label>
              <div className="flex items-center relative">
                <div className="absolute left-3 text-gray-400">
                  <FaUser />
                </div>
                <input
                  id="name"
                  name="name"
                  type="text"
                  required
                  value={formData.name}
                  onChange={handleChange}
                  className={`appearance-none relative block w-full px-10 py-3 border ${
                    formData.name && !validation.name.valid 
                      ? 'border-red-300 focus:ring-red-500 focus:border-red-500' 
                      : 'border-gray-300 focus:ring-purple-500 focus:border-purple-500'
                  } rounded-md placeholder-gray-500 text-gray-900 focus:outline-none focus:z-10 sm:text-sm`}
                  placeholder="Nume complet"
                />
                {renderValidationIcon('name')}
              </div>
              {renderValidationMessage('name')}
            </div>
            
            <div>
              <label htmlFor="email-address" className="sr-only">Adresa de email</label>
              <div className="flex items-center relative">
                <div className="absolute left-3 text-gray-400">
                  <FaEnvelope />
                </div>
                <input
                  id="email-address"
                  name="email"
                  type="email"
                  autoComplete="email"
                  required
                  value={formData.email}
                  onChange={handleChange}
                  className={`appearance-none relative block w-full px-10 py-3 border ${
                    formData.email && !validation.email.valid 
                      ? 'border-red-300 focus:ring-red-500 focus:border-red-500' 
                      : 'border-gray-300 focus:ring-purple-500 focus:border-purple-500'
                  } rounded-md placeholder-gray-500 text-gray-900 focus:outline-none focus:z-10 sm:text-sm`}
                  placeholder="Adresa de email"
                />
                {renderValidationIcon('email')}
              </div>
              {renderValidationMessage('email')}
            </div>
            
            <div>
              <label htmlFor="password" className="sr-only">Parola</label>
              <div className="flex items-center relative">
                <div className="absolute left-3 text-gray-400">
                  <FaLock />
                </div>
                <input
                  id="password"
                  name="password"
                  type="password"
                  autoComplete="new-password"
                  required
                  value={formData.password}
                  onChange={handleChange}
                  className={`appearance-none relative block w-full px-10 py-3 border ${
                    formData.password && !validation.password.valid 
                      ? 'border-red-300 focus:ring-red-500 focus:border-red-500' 
                      : 'border-gray-300 focus:ring-purple-500 focus:border-purple-500'
                  } rounded-md placeholder-gray-500 text-gray-900 focus:outline-none focus:z-10 sm:text-sm`}
                  placeholder="Parola"
                />
                {renderValidationIcon('password')}
              </div>
              {renderValidationMessage('password')}
            </div>
            
            <div>
              <label htmlFor="confirmPassword" className="sr-only">Confirmă parola</label>
              <div className="flex items-center relative">
                <div className="absolute left-3 text-gray-400">
                  <FaLock />
                </div>
                <input
                  id="confirmPassword"
                  name="confirmPassword"
                  type="password"
                  autoComplete="new-password"
                  required
                  value={formData.confirmPassword}
                  onChange={handleChange}
                  className={`appearance-none relative block w-full px-10 py-3 border ${
                    formData.confirmPassword && !validation.confirmPassword.valid 
                      ? 'border-red-300 focus:ring-red-500 focus:border-red-500' 
                      : 'border-gray-300 focus:ring-purple-500 focus:border-purple-500'
                  } rounded-md placeholder-gray-500 text-gray-900 focus:outline-none focus:z-10 sm:text-sm`}
                  placeholder="Confirmă parola"
                />
                {renderValidationIcon('confirmPassword')}
              </div>
              {renderValidationMessage('confirmPassword')}
            </div>
          </div>

          <div>
            <button
              type="submit"
              disabled={loading || !isFormValid()}
              className={`group relative w-full flex justify-center py-3 px-4 border border-transparent text-sm font-medium rounded-md text-white ${
                isFormValid() ? 'bg-purple-600 hover:bg-purple-700' : 'bg-purple-400 cursor-not-allowed'
              } focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-purple-500 transition-colors`}
            >
              {loading ? 'Se procesează...' : 'Înregistrare'}
            </button>
          </div>
        </form>
        
        <div className="mt-6">
          <div className="relative">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-gray-300"></div>
            </div>
            <div className="relative flex justify-center text-sm">
              <span className="px-2 bg-white text-gray-500">Sau continuă cu</span>
            </div>
          </div>

          <div className="mt-6 grid grid-cols-2 gap-3">
            <button
              onClick={() => handleSocialLogin('facebook')}
              className="w-full inline-flex justify-center py-3 px-4 border border-gray-300 rounded-md shadow-sm bg-blue-600 text-white text-sm font-medium hover:bg-blue-700"
            >
              <FaFacebook className="h-5 w-5" />
              <span className="ml-2">Facebook</span>
            </button>
            <button
              onClick={() => handleSocialLogin('google')}
              className="w-full inline-flex justify-center py-3 px-4 border border-gray-300 rounded-md shadow-sm bg-red-500 text-white text-sm font-medium hover:bg-red-600"
            >
              <FaGoogle className="h-5 w-5" />
              <span className="ml-2">Google</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}