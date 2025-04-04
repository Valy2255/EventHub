// src/components/layout/AdminLayout.jsx
import { Link, Outlet, useLocation } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth';
import { 
  FaTachometerAlt, 
  FaUsers, 
  FaCalendarAlt,
  FaList,
  FaMoneyBillWave,
  FaSignOutAlt,
  FaHome,
  FaBars,
  FaTimes
} from 'react-icons/fa';
import { useState } from 'react';

const AdminLayout = () => {
  const { user, logout } = useAuth();
  const location = useLocation();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const navItems = [
    { path: '/admin', label: 'Dashboard', icon: <FaTachometerAlt /> },
    { path: '/admin/users', label: 'Users', icon: <FaUsers /> },
    { path: '/admin/events', label: 'Events', icon: <FaCalendarAlt /> },
    { path: '/admin/categories', label: 'Categories', icon: <FaList /> },
    { path: '/admin/refunds', label: 'Refunds', icon: <FaMoneyBillWave /> },
  ];

  const isActive = (path) => {
    return location.pathname === path;
  };

  return (
    <div className="min-h-screen bg-gray-100 flex flex-col">
      {/* Top Navigation */}
      <header className="bg-purple-700 shadow-md">
        <div className="container mx-auto px-4">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center">
              <button
                onClick={() => setSidebarOpen(!sidebarOpen)}
                className="text-white mr-3 lg:hidden"
              >
                {sidebarOpen ? <FaTimes /> : <FaBars />}
              </button>
              <Link to="/admin" className="text-white font-bold text-xl">
                EventHub Admin
              </Link>
            </div>
            <div className="flex items-center space-x-4">
              <Link to="/" className="text-white hover:text-purple-200 flex items-center">
                <FaHome className="mr-1" /> Main Site
              </Link>
              <div className="text-white">
                Welcome, {user?.name}
              </div>
              <button
                onClick={logout}
                className="text-white hover:text-purple-200 flex items-center"
              >
                <FaSignOutAlt className="mr-1" /> Logout
              </button>
            </div>
          </div>
        </div>
      </header>

      <div className="flex flex-1">
        {/* Sidebar */}
        <aside 
          className={`bg-gray-800 text-white w-64 flex-shrink-0 ${
            sidebarOpen ? 'block' : 'hidden'
          } lg:block fixed lg:relative z-10 h-full lg:h-auto`}
        >
          <nav className="mt-5 px-2">
            <div className="space-y-1">
              {navItems.map((item) => (
                <Link
                  key={item.path}
                  to={item.path}
                  className={`group flex items-center px-2 py-2 text-sm font-medium rounded-md ${
                    isActive(item.path)
                      ? 'bg-gray-900 text-white'
                      : 'text-gray-300 hover:bg-gray-700 hover:text-white'
                  }`}
                >
                  <span className="mr-3">{item.icon}</span>
                  {item.label}
                </Link>
              ))}
            </div>
          </nav>
        </aside>

        {/* Main content */}
        <main className="flex-1 overflow-x-auto p-4">
          <Outlet />
        </main>
      </div>
    </div>
  );
};

export default AdminLayout;