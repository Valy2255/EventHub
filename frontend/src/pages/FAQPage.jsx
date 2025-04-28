// src/pages/FAQPage.jsx
import { useState, useEffect } from 'react';
import { FaChevronDown, FaChevronUp, FaSpinner } from 'react-icons/fa';
import axios from 'axios';

const API_BASE_URL = 'http://localhost:5000/api';

const FAQPage = () => {
  const [faqs, setFaqs] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchFAQs = async () => {
      try {
        setIsLoading(true);
        const response = await axios.get(`${API_BASE_URL}/faqs`);
        
        // Map response data to include isOpen state
        const mappedFaqs = response.data.faqs.map(faq => ({
          ...faq,
          isOpen: false
        }));
        
        setFaqs(mappedFaqs);
        setIsLoading(false);
      } catch (err) {
        console.error('Error fetching FAQs:', err);
        setError('Failed to load FAQs. Please try again later.');
        setIsLoading(false);
      }
    };

    fetchFAQs();
  }, []);

  const toggleFaq = (id) => {
    setFaqs(faqs.map(faq => 
      faq.id === id ? { ...faq, isOpen: !faq.isOpen } : faq
    ));
  };

  return (
    <div className="bg-gray-50 min-h-screen">
      {/* Hero Section */}
      <div className="bg-gradient-to-r from-purple-700 to-indigo-800 text-white py-16">
        <div className="container mx-auto px-4 text-center">
          <h1 className="text-4xl md:text-5xl font-bold mb-4">Frequently Asked Questions</h1>
          <p className="text-xl max-w-2xl mx-auto">
            Find answers to the most common questions about EventHub.
          </p>
        </div>
      </div>
      
      {/* FAQ Content */}
      <div className="container mx-auto px-4 py-12">
        <div className="max-w-4xl mx-auto">
          {isLoading ? (
            <div className="flex justify-center items-center py-20">
              <FaSpinner className="animate-spin text-purple-600 text-4xl" />
              <span className="ml-3 text-xl text-gray-600">Loading FAQs...</span>
            </div>
          ) : error ? (
            <div className="bg-red-100 text-red-700 p-6 rounded-lg text-center">
              <p>{error}</p>
              <button 
                className="mt-4 bg-red-600 text-white px-4 py-2 rounded hover:bg-red-700"
                onClick={() => window.location.reload()}
              >
                Try Again
              </button>
            </div>
          ) : (
            <div className="bg-white rounded-xl shadow-md overflow-hidden">
              {faqs.map((faq, index) => (
                <div key={faq.id} className={`border-b border-gray-200 ${index === faqs.length - 1 ? 'border-b-0' : ''}`}>
                  <button
                    className="w-full py-5 px-6 text-left flex items-center justify-between focus:outline-none"
                    onClick={() => toggleFaq(faq.id)}
                  >
                    <span className="text-lg font-medium text-gray-800">{faq.question}</span>
                    {faq.isOpen ? 
                      <FaChevronUp className="text-purple-600" /> : 
                      <FaChevronDown className="text-gray-400" />
                    }
                  </button>
                  
                  {faq.isOpen && (
                    <div className="px-6 pb-5">
                      <p className="text-gray-600">{faq.answer}</p>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
          
          {/* Still Need Help Section */}
          <div className="mt-12 bg-purple-100 rounded-xl p-8 text-center">
            <h2 className="text-2xl font-bold text-gray-800 mb-4">Still Have Questions?</h2>
            <p className="text-gray-600 mb-6">
              Our support team is here to help you with any other questions you might have.
            </p>
            <a 
              href="/contact" 
              className="inline-block bg-purple-600 hover:bg-purple-700 text-white font-medium py-3 px-6 rounded-lg transition-colors"
            >
              Contact Us
            </a>
          </div>
        </div>
      </div>
    </div>
  );
};

export default FAQPage;