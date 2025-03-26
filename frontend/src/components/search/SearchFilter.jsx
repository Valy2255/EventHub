import { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  FaMapMarkerAlt, 
  FaCalendar,
  FaChevronDown,
  FaSearch,
  FaSpinner
} from 'react-icons/fa';
import RecentlyViewedEvents from './RecentlyViewedEvents';

export default function SearchFilter({ initialParams = {} }) {
  const [locationInput, setLocationInput] = useState(initialParams.location || '');
  const [dateInput, setDateInput] = useState(initialParams.date || '');
  const [searchText, setSearchText] = useState(initialParams.q || '');
  const [isDateDropdownOpen, setIsDateDropdownOpen] = useState(false);
  const [isLocationDropdownOpen, setIsLocationDropdownOpen] = useState(false);
  const [isSearchFocused, setIsSearchFocused] = useState(false);
  const [userLocation, setUserLocation] = useState(null);
  const [isSearching, setIsSearching] = useState(false);
  const [isGettingLocation, setIsGettingLocation] = useState(false);
  const [popularLocations, setPopularLocations] = useState(['Bucharest', 'Cluj-Napoca', 'Timisoara', 'Iasi', 'Brasov']);
  
  const searchInputRef = useRef(null);
  const dateDropdownRef = useRef(null);
  const locationDropdownRef = useRef(null);
  const navigate = useNavigate();

  // Initialize with current location if in params
  useEffect(() => {
    if (initialParams.lat && initialParams.lng) {
      setUserLocation({
        latitude: initialParams.lat,
        longitude: initialParams.lng
      });
      if (initialParams.location === 'Current Location') {
        setLocationInput('Current Location');
      }
    }
  }, [initialParams]);

  // Handle clicks outside dropdowns
  useEffect(() => {
    function handleClickOutside(event) {
      if (dateDropdownRef.current && !dateDropdownRef.current.contains(event.target)) {
        setIsDateDropdownOpen(false);
      }
      if (locationDropdownRef.current && !locationDropdownRef.current.contains(event.target)) {
        setIsLocationDropdownOpen(false);
      }
      // Only close search dropdown if the click is outside the search input and dropdown
      if (searchInputRef.current) {
        const searchContainer = searchInputRef.current;
        if (!searchContainer.contains(event.target)) {
          setIsSearchFocused(false);
        }
      }
    }

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  // Get user's location
  const getUserLocation = () => {
    if (navigator.geolocation) {
      setIsGettingLocation(true);
      navigator.geolocation.getCurrentPosition(
        (position) => {
          setUserLocation({
            latitude: position.coords.latitude,
            longitude: position.coords.longitude
          });
          setLocationInput('Current Location');
          setIsLocationDropdownOpen(false);
          setIsGettingLocation(false);
        },
        (error) => {
          console.error('Error getting location:', error);
          alert('Unable to get your location. Please enable location services or enter a location manually.');
          setIsGettingLocation(false);
        },
        { timeout: 10000, enableHighAccuracy: true }
      );
    } else {
      alert('Geolocation is not supported by this browser.');
    }
  };

  const handleSearch = async (e) => {
    e.preventDefault();
    
    setIsSearching(true);
    try {
      // Construct search parameters
      const params = new URLSearchParams();
      if (locationInput && locationInput !== 'All Locations') params.append('location', locationInput);
      if (dateInput && dateInput !== 'All Dates') params.append('date', dateInput);
      if (searchText) params.append('q', searchText);
      
      // Add coordinates if using current location
      if (userLocation && locationInput === 'Current Location') {
        params.append('lat', userLocation.latitude);
        params.append('lng', userLocation.longitude);
      }
      
      // Preserve category and subcategory if already in URL
      if (initialParams.category) {
        params.append('category', initialParams.category);
      }
      if (initialParams.subcategory) {
        params.append('subcategory', initialParams.subcategory);
      }
      
      navigate(`/events/search?${params.toString()}`);
    } catch (error) {
      console.error('Search failed:', error);
    } finally {
      setIsSearching(false);
      setIsSearchFocused(false);
    }
  };

  // Date options for dropdown
  const dateOptions = [
    { value: '', label: 'All Dates' },
    { value: 'Today', label: 'Today' },
    { value: 'Tomorrow', label: 'Tomorrow' },
    { value: 'This Weekend', label: 'This Weekend' },
    { value: 'This Week', label: 'This Week' },
    { value: 'Next Week', label: 'Next Week' },
    { value: 'This Month', label: 'This Month' },
    { value: 'Next Month', label: 'Next Month' }
  ];

  return (
    <div className="w-full bg-gray-900 py-4">
      <div className="max-w-5xl mx-auto px-4">
        <form onSubmit={handleSearch} className="flex items-stretch">
          {/* Location selector */}
          <div 
            ref={locationDropdownRef}
            className="relative bg-white rounded-l border-r border-gray-300"
          >
            <div 
              className="flex items-center h-full px-3 cursor-pointer py-2"
              onClick={() => setIsLocationDropdownOpen(!isLocationDropdownOpen)}
            >
              <FaMapMarkerAlt className="text-gray-400 mr-2" />
              <div className="w-48 text-gray-800 text-sm truncate">
                {locationInput || "City or Zip Code"}
              </div>
              <FaChevronDown className="text-gray-400 ml-2" size={10} />
            </div>
            
            {/* Location dropdown */}
            {isLocationDropdownOpen && (
              <div className="absolute left-0 right-0 top-full mt-1 bg-white rounded shadow-lg z-30 border border-gray-200">
                <div className="p-2 border-b border-gray-200">
                  <input
                    type="text"
                    placeholder="Enter city or zip code"
                    value={locationInput === 'Current Location' ? '' : locationInput}
                    onChange={(e) => setLocationInput(e.target.value)}
                    className="w-full p-2 border border-gray-300 rounded text-sm text-gray-800"
                    onClick={(e) => e.stopPropagation()}
                  />
                </div>
                <div 
                  className="p-3 hover:bg-gray-100 cursor-pointer flex items-center"
                  onClick={() => {
                    if (!isGettingLocation) {
                      getUserLocation();
                    }
                  }}
                >
                  {isGettingLocation ? (
                    <FaSpinner className="text-purple-500 mr-2 animate-spin" size={14} />
                  ) : (
                    <FaMapMarkerAlt className="text-purple-500 mr-2" size={14} />
                  )}
                  <span className="text-gray-800">
                    {isGettingLocation ? 'Getting location...' : 'Use Current Location'}
                  </span>
                </div>
                <div 
                  className="p-3 hover:bg-gray-100 cursor-pointer"
                  onClick={() => {
                    setLocationInput('');
                    setIsLocationDropdownOpen(false);
                  }}
                >
                  <span className="text-gray-800">All Locations</span>
                </div>
                {popularLocations.map(location => (
                  <div 
                    key={location}
                    className="p-3 hover:bg-gray-100 cursor-pointer"
                    onClick={() => {
                      setLocationInput(location);
                      setIsLocationDropdownOpen(false);
                    }}
                  >
                    <span className="text-gray-800">{location}</span>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Date selector */}
          <div 
            ref={dateDropdownRef}
            className="relative bg-white border-r border-gray-300"
          >
            <div 
              className="flex items-center h-full px-3 cursor-pointer py-2"
              onClick={() => setIsDateDropdownOpen(!isDateDropdownOpen)}
            >
              <FaCalendar className="text-gray-400 mr-2" />
              <div className="w-36 text-gray-800 text-sm truncate">
                {dateInput || "All Dates"}
              </div>
              <FaChevronDown className="text-gray-400 ml-2" size={10} />
            </div>
            
            {/* Date dropdown */}
            {isDateDropdownOpen && (
              <div className="absolute left-0 right-0 top-full mt-1 bg-white rounded shadow-lg z-30 border border-gray-200">
                {dateOptions.map((option) => (
                  <div 
                    key={option.value}
                    className="p-3 hover:bg-gray-100 cursor-pointer"
                    onClick={() => {
                      setDateInput(option.label === 'All Dates' ? '' : option.label);
                      setIsDateDropdownOpen(false);
                    }}
                  >
                    <span className="text-gray-800">{option.label}</span>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Search term */}
          <div 
            ref={searchInputRef}
            className="relative bg-white flex-grow rounded-r-none"
          >
            <div className="flex items-center h-full px-3">
              <FaSearch className="text-gray-400 mr-2" />
              <input
                type="text"
                placeholder="Search by Artist, Event or Venue"
                value={searchText}
                onChange={(e) => setSearchText(e.target.value)}
                onFocus={() => setIsSearchFocused(true)}
                className="w-full py-2 outline-none text-gray-800 text-sm"
              />
            </div>
            
            {/* Recently viewed dropdown */}
            {isSearchFocused && (
              <div className="absolute left-0 right-0 top-full mt-1 z-50">
                <RecentlyViewedEvents 
                  isVisible={true} 
                  onClose={() => setIsSearchFocused(false)}
                  onEventSelect={() => setIsSearchFocused(false)}
                />
              </div>
            )}
          </div>

          {/* Search button */}
          <button 
            type="submit"
            className="bg-purple-600 hover:bg-purple-700 text-white font-bold py-2 px-8 rounded-r transition duration-200"
            disabled={isSearching}
          >
            {isSearching ? (
              <span className="flex items-center">
                <FaSpinner className="animate-spin mr-2" />
                Searching...
              </span>
            ) : 'Search'}
          </button>
        </form>
      </div>
    </div>
  );
}