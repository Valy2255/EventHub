// src/components/layout/AdminLayout.jsx
import { Link, Outlet, useLocation } from "react-router-dom";
import { useAuth } from "../../hooks/useAuth";
import {
  FaTachometerAlt,
  FaUsers,
  FaCalendarAlt,
  FaList,
  FaMoneyBillWave,
  FaSignOutAlt,
  FaHome,
  FaBars,
  FaTimes,
  FaCog,
} from "react-icons/fa";
import { useState, useEffect } from "react";
import api from "../../services/api";

const AdminLayout = () => {
  const { user, logout } = useAuth();
  const location = useLocation();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [pendingRefunds, setPendingRefunds] = useState(0);
  const [subcategoriesCount, setSubcategoriesCount] = useState(0);

  useEffect(() => {
    // Fetch pending refunds count
    const fetchRefundsCount = async () => {
      try {
        const response = await api.get("/admin/refunds");
        setPendingRefunds(response.data.count || 0);
      } catch (error) {
        console.error("Error fetching refund count:", error);
      }
    };

    // Fetch subcategories count
    const fetchSubcategoriesCount = async () => {
      try {
        const response = await api.get("/admin/subcategories");
        setSubcategoriesCount((response.data.subcategories || []).length);
      } catch (error) {
        console.error("Error fetching subcategories count:", error);
      }
    };

    fetchRefundsCount();
    fetchSubcategoriesCount();

    // Refresh every 5 minutes
    const interval = setInterval(() => {
      fetchRefundsCount();
      fetchSubcategoriesCount();
    }, 5 * 60 * 1000);
    
    return () => clearInterval(interval);
  }, []);

  const navItems = [
    { path: "/admin", label: "Dashboard", icon: <FaTachometerAlt /> },
    { path: "/admin/users", label: "Users", icon: <FaUsers /> },
    { path: "/admin/events", label: "Events", icon: <FaCalendarAlt /> },
    { path: "/admin/categories", label: "Categories", icon: <FaList /> },
    {
      path: "/admin/subcategories",
      label: "Subcategories",
      icon: <FaList />,
      badge: subcategoriesCount > 0 ? subcategoriesCount : null,
    },
    {
      path: "/admin/refunds",
      label: "Refunds",
      icon: <FaMoneyBillWave />,
      badge: pendingRefunds > 0 ? pendingRefunds : null,
    },
  ];

  const isActive = (path) => {
    return location.pathname === path;
  };

  return (
    <div className="min-h-screen bg-gray-100">
      {/* Fixed Header */}
      <div className="bg-purple-700 fixed top-0 left-0 right-0 h-16 shadow-md z-50">
        <div className="flex items-center justify-between h-full px-4">
          {/* Left side with toggle and title */}
          <div className="flex items-center">
            <button
              onClick={() => setSidebarOpen(!sidebarOpen)}
              className="text-white mr-3 lg:hidden"
              aria-label="Toggle menu"
            >
              {sidebarOpen ? <FaTimes /> : <FaBars />}
            </button>
            <Link to="/admin" className="text-white font-bold text-xl">
              EventHub Admin
            </Link>
          </div>
          
          {/* Right side navigation */}
          <div className="flex items-center space-x-4">
            <Link
              to="/"
              className="text-white hover:text-purple-200 flex items-center whitespace-nowrap"
            >
              <FaHome className="mr-1" /> Main Site
            </Link>
            <div className="text-white whitespace-nowrap">
              Welcome, {user?.name}
            </div>
            <button
              onClick={logout}
              className="text-white hover:text-purple-200 flex items-center whitespace-nowrap"
              aria-label="Logout"
            >
              <FaSignOutAlt className="mr-1" /> Logout
            </button>
          </div>
        </div>
      </div>

      {/* Fixed Sidebar for desktop */}
      <div className="hidden lg:block fixed left-0 top-16 bottom-0 w-64 bg-gray-800 z-40 overflow-y-auto">
        <nav className="mt-6 px-2 pb-20">
          <div className="space-y-1">
            {navItems.map((item) => (
              <Link
                key={item.path}
                to={item.path}
                className={`group flex items-center px-2 py-2 text-sm font-medium rounded-md ${
                  isActive(item.path)
                    ? "bg-gray-900 text-white"
                    : "text-gray-300 hover:bg-gray-700 hover:text-white"
                }`}
              >
                <span className="mr-3">{item.icon}</span>
                <span className="flex-1">{item.label}</span>
                {item.badge && (
                  <span className="bg-red-500 text-white text-xs font-medium py-0.5 px-2 rounded-full">
                    {item.badge}
                  </span>
                )}
              </Link>
            ))}
          </div>
        </nav>
      </div>

      {/* Mobile sidebar - absolute positioned when open */}
      {sidebarOpen && (
        <>
          <div 
            className="fixed inset-0 bg-black bg-opacity-50 z-30 lg:hidden"
            onClick={() => setSidebarOpen(false)}
          ></div>
          <div className="fixed left-0 top-16 bottom-0 w-64 bg-gray-800 z-40 lg:hidden overflow-y-auto">
            <nav className="mt-6 px-2 pb-20">
              <div className="space-y-1">
                {navItems.map((item) => (
                  <Link
                    key={item.path}
                    to={item.path}
                    className={`group flex items-center px-2 py-2 text-sm font-medium rounded-md ${
                      isActive(item.path)
                        ? "bg-gray-900 text-white"
                        : "text-gray-300 hover:bg-gray-700 hover:text-white"
                    }`}
                    onClick={() => setSidebarOpen(false)}
                  >
                    <span className="mr-3">{item.icon}</span>
                    <span className="flex-1">{item.label}</span>
                    {item.badge && (
                      <span className="bg-red-500 text-white text-xs font-medium py-0.5 px-2 rounded-full">
                        {item.badge}
                      </span>
                    )}
                  </Link>
                ))}
              </div>
            </nav>
          </div>
        </>
      )}

      {/* Main content area - padded to accommodate fixed elements */}
      <div className="pt-16 lg:pl-64">
        <main className="p-4 min-h-screen bg-gray-100">
          <Outlet />
        </main>
      </div>
    </div>
  );
};

export default AdminLayout;