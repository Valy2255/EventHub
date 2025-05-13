// src/pages/CreditHistory.jsx
import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import {
  FaCoins,
  FaArrowRight,
  FaArrowLeft,
  FaSpinner,
  FaPlus,
  FaMinus,
  FaTicketAlt,
  FaExchangeAlt,
  FaShoppingCart,
  FaUserCog
} from 'react-icons/fa';
import api from '../services/api';
import { useAuth } from '../hooks/useAuth';

const CreditHistory = () => {
  const [transactions, setTransactions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [page, setPage] = useState(1);
  const [pagination, setPagination] = useState({
    hasMore: false,
    total: 0,
    totalPages: 0
  });
  const { user } = useAuth();

  useEffect(() => {
    const fetchTransactions = async () => {
      try {
        setLoading(true);
        const response = await api.get(`/credits/history?page=${page}&limit=10`);
        setTransactions(response.data.transactions);
        setPagination(response.data.pagination);
        setError(null);
      } catch (err) {
        console.error('Error fetching credit history:', err);
        setError('Failed to load credit history. Please try again.');
      } finally {
        setLoading(false);
      }
    };

    fetchTransactions();
  }, [page]);

  const getTransactionIcon = (type, isAddition) => {
    switch (type) {
      case 'purchase':
        return <FaShoppingCart className="text-blue-500" />;
      case 'exchange_refund':
        return <FaPlus className="text-green-500" />;
      case 'exchange_payment':
        return <FaMinus className="text-red-500" />;
      case 'admin_adjustment':
        return <FaUserCog className={isAddition ? "text-green-500" : "text-red-500"} />;
      default:
        return isAddition ? (
          <FaPlus className="text-green-500" />
        ) : (
          <FaMinus className="text-red-500" />
        );
    }
  };

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex items-center mb-6">
        <Link to="/profile" className="text-purple-600 mr-2">
          <FaArrowLeft />
        </Link>
        <h1 className="text-3xl font-bold">Credit History</h1>
      </div>

      {/* Credit balance card */}
      <div className="bg-white rounded-lg shadow-md p-6 mb-6">
        <div className="flex items-center">
          <div className="w-12 h-12 rounded-full bg-yellow-100 flex items-center justify-center mr-4">
            <FaCoins className="text-yellow-500" />
          </div>
          <div>
            <div className="text-sm text-gray-600">Current Balance</div>
            <div className="text-2xl font-bold">{parseFloat(user?.credits || 0).toFixed(2)} Credits</div>
          </div>
        </div>
      </div>

      {/* Transactions list */}
      <div className="bg-white rounded-lg shadow-md overflow-hidden">
        <h2 className="text-xl font-bold p-6 border-b border-gray-200">
          Transaction History
        </h2>

        {loading && (
          <div className="flex justify-center py-8">
            <FaSpinner className="animate-spin text-purple-600 text-2xl" />
          </div>
        )}

        {error && (
          <div className="p-6 text-red-500 text-center">
            <p>{error}</p>
            <button
              onClick={() => setPage(1)}
              className="mt-4 text-purple-600 underline"
            >
              Try Again
            </button>
          </div>
        )}

        {!loading && !error && transactions.length === 0 && (
          <div className="p-6 text-center">
            <p className="text-gray-500">No transaction history yet.</p>
            <Link
              to="/events/search"
              className="mt-4 inline-block bg-purple-600 text-white px-4 py-2 rounded-md"
            >
              Browse Events
            </Link>
          </div>
        )}

        {!loading && !error && transactions.length > 0 && (
          <ul className="divide-y divide-gray-200">
            {transactions.map((transaction) => (
              <li key={transaction.id} className="p-6 hover:bg-gray-50">
                <div className="flex items-start">
                  <div className="w-10 h-10 rounded-full bg-gray-100 flex items-center justify-center mr-4 flex-shrink-0">
                    {getTransactionIcon(transaction.type, transaction.isAddition)}
                  </div>
                  <div className="flex-grow">
                    <div className="flex justify-between items-start">
                      <div>
                        <div className="font-medium">{transaction.typeLabel}</div>
                        <div className="text-sm text-gray-600">
                          {transaction.actionText}
                        </div>
                        <div className="text-xs text-gray-500 mt-1">
                          {transaction.formattedDate} at {transaction.formattedTime}
                        </div>
                      </div>
                      <div className={`font-bold ${transaction.isAddition ? 'text-green-600' : 'text-red-600'}`}>
                        {transaction.isAddition ? '+' : '-'}{Math.abs(parseFloat(transaction.amount)).toFixed(2)}
                      </div>
                    </div>
                    
                    {transaction.reference_type === 'ticket_exchange' && (
                      <div className="mt-2 text-sm">
                        <Link 
                          to={`/profile/tickets/${transaction.reference_id}`}
                          className="flex items-center text-purple-600 hover:text-purple-800"
                        >
                          <FaTicketAlt className="mr-1" />
                          <span>View Ticket</span>
                          <FaArrowRight className="ml-1 text-xs" />
                        </Link>
                      </div>
                    )}
                    
                    {transaction.reference_type === 'payment' && (
                      <div className="mt-2 text-sm">
                        <Link 
                          to={`/profile/purchases/${transaction.reference_id}`}
                          className="flex items-center text-purple-600 hover:text-purple-800"
                        >
                          <FaShoppingCart className="mr-1" />
                          <span>View Purchase</span>
                          <FaArrowRight className="ml-1 text-xs" />
                        </Link>
                      </div>
                    )}
                  </div>
                </div>
              </li>
            ))}
          </ul>
        )}

        {/* Pagination */}
        {!loading && !error && transactions.length > 0 && (
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
              Page {page} of {pagination.totalPages || 1}
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
    </div>
  );
};

export default CreditHistory;