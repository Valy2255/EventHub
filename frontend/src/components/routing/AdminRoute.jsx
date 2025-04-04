// src/components/routing/AdminRoute.jsx
import { Navigate, Outlet } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth';

const AdminRoute = () => {
  const { user, loading } = useAuth();

  // If auth is still loading, show nothing
  if (loading) {
    return (
      <div className="flex justify-center items-center h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-purple-500"></div>
      </div>
    );
  }

  // Check if user is logged in and is an admin
  if (!user || user.role !== 'admin') {
    return <Navigate to="/" replace />;
  }

  // If user is an admin, render the child routes
  return <Outlet />;
};

export default AdminRoute;