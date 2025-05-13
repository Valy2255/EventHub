// src/components/payment/CardPaymentForm.jsx
import { useState } from 'react';
import { FaCreditCard, FaCalendarAlt, FaLock } from 'react-icons/fa';

const CardPaymentForm = ({ amount, onDataChange }) => {
  const [cardData, setCardData] = useState({
    cardNumber: '',
    cardholderName: '',
    expiry: '',
    cvv: ''
  });
  
  const handleChange = (e) => {
    const { name, value } = e.target;
    let formattedValue = value;
    
    // Format card number with spaces every 4 digits
    if (name === 'cardNumber') {
      formattedValue = value.replace(/\s/g, '').replace(/(\d{4})/g, '$1 ').trim().slice(0, 19);
    }
    
    // Format expiry date as MM/YY
    if (name === 'expiry') {
      formattedValue = value
        .replace(/\D/g, '')
        .slice(0, 4)
        .replace(/(\d{2})(\d{0,2})/, (_, p1, p2) => p2 ? `${p1}/${p2}` : p1);
    }
    
    // Limit CVV to 3 or 4 digits
    if (name === 'cvv') {
      formattedValue = value.replace(/\D/g, '').slice(0, 4);
    }
    
    setCardData(prev => {
      const updated = {
        ...prev,
        [name]: formattedValue
      };
      
      // Notify parent component of changes
      onDataChange(updated);
      
      return updated;
    });
  };
  
  return (
    <div className="border border-gray-300 rounded-md p-4">
      <div className="text-lg font-medium mb-4">
        Payment Amount: ${parseFloat(amount).toFixed(2)}
      </div>
      
      <div className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Card Number
          </label>
          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <FaCreditCard className="text-gray-400" />
            </div>
            <input
              type="text"
              name="cardNumber"
              value={cardData.cardNumber}
              onChange={handleChange}
              placeholder="1234 5678 9012 3456"
              className="pl-10 w-full p-2 border border-gray-300 rounded-md focus:ring-purple-500 focus:border-purple-500"
            />
          </div>
        </div>
        
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Cardholder Name
          </label>
          <input
            type="text"
            name="cardholderName"
            value={cardData.cardholderName}
            onChange={handleChange}
            placeholder="John Doe"
            className="w-full p-2 border border-gray-300 rounded-md focus:ring-purple-500 focus:border-purple-500"
          />
        </div>
        
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Expiry Date
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <FaCalendarAlt className="text-gray-400" />
              </div>
              <input
                type="text"
                name="expiry"
                value={cardData.expiry}
                onChange={handleChange}
                placeholder="MM/YY"
                className="pl-10 w-full p-2 border border-gray-300 rounded-md focus:ring-purple-500 focus:border-purple-500"
              />
            </div>
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              CVV
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <FaLock className="text-gray-400" />
              </div>
              <input
                type="text"
                name="cvv"
                value={cardData.cvv}
                onChange={handleChange}
                placeholder="123"
                className="pl-10 w-full p-2 border border-gray-300 rounded-md focus:ring-purple-500 focus:border-purple-500"
              />
            </div>
          </div>
        </div>
      </div>
      
      <div className="mt-4 text-xs text-gray-500">
        <p>This is a demo form. No actual payment will be processed.</p>
        <p>For testing, you can enter any valid-looking card information.</p>
      </div>
    </div>
  );
};

export default CardPaymentForm;