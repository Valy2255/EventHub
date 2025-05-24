// src/pages/admin/AdminEvents.jsx
import { useState, useEffect, useCallback } from "react";
import {
  FaSpinner,
  FaEdit,
  FaTrash,
  FaPlus,
  FaSearch,
  FaFilter,
  FaEye,
  FaSort,
  FaCalendarAlt,
  FaCheckCircle,
  FaBan,
  FaExclamationTriangle,
  FaSync,
  FaClock,
  FaTimes,
} from "react-icons/fa";
import { Link } from "react-router-dom";
import api from "../../services/api";

const AdminEvents = () => {
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState("all");
  const [sort, setSort] = useState("newest");
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [eventToDelete, setEventToDelete] = useState(null);

  // Added state for cancel/reschedule functionality
  const [showCancelModal, setShowCancelModal] = useState(false);
  const [showRescheduleModal, setShowRescheduleModal] = useState(false);
  const [eventToAction, setEventToAction] = useState(null);
  const [actionReason, setActionReason] = useState("");
  const [newEventDate, setNewEventDate] = useState("");
  const [newEventTime, setNewEventTime] = useState("");
  const [actionLoading, setActionLoading] = useState(false);

  const [page, setPage] = useState(1);
  const [pagination, setPagination] = useState({
    current: 1,
    totalPages: 1,
    hasNext: false,
    hasPrev: false,
  });

  // Reset page when filters change
  useEffect(() => {
    setPage(1);
  }, [status, search, sort]);

  // Using useCallback to memoize the fetchEvents function
  const fetchEvents = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      // Build query parameters
      const params = new URLSearchParams();
      params.append("page", page);
      params.append("limit", "10");
      params.append("sort", sort);

      if (status && status !== "all") {
        params.append("status", status);
        console.log("Filtering by status:", status);
      }

      if (search && search.trim()) {
        params.append("search", search.trim());
        console.log("Searching for:", search.trim());
      }

      const url = `/admin/events?${params.toString()}`;
      console.log("API URL:", url);

      const response = await api.get(url);
      console.log("Response:", response.data);

      if (response.data && response.data.success) {
        setEvents(response.data.data || []);
        setPagination(
          response.data.pagination || {
            current: 1,
            totalPages: 1,
            hasNext: false,
            hasPrev: false,
          }
        );
      } else {
        console.error("Unexpected response format:", response.data);
        setError("Unexpected response format from server");
      }
    } catch (err) {
      console.error("Error fetching events:", err);
      setError(
        err.response?.data?.error ||
          err.response?.data?.message ||
          "Could not load events. Please try again."
      );
    } finally {
      setLoading(false);
    }
  }, [page, sort, status, search]);

  useEffect(() => {
    fetchEvents();
  }, [fetchEvents]);

  // Clear all filters
  const clearFilters = () => {
    setStatus("all");
    setSearch("");
    setSort("newest");
    setPage(1);
  };

  // Handle status change
  const handleStatusChange = (newStatus) => {
    console.log("Status changed to:", newStatus);
    setStatus(newStatus);
    setPage(1);
  };

  // Handle search change
  const handleSearchChange = (newSearch) => {
    setSearch(newSearch);
    setPage(1);
  };

  // Handle sort change
  const handleSortChange = (newSort) => {
    setSort(newSort);
    setPage(1);
  };

  const handleDeleteClick = (event) => {
    setEventToDelete(event);
    setShowDeleteModal(true);
  };

  const handleConfirmDelete = async () => {
    if (!eventToDelete) return;

    try {
      setLoading(true);
      setError(null);

      // Call the delete API endpoint
      const response = await api.delete(`/admin/events/${eventToDelete.id}`);

      // Remove the event from the list or refresh
      await fetchEvents();

      // Show success message
      setSuccess(
        response.data.message ||
          (eventToDelete.tickets_sold > 0
            ? "Event has been cancelled since tickets have been sold"
            : "Event deleted successfully")
      );

      // Clear success message after 5 seconds
      setTimeout(() => {
        setSuccess(null);
      }, 5000);
    } catch (err) {
      console.error("Error deleting event:", err);
      setError(
        err.response?.data?.error || "Failed to delete event. Please try again."
      );
    } finally {
      setLoading(false);
      setShowDeleteModal(false);
      setEventToDelete(null);
    }
  };

  // Handler for cancel button click
  const handleCancelClick = (event) => {
    setEventToAction(event);
    setActionReason("");
    setShowCancelModal(true);
  };

  // Handler for reschedule button click
  const handleRescheduleClick = (event) => {
    setEventToAction(event);
    setActionReason("");

    // Format date for input (YYYY-MM-DD)
    const formattedDate = event.date
      ? new Date(event.date).toISOString().split("T")[0]
      : "";

    setNewEventDate(formattedDate);
    setNewEventTime(event.time || "");
    setShowRescheduleModal(true);
  };

  // Handler for confirm cancel
  const handleConfirmCancel = async () => {
    if (!eventToAction || !actionReason.trim()) return;

    try {
      setActionLoading(true);
      setError(null);

      const response = await api.put(
        `/admin/events/${eventToAction.id}/cancel`,
        {
          cancelReason: actionReason,
        }
      );

      // Update the event in the list if successful
      if (response.data.success) {
        // Refresh the events list to get updated data
        await fetchEvents();

        // Show success message
        setSuccess(
          "Event has been canceled. Refunds will be processed automatically."
        );

        // Clear success message after 5 seconds
        setTimeout(() => {
          setSuccess(null);
        }, 5000);
      }
    } catch (err) {
      console.error("Error canceling event:", err);
      setError(
        err.response?.data?.error || "Failed to cancel event. Please try again."
      );
    } finally {
      setActionLoading(false);
      setShowCancelModal(false);
      setEventToAction(null);
      setActionReason("");
    }
  };

  // Handler for confirm reschedule
  const handleConfirmReschedule = async () => {
    if (
      !eventToAction ||
      !actionReason.trim() ||
      !newEventDate ||
      !newEventTime
    )
      return;

    try {
      setActionLoading(true);
      setError(null);

      const response = await api.put(
        `/admin/events/${eventToAction.id}/reschedule`,
        {
          newDate: newEventDate,
          newTime: newEventTime,
          rescheduleReason: actionReason,
        }
      );

      // Update the event in the list if successful
      if (response.data.success) {
        // Refresh the events list to get updated data
        await fetchEvents();

        // Show success message
        setSuccess(
          "Event has been rescheduled. Attendees will be notified automatically."
        );

        // Clear success message after 5 seconds
        setTimeout(() => {
          setSuccess(null);
        }, 5000);
      }
    } catch (err) {
      console.error("Error rescheduling event:", err);
      setError(
        err.response?.data?.error ||
          "Failed to reschedule event. Please try again."
      );
    } finally {
      setActionLoading(false);
      setShowRescheduleModal(false);
      setEventToAction(null);
      setActionReason("");
      setNewEventDate("");
      setNewEventTime("");
    }
  };

  const formatDate = (dateString) => {
    if (!dateString) return "No date";
    try {
      return new Date(dateString).toLocaleDateString();
    } catch (e) {
      console.error("formatDate failed:", e);
      return "Invalid date";
    }
  };

  const formatTime = (timeString) => {
    if (!timeString) return "";

    try {
      const [hours, minutes] = timeString.split(":");
      const hour = parseInt(hours, 10);
      const ampm = hour >= 12 ? "PM" : "AM";
      const formattedHour = hour % 12 || 12;

      return `${formattedHour}:${minutes} ${ampm}`;
    } catch (e) {
      console.error("formatTime failed:", e);
      return timeString;
    }
  };

  const getStatusBadge = (status) => {
    switch (status) {
      case "active":
        return (
          <span className="px-2 py-1 bg-green-100 text-green-800 text-xs font-medium rounded-full">
            Active
          </span>
        );
      case "canceled":
      case "cancelled":
        return (
          <span className="px-2 py-1 bg-red-100 text-red-800 text-xs font-medium rounded-full">
            Canceled
          </span>
        );
      case "rescheduled":
        return (
          <span className="px-2 py-1 bg-yellow-100 text-yellow-800 text-xs font-medium rounded-full">
            Rescheduled
          </span>
        );

      case "inactive":
        return (
          <span className="px-2 py-1 bg-gray-100 text-gray-800 text-xs font-medium rounded-full">
            Inactive
          </span>
        );
      default:
        return (
          <span className="px-2 py-1 bg-gray-100 text-gray-800 text-xs font-medium rounded-full">
            {status || "Unknown"}
          </span>
        );
    }
  };

  // Show active filters count
  const activeFiltersCount = [
    status !== "all" ? 1 : 0,
    search.trim() ? 1 : 0,
    sort !== "newest" ? 1 : 0,
  ].reduce((a, b) => a + b, 0);

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">Event Management</h1>
        <div className="flex space-x-2">
          <button
            onClick={fetchEvents}
            disabled={loading}
            className="bg-purple-600 text-white px-3 py-2 rounded-md flex items-center hover:bg-purple-700 disabled:opacity-50"
          >
            <FaSync className={`mr-2 ${loading ? "animate-spin" : ""}`} />
            Refresh
          </button>
          <Link
            to="/admin/events/new"
            className="bg-purple-600 text-white px-3 py-2 rounded-md flex items-center hover:bg-purple-700"
          >
            <FaPlus className="mr-2" /> Add Event
          </Link>
        </div>
      </div>

      {error && (
        <div className="bg-red-100 text-red-800 p-4 rounded-md mb-6">
          <div className="flex items-start justify-between">
            <div className="flex items-start">
              <FaExclamationTriangle className="mt-1 mr-2" />
              <span>{error}</span>
            </div>
            <button
              onClick={() => setError(null)}
              className="text-red-600 hover:text-red-800"
            >
              <FaTimes />
            </button>
          </div>
        </div>
      )}

      {success && (
        <div className="bg-green-100 text-green-800 p-4 rounded-md mb-6">
          <div className="flex items-start justify-between">
            <div className="flex items-start">
              <FaCheckCircle className="mt-1 mr-2" />
              <span>{success}</span>
            </div>
            <button
              onClick={() => setSuccess(null)}
              className="text-green-600 hover:text-green-800"
            >
              <FaTimes />
            </button>
          </div>
        </div>
      )}

      {/* Filters and Search */}
      <div className="mb-6 bg-gray-50 p-4 rounded-md shadow-sm">
        <div className="flex flex-wrap gap-4">
          <div className="flex-1 min-w-[200px]">
            <div className="relative">
              <input
                type="text"
                placeholder="Search events..."
                value={search}
                onChange={(e) => handleSearchChange(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500"
              />
              <FaSearch className="absolute left-3 top-3 text-gray-400" />
            </div>
          </div>

          <div>
            <select
              value={status}
              onChange={(e) => handleStatusChange(e.target.value)}
              className="border rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-purple-500"
            >
              <option value="all">All Statuses</option>
              <option value="active">Active</option>
              <option value="canceled">Canceled</option>
              <option value="rescheduled">Rescheduled</option>
              <option value="inactive">Inactive</option>
            </select>
          </div>

          <div>
            <select
              value={sort}
              onChange={(e) => handleSortChange(e.target.value)}
              className="border rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-purple-500"
            >
              <option value="newest">Newest First</option>
              <option value="oldest">Oldest First</option>
              <option value="name_asc">Name (A-Z)</option>
              <option value="name_desc">Name (Z-A)</option>
              <option value="date_asc">Date (Upcoming)</option>
              <option value="date_desc">Date (Oldest)</option>
              <option value="popular">Most Popular</option>
            </select>
          </div>

          {activeFiltersCount > 0 && (
            <button
              onClick={clearFilters}
              className="bg-gray-500 text-white px-3 py-2 rounded-md hover:bg-gray-600 flex items-center"
            >
              <FaTimes className="mr-1" /> Clear ({activeFiltersCount})
            </button>
          )}
        </div>

        {/* Show current filters */}
        {activeFiltersCount > 0 && (
          <div className="mt-3 flex flex-wrap gap-2">
            {status !== "all" && (
              <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-purple-100 text-purple-800">
                Status: {status}
                <button
                  onClick={() => handleStatusChange("all")}
                  className="ml-1 text-purple-600 hover:text-purple-800"
                >
                  <FaTimes className="w-3 h-3" />
                </button>
              </span>
            )}
            {search.trim() && (
              <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                Search: {search}
                <button
                  onClick={() => handleSearchChange("")}
                  className="ml-1 text-blue-600 hover:text-blue-800"
                >
                  <FaTimes className="w-3 h-3" />
                </button>
              </span>
            )}
            {sort !== "newest" && (
              <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800">
                Sort: {sort.replace("_", " ")}
                <button
                  onClick={() => handleSortChange("newest")}
                  className="ml-1 text-green-600 hover:text-green-800"
                >
                  <FaTimes className="w-3 h-3" />
                </button>
              </span>
            )}
          </div>
        )}
      </div>

      {/* Events table */}
      {loading && events.length === 0 ? (
        <div className="flex justify-center items-center h-64">
          <FaSpinner className="animate-spin text-purple-600 text-4xl" />
        </div>
      ) : events.length === 0 ? (
        <div className="text-center py-12 bg-white rounded-lg shadow-md">
          <FaCalendarAlt className="mx-auto text-gray-300 mb-4" size={48} />
          <h3 className="text-xl font-semibold text-gray-700 mb-2">
            No events found
          </h3>
          <p className="text-gray-500 mb-6">
            {search.trim() || status !== "all"
              ? "Try changing your search or filter criteria"
              : "There are no events in the system yet"}
          </p>
          {activeFiltersCount > 0 ? (
            <button
              onClick={clearFilters}
              className="bg-gray-500 text-white px-6 py-2 rounded-md hover:bg-gray-600 mr-4"
            >
              Clear Filters
            </button>
          ) : null}
          <Link
            to="/admin/events/new"
            className="bg-purple-600 text-white px-6 py-2 rounded-md hover:bg-purple-700"
          >
            <FaPlus className="inline mr-2" /> Add Event
          </Link>
        </div>
      ) : (
        <div className="bg-white rounded-md shadow overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Event
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Date & Time
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Category
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Status
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Tickets Sold
                </th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {events.map((event) => (
                <tr key={event.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center">
                      <div className="flex-shrink-0 h-10 w-10">
                        {event.image_url ? (
                          <img
                            className="h-10 w-10 rounded-md object-cover"
                            src={event.image_url}
                            alt={event.name}
                            onError={(e) => {
                              e.target.style.display = "none";
                              e.target.nextSibling.style.display = "flex";
                            }}
                          />
                        ) : null}
                        <div
                          className={`h-10 w-10 rounded-md bg-purple-200 flex items-center justify-center ${
                            event.image_url ? "hidden" : ""
                          }`}
                        >
                          <FaCalendarAlt className="text-purple-600" />
                        </div>
                      </div>
                      <div className="ml-4">
                        <div className="text-sm font-medium text-gray-900">
                          {event.name || "Unnamed Event"}
                        </div>
                        <div className="text-sm text-gray-500 truncate max-w-xs">
                          {event.venue || "No venue specified"}
                        </div>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-900">
                      {formatDate(event.date)}
                    </div>
                    <div className="text-sm text-gray-500">
                      {formatTime(event.time)}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-900">
                      {event.category_name || "Uncategorized"}
                    </div>
                    {event.subcategory_name && (
                      <div className="text-xs text-gray-500">
                        {event.subcategory_name}
                      </div>
                    )}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    {getStatusBadge(event.status)}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {event.tickets_sold || 0}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                    <div className="flex justify-end space-x-2">
                      <Link
                        to={`/events/${event.id}`}
                        target="_blank"
                        className="text-indigo-600 hover:text-indigo-900 p-1"
                        title="View Event"
                      >
                        <FaEye />
                      </Link>
                      <Link
                        to={`/admin/events/${event.id}/edit`}
                        className="text-blue-600 hover:text-blue-900 p-1"
                        title="Edit Event"
                      >
                        <FaEdit />
                      </Link>
                      {event.status !== "canceled" &&
                        event.status !== "cancelled" && (
                          <button
                            onClick={() => handleCancelClick(event)}
                            className="text-red-600 hover:text-red-900 p-1"
                            title="Cancel Event"
                          >
                            <FaBan />
                          </button>
                        )}
                      {event.status !== "canceled" &&
                        event.status !== "cancelled" &&
                        event.status !== "rescheduled" && (
                          <button
                            onClick={() => handleRescheduleClick(event)}
                            className="text-yellow-600 hover:text-yellow-900 p-1"
                            title="Reschedule Event"
                          >
                            <FaCalendarAlt />
                          </button>
                        )}
                      <button
                        onClick={() => handleDeleteClick(event)}
                        className="text-red-600 hover:text-red-900 p-1"
                        title="Delete Event"
                      >
                        <FaTrash />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Pagination */}
      {pagination.totalPages > 1 && (
        <div className="flex justify-between items-center mt-6">
          <div className="text-sm text-gray-500">
            Showing page {pagination.current} of {pagination.totalPages}
            {events.length > 0 && ` (${events.length} events)`}
          </div>
          <div className="flex space-x-2">
            <button
              onClick={() => setPage(page - 1)}
              disabled={!pagination.hasPrev || loading}
              className={`px-3 py-1 rounded-md ${
                pagination.hasPrev && !loading
                  ? "bg-purple-600 text-white hover:bg-purple-700"
                  : "bg-gray-200 text-gray-500 cursor-not-allowed"
              }`}
            >
              Previous
            </button>
            <span className="px-3 py-1 text-gray-700">
              {pagination.current}
            </span>
            <button
              onClick={() => setPage(page + 1)}
              disabled={!pagination.hasNext || loading}
              className={`px-3 py-1 rounded-md ${
                pagination.hasNext && !loading
                  ? "bg-purple-600 text-white hover:bg-purple-700"
                  : "bg-gray-200 text-gray-500 cursor-not-allowed"
              }`}
            >
              Next
            </button>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {showDeleteModal && eventToDelete && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg max-w-md w-full p-6">
            <h3 className="text-lg font-medium text-gray-900 mb-4">
              Confirm Event Deletion
            </h3>
            <p className="text-sm text-gray-500 mb-4">
              Are you sure you want to delete{" "}
              <span className="font-medium">{eventToDelete.name}</span>?
              {eventToDelete.tickets_sold > 0 && (
                <span className="block mt-2 text-red-600">
                  Warning: This event has {eventToDelete.tickets_sold} tickets
                  sold. Deleting it will cancel all tickets.
                </span>
              )}
            </p>
            <div className="flex justify-end space-x-3">
              <button
                onClick={() => {
                  setShowDeleteModal(false);
                  setEventToDelete(null);
                }}
                className="bg-gray-200 hover:bg-gray-300 px-4 py-2 rounded-md text-sm font-medium"
              >
                Cancel
              </button>
              <button
                onClick={handleConfirmDelete}
                disabled={loading}
                className="bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-md text-sm font-medium disabled:opacity-50"
              >
                {loading ? (
                  <>
                    <FaSpinner className="animate-spin inline mr-1" />
                    Deleting...
                  </>
                ) : (
                  "Delete"
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Cancel Event Modal */}
      {showCancelModal && eventToAction && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg max-w-md w-full p-6">
            <h3 className="text-lg font-medium text-gray-900 mb-4">
              Confirm Event Cancellation
            </h3>
            <p className="text-sm text-gray-500 mb-4">
              Are you sure you want to cancel{" "}
              <span className="font-medium">{eventToAction.name}</span>?
              {eventToAction.tickets_sold > 0 && (
                <span className="block mt-2 text-red-600">
                  This event has {eventToAction.tickets_sold} tickets sold. All
                  tickets will be automatically refunded.
                </span>
              )}
            </p>

            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Cancellation Reason <span className="text-red-500">*</span>
              </label>
              <textarea
                value={actionReason}
                onChange={(e) => setActionReason(e.target.value)}
                className="w-full p-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500"
                rows="3"
                placeholder="Please provide a reason for cancellation (will be shared with attendees)"
                required
              ></textarea>
            </div>

            <div className="flex justify-end space-x-3">
              <button
                onClick={() => {
                  setShowCancelModal(false);
                  setEventToAction(null);
                  setActionReason("");
                }}
                className="bg-gray-200 hover:bg-gray-300 px-4 py-2 rounded-md text-sm font-medium"
              >
                Close
              </button>
              <button
                onClick={handleConfirmCancel}
                disabled={!actionReason.trim() || actionLoading}
                className={`bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-md text-sm font-medium ${
                  !actionReason.trim() || actionLoading
                    ? "opacity-50 cursor-not-allowed"
                    : ""
                }`}
              >
                {actionLoading ? (
                  <>
                    <FaSpinner className="animate-spin inline mr-1" />
                    Processing...
                  </>
                ) : (
                  "Cancel Event"
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Reschedule Event Modal */}
      {showRescheduleModal && eventToAction && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg max-w-md w-full p-6">
            <h3 className="text-lg font-medium text-gray-900 mb-4">
              Reschedule Event
            </h3>
            <p className="text-sm text-gray-500 mb-4">
              Reschedule{" "}
              <span className="font-medium">{eventToAction.name}</span> to a new
              date and time:
            </p>

            <div className="grid grid-cols-2 gap-4 mb-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  New Date <span className="text-red-500">*</span>
                </label>
                <input
                  type="date"
                  value={newEventDate}
                  onChange={(e) => setNewEventDate(e.target.value)}
                  className="w-full p-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  New Time <span className="text-red-500">*</span>
                </label>
                <input
                  type="time"
                  value={newEventTime}
                  onChange={(e) => setNewEventTime(e.target.value)}
                  className="w-full p-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500"
                  required
                />
              </div>
            </div>

            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Rescheduling Reason <span className="text-red-500">*</span>
              </label>
              <textarea
                value={actionReason}
                onChange={(e) => setActionReason(e.target.value)}
                className="w-full p-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500"
                rows="3"
                placeholder="Please provide a reason for rescheduling (will be shared with attendees)"
                required
              ></textarea>
            </div>

            <div className="flex justify-end space-x-3">
              <button
                onClick={() => {
                  setShowRescheduleModal(false);
                  setEventToAction(null);
                  setActionReason("");
                  setNewEventDate("");
                  setNewEventTime("");
                }}
                className="bg-gray-200 hover:bg-gray-300 px-4 py-2 rounded-md text-sm font-medium"
              >
                Close
              </button>
              <button
                onClick={handleConfirmReschedule}
                disabled={
                  !actionReason.trim() ||
                  !newEventDate ||
                  !newEventTime ||
                  actionLoading
                }
                className={`bg-yellow-600 hover:bg-yellow-700 text-white px-4 py-2 rounded-md text-sm font-medium ${
                  !actionReason.trim() ||
                  !newEventDate ||
                  !newEventTime ||
                  actionLoading
                    ? "opacity-50 cursor-not-allowed"
                    : ""
                }`}
              >
                {actionLoading ? (
                  <>
                    <FaSpinner className="animate-spin inline mr-1" />
                    Processing...
                  </>
                ) : (
                  "Reschedule Event"
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminEvents;
