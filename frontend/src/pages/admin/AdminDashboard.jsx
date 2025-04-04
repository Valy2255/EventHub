// src/pages/admin/AdminDashboard.jsx
import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { 
  FaUser, 
  FaTicketAlt, 
  FaCalendarAlt, 
  FaListAlt, 
  FaMoneyBillWave,
  FaSpinner,
  FaExclamationTriangle 
} from 'react-icons/fa';
import api from '../../services/api';

const AdminDashboard = () => {
  const [stats, setStats] = useState(null);
  const [refundsCount, setRefundsCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        
        // Get main dashboard stats
        const statsResponse = await api.get('/admin/dashboard/stats');
        setStats(statsResponse.data.stats);
        
        // Get refund requests count
        try {
          const refundsResponse = await api.get('/admin/refunds');
          setRefundsCount(refundsResponse.data.count || 0);
        } catch (refundErr) {
          console.warn('Could not fetch refund count:', refundErr);
          setRefundsCount(0);
        }
      } catch (err) {
        console.error('Error fetching dashboard data:', err);
        setError('Could not load dashboard statistics');
      } finally {
        setLoading(false);
      }
    };
    
    fetchData();
  }, []);

  if (loading) {
    return (
      <div className="flex justify-center items-center h-96">
        <FaSpinner className="animate-spin text-purple-600 text-4xl" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="bg-red-100 text-red-800 p-6 rounded-md">
          <div className="flex items-start">
            <FaExclamationTriangle className="mt-1 mr-3" />
            <span>{error}</span>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold mb-8">Admin Dashboard</h1>
      
      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-10">
        <div className="bg-white rounded-lg shadow-md p-6">
          <div className="flex items-center">
            <div className="p-3 bg-purple-100 rounded-full mr-4">
              <FaUser className="text-purple-600 text-xl" />
            </div>
            <div>
              <p className="text-sm text-gray-500">Total Users</p>
              <p className="text-2xl font-bold">{stats?.users || 0}</p>
            </div>
          </div>
        </div>
        
        <div className="bg-white rounded-lg shadow-md p-6">
          <div className="flex items-center">
            <div className="p-3 bg-blue-100 rounded-full mr-4">
              <FaCalendarAlt className="text-blue-600 text-xl" />
            </div>
            <div>
              <p className="text-sm text-gray-500">Total Events</p>
              <p className="text-2xl font-bold">{stats?.events || 0}</p>
            </div>
          </div>
        </div>
        
        <div className="bg-white rounded-lg shadow-md p-6">
          <div className="flex items-center">
            <div className="p-3 bg-green-100 rounded-full mr-4">
              <FaTicketAlt className="text-green-600 text-xl" />
            </div>
            <div>
              <p className="text-sm text-gray-500">Tickets Sold</p>
              <p className="text-2xl font-bold">{stats?.tickets || 0}</p>
            </div>
          </div>
        </div>
        
        <div className="bg-white rounded-lg shadow-md p-6">
          <div className="flex items-center">
            <div className="p-3 bg-yellow-100 rounded-full mr-4">
              <FaMoneyBillWave className="text-yellow-600 text-xl" />
            </div>
            <div>
              <p className="text-sm text-gray-500">Pending Refunds</p>
              <p className="text-2xl font-bold">{refundsCount}</p>
            </div>
          </div>
        </div>
      </div>
      
      {/* Quick Actions */}
      <h2 className="text-xl font-bold mb-4">Quick Actions</h2>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-10">
        <Link to="/admin/users" className="bg-white rounded-lg shadow-md p-6 hover:bg-purple-50 transition">
          <div className="flex items-center">
            <FaUser className="mr-3 text-purple-600" />
            <span className="font-medium">Manage Users</span>
          </div>
        </Link>
        
        <Link to="/admin/events" className="bg-white rounded-lg shadow-md p-6 hover:bg-purple-50 transition">
          <div className="flex items-center">
            <FaCalendarAlt className="mr-3 text-purple-600" />
            <span className="font-medium">Manage Events</span>
          </div>
        </Link>
        
        <Link to="/admin/categories" className="bg-white rounded-lg shadow-md p-6 hover:bg-purple-50 transition">
          <div className="flex items-center">
            <FaListAlt className="mr-3 text-purple-600" />
            <span className="font-medium">Manage Categories</span>
          </div>
        </Link>
        
        <Link to="/admin/refunds" className="bg-white rounded-lg shadow-md p-6 hover:bg-purple-50 transition">
          <div className="flex items-center">
            <FaMoneyBillWave className="mr-3 text-purple-600" />
            <span className="font-medium">Manage Refunds</span>
            {refundsCount > 0 && (
              <span className="ml-2 px-2 py-1 bg-red-100 text-red-800 text-xs font-medium rounded-full">
                {refundsCount}
              </span>
            )}
          </div>
        </Link>
      </div>
    </div>
  );
};

export default AdminDashboard;