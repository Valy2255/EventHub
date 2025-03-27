import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { FaCalendarAlt, FaMapMarkerAlt, FaTimes } from 'react-icons/fa';
import searchService from '../../services/searchService';

export default function RecentlyViewedEvents({ isVisible, onClose, onEventSelect }) {
  const [recentEvents, setRecentEvents] = useState([]);
  
  useEffect(() => {
    // Load recently viewed events when component mounts or becomes visible
    if (isVisible) {
      loadRecentEvents();
    }
  }, [isVisible]);
  
  const loadRecentEvents = () => {
    const events = searchService.getRecentlyViewedEvents();
    setRecentEvents(events);
  };
  
  const handleClearAll = () => {
    searchService.clearRecentlyViewed();
    setRecentEvents([]);
  };
  
  const handleRemoveEvent = (eventId, e) => {
    e.preventDefault();
    e.stopPropagation();
    const updated = searchService.removeFromRecentlyViewed(eventId);
    setRecentEvents(updated);
  };
  
  if (!isVisible) return null;
  
  return (
    <div className="absolute z-50 left-0 right-0 bg-white rounded-md shadow-lg border border-gray-200 mt-1">
      <div className="flex justify-between items-center p-3 border-b border-gray-200">
        <h3 className="font-semibold text-gray-800">Recently Viewed</h3>
        {recentEvents.length > 0 && (
          <button 
            onClick={handleClearAll} 
            className="text-purple-600 hover:text-purple-800 text-sm"
          >
            Clear All
          </button>
        )}
      </div>
      
      {recentEvents.length === 0 ? (
        <div className="p-4 text-center text-gray-500">No recently viewed events</div>
      ) : (
        <div className="max-h-96 overflow-y-auto">
          {recentEvents.map(event => (
            <div 
              key={event.id} 
              className="p-4 hover:bg-gray-50 border-b border-gray-200 flex items-center"
            >
              <div className="w-10 h-10 bg-gray-200 rounded overflow-hidden mr-3 flex-shrink-0">
                {event.image_url && (
                  <img src={event.image_url} alt={event.name} className="w-full h-full object-cover" />
                )}
              </div>
              <div className="flex-grow">
                <Link 
                  to={`/events/${event.id}`} 
                  className="font-medium text-gray-800 hover:text-gray-900"
                  onClick={() => {
                    if (onEventSelect) onEventSelect();
                    if (onClose) onClose();
                  }}
                >
                  {event.name}
                </Link>
                <div className="text-sm text-gray-600">
                  {event.category}
                </div>
                {event.venue && (
                  <div className="flex items-center text-xs text-gray-500 mt-1">
                    <FaMapMarkerAlt className="mr-1" size={10} />
                    <span>{event.venue}</span>
                  </div>
                )}
              </div>
              <button 
                onClick={(e) => handleRemoveEvent(event.id, e)} 
                className="text-gray-400 hover:text-gray-600 p-1"
                title="Remove from recently viewed"
              >
                <FaTimes />
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}