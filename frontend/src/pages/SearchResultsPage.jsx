// src/pages/SearchResultsPage.jsx
import { useState, useEffect } from 'react';
import { useLocation, Link } from 'react-router-dom';
import { FaCalendar, FaMapMarkerAlt, FaClock, FaTicketAlt, FaChevronLeft, FaChevronDown } from 'react-icons/fa';
import searchService from '../services/searchService';
import SearchFilter from '../components/search/SearchFilter';

export default function SearchResultsPage() {
  const [events, setEvents] = useState([]);
  const [allEvents, setAllEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [error, setError] = useState(null);
  const [searchParams, setSearchParams] = useState({});
  const [page, setPage] = useState(1);
  const [totalEvents, setTotalEvents] = useState(0);
  const [loadedEvents, setLoadedEvents] = useState(0);
  const eventsPerPage = 20;
  
  const location = useLocation();

  useEffect(() => {
    const fetchSearchResults = async () => {
      try {
        setLoading(true);
        setError(null);
        setPage(1); // Reset to page 1 on new search
        
        // Get search parameters from URL
        const urlParams = new URLSearchParams(location.search);
        const query = {
          q: urlParams.get('q') || '',
          location: urlParams.get('location') || '',
          lat: urlParams.get('lat') || null,
          lng: urlParams.get('lng') || null,
          category: urlParams.get('category') || '',
          subcategory: urlParams.get('subcategory') || '',
          // Add support for date range
          startDate: urlParams.get('startDate') || '',
          endDate: urlParams.get('endDate') || '',
          date: urlParams.get('date') || '' // Keep for backward compatibility
        };
        
        setSearchParams(query);
        
        // Call search API
        const response = await searchService.searchEvents(query);
        
        // Store all events for pagination
        const receivedEvents = response.events || [];
        setAllEvents(receivedEvents);
        setTotalEvents(receivedEvents.length);
        
        // Display only first page of events
        setEvents(receivedEvents.slice(0, eventsPerPage));
        setLoadedEvents(Math.min(eventsPerPage, receivedEvents.length));
      } catch (error) {
        console.error('Error fetching search results:', error);
        setError('Failed to fetch search results. Please try again.');
      } finally {
        setLoading(false);
      }
    };

    fetchSearchResults();
  }, [location.search]);
  
  // Handle loading more events
  const loadMoreEvents = () => {
    setLoadingMore(true);
    
    // Calculate next page
    const nextPage = page + 1;
    const startIndex = page * eventsPerPage;
    const endIndex = nextPage * eventsPerPage;
    
    // Get the next batch of events
    setTimeout(() => {
      const newEvents = [...events, ...allEvents.slice(startIndex, endIndex)];
      setEvents(newEvents);
      setPage(nextPage);
      setLoadedEvents(Math.min(nextPage * eventsPerPage, totalEvents));
      setLoadingMore(false);
    }, 500); // Add a slight delay for better UX
  };

  // Format date for display
  const formatDate = (dateString) => {
    const options = { weekday: 'short', month: 'short', day: 'numeric' };
    return new Date(dateString).toLocaleDateString('en-US', options);
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

  // Format date range for display
  const formatDateRange = () => {
    if (searchParams.startDate && searchParams.endDate) {
      return `${formatDate(searchParams.startDate)} - ${formatDate(searchParams.endDate)}`;
    }
    return searchParams.date || '';
  };

  return (
    <div className="bg-gray-100 min-h-screen">
      {/* Use the existing search filter at the top */}
      <SearchFilter initialParams={searchParams} />
      
      <div className="max-w-6xl mx-auto px-4 py-8">
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-3xl font-bold text-gray-800">
            {totalEvents > 0 
              ? `${totalEvents} Events Found`
              : loading 
                ? 'Searching Events...' 
                : 'No Events Found'}
          </h1>
          
          <Link to="/" className="flex items-center text-purple-600 hover:text-purple-800">
            <FaChevronLeft className="mr-1" />
            Back to Home
          </Link>
        </div>
        
        {/* Search parameters summary */}
        <div className="bg-white rounded-lg p-4 mb-6 shadow">
          <h2 className="text-gray-600 text-lg mb-2">Search Parameters:</h2>
          <div className="flex flex-wrap gap-3">
            {searchParams.q && (
              <div className="bg-purple-100 text-purple-800 px-3 py-1 rounded-full text-sm">
                Search: {searchParams.q}
              </div>
            )}
            {searchParams.location && (
              <div className="bg-purple-100 text-purple-800 px-3 py-1 rounded-full text-sm">
                Location: {searchParams.location}
              </div>
            )}
            {(searchParams.startDate || searchParams.date) && (
              <div className="bg-purple-100 text-purple-800 px-3 py-1 rounded-full text-sm">
                Date: {formatDateRange()}
              </div>
            )}
            {searchParams.category && (
              <div className="bg-purple-100 text-purple-800 px-3 py-1 rounded-full text-sm">
                Category: {searchParams.category.replace(/-/g, ' ')}
              </div>
            )}
            {searchParams.subcategory && (
              <div className="bg-purple-100 text-purple-800 px-3 py-1 rounded-full text-sm">
                Subcategory: {searchParams.subcategory.replace(/-/g, ' ')}
              </div>
            )}
          </div>
        </div>
        
        {/* Loading state */}
        {loading && (
          <div className="flex justify-center items-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-purple-500"></div>
          </div>
        )}
        
        {/* Error state */}
        {error && (
          <div className="bg-red-100 text-red-700 p-4 rounded-lg mb-6">
            <p>{error}</p>
          </div>
        )}
        
        {/* Events list */}
        {!loading && !error && (
          <div className="space-y-4">
            {events.length > 0 ? (
              events.map(event => (
                <Link 
                  to={`/events/${event.id}`} 
                  key={event.id}
                  className="block bg-white rounded-lg overflow-hidden shadow-md hover:shadow-lg transition-shadow"
                  onClick={() => searchService.addToRecentlyViewed(event)}
                >
                  <div className="flex flex-col md:flex-row">
                    <div className="md:w-64 h-48 md:h-auto bg-gray-300 relative">
                      {event.image_url ? (
                        <img 
                          src={event.image_url} 
                          alt={event.name} 
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center bg-purple-600 text-white">
                          <FaTicketAlt size={40} />
                        </div>
                      )}
                      {event.distance && (
                        <div className="absolute top-2 right-2 bg-white px-2 py-1 rounded-full text-xs font-semibold">
                          {event.distance} km away
                        </div>
                      )}
                    </div>
                    
                    <div className="p-4 flex-grow">
                      <div className="text-xs font-medium text-purple-600 mb-1">
                        {event.category?.name || event.category}
                        {event.subcategory && ` • ${event.subcategory.name}`}
                      </div>
                      <h3 className="text-xl font-bold text-gray-800 mb-2">{event.name}</h3>
                      
                      <div className="flex items-center text-gray-600 text-sm mb-1">
                        <FaCalendar className="mr-2 text-gray-400" />
                        {formatDate(event.date)}
                        {event.time && (
                          <>
                            <span className="mx-1">•</span>
                            <FaClock className="mr-1 text-gray-400" /> 
                            {formatTime(event.time)}
                          </>
                        )}
                      </div>
                      
                      <div className="flex items-center text-gray-600 text-sm mb-3">
                        <FaMapMarkerAlt className="mr-2 text-gray-400" />
                        <span>
                          {event.venue}, {event.city}
                        </span>
                      </div>
                      
                      <div className="text-gray-800 font-semibold">
                        {event.min_price 
                          ? `From $${event.min_price}`
                          : 'Prices to be announced'
                        }
                      </div>
                    </div>
                    
                    <div className="p-4 md:w-40 flex md:flex-col items-center justify-center border-t md:border-t-0 md:border-l border-gray-200">
                      <span className="bg-purple-600 text-white px-4 py-2 rounded font-medium">Find Tickets</span>
                    </div>
                  </div>
                </Link>
              ))
            ) : (
              <div className="text-center py-12 bg-white rounded-lg shadow">
                <FaTicketAlt size={48} className="mx-auto text-gray-300 mb-4" />
                <h3 className="text-xl font-semibold text-gray-700 mb-2">No events found</h3>
                <p className="text-gray-500 mb-4">Try adjusting your search criteria</p>
                <Link to="/" className="text-purple-600 hover:text-purple-800 font-medium">
                  Return to Homepage
                </Link>
              </div>
            )}
          </div>
        )}
        
        {/* Load More Button - Updated to match design in image */}
        {!loading && !error && events.length > 0 && loadedEvents < totalEvents && (
          <div className="text-center mt-8">
            <div className="bg-gray-100 rounded-full py-4 px-6 inline-block text-center">
              <div className="text-gray-500 text-sm mb-2">
                Loaded {loadedEvents} out of {totalEvents} events
              </div>
              <div className="w-64 bg-gray-300 h-1 rounded-full mx-auto mb-3">
                <div 
                  className="bg-gray-600 h-1 rounded-full" 
                  style={{ width: `${(loadedEvents / totalEvents) * 100}%` }}
                ></div>
              </div>
              
              <button
                onClick={loadMoreEvents}
                disabled={loadingMore}
                className="border border-gray-800 text-gray-800 font-medium rounded-full px-6 py-2 inline-flex items-center hover:bg-gray-50"
              >
                {loadingMore ? (
                  <span className="flex items-center">
                    <div className="animate-spin h-4 w-4 border-t-2 border-gray-800 border-r-2 rounded-full mr-2"></div>
                    Loading...
                  </span>
                ) : (
                  <>
                    More Events <FaChevronDown className="ml-2 h-3 w-3" />
                  </>
                )}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}