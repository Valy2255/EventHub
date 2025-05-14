import { useState, useEffect } from "react";
import { useParams, Link, useLocation } from "react-router-dom";
import {
  FaMapMarkerAlt,
  FaCalendarAlt,
  FaChevronDown,
  FaInfoCircle,
  FaExternalLinkAlt,
} from "react-icons/fa";
import api from "../services/api";
import CategoryHeader from "../components/layout/CategoryHeader";
import searchService from "../services/searchService";

export default function CategoryEvents() {
  const { slug, subcategorySlug } = useParams();
  const location = useLocation();

  // Category and events data
  const [category, setCategory] = useState(null);
  const [subcategory, setSubcategory] = useState(null);
  const [displayedEvents, setDisplayedEvents] = useState([]);
  const [featuredEvents, setFeaturedEvents] = useState([]);

  // Loading and error states
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [error, setError] = useState(null);

  // Pagination
  const [currentPage, setCurrentPage] = useState(1);
  const [totalEvents, setTotalEvents] = useState(0);
  const [loadedEvents, setLoadedEvents] = useState(0);
  const eventsPerPage = 20;

  // Fetch category and events data
  // Function to check if we've reached the end of all available events
  const checkIfAllEventsLoaded = (events, expectedPerPage) => {
    // If we got fewer events than expected per page, we've reached the end
    if (events.length < expectedPerPage) {
      return true;
    }
    return false;
  };

  useEffect(() => {
    // Defensive check for undefined slug
    if (!slug) {
      console.error("Category slug is undefined");
      setError(
        "Category not found. Please return to the homepage and try again."
      );
      setLoading(false);
      return;
    }

    const fetchCategoryData = async () => {
      setLoading(true);
      try {
        // Extract filter parameters from URL
        const searchParams = new URLSearchParams(location.search);
        const locationParam = searchParams.get("location");
        const startDate = searchParams.get("startDate");
        const endDate = searchParams.get("endDate");
        const lat = searchParams.get("lat");
        const lng = searchParams.get("lng");
        const page = parseInt(searchParams.get("page")) || 1;

        setCurrentPage(page);

        // 1. Fetch category details
        console.log(`Fetching category with slug: ${slug}`);
        const categoryResponse = await api.get(`/categories/${slug}`);

        if (!categoryResponse.data || !categoryResponse.data.category) {
          console.error("Invalid category data:", categoryResponse.data);
          throw new Error("Category not found");
        }

        setCategory(categoryResponse.data.category);

        // If subcategory is specified, fetch subcategory details
        if (subcategorySlug) {
          try {
            const subcategoriesResponse = await api.get(
              `/categories/${slug}/subcategories`
            );
            const foundSubcategory =
              subcategoriesResponse.data.subcategories.find(
                (sub) => sub.slug === subcategorySlug
              );

            if (foundSubcategory) {
              setSubcategory(foundSubcategory);
            }
          } catch (err) {
            console.error("Error fetching subcategory:", err);
          }
        }

        // 2. Fetch featured events for this category
        try {
          const featuredResponse = await api.get(
            `/categories/${slug}/events/featured`
          );
          if (
            featuredResponse.data &&
            Array.isArray(featuredResponse.data.events)
          ) {
            setFeaturedEvents(featuredResponse.data.events);
          } else {
            console.warn(
              "Featured events data not in expected format",
              featuredResponse.data
            );
            setFeaturedEvents([]);
          }
        } catch (err) {
          console.error("Error fetching featured events:", err);
          setFeaturedEvents([]);
        }

        // 3. Parameters for fetching all events (paginated)
        const params = new URLSearchParams();
        params.append("page", page.toString());
        params.append("limit", eventsPerPage.toString());

        // Add filters if present
        if (locationParam) params.append("location", locationParam);
        if (startDate && endDate) {
          params.append("startDate", startDate);
          params.append("endDate", endDate);
        }
        if (lat && lng) {
          params.append("lat", lat);
          params.append("lng", lng);
        }

        // 4. Fetch paginated events - determine which API to use
        let apiUrl = `/categories/${slug}/events`;
        let useSearchApi = false;

        // If subcategory is specified, use subcategory endpoint
        if (subcategorySlug) {
          apiUrl = `/categories/${slug}/${subcategorySlug}`;
        } else if (locationParam || startDate || endDate || lat || lng) {
          // If filters are applied, use search API
          apiUrl = "/search/events";
          params.append("category", slug);
          useSearchApi = true;
        }

        console.log(
          "Fetching events from:",
          apiUrl,
          "with params:",
          params.toString()
        );
        const eventsResponse = await api.get(`${apiUrl}?${params.toString()}`);

        // Process the events response depending on which API was used
        let events = [];
        let totalCount = 0;

        if (eventsResponse.data) {
          if (Array.isArray(eventsResponse.data.events)) {
            events = eventsResponse.data.events;

            // Different APIs return count in different fields
            if (useSearchApi) {
              totalCount = eventsResponse.data.count || events.length;
            } else if (subcategorySlug) {
              // For subcategory, check if totalCount is provided directly
              totalCount =
                eventsResponse.data.totalCount ||
                eventsResponse.data.total ||
                events.length;
            } else {
              // For regular category endpoint, use totalCount if available, or calculate from totalPages
              totalCount =
                eventsResponse.data.totalCount ||
                eventsResponse.data.total ||
                (eventsResponse.data.totalPages
                  ? eventsResponse.data.totalPages * eventsPerPage
                  : events.length);
            }

            // Log the total count for debugging
            console.log(
              `Using ${totalCount} as total events count for this category/filter`
            );
          } else {
            console.warn(
              "Events data not in expected format",
              eventsResponse.data
            );
          }
        }

        // Apply distance calculation if coordinates are provided
        if (lat && lng && locationParam === "Current Location") {
          events.forEach((event) => {
            if (event.latitude && event.longitude) {
              event.distance = searchService.calculateDistance(
                lat,
                lng,
                event.latitude,
                event.longitude
              );
            }
          });
        }

        // Check if we've loaded all the events available
        const isAllEventsLoaded = checkIfAllEventsLoaded(events, eventsPerPage);

        // If this is the first page and we got fewer events than expected, update the total count
        if (page === 1 && isAllEventsLoaded) {
          console.log(
            `First page has ${events.length} events which is less than ${eventsPerPage}. All events are loaded.`
          );
          totalCount = events.length;
        }

        console.log(
          `Loaded ${events.length} events out of ${totalCount} total.${
            isAllEventsLoaded ? " All events loaded!" : ""
          }`
        );

        // Update state with the fetched events
        setDisplayedEvents(events);
        setTotalEvents(totalCount);
        setLoadedEvents(events.length);

        // If we've reached the end and the page is greater than 1, we need to add up all loaded events
        if (page > 1 && isAllEventsLoaded) {
          const actualTotal = events.length + (page - 1) * eventsPerPage;
          console.log(
            `Updated total events to ${actualTotal} based on loaded events`
          );
          setTotalEvents(actualTotal);
          setLoadedEvents(actualTotal);
        }
      } catch (err) {
        console.error("Error fetching category events:", err);
        setError("Could not load events. Please try again later.");
      } finally {
        setLoading(false);
      }
    };

    fetchCategoryData();
  }, [slug, subcategorySlug, location.search, eventsPerPage]);

  // Load more events without navigating to a new page
  const loadMoreEvents = async () => {
    setLoadingMore(true);

    try {
      // Calculate next page
      const nextPage = currentPage + 1;

      // Prepare search parameters for the API request
      const searchParams = new URLSearchParams(location.search);
      searchParams.set("page", nextPage.toString());

      // Determine the API endpoint based on filters
      let apiUrl = `/categories/${slug}/events`;

      if (subcategorySlug) {
        apiUrl = `/categories/${slug}/${subcategorySlug}`;
      } else if (
        searchParams.has("location") ||
        searchParams.has("startDate") ||
        searchParams.has("lat")
      ) {
        apiUrl = "/search/events";
        searchParams.append("category", slug);
      }

      console.log(
        "Loading more events from:",
        apiUrl,
        "with params:",
        searchParams.toString()
      );

      // Fetch additional events
      const response = await api.get(`${apiUrl}?${searchParams.toString()}`);

      // Process the response and get new events
      let newEvents = [];
      if (response.data && response.data.events) {
        newEvents = response.data.events;

        // Apply distance calculation if coordinates are provided
        const lat = searchParams.get("lat");
        const lng = searchParams.get("lng");
        if (lat && lng && searchParams.get("location") === "Current Location") {
          newEvents.forEach((event) => {
            if (event.latitude && event.longitude) {
              event.distance = searchService.calculateDistance(
                lat,
                lng,
                event.latitude,
                event.longitude
              );
            }
          });
        }

        // Combine with existing events, avoiding duplicates
        const existingIds = new Set(displayedEvents.map((e) => e.id));
        const filteredNewEvents = newEvents.filter(
          (e) => !existingIds.has(e.id)
        );

        // Update displayed events by appending new ones
        setDisplayedEvents([...displayedEvents, ...filteredNewEvents]);

        // Update current page and loaded events count
        setCurrentPage(nextPage);
        const newLoadedCount = loadedEvents + filteredNewEvents.length;
        setLoadedEvents(newLoadedCount);

        // If we got fewer events than expected or no new events,
        // we've reached the end - update the total count to match what we have
        if (
          filteredNewEvents.length === 0 ||
          filteredNewEvents.length < eventsPerPage
        ) {
          console.log(
            "Reached the end of available events. Updating total count."
          );
          setTotalEvents(newLoadedCount);
        }

        console.log(
          `Added ${
            filteredNewEvents.length
          } new events. Now showing ${newLoadedCount} of ${
            filteredNewEvents.length === 0 ||
            filteredNewEvents.length < eventsPerPage
              ? newLoadedCount
              : totalEvents
          }`
        );
      }
    } catch (error) {
      console.error("Error loading more events:", error);
    } finally {
      setLoadingMore(false);
    }
  };

  // Helper function to format date for display
  const formatEventDate = (dateString) => {
    return new Date(dateString).toLocaleDateString();
  };

  // Helper function to format time for display
  const formatEventTime = (timeString) => {
    if (!timeString) return "";
    const [hours, minutes] = timeString.split(":");
    const hour = parseInt(hours, 10);
    const ampm = hour >= 12 ? "PM" : "AM";
    const formattedHour = hour % 12 || 12;
    return `${formattedHour}:${minutes} ${ampm}`;
  };

  if (loading) {
    return (
      <div>
        <div className="h-14 bg-white border-b border-gray-200"></div>{" "}
        {/* Placeholder for header */}
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
      <div>
        {category && (
          <CategoryHeader
            categoryData={category}
            subcategoryData={subcategory}
          />
        )}
        <div className="container mx-auto px-4 py-8">
          <div
            className="bg-red-100 border-l-4 border-red-500 text-red-700 p-4"
            role="alert"
          >
            <p>{error}</p>
            <div className="mt-4">
              <Link to="/" className="text-red-700 font-bold hover:underline">
                Return to homepage
              </Link>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (!category) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="text-center">
          <h1 className="text-3xl font-bold mb-4">Category not found</h1>
          <p className="text-gray-600 mb-6">
            The category you're looking for doesn't exist or has been removed.
          </p>
          <Link
            to="/"
            className="bg-purple-600 text-white px-6 py-3 rounded-md hover:bg-purple-700"
          >
            Back to homepage
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div>
      {/* Category Header with filter functionality */}
      <CategoryHeader categoryData={category} subcategoryData={subcategory} />

      <div className="container mx-auto px-4 py-8">
        {/* Popular Events */}
        {featuredEvents.length > 0 && (
          <div className="mb-12">
            <h2 className="text-2xl font-bold mb-6 uppercase">
              POPULAR {category.name}
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {featuredEvents.map((event) => (
                <div
                  key={event.id}
                  className="bg-white rounded overflow-hidden shadow-md hover:shadow-lg transition-shadow relative"
                >
                  <Link
                    to={`/events/${event.id}`}
                    className="block relative"
                    onClick={() => searchService.addToRecentlyViewed(event)}
                  >
                    <div className="flex h-48 md:h-64">
                      {/* Image */}
                      <div className="w-1/2 overflow-hidden">
                        <img
                          src={
                            event.image_url ||
                            "https://placehold.co/600x400/purple/white?text=Event+Image"
                          }
                          alt={event.name}
                          className="w-full h-full object-cover transition-transform duration-300 hover:scale-105"
                        />
                      </div>
                      {/* Info */}
                      <div className="w-1/2 p-4 flex flex-col justify-between bg-gray-50">
                        <div>
                          <h3 className="text-xl font-bold text-gray-800 mb-2">
                            {event.name}
                          </h3>

                          {/* Show original date for rescheduled featured events */}
                          {event.status === "rescheduled" &&
                            event.original_date && (
                              <div className="text-xs text-gray-500 mb-1">
                                <span className="line-through">
                                  Originally:{" "}
                                  {new Date(
                                    event.original_date
                                  ).toLocaleDateString()}
                                </span>
                              </div>
                            )}

                          <div className="text-sm text-gray-600 mb-2">
                            <div className="flex items-center mb-1">
                              <FaCalendarAlt className="mr-1" size={14} />
                              <span>{formatEventDate(event.date)}</span>
                            </div>
                            <div className="flex items-center">
                              <FaMapMarkerAlt className="mr-1" size={14} />
                              <span>
                                {event.venue}, {event.city}
                              </span>
                              {event.distance && (
                                <span className="ml-2 text-xs bg-gray-200 px-2 py-1 rounded-full">
                                  {event.distance} km away
                                </span>
                              )}
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
                          {event.status === "rescheduled" && (
                            <div className="mt-2 bg-yellow-100 border border-yellow-300 text-yellow-800 text-xs font-semibold text-center py-1 rounded">
                              Rescheduled Event
                            </div>
                          )}
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
          {/* Header with category name and results count */}
          <div className="bg-gray-100 -mx-4 px-4 py-3 mb-6 border-t border-b border-gray-200">
            <h2 className="text-2xl font-bold flex items-center">
              <span className="uppercase">{category.name} EVENTS</span>
              <span className="mx-3">•</span>
              <span className="text-xl font-semibold">
                {totalEvents} RESULTS
              </span>
            </h2>
          </div>

          {displayedEvents.length === 0 ? (
            <div className="text-center py-12">
              <h2 className="text-xl font-semibold mb-2">
                No events available in this category
              </h2>
              <p className="text-gray-500">
                Check back later for updates or try another category.
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              {displayedEvents.map((event) => (
                <div
                  key={event.id}
                  className={`bg-white border border-gray-200 hover:bg-gray-50 transition-colors rounded-md overflow-hidden relative ${
                    event.status === "rescheduled"
                      ? "border-l-4 border-l-yellow-500"
                      : ""
                  }`}
                >
                  <Link
                    to={`/events/${event.id}`}
                    className="block py-4 px-6"
                    onClick={() => searchService.addToRecentlyViewed(event)}
                  >
                    <div className="flex items-start">
                      {/* Date Display */}
                      <div className="text-center mr-6">
                        <div className="text-sm font-bold uppercase text-gray-600">
                          {new Date(event.date)
                            .toLocaleDateString("en-US", { month: "short" })
                            .toUpperCase()}
                        </div>
                        <div className="text-3xl font-bold">
                          {new Date(event.date)
                            .getDate()
                            .toString()
                            .padStart(2, "0")}
                        </div>
                      </div>

                      {/* Event Details */}
                      <div className="flex-grow">
                        {/* Show original date for rescheduled events */}
                        {event.status === "rescheduled" &&
                          event.original_date && (
                            <div className="text-xs text-gray-500 mb-1">
                              <span className="line-through">
                                Originally:{" "}
                                {new Date(
                                  event.original_date
                                ).toLocaleDateString("en-US", {
                                  month: "short",
                                  day: "numeric",
                                })}
                                {event.original_time &&
                                  ` at ${formatEventTime(event.original_time)}`}
                              </span>
                            </div>
                          )}

                        <div className="mb-1">
                          <div className="flex items-center text-gray-600 text-sm">
                            <div className="flex items-center">
                              <span>
                                {new Date(event.date).toLocaleDateString(
                                  "en-US",
                                  {
                                    weekday: "short",
                                  }
                                )}{" "}
                                • {formatEventTime(event.time)}
                              </span>
                              {event.status === "rescheduled" && (
                                <div className="ml-3 bg-yellow-100 border border-yellow-300 text-yellow-800 text-xs font-medium px-2 py-0.5 rounded-sm">
                                  Rescheduled
                                </div>
                              )}
                            </div>
                            <FaInfoCircle
                              className="ml-1 text-gray-400"
                              size={14}
                            />
                          </div>
                        </div>
                        <h3 className="text-lg font-bold text-gray-800 mb-1">
                          {event.name}
                        </h3>
                        <div className="text-gray-600">
                          {event.city}
                          {event.venue ? `, ${event.venue}` : ""}
                          {event.distance && (
                            <span className="ml-2 bg-purple-100 text-purple-800 text-xs px-2 py-0.5 rounded">
                              {event.distance} km away
                            </span>
                          )}
                        </div>
                      </div>

                      {/* Find Tickets Button */}
                      <div className="ml-auto flex items-center">
                        <span className="bg-purple-600 hover:bg-purple-700 text-white px-4 py-2 rounded inline-flex items-center">
                          Find Tickets
                          <FaExternalLinkAlt className="ml-2" size={12} />
                        </span>
                      </div>
                    </div>
                  </Link>
                </div>
              ))}
            </div>
          )}

          {/* Pagination UI that matches the provided image */}
          {displayedEvents.length > 0 && (
            <div className="mt-8 text-center">
              <div className="text-sm text-gray-500 mb-2">
                Loaded {loadedEvents} out of {totalEvents} events
              </div>

              {/* Progress bar */}
              <div className="w-full max-w-md mx-auto bg-gray-300 h-1 rounded-full mb-4">
                <div
                  className="bg-gray-600 h-1 rounded-full"
                  style={{ width: `${(loadedEvents / totalEvents) * 100}%` }}
                ></div>
              </div>

              {/* Only show button if there are more events to load */}
              {loadedEvents < totalEvents && (
                <button
                  onClick={loadMoreEvents}
                  disabled={loadingMore}
                  className="border border-gray-700 rounded-full px-8 py-2 text-sm font-medium flex items-center mx-auto hover:bg-gray-50"
                >
                  {loadingMore ? (
                    <span className="flex items-center">
                      <div className="animate-spin h-4 w-4 border-t-2 border-gray-800 border-r-2 rounded-full mr-2"></div>
                      Loading...
                    </span>
                  ) : (
                    <>
                      More Events <FaChevronDown className="ml-2" />
                    </>
                  )}
                </button>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
