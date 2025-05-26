// src/pages/EventDetails.jsx
import { useState, useEffect } from "react";
import { useParams, Link, useNavigate } from "react-router-dom";
import {
  FaMapMarkerAlt,
  FaCalendarAlt,
  FaClock,
  FaTicketAlt,
  FaStar,
  FaStarHalfAlt,
  FaRegStar,
  FaShare,
  FaHeart,
  FaInfoCircle,
  FaMapMarked,
  FaLock,
} from "react-icons/fa";
import api from "../services/api";
import { useAuth } from "../hooks/useAuth";
import EventMap from "../components/event/EventMap";
import EventReviews from "../components/event/EventReviews";
import RelatedEvents from "../components/event/RelatedEvents";
import TicketSelector from "../components/event/TicketSelector";
import EventGallery from "../components/event/EventGallery";
import LoadingSpinner from "../components/ui/LoadingSpinner.jsx";
import ErrorMessage from "../components/ui/ErrorMessage.jsx";

const EventDetails = () => {
  const [event, setEvent] = useState(null);
  const [ticketTypes, setTicketTypes] = useState([]);
  const [reviews, setReviews] = useState({
    items: [],
    count: 0,
    averageRating: 0,
  });
  const [relatedEvents, setRelatedEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [activeTab, setActiveTab] = useState("details");
  const [selectedTickets, setSelectedTickets] = useState({});
  const [totalPrice, setTotalPrice] = useState(0);

  const { id } = useParams();
  const { user } = useAuth();
  const navigate = useNavigate();

  // Either remove the user variable if not needed:
  // const { user } = useAuth(); -> remove this line

  // Or use it somewhere to fix the warning:
  useEffect(() => {
    if (user) {
      // Maybe check if user has already reviewed this event
      // or if user is the owner of the event
      console.log("User logged in:", user.name);
    }
  }, [user]);

  // In EventDetails.jsx, verify that ticket types are being fetched correctly
  useEffect(() => {
    const fetchEventDetails = async () => {
      try {
        setLoading(true);
        setError(null);

        const response = await api.get(`/events/${id}`);
        setEvent(response.data.event);

        // Log ticket types to debug
        console.log("Ticket types:", response.data.ticketTypes);
        setTicketTypes(response.data.ticketTypes || []);

        setReviews(
          response.data.reviews || { items: [], count: 0, averageRating: 0 }
        );
        setRelatedEvents(response.data.relatedEvents || []);

        // Track event view
        await api.post(`/events/${id}/view`);
      } catch (err) {
        console.error("Error fetching event details:", err);
        setError("Could not load event details. Please try again later.");
      } finally {
        setLoading(false);
      }
    };

    fetchEventDetails();
  }, [id]);

  // Calculate total price when selected tickets change
  useEffect(() => {
    let total = 0;
    for (const [ticketTypeId, quantity] of Object.entries(selectedTickets)) {
      const ticketType = ticketTypes.find(
        (t) => t.id === parseInt(ticketTypeId)
      );
      if (ticketType) {
        total += ticketType.price * quantity;
      }
    }
    setTotalPrice(total);
  }, [selectedTickets, ticketTypes]);

  const handleTicketChange = (ticketTypeId, quantity) => {
    if (quantity === 0) {
      const newSelected = { ...selectedTickets };
      delete newSelected[ticketTypeId];
      setSelectedTickets(newSelected);
    } else {
      setSelectedTickets({
        ...selectedTickets,
        [ticketTypeId]: quantity,
      });
    }
  };

  const handleCheckout = () => {
    // Store selected tickets in session storage to use in checkout
    const ticketsData = Object.entries(selectedTickets).map(
      ([typeId, quantity]) => {
        const ticketType = ticketTypes.find((t) => t.id === parseInt(typeId));
        return {
          ticketTypeId: parseInt(typeId),
          quantity,
          name: ticketType.name,
          price: ticketType.price,
          eventId: event.id,
          eventName: event.name,
        };
      }
    );

    sessionStorage.setItem("checkoutTickets", JSON.stringify(ticketsData));
    sessionStorage.setItem("eventId", event.id);

    // Navigate to checkout
    navigate("/checkout");
  };

  // Format date and time for display
  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString("en-US", {
      weekday: "long",
      year: "numeric",
      month: "long",
      day: "numeric",
    });
  };

  const formatTime = (timeString) => {
    if (!timeString) return "";
    const [hours, minutes] = timeString.split(":");
    const hour = parseInt(hours, 10);
    const ampm = hour >= 12 ? "PM" : "AM";
    const formattedHour = hour % 12 || 12;
    return `${formattedHour}:${minutes} ${ampm}`;
  };

  // Render rating stars
  const renderStarRating = (rating) => {
    const stars = [];
    const fullStars = Math.floor(rating);
    const hasHalfStar = rating - fullStars >= 0.5;

    for (let i = 1; i <= 5; i++) {
      if (i <= fullStars) {
        stars.push(<FaStar key={i} className="text-yellow-500" />);
      } else if (i === fullStars + 1 && hasHalfStar) {
        stars.push(<FaStarHalfAlt key={i} className="text-yellow-500" />);
      } else {
        stars.push(<FaRegStar key={i} className="text-yellow-500" />);
      }
    }

    return stars;
  };

  if (loading) {
    return <LoadingSpinner />;
  }

  if (error) {
    return <ErrorMessage message={error} />;
  }

  if (!event) {
    return (
      <div className="container mx-auto px-4 py-12 text-center">
        <h1 className="text-3xl font-bold mb-4">Event Not Found</h1>
        <p className="text-gray-600 mb-8">
          The event you're looking for doesn't exist or has been removed.
        </p>
        <Link
          to="/"
          className="bg-purple-600 text-white px-6 py-3 rounded-md hover:bg-purple-700"
        >
          Back to Homepage
        </Link>
      </div>
    );
  }

  return (
    <div className="bg-gray-100 min-h-screen pb-12">
      {/* Event Hero Section */}
      <div
        className="w-full h-96 bg-cover bg-center relative"
        style={{
          backgroundImage: `linear-gradient(rgba(0, 0, 0, 0.5), rgba(0, 0, 0, 0.7)), url(${event.image_url})`,
        }}
      >
        <div className="container mx-auto px-4 h-full flex flex-col justify-end pb-16">
          <div className="text-white mb-4">
            <div className="flex items-center mb-2">
              <div className="bg-purple-600 text-white text-sm font-medium px-3 py-1 rounded-full">
                {event.category_name}
              </div>
              {event.subcategory_name && (
                <div className="ml-2 bg-blue-600 text-white text-sm font-medium px-3 py-1 rounded-full">
                  {event.subcategory_name}
                </div>
              )}
              {event.status === "rescheduled" && (
                <div className="ml-2 bg-yellow-500 text-white text-sm font-medium px-3 py-1 rounded-full">
                  Rescheduled
                </div>
              )}
            </div>
            <h1 className="text-4xl sm:text-5xl font-bold mb-3">
              {event.name}
            </h1>
            <div className="flex items-center flex-wrap">
              <div className="flex flex-col mr-6 mb-2">
                <div className="flex items-center">
                  <FaCalendarAlt className="mr-2" />
                  {formatDate(event.date)}
                </div>
                {/* Add this for rescheduled events */}
                {event.status === "rescheduled" && event.original_date && (
                  <div className="text-yellow-300 text-sm mt-1 flex items-center">
                    <span className="line-through mr-1">
                      Originally: {formatDate(event.original_date)}
                    </span>
                  </div>
                )}
              </div>

              <div className="flex flex-col mr-6 mb-2">
                <div className="flex items-center">
                  <FaClock className="mr-2" />
                  {formatTime(event.time)}
                  {event.end_time && ` - ${formatTime(event.end_time)}`}
                </div>
                {/* Add this for rescheduled events */}
                {event.status === "rescheduled" && event.original_time && (
                  <div className="text-yellow-300 text-sm mt-1 flex items-center">
                    <span className="line-through mr-1">
                      Originally: {formatTime(event.original_time)}
                    </span>
                  </div>
                )}
              </div>

              <div className="flex items-center mb-2">
                <FaMapMarkerAlt className="mr-2" />
                {event.venue}, {event.city}
              </div>
            </div>
          </div>

          <div className="flex items-center">
            {reviews.count > 0 && (
              <div className="flex items-center mr-6">
                <div className="flex items-center mr-2">
                  {renderStarRating(reviews.averageRating)}
                </div>
                <span className="text-white">
                  {reviews.averageRating} ({reviews.count} reviews)
                </span>
              </div>
            )}
          </div>
        </div>
      </div>

      <div className="container mx-auto px-4 py-8">
        <div className="flex flex-col lg:flex-row gap-8">
          {/* Main Content */}
          <div className="flex-grow lg:w-2/3">
            {/* Tabs */}
            <div className="mb-6 border-b border-gray-300">
              <div className="flex">
                <button
                  className={`px-6 py-3 font-medium ${
                    activeTab === "details"
                      ? "text-purple-600 border-b-2 border-purple-600"
                      : "text-gray-600 hover:text-gray-900"
                  }`}
                  onClick={() => setActiveTab("details")}
                >
                  Details
                </button>
                <button
                  className={`px-6 py-3 font-medium ${
                    activeTab === "reviews"
                      ? "text-purple-600 border-b-2 border-purple-600"
                      : "text-gray-600 hover:text-gray-900"
                  }`}
                  onClick={() => setActiveTab("reviews")}
                >
                  Reviews ({reviews.count})
                </button>
                <button
                  className={`px-6 py-3 font-medium ${
                    activeTab === "location"
                      ? "text-purple-600 border-b-2 border-purple-600"
                      : "text-gray-600 hover:text-gray-900"
                  }`}
                  onClick={() => setActiveTab("location")}
                >
                  Location
                </button>
              </div>
            </div>

            {/* Tab Content */}
            {activeTab === "details" && (
              <div>
                <h2 className="text-2xl font-bold mb-4">About this event</h2>
                <div className="prose max-w-none mb-8">
                  <p className="text-gray-700 whitespace-pre-line">
                    {event.description}
                  </p>
                </div>

                {event.status === "rescheduled" && (
                  <div className="mt-6 mb-6 bg-yellow-50 border border-yellow-200 rounded-md p-4">
                    <h3 className="text-lg font-bold text-yellow-700 mb-2">
                      Rescheduled Event
                    </h3>
                    <p className="text-yellow-700">
                      This event has been rescheduled from its original date of{" "}
                      <span className="font-medium">
                        {formatDate(event.original_date)}
                      </span>
                      {event.original_time &&
                        ` at ${formatTime(event.original_time)}`}
                      .
                    </p>
                    {event.status_change_reason && (
                      <p className="text-yellow-700 mt-2">
                        <span className="font-medium">Reason:</span>{" "}
                        {event.status_change_reason}
                      </p>
                    )}
                  </div>
                )}

                <EventGallery
                  mainImage={event.image_url}
                  imagePlaceholder="/api/placeholder/800/600?text=Event"
                />

                {event.cancellation_policy && (
                  <div className="mt-8">
                    <h3 className="text-lg font-bold mb-2 flex items-center">
                      <FaInfoCircle className="mr-2 text-purple-600" />{" "}
                      Cancellation Policy
                    </h3>
                    <div className="bg-purple-50 p-4 rounded-md border border-purple-100">
                      <p className="text-purple-800">
                        {event.cancellation_policy}
                      </p>
                    </div>
                  </div>
                )}
              </div>
            )}

            {activeTab === "reviews" && (
              <EventReviews
                reviews={reviews}
                eventId={event.id}
                onReviewAdded={(updatedReviews) => {
                  setReviews(updatedReviews);
                }}
              />
            )}

            {activeTab === "location" && (
              <div>
                <h2 className="text-2xl font-bold mb-4">Event Location</h2>
                <div className="mb-4">
                  <div className="flex items-start mb-2">
                    <FaMapMarkerAlt className="text-purple-600 mt-1 mr-2" />
                    <div>
                      <h3 className="font-bold">{event.venue}</h3>
                      <p className="text-gray-700">{event.address}</p>
                      <p className="text-gray-700">{event.city}</p>
                    </div>
                  </div>
                  <a
                    href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(
                      `${event.venue} ${event.address} ${event.city}`
                    )}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-purple-600 hover:text-purple-800 font-medium inline-flex items-center"
                  >
                    <FaMapMarked className="mr-1" /> View on Google Maps
                  </a>
                </div>

                <EventMap
                  latitude={event.latitude}
                  longitude={event.longitude}
                  venue={event.venue}
                  address={event.address}
                />
              </div>
            )}

            {/* Related Events */}
            {relatedEvents.length > 0 && (
              <div className="mt-12">
                <h2 className="text-2xl font-bold mb-6">You might also like</h2>
                <RelatedEvents events={relatedEvents} />
              </div>
            )}
          </div>

          {/* Ticket Sidebar */}
          <div className="lg:w-1/3">
            <div className="bg-white rounded-lg shadow-md p-6 sticky top-6">
              <h2 className="text-xl font-bold mb-4 flex items-center">
                <FaTicketAlt className="mr-2 text-purple-600" /> Tickets
              </h2>

              {ticketTypes.length === 0 ? (
                <div className="text-center py-8 text-gray-500">
                  <FaTicketAlt
                    className="mx-auto mb-4 text-gray-300"
                    size={40}
                  />
                  <p>Tickets are not yet available for this event.</p>
                  <p>Check back later!</p>
                </div>
              ) : (
                <>
                  <TicketSelector
                    ticketTypes={ticketTypes}
                    onTicketChange={handleTicketChange}
                    selectedTickets={selectedTickets}
                  />

                  {totalPrice > 0 && (
                    <div className="mt-6">
                      <div className="flex justify-between font-bold text-lg mb-4">
                        <span>Total:</span>
                        <span>${totalPrice.toFixed(2)}</span>
                      </div>

                      <button
                        onClick={handleCheckout}
                        className="w-full bg-purple-600 hover:bg-purple-700 text-white font-bold py-3 px-4 rounded-md flex items-center justify-center"
                      >
                        <FaLock className="mr-2" /> Proceed to Checkout
                      </button>

                      <p className="text-xs text-gray-500 mt-2 text-center">
                        Secure checkout powered by Stripe
                      </p>
                    </div>
                  )}
                </>
              )}

              <div className="mt-6 border-t border-gray-200 pt-4">
                <h3 className="font-bold mb-2">Event Information</h3>

                {/* Add this rescheduling notice */}
                {event.status === "rescheduled" && (
                  <div className="bg-yellow-50 border border-yellow-200 rounded-md p-3 mb-3">
                    <p className="text-sm text-yellow-700 font-medium">
                      This event has been rescheduled
                    </p>
                  </div>
                )}

                <div className="space-y-2 text-sm">
                  <div className="flex">
                    <span className="font-medium w-24">Date:</span>
                    <span>{formatDate(event.date)}</span>
                  </div>
                  <div className="flex">
                    <span className="font-medium w-24">Time:</span>
                    <span>
                      {formatTime(event.time)}
                      {event.end_time && ` - ${formatTime(event.end_time)}`}
                    </span>
                  </div>
                  <div className="flex">
                    <span className="font-medium w-24">Venue:</span>
                    <span>{event.venue}</span>
                  </div>
                  <div className="flex">
                    <span className="font-medium w-24">Address:</span>
                    <span>
                      {event.address}, {event.city}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default EventDetails;
