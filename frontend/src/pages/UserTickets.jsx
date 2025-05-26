// src/pages/UserTickets.jsx
import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import {
  FaTicketAlt,
  FaCalendarAlt,
  FaMapMarkerAlt,
  FaClock,
  FaChevronDown,
  FaChevronUp,
  FaDownload,
  FaExclamationTriangle,
  FaCheckCircle,
  FaTimesCircle,
  FaSpinner,
  FaTimes,
  FaInfoCircle,
  FaBan,
  FaSync,
  FaExchangeAlt,
} from "react-icons/fa";
import { TicketExchangeModal } from "../components/ticket/TicketExchangeModal";
import { useAuth } from "../hooks/useAuth";
import api from "../services/api";

// Refund Modal Component
export function TicketRefundModal({
  ticket,
  event,
  onClose,
  onConfirm,
  isSubmitting,
}) {
  // Format date
  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString("en-US", {
      year: "numeric",
      month: "long",
      day: "numeric",
    });
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg max-w-md w-full p-6 max-h-[90vh] overflow-y-auto">
        <div className="flex justify-between items-start mb-4">
          <h2 className="text-xl font-bold">Confirm Ticket Cancellation</h2>
          <button
            onClick={onClose}
            className="text-gray-500 hover:text-gray-700"
          >
            <FaTimesCircle />
          </button>
        </div>

        <div className="mb-6">
          <h3 className="font-bold mb-2">Ticket Details</h3>
          <p>
            <span className="font-medium">Event:</span> {event.eventName}
          </p>
          <p>
            <span className="font-medium">Ticket Type:</span>{" "}
            {ticket.ticket_type_name}
          </p>
          <p>
            <span className="font-medium">Price:</span> $
            {parseFloat(ticket.price).toFixed(2)}
          </p>
          <p>
            <span className="font-medium">Purchase Date:</span>{" "}
            {formatDate(ticket.purchase_date)}
          </p>
        </div>

        <div className="bg-blue-50 p-4 rounded mb-6 flex">
          <FaInfoCircle className="text-blue-500 mt-1 mr-3 flex-shrink-0" />
          <div>
            <p className="text-blue-800 text-sm">
              {event.cancellation_policy ||
                "According to the cancellation policy, tickets can be refunded up to 7 days before the event date. Within 7 days of the event, refunds will only be issued in exceptional circumstances."}
            </p>
          </div>
        </div>

        <div className="flex space-x-3 justify-end">
          <button
            onClick={onClose}
            className="bg-gray-300 hover:bg-gray-400 px-4 py-2 rounded"
          >
            Cancel
          </button>
          <button
            onClick={onConfirm}
            disabled={isSubmitting}
            className={`bg-red-600 text-white px-4 py-2 rounded ${
              isSubmitting
                ? "opacity-70 cursor-not-allowed"
                : "hover:bg-red-700"
            }`}
          >
            {isSubmitting ? (
              <>
                <FaSpinner className="inline mr-2 animate-spin" />
                Processing...
              </>
            ) : (
              "Confirm Cancellation"
            )}
          </button>
        </div>
      </div>
    </div>
  );
}

