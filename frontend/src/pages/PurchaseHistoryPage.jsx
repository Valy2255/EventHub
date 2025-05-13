// src/pages/PurchaseHistoryPage.jsx
import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import {
  FaArrowLeft,
  FaShoppingCart,
  FaTicketAlt,
  FaSpinner,
  FaArrowRight,
  FaCalendarAlt,
} from 'react-icons/fa';
import api from '../services/api';

const PurchaseHistoryPage = () => {
  const [purchases, setPurchases] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [page, setPage] = useState(1);
  const [pagination, setPagination] = useState({
    total: 0,
    totalPages: 0,
    currentPage: 1,
    hasMore: false
  });

  useEffect(() => {
    const fetchPurchases = async () => {
      try {
        setLoading(true);
        const response = await api.get(`/purchases/history?page=${page}&limit=10`);
        setPurchases(response.data.data);
        setPagination(response.data.pagination);
        setError(null);
      } catch (err) {
        console.error('Error fetching purchase history:', err);
        setError('Failed to load purchase history. Please try again.');
      } finally {
        setLoading(false);
      }
    };

    fetchPurchases();
  }, [page]);

  // Format date for display
  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  // Format time for display
  const formatTime = (timeString) => {
    if (!timeString) return '';
    const [hours, minutes] = timeString.split(':');
    const hour = parseInt(hours, 10);
    const ampm = hour >= 12 ? 'PM' : 'AM';
    const formattedHour = hour % 12 || 12;
    return `${formattedHour}:${minutes} ${ampm}`;
  };

  if (loading && purchases.length === 0) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="flex justify-center items-center h-64">
          <FaSpinner className="animate-spin text-purple-600 text-2xl" />
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex items-center mb-6">
        <Link to="/profile" className="text-purple-600 mr-2">
          <FaArrowLeft />
        </Link>
        <h1 className="text-3xl font-bold">Purchase History</h1>
      </div>

      {error && (
        <div className="bg-red-100 text-red-800 p-4 rounded-md mb-6">
          <p>{error}</p>
        </div>
      )}

      {!loading && purchases.length === 0 && !error && (
        <div className="bg-white rounded-lg shadow-md p-8 text-center">
          <FaShoppingCart className="mx-auto text-gray-400 text-5xl mb-4" />
          <h2 className="text-2xl font-bold text-gray-700 mb-2">No purchases yet</h2>
          <p className="text-gray-600 mb-6">You haven't made any purchases yet.</p>
          <Link
            to="/events/search"
            className="bg-purple-600 text-white px-6 py-2 rounded-md hover:bg-purple-700"
          >
            Browse Events
          </Link>
        </div>
      )}

      {purchases.length > 0 && (
        <div className="bg-white rounded-lg shadow-md overflow-hidden">
          <ul className="divide-y divide-gray-200">
            {purchases.map((purchase) => (
              <li key={purchase.id} className="hover:bg-gray-50">
                <Link to={`/profile/purchases/${purchase.id}`} className="block p-6">
                  <div className="flex items-start">
                    <div className="w-12 h-12 rounded-full bg-purple-100 flex items-center justify-center mr-4 flex-shrink-0">
                      <FaShoppingCart className="text-purple-600" />
                    </div>
                    <div className="flex-grow">
                      <div className="flex justify-between items-start">
                        <div>
                          <div className="font-medium">Order #{purchase.order_id || purchase.id}</div>
                          <div className="text-sm text-gray-600">
                            {purchase.event_name || 'Credit Purchase'}
                          </div>
                          <div className="text-xs text-gray-500 mt-1 flex items-center">
                            <FaCalendarAlt className="mr-1" />
                            {formatDate(purchase.purchase_date)} at {formatTime(purchase.purchase_time)}
                          </div>
                        </div>
                        <div className="flex items-center">
                          <span className="font-bold mr-2">${parseFloat(purchase.total).toFixed(2)}</span>
                          <FaArrowRight className="text-gray-400" />
                        </div>
                      </div>
                    </div>
                  </div>
                </Link>
              </li>
            ))}
          </ul>

          {/* Pagination */}
          {pagination.totalPages > 1 && (
            <div className="flex justify-between items-center p-6 border-t border-gray-200">
              <button
                onClick={() => setPage((prev) => Math.max(prev - 1, 1))}
                disabled={page === 1}
                className={`px-4 py-2 flex items-center ${
                  page === 1
                    ? 'text-gray-400 cursor-not-allowed'
                    : 'text-purple-600 hover:text-purple-800'
                }`}
              >
                <FaArrowLeft className="mr-2" /> Previous
              </button>

              <span className="text-gray-600">
                Page {page} of {pagination.totalPages}
              </span>

              <button
                onClick={() => setPage((prev) => prev + 1)}
                disabled={!pagination.hasMore}
                className={`px-4 py-2 flex items-center ${
                  !pagination.hasMore
                    ? 'text-gray-400 cursor-not-allowed'
                    : 'text-purple-600 hover:text-purple-800'
                }`}
              >
                Next <FaArrowRight className="ml-2" />
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default PurchaseHistoryPage;