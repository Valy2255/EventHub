// src/pages/PurchasePage.jsx (simplified)
import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import {
  FaArrowLeft,
  FaShoppingCart,
  FaCalendarAlt,
  FaMapMarkerAlt,
  FaClock,
  FaTicketAlt,
  FaCreditCard,
  FaSpinner
} from 'react-icons/fa';
import api from '../services/api';

const PurchasePage = () => {
  const { id } = useParams();
  const [purchase, setPurchase] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchPurchase = async () => {
      try {
        setLoading(true);
        const response = await api.get(`/purchases/${id}`);
        setPurchase(response.data.data);
        setError(null);
      } catch (err) {
        console.error('Error fetching purchase:', err);
        setError('Failed to load purchase details. Please try again.');
      } finally {
        setLoading(false);
      }
    };

    fetchPurchase();
  }, [id]);

  // Format date
  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  // Format time
  const formatTime = (timeString) => {
    if (!timeString) return '';
    const [hours, minutes] = timeString.split(':');
    const hour = parseInt(hours, 10);
    const ampm = hour >= 12 ? 'PM' : 'AM';
    const formattedHour = hour % 12 || 12;
    return `${formattedHour}:${minutes} ${ampm}`;
  };

  if (loading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="flex justify-center items-center h-64">
          <FaSpinner className="animate-spin text-purple-600 text-2xl" />
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="bg-red-100 text-red-800 p-4 rounded-md">
          <p>{error}</p>
          <Link to="/profile/purchases" className="text-purple-600 mt-4 inline-block">
            Return to Purchase History
          </Link>
        </div>
      </div>
    );
  }

  if (!purchase) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="bg-yellow-100 text-yellow-800 p-4 rounded-md">
          <p>Purchase not found.</p>
          <Link to="/profile/purchases" className="text-purple-600 mt-4 inline-block">
            Return to Purchase History
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex items-center mb-6">
        <Link to="/profile/purchases" className="text-purple-600 mr-2">
          <FaArrowLeft />
        </Link>
        <h1 className="text-3xl font-bold">Purchase Details</h1>
      </div>

      {/* Purchase summary card */}
      <div className="bg-white rounded-lg shadow-md p-6 mb-6">
        <div className="flex items-center border-b border-gray-200 pb-4 mb-4">
          <div className="w-12 h-12 rounded-full bg-purple-100 flex items-center justify-center mr-4">
            <FaShoppingCart className="text-purple-600" />
          </div>
          <div>
            <h2 className="text-xl font-bold">Order #{purchase.order_id || purchase.id}</h2>
            <p className="text-gray-600">
              Purchased on {formatDate(purchase.purchase_date)} at {formatTime(purchase.purchase_time)}
            </p>
          </div>
        </div>

        {/* Event info */}
        {purchase.event && (
          <div className="mb-6">
            <h3 className="font-bold text-lg mb-3">Event</h3>
            <div className="flex items-start">
              <div className="w-16 h-16 bg-gray-200 rounded overflow-hidden mr-4 flex-shrink-0">
                {purchase.event.image_url && (
                  <img
                    src={purchase.event.image_url}
                    alt={purchase.event.name}
                    className="w-full h-full object-cover"
                  />
                )}
              </div>

              <div>
                <h4 className="font-bold">{purchase.event.name}</h4>
                <div className="text-sm text-gray-600">
                  <div className="flex items-center mb-1">
                    <FaCalendarAlt className="mr-1" size={12} />
                    {formatDate(purchase.event.date)}
                  </div>
                  <div className="flex items-center mb-1">
                    <FaClock className="mr-1" size={12} />
                    {formatTime(purchase.event.time)}
                  </div>
                  <div className="flex items-center">
                    <FaMapMarkerAlt className="mr-1" size={12} />
                    {purchase.event.venue}
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Ticket details */}
        <div className="mb-6">
          <h3 className="font-bold text-lg mb-3">Tickets</h3>
          <div className="border rounded-lg overflow-hidden">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Ticket Type
                  </th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Quantity
                  </th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Price
                  </th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Subtotal
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {purchase.items && purchase.items.map((item, index) => (
                  <tr key={index}>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <FaTicketAlt className="text-purple-500 mr-2" />
                        <span>{item.ticket_type_name}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      {item.quantity}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      ${parseFloat(item.price).toFixed(2)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      ${(parseFloat(item.price) * item.quantity).toFixed(2)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Payment summary */}
        <div>
          <h3 className="font-bold text-lg mb-3">Payment Summary</h3>
          <div className="bg-gray-50 p-4 rounded-lg">
            <div className="flex justify-between mb-2">
              <span>Subtotal</span>
              <span>${parseFloat(purchase.subtotal || 0).toFixed(2)}</span>
            </div>
            {purchase.discounts > 0 && (
              <div className="flex justify-between mb-2">
                <span>Discounts</span>
                <span>-${parseFloat(purchase.discounts).toFixed(2)}</span>
              </div>
            )}
            <div className="border-t border-gray-300 my-2"></div>
            <div className="flex justify-between font-bold">
              <span>Total</span>
              <span>${parseFloat(purchase.total || 0).toFixed(2)}</span>
            </div>

            <div className="mt-4">
              <div className="flex items-center">
                <FaCreditCard className="text-gray-500 mr-2" />
                <span>Payment Method: {purchase.payment_method || 'Credits'}</span>
              </div>
            </div>
          </div>
        </div>

        {/* View tickets button */}
        <div className="mt-6">
          <Link
            to="/profile/tickets"
            className="bg-purple-600 text-white px-6 py-2 rounded-md hover:bg-purple-700 inline-flex items-center"
          >
            <FaTicketAlt className="mr-2" />
            View My Tickets
          </Link>
        </div>
      </div>
    </div>
  );
};

export default PurchasePage;