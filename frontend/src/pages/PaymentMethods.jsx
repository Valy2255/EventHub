// src/pages/PaymentMethods.jsx
import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import {
  FaCreditCard,
  FaPlus,
  FaTrash,
  FaPencilAlt,
  FaCheck,
  FaArrowLeft,
  FaSpinner,
  FaRegCreditCard,
  FaRegCalendarAlt,
  FaRegStar,
} from "react-icons/fa";
import api from "../services/api";

const PaymentMethods = () => {
  const [paymentMethods, setPaymentMethods] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showAddForm, setShowAddForm] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [formErrors, setFormErrors] = useState({});
  const [submitting, setSubmitting] = useState(false);

  // Form data states
  const [formData, setFormData] = useState({
    cardNumber: "",
    cardHolderName: "",
    expiryDate: "",
    cvv: "",
    isDefault: false,
  });

  // Load payment methods
  useEffect(() => {
    const loadPaymentMethods = async () => {
      try {
        setLoading(true);
        const response = await api.get("/payment-methods");
        setPaymentMethods(response.data.paymentMethods);
      } catch (err) {
        console.error("Error loading payment methods:", err);
        setError("Failed to load your payment methods");
      } finally {
        setLoading(false);
      }
    };

    loadPaymentMethods();
  }, []);

  // Format card number for display
  const formatCardNumber = (value) => {
    const sanitized = value.replace(/\D/g, "");
    const parts = [];

    for (let i = 0; i < sanitized.length; i += 4) {
      parts.push(sanitized.substring(i, i + 4));
    }

    return parts.join(" ").trim();
  };

  // Format expiry date
  const formatExpiryDate = (value) => {
    const sanitized = value.replace(/\D/g, "");

    if (sanitized.length > 2) {
      return `${sanitized.substring(0, 2)}/${sanitized.substring(2, 4)}`;
    }

    return sanitized;
  };

  // Handle input change
  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    let formattedValue = value;

    // Format inputs
    if (name === "cardNumber") {
      formattedValue = formatCardNumber(value);
    } else if (name === "expiryDate") {
      formattedValue = formatExpiryDate(value);
    } else if (name === "cvv") {
      formattedValue = value.replace(/\D/g, "").substring(0, 4);
    }

    setFormData((prev) => ({
      ...prev,
      [name]: type === "checkbox" ? checked : formattedValue,
    }));

    // Clear any error for this field
    if (formErrors[name]) {
      setFormErrors((prev) => ({ ...prev, [name]: "" }));
    }
  };

  // Validate form data
  // Validate form data
  const validateForm = () => {
    const errors = {};

    // Only validate card number when adding a new card (not editing)
    if (!editingId) {
      // Card number validation (only for new cards)
      if (!formData.cardNumber?.trim()) {
        errors.cardNumber = "Card number is required";
      } else {
        const sanitized = formData.cardNumber.replace(/\D/g, "");
        if (sanitized.length < 13 || sanitized.length > 19) {
          errors.cardNumber = "Card number must be between 13-19 digits";
        }
      }

      // CVV validation (only for new cards)
      if (!formData.cvv || formData.cvv.length < 3) {
        errors.cvv = "CVV must be 3 or 4 digits";
      }
    }

    // Cardholder name validation (for both new and editing)
    if (!formData.cardHolderName?.trim()) {
      errors.cardHolderName = "Cardholder name is required";
    }

    // Expiry date validation (for both new and editing)
    if (!formData.expiryDate?.trim()) {
      errors.expiryDate = "Expiry date is required";
    } else if (!/^\d{2}\/\d{2}$/.test(formData.expiryDate)) {
      errors.expiryDate = "Expiry date must be in MM/YY format";
    } else {
      const [month, year] = formData.expiryDate.split("/");
      const currentYear = new Date().getFullYear() % 100;
      const currentMonth = new Date().getMonth() + 1;

      if (parseInt(month) < 1 || parseInt(month) > 12) {
        errors.expiryDate = "Month must be between 01 and 12";
      } else if (
        parseInt(year) < currentYear ||
        (parseInt(year) === currentYear && parseInt(month) < currentMonth)
      ) {
        errors.expiryDate = "Card has expired";
      }
    }

    return errors;
  };

  // Handle form submission
  const handleSubmit = async (e) => {
    e.preventDefault();

    const errors = validateForm();
    if (Object.keys(errors).length > 0) {
      setFormErrors(errors);
      return;
    }

    setSubmitting(true);

    try {
      if (editingId) {
        // Update existing card
        await api.put(`/payment-methods/${editingId}`, {
          cardHolderName: formData.cardHolderName,
          expiryDate: formData.expiryDate,
          isDefault: formData.isDefault,
        });

        // Update the list with the new data
        setPaymentMethods((prev) =>
          prev.map((method) => {
            // Update the edited card
            if (method.id === editingId) {
              const [expiryMonth, expiryYear] = formData.expiryDate.split("/");
              return {
                ...method,
                card_holder_name: formData.cardHolderName,
                expiry_month: expiryMonth,
                expiry_year: expiryYear,
                is_default: formData.isDefault,
              };
            }
            // If setting the current card as default, unset other cards
            if (formData.isDefault) {
              return { ...method, is_default: false };
            }
            return method;
          })
        );

        // Exit edit mode and return to the list view
        setEditingId(null);
        setShowAddForm(false); // This is critical - return to the list view
      } else {
        // Add new card
        const response = await api.post("/payment-methods", {
          cardNumber: formData.cardNumber.replace(/\D/g, ""),
          cardHolderName: formData.cardHolderName,
          expiryDate: formData.expiryDate,
          isDefault: formData.isDefault,
        });

        // Add to the list
        const newCard = response.data.paymentMethod;
        setPaymentMethods((prev) => [
          ...prev.map((card) =>
            newCard.is_default ? { ...card, is_default: false } : card
          ),
          newCard,
        ]);

        // Return to the list view
        setShowAddForm(false);
      }

      // Reset form data regardless of add or edit
      setFormData({
        cardNumber: "",
        cardHolderName: "",
        expiryDate: "",
        cvv: "",
        isDefault: false,
      });

      // Clear any errors
      setFormErrors({});
    } catch (err) {
      console.error("Error saving payment method:", err);
      setError(
        `Failed to ${editingId ? "update" : "add"} payment method: ${
          err.response?.data?.error || err.message
        }`
      );
    } finally {
      setSubmitting(false);
    }
  };
  // Handle edit card
  const handleEdit = (card) => {
    setFormData({
      cardHolderName: card.card_holder_name,
      expiryDate: `${card.expiry_month}/${card.expiry_year}`,
      isDefault: card.is_default,
    });

    setEditingId(card.id);
    setShowAddForm(true);
    setFormErrors({});
  };

  // Handle delete card
  const handleDelete = async (id) => {
    if (
      !window.confirm("Are you sure you want to delete this payment method?")
    ) {
      return;
    }

    try {
      await api.delete(`/payment-methods/${id}`);
      setPaymentMethods((prev) => prev.filter((method) => method.id !== id));
    } catch (err) {
      console.error("Error deleting payment method:", err);
      setError("Failed to delete payment method");
    }
  };

  // Handle setting a card as default
  const handleSetDefault = async (id) => {
    try {
      await api.put(`/payment-methods/${id}/default`);

      // Update the list
      setPaymentMethods((prev) =>
        prev.map((method) => ({
          ...method,
          is_default: method.id === id,
        }))
      );
    } catch (err) {
      console.error("Error setting default payment method:", err);
      setError("Failed to set default payment method");
    }
  };

  // Cancel form
  const handleCancel = () => {
    setShowAddForm(false);
    setEditingId(null);
    setFormData({
      cardNumber: "",
      cardHolderName: "",
      expiryDate: "",
      cvv: "",
      isDefault: false,
    });
    setFormErrors({});
  };

  // Get card icon and color based on card type
  const getCardTypeInfo = (cardType) => {
    switch (cardType?.toLowerCase()) {
      case "visa":
        return { icon: <FaCreditCard />, color: "text-blue-600" };
      case "mastercard":
        return { icon: <FaCreditCard />, color: "text-red-600" };
      case "american express":
        return { icon: <FaCreditCard />, color: "text-green-600" };
      case "discover":
        return { icon: <FaCreditCard />, color: "text-orange-600" };
      default:
        return { icon: <FaCreditCard />, color: "text-gray-600" };
    }
  };

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex items-center mb-6">
        <Link to="/profile" className="mr-4 text-purple-600">
          <FaArrowLeft />
        </Link>
        <h1 className="text-3xl font-bold">Payment Methods</h1>
      </div>

      {error && (
        <div className="bg-red-100 text-red-700 p-4 rounded-md mb-6">
          {error}
        </div>
      )}

      {loading ? (
        <div className="flex justify-center items-center h-64">
          <FaSpinner className="animate-spin text-purple-600 text-4xl" />
        </div>
      ) : (
        <>
          {/* List of payment methods */}
          {paymentMethods.length > 0 && !showAddForm && (
            <div className="bg-white rounded-lg shadow-md p-6 mb-6">
              <h2 className="text-xl font-bold mb-4">Your Payment Methods</h2>

              <div className="space-y-4">
                {paymentMethods.map((card) => {
                  const { icon, color } = getCardTypeInfo(card.card_type);

                  return (
                    <div
                      key={card.id}
                      className={`border rounded-md p-4 ${
                        card.is_default
                          ? "border-purple-400 bg-purple-50"
                          : "border-gray-200"
                      }`}
                    >
                      <div className="flex justify-between items-start">
                        <div className="flex items-start">
                          <div className={`mr-3 mt-1 ${color}`}>{icon}</div>

                          <div>
                            <div className="font-medium">
                              {card.card_type} •••• {card.last_four}
                              {card.is_default && (
                                <span className="ml-2 text-xs bg-purple-100 text-purple-700 px-2 py-1 rounded">
                                  Default
                                </span>
                              )}
                            </div>

                            <div className="text-sm text-gray-600">
                              {card.card_holder_name}
                            </div>

                            <div className="text-sm text-gray-500">
                              Expires {card.expiry_month}/{card.expiry_year}
                            </div>
                          </div>
                        </div>

                        <div className="flex space-x-2">
                          {!card.is_default && (
                            <button
                              onClick={() => handleSetDefault(card.id)}
                              className="text-gray-500 hover:text-purple-600"
                              title="Set as default"
                            >
                              <FaRegStar />
                            </button>
                          )}

                          <button
                            onClick={() => handleEdit(card)}
                            className="text-gray-500 hover:text-blue-600"
                            title="Edit card"
                          >
                            <FaPencilAlt />
                          </button>

                          <button
                            onClick={() => handleDelete(card.id)}
                            className="text-gray-500 hover:text-red-600"
                            title="Delete card"
                          >
                            <FaTrash />
                          </button>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* Empty state */}
          {paymentMethods.length === 0 && !showAddForm && (
            <div className="bg-white rounded-lg shadow-md p-6 mb-6 text-center">
              <div className="w-16 h-16 bg-purple-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <FaCreditCard className="text-purple-600 text-2xl" />
              </div>

              <h2 className="text-xl font-bold mb-2">No Payment Methods</h2>
              <p className="text-gray-600 mb-4">
                You haven't added any payment methods yet.
              </p>
            </div>
          )}

          {/* Add new card button */}
          {!showAddForm && (
            <button
              onClick={() => setShowAddForm(true)}
              className="bg-purple-600 hover:bg-purple-700 text-white font-bold py-3 px-6 rounded-md flex items-center"
            >
              <FaPlus className="mr-2" />
              Add Payment Method
            </button>
          )}

          {/* Add/Edit card form */}
          {showAddForm && (
            <div className="bg-white rounded-lg shadow-md p-6 mb-6">
              <h2 className="text-xl font-bold mb-4">
                {editingId ? "Edit Payment Method" : "Add New Payment Method"}
              </h2>

              <form onSubmit={handleSubmit}>
                {/* Card number field (only for new cards) */}
                {!editingId && (
                  <div className="mb-4">
                    <label className="block text-gray-700 font-medium mb-2">
                      Card Number
                    </label>
                    <div className="relative">
                      <input
                        type="text"
                        name="cardNumber"
                        value={formData.cardNumber}
                        onChange={handleChange}
                        placeholder="1234 5678 9012 3456"
                        className={`w-full p-3 pl-10 border rounded-md ${
                          formErrors.cardNumber
                            ? "border-red-500"
                            : "border-gray-300"
                        }`}
                        maxLength="19"
                      />
                      <FaRegCreditCard className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                    </div>
                    {formErrors.cardNumber && (
                      <p className="text-red-500 text-sm mt-1">
                        {formErrors.cardNumber}
                      </p>
                    )}
                  </div>
                )}

                {/* Cardholder name */}
                <div className="mb-4">
                  <label className="block text-gray-700 font-medium mb-2">
                    Cardholder Name
                  </label>
                  <input
                    type="text"
                    name="cardHolderName"
                    value={formData.cardHolderName}
                    onChange={handleChange}
                    placeholder="John Smith"
                    className={`w-full p-3 border rounded-md ${
                      formErrors.cardHolderName
                        ? "border-red-500"
                        : "border-gray-300"
                    }`}
                  />
                  {formErrors.cardHolderName && (
                    <p className="text-red-500 text-sm mt-1">
                      {formErrors.cardHolderName}
                    </p>
                  )}
                </div>

                <div className="flex space-x-4 mb-4">
                  {/* Expiry date */}
                  <div className="w-1/2">
                    <label className="block text-gray-700 font-medium mb-2">
                      Expiry Date
                    </label>
                    <div className="relative">
                      <input
                        type="text"
                        name="expiryDate"
                        value={formData.expiryDate}
                        onChange={handleChange}
                        placeholder="MM/YY"
                        className={`w-full p-3 pl-10 border rounded-md ${
                          formErrors.expiryDate
                            ? "border-red-500"
                            : "border-gray-300"
                        }`}
                        maxLength="5"
                      />
                      <FaRegCalendarAlt className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                    </div>
                    {formErrors.expiryDate && (
                      <p className="text-red-500 text-sm mt-1">
                        {formErrors.expiryDate}
                      </p>
                    )}
                  </div>

                  {/* CVV (only for new cards) */}
                  {!editingId && (
                    <div className="w-1/2">
                      <label className="block text-gray-700 font-medium mb-2">
                        CVV
                      </label>
                      <input
                        type="password"
                        name="cvv"
                        value={formData.cvv}
                        onChange={handleChange}
                        placeholder="123"
                        className={`w-full p-3 border rounded-md ${
                          formErrors.cvv ? "border-red-500" : "border-gray-300"
                        }`}
                        maxLength="4"
                      />
                      {formErrors.cvv && (
                        <p className="text-red-500 text-sm mt-1">
                          {formErrors.cvv}
                        </p>
                      )}
                    </div>
                  )}
                </div>

                {/* Default card checkbox */}
                <div className="mb-6">
                  <label className="flex items-center">
                    <input
                      type="checkbox"
                      name="isDefault"
                      checked={formData.isDefault}
                      onChange={handleChange}
                      className="mr-2"
                    />
                    <span>Set as default payment method</span>
                  </label>
                </div>

                {/* Form buttons */}
                <div className="flex justify-end space-x-3">
                  <button
                    type="button"
                    onClick={handleCancel}
                    className="px-4 py-2 border border-gray-300 rounded-md text-gray-700"
                  >
                    Cancel
                  </button>

                  <button
                    type="submit"
                    disabled={submitting}
                    className={`px-4 py-2 bg-purple-600 text-white rounded-md hover:bg-purple-700 flex items-center ${
                      submitting ? "opacity-70 cursor-not-allowed" : ""
                    }`}
                  >
                    {submitting ? (
                      <>
                        <FaSpinner className="animate-spin mr-2" />
                        Saving...
                      </>
                    ) : (
                      <>
                        <FaCheck className="mr-2" />
                        {editingId ? "Save Changes" : "Add Card"}
                      </>
                    )}
                  </button>
                </div>
              </form>
            </div>
          )}
        </>
      )}
    </div>
  );
};

export default PaymentMethods;
