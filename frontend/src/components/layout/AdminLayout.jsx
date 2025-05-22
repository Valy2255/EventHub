// src/components/layout/AdminLayout.jsx
import { Link, Outlet, useLocation } from "react-router-dom";
import { useAuth } from "../../hooks/useAuth";
import { useChat } from "../../hooks/useChat";
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
  FaTicketAlt,
  FaQuestion,
  FaFileAlt,
  FaComments,
} from "react-icons/fa";
import { useState, useEffect } from "react";
import api from "../../services/api";

const AdminLayout = () => {
  const { user, logout } = useAuth();
  const { unreadCount } = useChat();
  const location = useLocation();
  const isChatPage = location.pathname.startsWith("/admin/chat");
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [stats, setStats] = useState({
    pendingRefunds: 0,
    subcategories: 0,
    events: 0,
    users: 0,
    categories: 0,
  });

  useEffect(() => {
    // Fetch dashboard stats
    const fetchStats = async () => {
      try {
        // Get dashboard stats
        const dashboardResponse = await api.get("/admin/dashboard/stats");

        // Get subcategories count
        const subcategoriesResponse = await api.get("/admin/subcategories");

        setStats({
          events: dashboardResponse.data.stats?.events || 0,
          users: dashboardResponse.data.stats?.users || 0,
          categories: dashboardResponse.data.stats?.categories || 0,
          pendingRefunds: dashboardResponse.data.stats?.pendingRefunds || 0, // Use from stats directly
          subcategories:
            (subcategoriesResponse.data.subcategories || []).length || 0,
        });
      } catch (error) {
        console.error("Error fetching stats:", error);
      }
    };

    fetchStats();

    // Refresh every 5 minutes
    const interval = setInterval(() => {
      fetchStats();
    }, 5 * 60 * 1000);

    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    const prev = document.body.style.overflow;
    document.body.style.overflow = isChatPage ? "hidden" : prev;

    return () => {
      // run when layout unmounts
      document.body.style.overflow = prev;
    };
  }, [isChatPage]);

  const navItems = [
    {
      path: "/admin",
      label: "Dashboard",
      icon: <FaTachometerAlt />,
      badge: null, // Dashboard typically doesn't need a badge
    },
    {
      path: "/admin/users",
      label: "Users",
      icon: <FaUsers />,
      badge: stats.users > 0 ? stats.users : null,
    },
    {
      path: "/admin/events",
      label: "Events",
      icon: <FaCalendarAlt />,
      badge: stats.events > 0 ? stats.events : null,
    },
    {
      path: "/admin/check-in",
      label: "Ticket Check-In",
      icon: <FaTicketAlt />,
      badge: null,
    },
    {
      path: "/admin/categories",
      label: "Categories",
      icon: <FaList />,
      badge: stats.categories > 0 ? stats.categories : null,
    },
    {
      path: "/admin/subcategories",
      label: "Subcategories",
      icon: <FaList />,
      badge: stats.subcategories > 0 ? stats.subcategories : null,
    },
    {
      path: "/admin/chat",
      label: "Live Chat",
      icon: <FaComments />,
      badge: unreadCount > 0 ? unreadCount : null,
      badgeColor: "bg-red-500", // Highlight unread messages with red badge
    },
    {
      path: "/admin/refunds",
      label: "Refunds",
      icon: <FaMoneyBillWave />,
      badge: stats.pendingRefunds > 0 ? stats.pendingRefunds : null,
    },
    {
      path: "/admin/faqs",
      label: "FAQs",
      icon: <FaQuestion />,
      badge: null,
    },
    {
      path: "/admin/legal-documents",
      label: "Legal Documents",
      icon: <FaFileAlt />,
      badge: null,
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
            {unreadCount > 0 && (
              <Link
                to="/admin/chat"
                className="relative text-white hover:text-purple-200 flex items-center"
              >
                <FaComments className="text-xl" />
                <span className="absolute -top-2 -right-2 bg-red-500 text-white text-xs font-bold rounded-full h-5 w-5 flex items-center justify-center">
                  {unreadCount}
                </span>
              </Link>
            )}
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
                  <span
                    className={`text-white text-xs font-medium py-0.5 px-2 rounded-full ${
                      item.badgeColor ||
                      (item.path === "/admin/refunds"
                        ? "bg-red-500"
                        : "bg-blue-500")
                    }`}
                  >
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
                      <span
                        className={`text-white text-xs font-medium py-0.5 px-2 rounded-full ${
                          item.badgeColor ||
                          (item.path === "/admin/refunds"
                            ? "bg-red-500"
                            : "bg-blue-500")
                        }`}
                      >
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
        <main
          className={`p-4 bg-gray-100 ${
            isChatPage ? "h-[calc(100vh-4rem)] overflow-hidden" : "min-h-screen"
          }`}
        >
          <Outlet />
        </main>
      </div>
    </div>
  );
};

export default AdminLayout;
