// src/pages/ResetPassword.jsx
import { useState, useEffect } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { FaLock, FaCheckCircle, FaTimesCircle } from 'react-icons/fa';
import api from '../services/api';

export default function ResetPassword() {
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [successMessage, setSuccessMessage] = useState('');
  const [tokenValid, setTokenValid] = useState(true);
  const [passwordValid, setPasswordValid] = useState(false);
  const [passwordsMatch, setPasswordsMatch] = useState(false);

  const { token } = useParams();
  const navigate = useNavigate();

  useEffect(() => {
    const verifyToken = async () => {
      try {
        await api.get(`/auth/reset-password/${token}`);
      } catch (err) {
        setTokenValid(false);
        setError(err.response?.data?.error || 'The reset link is invalid or has expired.');
      }
    };

    if (token) {
      verifyToken();
    }
  }, [token]);

  useEffect(() => {
    // Validate password
    setPasswordValid(password.length >= 6);
    
    // Check if passwords match
    setPasswordsMatch(password === confirmPassword && password !== '');
  }, [password, confirmPassword]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!passwordValid) {
      setError('Password must be at least 6 characters long.');
      return;
    }
    
    if (!passwordsMatch) {
      setError('Passwords do not match.');
      return;
    }
    
    setError('');
    setLoading(true);

    try {
      await api.post(`/auth/reset-password/${token}`, { password });
      setSuccessMessage('Password has been reset successfully!');
      
      // Redirect to login after 3 seconds
      setTimeout(() => {
        navigate('/login', { 
          state: { 
            successMessage: 'Password has been reset successfully! You can now log in.' 
          } 
        });
      }, 3000);
    } catch (err) {
      setError(err.response?.data?.error || 'An error occurred. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  if (!tokenValid) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-md w-full space-y-8 bg-white p-10 rounded-xl shadow-md text-center">
          <FaTimesCircle className="mx-auto h-12 w-12 text-red-500" />
          <h2 className="mt-6 text-3xl font-extrabold text-gray-900">Invalid Link</h2>
          <p className="mt-2 text-gray-600">The reset link is invalid or has expired.</p>
          <div className="mt-6">
            <Link 
              to="/forgot-password" 
              className="w-full inline-flex justify-center py-3 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-purple-600 hover:bg-purple-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-purple-500"
            >
              Request a new link
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8 bg-white p-10 rounded-xl shadow-md">
        <div className="text-center">
          <h2 className="mt-6 text-3xl font-extrabold text-gray-900">
            Reset Password
          </h2>
          <p className="mt-2 text-sm text-gray-600">
            Create a new password for your account.
          </p>
        </div>

        {error && (
          <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded relative" role="alert">
            <span className="block sm:inline">{error}</span>
          </div>
        )}

        {successMessage && (
          <div className="bg-green-100 border border-green-400 text-green-700 px-4 py-3 rounded relative" role="alert">
            <FaCheckCircle className="inline-block mr-2" />
            <span className="block sm:inline">{successMessage}</span>
          </div>
        )}

        <form className="mt-8 space-y-6" onSubmit={handleSubmit}>
          <div className="space-y-4">
            <div>
              <label htmlFor="password" className="sr-only">New password</label>
              <div className="flex items-center relative">
                <div className="absolute left-3 text-gray-400">
                  <FaLock />
                </div>
                <input
                  id="password"
                  name="password"
                  type="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className={`appearance-none relative block w-full px-10 py-3 border ${
                    password && !passwordValid 
                      ? 'border-red-300 focus:ring-red-500 focus:border-red-500' 
                      : 'border-gray-300 focus:ring-purple-500 focus:border-purple-500'
                  } rounded-md placeholder-gray-500 text-gray-900 focus:outline-none focus:z-10 sm:text-sm`}
                  placeholder="New password"
                />
                {password && (
                  passwordValid ? 
                    <FaCheckCircle className="absolute right-3 text-green-500" /> : 
                    <FaTimesCircle className="absolute right-3 text-red-500" />
                )}
              </div>
              {password && !passwordValid && (
                <p className="text-xs text-red-500 mt-1">Password must be at least 6 characters long</p>
              )}
              </div>
              
              <div>
                <label htmlFor="confirmPassword" className="sr-only">Confirm password</label>
                <div className="flex items-center relative">
                  <div className="absolute left-3 text-gray-400">
                    <FaLock />
                  </div>
                  <input
                    id="confirmPassword"
                    name="confirmPassword"
                    type="password"
                    required
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    className={`appearance-none relative block w-full px-10 py-3 border ${
                      confirmPassword && !passwordsMatch 
                        ? 'border-red-300 focus:ring-red-500 focus:border-red-500' 
                        : 'border-gray-300 focus:ring-purple-500 focus:border-purple-500'
                    } rounded-md placeholder-gray-500 text-gray-900 focus:outline-none focus:z-10 sm:text-sm`}
                    placeholder="Confirm password"
                  />
                  {confirmPassword && (
                    passwordsMatch ? 
                      <FaCheckCircle className="absolute right-3 text-green-500" /> : 
                      <FaTimesCircle className="absolute right-3 text-red-500" />
                  )}
                </div>
                {confirmPassword && !passwordsMatch && (
                  <p className="text-xs text-red-500 mt-1">Passwords do not match</p>
                )}
              </div>
            </div>
  
            <div>
              <button
                type="submit"
                disabled={loading || !passwordValid || !passwordsMatch}
                className={`group relative w-full flex justify-center py-3 px-4 border border-transparent text-sm font-medium rounded-md text-white ${
                  passwordValid && passwordsMatch ? 'bg-purple-600 hover:bg-purple-700' : 'bg-purple-400 cursor-not-allowed'
                } focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-purple-500`}
              >
                {loading ? 'Processing...' : 'Reset Password'}
              </button>
            </div>
          </form>
        </div>
      </div>
    );
  }