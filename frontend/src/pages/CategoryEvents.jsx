// src/pages/CategoryEvents.jsx
import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { FaMapMarkerAlt, FaCalendarAlt, FaTicketAlt } from 'react-icons/fa';
import api from '../services/api';

export default function CategoryEvents() {
  const { slug } = useParams();
  const [category, setCategory] = useState(null);
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchCategoryEvents = async () => {
      setLoading(true);
      try {
        const response = await api.get(`/categories/${slug}`);
        setCategory(response.data.category);
        setEvents(response.data.events);
      } catch (err) {
        console.error('Error fetching category events:', err);
        setError('Could not load events. Please try again later.');
      } finally {
        setLoading(false);
      }
    };

    fetchCategoryEvents();
  }, [slug]);

  if (loading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="animate-pulse">
          <div className="h-8 bg-gray-300 rounded w-1/4 mb-6"></div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {[1, 2, 3, 4, 5, 6].map((item) => (
              <div key={item} className="bg-gray-300 h-64 rounded-lg"></div>
            ))}
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
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold mb-2">{category.name}</h1>
      <p className="text-gray-600 mb-6">{category.description || `Explore all events in the ${category.name} category`}</p>
  
      {events.length === 0 ? (
        <div className="text-center py-12">
          <h2 className="text-xl font-semibold mb-2">No events available in this category</h2>
          <p className="text-gray-500">Check back later for updates or try another category.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {events.map((event) => (
            <div key={event.id} className="bg-white rounded-lg shadow-md overflow-hidden group hover:shadow-xl transition-shadow duration-300">
              <div className="relative overflow-hidden">
                <img
                  src={event.image_url || 'https://placehold.co/600x400/purple/white?text=Event+Image'}
                  alt={event.name}
                  className="w-full h-48 object-cover transition-transform duration-300 group-hover:scale-105"
                />
              </div>
              
              <div className="p-4">
                <h3 className="text-lg font-semibold mb-2 text-gray-800">{event.name}</h3>
                
                <div className="flex items-center text-gray-600 mb-1 text-sm">
                  <FaCalendarAlt className="mr-2" />
                  <span>{new Date(event.date).toLocaleDateString()}</span>
                </div>
                
                <div className="flex items-center text-gray-600 mb-3 text-sm">
                  <FaMapMarkerAlt className="mr-2" />
                  <span>{event.venue}, {event.city}</span>
                </div>
                
                <div className="flex justify-between items-center mt-4">
                  <span className="font-bold text-purple-700">
                    From {event.min_price} RON
                  </span>
                  <Link
                    to={`/events/${event.id}`}
                    className="bg-purple-600 hover:bg-purple-700 text-white px-4 py-2 rounded-md inline-flex items-center transition-colors"
                  >
                    <FaTicketAlt className="mr-1" /> Details
                  </Link>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}