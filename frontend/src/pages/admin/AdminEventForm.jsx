// src/pages/admin/AdminEventForm.jsx
import { useState, useEffect } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import {
  FaSpinner,
  FaSave,
  FaArrowLeft,
  FaExclamationTriangle,
  FaCheckCircle,
  FaCalendarAlt,
  FaClock,
  FaMapMarkerAlt,
  FaImage,
  FaMoneyBillWave,
  FaPercentage,
  FaTicketAlt,
} from "react-icons/fa";
import api from "../../services/api";

const AdminEventForm = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const isEditMode = Boolean(id);
  const [loading, setLoading] = useState(isEditMode);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);
  const [categories, setCategories] = useState([]);
  const [subcategories, setSubcategories] = useState([]);
  const [filteredSubcategories, setFilteredSubcategories] = useState([]);

  // Form data state
  const [formData, setFormData] = useState({
    name: "",
    slug: "",
    description: "",
    date: "",
    time: "",
    end_time: "",
    venue: "",
    address: "",
    city: "",
    image_url: "",
    category_id: "",
    subcategory_id: "",
    creator_id: "",
    min_price: "",
    max_price: "",
    status: "active",
    status_change_reason: "",
    cancellation_policy:
      "Tickets can be refunded up to 7 days before the event date. Within 7 days of the event, no refunds will be issued except in exceptional circumstances. Contact support for assistance with refunds.",
    featured: false,
  });

  // Update this in the useEffect that fetches event data
  useEffect(() => {
    const fetchEventData = async () => {
      if (!isEditMode) return;

      try {
        setLoading(true);
        const response = await api.get(`/admin/events/${id}`);
        const eventData = response.data.data.event;

        // Format date for input field (YYYY-MM-DD)
        const formattedDate = eventData.date
          ? new Date(eventData.date).toISOString().split("T")[0]
          : "";

        setFormData({
          name: eventData.name || "",
          slug: eventData.slug || "",
          description: eventData.description || "",
          date: formattedDate,
          time: eventData.time || "",
          end_time: eventData.end_time || "",
          venue: eventData.venue || "",
          address: eventData.address || "",
          city: eventData.city || "",
          image_url: eventData.image_url || "",
          category_id: eventData.category_id?.toString() || "",
          subcategory_id: eventData.subcategory_id?.toString() || "",
          organizer_id: eventData.organizer_id?.toString() || "",
          min_price: eventData.min_price || "",
          max_price: eventData.max_price || "",
          status: eventData.status || "active",
          status_change_reason: eventData.status_change_reason || "",
          cancellation_policy:
            eventData.cancellation_policy ||
            "Tickets can be refunded up to 7 days before the event date. Within 7 days of the event, no refunds will be issued except in exceptional circumstances. Contact support for assistance with refunds.",
          featured: eventData.featured || false,
        });
      } catch (err) {
        console.error("Error fetching event:", err);
        setError("Failed to load event data. Please try again.");
      } finally {
        setLoading(false);
      }
    };

    fetchEventData();
  }, [id, isEditMode]);

  // Fetch categories and subcategories
  useEffect(() => {
    const fetchCategories = async () => {
      try {
        const [categoriesResponse, subcategoriesResponse] = await Promise.all([
          api.get("/admin/categories"),
          api.get("/admin/subcategories"),
        ]);

        setCategories(categoriesResponse.data.categories || []);
        setSubcategories(subcategoriesResponse.data.subcategories || []);
      } catch (err) {
        console.error("Error fetching categories:", err);
        setError("Failed to load categories. Please try again.");
      }
    };

    fetchCategories();
  }, []);

  // Filter subcategories when category changes
  useEffect(() => {
    if (formData.category_id) {
      const filtered = subcategories.filter(
        (sub) => sub.category_id.toString() === formData.category_id.toString()
      );
      setFilteredSubcategories(filtered);

      // If current subcategory is not in filtered list, reset it
      if (filtered.length > 0 && formData.subcategory_id) {
        const exists = filtered.some(
          (sub) => sub.id.toString() === formData.subcategory_id.toString()
        );

        if (!exists) {
          setFormData((prev) => ({ ...prev, subcategory_id: "" }));
        }
      }
    } else {
      setFilteredSubcategories([]);
      setFormData((prev) => ({ ...prev, subcategory_id: "" }));
    }
  }, [formData.category_id, subcategories, formData.subcategory_id]);

  const handleInputChange = (e) => {
    const { name, value } = e.target;

    // Auto-generate slug from name
    if (name === "name") {
      const slug = value
        .toLowerCase()
        .replace(/[^\w\s-]/g, "")
        .replace(/[\s_-]+/g, "-")
        .replace(/^-+|-+$/g, "");

      setFormData({
        ...formData,
        name: value,
        slug: slug,
      });
    } else {
      setFormData({
        ...formData,
        [name]: value,
      });
    }
  };

  // Update the handleSubmit function
  // Update the handleSubmit function in AdminEventForm.jsx to properly handle empty numeric fields
  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    setError(null);
    setSuccess(null);

    try {
      // Validate required fields
      const requiredFields = [
        "name",
        "slug",
        "description",
        "date",
        "venue",
        "address",
        "city",
        "category_id",
      ];

      // Add validation for status changes
      if (formData.status === "canceled" && !formData.status_change_reason) {
        setError("Please provide a reason for cancellation");
        setSubmitting(false);
        return;
      }

      if (formData.status === "rescheduled" && !formData.status_change_reason) {
        setError("Please provide a reason for rescheduling");
        setSubmitting(false);
        return;
      }

      const missingFields = requiredFields.filter((field) => !formData[field]);

      if (missingFields.length > 0) {
        setError(
          `Please fill in all required fields: ${missingFields.join(", ")}`
        );
        setSubmitting(false);
        return;
      }

      // Format data properly for submission
      const dataToSubmit = {
        ...formData,
        // Ensure integer fields are properly formatted
        category_id: formData.category_id
          ? parseInt(formData.category_id)
          : null,
        subcategory_id:
          formData.subcategory_id && formData.subcategory_id.trim() !== ""
            ? parseInt(formData.subcategory_id)
            : null,
        creator_id:
          formData.creator_id && formData.creator_id.trim() !== ""
            ? parseInt(formData.creator_id)
            : null,
        min_price:
          formData.min_price && formData.min_price.toString().trim() !== ""
            ? parseFloat(formData.min_price)
            : null,
        max_price:
          formData.max_price && formData.max_price.toString().trim() !== ""
            ? parseFloat(formData.max_price)
            : null,
      };

      console.log("Formatted data to submit:", dataToSubmit);

      if (isEditMode) {
        // Update existing event
        const response = await api.put(`/admin/events/${id}`, dataToSubmit);
        console.log("Event updated:", response.data);
        // Custom success message based on status
        if (formData.status === "canceled") {
          setSuccess(
            "Event has been canceled. Refunds will be processed automatically."
          );
        } else if (formData.status === "rescheduled") {
          setSuccess(
            "Event has been rescheduled. Ticket holders will be notified."
          );
        } else {
          setSuccess("Event updated successfully");
        }
      } else {
        // Create new event
        const response = await api.post("/admin/events", dataToSubmit);
        console.log("Event created:", response.data);
        setSuccess("Event created successfully");
      }

      // Redirect to events list after short delay
      setTimeout(() => {
        navigate("/admin/events");
      }, 1500);
    } catch (err) {
      console.error("Error saving event:", err);
      setError(
        err.response?.data?.error ||
          err.response?.data?.details ||
          "Failed to save event. Please try again."
      );
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-96">
        <FaSpinner className="animate-spin text-purple-600 text-4xl" />
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">
          {isEditMode ? "Edit Event" : "Create New Event"}
        </h1>
        <Link
          to="/admin/events"
          className="flex items-center text-purple-600 hover:text-purple-700"
        >
          <FaArrowLeft className="mr-2" /> Back to Events
        </Link>
      </div>

      {error && (
        <div className="bg-red-100 text-red-800 p-4 rounded-md mb-6">
          <div className="flex items-start">
            <FaExclamationTriangle className="mt-1 mr-2" />
            <span>{error}</span>
          </div>
        </div>
      )}

      {success && (
        <div className="bg-green-100 text-green-800 p-4 rounded-md mb-6">
          <div className="flex items-start">
            <FaCheckCircle className="mt-1 mr-2" />
            <span>{success}</span>
          </div>
        </div>
      )}

      <form
        onSubmit={handleSubmit}
        className="bg-white rounded-lg shadow-md p-6"
      >
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Basic Information */}
          <div className="md:col-span-2">
            <h2 className="text-lg font-semibold text-gray-700 mb-3">
              Basic Information
            </h2>
          </div>

          <div className="md:col-span-2">
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Event Name *
            </label>
            <input
              type="text"
              name="name"
              value={formData.name}
              onChange={handleInputChange}
              className="w-full p-2 border rounded-md focus:ring-2 focus:ring-purple-500 focus:border-transparent"
              required
            />
          </div>

          {/* Slug field */}
          <div className="md:col-span-2">
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Slug *{" "}
              <span className="text-xs text-gray-500">
                (Auto-generated from name, can be edited)
              </span>
            </label>
            <input
              type="text"
              name="slug"
              value={formData.slug}
              onChange={handleInputChange}
              className="w-full p-2 border rounded-md focus:ring-2 focus:ring-purple-500 focus:border-transparent"
              required
            />
            <p className="mt-1 text-xs text-gray-500">
              Used in URLs. Example: "metallica-concert"
            </p>
          </div>

          <div className="md:col-span-2">
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Description
            </label>
            <textarea
              name="description"
              value={formData.description}
              onChange={handleInputChange}
              rows="4"
              className="w-full p-2 border rounded-md focus:ring-2 focus:ring-purple-500 focus:border-transparent"
            ></textarea>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Event Date *
            </label>
            <div className="relative">
              <input
                type="date"
                name="date"
                value={formData.date}
                onChange={handleInputChange}
                className="w-full p-2 pl-10 border rounded-md focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                required
              />
              <FaCalendarAlt className="absolute left-3 top-3 text-gray-400" />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Event Time
            </label>
            <div className="relative">
              <input
                type="time"
                name="time"
                value={formData.time}
                onChange={handleInputChange}
                className="w-full p-2 pl-10 border rounded-md focus:ring-2 focus:ring-purple-500 focus:border-transparent"
              />
              <FaClock className="absolute left-3 top-3 text-gray-400" />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              End Time
            </label>
            <div className="relative">
              <input
                type="time"
                name="end_time"
                value={formData.end_time}
                onChange={handleInputChange}
                className="w-full p-2 pl-10 border rounded-md focus:ring-2 focus:ring-purple-500 focus:border-transparent"
              />
              <FaClock className="absolute left-3 top-3 text-gray-400" />
            </div>
          </div>

          {/* Location Information */}
          <div className="md:col-span-2 mt-4">
            <h2 className="text-lg font-semibold text-gray-700 mb-3">
              Location
            </h2>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Venue Name *
            </label>
            <div className="relative">
              <input
                type="text"
                name="venue"
                value={formData.venue}
                onChange={handleInputChange}
                className="w-full p-2 pl-10 border rounded-md focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                required
              />
              <FaMapMarkerAlt className="absolute left-3 top-3 text-gray-400" />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Address
            </label>
            <input
              type="text"
              name="address"
              value={formData.address}
              onChange={handleInputChange}
              className="w-full p-2 border rounded-md focus:ring-2 focus:ring-purple-500 focus:border-transparent"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              City *
            </label>
            <input
              type="text"
              name="city"
              value={formData.city}
              onChange={handleInputChange}
              className="w-full p-2 border rounded-md focus:ring-2 focus:ring-purple-500 focus:border-transparent"
              required
            />
          </div>

          {/* Category Information */}
          <div className="md:col-span-2 mt-4">
            <h2 className="text-lg font-semibold text-gray-700 mb-3">
              Categorization
            </h2>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Category *
            </label>
            <select
              name="category_id"
              value={formData.category_id}
              onChange={handleInputChange}
              className="w-full p-2 border rounded-md focus:ring-2 focus:ring-purple-500 focus:border-transparent"
              required
            >
              <option value="">Select a category</option>
              {categories.map((category) => (
                <option key={category.id} value={category.id}>
                  {category.name}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Subcategory
            </label>
            <select
              name="subcategory_id"
              value={formData.subcategory_id}
              onChange={handleInputChange}
              className="w-full p-2 border rounded-md focus:ring-2 focus:ring-purple-500 focus:border-transparent"
              disabled={
                !formData.category_id || filteredSubcategories.length === 0
              }
            >
              <option value="">Select a subcategory</option>
              {filteredSubcategories.map((subcategory) => (
                <option key={subcategory.id} value={subcategory.id}>
                  {subcategory.name}
                </option>
              ))}
            </select>
          </div>

          {/* Additional Information */}
          <div className="md:col-span-2 mt-4">
            <h2 className="text-lg font-semibold text-gray-700 mb-3">
              Additional Information
            </h2>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Image URL
            </label>
            <div className="relative">
              <input
                type="text"
                name="image_url"
                value={formData.image_url}
                onChange={handleInputChange}
                className="w-full p-2 pl-10 border rounded-md focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                placeholder="https://example.com/image.jpg"
              />
              <FaImage className="absolute left-3 top-3 text-gray-400" />
            </div>
          </div>

          <div className="flex space-x-4">
            <div className="w-1/2">
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Minimum Price ($)
              </label>
              <div className="relative">
                <input
                  type="number"
                  name="min_price"
                  value={formData.min_price}
                  onChange={handleInputChange}
                  min="0"
                  step="0.01"
                  className="w-full p-2 pl-10 border rounded-md focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                  placeholder="0.00"
                />
                <FaMoneyBillWave className="absolute left-3 top-3 text-gray-400" />
              </div>
            </div>

            <div className="w-1/2">
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Maximum Price ($)
              </label>
              <div className="relative">
                <input
                  type="number"
                  name="max_price"
                  value={formData.max_price}
                  onChange={handleInputChange}
                  min="0"
                  step="0.01"
                  className="w-full p-2 pl-10 border rounded-md focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                  placeholder="0.00"
                />
                <FaMoneyBillWave className="absolute left-3 top-3 text-gray-400" />
              </div>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Status
            </label>
            <select
              name="status"
              value={formData.status}
              onChange={handleInputChange}
              className="w-full p-2 border rounded-md focus:ring-2 focus:ring-purple-500 focus:border-transparent"
            >
              <option value="active">Active</option>
              <option value="draft">Draft</option>
              <option value="canceled">Canceled</option>
              <option value="rescheduled">Rescheduled</option>
              <option value="completed">Completed</option>
              <option value="inactive">Inactive</option>
            </select>
            <p className="text-xs text-gray-500 mt-1">
              {formData.status === "canceled" &&
                "Canceled events will automatically process refunds to all ticket holders"}
              {formData.status === "rescheduled" &&
                "Rescheduled events will notify all ticket holders of the new date and time"}
            </p>
          </div>

          {/* Additional fields for canceled events */}
          {formData.status === "canceled" && (
            <div className="md:col-span-2 mt-4 p-4 bg-red-50 rounded-md border border-red-200">
              <h3 className="text-md font-semibold text-red-700 mb-2">
                Cancellation Details
              </h3>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Cancellation Reason
              </label>
              <textarea
                name="status_change_reason"
                value={formData.status_change_reason || ""}
                onChange={handleInputChange}
                rows="2"
                className="w-full p-2 border border-red-300 rounded-md focus:ring-2 focus:ring-red-500 focus:border-transparent"
                placeholder="Please provide a reason for cancellation (will be shared with attendees)"
              ></textarea>
              <p className="text-xs text-yellow-600 mt-1">
                <FaExclamationTriangle className="inline mr-1" />
                Updating the reason will send a new notification to ticket
                holders.
              </p>
              <p className="text-xs text-red-600 mt-1">
                <FaExclamationTriangle className="inline mr-1" />
                This will automatically process refunds to all ticket holders!
              </p>
            </div>
          )}

          {/* Additional fields for rescheduled events */}
          {formData.status === "rescheduled" && (
            <div className="md:col-span-2 mt-4 p-4 bg-yellow-50 rounded-md border border-yellow-200">
              <h3 className="text-md font-semibold text-yellow-700 mb-2">
                Rescheduling Details
              </h3>
              <div className="mt-2">
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Rescheduling Reason
                </label>
                <textarea
                  name="status_change_reason"
                  value={formData.status_change_reason || ""}
                  onChange={handleInputChange}
                  rows="2"
                  className="w-full p-2 border border-yellow-300 rounded-md focus:ring-2 focus:ring-yellow-500 focus:border-transparent"
                  placeholder="Please provide a reason for rescheduling (will be shared with attendees)"
                ></textarea>
                <p className="text-xs text-yellow-600 mt-1">
                  <FaExclamationTriangle className="inline mr-1" />
                  This will automatically notify all ticket holders of the new
                  date and time.
                </p>
              </div>
            </div>
          )}

          {/* Featured checkbox */}
          <div>
            <label className="flex items-center text-sm font-medium text-gray-700 mb-1">
              <input
                type="checkbox"
                name="featured"
                checked={formData.featured}
                onChange={(e) =>
                  setFormData({ ...formData, featured: e.target.checked })
                }
                className="mr-2 h-4 w-4 text-purple-600 focus:ring-purple-500"
              />
              Featured Event
            </label>
            <p className="text-xs text-gray-500">
              Featured events appear in highlighted sections
            </p>
          </div>

          <div className="md:col-span-2">
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Cancellation Policy
            </label>
            <textarea
              name="cancellation_policy"
              value={formData.cancellation_policy}
              onChange={handleInputChange}
              rows="3"
              className="w-full p-2 border rounded-md focus:ring-2 focus:ring-purple-500 focus:border-transparent"
            ></textarea>
          </div>
        </div>

        <div className="flex justify-end mt-6">
          <Link
            to="/admin/events"
            className="bg-gray-300 text-gray-700 px-4 py-2 rounded-md mr-2 hover:bg-gray-400"
          >
            Cancel
          </Link>
          <button
            type="submit"
            className="bg-purple-600 text-white px-6 py-2 rounded-md flex items-center hover:bg-purple-700"
            disabled={submitting}
          >
            {submitting ? (
              <>
                <FaSpinner className="animate-spin mr-2" />
                Saving...
              </>
            ) : (
              <>
                <FaSave className="mr-2" />
                {isEditMode ? "Update Event" : "Create Event"}
              </>
            )}
          </button>
        </div>
      </form>
    </div>
  );
};

export default AdminEventForm;
