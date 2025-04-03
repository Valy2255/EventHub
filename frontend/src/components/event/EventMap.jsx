// src/components/event/EventMap.jsx
import { FaMapMarkerAlt } from 'react-icons/fa';

const EventMap = ({ latitude, longitude}) => {
  // If we don't have coordinates, show a placeholder
  if (!latitude || !longitude) {
    return (
      <div className="bg-gray-100 rounded-lg h-64 flex items-center justify-center">
        <div className="text-center text-gray-500">
          <FaMapMarkerAlt size={40} className="mx-auto mb-2" />
          <p>Map information not available</p>
        </div>
      </div>
    );
  }
  
  // Generate Google Maps embed URL
  const mapUrl = `https://www.google.com/maps/embed/v1/place?key=${import.meta.env.VITE_GOOGLE_MAPS_API_KEY || 'YOUR_API_KEY'}&q=${latitude},${longitude}&zoom=15`;
  
  return (
    <div className="rounded-lg overflow-hidden h-64 border border-gray-300">
      <iframe
        title="Event Location"
        width="100%"
        height="100%"
        frameBorder="0"
        src={mapUrl}
        allowFullScreen
      ></iframe>
    </div>
  );
};

export default EventMap;