// src/pages/UserTickets.jsx
import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { 
  FaTicketAlt, 
  FaCalendarAlt, 
  FaMapMarkerAlt,
  FaClock,
  FaChevronDown,
  FaChevronUp,
  FaDownload,
  FaPrint,
  FaShare,
  FaExclamationTriangle,
  FaCheckCircle,
  FaTimesCircle,
  FaSpinner,
  FaTimes
} from 'react-icons/fa';
import { useAuth } from '../hooks/useAuth';
import api from '../services/api';

const UserTickets = () => {
  const [tickets, setTickets] = useState([]);
  const [pastTickets, setPastTickets] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [activeTab, setActiveTab] = useState('upcoming');
  const [expandedEvents, setExpandedEvents] = useState({});
  const [cancellingTicket, setCancellingTicket] = useState(null);
  const [cancellationError, setCancellationError] = useState(null);
  const [cancellationSuccess, setCancellationSuccess] = useState(null);
  
  const { user } = useAuth();
  
  useEffect(() => {
    const fetchTickets = async () => {
      try {
        setLoading(true);
        setError(null);
        
        // Fetch upcoming and past tickets
        const upcomingResponse = await api.get('/tickets/upcoming');
        const pastResponse = await api.get('/tickets/past');
        
        setTickets(upcomingResponse.data.data || []);
        setPastTickets(pastResponse.data.data || []);
      } catch (err) {
        console.error('Error fetching tickets:', err);
        setError('Could not load your tickets. Please try again later.');
      } finally {
        setLoading(false);
      }
    };
    
    if (user) {
      fetchTickets();
    }
  }, [user]);
  
  // Toggle expanded state for event
  const toggleExpanded = (eventId) => {
    setExpandedEvents(prev => ({
      ...prev,
      [eventId]: !prev[eventId]
    }));
  };
  
  // Format date for display
  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      weekday: 'long',
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
  
  // Handle ticket cancellation request
  const handleCancelTicket = async (ticketId) => {
    try {
      setCancellingTicket(ticketId);
      setCancellationError(null);
      setCancellationSuccess(null);
      
      const response = await api.post(`/tickets/${ticketId}/refund`);
      console.log('Refund response:', response.data);
      
      setCancellationSuccess('Your ticket has been cancelled and a refund will be processed.');
      
      // Update the ticket status in the UI
      setTickets(prevTickets => 
        prevTickets.map(eventGroup => ({
          ...eventGroup,
          tickets: eventGroup.tickets.map(ticket => 
            ticket.id === ticketId 
              ? { ...ticket, status: 'cancelled' } 
              : ticket
          )
        }))
      );
    } catch (err) {
      console.error('Error cancelling ticket:', err);
      setCancellationError(err.response?.data?.error || 'Could not cancel the ticket. Please try again later.');
    } finally {
      setCancellingTicket(null);
    }
  };
  
  // Render the ticket list for an event
  const renderTicketList = (eventGroup, isPast = false) => {
    const isExpanded = expandedEvents[eventGroup.eventId] || false;
    
    return (
      <div 
        key={eventGroup.eventId} 
        className="bg-white rounded-lg shadow-md overflow-hidden mb-6"
      >
        {/* Event header */}
        <div className="p-4 border-b border-gray-200 flex justify-between items-center">
          <div className="flex items-start">
            <div className="w-16 h-16 bg-gray-200 rounded overflow-hidden mr-4 flex-shrink-0">
              {eventGroup.eventImage && (
                <img 
                  src={eventGroup.eventImage} 
                  alt={eventGroup.eventName} 
                  className="w-full h-full object-cover" 
                />
              )}
            </div>
            
            <div>
              <h3 className="text-lg font-bold">{eventGroup.eventName}</h3>
              <div className="text-sm text-gray-600">
                <div className="flex items-center mb-1">
                  <FaCalendarAlt className="mr-1" size={12} />
                  {formatDate(eventGroup.eventDate)}
                </div>
                <div className="flex items-center">
                  <FaClock className="mr-1" size={12} />
                  {formatTime(eventGroup.eventTime)}
                </div>
              </div>
            </div>
          </div>
          
          <button
            onClick={() => toggleExpanded(eventGroup.eventId)}
            className="text-purple-600 focus:outline-none"
          >
            {isExpanded ? <FaChevronUp /> : <FaChevronDown />}
          </button>
        </div>
        
        {/* Ticket details (expandable) */}
        {isExpanded && (
          <div className="p-4">
            <div className="flex items-center mb-4">
              <FaMapMarkerAlt className="text-gray-500 mr-2" />
              <span>{eventGroup.eventVenue}</span>
            </div>
            
            <h4 className="font-bold mb-3">Your Tickets</h4>
            
            <div className="space-y-4">
              {eventGroup.tickets.map(ticket => (
                <div 
                  key={ticket.id} 
                  className={`border rounded-lg p-4 ${
                    ticket.status === 'cancelled' 
                      ? 'bg-red-50 border-red-200' 
                      : ticket.checked_in
                      ? 'bg-green-50 border-green-200'
                      : 'border-gray-200'
                  }`}
                >
                  <div className="flex justify-between mb-3">
                    <div>
                      <span className="font-medium">{ticket.ticket_type_name}</span>
                      <div className="text-sm text-gray-600">${parseFloat(ticket.price).toFixed(2)}</div>
                    </div>
                    <div>
                      {ticket.status === 'cancelled' ? (
                        <span className="px-2 py-1 bg-red-100 text-red-800 text-xs font-medium rounded-full">
                          Cancelled
                        </span>
                      ) : ticket.checked_in ? (
                        <span className="px-2 py-1 bg-green-100 text-green-800 text-xs font-medium rounded-full">
                          Used
                        </span>
                      ) : isPast ? (
                        <span className="px-2 py-1 bg-gray-100 text-gray-800 text-xs font-medium rounded-full">
                          Expired
                        </span>
                      ) : (
                        <span className="px-2 py-1 bg-purple-100 text-purple-800 text-xs font-medium rounded-full">
                          Valid
                        </span>
                      )}
                    </div>
                  </div>
                  
                  {/* QR Code */}
                  {ticket.qr_code && ticket.status !== 'cancelled' && (
                    <div className="flex flex-col items-center my-4">
                      <img 
                        src={ticket.qr_code} 
                        alt="Ticket QR Code" 
                        className="max-w-xs h-auto" 
                      />
                      <div className="text-xs text-gray-500 mt-2">
                        Scan this QR code at the event for entry
                      </div>
                    </div>
                  )}
                  
                  {/* Cancelled notice */}
                  {ticket.status === 'cancelled' && (
                    <div className="bg-red-100 text-red-800 p-3 rounded-md flex items-start my-3">
                      <FaExclamationTriangle className="mr-2 mt-1 flex-shrink-0" />
                      <div>
                        <p className="font-medium">This ticket has been cancelled</p>
                        <p className="text-sm">The refund may take 5-7 business days to process.</p>
                      </div>
                    </div>
                  )}
                  
                  {/* Ticket actions */}
                  {ticket.status !== 'cancelled' && !ticket.checked_in && !isPast && (
                    <div className="mt-4 flex flex-wrap gap-2">
                      <button className="bg-purple-600 text-white px-3 py-1 rounded-md text-sm flex items-center">
                        <FaDownload className="mr-1" size={12} />
                        Download
                      </button>
                      <button className="bg-gray-600 text-white px-3 py-1 rounded-md text-sm flex items-center">
                        <FaPrint className="mr-1" size={12} />
                        Print
                      </button>
                      <button className="bg-blue-600 text-white px-3 py-1 rounded-md text-sm flex items-center">
                        <FaShare className="mr-1" size={12} />
                        Share
                      </button>
                      <button 
                        onClick={() => handleCancelTicket(ticket.id)}
                        disabled={cancellingTicket === ticket.id}
                        className={`bg-red-600 text-white px-3 py-1 rounded-md text-sm flex items-center ${
                          cancellingTicket === ticket.id ? 'opacity-70 cursor-not-allowed' : 'hover:bg-red-700'
                        }`}
                      >
                        {cancellingTicket === ticket.id ? (
                          <>
                            <FaSpinner className="mr-1 animate-spin" size={12} />
                            Cancelling...
                          </>
                        ) : (
                          <>
                            <FaTimes className="mr-1" size={12} />
                            Cancel
                          </>
                        )}
                      </button>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    );
  };
  
  if (loading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="flex justify-center items-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-purple-500"></div>
        </div>
      </div>
    );
  }
  
  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold mb-6">My Tickets</h1>
      
      {/* Cancellation messages */}
      {cancellationError && (
        <div className="bg-red-100 text-red-800 p-4 rounded-md mb-6">
          <div className="flex items-start">
            <FaTimesCircle className="mr-2 mt-1" />
            <div>
              <p className="font-medium">Error</p>
              <p>{cancellationError}</p>
            </div>
          </div>
        </div>
      )}
      
      {cancellationSuccess && (
        <div className="bg-green-100 text-green-800 p-4 rounded-md mb-6">
          <div className="flex items-start">
            <FaCheckCircle className="mr-2 mt-1" />
            <div>
              <p className="font-medium">Success</p>
              <p>{cancellationSuccess}</p>
            </div>
          </div>
        </div>
      )}
      
      {/* Tabs */}
      <div className="flex border-b border-gray-300 mb-6">
        <button
          className={`py-2 px-4 font-medium ${
            activeTab === 'upcoming' 
              ? 'text-purple-600 border-b-2 border-purple-600' 
              : 'text-gray-600 hover:text-gray-900'
          }`}
          onClick={() => setActiveTab('upcoming')}
        >
          Upcoming
        </button>
        <button
          className={`py-2 px-4 font-medium ${
            activeTab === 'past' 
              ? 'text-purple-600 border-b-2 border-purple-600' 
              : 'text-gray-600 hover:text-gray-900'
          }`}
          onClick={() => setActiveTab('past')}
        >
          Past
        </button>
      </div>
      
      {/* Error message */}
      {error && (
        <div className="bg-red-100 text-red-800 p-4 rounded-md mb-6">
          <p>{error}</p>
        </div>
      )}
      
      {/* No tickets message */}
      {!error && activeTab === 'upcoming' && tickets.length === 0 && (
        <div className="text-center py-12 bg-white rounded-lg shadow-md">
          <FaTicketAlt className="mx-auto text-gray-300 mb-4" size={48} />
          <h3 className="text-xl font-semibold text-gray-700 mb-2">No upcoming tickets</h3>
          <p className="text-gray-500 mb-6">You don't have any upcoming event tickets.</p>
          <Link to="/events" className="bg-purple-600 text-white px-6 py-2 rounded-md hover:bg-purple-700">
            Browse Events
          </Link>
        </div>
      )}
      
      {!error && activeTab === 'past' && pastTickets.length === 0 && (
        <div className="text-center py-12 bg-white rounded-lg shadow-md">
          <FaTicketAlt className="mx-auto text-gray-300 mb-4" size={48} />
          <h3 className="text-xl font-semibold text-gray-700 mb-2">No past tickets</h3>
          <p className="text-gray-500">You don't have any past event tickets.</p>
        </div>
      )}
      
      {/* Ticket list */}
      <div>
        {activeTab === 'upcoming' && tickets.map(eventGroup => renderTicketList(eventGroup))}
        {activeTab === 'past' && pastTickets.map(eventGroup => renderTicketList(eventGroup, true))}
      </div>
    </div>
  );
};

export default UserTickets;