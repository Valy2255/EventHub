// src/components/ticket/TicketExchangeModal.jsx
import { useState, useEffect } from 'react';
import {
  FaTimesCircle,
  FaExchangeAlt,
  FaSpinner,
  FaCreditCard,
  FaCoins,
  FaArrowUp,
  FaArrowDown,
  FaLock,
  FaRegCreditCard,
  FaRegCalendarAlt
} from 'react-icons/fa';
import api from '../../services/api';
import { useAuth } from '../../hooks/useAuth';

export function TicketExchangeModal({
  ticket,
  event,
  availableTicketTypes,
  onClose,
  onConfirm,
  isSubmitting
}) {
  const [selectedTicketType, setSelectedTicketType] = useState(null);
  const [error, setError] = useState(null);
  const [priceDifference, setPriceDifference] = useState(0);
  const [paymentMethod, setPaymentMethod] = useState('credit');
  const [showCardForm, setShowCardForm] = useState(false);
  const [processing, setProcessing] = useState(false);
  const [userCredits, setUserCredits] = useState(0);
  const [loadingCredits, setLoadingCredits] = useState(false);

  // Card payment form state
  const [cardNumber, setCardNumber] = useState('');
  const [cardName, setCardName] = useState('');
  const [expiryDate, setExpiryDate] = useState('');
  const [cvv, setCvv] = useState('');
  const [paymentErrors, setPaymentErrors] = useState({});

  const { user } = useAuth();

  // Load user credits
  useEffect(() => {
    const loadUserCredits = async () => {
      if (!user) return;

      try {
        setLoadingCredits(true);
        const response = await api.get('/credits');
        setUserCredits(response.data.credits);
      } catch (err) {
        console.error('Error loading user credits:', err);
      } finally {
        setLoadingCredits(false);
      }
    };

    loadUserCredits();
  }, [user]);

  // Calculate price difference when selected ticket type changes
  useEffect(() => {
    if (selectedTicketType) {
      const currentPrice = parseFloat(ticket.price);
      const newPrice = parseFloat(selectedTicketType.price);
      setPriceDifference(newPrice - currentPrice);
    } else {
      setPriceDifference(0);
    }
  }, [selectedTicketType, ticket.price]);

  // Format helpers
  const formatPrice = (price) => {
    return `$${parseFloat(price).toFixed(2)}`;
  };

  const formatCardNumber = (value) => {
    const sanitized = value.replace(/\D/g, '');
    const parts = [];

    for (let i = 0; i < sanitized.length; i += 4) {
      parts.push(sanitized.substring(i, i + 4));
    }

    return parts.join(' ').trim();
  };

  const formatExpiryDate = (value) => {
    const sanitized = value.replace(/\D/g, '');

    if (sanitized.length > 2) {
      return `${sanitized.substring(0, 2)}/${sanitized.substring(2, 4)}`;
    }

    return sanitized;
  };

  // Validation functions
  const validateCardNumber = (cardNumber) => {
    const sanitized = cardNumber.replace(/\D/g, '');

    if (sanitized.length < 13 || sanitized.length > 19) {
      return {
        valid: false,
        message: 'Card number must be between 13 and 19 digits',
      };
    }

    return { valid: true, message: '' };
  };

  const validateExpiryDate = (expiryDate) => {
    if (!/^\d{2}\/\d{2}$/.test(expiryDate)) {
      return { valid: false, message: 'Expiry date must be in MM/YY format' };
    }

    const [monthStr, yearStr] = expiryDate.split('/');
    const month = parseInt(monthStr, 10);
    const year = parseInt(yearStr, 10) + 2000;

    if (month < 1 || month > 12) {
      return { valid: false, message: 'Month must be between 01 and 12' };
    }

    const now = new Date();
    const currentMonth = now.getMonth() + 1;
    const currentYear = now.getFullYear();

    if (year < currentYear || (year === currentYear && month < currentMonth)) {
      return { valid: false, message: 'Card has expired' };
    }

    return { valid: true, message: '' };
  };

  const validateCVV = (cvv) => {
    const sanitized = cvv.replace(/\D/g, '');

    if (sanitized.length < 3 || sanitized.length > 4) {
      return { valid: false, message: 'CVV must be 3 or 4 digits' };
    }

    return { valid: true, message: '' };
  };

  // Form handlers
  const handleSelectTicketType = (ticketType) => {
    setSelectedTicketType(ticketType);
    setError(null);
    
    // If downgrading (or same price), automatically set to credit payment
    if (parseFloat(ticketType.price) <= parseFloat(ticket.price)) {
      setPaymentMethod('credit');
      setShowCardForm(false);
    }
  };

  const handlePaymentMethodChange = (method) => {
    setPaymentMethod(method);
    setShowCardForm(method === 'card');
    setError(null);
  };

  const handleCardNumberChange = (e) => {
    const formatted = formatCardNumber(e.target.value);
    setCardNumber(formatted);

    if (paymentErrors.cardNumber) {
      setPaymentErrors({ ...paymentErrors, cardNumber: '' });
    }
  };

  const handleExpiryDateChange = (e) => {
    const formatted = formatExpiryDate(e.target.value);
    setExpiryDate(formatted);

    if (paymentErrors.expiryDate) {
      setPaymentErrors({ ...paymentErrors, expiryDate: '' });
    }
  };

  const validatePaymentForm = () => {
    const errors = {};

    if (paymentMethod === 'credit') {
      if (priceDifference > 0 && userCredits < priceDifference) {
        errors.general = `Insufficient credits. You need ${priceDifference.toFixed(
          2
        )} credits but have ${userCredits.toFixed(2)}.`;
      }
    } else if (paymentMethod === 'card') {
      const cardNumberResult = validateCardNumber(cardNumber);
      if (!cardNumberResult.valid) {
        errors.cardNumber = cardNumberResult.message;
      }

      if (!cardName.trim()) {
        errors.cardName = 'Cardholder name is required';
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

  const handleExchange = async () => {
    if (!selectedTicketType) {
      setError('Please select a ticket type');
      return;
    }

    // Only validate payment form if upgrading (price difference > 0)
    if (priceDifference > 0) {
      const formErrors = validatePaymentForm();
      if (Object.keys(formErrors).length > 0) {
        setPaymentErrors(formErrors);
        return;
      }
    }

    setPaymentErrors({});
    setProcessing(true);

    try {
      // Prepare payment data if using card
      const paymentData = paymentMethod === 'card' ? {
        cardNumber,
        cardName,
        expiryDate,
        cvv
      } : null;

      // Make the exchange request
      const response = await api.post(`/tickets/${ticket.id}/exchange`, {
        new_ticket_type_id: selectedTicketType.id,
        paymentMethod,
        paymentData
      });

      // Call the onConfirm function from parent component
      onConfirm(selectedTicketType, response.data);
    } catch (err) {
      console.error('Error exchanging ticket:', err);
      
      // If can use card payment, show option
      if (err.response?.data?.canUseCardPayment) {
        setError(
          <div>
            <p className="mb-2">{err.response.data.error}</p>
            <p className="mb-3">Would you like to pay the difference with a card instead?</p>
            <button
              onClick={() => handlePaymentMethodChange('card')}
              className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700"
            >
              Pay with Card
            </button>
          </div>
        );
      } else {
        setError(err.response?.data?.error || 'An error occurred while exchanging the ticket');
      }
    } finally {
      setProcessing(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg max-w-md w-full p-6 max-h-[90vh] overflow-y-auto">
        <div className="flex justify-between items-start mb-4">
          <h2 className="text-xl font-bold">Exchange Ticket</h2>
          <button
            onClick={onClose}
            className="text-gray-500 hover:text-gray-700"
          >
            <FaTimesCircle />
          </button>
        </div>

        {/* Current ticket info */}
        <div className="mb-4 p-3 bg-gray-100 rounded-md">
          <h3 className="font-medium mb-2">Current Ticket</h3>
          <p><span className="font-medium">Event:</span> {event.eventName}</p>
          <p><span className="font-medium">Ticket Type:</span> {ticket.ticket_type_name}</p>
          <p><span className="font-medium">Price:</span> {formatPrice(ticket.price)}</p>
        </div>

        {/* Available ticket types */}
        <div className="mb-6">
          <h3 className="font-medium mb-2">Available Ticket Types</h3>
          
          {availableTicketTypes.length === 0 ? (
            <p className="text-gray-500">No other ticket types available for exchange.</p>
          ) : (
            <div className="space-y-3">
              {availableTicketTypes.map((type) => (
                <div
                  key={type.id}
                  className={`border rounded-md p-3 cursor-pointer transition-colors ${
                    selectedTicketType?.id === type.id
                      ? 'border-purple-600 bg-purple-50'
                      : 'border-gray-300 hover:border-gray-400'
                  }`}
                  onClick={() => handleSelectTicketType(type)}
                >
                  <div className="flex justify-between">
                    <span className="font-medium">{type.name}</span>
                    <span>{formatPrice(type.price)}</span>
                  </div>
                  
                  {type.description && (
                    <p className="text-sm text-gray-600 mt-1">{type.description}</p>
                  )}
                  
                  {/* Price difference indicator */}
                  {selectedTicketType?.id === type.id && (
                    <div className="mt-2 flex items-center text-sm">
                      {parseFloat(type.price) > parseFloat(ticket.price) ? (
                        <>
                          <FaArrowUp className="text-red-500 mr-1" />
                          <span className="text-red-600">
                            You'll pay ${(parseFloat(type.price) - parseFloat(ticket.price)).toFixed(2)} more
                          </span>
                        </>
                      ) : parseFloat(type.price) < parseFloat(ticket.price) ? (
                        <>
                          <FaArrowDown className="text-green-500 mr-1" />
                          <span className="text-green-600">
                            You'll receive ${(parseFloat(ticket.price) - parseFloat(type.price)).toFixed(2)} in credits
                          </span>
                        </>
                      ) : (
                        <span className="text-gray-600">Same price - no additional payment</span>
                      )}
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Payment method options - only show if upgrading */}
        {selectedTicketType && priceDifference > 0 && (
          <div className="mb-6">
            <h3 className="font-medium mb-3">Payment Method</h3>
            
            <div className="flex space-x-3">
              <button
                type="button"
                onClick={() => handlePaymentMethodChange('credit')}
                className={`flex items-center px-4 py-2 rounded-md border ${
                  paymentMethod === 'credit'
                    ? 'bg-purple-50 border-purple-600 text-purple-700'
                    : 'border-gray-300 text-gray-700 hover:bg-gray-50'
                } ${
                  priceDifference > userCredits
                    ? 'cursor-not-allowed opacity-70'
                    : 'cursor-pointer'
                }`}
                disabled={priceDifference > userCredits}
              >
                <FaCoins className="mr-2" />
                <div className="flex flex-col items-start">
                  <span>Pay with Credits</span>
                  <span className="text-xs text-gray-500">
                    {loadingCredits ? (
                      <FaSpinner className="animate-spin inline-block mr-1" />
                    ) : (
                      `Balance: ${parseFloat(userCredits).toFixed(2)} credits`
                    )}
                  </span>
                </div>
              </button>
              
              <button
                type="button"
                onClick={() => handlePaymentMethodChange('card')}
                className={`flex items-center px-4 py-2 rounded-md border ${
                  paymentMethod === 'card'
                    ? 'bg-purple-50 border-purple-600 text-purple-700'
                    : 'border-gray-300 text-gray-700 hover:bg-gray-50'
                }`}
              >
                <FaCreditCard className="mr-2" />
                Pay with Card
              </button>
            </div>
          </div>
        )}

        {/* Card payment form */}
        {showCardForm && (
          <div className="mb-6 space-y-4 border p-4 rounded-md">
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
                      ? 'border-red-500'
                      : 'border-gray-300'
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
                    ? 'border-red-500'
                    : 'border-gray-300'
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
                        ? 'border-red-500'
                        : 'border-gray-300'
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
                    type="text"
                    value={cvv}
                    onChange={(e) =>
                      setCvv(e.target.value.replace(/\D/g, ''))
                    }
                    placeholder="123"
                    className={`w-full p-3 pl-10 border rounded-md ${
                      paymentErrors.cvv
                        ? 'border-red-500'
                        : 'border-gray-300'
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
            <div className="text-xs text-gray-500">
              <FaLock className="inline-block mr-1" /> Your payment information is secure
            </div>
          </div>
        )}

        {/* Error message */}
        {(error || paymentErrors.general) && (
          <div className="bg-red-100 text-red-800 p-3 rounded-md mb-6">
            {typeof error === 'string' ? (
              <p>{error || paymentErrors.general}</p>
            ) : (
              error
            )}
          </div>
        )}

        {/* Action buttons */}
        <div className="flex justify-end space-x-3">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50"
          >
            Cancel
          </button>
          
          <button
            type="button"
            onClick={handleExchange}
            disabled={!selectedTicketType || processing || isSubmitting}
            className={`px-4 py-2 bg-purple-600 text-white rounded-md hover:bg-purple-700 flex items-center ${
              !selectedTicketType || processing || isSubmitting ? 'opacity-70 cursor-not-allowed' : ''
            }`}
          >
            {processing || isSubmitting ? (
              <>
                <FaSpinner className="animate-spin mr-2" />
                Processing...
              </>
            ) : (
              <>
                <FaExchangeAlt className="mr-2" />
                Confirm Exchange
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}

export default TicketExchangeModal;