// src/components/event/TicketSelector.jsx
import { useState } from 'react';
import { FaPlus, FaMinus, FaInfoCircle } from 'react-icons/fa';

const TicketSelector = ({ ticketTypes, onTicketChange, selectedTickets }) => {
  const [expandedTicket, setExpandedTicket] = useState(null);
  
  // Toggle ticket description expansion
  const toggleDescription = (ticketId) => {
    if (expandedTicket === ticketId) {
      setExpandedTicket(null);
    } else {
      setExpandedTicket(ticketId);
    }
  };
  
  // Handle quantity change
  const handleQuantityChange = (ticketTypeId, newQuantity) => {
    // Make sure quantity doesn't go below 0 or above available_quantity
    const ticketType = ticketTypes.find(t => t.id === ticketTypeId);
    const maxQuantity = ticketType.available_quantity;
    
    newQuantity = Math.max(0, Math.min(newQuantity, maxQuantity));
    
    // Call the parent component's callback
    onTicketChange(ticketTypeId, newQuantity);
  };
  
  // Render individual ticket type
  const renderTicketType = (ticket) => {
    const isExpanded = expandedTicket === ticket.id;
    const currentQuantity = selectedTickets[ticket.id] || 0;
    const isAvailable = ticket.available_quantity > 0;
    
    return (
      <div 
        key={ticket.id} 
        className={`border-b border-gray-200 py-4 ${!isAvailable ? 'opacity-60' : ''}`}
      >
        <div className="flex justify-between items-start">
          <div>
            <h3 className="font-bold text-gray-800">{ticket.name}</h3>
            <div className="text-purple-600 font-bold mt-1">${ticket.price.toFixed(2)}</div>
            
            {ticket.description && (
              <button 
                onClick={() => toggleDescription(ticket.id)}
                className="text-sm text-gray-500 underline mt-1 flex items-center focus:outline-none"
              >
                <FaInfoCircle className="mr-1" size={12} />
                {isExpanded ? 'Hide details' : 'Show details'}
              </button>
            )}
            
            {isExpanded && ticket.description && (
              <div className="mt-2 text-sm text-gray-600 bg-gray-50 p-2 rounded">
                {ticket.description}
              </div>
            )}
            
            {!isAvailable && (
              <div className="text-red-500 text-sm mt-1">Sold Out</div>
            )}
          </div>
          
          <div className="flex items-center">
            <button
              onClick={() => handleQuantityChange(ticket.id, currentQuantity - 1)}
              className={`w-8 h-8 flex items-center justify-center border border-gray-300 rounded-l ${
                currentQuantity === 0 ? 'bg-gray-100 text-gray-400 cursor-not-allowed' : 'bg-gray-200 text-gray-700'
              }`}
              disabled={currentQuantity === 0 || !isAvailable}
            >
              <FaMinus size={12} />
            </button>
            
            <div className="w-12 h-8 flex items-center justify-center border-t border-b border-gray-300 bg-white">
              {currentQuantity}
            </div>
            
            <button
              onClick={() => handleQuantityChange(ticket.id, currentQuantity + 1)}
              className={`w-8 h-8 flex items-center justify-center border border-gray-300 rounded-r ${
                currentQuantity >= ticket.available_quantity || !isAvailable
                  ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                  : 'bg-gray-200 text-gray-700'
              }`}
              disabled={currentQuantity >= ticket.available_quantity || !isAvailable}
            >
              <FaPlus size={12} />
            </button>
          </div>
        </div>
        
        {/* Display remaining tickets if less than 10 */}
        {ticket.available_quantity > 0 && ticket.available_quantity < 10 && (
          <div className="text-orange-600 text-sm mt-2">
            Only {ticket.available_quantity} left!
          </div>
        )}
      </div>
    );
  };
  
  return (
    <div className="space-y-2">
      {ticketTypes.map(renderTicketType)}
    </div>
  );
};

export default TicketSelector;