import { useState, useRef, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import {
  FaMapMarkerAlt,
  FaChevronDown,
  FaSearch,
  FaSpinner,
  FaTimes,
} from "react-icons/fa";
import RecentlyViewedEvents from "./RecentlyViewedEvents";
import DatePicker from "./DatePicker";
import searchService from "../../services/searchService";

// Add this utility function to SearchFilter.jsx after the imports
// and use it whenever you need to convert a date string to a Date object

/**
 * Safely convert a date string to a Date object preserving the exact date
 * @param {string} dateStr - Date string in YYYY-MM-DD format
 * @returns {Date|null} - Date object or null if invalid
 */
const parseExactDate = (dateStr) => {
  if (!dateStr) return null;
  
  try {
    // Split the date string into components
    const [year, month, day] = dateStr.split('-').map(Number);
    
    // Create a new date using local date constructor (not UTC)
    // Month is 0-indexed in JS Date, so subtract 1
    const date = new Date(year, month - 1, day);
    
    // Verify that the date is valid and matches what we expect
    if (
      date.getFullYear() === year &&
      date.getMonth() === month - 1 &&
      date.getDate() === day
    ) {
      return date;
    }
    return null;
  } catch (error) {
    console.error('Error parsing date:', error);
    return null;
  }
};

export default function SearchFilter({ initialParams = {} }) {
  const [locationInput, setLocationInput] = useState(
    initialParams.location || ""
  );
  const [dateRange, setDateRange] = useState({
    startDate: initialParams.startDate
      ? new Date(initialParams.startDate)
      : null,
    endDate: initialParams.endDate ? new Date(initialParams.endDate) : null,
  });
  const [searchText, setSearchText] = useState(initialParams.q || "");
  const [isLocationDropdownOpen, setIsLocationDropdownOpen] = useState(false);
  const [isSearchFocused, setIsSearchFocused] = useState(false);
  const [userLocation, setUserLocation] = useState(null);
  const [isSearching, setIsSearching] = useState(false);
  const [isGettingLocation, setIsGettingLocation] = useState(false);
  const [popularLocations] = useState([
    "Bucharest",
    "Cluj-Napoca",
    "Timisoara",
    "Iasi",
    "Brasov",
  ]);
  const [searchSuggestions, setSearchSuggestions] = useState([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [isFetchingSuggestions, setIsFetchingSuggestions] = useState(false);

  const searchInputRef = useRef(null);
  const locationDropdownRef = useRef(null);
  const navigate = useNavigate();

  // Initialize with current location if in params
  useEffect(() => {
    if (initialParams.lat && initialParams.lng) {
      setUserLocation({
        latitude: parseFloat(initialParams.lat),
        longitude: parseFloat(initialParams.lng),
      });
      if (initialParams.location === "Current Location") {
        setLocationInput("Current Location");
      }
    }

    // Initialize date range if start and end dates are in params
    if (initialParams.startDate && initialParams.endDate) {
      setDateRange({
        startDate: parseExactDate(initialParams.startDate),
        endDate: parseExactDate(initialParams.endDate),
      });
      console.log("Initialized with exact dates:", {
        startDate: initialParams.startDate,
        parsedStart: parseExactDate(initialParams.startDate),
        endDate: initialParams.endDate,
        parsedEnd: parseExactDate(initialParams.endDate)
      });
    } else if (initialParams.date) {
      // Handle legacy date parameter
      const today = new Date();
      setDateRange({
        startDate: today,
        endDate: today,
      });
    }
  }, [initialParams]);

  // Handle clicks outside dropdowns
  useEffect(() => {
    function handleClickOutside(event) {
      if (
        locationDropdownRef.current &&
        !locationDropdownRef.current.contains(event.target)
      ) {
        setIsLocationDropdownOpen(false);
      }
      if (searchInputRef.current) {
        const searchContainer = searchInputRef.current;
        if (!searchContainer.contains(event.target)) {
          setIsSearchFocused(false);
          setShowSuggestions(false);
        }
      }
    }

    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  // Get search suggestions as user types
  useEffect(() => {
    const fetchSuggestions = async () => {
      if (searchText && searchText.length >= 2) {
        setIsFetchingSuggestions(true);
        try {
          const response = await searchService.quickSearch(searchText);
          setSearchSuggestions(response.events || []);
        } catch (error) {
          console.error("Error fetching suggestions:", error);
        } finally {
          setIsFetchingSuggestions(false);
        }
      } else {
        setSearchSuggestions([]);
      }
    };

    // Use debounce to avoid excessive API calls
    const timeoutId = setTimeout(() => {
      if (searchText && searchText.length >= 2) {
        fetchSuggestions();
      }
    }, 300);

    return () => clearTimeout(timeoutId);
  }, [searchText]);

  // Get user's location with explicit permission prompt
  const getUserLocation = () => {
    if (navigator.geolocation) {
      setIsGettingLocation(true);
      console.log("Requesting geolocation permission...");

      // This will trigger the browser's permission dialog
      navigator.geolocation.getCurrentPosition(
        (position) => {
          // Success callback
          const userCoords = {
            latitude: position.coords.latitude,
            longitude: position.coords.longitude,
          };

          // Log the exact coordinates obtained
          console.log("Location obtained successfully:", userCoords);

          // Set the location state
          setUserLocation(userCoords);
          setLocationInput("Current Location");
          setIsLocationDropdownOpen(false);
          setIsGettingLocation(false);
        },
        (error) => {
          // Error callback - handles permission denied
          console.error(
            "Geolocation error code:",
            error.code,
            "Message:",
            error.message
          );
          let errorMessage = "Unable to get your location. ";

          if (error.code === error.PERMISSION_DENIED) {
            errorMessage +=
              "Location permission was denied. Please enable location services in your browser settings.";
          } else if (error.code === error.POSITION_UNAVAILABLE) {
            errorMessage += "Location information is unavailable.";
          } else if (error.code === error.TIMEOUT) {
            errorMessage += "The request to get location timed out.";
          }

          alert(errorMessage);
          setIsGettingLocation(false);
        },
        {
          enableHighAccuracy: true,
          timeout: 10000,
          maximumAge: 0,
        }
      );
    } else {
      alert("Geolocation is not supported by this browser.");
    }
  };

  // Format date to ISO string for backend - fixed to handle timezone issues
  const formatDate = (date) => {
    if (!date) return "";
    
    // Use local date methods to avoid timezone shifts
    const year = date.getFullYear();
    // getMonth() is 0-indexed, so add 1 for actual month
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    
    // Format as YYYY-MM-DD without timezone conversion
    return `${year}-${month}-${day}`;
  };

  // Update search by adapting to the backend API
  // Enhanced handleSearch function for SearchFilter.jsx
  const handleSearch = async (e) => {
    e.preventDefault();

    setIsSearching(true);
    try {
      // Construct search parameters
      const params = new URLSearchParams();

      // Location handling
      if (locationInput && locationInput !== "All Locations") {
        params.append("location", locationInput);
        console.log("Search location:", locationInput);
      }

      // Date handling
      if (dateRange && dateRange.startDate && dateRange.endDate) {
        // Make sure the exact dates are preserved without any shifts
        const startDateStr = formatDate(dateRange.startDate);
        const endDateStr = formatDate(dateRange.endDate);
        params.append("startDate", startDateStr);
        params.append("endDate", endDateStr);
        
        console.log("Date range:", {
          start: startDateStr,
          end: endDateStr
        });
      }

      // Search text
      if (searchText) params.append("q", searchText);

      // Add coordinates if using current location
      if (userLocation && locationInput === "Current Location") {
        // Convert coordinates to strings safely
        let lat, lng;
        
        if (typeof userLocation.latitude === 'number') {
          lat = userLocation.latitude.toString();
        } else {
          lat = userLocation.latitude;
        }
        
        if (typeof userLocation.longitude === 'number') {
          lng = userLocation.longitude.toString();
        } else {
          lng = userLocation.longitude;
        }

        params.append("lat", lat);
        params.append("lng", lng);

        // Log the exact coordinates being sent for debugging
        console.log("Sending coordinates to API:", { lat, lng });
      }

      // Preserve category and subcategory if already in URL
      if (initialParams.category) {
        params.append("category", initialParams.category);
      }
      if (initialParams.subcategory) {
        params.append("subcategory", initialParams.subcategory);
      }

      const searchUrl = `/events/search?${params.toString()}`;
      console.log("Search URL:", searchUrl);

      navigate(searchUrl);
    } catch (error) {
      console.error("Search failed:", error);
    } finally {
      setIsSearching(false);
      setIsSearchFocused(false);
      setShowSuggestions(false);
    }
  };

  // Handle date range selection
  const handleDateSelect = (range) => {
    console.log("Date range selected:", range);
    setDateRange(range);
  };

  // Handle when user selects a search suggestion
  const handleSuggestionSelect = (suggestion) => {
    if (suggestion && suggestion.id) {
      navigate(`/events/${suggestion.id}`);
      searchService.addToRecentlyViewed(suggestion);
    }
  };

  // Handle search input focus
  const handleSearchFocus = () => {
    setIsSearchFocused(true);
    // Only show suggestions if user has typed something
    setShowSuggestions(searchText.length >= 2);
  };

  return (
    <div className="w-full bg-gray-900 py-4">
      <div className="max-w-5xl mx-auto px-4">
        <form onSubmit={handleSearch} className="flex items-stretch">
          {/* Location selector */}
          <div
            ref={locationDropdownRef}
            className="relative bg-white rounded-l-md border-r border-gray-300 min-w-[180px]"
          >
            <div
              className="flex items-center h-full px-3 cursor-pointer py-2"
              onClick={() => setIsLocationDropdownOpen(!isLocationDropdownOpen)}
            >
              <FaMapMarkerAlt className="text-gray-400 mr-2" />
              <div className="text-gray-800 text-sm truncate flex-grow">
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
                    value={
                      locationInput === "Current Location" ? "" : locationInput
                    }
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
                    <FaSpinner
                      className="text-purple-500 mr-2 animate-spin"
                      size={14}
                    />
                  ) : (
                    <FaMapMarkerAlt
                      className="text-purple-500 mr-2"
                      size={14}
                    />
                  )}
                  <span className="text-gray-800">
                    {isGettingLocation
                      ? "Getting location..."
                      : "Use Current Location"}
                  </span>
                </div>
                <div
                  className="p-3 hover:bg-gray-100 cursor-pointer"
                  onClick={() => {
                    setLocationInput("");
                    setIsLocationDropdownOpen(false);
                  }}
                >
                  <span className="text-gray-800">All Locations</span>
                </div>
                {popularLocations.map((location) => (
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

          {/* Date Picker */}
          <div className="relative bg-white border-r border-gray-300 min-w-[175px]">
            <DatePicker
              variant="header"
              onDateSelect={handleDateSelect}
              initialStartDate={dateRange.startDate}
              initialEndDate={dateRange.endDate}
            />
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
                onChange={(e) => {
                  setSearchText(e.target.value);
                  setShowSuggestions(e.target.value.length >= 2);
                }}
                onFocus={handleSearchFocus}
                className="w-full py-2 outline-none text-gray-800 text-sm"
              />
              {searchText && (
                <button
                  type="button"
                  onClick={() => {
                    setSearchText("");
                    setSearchSuggestions([]);
                    setShowSuggestions(false);
                  }}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <FaTimes />
                </button>
              )}
            </div>

            {/* Show search suggestions when typing */}
            {isSearchFocused && showSuggestions && (
              <div className="absolute left-0 right-0 top-full mt-1 z-50 bg-white rounded-md shadow-lg border border-gray-200">
                <div className="max-h-96 overflow-y-auto">
                  {isFetchingSuggestions ? (
                    <div className="flex justify-center items-center py-4">
                      <FaSpinner
                        className="animate-spin text-purple-600"
                        size={20}
                      />
                    </div>
                  ) : searchSuggestions.length > 0 ? (
                    <>
                      <div className="p-3 border-b border-gray-200">
                        <h3 className="font-semibold text-gray-800">
                          Search Results
                        </h3>
                      </div>
                      {searchSuggestions.map((suggestion) => (
                        <div
                          key={suggestion.id}
                          className="p-4 hover:bg-gray-50 border-b border-gray-200 flex items-center cursor-pointer"
                          onClick={() => handleSuggestionSelect(suggestion)}
                        >
                          <div className="w-10 h-10 bg-gray-200 rounded overflow-hidden mr-3 flex-shrink-0">
                            {suggestion.image_url && (
                              <img
                                src={suggestion.image_url}
                                alt={suggestion.name}
                                className="w-full h-full object-cover"
                              />
                            )}
                          </div>
                          <div className="flex-grow">
                            <div className="font-medium text-gray-800">
                              {suggestion.name}
                            </div>
                            <div className="text-sm text-gray-600 flex items-center">
                              <FaMapMarkerAlt
                                className="mr-1 text-gray-400"
                                size={10}
                              />
                              {suggestion.venue}, {suggestion.city}
                            </div>
                          </div>
                        </div>
                      ))}
                    </>
                  ) : searchText.length >= 2 ? (
                    <div className="p-4 text-center text-gray-500">
                      No results found for "{searchText}"
                    </div>
                  ) : (
                    // Show recently viewed events if no search query
                    <RecentlyViewedEvents
                      isVisible={true}
                      onClose={() => setIsSearchFocused(false)}
                      onEventSelect={() => setIsSearchFocused(false)}
                    />
                  )}
                </div>
              </div>
            )}

            {/* Show recently viewed events when clicked but not typing */}
            {isSearchFocused && !showSuggestions && (
              <RecentlyViewedEvents
                isVisible={true}
                onClose={() => setIsSearchFocused(false)}
                onEventSelect={() => setIsSearchFocused(false)}
              />
            )}
          </div>

          {/* Search button */}
          <button
            type="submit"
            className="bg-purple-600 hover:bg-purple-700 text-white font-bold py-2 px-8 rounded-r-md transition duration-200"
            disabled={isSearching}
          >
            {isSearching ? (
              <span className="flex items-center">
                <FaSpinner className="animate-spin mr-2" />
                Searching...
              </span>
            ) : (
              "Search"
            )}
          </button>
        </form>
      </div>
    </div>
  );
}