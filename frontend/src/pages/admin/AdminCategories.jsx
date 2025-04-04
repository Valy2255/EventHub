// src/pages/admin/AdminCategories.jsx
import { useState, useEffect } from 'react';
import { FaSpinner } from 'react-icons/fa';

const AdminCategories = () => {
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
      <h1 className="text-2xl font-bold mb-6">Category Management</h1>
      <p className="bg-blue-100 text-blue-800 p-4 rounded-md">
        Category management functionality will be implemented here.
      </p>
    </div>
  );
};

export default AdminCategories;