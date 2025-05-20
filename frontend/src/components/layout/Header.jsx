import { useState, useRef, useEffect } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import {
  FaTicketAlt,
  FaSearch,
  FaUserCircle,
  FaMapMarkerAlt,
  FaChevronDown,
  FaSpinner,
  FaTimes,
} from "react-icons/fa";
import { useAuth } from "../../hooks/useAuth";
import HeaderDropdown from "./HeaderDropdown";
import DatePicker from "../search/DatePicker";
import RecentlyViewedEvents from "../search/RecentlyViewedEvents";
import searchService from "../../services/searchService";

export default function Header() {
  const [searchText, setSearchText] = useState("");
  const [locationInput, setLocationInput] = useState("");
  const [dateRange, setDateRange] = useState(null);
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [isWideSearchFocused, setIsWideSearchFocused] = useState(false);
  const [isRightSearchFocused, setIsRightSearchFocused] = useState(false);
  const [isSearching, setIsSearching] = useState(false);
  const [isLocationDropdownOpen, setIsLocationDropdownOpen] = useState(false);
  const [locationOptions] = useState([
    "Bucharest",
    "Cluj-Napoca",
    "Timisoara",
    "Iasi",
    "Brasov",
  ]);
  const [userLocation, setUserLocation] = useState(null);
  const [isGettingLocation, setIsGettingLocation] = useState(false);

  // New states for search suggestions
  const [searchSuggestions, setSearchSuggestions] = useState([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [isFetchingSuggestions, setIsFetchingSuggestions] = useState(false);

  const wideSearchRef = useRef(null);
  const rightSearchRef = useRef(null);
  const locationDropdownRef = useRef(null);
  const searchInputRef = useRef(null);
  const userDropdownRef = useRef(null);

  const { user, logout } = useAuth();
  const { pathname } = useLocation();
  const navigate = useNavigate();

  // Determine if we are on a category/subcategory page
  const isCategoryPage = pathname.includes("/events/category");
  const isSearchPage = pathname.includes("/events/search");

  const isAdmin = user && user.role === "admin";

  useEffect(() => {
    // Reset search parameters when on the home page
    if (pathname === "/") {
      setDateRange(null);
      setLocationInput("");
      setSearchText("");
      setUserLocation(null);
      console.log("Reset search parameters on home page navigation");
    }
  }, [pathname]);

  // Handle clicks outside dropdowns and inputs
  useEffect(() => {
    function handleClickOutside(event) {
      if (
        wideSearchRef.current &&
        !wideSearchRef.current.contains(event.target)
      ) {
        setIsWideSearchFocused(false);
        setShowSuggestions(false);
      }
      if (
        rightSearchRef.current &&
        !rightSearchRef.current.contains(event.target)
      ) {
        setIsRightSearchFocused(false);
        setShowSuggestions(false);
      }
      if (
        locationDropdownRef.current &&
        !locationDropdownRef.current.contains(event.target)
      ) {
        setIsLocationDropdownOpen(false);
      }
      if (
        searchInputRef.current &&
        !searchInputRef.current.contains(event.target)
      ) {
        setIsWideSearchFocused(false);
        setShowSuggestions(false);
      }
      if (
        userDropdownRef.current &&
        !userDropdownRef.current.contains(event.target) &&
        isDropdownOpen
      ) {
        setIsDropdownOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [isDropdownOpen]);

  // New effect to fetch search suggestions as user types
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

  // Handler for main search bar
  const handleMainSearch = async (e) => {
    e.preventDefault();
    setIsSearching(true);
    try {
      const params = new URLSearchParams();

      // Add location if provided
      if (locationInput) params.append("location", locationInput);

      // Add date range if selected - Fixed to preserve exact dates and ensure they're included
      if (dateRange && dateRange.startDate && dateRange.endDate) {
        // Format dates using local date components to avoid timezone shifts
        const formatLocalDate = (date) => {
          if (!date) return "";
          const year = date.getFullYear();
          const month = String(date.getMonth() + 1).padStart(2, "0");
          const day = String(date.getDate()).padStart(2, "0");
          return `${year}-${month}-${day}`;
        };

        const startDateFormatted = formatLocalDate(dateRange.startDate);
        const endDateFormatted = formatLocalDate(dateRange.endDate);

        params.append("startDate", startDateFormatted);
        params.append("endDate", endDateFormatted);

        console.log("Search with dates:", {
          start: startDateFormatted,
          end: endDateFormatted,
        });
      }

      // Add search text
      if (searchText) params.append("q", searchText);

      // Add coordinates if using current location
      if (userLocation && locationInput === "Current Location") {
        // Make sure we're working with strings to avoid any toFixed issues
        const lat =
          typeof userLocation.latitude === "number"
            ? userLocation.latitude.toString()
            : userLocation.latitude;

        const lng =
          typeof userLocation.longitude === "number"
            ? userLocation.longitude.toString()
            : userLocation.longitude;

        params.append("lat", lat);
        params.append("lng", lng);
      }

      // Create the search URL and log it for debugging
      const searchUrl = `/events/search?${params.toString()}`;
      console.log("Navigating to search URL:", searchUrl);

      navigate(searchUrl);
    } catch (error) {
      console.error("Search failed:", error);
    } finally {
      setIsSearching(false);
      setIsWideSearchFocused(false);
      setShowSuggestions(false);
    }
  };

  // Handler for quick search bar on category pages
  const handleTopRightSearch = async (e) => {
    e.preventDefault();
    if (!searchText.trim()) return;
    setIsSearching(true);
    try {
      navigate(`/events/search?q=${encodeURIComponent(searchText)}`);
    } catch (error) {
      console.error("Quick search failed:", error);
    } finally {
      setIsSearching(false);
      setIsRightSearchFocused(false);
      setShowSuggestions(false);
    }
  };

  // New handler for when user selects a search suggestion
  const handleSuggestionSelect = (suggestion) => {
    if (suggestion && suggestion.id) {
      navigate(`/events/${suggestion.id}`);
      searchService.addToRecentlyViewed(suggestion);
      setShowSuggestions(false);
      setIsWideSearchFocused(false);
      setIsRightSearchFocused(false);
    }
  };

  // Updated handler for search input focus
  const handleSearchFocus = (isWide = true) => {
    if (isWide) {
      setIsWideSearchFocused(true);
    } else {
      setIsRightSearchFocused(true);
    }
    // Only show suggestions if user has typed something
    setShowSuggestions(searchText.length >= 2);
  };

  return (
    <header className="bg-gray-900 text-white">
      {/* Main Navigation Bar */}
      <div className="w-full mx-auto px-4 py-3 flex items-center justify-between">
        {/* Left side: Logo and category dropdown */}
        <div className="flex items-center space-x-8">
          <Link to="/" className="flex items-center">
            <FaTicketAlt className="text-purple-500 mr-2" size={26} />
            <span className="text-2xl font-bold">EventHub</span>
          </Link>
          <HeaderDropdown />
        </div>

        {/* Right side */}
        <div className="flex items-center">
          {/* Quick search only on category pages */}
          {isCategoryPage && (
            <div ref={rightSearchRef} className="relative mr-4">
              <div className="flex items-center relative">
                <input
                  type="text"
                  placeholder="Search by Artist, Event or Venue"
                  value={searchText}
                  onChange={(e) => {
                    setSearchText(e.target.value);
                    setShowSuggestions(e.target.value.length >= 2);
                  }}
                  onFocus={() => handleSearchFocus(false)}
                  className="bg-white text-gray-800 px-4 py-2 pr-10 rounded-full w-80 focus:outline-none border border-gray-300"
                />
                {searchText && (
                  <button
                    type="button"
                    onClick={() => {
                      setSearchText("");
                      setSearchSuggestions([]);
                      setShowSuggestions(false);
                    }}
                    className="absolute right-10 text-gray-400 hover:text-gray-600"
                  >
                    <FaTimes />
                  </button>
                )}
                <button
                  onClick={handleTopRightSearch}
                  className="absolute right-3 text-purple-600"
                >
                  <FaSearch />
                </button>
              </div>

              {/* Show search suggestions when typing in right search bar */}
              {isRightSearchFocused && showSuggestions ? (
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
                    ) : (
                      <div className="p-4 text-center text-gray-500">
                        No results found for "{searchText}"
                      </div>
                    )}
                  </div>
                </div>
              ) : (
                isRightSearchFocused && (
                  <RecentlyViewedEvents
                    isVisible={true}
                    onClose={() => setIsRightSearchFocused(false)}
                    onEventSelect={() => setIsRightSearchFocused(false)}
                  />
                )
              )}
            </div>
          )}

          {/* User account section */}
          <div className="relative" ref={userDropdownRef}>
            {user ? (
              <>
                <button
                  onClick={() => setIsDropdownOpen(!isDropdownOpen)}
                  className="flex items-center space-x-2 hover:text-purple-400 transition-colors"
                >
                  {user.profile_image ? (
                    <img
                      src={user.profile_image}
                      alt={user.name}
                      className="h-8 w-8 rounded-full object-cover"
                    />
                  ) : (
                    <FaUserCircle size={24} />
                  )}
                  <span>{user.name}</span>
                </button>
                {isDropdownOpen && (
                  <div className="absolute right-0 mt-2 w-48 bg-white rounded-md shadow-lg py-1 z-10">
                    <Link
                      to="/profile"
                      className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                    >
                      My Profile
                    </Link>
                    <Link
                      to="/profile/tickets"
                      className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                    >
                      My Tickets
                    </Link>
                    {isAdmin && (
                      <Link
                        to="/admin"
                        className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                      >
                        Admin Dashboard
                      </Link>
                    )}
                    <button
                      onClick={logout}
                      className="block w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                    >
                      Logout
                    </button>
                  </div>
                )}
              </>
            ) : (
              <Link
                to="/login"
                className="flex items-center space-x-1 hover:text-purple-400 transition-colors"
              >
                <FaUserCircle size={24} />
                <span>Sign In/Register</span>
              </Link>
            )}
          </div>
        </div>
      </div>

      {/* Main search bar only on homepage (not on category or search pages) */}
      {!isCategoryPage && !isSearchPage && (
        <div className="bg-gray-900 px-4 py-2">
          <div ref={wideSearchRef} className="max-w-5xl mx-auto p-2 relative">
            <form onSubmit={handleMainSearch} className="flex items-stretch">
              {/* City or Zip Code */}
              <div
                ref={locationDropdownRef}
                className="relative bg-white rounded-l-md border-r border-gray-300 min-w-[180px]"
              >
                <div
                  className="flex items-center h-full px-3 cursor-pointer py-2"
                  onClick={() =>
                    setIsLocationDropdownOpen(!isLocationDropdownOpen)
                  }
                >
                  <FaMapMarkerAlt className="text-gray-400 mr-2" />
                  <div className="py-2 outline-none text-gray-800 text-sm truncate flex-grow">
                    {locationInput || "City or Zip Code"}
                  </div>
                  <FaChevronDown className="text-gray-400 ml-2" size={10} />
                </div>

                {/* Location dropdown */}
                {isLocationDropdownOpen && (
                  <div className="absolute left-0 right-0 top-full mt-1 bg-white rounded shadow-lg z-50 border border-gray-200">
                    <div className="p-2 border-b border-gray-200">
                      <input
                        type="text"
                        placeholder="Enter city or zip code"
                        value={
                          locationInput === "Current Location"
                            ? ""
                            : locationInput
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
                    {locationOptions.map((location) => (
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
                  onDateSelect={(range) => {
                    // Log the range for debugging
                    console.log("DatePicker selected range:", range);

                    // Ensure we're storing the exact date objects
                    const exactStartDate = range.startDate
                      ? new Date(range.startDate.getTime())
                      : null;
                    const exactEndDate = range.endDate
                      ? new Date(range.endDate.getTime())
                      : null;

                    setDateRange({
                      startDate: exactStartDate,
                      endDate: exactEndDate,
                    });

                    // Log after setting
                    console.log("Header dateRange state updated:", {
                      startDate: exactStartDate,
                      endDate: exactEndDate,
                    });
                  }}
                  // Set these to null when on home page to ensure it says "All Dates"
                  initialStartDate={
                    pathname === "/" ? null : dateRange?.startDate
                  }
                  initialEndDate={pathname === "/" ? null : dateRange?.endDate}
                  // Force component to completely re-render when pathname changes
                  key={`datepicker-${pathname}`}
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
                    onFocus={() => handleSearchFocus(true)}
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

                {/* Show search suggestions when typing in main search bar */}
                {isWideSearchFocused && showSuggestions ? (
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
                      ) : (
                        <div className="p-4 text-center text-gray-500">
                          No results found for "{searchText}"
                        </div>
                      )}
                    </div>
                  </div>
                ) : (
                  isWideSearchFocused && (
                    <RecentlyViewedEvents
                      isVisible={true}
                      onClose={() => setIsWideSearchFocused(false)}
                      onEventSelect={() => setIsWideSearchFocused(false)}
                    />
                  )
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
      )}
    </header>
  );
}
