// src/pages/TicketPage.jsx
import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import {
  FaArrowLeft,
  FaTicketAlt,
  FaCalendarAlt,
  FaMapMarkerAlt,
  FaClock,
  FaDownload,
  FaExchangeAlt,
  FaTimes,
  FaSpinner,
  FaCheckCircle,
  FaExclamationTriangle
} from 'react-icons/fa';
import api from '../services/api';

const TicketPage = () => {
  const { id } = useParams();
  const [ticket, setTicket] = useState(null);
  const [event, setEvent] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchTicket = async () => {
      try {
        setLoading(true);
        const response = await api.get(`/tickets/${id}`);
        setTicket(response.data.data.ticket);
        setEvent(response.data.data.event);
        setError(null);
      } catch (err) {
        console.error('Error fetching ticket:', err);
        setError('Failed to load ticket details. Please try again.');
      } finally {
        setLoading(false);
      }
    };

    fetchTicket();
  }, [id]);

  // Format date
  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      weekday: 'long',
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

  // Handle ticket download
  const downloadTicket = () => {
    if (!ticket || !event) return;

    // Create a canvas element to draw the ticket
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    canvas.width = 800;
    canvas.height = 400;

    // Draw background
    ctx.fillStyle = '#8B5CF6'; // Purple background
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // Add ticket border
    ctx.strokeStyle = 'white';
    ctx.lineWidth = 3;
    ctx.strokeRect(10, 10, canvas.width - 20, canvas.height - 20);

    // Add event title
    ctx.font = 'bold 36px Arial';
    ctx.fillStyle = 'white';
    ctx.textAlign = 'center';
    ctx.fillText(event.name, canvas.width / 2, 70);

    // Add ticket info
    ctx.font = '20px Arial';
    ctx.textAlign = 'left';
    ctx.fillText(`Ticket Type: ${ticket.ticket_type_name}`, 50, 150);
    ctx.fillText(`Price: $${parseFloat(ticket.price).toFixed(2)}`, 50, 190);
    ctx.fillText(`Ticket ID: ${ticket.id}`, 50, 230);

    // Draw QR code (assuming it's available)
    if (ticket.qr_code) {
      const qrImage = new Image();
      qrImage.onload = () => {
        ctx.drawImage(qrImage, 500, 120, 200, 200);

        // Convert canvas to image and download
        const link = document.createElement('a');
        link.download = `ticket-${ticket.id}.png`;
        link.href = canvas.toDataURL('image/png');
        link.click();
      };
      qrImage.src = ticket.qr_code;
    } else {
      // If no QR code, just download without it
      const link = document.createElement('a');
      link.download = `ticket-${ticket.id}.png`;
      link.href = canvas.toDataURL('image/png');
      link.click();
    }
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
          <Link to="/profile/tickets" className="text-purple-600 mt-4 inline-block">
            Return to My Tickets
          </Link>
        </div>
      </div>
    );
  }

  if (!ticket || !event) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="bg-yellow-100 text-yellow-800 p-4 rounded-md">
          <p>Ticket not found.</p>
          <Link to="/profile/tickets" className="text-purple-600 mt-4 inline-block">
            Return to My Tickets
          </Link>
        </div>
      </div>
    );
  }

  const isPast = new Date(event.date) < new Date();
  const isCancelled = ticket.status === 'cancelled';

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex items-center mb-6">
        <Link to="/profile/tickets" className="text-purple-600 mr-2">
          <FaArrowLeft />
        </Link>
        <h1 className="text-3xl font-bold">Ticket Details</h1>
      </div>

      {/* Ticket card */}
      <div className="bg-white rounded-lg shadow-md overflow-hidden mb-6">
        {/* Event header */}
        <div className="bg-purple-600 text-white p-6">
          <div className="flex items-start">
            <div className="w-16 h-16 bg-white bg-opacity-20 rounded overflow-hidden mr-4 flex-shrink-0">
              {event.image_url && (
                <img
                  src={event.image_url}
                  alt={event.name}
                  className="w-full h-full object-cover"
                />
              )}
            </div>

            <div>
              <h2 className="text-xl font-bold">{event.name}</h2>
              <div className="text-sm text-white text-opacity-90">
                <div className="flex items-center mb-1">
                  <FaCalendarAlt className="mr-1" size={12} />
                  {formatDate(event.date)}
                </div>
                <div className="flex items-center mb-1">
                  <FaClock className="mr-1" size={12} />
                  {formatTime(event.time)}
                </div>
                <div className="flex items-center">
                  <FaMapMarkerAlt className="mr-1" size={12} />
                  {event.venue}
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Ticket details */}
        <div className="p-6">
          <div className="flex justify-between items-start mb-6">
            <div>
              <h3 className="font-bold text-lg">{ticket.ticket_type_name}</h3>
              <p className="text-gray-600">${parseFloat(ticket.price).toFixed(2)}</p>
              {ticket.purchase_date && (
                <p className="text-sm text-gray-500 mt-1">
                  Purchased on {new Date(ticket.purchase_date).toLocaleDateString()}
                </p>
              )}
            </div>
            <div>
              {isCancelled ? (
                <span className="px-3 py-1 bg-red-100 text-red-800 text-sm font-medium rounded-full">
                  Cancelled
                </span>
              ) : ticket.checked_in ? (
                <span className="px-3 py-1 bg-green-100 text-green-800 text-sm font-medium rounded-full">
                  Used
                </span>
              ) : isPast ? (
                <span className="px-3 py-1 bg-gray-100 text-gray-800 text-sm font-medium rounded-full">
                  Expired
                </span>
              ) : (
                <span className="px-3 py-1 bg-purple-100 text-purple-800 text-sm font-medium rounded-full">
                  Valid
                </span>
              )}
            </div>
          </div>

          {/* QR Code (not shown for cancelled tickets) */}
          {ticket.qr_code && !isCancelled && (
            <div className="flex flex-col items-center my-6 bg-gray-50 p-6 rounded-lg">
              <img
                src={ticket.qr_code}
                alt="Ticket QR Code"
                className="max-w-xs h-auto"
              />
              <div className="text-sm text-gray-500 mt-2">
                Scan this QR code at the event for entry
              </div>
            </div>
          )}

          {/* Status notices */}
          {isCancelled && (
            <div className="bg-red-100 text-red-800 p-4 rounded-md flex items-start my-6">
              <FaExclamationTriangle className="mr-2 mt-1 flex-shrink-0" />
              <div>
                <p className="font-medium">This ticket has been cancelled</p>
                <div className="mt-2 mb-2">
                  <span className={`px-2 py-1 text-xs font-medium rounded-full 
                    ${ticket.refund_status === 'completed'
                      ? 'bg-green-100 text-green-800'
                      : ticket.refund_status === 'processing'
                        ? 'bg-blue-100 text-blue-800'
                        : ticket.refund_status === 'failed'
                          ? 'bg-red-100 text-red-800'
                          : ticket.refund_status === 'denied'
                            ? 'bg-gray-100 text-gray-800'
                            : 'bg-yellow-100 text-yellow-800'
                    }`}
                  >
                    Refund: {ticket.refund_status
                      ? ticket.refund_status.charAt(0).toUpperCase() + ticket.refund_status.slice(1)
                      : 'Requested'}
                  </span>
                </div>
                <p className="text-sm">
                  {ticket.refund_status === 'completed'
                    ? 'Your refund has been processed successfully.'
                    : ticket.refund_status === 'processing'
                      ? 'Your refund is being processed and may take 5-7 business days.'
                      : ticket.refund_status === 'failed'
                        ? 'There was an issue with your refund. Please contact support.'
                        : ticket.refund_status === 'denied'
                          ? 'Your refund request was denied. Please contact support for more information.'
                          : 'The refund may take 5-7 business days to process.'}
                </p>
                {ticket.cancelled_at && (
                  <p className="text-xs text-gray-600 mt-1">
                    Cancelled on {new Date(ticket.cancelled_at).toLocaleString()}
                  </p>
                )}
              </div>
            </div>
          )}

          {ticket.checked_in && (
            <div className="bg-green-100 text-green-800 p-4 rounded-md flex items-start my-6">
              <FaCheckCircle className="mr-2 mt-1 flex-shrink-0" />
              <div>
                <p className="font-medium">Ticket has been used</p>
                {ticket.checked_in_at && (
                  <p className="text-sm">
                    Checked in on {new Date(ticket.checked_in_at).toLocaleString()}
                  </p>
                )}
              </div>
            </div>
          )}

          {/* Ticket actions */}
          {!isCancelled && !ticket.checked_in && !isPast && (
            <div className="flex flex-wrap gap-3 mt-6">
              <button
                onClick={downloadTicket}
                className="bg-purple-600 text-white px-4 py-2 rounded-md flex items-center hover:bg-purple-700"
              >
                <FaDownload className="mr-2" />
                Download Ticket
              </button>
              <Link
                to={`/profile/tickets`}
                state={{ exchangeTicketId: ticket.id }}
                className="bg-blue-600 text-white px-4 py-2 rounded-md flex items-center hover:bg-blue-700"
              >
                <FaExchangeAlt className="mr-2" />
                Exchange Ticket
              </Link>
              <Link
                to={`/profile/tickets`}
                state={{ cancelTicketId: ticket.id }}
                className="bg-red-600 text-white px-4 py-2 rounded-md flex items-center hover:bg-red-700"
              >
                <FaTimes className="mr-2" />
                Cancel Ticket
              </Link>
            </div>
          )}
        </div>
      </div>

      {/* Additional info about the event */}
      <div className="bg-white rounded-lg shadow-md p-6">
        <h3 className="font-bold text-lg mb-4">Event Details</h3>
        
        {event.description && (
          <div className="mb-4">
            <h4 className="font-medium mb-2">Description</h4>
            <p className="text-gray-700">{event.description}</p>
          </div>
        )}
        
        {event.cancellation_policy && (
          <div className="mb-4">
            <h4 className="font-medium mb-2">Cancellation Policy</h4>
            <p className="text-gray-700">{event.cancellation_policy}</p>
          </div>
        )}
        
        {event.exchange_policy && (
          <div>
            <h4 className="font-medium mb-2">Exchange Policy</h4>
            <p className="text-gray-700">{event.exchange_policy}</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default TicketPage;