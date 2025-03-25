// src/pages/CategoryEvents.jsx
import { useState, useEffect } from 'react';
import { useParams, Link, useLocation, useNavigate } from 'react-router-dom';
import { FaMapMarkerAlt, FaCalendarAlt, FaTicketAlt, FaChevronLeft, FaChevronRight } from 'react-icons/fa';
import api from '../services/api';
import CategoryHeader from '../components/layout/CategoryHeader';

export default function CategoryEvents() {
  const { slug } = useParams();
  const location = useLocation();
  const navigate = useNavigate();
  const [category, setCategory] = useState(null);
  const [events, setEvents] = useState([]);
  const [popularEvents, setPopularEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [totalPages, setTotalPages] = useState(1);
  const [currentPage, setCurrentPage] = useState(1);
  
  // Get page from URL query params
  useEffect(() => {
    const searchParams = new URLSearchParams(location.search);
    const page = parseInt(searchParams.get('page')) || 1;
    setCurrentPage(page);
  }, [location.search]);

  // Fetch category details, featured events, and paginated events
  useEffect(() => {
    const fetchCategoryEvents = async () => {
      setLoading(true);
      try {
        // Category details
        const categoryResponse = await api.get(`/categories/${slug}`);
        setCategory(categoryResponse.data.category);
        
        // Featured events (first 2)
        const popularResponse = await api.get(`/categories/${slug}/events/featured`);
        setPopularEvents(popularResponse.data.events);
        
        // Paginated events
        const eventsResponse = await api.get(`/categories/${slug}/events?page=${currentPage}&limit=20`);
        setEvents(eventsResponse.data.events);
        setTotalPages(eventsResponse.data.totalPages || 1);
      } catch (err) {
        console.error('Error fetching category events:', err);
        setError('Could not load events. Please try again later.');
      } finally {
        setLoading(false);
      }
    };

    fetchCategoryEvents();
  }, [slug, currentPage]);

  const handlePageChange = (newPage) => {
    if (newPage >= 1 && newPage <= totalPages) {
      navigate(`/events/category/${slug}?page=${newPage}`);
    }
  };

  if (loading) {
    return (
      <div>
        <div className="h-80 bg-gray-800 animate-pulse"></div>
        <div className="h-16 bg-white animate-pulse border-b border-gray-200"></div>
        <div className="container mx-auto px-4 py-8">
          <div className="animate-pulse">
            <div className="h-8 bg-gray-300 rounded w-1/4 mb-6"></div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {[1, 2].map((item) => (
                <div key={item} className="bg-gray-300 h-64 rounded-lg"></div>
              ))}
            </div>
            <div className="h-8 bg-gray-300 rounded w-1/4 my-6"></div>
            <div className="space-y-4">
              {[1, 2, 3, 4, 5].map((item) => (
                <div key={item} className="bg-gray-300 h-24 rounded-lg"></div>
              ))}
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="bg-red-100 border-l-4 border-red-500 text-red-700 p-4" role="alert">
          <p>{error}</p>
        </div>
      </div>
    );
  }

  if (!category) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="text-center">
          <h1 className="text-3xl font-bold mb-4">Category not found</h1>
          <p className="text-gray-600 mb-6">The category you're looking for doesn't exist or has been removed.</p>
          <Link to="/" className="bg-purple-600 text-white px-6 py-3 rounded-md hover:bg-purple-700">
            Back to homepage
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div>
      {/* Category Header */}
      <CategoryHeader categoryData={category} />
  
      <div className="container mx-auto px-4 py-8">
        {/* Popular Events */}
        {popularEvents.length > 0 && (
          <div className="mb-12">
            <h2 className="text-2xl font-bold mb-6 uppercase">POPULAR {category.name}</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {popularEvents.map((event) => (
                <div 
                  key={event.id} 
                  className="bg-white rounded overflow-hidden shadow-md hover:shadow-lg transition-shadow"
                >
                  <Link to={`/events/${event.id}`} className="block relative">
                    <div className="flex h-48 md:h-64">
                      {/* Image */}
                      <div className="w-1/2 overflow-hidden">
                        <img
                          src={event.image_url || 'https://placehold.co/600x400/purple/white?text=Event+Image'}
                          alt={event.name}
                          className="w-full h-full object-cover transition-transform duration-300 hover:scale-105"
                        />
                      </div>
                      {/* Info */}
                      <div className="w-1/2 p-4 flex flex-col justify-between bg-gray-50">
                        <div>
                          <h3 className="text-xl font-bold text-gray-800 mb-2">{event.name}</h3>
                          <div className="text-sm text-gray-600 mb-2">
                            <div className="flex items-center mb-1">
                              <FaCalendarAlt className="mr-1" size={14} />
                              <span>{new Date(event.date).toLocaleDateString()}</span>
                            </div>
                            <div className="flex items-center">
                              <FaMapMarkerAlt className="mr-1" size={14} />
                              <span>{event.venue}, {event.city}</span>
                            </div>
                          </div>
                        </div>
                        <div className="mt-auto">
                          <span className="block text-xl font-bold text-purple-600">
                            From {event.min_price} RON
                          </span>
                          <div className="mt-2 bg-purple-600 hover:bg-purple-700 text-white text-center py-2 px-4 rounded">
                            Find Tickets
                          </div>
                        </div>
                      </div>
                    </div>
                  </Link>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* All Events */}
        <div>
          <h2 className="text-2xl font-bold mb-6">ALL {category.name.toUpperCase()}</h2>
          
          {events.length === 0 ? (
            <div className="text-center py-12">
              <h2 className="text-xl font-semibold mb-2">No events available in this category</h2>
              <p className="text-gray-500">Check back later for updates or try another category.</p>
            </div>
          ) : (
            <div className="space-y-4">
              {events.map((event) => (
                <div 
                  key={event.id} 
                  className="bg-white border border-gray-200 rounded-md overflow-hidden hover:shadow-md transition-shadow"
                >
                  <Link to={`/events/${event.id}`} className="flex flex-col md:flex-row">
                    <div className="p-4 flex items-center">
                      {/* Date Box */}
                      <div className="mr-4 w-16 h-16 bg-gray-100 rounded flex flex-col items-center justify-center text-center">
                        <div className="text-sm font-semibold uppercase text-gray-700">
                          {new Date(event.date).toLocaleString('default', { month: 'short' })}
                        </div>
                        <div className="text-xl font-bold">
                          {new Date(event.date).getDate()}
                        </div>
                      </div>
                      {/* Event Details */}
                      <div className="flex-grow">
                        <h3 className="text-lg font-semibold text-gray-800">{event.name}</h3>
                        <div className="flex items-center text-gray-600 text-sm">
                          <FaMapMarkerAlt className="mr-1" size={12} />
                          <span>{event.venue}, {event.city}</span>
                        </div>
                        <div className="flex items-center text-gray-600 text-sm mt-1">
                          <FaCalendarAlt className="mr-1" size={12} />
                          <span>{new Date(event.date).toLocaleTimeString([], { hour: '2-digit', minute:'2-digit' })}</span>
                        </div>
                      </div>
                    </div>
                    
                    {/* Find Tickets */}
                    <div className="bg-gray-50 p-4 flex items-center justify-center md:ml-auto md:w-48">
                      <div className="text-purple-600 hover:text-purple-800 font-bold flex items-center">
                        Find Tickets <FaChevronRight className="ml-1" />
                      </div>
                    </div>
                  </Link>
                </div>
              ))}
            </div>
          )}
          
          {/* Pagination */}
          {totalPages > 1 && (
            <div className="mt-8 flex justify-center">
              <div className="flex items-center space-x-1">
                <button 
                  onClick={() => handlePageChange(currentPage - 1)}
                  disabled={currentPage === 1}
                  className={`px-4 py-2 rounded ${
                    currentPage === 1 
                      ? 'bg-gray-200 text-gray-500 cursor-not-allowed' 
                      : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                  }`}
                >
                  <FaChevronLeft />
                </button>
                
                {[...Array(totalPages)].map((_, i) => (
                  <button
                    key={i + 1}
                    onClick={() => handlePageChange(i + 1)}
                    className={`px-4 py-2 rounded ${
                      currentPage === i + 1 
                        ? 'bg-purple-600 text-white' 
                        : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                    }`}
                  >
                    {i + 1}
                  </button>
                ))}
                
                <button 
                  onClick={() => handlePageChange(currentPage + 1)}
                  disabled={currentPage === totalPages}
                  className={`px-4 py-2 rounded ${
                    currentPage === totalPages 
                      ? 'bg-gray-200 text-gray-500 cursor-not-allowed' 
                      : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                  }`}
                >
                  <FaChevronRight />
                </button>
              </div>
            </div>
          )}
          
          {/* Loaded events counter */}
          <div className="mt-4 text-center text-gray-500 text-sm">
            Loaded {events.length} out of {events.length} events
          </div>
        </div>
      </div>
    </div>
  );
}
