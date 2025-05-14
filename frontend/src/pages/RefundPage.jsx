import { Link } from "react-router-dom";
import { 
  FaTicketAlt, 
  FaExchangeAlt, 
  FaInfoCircle, 
  FaArrowRight, 
  FaFileAlt, 
  FaMoneyBill, 
  FaCreditCard 
} from "react-icons/fa";

export default function RefundsExchangesPage() {
  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold mb-6">Refunds & Exchanges</h1>
      
      {/* Policy Overview */}
      <div className="bg-white rounded-lg shadow-md p-6 mb-8">
        <h2 className="text-xl font-bold mb-4">Our Policy Overview</h2>
        <p className="mb-4">
          We understand that plans change. Here's what you need to know about our refund and exchange policies:
        </p>
        
        <div className="grid md:grid-cols-2 gap-6 mt-6">
          <div className="border border-gray-200 rounded-lg p-4">
            <div className="flex items-center mb-3">
              <FaTicketAlt className="text-purple-600 mr-2" />
              <h3 className="font-semibold">Refunds</h3>
            </div>
            <ul className="space-y-2 text-gray-700">
              <li>• Full refunds available up to 7 days before the event</li>
              <li>• Partial refunds (70%) available 3-7 days before the event</li>
              <li>• No refunds within 72 hours of the event except in special circumstances</li>
              <li>• Refunds typically process within 5-7 business days</li>
            </ul>
          </div>
          
          <div className="border border-gray-200 rounded-lg p-4">
            <div className="flex items-center mb-3">
              <FaExchangeAlt className="text-purple-600 mr-2" />
              <h3 className="font-semibold">Exchanges</h3>
            </div>
            <ul className="space-y-2 text-gray-700">
              <li>• Ticket exchanges available up to 48 hours before the event</li>
              <li>• Exchange for another ticket type of equal or greater value for the same event</li>
              <li>• Pay the difference for upgrades to a higher-priced ticket</li>
              <li>• Receive account credit for downgrades to a lower-priced ticket</li>
              <li>• Maximum of one exchange per ticket</li>
            </ul>
          </div>
        </div>
      </div>
      
      {/* Request Options */}
      <div className="bg-white rounded-lg shadow-md p-6 mb-8">
        <h2 className="text-xl font-bold mb-4">How to Request a Refund or Exchange</h2>
        
        <div className="grid md:grid-cols-2 gap-6 mt-4">
          <div className="bg-purple-50 rounded-lg p-5">
            <h3 className="font-semibold text-lg mb-3">Refund Your Ticket</h3>
            <p className="mb-4">
              The fastest way to request a refund is directly from your tickets page.
            </p>
            <ol className="space-y-2 text-gray-700 mb-4">
              <li>1. Go to "My Tickets" in your account</li>
              <li>2. Find the ticket you want to refund</li>
              <li>3. Click "Cancel" and confirm your request</li>
              <li>4. Track the status in the "Cancelled" tab</li>
            </ol>
            <Link to="/profile/tickets" className="flex items-center text-purple-600 hover:text-purple-800 font-medium">
              Go to My Tickets <FaArrowRight className="ml-2" size={12} />
            </Link>
          </div>
          
          <div className="bg-purple-50 rounded-lg p-5">
            <h3 className="font-semibold text-lg mb-3">Exchange Your Ticket</h3>
            <p className="mb-4">
              You can easily exchange your ticket for another ticket type within the same event.
            </p>
            <ol className="space-y-2 text-gray-700 mb-4">
              <li>1. Go to "My Tickets" in your account</li>
              <li>2. Find the ticket you want to exchange</li>
              <li>3. Click "Exchange" and select a new ticket type</li>
              <li>4. Pay any difference for upgrades or receive credit for downgrades</li>
            </ol>
            <Link to="/profile/tickets" className="flex items-center text-purple-600 hover:text-purple-800 font-medium">
              Go to My Tickets <FaArrowRight className="ml-2" size={12} />
            </Link>
          </div>
        </div>
      </div>
      
      {/* Payment & Credit Information */}
      <div className="bg-white rounded-lg shadow-md p-6 mb-8">
        <h2 className="text-xl font-bold mb-4">Payment & Credit Information</h2>
        
        <div className="grid md:grid-cols-2 gap-6">
          <div className="border-l-4 border-purple-600 pl-4">
            <div className="flex items-center mb-2">
              <FaCreditCard className="text-purple-600 mr-2" />
              <h3 className="font-semibold">Paying for Upgrades</h3>
            </div>
            <p className="text-gray-700 mb-3">
              When exchanging for a higher-priced ticket, you'll only be charged the price difference.
              We'll use your original payment method if possible.
            </p>
            <ul className="text-sm text-gray-600 space-y-1">
              <li>• Price difference is calculated automatically</li>
              <li>• Secure payment processing via our payment gateway</li>
              <li>• Receipt emailed for the additional amount paid</li>
            </ul>
          </div>
          
          <div className="border-l-4 border-green-600 pl-4">
            <div className="flex items-center mb-2">
              <FaMoneyBill className="text-green-600 mr-2" />
              <h3 className="font-semibold">Account Credits</h3>
            </div>
            <p className="text-gray-700 mb-3">
              When exchanging for a lower-priced ticket, the difference will be credited to your account.
              You can use this credit for future ticket purchases.
            </p>
            <ul className="text-sm text-gray-600 space-y-1">
              <li>• Credits are automatically applied to future purchases</li>
              <li>• Credits valid for 12 months from issue date</li>
              <li>• View your credit balance in your account settings</li>
            </ul>
          </div>
        </div>
      </div>
      
      {/* FAQ Section */}
      <div className="bg-white rounded-lg shadow-md p-6 mb-8">
        <h2 className="text-xl font-bold mb-4">Frequently Asked Questions</h2>
        
        <div className="space-y-4">
          <div className="border-b border-gray-200 pb-4">
            <h3 className="font-semibold mb-2">How long do refunds take to process?</h3>
            <p className="text-gray-700">
              Refunds typically take 5-7 business days to appear in your account, depending on your payment method and financial institution.
            </p>
          </div>
          
          <div className="border-b border-gray-200 pb-4">
            <h3 className="font-semibold mb-2">Can I get a refund if the event is cancelled?</h3>
            <p className="text-gray-700">
              Yes, if an event is cancelled by the organizer, you will automatically receive a full refund within 14 days.
            </p>
          </div>
          
          <div className="border-b border-gray-200 pb-4">
            <h3 className="font-semibold mb-2">Can I exchange tickets multiple times?</h3>
            <p className="text-gray-700">
              No, each ticket can only be exchanged once. Make sure you're selecting the ticket type you really want when exchanging.
            </p>
          </div>
          
          <div className="border-b border-gray-200 pb-4">
            <h3 className="font-semibold mb-2">What if there are no available tickets for the type I want to exchange for?</h3>
            <p className="text-gray-700">
              You can only exchange for ticket types that have available inventory. If your preferred ticket type is sold out, you won't be able to exchange for it.
            </p>
          </div>
          
          <div className="border-b border-gray-200 pb-4">
            <h3 className="font-semibold mb-2">Can I exchange my ticket for a different event?</h3>
            <p className="text-gray-700">
              No, exchanges are only available for different ticket types within the same event. If you want to attend a different event, you'll need to request a refund and purchase a new ticket.
            </p>
          </div>
          
          
        </div>
      </div>
      
      {/* Special Circumstances */}
      <div className="bg-blue-50 rounded-lg p-6 flex items-start">
        <FaInfoCircle className="text-blue-600 mt-1 mr-4 flex-shrink-0" size={20} />
        <div>
          <h3 className="font-semibold text-lg mb-2">Special Circumstances</h3>
          <p className="text-gray-700 mb-3">
            We understand that unexpected situations can arise. If you need to request a refund or exchange outside our standard policy due to:
          </p>
          <ul className="text-gray-700 mb-4 space-y-1">
            <li>• Medical emergencies (with documentation)</li>
            <li>• Bereavement</li>
            <li>• Natural disasters or severe weather</li>
            <li>• Other extenuating circumstances</li>
          </ul>
          <p className="text-gray-700">
            Please contact our support team with relevant documentation, and we'll review your request on a case-by-case basis.
          </p>
          <Link to="/contact" className="mt-4 inline-block bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700">
            Contact Support
          </Link>
        </div>
      </div>
      
      
    </div>
  );
}