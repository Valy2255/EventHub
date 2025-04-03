// src/pages/Checkout.jsx
import { useState, useEffect } from "react";
import { useNavigate, Link } from "react-router-dom";
import {
  FaLock,
  FaCreditCard,
  FaTicketAlt,
  FaCalendarAlt,
  FaMapMarkerAlt,
  FaArrowLeft,
  FaSpinner,
  FaCheck,
} from "react-icons/fa";
import { useAuth } from "../hooks/useAuth";
import api from "../services/api";

const Checkout = () => {
  const [tickets, setTickets] = useState([]);
  const [event, setEvent] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [submitting, setSubmitting] = useState(false);
  const [step, setStep] = useState(1); // 1 = review, 2 = payment, 3 = confirmation
  const [totalAmount, setTotalAmount] = useState(0);

  // Payment form state
  const [paymentMethod, setPaymentMethod] = useState("card");
  const [cardNumber, setCardNumber] = useState("");
  const [cardName, setCardName] = useState("");
  const [expiryDate, setExpiryDate] = useState("");
  const [cvv, setCvv] = useState("");
  const [paymentErrors, setPaymentErrors] = useState({});
  const [paymentSuccess, setPaymentSuccess] = useState(false);
  const [orderNumber, setOrderNumber] = useState("");

  const { user } = useAuth();
  const navigate = useNavigate();

  // Use paymentSuccess in a conditional or remove the variable
  // If you need to keep it, use it somewhere:
  useEffect(() => {
    if (paymentSuccess) {
      // Maybe do something like clear the form or shopping cart
      console.log("Payment processed successfully");
    }
  }, [paymentSuccess]);
  // Load tickets from session storage
  useEffect(() => {
    const loadCheckoutData = async () => {
      try {
        setLoading(true);

        // Check if user is logged in
        if (!user) {
          // Redirect to login and return to checkout after login
          navigate("/login", { state: { from: "/checkout" } });
          return;
        }

        // Get tickets from session storage
        const storedTickets = sessionStorage.getItem("checkoutTickets");
        const eventId = sessionStorage.getItem("eventId");

        if (!storedTickets || !eventId) {
          setError(
            "No tickets selected. Please go back to the event page and select tickets."
          );
          setLoading(false);
          return;
        }

        const ticketData = JSON.parse(storedTickets);
        setTickets(ticketData);

        // Calculate total
        const total = ticketData.reduce((sum, ticket) => {
          return sum + ticket.price * ticket.quantity;
        }, 0);
        setTotalAmount(total);

        // Fetch event details
        const response = await api.get(`/events/${eventId}`);
        setEvent(response.data.event);
      } catch (err) {
        console.error("Error loading checkout data:", err);
        setError("Error loading checkout data. Please try again.");
      } finally {
        setLoading(false);
      }
    };

    loadCheckoutData();
  }, [user, navigate]);

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

  // Validate payment form
  const validatePaymentForm = () => {
    const errors = {};

    if (paymentMethod === "card") {
      if (!cardNumber.trim()) {
        errors.cardNumber = "Card number is required";
      } else if (!/^\d{16}$/.test(cardNumber.replace(/\s/g, ""))) {
        errors.cardNumber = "Card number must be 16 digits";
      }

      if (!cardName.trim()) {
        errors.cardName = "Cardholder name is required";
      }

      if (!expiryDate.trim()) {
        errors.expiryDate = "Expiry date is required";
      } else if (!/^\d{2}\/\d{2}$/.test(expiryDate)) {
        errors.expiryDate = "Expiry date must be in MM/YY format";
      }

      if (!cvv.trim()) {
        errors.cvv = "CVV is required";
      } else if (!/^\d{3,4}$/.test(cvv)) {
        errors.cvv = "CVV must be 3 or 4 digits";
      }
    }

    return errors;
  };

  // Handle payment submission
  const handlePaymentSubmit = async (e) => {
    e.preventDefault();

    // Validate form
    const formErrors = validatePaymentForm();
    if (Object.keys(formErrors).length > 0) {
      setPaymentErrors(formErrors);
      return;
    }

    // Clear previous errors
    setPaymentErrors({});
    setSubmitting(true);

    try {
      // In a real application, you would integrate with a payment gateway here
      // For demo purposes, we'll simulate a successful payment

      // Create a payment record
      const paymentResponse = await api.post("/payments", {
        amount: totalAmount,
        paymentMethod,
        currency: "USD",
        tickets: tickets.map((ticket) => ({
          ticketTypeId: ticket.ticketTypeId,
          quantity: ticket.quantity,
          price: ticket.price,
          eventId: event.id,
        })),
      });

      // Set order number from response
      setOrderNumber(paymentResponse.data.orderNumber || "ORD-" + Date.now());

      // Move to confirmation step
      setPaymentSuccess(true);
      setStep(3);

      // Clear checkout data from session storage
      sessionStorage.removeItem("checkoutTickets");
      sessionStorage.removeItem("eventId");
    } catch (err) {
      console.error("Payment error:", err);
      setPaymentErrors({
        general:
          err.response?.data?.error || "Payment failed. Please try again.",
      });
    } finally {
      setSubmitting(false);
    }
  };

  // Render page content based on step
  const renderContent = () => {
    if (loading) {
      return (
        <div className="flex justify-center items-center h-64">
          <FaSpinner className="animate-spin text-purple-600 text-4xl" />
        </div>
      );
    }

    if (error) {
      return (
        <div className="bg-red-100 text-red-700 p-4 rounded-md">
          <p>{error}</p>
          <Link
            to="/"
            className="text-purple-600 font-medium mt-4 inline-block"
          >
            Back to Home
          </Link>
        </div>
      );
    }

    if (step === 1) {
      return renderOrderReview();
    } else if (step === 2) {
      return renderPaymentForm();
    } else if (step === 3) {
      return renderConfirmation();
    }
  };

  // Render order review step
  const renderOrderReview = () => {
    return (
      <div>
        <h2 className="text-2xl font-bold mb-6">Review Your Order</h2>

        {/* Event details */}
        <div className="bg-white p-6 rounded-lg shadow-md mb-6">
          <div className="flex">
            <div className="w-24 h-24 bg-gray-200 rounded overflow-hidden mr-4">
              {event.image_url && (
                <img
                  src={event.image_url}
                  alt={event.name}
                  className="w-full h-full object-cover"
                />
              )}
            </div>
            <div>
              <h3 className="text-xl font-bold">{event.name}</h3>
              <div className="text-gray-600 mt-1">
                <div className="flex items-center mb-1">
                  <FaCalendarAlt className="mr-2 text-gray-500" />
                  {formatDate(event.date)} at {formatTime(event.time)}
                </div>
                <div className="flex items-center">
                  <FaMapMarkerAlt className="mr-2 text-gray-500" />
                  {event.venue}, {event.city}
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Ticket summary */}
        <div className="bg-white p-6 rounded-lg shadow-md mb-6">
          <h3 className="text-lg font-bold mb-4">Ticket Summary</h3>

          {tickets.map((ticket, index) => (
            <div
              key={index}
              className="flex justify-between items-center py-3 border-b border-gray-200 last:border-0"
            >
              <div>
                <div className="font-medium">{ticket.name}</div>
                <div className="text-sm text-gray-600">
                  Quantity: {ticket.quantity}
                </div>
              </div>
              <div className="text-right">
                <div>${ticket.price.toFixed(2)} each</div>
                <div className="font-bold">
                  ${(ticket.price * ticket.quantity).toFixed(2)}
                </div>
              </div>
            </div>
          ))}

          <div className="mt-6 pt-4 border-t border-gray-200">
            <div className="flex justify-between font-bold text-lg">
              <span>Total:</span>
              <span>${totalAmount.toFixed(2)}</span>
            </div>
          </div>
        </div>

        {/* Cancellation policy */}
        {event.cancellation_policy && (
          <div className="bg-white p-6 rounded-lg shadow-md mb-6">
            <h3 className="text-lg font-bold mb-2">Cancellation Policy</h3>
            <p className="text-gray-700">{event.cancellation_policy}</p>
          </div>
        )}

        {/* Continue button */}
        <div className="flex justify-between">
          <Link
            to={`/events/${event.id}`}
            className="flex items-center text-purple-600 font-medium"
          >
            <FaArrowLeft className="mr-2" /> Back to Event
          </Link>

          <button
            onClick={() => setStep(2)}
            className="bg-purple-600 hover:bg-purple-700 text-white font-bold py-3 px-8 rounded-md"
          >
            Proceed to Payment
          </button>
        </div>
      </div>
    );
  };

  // Render payment form step
  const renderPaymentForm = () => {
    return (
      <div>
        <h2 className="text-2xl font-bold mb-6">Payment Method</h2>

        {/* Error message */}
        {paymentErrors.general && (
          <div className="bg-red-100 text-red-700 p-4 rounded-md mb-6">
            {paymentErrors.general}
          </div>
        )}

        {/* Payment form */}
        <form onSubmit={handlePaymentSubmit}>
          <div className="bg-white p-6 rounded-lg shadow-md mb-6">
            {/* Payment method options */}
            <div className="mb-6">
              <h3 className="text-lg font-bold mb-3">Select Payment Method</h3>
              <div className="flex space-x-4">
                <label
                  className={`flex items-center border rounded-md p-4 cursor-pointer ${
                    paymentMethod === "card"
                      ? "border-purple-600 bg-purple-50"
                      : "border-gray-300"
                  }`}
                >
                  <input
                    type="radio"
                    name="paymentMethod"
                    value="card"
                    checked={paymentMethod === "card"}
                    onChange={() => setPaymentMethod("card")}
                    className="sr-only"
                  />
                  <FaCreditCard
                    className={`mr-2 ${
                      paymentMethod === "card"
                        ? "text-purple-600"
                        : "text-gray-400"
                    }`}
                  />
                  <span
                    className={
                      paymentMethod === "card"
                        ? "text-purple-600 font-medium"
                        : "text-gray-600"
                    }
                  >
                    Credit/Debit Card
                  </span>
                </label>
              </div>
            </div>

            {/* Card details (only shown if card payment is selected) */}
            {paymentMethod === "card" && (
              <div className="space-y-4">
                <div>
                  <label className="block text-gray-700 font-medium mb-2">
                    Card Number
                  </label>
                  <input
                    type="text"
                    value={cardNumber}
                    onChange={(e) => setCardNumber(e.target.value)}
                    placeholder="1234 5678 9012 3456"
                    className={`w-full p-3 border rounded-md ${
                      paymentErrors.cardNumber
                        ? "border-red-500"
                        : "border-gray-300"
                    }`}
                    maxLength="19"
                  />
                  {paymentErrors.cardNumber && (
                    <p className="text-red-500 text-sm mt-1">
                      {paymentErrors.cardNumber}
                    </p>
                  )}
                </div>

                <div>
                  <label className="block text-gray-700 font-medium mb-2">
                    Cardholder Name
                  </label>
                  <input
                    type="text"
                    value={cardName}
                    onChange={(e) => setCardName(e.target.value)}
                    placeholder="John Smith"
                    className={`w-full p-3 border rounded-md ${
                      paymentErrors.cardName
                        ? "border-red-500"
                        : "border-gray-300"
                    }`}
                  />
                  {paymentErrors.cardName && (
                    <p className="text-red-500 text-sm mt-1">
                      {paymentErrors.cardName}
                    </p>
                  )}
                </div>

                <div className="flex space-x-4">
                  <div className="w-1/2">
                    <label className="block text-gray-700 font-medium mb-2">
                      Expiry Date
                    </label>
                    <input
                      type="text"
                      value={expiryDate}
                      onChange={(e) => setExpiryDate(e.target.value)}
                      placeholder="MM/YY"
                      className={`w-full p-3 border rounded-md ${
                        paymentErrors.expiryDate
                          ? "border-red-500"
                          : "border-gray-300"
                      }`}
                      maxLength="5"
                    />
                    {paymentErrors.expiryDate && (
                      <p className="text-red-500 text-sm mt-1">
                        {paymentErrors.expiryDate}
                      </p>
                    )}
                  </div>

                  <div className="w-1/2">
                    <label className="block text-gray-700 font-medium mb-2">
                      CVV
                    </label>
                    <input
                      type="text"
                      value={cvv}
                      onChange={(e) => setCvv(e.target.value)}
                      placeholder="123"
                      className={`w-full p-3 border rounded-md ${
                        paymentErrors.cvv ? "border-red-500" : "border-gray-300"
                      }`}
                      maxLength="4"
                    />
                    {paymentErrors.cvv && (
                      <p className="text-red-500 text-sm mt-1">
                        {paymentErrors.cvv}
                      </p>
                    )}
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Order summary for this step */}
          <div className="bg-white p-6 rounded-lg shadow-md mb-6">
            <h3 className="text-lg font-bold mb-4">Order Summary</h3>
            <div className="flex justify-between text-lg mb-2">
              <span>Total Amount:</span>
              <span className="font-bold">${totalAmount.toFixed(2)}</span>
            </div>
          </div>

          {/* Navigation buttons */}
          <div className="flex justify-between">
            <button
              type="button"
              onClick={() => setStep(1)}
              className="text-purple-600 font-medium flex items-center"
            >
              <FaArrowLeft className="mr-2" /> Back to Review
            </button>

            <button
              type="submit"
              disabled={submitting}
              className={`bg-purple-600 hover:bg-purple-700 text-white font-bold py-3 px-8 rounded-md flex items-center ${
                submitting ? "opacity-70 cursor-not-allowed" : ""
              }`}
            >
              {submitting ? (
                <>
                  <FaSpinner className="animate-spin mr-2" /> Processing...
                </>
              ) : (
                <>
                  <FaLock className="mr-2" /> Complete Payment
                </>
              )}
            </button>
          </div>

          <div className="mt-4 text-center text-sm text-gray-500">
            <FaLock className="inline mr-1" /> Your payment information is
            secure and encrypted
          </div>
        </form>
      </div>
    );
  };

  // Render confirmation step
  const renderConfirmation = () => {
    return (
      <div className="text-center py-8">
        <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6">
          <FaCheck className="text-green-600 text-2xl" />
        </div>

        <h2 className="text-3xl font-bold mb-2">Payment Successful!</h2>
        <p className="text-xl text-gray-600 mb-6">
          Your tickets have been reserved
        </p>

        <div className="bg-white p-6 rounded-lg shadow-md max-w-md mx-auto mb-8">
          <div className="border-b border-gray-200 pb-4 mb-4">
            <div className="text-sm text-gray-500">Order Number</div>
            <div className="text-xl font-bold">{orderNumber}</div>
          </div>

          <div className="space-y-3">
            <div className="flex justify-between">
              <span className="text-gray-600">Event:</span>
              <span className="font-medium">{event.name}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">Date:</span>
              <span>{formatDate(event.date)}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">Time:</span>
              <span>{formatTime(event.time)}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">Venue:</span>
              <span>{event.venue}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">Amount Paid:</span>
              <span className="font-bold">${totalAmount.toFixed(2)}</span>
            </div>
          </div>
        </div>

        <p className="mb-8">
          We've sent the tickets to your email address. <br />
          You can also view your tickets in your account.
        </p>

        <div className="flex justify-center space-x-4">
          <Link
            to="/profile/tickets"
            className="bg-purple-600 hover:bg-purple-700 text-white font-bold py-3 px-8 rounded-md flex items-center"
          >
            <FaTicketAlt className="mr-2" /> View My Tickets
          </Link>

          <Link
            to="/"
            className="border border-purple-600 text-purple-600 font-bold py-3 px-8 rounded-md"
          >
            Back to Home
          </Link>
        </div>
      </div>
    );
  };

  return (
    <div className="bg-gray-100 min-h-screen py-12">
      <div className="container mx-auto px-4 max-w-4xl">
        {/* Progress steps */}
        <div className="mb-10">
          <div className="flex items-center justify-between">
            <div
              className={`flex flex-col items-center ${
                step >= 1 ? "text-purple-600" : "text-gray-400"
              }`}
            >
              <div
                className={`w-10 h-10 rounded-full flex items-center justify-center ${
                  step >= 1
                    ? "bg-purple-600 text-white"
                    : "bg-gray-200 text-gray-400"
                }`}
              >
                1
              </div>
              <div className="mt-2 text-sm font-medium">Review</div>
            </div>

            <div
              className={`w-full border-t border-2 mx-4 ${
                step >= 2 ? "border-purple-600" : "border-gray-200"
              }`}
            />

            <div
              className={`flex flex-col items-center ${
                step >= 2 ? "text-purple-600" : "text-gray-400"
              }`}
            >
              <div
                className={`w-10 h-10 rounded-full flex items-center justify-center ${
                  step >= 2
                    ? "bg-purple-600 text-white"
                    : "bg-gray-200 text-gray-400"
                }`}
              >
                2
              </div>
              <div className="mt-2 text-sm font-medium">Payment</div>
            </div>

            <div
              className={`w-full border-t border-2 mx-4 ${
                step >= 3 ? "border-purple-600" : "border-gray-200"
              }`}
            />

            <div
              className={`flex flex-col items-center ${
                step >= 3 ? "text-purple-600" : "text-gray-400"
              }`}
            >
              <div
                className={`w-10 h-10 rounded-full flex items-center justify-center ${
                  step >= 3
                    ? "bg-purple-600 text-white"
                    : "bg-gray-200 text-gray-400"
                }`}
              >
                3
              </div>
              <div className="mt-2 text-sm font-medium">Confirmation</div>
            </div>
          </div>
        </div>

        {renderContent()}
      </div>
    </div>
  );
};

export default Checkout;