export default function UserTickets() {
  const [tickets, setTickets] = useState([]);
  const [pastTickets, setPastTickets] = useState([]);
  const [cancelledTickets, setCancelledTickets] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [activeTab, setActiveTab] = useState("upcoming");
  const [expandedEvents, setExpandedEvents] = useState({});
  const [cancellingTicket, setCancellingTicket] = useState(null);
  const [cancellationError, setCancellationError] = useState(null);
  const [cancellationSuccess, setCancellationSuccess] = useState(null);
  const [showRefundModal, setShowRefundModal] = useState(false);
  const [selectedTicket, setSelectedTicket] = useState(null);
  const [selectedEvent, setSelectedEvent] = useState(null);

  // Exchange state variables
  const [showExchangeModal, setShowExchangeModal] = useState(false);
  const [availableTicketTypes, setAvailableTicketTypes] = useState([]);
  const [exchangeError, setExchangeError] = useState(null);
  const [exchangeSuccess, setExchangeSuccess] = useState(null);
  const [exchangingTicket, setExchangingTicket] = useState(null);

  const { user } = useAuth();

  useEffect(() => {
    const fetchTickets = async () => {
      try {
        setLoading(true);
        setError(null);

        // Fetch upcoming, past, and cancelled tickets
        const upcomingResponse = await api.get("/tickets/upcoming");
        const pastResponse = await api.get("/tickets/past");
        const cancelledResponse = await api.get("/tickets/cancelled");

        setTickets(upcomingResponse.data.data || []);
        setPastTickets(pastResponse.data.data || []);
        setCancelledTickets(cancelledResponse.data.data || []);
      } catch (err) {
        console.error("Error fetching tickets:", err);
        setError("Could not load your tickets. Please try again later.");
      } finally {
        setLoading(false);
      }
    };

    if (user) {
      fetchTickets();
    }
  }, [user]);

  // Toggle expanded state for event
  const toggleExpanded = (eventId) => {
    setExpandedEvents((prev) => ({
      ...prev,
      [eventId]: !prev[eventId],
    }));
  };

  // Format date for display
  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString("en-US", {
      weekday: "long",
      year: "numeric",
      month: "long",
      day: "numeric",
    });
  };

  // Format time for display
  const formatTime = (timeString) => {
    if (!timeString) return "";
    const [hours, minutes] = timeString.split(":");
    const hour = parseInt(hours, 10);
    const ampm = hour >= 12 ? "PM" : "AM";
    const formattedHour = hour % 12 || 12;
    return `${formattedHour}:${minutes} ${ampm}`;
  };

  // Handle ticket download
  const downloadTicket = (ticket, eventName) => {
    // Create a canvas element to draw the ticket
    const canvas = document.createElement("canvas");
    const ctx = canvas.getContext("2d");
    canvas.width = 800;
    canvas.height = 400;

    // Draw background
    ctx.fillStyle = "#8B5CF6"; // Purple background
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // Add ticket border
    ctx.strokeStyle = "white";
    ctx.lineWidth = 3;
    ctx.strokeRect(10, 10, canvas.width - 20, canvas.height - 20);

    // Add event title
    ctx.font = "bold 36px Arial";
    ctx.fillStyle = "white";
    ctx.textAlign = "center";
    ctx.fillText(eventName, canvas.width / 2, 70);

    // Add ticket info
    ctx.font = "20px Arial";
    ctx.textAlign = "left";
    ctx.fillText(`Ticket Type: ${ticket.ticket_type_name}`, 50, 150);
    ctx.fillText(`Price: $${parseFloat(ticket.price).toFixed(2)}`, 50, 190);
    ctx.fillText(`Ticket ID: ${ticket.id}`, 50, 230);

    // Draw QR code (assuming it's available)
    if (ticket.qr_code) {
      const qrImage = new Image();
      qrImage.onload = () => {
        ctx.drawImage(qrImage, 500, 120, 200, 200);

        // Convert canvas to image and download
        const link = document.createElement("a");
        link.download = `ticket-${ticket.id}.png`;
        link.href = canvas.toDataURL("image/png");
        link.click();
      };
      qrImage.src = ticket.qr_code;
    } else {
      // If no QR code, just download without it
      const link = document.createElement("a");
      link.download = `ticket-${ticket.id}.png`;
      link.href = canvas.toDataURL("image/png");
      link.click();
    }
  };

  const refreshTickets = async () => {
    try {
      setLoading(true);
      setCancellationError(null);
      setCancellationSuccess(null);
      setExchangeError(null);
      setExchangeSuccess(null);

      // Fetch updated ticket data
      const cancelledResponse = await api.get("/tickets/cancelled");
      setCancelledTickets(cancelledResponse.data.data || []);

      // Also refresh other tickets if needed
      const upcomingResponse = await api.get("/tickets/upcoming");
      const pastResponse = await api.get("/tickets/past");

      setTickets(upcomingResponse.data.data || []);
      setPastTickets(pastResponse.data.data || []);
    } catch (err) {
      console.error("Error refreshing tickets:", err);
      setError("Could not refresh your tickets. Please try again later.");
    } finally {
      setLoading(false);
    }
  };

  // Open the refund modal
  const openRefundModal = (ticket, event) => {
    setSelectedTicket(ticket);
    setSelectedEvent(event);
    setShowRefundModal(true);
  };

  // Close the refund modal
  const closeRefundModal = () => {
    setShowRefundModal(false);
    setSelectedTicket(null);
    setSelectedEvent(null);
  };

  // Handle ticket cancellation request
  const handleCancelTicket = async () => {
    if (!selectedTicket) return;

    try {
      setCancellingTicket(selectedTicket.id);
      setCancellationError(null);
      setCancellationSuccess(null);

      // Make the refund request
      const response = await api.post(`/tickets/${selectedTicket.id}/refund`);
      console.log("Refund response:", response.data);

      setCancellationSuccess(
        "Your ticket has been cancelled and a refund will be processed."
      );

      // Remove the ticket from upcoming tickets
      setTickets((prevTickets) =>
        prevTickets.filter((eventGroup) => {
          // Keep event groups that don't have this ticket
          if (
            !eventGroup.tickets.some(
              (ticket) => ticket.id === selectedTicket.id
            )
          ) {
            return true;
          }

          // For event groups with this ticket, filter it out
          const updatedTickets = eventGroup.tickets.filter(
            (ticket) => ticket.id !== selectedTicket.id
          );

          // Keep event group only if it still has tickets
          return updatedTickets.length > 0;
        })
      );

      // Refresh cancelled tickets
      const cancelledResponse = await api.get("/tickets/cancelled");
      setCancelledTickets(cancelledResponse.data.data || []);

      // Close the modal
      closeRefundModal();
    } catch (err) {
      console.error("Error cancelling ticket:", err);
      setCancellationError(
        err.response?.data?.error ||
          "Could not cancel the ticket. Please try again later."
      );
      closeRefundModal();
    } finally {
      setCancellingTicket(null);
    }
  };

  // Open the exchange modal
  const openExchangeModal = async (ticket, event) => {
    setSelectedTicket(ticket);
    setSelectedEvent(event);
    setExchangeError(null);

    // Fetch available ticket types for the event
    try {
      const response = await api.get(`/events/${event.eventId}/ticket-types`);

      // Filter out the current ticket type and sold out ticket types
      const availableTypes = response.data.data.filter(
        (type) =>
          type.id !== ticket.ticket_type_id && type.available_quantity > 0
      );

      setAvailableTicketTypes(availableTypes);
      setShowExchangeModal(true);
    } catch (err) {
      console.error("Error fetching ticket types:", err);
      setExchangeError(
        "Could not load available ticket types for exchange. Please try again later."
      );
    }
  };

  // Close the exchange modal
  const closeExchangeModal = () => {
    setShowExchangeModal(false);
    setSelectedTicket(null);
    setSelectedEvent(null);
    setAvailableTicketTypes([]);
  };

  // Handle ticket exchange
  const handleExchangeTicket = async (newTicketType, responseData) => {
    if (!selectedTicket || !newTicketType) return;

    try {
      setExchangingTicket(selectedTicket.id);
      setExchangeError(null);
      setExchangeSuccess(null);

      // The exchange has already been processed by the modal
      // Just handle the response message
      const paymentMethod = responseData.data?.paymentMethod;

      setExchangeSuccess(
        `Your ticket has been exchanged successfully to ${newTicketType.name}. ` +
          (parseFloat(newTicketType.price) > parseFloat(selectedTicket.price)
            ? `Your payment ${
                paymentMethod === "card" ? "by card" : "with credits"
              } for the difference has been processed.`
            : parseFloat(newTicketType.price) < parseFloat(selectedTicket.price)
            ? "A credit has been issued to your account."
            : "")
      );

      // Refresh tickets
      await refreshTickets();

      // Close the modal
      closeExchangeModal();
    } catch (err) {
      console.error("Error exchanging ticket:", err);
      setExchangeError(
        err.response?.data?.error ||
          "Could not exchange the ticket. Please try again later."
      );
      closeExchangeModal();
    } finally {
      setExchangingTicket(null);
    }
  };

  // Render the ticket list for an event
  const renderTicketList = (
    eventGroup,
    isPast = false,
    isCancelled = false
  ) => {
    const isExpanded = expandedEvents[eventGroup.eventId] || false;

    return (
      <div
        key={eventGroup.eventId}
        className="bg-white rounded-lg shadow-md overflow-hidden mb-6"
      >
        {/* Event header */}
        <div className="p-4 border-b border-gray-200 flex justify-between items-center">
          <div className="flex items-start">
            <div className="w-16 h-16 bg-gray-200 rounded overflow-hidden mr-4 flex-shrink-0">
              {eventGroup.eventImage && (
                <img
                  src={eventGroup.eventImage}
                  alt={eventGroup.eventName}
                  className="w-full h-full object-cover"
                />
              )}
            </div>

            <div>
              <h3 className="text-lg font-bold">{eventGroup.eventName}</h3>
              <div className="text-sm text-gray-600">
                <div className="flex items-center mb-1">
                  <FaCalendarAlt className="mr-1" size={12} />
                  {formatDate(eventGroup.eventDate)}
                </div>
                <div className="flex items-center">
                  <FaClock className="mr-1" size={12} />
                  {formatTime(eventGroup.eventTime)}
                </div>
              </div>
            </div>
          </div>

          <button
            onClick={() => toggleExpanded(eventGroup.eventId)}
            className="text-purple-600 focus:outline-none"
          >
            {isExpanded ? <FaChevronUp /> : <FaChevronDown />}
          </button>
        </div>

        {/* Ticket details (expandable) */}
        {isExpanded && (
          <div className="p-4">
            <div className="flex items-center mb-4">
              <FaMapMarkerAlt className="text-gray-500 mr-2" />
              <span>{eventGroup.eventVenue}</span>
            </div>

            <h4 className="font-bold mb-3">Your Tickets</h4>

            <div className="space-y-4">
              {eventGroup.tickets.map((ticket) => (
                <div
                  key={ticket.id}
                  className={`border rounded-lg p-4 ${
                    ticket.status === "cancelled"
                      ? "bg-red-50 border-red-200"
                      : ticket.checked_in
                      ? "bg-green-50 border-green-200"
                      : "border-gray-200"
                  }`}
                >
                  <div className="flex justify-between mb-3">
                    <div>
                      <span className="font-medium">
                        {ticket.ticket_type_name}
                      </span>
                      <div className="text-sm text-gray-600">
                        ${parseFloat(ticket.price).toFixed(2)}
                      </div>
                    </div>
                    <div>
                      {ticket.status === "cancelled" ? (
                        <span className="px-2 py-1 bg-red-100 text-red-800 text-xs font-medium rounded-full">
                          Cancelled
                        </span>
                      ) : ticket.checked_in ? (
                        <span className="px-2 py-1 bg-green-100 text-green-800 text-xs font-medium rounded-full">
                          Used
                        </span>
                      ) : isPast ? (
                        <span className="px-2 py-1 bg-gray-100 text-gray-800 text-xs font-medium rounded-full">
                          Expired
                        </span>
                      ) : (
                        <span className="px-2 py-1 bg-purple-100 text-purple-800 text-xs font-medium rounded-full">
                          Valid
                        </span>
                      )}
                    </div>
                  </div>

                  {/* QR Code (not shown for cancelled tickets) */}
                  {ticket.qr_code &&
                    ticket.status !== "cancelled" &&
                    !isCancelled && (
                      <div className="flex flex-col items-center my-4">
                        <img
                          src={ticket.qr_code}
                          alt="Ticket QR Code"
                          className="max-w-xs h-auto"
                        />
                        <div className="text-xs text-gray-500 mt-2">
                          Scan this QR code at the event for entry
                        </div>
                      </div>
                    )}

                  {/* Cancelled notice */}
                  {(ticket.status === "cancelled" || isCancelled) && (
                    <div className="bg-red-100 text-red-800 p-3 rounded-md flex items-start my-3">
                      <FaExclamationTriangle className="mr-2 mt-1 flex-shrink-0" />
                      <div>
                        <p className="font-medium">
                          This ticket has been cancelled
                        </p>

                        {/* Add a more prominent refund status display */}
                        <div className="mt-2 mb-2">
                          <span
                            className={`px-2 py-1 text-xs font-medium rounded-full 
                              ${
                                ticket.refund_status === "completed"
                                  ? "bg-green-100 text-green-800"
                                  : ticket.refund_status === "processing"
                                  ? "bg-blue-100 text-blue-800"
                                  : ticket.refund_status === "failed"
                                  ? "bg-red-100 text-red-800"
                                  : ticket.refund_status === "denied"
                                  ? "bg-gray-100 text-gray-800"
                                  : "bg-yellow-100 text-yellow-800"
                              }`}
                          >
                            Refund:{" "}
                            {ticket.refund_status
                              ? ticket.refund_status.charAt(0).toUpperCase() +
                                ticket.refund_status.slice(1)
                              : "Requested"}
                          </span>
                        </div>

                        <p className="text-sm">
                          {ticket.refund_status === "completed"
                            ? "Your refund has been processed successfully and credited to your account."
                            : ticket.refund_status === "processing"
                            ? "Your refund is being processed and may take 5-7 business days."
                            : ticket.refund_status === "failed"
                            ? "There was an issue with your refund. Please contact support."
                            : ticket.refund_status === "denied"
                            ? "Your refund request was denied. Please contact support for more information."
                            : "The refund may take 5-7 business days to process."}
                        </p>
                        {ticket.cancelled_at && (
                          <p className="text-xs text-gray-600 mt-1">
                            Cancelled on{" "}
                            {new Date(ticket.cancelled_at).toLocaleString()}
                          </p>
                        )}
                      </div>
                    </div>
                  )}

                  {/* Checked-in notice */}
                  {ticket.checked_in && (
                    <div className="bg-green-100 text-green-800 p-3 rounded-md flex items-start my-3">
                      <FaCheckCircle className="mr-2 mt-1 flex-shrink-0" />
                      <div>
                        <p className="font-medium">Ticket has been used</p>
                        {ticket.checked_in_at && (
                          <p className="text-sm">
                            Checked in on{" "}
                            {new Date(ticket.checked_in_at).toLocaleString()}
                          </p>
                        )}
                      </div>
                    </div>
                  )}

                  {/* Ticket actions */}
                  {ticket.status !== "cancelled" &&
                    !ticket.checked_in &&
                    !isPast &&
                    !isCancelled && (
                      <div className="mt-4 flex flex-wrap gap-2">
                        <button
                          onClick={() =>
                            downloadTicket(ticket, eventGroup.eventName)
                          }
                          className="bg-purple-600 text-white px-3 py-1 rounded-md text-sm flex items-center hover:bg-purple-700"
                        >
                          <FaDownload className="mr-1" size={12} />
                          Download
                        </button>
                        <button
                          onClick={() => openExchangeModal(ticket, eventGroup)}
                          className="bg-blue-600 text-white px-3 py-1 rounded-md text-sm flex items-center hover:bg-blue-700"
                        >
                          <FaExchangeAlt className="mr-1" size={12} />
                          Exchange
                        </button>
                        <button
                          onClick={() => openRefundModal(ticket, eventGroup)}
                          className="bg-red-600 text-white px-3 py-1 rounded-md text-sm flex items-center hover:bg-red-700"
                        >
                          <FaTimes className="mr-1" size={12} />
                          Cancel
                        </button>
                      </div>
                    )}
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    );
  };

  if (loading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="flex justify-center items-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-purple-500"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold mb-6">My Tickets</h1>

      {/* Cancellation messages */}
      {cancellationError && (
        <div className="bg-red-100 text-red-800 p-4 rounded-md mb-6">
          <div className="flex items-start">
            <FaTimesCircle className="mr-2 mt-1" />
            <div>
              <p className="font-medium">Error</p>
              <p>{cancellationError}</p>
            </div>
          </div>
        </div>
      )}

      {cancellationSuccess && (
        <div className="bg-green-100 text-green-800 p-4 rounded-md mb-6">
          <div className="flex items-start">
            <FaCheckCircle className="mr-2 mt-1" />
            <div>
              <p className="font-medium">Success</p>
              <p>{cancellationSuccess}</p>
            </div>
          </div>
        </div>
      )}

      {/* Exchange messages */}
      {exchangeError && (
        <div className="bg-red-100 text-red-800 p-4 rounded-md mb-6">
          <div className="flex items-start">
            <FaTimesCircle className="mr-2 mt-1" />
            <div>
              <p className="font-medium">Exchange Error</p>
              <p>{exchangeError}</p>
            </div>
          </div>
        </div>
      )}

      {exchangeSuccess && (
        <div className="bg-green-100 text-green-800 p-4 rounded-md mb-6">
          <div className="flex items-start">
            <FaCheckCircle className="mr-2 mt-1" />
            <div>
              <p className="font-medium">Exchange Success</p>
              <p>{exchangeSuccess}</p>
            </div>
          </div>
        </div>
      )}

      {/* Tabs */}
      <div className="flex border-b border-gray-300 mb-6">
        <button
          className={`py-2 px-4 font-medium ${
            activeTab === "upcoming"
              ? "text-purple-600 border-b-2 border-purple-600"
              : "text-gray-600 hover:text-gray-900"
          }`}
          onClick={() => setActiveTab("upcoming")}
        >
          Upcoming
        </button>
        <button
          className={`py-2 px-4 font-medium ${
            activeTab === "past"
              ? "text-purple-600 border-b-2 border-purple-600"
              : "text-gray-600 hover:text-gray-900"
          }`}
          onClick={() => setActiveTab("past")}
        >
          Past
        </button>
        <button
          className={`py-2 px-4 font-medium ${
            activeTab === "cancelled"
              ? "text-purple-600 border-b-2 border-purple-600"
              : "text-gray-600 hover:text-gray-900"
          }`}
          onClick={() => setActiveTab("cancelled")}
        >
          <FaBan className="inline-block mr-1" size={12} />
          Cancelled
        </button>
      </div>

      {/* Add this right after the tabs */}
      <div className="flex justify-end mb-4">
        <button
          onClick={refreshTickets}
          className="flex items-center text-purple-600 hover:text-purple-800"
        >
          <FaSync className="mr-1" /> Refresh Tickets
        </button>
      </div>

      {/* Error message */}
      {error && (
        <div className="bg-red-100 text-red-800 p-4 rounded-md mb-6">
          <p>{error}</p>
        </div>
      )}

      {/* No tickets message - Upcoming */}
      {!error && activeTab === "upcoming" && tickets.length === 0 && (
        <div className="text-center py-12 bg-white rounded-lg shadow-md">
          <FaTicketAlt className="mx-auto text-gray-300 mb-4" size={48} />
          <h3 className="text-xl font-semibold text-gray-700 mb-2">
            No upcoming tickets
          </h3>
          <p className="text-gray-500 mb-6">
            You don't have any upcoming event tickets.
          </p>
          <Link
            to="/events"
            className="bg-purple-600 text-white px-6 py-2 rounded-md hover:bg-purple-700"
          >
            Browse Events
          </Link>
        </div>
      )}

      {/* No tickets message - Past */}
      {!error && activeTab === "past" && pastTickets.length === 0 && (
        <div className="text-center py-12 bg-white rounded-lg shadow-md">
          <FaTicketAlt className="mx-auto text-gray-300 mb-4" size={48} />
          <h3 className="text-xl font-semibold text-gray-700 mb-2">
            No past tickets
          </h3>
          <p className="text-gray-500">
            You don't have any past event tickets.
          </p>
        </div>
      )}

      {/* No tickets message - Cancelled */}
      {!error && activeTab === "cancelled" && cancelledTickets.length === 0 && (
        <div className="text-center py-12 bg-white rounded-lg shadow-md">
          <FaBan className="mx-auto text-gray-300 mb-4" size={48} />
          <h3 className="text-xl font-semibold text-gray-700 mb-2">
            No cancelled tickets
          </h3>
          <p className="text-gray-500">You don't have any cancelled tickets.</p>
        </div>
      )}

      {/* Ticket list */}
      <div>
        {activeTab === "upcoming" &&
          tickets.map((eventGroup) => renderTicketList(eventGroup))}
        {activeTab === "past" &&
          pastTickets.map((eventGroup) => renderTicketList(eventGroup, true))}
        {activeTab === "cancelled" &&
          cancelledTickets.map((eventGroup) =>
            renderTicketList(eventGroup, false, true)
          )}
      </div>

      {/* Refund Modal */}
      {showRefundModal && selectedTicket && selectedEvent && (
        <TicketRefundModal
          ticket={selectedTicket}
          event={selectedEvent}
          onClose={closeRefundModal}
          onConfirm={handleCancelTicket}
          isSubmitting={cancellingTicket === selectedTicket.id}
        />
      )}

      {/* Exchange Modal */}
      {showExchangeModal && selectedTicket && selectedEvent && (
        <TicketExchangeModal
          ticket={selectedTicket}
          event={selectedEvent}
          availableTicketTypes={availableTicketTypes}
          onClose={closeExchangeModal}
          onConfirm={handleExchangeTicket}
          isSubmitting={exchangingTicket === selectedTicket.id}
        />
      )}
    </div>
  );
}
