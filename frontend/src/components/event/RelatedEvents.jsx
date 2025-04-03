// src/components/event/RelatedEvents.jsx
import { Link } from 'react-router-dom';
import { FaMapMarkerAlt, FaCalendarAlt, FaClock } from 'react-icons/fa';
import searchService from '../../services/searchService';

const RelatedEvents = ({ events }) => {
  // Format date for display
  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
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
  
  // Handle click on event card
  const handleEventClick = (event) => {
    searchService.addToRecentlyViewed(event);
  };
  
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
      {events.map(event => (
        <Link 
          key={event.id} 
          to={`/events/${event.id}`}
          className="bg-white rounded-lg overflow-hidden shadow-md hover:shadow-lg transition-shadow group"
          onClick={() => handleEventClick(event)}
        >
          <div className="relative h-40 overflow-hidden">
            <img
              src={event.image_url || 'https://placehold.co/600x400/purple/white?text=Event+Image'}
              alt={event.name}
              className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
            />
            {event.category_name && (
              <div className="absolute top-2 right-2 bg-purple-600 text-white text-xs font-medium px-2 py-1 rounded-full">
                {event.category_name}
              </div>
            )}
          </div>
          
          <div className="p-4">
            <h3 className="font-bold text-gray-800 mb-1 truncate">{event.name}</h3>
            
            <div className="text-sm text-gray-600 mb-1 flex items-center">
              <FaCalendarAlt className="mr-1" size={12} />
              <span>{formatDate(event.date)}</span>
              {event.time && (
                <>
                  <span className="mx-1">•</span>
                  <FaClock className="mr-1" size={12} />
                  <span>{formatTime(event.time)}</span>
                </>
              )}
            </div>
            
            <div className="text-sm text-gray-600 mb-2 flex items-center">
              <FaMapMarkerAlt className="mr-1" size={12} />
              <span className="truncate">{event.venue}, {event.city}</span>
            </div>
            
            <div className="mt-2 font-medium text-purple-600">
              {event.min_price ? `From $${event.min_price}` : 'View event'}
            </div>
          </div>
        </Link>
      ))}
    </div>
  );
};

export default RelatedEvents;