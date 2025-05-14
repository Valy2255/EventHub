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
  FaRegCreditCard,
  FaRegCalendarAlt,
  FaCoins,
  FaPlus,
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
  const [userCredits, setUserCredits] = useState(0);
  const [loadingCredits, setLoadingCredits] = useState(false);

  // Payment form state
  const [paymentMethod, setPaymentMethod] = useState("card");
  const [cardNumber, setCardNumber] = useState("");
  const [cardName, setCardName] = useState("");
  const [expiryDate, setExpiryDate] = useState("");
  const [cvv, setCvv] = useState("");
  const [paymentErrors, setPaymentErrors] = useState({});
  const [paymentSuccess, setPaymentSuccess] = useState(false);
  const [orderNumber, setOrderNumber] = useState("");
  const [paymentCompleted, setPaymentCompleted] = useState(false);
  const [savedCards, setSavedCards] = useState([]);
  const [loadingCards, setLoadingCards] = useState(false);
  const [selectedCardId, setSelectedCardId] = useState(null);
  const [saveNewCard, setSaveNewCard] = useState(false);

  const { user, setUser } = useAuth();
  const navigate = useNavigate();

  const formatCardNumber = (value) => {
    const sanitized = value.replace(/\D/g, "");
    const parts = [];

    for (let i = 0; i < sanitized.length; i += 4) {
      parts.push(sanitized.substring(i, i + 4));
    }

    return parts.join(" ").trim();
  };

  const formatExpiryDate = (value) => {
    const sanitized = value.replace(/\D/g, "");

    if (sanitized.length > 2) {
      return `${sanitized.substring(0, 2)}/${sanitized.substring(2, 4)}`;
    }

    return sanitized;
  };

  const validateCardNumber = (cardNumber) => {
    const sanitized = cardNumber.replace(/\D/g, "");

    if (sanitized.length < 13 || sanitized.length > 19) {
      return {
        valid: false,
        message: "Card number must be between 13 and 19 digits",
      };
    }

    let sum = 0;
    let shouldDouble = false;

    for (let i = sanitized.length - 1; i >= 0; i--) {
      let digit = parseInt(sanitized.charAt(i), 10);

      if (shouldDouble) {
        digit *= 2;
        if (digit > 9) digit -= 9;
      }

      sum += digit;
      shouldDouble = !shouldDouble;
    }

    const valid = sum % 10 === 0;
    return {
      valid,
      message: valid ? "" : "Invalid card number",
    };
  };

  const validateExpiryDate = (expiryDate) => {
    if (!/^\d{2}\/\d{2}$/.test(expiryDate)) {
      return { valid: false, message: "Expiry date must be in MM/YY format" };
    }

    const [monthStr, yearStr] = expiryDate.split("/");
    const month = parseInt(monthStr, 10);
    const year = parseInt(yearStr, 10) + 2000;

    // Check if month is valid
    if (month < 1 || month > 12) {
      return { valid: false, message: "Month must be between 01 and 12" };
    }

    const now = new Date();
    const currentMonth = now.getMonth() + 1;
    const currentYear = now.getFullYear();

    if (year < currentYear || (year === currentYear && month < currentMonth)) {
      return { valid: false, message: "Card has expired" };
    }

    if (year > currentYear + 10) {
      return { valid: false, message: "Expiry date is too far in the future" };
    }

    return { valid: true, message: "" };
  };

  const validateCVV = (cvv) => {
    const sanitized = cvv.replace(/\D/g, "");

    if (sanitized.length < 3 || sanitized.length > 4) {
      return { valid: false, message: "CVV must be 3 or 4 digits" };
    }

    return { valid: true, message: "" };
  };

  useEffect(() => {
    const loadUserCredits = async () => {
      if (!user) return;

      try {
        setLoadingCredits(true);
        const response = await api.get("/credits");
        setUserCredits(response.data.credits);
      } catch (err) {
        console.error("Error loading user credits:", err);
      } finally {
        setLoadingCredits(false);
      }
    };

    loadUserCredits();
  }, [user]);

  useEffect(() => {
    if (paymentSuccess) {
      console.log("Payment processed successfully");
    }
  }, [paymentSuccess]);

  // Load saved cards when payment method is 'card'
  useEffect(() => {
    const loadSavedCards = async () => {
      if (paymentMethod === "card") {
        try {
          setLoadingCards(true);
          const response = await api.get("/payment-methods");
          setSavedCards(response.data.paymentMethods);

          // If there's a default card, select it
          const defaultCard = response.data.paymentMethods.find(
            (card) => card.is_default
          );
          if (defaultCard) {
            setSelectedCardId(defaultCard.id);
          }
        } catch (err) {
          console.error("Error loading saved cards:", err);
        } finally {
          setLoadingCards(false);
        }
      }
    };

    loadSavedCards();
  }, [paymentMethod]);

  useEffect(() => {
    const loadCheckoutData = async () => {
      // Skip loading if payment has already been completed
      if (paymentCompleted) {
        return;
      }

      try {
        setLoading(true);

        if (!user) {
          navigate("/login", { state: { from: "/checkout" } });
          return;
        }

        const storedTickets = sessionStorage.getItem("checkoutTickets");
        const eventId = sessionStorage.getItem("eventId");

        console.log("Checking session storage:", {
          hasStoredTickets: Boolean(storedTickets),
          hasEventId: Boolean(eventId),
        });

        // Only show the error if we're not already in the confirmation step
        if ((!storedTickets || !eventId) && step !== 3) {
          setError(
            "No tickets selected. Please go back to the event page and select tickets."
          );
          setLoading(false);
          return;
        }

        // Skip the rest if we don't have ticket data and are in confirmation step
        if ((!storedTickets || !eventId) && step === 3) {
          setLoading(false);
          return;
        }

        try {
          const ticketData = JSON.parse(storedTickets).map((ticket) => ({
            ...ticket,
            price: Number(ticket.price),
          }));
          setTickets(ticketData);

          const total = ticketData.reduce((sum, ticket) => {
            return sum + ticket.price * ticket.quantity;
          }, 0);
          setTotalAmount(total);

          const response = await api.get(`/events/${eventId}`);
          setEvent(response.data.event);
        } catch (parseError) {
          console.error("Error processing ticket data:", parseError);
          // Only show error if not in confirmation step
          if (step !== 3) {
            setError("Error processing ticket data. Please try again.");
          }
        }
      } catch (err) {
        console.error("Error loading checkout data:", err);
        // Only show error if not in confirmation step
        if (step !== 3) {
          setError("Error loading checkout data. Please try again.");
        }
      } finally {
        setLoading(false);
      }
    };

    loadCheckoutData();
  }, [user, navigate, paymentCompleted, step]);

  // Also, add this useEffect to load user credits separately
  useEffect(() => {
    const loadUserCredits = async () => {
      if (!user) return;

      try {
        setLoadingCredits(true);
        const response = await api.get("/credits");
        console.log("Loaded user credits:", response.data.credits);
        setUserCredits(response.data.credits);
      } catch (err) {
        console.error("Error loading user credits:", err);
      } finally {
        setLoadingCredits(false);
      }
    };

    loadUserCredits();
  }, [user]);

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

  const handleCardNumberChange = (e) => {
    const formatted = formatCardNumber(e.target.value);
    setCardNumber(formatted);

    if (paymentErrors.cardNumber) {
      setPaymentErrors({ ...paymentErrors, cardNumber: "" });
    }
  };

  const handleExpiryDateChange = (e) => {
    const formatted = formatExpiryDate(e.target.value);
    setExpiryDate(formatted);

    if (paymentErrors.expiryDate) {
      setPaymentErrors({ ...paymentErrors, expiryDate: "" });
    }
  };

  const validatePaymentForm = () => {
    const errors = {};

    if (paymentMethod === "credits") {
      if (userCredits < totalAmount) {
        errors.general = `Insufficient credits. You need ${totalAmount.toFixed(
          2
        )} credits but have ${userCredits.toFixed(2)}.`;
      }
    } else if (paymentMethod === "card") {
      const cardNumberResult = validateCardNumber(cardNumber);
      if (!cardNumberResult.valid) {
        errors.cardNumber = cardNumberResult.message;
      }

      if (!cardName.trim()) {
        errors.cardName = "Cardholder name is required";
      }

      const expiryDateResult = validateExpiryDate(expiryDate);
      if (!expiryDateResult.valid) {
        errors.expiryDate = expiryDateResult.message;
      }

      const cvvResult = validateCVV(cvv);
      if (!cvvResult.valid) {
        errors.cvv = cvvResult.message;
      }
    }

    return errors;
  };

  // Improved handlePaymentSubmit function for Checkout.jsx

  const handlePaymentSubmit = async (e) => {
    e.preventDefault();

    let formErrors = {};

    // For a saved card, we only validate if a card is selected
    if (paymentMethod === "card" && selectedCardId === null) {
      formErrors = validatePaymentForm();
    } else if (paymentMethod === "credits") {
      if (userCredits < totalAmount) {
        formErrors.general = `Insufficient credits. You need ${totalAmount.toFixed(
          2
        )} credits but have ${userCredits.toFixed(2)}.`;
      }
    }

    if (Object.keys(formErrors).length > 0) {
      setPaymentErrors(formErrors);
      return;
    }

    setPaymentErrors({});
    setSubmitting(true);

    try {
      // Prepare payment data
      const paymentData = {
        amount: totalAmount,
        paymentMethod,
        currency: "USD",
        useCredits: paymentMethod === "credits",
        tickets: tickets.map((ticket) => ({
          ticketTypeId: ticket.ticketTypeId,
          quantity: ticket.quantity,
          price: ticket.price,
          eventId: event.id,
        })),
      };

      // If using a saved card, add the card ID
      if (paymentMethod === "card" && selectedCardId) {
        paymentData.savedCardId = selectedCardId;
      }
      // If using a new card and want to save it
      else if (paymentMethod === "card" && saveNewCard) {
        paymentData.saveCard = true;
        paymentData.cardDetails = {
          cardNumber: cardNumber.replace(/\D/g, ""),
          cardHolderName: cardName,
          expiryDate,
          isDefault: false,
        };
      }

      const paymentResponse = await api.post("/payments", paymentData);

      console.log("Payment successful:", paymentResponse.data);

      // If payment was made with credits, update the local state
      if (
        paymentMethod === "credits" &&
        paymentResponse.data.currentCredits !== undefined
      ) {
        setUserCredits(paymentResponse.data.currentCredits);
        setUser({
          ...user,
          credits: paymentResponse.data.currentCredits,
        });
      }

      setOrderNumber(paymentResponse.data.orderNumber || "ORD-" + Date.now());
      setPaymentSuccess(true);
      setPaymentCompleted(true);
      setStep(3);

      sessionStorage.removeItem("checkoutTickets");
      sessionStorage.removeItem("eventId");
    } catch (err) {
      console.error("Payment error:", err);
      setPaymentErrors({
        general:
          err.response?.data?.error ||
          "Payment processing failed. Please try again.",
      });
    } finally {
      setSubmitting(false);
    }
  };

  // 4. Update renderContent to handle the payment completed state
  const renderContent = () => {
    // If payment is completed and we're on step 3, always show confirmation
    if (paymentCompleted && step === 3) {
      return renderConfirmation();
    }

    if (loading) {
      return (
        <div className="flex justify-center items-center h-64">
          <FaSpinner className="animate-spin text-purple-600 text-4xl" />
        </div>
      );
    }

    // Only show error if we're not already in confirmation step
    if (error && step !== 3) {
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
  // Handle selecting a saved card
  const handleSelectCard = (id) => {
    setSelectedCardId(id);
    // Clear any card-related errors
    setPaymentErrors({
      ...paymentErrors,
      cardNumber: '',
      cardName: '',
      expiryDate: '',
      cvv: ''
    });
  };

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
            <div className="flex flex-col space-y-3 md:flex-row md:space-y-0 md:space-x-4">
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

              <label
                className={`flex items-center border rounded-md p-4 ${
                  paymentMethod === "credits"
                    ? "border-purple-600 bg-purple-50"
                    : "border-gray-300"
                } ${
                  totalAmount > userCredits
                    ? "cursor-not-allowed opacity-70"
                    : "cursor-pointer"
                }`}
              >
                <input
                  type="radio"
                  name="paymentMethod"
                  value="credits"
                  checked={paymentMethod === "credits"}
                  onChange={() =>
                    totalAmount <= userCredits && setPaymentMethod("credits")
                  }
                  disabled={totalAmount > userCredits}
                  className="sr-only"
                />
                <FaCoins
                  className={`mr-2 ${
                    paymentMethod === "credits"
                      ? "text-purple-600"
                      : "text-gray-400"
                  }`}
                />
                <div className="flex flex-col">
                  <span
                    className={
                      paymentMethod === "credits"
                        ? "text-purple-600 font-medium"
                        : "text-gray-600"
                    }
                  >
                    Pay with Credits
                  </span>
                  <span className="text-xs text-gray-500">
                    {loadingCredits ? (
                      <FaSpinner className="animate-spin inline-block mr-1" />
                    ) : (
                      `Balance: ${parseFloat(userCredits).toFixed(2)} credits`
                    )}
                  </span>

                  {totalAmount > userCredits && (
                    <span className="text-xs text-red-500 mt-1">
                      Insufficient credits. Need{" "}
                      {(totalAmount - userCredits).toFixed(2)} more.
                    </span>
                  )}
                </div>
              </label>
            </div>
          </div>

          {/* Card details (only shown if card payment is selected) */}
          {paymentMethod === "card" && (
            <div>
              {/* Saved cards section */}
              {savedCards.length > 0 && (
                <div className="mb-6">
                  <h4 className="font-medium mb-3">Your Saved Cards</h4>
                  
                  {loadingCards ? (
                    <div className="flex justify-center py-4">
                      <FaSpinner className="animate-spin text-purple-600" />
                    </div>
                  ) : (
                    <div className="space-y-3">
                      {savedCards.map(card => (
                        <label 
                          key={card.id} 
                          className={`flex items-center border rounded-md p-3 cursor-pointer ${
                            selectedCardId === card.id 
                              ? 'border-purple-600 bg-purple-50' 
                              : 'border-gray-300'
                          }`}
                        >
                          <input
                            type="radio"
                            name="savedCard"
                            checked={selectedCardId === card.id}
                            onChange={() => handleSelectCard(card.id)}
                            className="sr-only"
                          />
                          
                          <div className="flex-1 flex items-center">
                            <FaCreditCard 
                              className={`mr-3 ${selectedCardId === card.id ? 'text-purple-600' : 'text-gray-400'}`} 
                            />
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
                                {card.card_holder_name} • Expires {card.expiry_month}/{card.expiry_year}
                              </div>
                            </div>
                          </div>
                          
                          <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center ${
                            selectedCardId === card.id ? 'border-purple-600' : 'border-gray-300'
                          }`}>
                            {selectedCardId === card.id && (
                              <div className="w-3 h-3 rounded-full bg-purple-600" />
                            )}
                          </div>
                        </label>
                      ))}
                      
                      <label 
                        className={`flex items-center border rounded-md p-3 cursor-pointer ${
                          selectedCardId === null 
                            ? 'border-purple-600 bg-purple-50' 
                            : 'border-gray-300'
                        }`}
                      >
                        <input
                          type="radio"
                          name="savedCard"
                          checked={selectedCardId === null}
                          onChange={() => setSelectedCardId(null)}
                          className="sr-only"
                        />
                        
                        <div className="flex-1 flex items-center">
                          <FaPlus 
                            className={`mr-3 ${selectedCardId === null ? 'text-purple-600' : 'text-gray-400'}`} 
                          />
                          <div className="font-medium">
                            Use a new card
                          </div>
                        </div>
                        
                        <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center ${
                          selectedCardId === null ? 'border-purple-600' : 'border-gray-300'
                        }`}>
                          {selectedCardId === null && (
                            <div className="w-3 h-3 rounded-full bg-purple-600" />
                          )}
                        </div>
                      </label>
                    </div>
                  )}
                </div>
              )}
              
              {/* New card form (only if no saved card is selected) */}
              {selectedCardId === null && (
                <div className="space-y-4">
                  <div>
                    <label className="block text-gray-700 font-medium mb-2">
                      Card Number
                    </label>
                    <div className="relative">
                      <input
                        type="text"
                        value={cardNumber}
                        onChange={handleCardNumberChange}
                        placeholder="1234 5678 9012 3456"
                        className={`w-full p-3 pl-10 border rounded-md ${
                          paymentErrors.cardNumber
                            ? "border-red-500"
                            : "border-gray-300"
                        }`}
                        maxLength="19"
                      />
                      <FaRegCreditCard className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                    </div>
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
                      <div className="relative">
                        <input
                          type="text"
                          value={expiryDate}
                          onChange={handleExpiryDateChange}
                          placeholder="MM/YY"
                          className={`w-full p-3 pl-10 border rounded-md ${
                            paymentErrors.expiryDate
                              ? "border-red-500"
                              : "border-gray-300"
                          }`}
                          maxLength="5"
                        />
                        <FaRegCalendarAlt className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                      </div>
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
                      <div className="relative">
                        <input
                          type="password"
                          value={cvv}
                          onChange={(e) =>
                            setCvv(e.target.value.replace(/\D/g, ""))
                          }
                          placeholder="123"
                          className={`w-full p-3 pl-10 border rounded-md ${
                            paymentErrors.cvv
                              ? "border-red-500"
                              : "border-gray-300"
                          }`}
                          maxLength="4"
                        />
                        <FaLock className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                      </div>
                      {paymentErrors.cvv && (
                        <p className="text-red-500 text-sm mt-1">
                          {paymentErrors.cvv}
                        </p>
                      )}
                    </div>
                  </div>
                  
                  {/* Save card option */}
                  <div>
                    <label className="flex items-center">
                      <input
                        type="checkbox"
                        checked={saveNewCard}
                        onChange={(e) => setSaveNewCard(e.target.checked)}
                        className="mr-2"
                      />
                      <span>Save this card for future payments</span>
                    </label>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Order summary and buttons - unchanged */}
        <div className="bg-white p-6 rounded-lg shadow-md mb-6">
          <h3 className="text-lg font-bold mb-4">Order Summary</h3>
          <div className="flex justify-between text-lg mb-2">
            <span>Total Amount:</span>
            <span className="font-bold">${totalAmount.toFixed(2)}</span>
          </div>
        </div>

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
