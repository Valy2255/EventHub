import { useState, useEffect, useMemo, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { 
  FaMapMarkerAlt, 
  FaCalendarAlt, 
  FaTicketAlt, 
  FaChevronRight, 
  FaChevronLeft, 
  FaMusic, 
  FaTheaterMasks, 
  FaRunning, 
  FaGlassCheers, 
  FaStar,
  FaRegClock,
  FaSpinner
} from 'react-icons/fa';
import axios from 'axios';
import NewsletterSection from '../components/newsletter/NewsletterSection';

// API base URL
const API_BASE_URL = 'http://localhost:5000/api';

// Custom hook for fetching data
const useFetch = (url) => {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        const response = await axios.get(url);
        setData(response.data);
        setLoading(false);
      } catch (err) {
        console.error(`Error fetching data from ${url}:`, err);
        setError(err);
        setLoading(false);
      }
    };

    fetchData();
  }, [url]);

  return { data, loading, error };
};

// Helper function to get category icon
const getCategoryIcon = (categoryName) => {
  const iconMap = {
    'Concerts': <FaMusic className="text-4xl mb-2" />,
    'Theater': <FaTheaterMasks className="text-4xl mb-2" />,
    'Sports': <FaRunning className="text-4xl mb-2" />,
    'Festivals': <FaGlassCheers className="text-4xl mb-2" />,
  };
  
  return iconMap[categoryName] || <FaTicketAlt className="text-4xl mb-2" />;
};

// Helper function to get category color
const getCategoryColor = (categoryName) => {
  const colorMap = {
    'Concerts': 'bg-purple-600',
    'Theater': 'bg-indigo-600',
    'Sports': 'bg-blue-600',
    'Festivals': 'bg-pink-600',
  };
  
  return colorMap[categoryName] || 'bg-gray-600';
};

