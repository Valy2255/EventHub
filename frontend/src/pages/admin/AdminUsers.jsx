// src/pages/admin/AdminUsers.jsx
import { useState, useEffect } from 'react';
import { FaSpinner } from 'react-icons/fa';

const AdminUsers = () => {
  const [loading, setLoading] = useState(true);
  
  useEffect(() => {
    // Simulate data loading
    setTimeout(() => {
      setLoading(false);
    }, 500);
  }, []);

  if (loading) {
    return (
      <div className="flex justify-center items-center h-96">
        <FaSpinner className="animate-spin text-purple-600 text-4xl" />
      </div>
    );
  }

  return (
    <div>
      <h1 className="text-2xl font-bold mb-6">User Management</h1>
      <p className="bg-blue-100 text-blue-800 p-4 rounded-md">
        User management functionality will be implemented here.
      </p>
    </div>
  );
};

export default AdminUsers;