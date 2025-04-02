// src/components/layout/CategoryHeader.jsx
import { useState, useEffect, useRef } from "react";
import { useParams, useNavigate, useLocation, Link } from "react-router-dom";
import {
  FaMapMarkerAlt,
  FaChevronDown,
  FaSpinner,
  FaHome,
} from "react-icons/fa";
import api from "../../services/api";
import DatePicker from "../search/DatePicker";

export default function CategoryHeader({ categoryData, subcategoryData }) {
  // State for category and subcategory
  const [category, setCategory] = useState(categoryData || null);
  const [subcategory, setSubcategory] = useState(subcategoryData || null);
  const [subcategories, setSubcategories] = useState([]);

  // Search and filter states
  const [locationInput, setLocationInput] = useState("");
  const [dateRange, setDateRange] = useState({
    startDate: null,
    endDate: null,
  });
  const [userLocation, setUserLocation] = useState(null);
  const [isGettingLocation, setIsGettingLocation] = useState(false);
  const [isLocationDropdownOpen, setIsLocationDropdownOpen] = useState(false);
  const [isCategoryDropdownOpen, setIsCategoryDropdownOpen] = useState(false);
  const [locationOptions] = useState([
    "Bucharest",
    "Cluj-Napoca",
    "Timisoara",
    "Iasi",
    "Brasov",
  ]);

  // Refs for handling outside clicks
  const locationDropdownRef = useRef(null);
  const categoryDropdownRef = useRef(null);

  const params = useParams();
  const { categorySlug, subcategorySlug } = params;
  const slug = categorySlug || params.slug; // Support both param naming conventions
  const navigate = useNavigate();
  const location = useLocation();

  // Parse parameters from URL query string for filter persistence
  useEffect(() => {
    const searchParams = new URLSearchParams(location.search);

    // Set location if present in URL
    const locationParam = searchParams.get("location");
    if (locationParam) {
      setLocationInput(locationParam);
    }

    // Set date range if present in URL
    const startDate = searchParams.get("startDate");
    const endDate = searchParams.get("endDate");

    if (startDate && endDate) {
      const parseExactDate = (dateStr) => {
        if (!dateStr) return null;
        try {
          // Make sure we create a date in the user's timezone
          const [year, month, day] = dateStr.split("-").map(Number);
          const date = new Date(year, month - 1, day);
          return date;
        } catch (error) {
          console.error("Error parsing date:", error);
          return null;
        }
      };

      setDateRange({
        startDate: parseExactDate(startDate),
        endDate: parseExactDate(endDate),
      });
    }

    // Set coordinates if using current location
    if (searchParams.get("lat") && searchParams.get("lng")) {
      setUserLocation({
        latitude: parseFloat(searchParams.get("lat")),
        longitude: parseFloat(searchParams.get("lng")),
      });

      if (locationParam === "Current Location") {
        setLocationInput("Current Location");
      }
    }
  }, [location.search]);

  // Fetch category and subcategories data
  useEffect(() => {
    // Set category from props if available
    if (categoryData) {
      setCategory(categoryData);
    }

    if (subcategoryData) {
      setSubcategory(subcategoryData);
    }

    if (slug) {
      // Fetch subcategories for this category
      const fetchCategoryData = async () => {
        try {
          // If category not provided through props, fetch it
          if (!categoryData) {
            const categoryResponse = await api.get(`/categories/${slug}`);
            if (categoryResponse.data && categoryResponse.data.category) {
              setCategory(categoryResponse.data.category);
            }
          }

          // Fetch subcategories for this category
          const subcategoriesResponse = await api.get(
            `/categories/${slug}/subcategories`
          );
          if (
            subcategoriesResponse.data &&
            subcategoriesResponse.data.subcategories
          ) {
            setSubcategories(subcategoriesResponse.data.subcategories);
          }
        } catch (error) {
          console.error("Error loading category data:", error);
        }
      };

      fetchCategoryData();
    }
  }, [slug, categoryData, subcategoryData]);

  // Handle clicks outside dropdowns
  useEffect(() => {
    function handleClickOutside(event) {
      if (
        locationDropdownRef.current &&
        !locationDropdownRef.current.contains(event.target)
      ) {
        setIsLocationDropdownOpen(false);
      }
      if (
        categoryDropdownRef.current &&
        !categoryDropdownRef.current.contains(event.target)
      ) {
        setIsCategoryDropdownOpen(false);
      }
    }

    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  // Get user's location with explicit permission
  const getUserLocation = () => {
    if (navigator.geolocation) {
      setIsGettingLocation(true);
      console.log("Requesting geolocation permission...");

      navigator.geolocation.getCurrentPosition(
        (position) => {
          // Success callback
          const userCoords = {
            latitude: position.coords.latitude,
            longitude: position.coords.longitude,
          };

          console.log("Location obtained successfully:", userCoords);

          // Update state and immediately apply filters with the new location
          setUserLocation(userCoords);
          setLocationInput("Current Location");
          setIsLocationDropdownOpen(false);

          // Apply filters with the new location
          applyFilters("Current Location", userCoords);
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

  // Handle date selection
  const handleDateSelect = (range) => {
    console.log("Date range selected:", range);
    setDateRange(range);

    // Apply filters with the new date range
    setTimeout(() => applyFilters(locationInput, userLocation, range), 100);
  };

  // Handle subcategory selection
  const handleSubcategoryChange = (subSlug) => {
    const basePath = subSlug
      ? `/events/category/${slug}/${subSlug}`
      : `/events/category/${slug}`;

    setIsCategoryDropdownOpen(false);

    // Navigate to the selected subcategory with any existing filters
    const searchParams = new URLSearchParams(location.search);
    navigate(`${basePath}?${searchParams.toString()}`);
  };

  // Format date for display and API
  const formatDate = (date) => {
    if (!date) return "";

    // Use local date methods to avoid timezone shifts
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, "0");
    const day = String(date.getDate()).padStart(2, "0");

    // Format as YYYY-MM-DD
    return `${year}-${month}-${day}`;
  };

  // Apply all filters and update URL
  const applyFilters = (
    selectedLocation = locationInput,
    selectedCoords = userLocation,
    selectedDateRange = dateRange
  ) => {
    const params = new URLSearchParams();

    // Keep the current page in category/subcategory structure
    const basePath = subcategorySlug
      ? `/events/category/${slug}/${subcategorySlug}`
      : `/events/category/${slug}`;

    // Add location filter if provided
    if (selectedLocation && selectedLocation !== "All Locations") {
      params.append("location", selectedLocation);
    }

    // Add date range if selected
    if (
      selectedDateRange &&
      selectedDateRange.startDate &&
      selectedDateRange.endDate
    ) {
      params.append("startDate", formatDate(selectedDateRange.startDate));
      params.append("endDate", formatDate(selectedDateRange.endDate));
    }

    // Add coordinates if using current location
    if (selectedCoords && selectedLocation === "Current Location") {
      params.append("lat", selectedCoords.latitude.toString());
      params.append("lng", selectedCoords.longitude.toString());
    }

    // Create URL with filters
    const newUrl = `${basePath}?${params.toString()}`;
    navigate(newUrl);
  };

  // Handle location selection
  const handleLocationSelect = (selectedLocation) => {
    // Set the location input
    setLocationInput(selectedLocation);
    setIsLocationDropdownOpen(false);

    // If clearing the location, also clear coordinates
    const coords = selectedLocation ? userLocation : null;

    // Apply filters with the selected location
    applyFilters(selectedLocation, coords);
  };

  // Background image based on category
  const getBgImage = () => {
    // You can customize these URLs to use your own images
    switch (slug) {
      case "concerts":
        return "url(https://placehold.co/1920x400/000000/ffffff?text=Concert+Tickets)";
      case "sports":
        return "url(https://placehold.co/1920x400/000000/ffffff?text=Sports+Events)";
      case "theater-comedy":
        return "url(https://placehold.co/1920x400/000000/ffffff?text=Theater+and+Comedy)";
      case "festivals":
        return "url(https://placehold.co/1920x400/000000/ffffff?text=Festival+Tickets)";
      default:
        return "url(https://placehold.co/1920x400/000000/ffffff?text=Event+Tickets)";
    }
  };

  return (
    <div>
      {/* Banner with title overlay */}
      <div
        className="relative w-full h-64 bg-cover bg-center"
        style={{ backgroundImage: getBgImage() }}
      >
        <div className="absolute inset-0 bg-black bg-opacity-50">
          <div className="container mx-auto h-full flex flex-col justify-end px-8 pb-12">
            {/* Breadcrumb */}
            <div className="text-gray-300 mb-4 flex items-center">
              <Link to="/" className="hover:text-white">
                <FaHome className="inline mr-1" size={14} />
                Home
              </Link>
              <span className="mx-2">/</span>
              <span className="text-white font-medium">
                {subcategory ? (
                  <>
                    <Link
                      to={`/events/category/${slug}`}
                      className="hover:text-white"
                    >
                      {category?.name} Tickets
                    </Link>
                    <span className="mx-2">/</span>
                    {subcategory.name}
                  </>
                ) : (
                  `${category?.name} Tickets`
                )}
              </span>
            </div>

            {/* Main title */}
            <h1 className="text-5xl font-bold text-white uppercase">
              {subcategory
                ? subcategory.name
                : category?.name
                ? `${category.name} TICKETS`
                : "TICKETS"}
              <div className="w-24 h-1 bg-blue-600 mt-2"></div>
            </h1>
          </div>
        </div>
      </div>

      {/* Filter bar */}
      <div className="bg-white border-b border-gray-200">
        <div className="container mx-auto">
          <div className="flex items-center flex-wrap md:flex-nowrap">
            {/* Location Selector - FIXED to apply filters immediately on selection */}
            <div
              ref={locationDropdownRef}
              className="relative border-r border-gray-300"
            >
              <div
                className="flex items-center h-14 px-4 cursor-pointer"
                onClick={() =>
                  setIsLocationDropdownOpen(!isLocationDropdownOpen)
                }
              >
                <FaMapMarkerAlt className="text-gray-600 mr-2" />
                <span className="text-sm font-medium">
                  {locationInput ? `Near ${locationInput}` : "All Locations"}
                </span>
                <FaChevronDown className="ml-2 text-gray-500" size={12} />
              </div>

              {/* Location dropdown */}
              {isLocationDropdownOpen && (
                <div className="absolute left-0 right-0 mt-1 bg-white border border-gray-200 rounded shadow-lg z-30">
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
                      onKeyPress={(e) => {
                        if (e.key === "Enter") {
                          handleLocationSelect(e.target.value);
                        }
                      }}
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
                    onClick={() => handleLocationSelect("")}
                  >
                    <span className="text-gray-800">All Locations</span>
                  </div>
                  {locationOptions.map((location) => (
                    <div
                      key={location}
                      className="p-3 hover:bg-gray-100 cursor-pointer"
                      onClick={() => handleLocationSelect(location)}
                    >
                      <span className="text-gray-800">{location}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Category Dropdown - Fixed to maintain consistent width */}
            {subcategories.length > 0 && (
              <div
                ref={categoryDropdownRef}
                className="relative border-r border-gray-300 w-48"
              >
                <div
                  className="flex items-center h-14 px-4 cursor-pointer w-full"
                  onClick={() =>
                    setIsCategoryDropdownOpen(!isCategoryDropdownOpen)
                  }
                >
                  <span className="text-sm font-medium truncate">
                    {subcategory
                      ? subcategory.name
                      : `All ${category?.name || "Events"}`}
                  </span>
                  <FaChevronDown className="ml-2 text-gray-500" size={12} />
                </div>

                {/* Category dropdown */}
                {isCategoryDropdownOpen && (
                  <div className="absolute left-0 right-0 mt-1 bg-white border border-gray-200 rounded shadow-lg z-30 max-h-80 overflow-y-auto w-64">
                    <div
                      className="p-3 hover:bg-gray-100 cursor-pointer border-b border-gray-200 flex justify-between items-center"
                      onClick={() => handleSubcategoryChange("")}
                    >
                      <span className="font-medium">
                        All {category?.name || "Events"}
                      </span>
                      {!subcategorySlug && (
                        <span className="text-gray-500">✓</span>
                      )}
                    </div>

                    {subcategories.map((sub) => (
                      <div
                        key={sub.id}
                        className="p-3 hover:bg-gray-100 cursor-pointer border-b border-gray-200 flex justify-between items-center"
                        onClick={() => handleSubcategoryChange(sub.slug)}
                      >
                        <span>{sub.name}</span>
                        {subcategorySlug === sub.slug && (
                          <span className="text-gray-500">✓</span>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* Date Picker */}
            <div className="border-r border-gray-300 h-14">
              <DatePicker
                variant="header"
                onDateSelect={handleDateSelect}
                initialStartDate={dateRange.startDate}
                initialEndDate={dateRange.endDate}
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