const Home = () => {
  const [currentSlide, setCurrentSlide] = useState(0);
  const [categoryFilter, setCategoryFilter] = useState('All');
  const [featuredEvents, setFeaturedEvents] = useState([]);
  const [featuredLoading, setFeaturedLoading] = useState(true);
  const [upcomingEvents, setUpcomingEvents] = useState([]);
  const [upcomingLoading, setUpcomingLoading] = useState(true);
  const [totalEvents, setTotalEvents] = useState(0);
  const [totalEventsLoading, setTotalEventsLoading] = useState(true);
  
  // Fetch categories
  const { 
    data: categoriesResponse, 
    loading: categoriesLoading, 
    error: categoriesError 
  } = useFetch(`${API_BASE_URL}/categories`);
  
  // Extract categories array from the response
  const categories = useMemo(() => {
    return categoriesResponse?.categories || [];
  }, [categoriesResponse]);

  // Fetch total events count - updated to use our new endpoints
  useEffect(() => {
    const fetchTotalEventsCount = async () => {
      try {
        setTotalEventsLoading(true);
        
        // Use the statistics endpoint to get the total events count
        const statsResponse = await axios.get(`${API_BASE_URL}/statistics/events`);
        if (statsResponse.data && statsResponse.data.totalEvents !== undefined) {
          setTotalEvents(statsResponse.data.totalEvents);
        } else {
          // Fallback: Calculate from category event_count properties if available
          if (categories && categories.length > 0) {
            const eventsFromCategories = categories.reduce((sum, category) => {
              return sum + (parseInt(category.event_count) || 0);
            }, 0);
            
            setTotalEvents(eventsFromCategories);
          } else {
            setTotalEvents(0);
          }
        }
      } catch (error) {
        console.error('Error fetching total events count:', error);
        
        // Error fallback: Try to calculate from categories if available
        if (categories && categories.length > 0) {
          const eventsFromCategories = categories.reduce((sum, category) => {
            return sum + (parseInt(category.event_count) || 0);
          }, 0);
          
          setTotalEvents(eventsFromCategories);
        }
      } finally {
        setTotalEventsLoading(false);
      }
    };
    
    if (categoriesResponse || (categories && categories.length > 0)) {
      fetchTotalEventsCount();
    }
  }, [categoriesResponse, categories]);
  
  // Fetch featured events from all categories
  useEffect(() => {
    const fetchFeaturedEvents = async () => {
      try {
        setFeaturedLoading(true);
        
        if (categories && categories.length > 0) {
          const featuredPromises = categories.map(category => 
            axios.get(`${API_BASE_URL}/categories/${category.slug}/events/featured`)
          );
          
          const results = await Promise.all(featuredPromises);
          
          // Combine featured events from all categories and take the top ones
          const allFeatured = results
            .flatMap(result => result.data.events || [])
            .sort((a, b) => b.rating - a.rating)
            .slice(0, 5); // Limit to top 5 featured events
          
          setFeaturedEvents(allFeatured);
        }
        
        setFeaturedLoading(false);
      } catch (error) {
        console.error('Error fetching featured events:', error);
        setFeaturedLoading(false);
      }
    };
    
    if (categories && categories.length > 0) {
      fetchFeaturedEvents();
    }
  }, [categories]);
  
  // Fetch upcoming events from selected category or all categories
useEffect(() => {
  const fetchUpcomingEvents = async () => {
    try {
      setUpcomingLoading(true);
      
      if (categoryFilter === 'All') {
        // Use the new dedicated API endpoint for upcoming events
        const response = await axios.get(`${API_BASE_URL}/categories/events/upcoming`, {
          params: { 
            limit: 6
          }
        });
        
        setUpcomingEvents(response.data.events || []);
      } else {
        // Get events for the selected category
        const category = categories.find(c => c.name === categoryFilter);
        
        if (category) {
          const response = await axios.get(`${API_BASE_URL}/categories/${category.slug}/events`, {
            params: { 
              limit: 6,
              page: 1
            }
          });
          
          setUpcomingEvents(response.data.events || []);
        }
      }
      
      setUpcomingLoading(false);
    } catch (error) {
      console.error('Error fetching upcoming events:', error);
      setUpcomingLoading(false);
    }
  };
  
  if (categories && categories.length > 0) {
    fetchUpcomingEvents();
  }
}, [categories, categoryFilter]);

  // Format date range (single date or start-end)
  const formatDateRange = (startDate, endDate) => {
    if (!startDate) return '';
    
    const options = { day: 'numeric', month: 'short' };
    const start = new Date(startDate).toLocaleDateString('en-US', options);
    
    if (!endDate) return start;
    
    const end = new Date(endDate).toLocaleDateString('en-US', options);
    return `${start} - ${end}`;
  };

  // Slide navigation for featured events
  const nextSlide = useCallback(() => {
    setCurrentSlide((prev) => (prev === featuredEvents.length - 1 ? 0 : prev + 1));
  }, [featuredEvents.length]);

  const prevSlide = useCallback(() => {
    setCurrentSlide((prev) => (prev === 0 ? featuredEvents.length - 1 : prev - 1));
  }, [featuredEvents.length]);

  // Auto-advance slides every 5 seconds - Fixed dependency array
  useEffect(() => {
    if (!featuredEvents || featuredEvents.length <= 1) return;
    
    const interval = setInterval(() => {
      nextSlide();
    }, 5000);
    
    return () => clearInterval(interval);
  }, [nextSlide, featuredEvents]);

  if (categoriesError) {
    return (
      <div className="container mx-auto px-4 py-12 text-center">
        <h2 className="text-2xl font-bold text-red-600">Error loading data</h2>
        <p className="mt-4">Please try again later or contact support.</p>
      </div>
    );
  }

  return (
    <div className="bg-gray-50 min-h-screen">
      <div className="container mx-auto px-4 py-12">
        {/* Featured Events Carousel */}
        <section className="mb-20">
          <div className="flex justify-between items-center mb-8">
            <h2 className="text-3xl font-bold text-gray-800">
              Featured Events
            </h2>
            <div className="flex space-x-2">
              <button 
                onClick={prevSlide}
                className="p-2 rounded-full bg-gray-200 hover:bg-gray-300 transition-colors"
                aria-label="Previous slide"
                disabled={featuredLoading || featuredEvents.length <= 1}
              >
                <FaChevronLeft className="text-gray-700" />
              </button>
              <button 
                onClick={nextSlide}
                className="p-2 rounded-full bg-gray-200 hover:bg-gray-300 transition-colors"
                aria-label="Next slide"
                disabled={featuredLoading || featuredEvents.length <= 1}
              >
                <FaChevronRight className="text-gray-700" />
              </button>
            </div>
          </div>
          
          {featuredLoading ? (
            <div className="bg-white rounded-xl shadow-md h-96 flex items-center justify-center">
              <FaSpinner className="animate-spin text-purple-600 text-4xl" />
              <span className="ml-3 text-xl text-gray-600">Loading featured events...</span>
            </div>
          ) : featuredEvents.length === 0 ? (
            <div className="bg-white rounded-xl shadow-md h-96 flex items-center justify-center">
              <p className="text-xl text-gray-500">No featured events available at this time.</p>
            </div>
          ) : (
            <div className="relative rounded-xl overflow-hidden shadow-lg h-96 md:h-[500px]">
              {featuredEvents.map((event, index) => (
                <div 
                  key={event.id}
                  className={`absolute inset-0 transition-opacity duration-500 ${
                    index === currentSlide ? 'opacity-100' : 'opacity-0 pointer-events-none'
                  }`}
                >
                  <img 
                    src={event.image_url || `https://placehold.co/1200x600/purple/white?text=${encodeURIComponent(event.name)}`} 
                    alt={event.name} 
                    className="w-full h-full object-cover"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black to-transparent opacity-90"></div>
                  <div className="absolute bottom-0 left-0 right-0 p-6 md:p-10 text-white">
                    <div className="flex items-center mb-3">
                      <span className="bg-purple-600 text-white text-sm px-3 py-1 rounded-full mr-3">
                        {event.category_name || 'Event'}
                      </span>
                      {event.rating && (
                        <span className="flex items-center text-yellow-400 mr-3">
                          <FaStar className="mr-1" />
                          {parseFloat(event.rating).toFixed(1)}
                        </span>
                      )}
                      <span className="text-gray-300 text-sm flex items-center">
                        <FaRegClock className="mr-1" />
                        {formatDateRange(event.date, event.end_date)}
                      </span>
                    </div>
                    <h3 className="text-3xl md:text-4xl font-bold mb-3">{event.name}</h3>
                    <div className="flex items-center text-gray-300 mb-6">
                      <FaMapMarkerAlt className="mr-2" />
                      <span>{event.venue || event.location}, {event.city}</span>
                    </div>
                    <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4">
                      {event.min_price && (
                        <span className="text-xl font-bold">
                          From ${event.min_price} 
                        </span>
                      )}
                      <Link 
                        to={`/events/${event.id}`}
                        className="bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700 text-white font-medium py-3 px-6 rounded-lg inline-flex items-center transition-all shadow-md"
                      >
                        <FaTicketAlt className="mr-2" /> Get Tickets
                      </Link>
                    </div>
                  </div>
                </div>
              ))}
              
              {/* Carousel indicators */}
              {featuredEvents.length > 1 && (
                <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2 flex space-x-2">
                  {featuredEvents.map((_, index) => (
                    <button
                      key={index}
                      onClick={() => setCurrentSlide(index)}
                      className={`w-3 h-3 rounded-full ${
                        index === currentSlide ? 'bg-white' : 'bg-white bg-opacity-50'
                      }`}
                      aria-label={`Go to slide ${index + 1}`}
                    />
                  ))}
                </div>
              )}
            </div>
          )}
        </section>

        {/* Categories Section with Total Events Count */}
        <section className="mb-20">
          <div className="flex justify-between items-center mb-8">
            <h2 className="text-3xl font-bold text-gray-800">
              Browse by Category
            </h2>
            {!totalEventsLoading && (
              <div className="bg-purple-100 text-purple-800 px-4 py-2 rounded-lg text-sm font-medium">
                {totalEvents} Total Events Available
              </div>
            )}
          </div>
          
          {categoriesLoading ? (
            <div className="animate-pulse grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
              {[...Array(5)].map((_, i) => (
                <div key={i} className="bg-gray-200 h-40 rounded-xl"></div>
              ))}
            </div>
          ) : (
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
              {categories.map(category => (
                <Link 
                  key={category.id}
                  to={`/events/category/${category.slug}`}
                  className={`${getCategoryColor(category.name)} hover:opacity-90 transition-opacity rounded-xl p-6 text-white text-center flex flex-col items-center justify-center min-h-[160px] shadow-md`}
                >
                  {getCategoryIcon(category.name)}
                  <h3 className="font-semibold text-lg mb-1">{category.name}</h3>
                  <p className="text-white text-opacity-80 text-sm">
                    {category.event_count || 0} Events
                  </p>
                </Link>
              ))}
            </div>
          )}
        </section>
        
        {/* Upcoming Events Section with Filters */}
        <section className="mb-16">
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8">
            <h2 className="text-3xl font-bold text-gray-800 mb-4 md:mb-0">
              Upcoming Events
            </h2>
            
            {/* Category filter buttons */}
            <div className="flex flex-wrap gap-2">
              <button
                onClick={() => setCategoryFilter('All')}
                className={`px-4 py-2 rounded-full font-medium transition-colors ${
                  categoryFilter === 'All' 
                  ? 'bg-purple-600 text-white' 
                  : 'bg-gray-200 text-gray-800 hover:bg-gray-300'
                }`}
              >
                All
              </button>
              {categories.map(category => (
                <button
                  key={category.id}
                  onClick={() => setCategoryFilter(category.name)}
                  className={`px-4 py-2 rounded-full font-medium transition-colors ${
                    categoryFilter === category.name 
                    ? 'bg-purple-600 text-white' 
                    : 'bg-gray-200 text-gray-800 hover:bg-gray-300'
                  }`}
                >
                  {category.name}
                </button>
              ))}
            </div>
          </div>
          
          {upcomingLoading ? (
            <div className="animate-pulse grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {[...Array(6)].map((_, i) => (
                <div key={i} className="bg-gray-200 h-72 rounded-xl"></div>
              ))}
            </div>
          ) : upcomingEvents.length === 0 ? (
            <div className="bg-white rounded-xl shadow-md p-8 text-center">
              <p className="text-xl text-gray-500">No upcoming events found for this category.</p>
              {categoryFilter !== 'All' && (
                <button 
                  onClick={() => setCategoryFilter('All')}
                  className="mt-4 bg-purple-600 hover:bg-purple-700 text-white px-4 py-2 rounded-lg"
                >
                  View all categories
                </button>
              )}
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {upcomingEvents.map(event => (
                <div key={event.id} className="bg-white rounded-xl shadow-md overflow-hidden group hover:shadow-xl transition-shadow duration-300">
                  <div className="relative overflow-hidden">
                    <img
                      src={event.image_url || `https://placehold.co/600x400/purple/white?text=${encodeURIComponent(event.name)}`}
                      alt={event.name}
                      className="w-full h-48 object-cover transition-transform duration-300 group-hover:scale-105"
                    />
                    <div className="absolute top-0 left-0 right-0 p-3 flex justify-between items-start">
                      <div className="bg-purple-600 text-white px-3 py-1 text-xs rounded-full">
                        {event.category_name || 'Event'}
                      </div>
                      {event.rating && (
                        <div className="flex items-center bg-gray-900 bg-opacity-70 text-white px-2 py-1 rounded text-xs">
                          <FaStar className="text-yellow-400 mr-1" /> 
                          {parseFloat(event.rating).toFixed(1)}
                        </div>
                      )}
                    </div>
                    {event.sold_out && (
                      <div className="absolute inset-0 bg-black bg-opacity-60 flex items-center justify-center">
                        <span className="bg-red-600 text-white font-bold py-2 px-4 rounded-md transform rotate-12">
                          SOLD OUT
                        </span>
                      </div>
                    )}
                  </div>
                  
                  <div className="p-5">
                    <h3 className="text-lg font-semibold mb-2 text-gray-800 line-clamp-2">{event.name}</h3>
                    
                    <div className="flex items-center text-gray-600 mb-1 text-sm">
                      <FaCalendarAlt className="mr-2 text-gray-400" />
                      <span>{formatDateRange(event.date, event.end_date)}</span>
                    </div>
                    
                    <div className="flex items-center text-gray-600 mb-4 text-sm">
                      <FaMapMarkerAlt className="mr-2 text-gray-400" />
                      <span className="truncate">{event.venue || event.location}, {event.city}</span>
                    </div>
                    
                    <div className="flex justify-between items-center mt-4">
                      {event.min_price && (
                        <span className="font-bold text-purple-700">
                          From ${event.min_price} 
                        </span>
                      )}
                      <Link 
                        to={`/events/${event.id}`}
                        className="bg-purple-600 hover:bg-purple-700 text-white px-4 py-2 rounded-lg inline-flex items-center transition-colors"
                      >
                        <FaTicketAlt className="mr-1" /> Details
                      </Link>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
          
          
        </section>
        
        {/* Newsletter Section */}
        <NewsletterSection />
      </div>
    </div>
  );
};

export default Home;