// src/components/event/EventListing.jsx
import { useState, useEffect } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { FaMapMarkerAlt, FaCalendarAlt, FaChevronLeft, FaChevronRight, FaExternalLinkAlt } from 'react-icons/fa';
import api from '../../services/api';

const EventListing = ({ categorySlug, subcategorySlug, isCompact = false }) => {
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [totalEvents, setTotalEvents] = useState(0);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  
  const location = useLocation();
  const navigate = useNavigate();
  const eventsPerPage = 20;
  
  useEffect(() => {
    // Parse query parameters
    const queryParams = new URLSearchParams(location.search);
    const page = parseInt(queryParams.get('page') || '1');
    setCurrentPage(page);
    
    const fetchEvents = async () => {
      setLoading(true);
      try {
        let endpoint = '/events';
        
        // Determine endpoint based on category/subcategory
        if (subcategorySlug && categorySlug) {
          endpoint = `/categories/${categorySlug}/${subcategorySlug}`;
        } else if (categorySlug) {
          endpoint = `/categories/${categorySlug}`;
        }
        
        // Add pagination parameters
        const paginationParams = `?page=${page}&limit=${eventsPerPage}`;
        
        const response = await api.get(`${endpoint}${paginationParams}`);
        
        // Extract events data from API response
        const eventData = response.data.events || [];
        setEvents(eventData);
        
        // Extract total count from API response
        // In a real app, the API should return the total count
        setTotalEvents(response.data.total || eventData.length);
        
        // Calculate total pages based on total count from API
        setTotalPages(Math.ceil((response.data.total || eventData.length) / eventsPerPage));
      } catch (err) {
        console.error('Error fetching events:', err);
        setError('Could not load events. Please try again later.');
      } finally {
        setLoading(false);
      }
    };
    
    fetchEvents();
  }, [categorySlug, subcategorySlug, location.search, eventsPerPage]);
  
  const handlePageChange = (page) => {
    // Don't navigate if invalid page
    if (page < 1 || page > totalPages) return;
    
    // Update URL with new page parameter
    const queryParams = new URLSearchParams(location.search);
    queryParams.set('page', page);
    navigate(`${location.pathname}?${queryParams.toString()}`);
    
    // Scroll to top
    window.scrollTo(0, 0);
  };
  
  if (loading) {
    return (
      <div className="container mx-auto px-4 py-6">
        <div className="animate-pulse space-y-6">
          {[1, 2, 3, 4, 5].map((i) => (
            <div key={i} className="bg-white rounded shadow p-4 flex flex-col md:flex-row gap-4">
              <div className="bg-gray-300 h-24 w-full md:w-24 rounded"></div>
              <div className="flex-1">
                <div className="h-5 bg-gray-300 rounded w-3/4 mb-2"></div>
                <div className="h-4 bg-gray-300 rounded w-1/2 mb-2"></div>
                <div className="h-4 bg-gray-300 rounded w-1/3"></div>
              </div>
              <div className="h-10 bg-gray-300 rounded w-32 self-center"></div>
            </div>
          ))}
        </div>
      </div>
    );
  }
  
  if (error) {
    return (
      <div className="container mx-auto px-4 py-6">
        <div className="bg-red-100 border-l-4 border-red-500 text-red-700 p-4" role="alert">
          <p>{error}</p>
        </div>
      </div>
    );
  }
  
  if (events.length === 0) {
    return (
      <div className="container mx-auto px-4 py-6">
        <div className="text-center py-12 bg-white rounded shadow">
          <h3 className="text-lg font-medium mb-2">No events found</h3>
          <p className="text-gray-600">Try adjusting your search or filter criteria.</p>
        </div>
      </div>
    );
  }
  
  // For compact mode (popular events section)
  if (isCompact) {
    return (
      <div className="container mx-auto px-4 py-6">
        <h2 className="text-2xl font-bold mb-6 flex items-center">
          <div className="w-6 h-1 bg-gray-800 mr-3"></div>
          POPULAR CONCERTS
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {events.slice(0, 4).map((event) => (
            <div key={event.id} className="bg-white rounded shadow overflow-hidden group">
              <div className="relative h-40 overflow-hidden">
                <img
                  src={event.image_url || 'https://placehold.co/600x400/purple/white?text=Event+Image'}
                  alt={event.name}
                  className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
                />
              </div>
              <div className="p-4">
                <h3 className="font-bold text-gray-800 mb-1">{event.name}</h3>
                <div className="text-sm text-gray-600 mb-1 flex items-center">
                  <FaCalendarAlt className="mr-1" size={12} />
                  <span>{new Date(event.date).toLocaleDateString()}</span>
                </div>
                <div className="text-sm text-gray-600 mb-2 flex items-center">
                  <FaMapMarkerAlt className="mr-1" size={12} />
                  <span>{event.venue}, {event.city}</span>
                </div>
                <Link
                  to={`/events/${event.id}`}
                  className="text-blue-600 hover:underline text-sm font-medium flex items-center justify-end"
                >
                  Find Tickets <FaExternalLinkAlt className="ml-1" size={12} />
                </Link>
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }
  
  // Full listing view
  return (
    <div className="container mx-auto px-4 py-6">
      <h2 className="text-2xl font-bold mb-6 flex items-center">
        <div className="w-6 h-1 bg-gray-800 mr-3"></div>
        {categorySlug ? categorySlug.charAt(0).toUpperCase() + categorySlug.slice(1) : ''} CONCERTS
      </h2>
      
      <div className="text-sm text-gray-500 mb-4">
        Loaded {Math.min(currentPage * eventsPerPage, totalEvents) - ((currentPage - 1) * eventsPerPage)} out of {totalEvents} events
      </div>
      
      {/* Event list in Ticketmaster style */}
      <div className="space-y-1 mb-8">
        {events.map((event) => (
          <div key={event.id} className="bg-white border-b py-4">
            <div className="flex flex-col md:flex-row">
              {/* Left: Date */}
              <div className="md:w-20 text-center mb-2 md:mb-0">
                <div className="uppercase font-bold text-gray-600 text-sm">
                  {new Date(event.date).toLocaleDateString('en-US', { month: 'short' })}
                </div>
                <div className="text-2xl font-bold">
                  {new Date(event.date).getDate()}
                </div>
              </div>
              
              {/* Middle: Event details */}
              <div className="flex-1 md:pl-4">
                <h3 className="font-bold text-lg">{event.name}</h3>
                <div className="text-sm">
                  <span className="inline-block mr-2">
                    {new Date(event.date).toLocaleDateString()} • {event.time}
                  </span>
                  {event.end_time && <>- {event.end_time}</>}
                </div>
                <div className="text-sm text-gray-600">
                  {event.venue}, {event.city}
                </div>
                {event.description && (
                  <div className="text-sm text-gray-500 mt-1 line-clamp-1">
                    {event.description}
                  </div>
                )}
              </div>
              
              {/* Right: CTA */}
              <div className="md:w-32 flex items-center justify-end mt-2 md:mt-0">
                <Link
                  to={`/events/${event.id}`}
                  className="text-blue-600 hover:underline font-medium flex items-center"
                >
                  Find Tickets <FaExternalLinkAlt className="ml-1" size={12} />
                </Link>
              </div>
            </div>
          </div>
        ))}
      </div>
      
      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex justify-center my-8">
          <button
            onClick={() => handlePageChange(currentPage - 1)}
            disabled={currentPage === 1}
            className={`px-3 py-2 rounded-md ${
              currentPage === 1
                ? 'text-gray-400 cursor-not-allowed'
                : 'text-gray-700 hover:bg-gray-100'
            }`}
          >
            <FaChevronLeft size={14} />
          </button>
          
          {currentPage > 3 && (
            <>
              <button
                onClick={() => handlePageChange(1)}
                className="px-3 py-1 rounded-md text-gray-700 hover:bg-gray-100"
              >
                1
              </button>
              {currentPage > 4 && (
                <span className="px-1 py-1 text-gray-500">...</span>
              )}
            </>
          )}
          
          {Array.from({ length: totalPages }, (_, i) => i + 1)
            .filter(pageNum => 
              pageNum === 1 || 
              pageNum === totalPages || 
              (pageNum >= currentPage - 2 && pageNum <= currentPage + 2)
            )
            .map(pageNum => (
              <button
                key={pageNum}
                onClick={() => handlePageChange(pageNum)}
                className={`px-3 py-1 rounded-md ${
                  currentPage === pageNum
                    ? 'bg-blue-600 text-white'
                    : 'text-gray-700 hover:bg-gray-100'
                }`}
              >
                {pageNum}
              </button>
            ))}
          
          {currentPage < totalPages - 2 && (
            <>
              {currentPage < totalPages - 3 && (
                <span className="px-1 py-1 text-gray-500">...</span>
              )}
              <button
                onClick={() => handlePageChange(totalPages)}
                className="px-3 py-1 rounded-md text-gray-700 hover:bg-gray-100"
              >
                {totalPages}
              </button>
            </>
          )}
          
          <button
            onClick={() => handlePageChange(currentPage + 1)}
            disabled={currentPage === totalPages}
            className={`px-3 py-2 rounded-md ${
              currentPage === totalPages
                ? 'text-gray-400 cursor-not-allowed'
                : 'text-gray-700 hover:bg-gray-100'
            }`}
          >
            <FaChevronRight size={14} />
          </button>
        </div>
      )}
      
      <div className="text-center">
        <button
          onClick={() => handlePageChange(currentPage + 1)}
          disabled={currentPage === totalPages}
          className="border border-gray-300 rounded-full px-6 py-2 text-sm font-medium hover:bg-gray-50"
        >
          More Events
        </button>
      </div>
    </div>
  );
};

export default EventListing;