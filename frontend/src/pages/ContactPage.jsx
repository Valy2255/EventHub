import { useState } from 'react';
import { 
  FaFacebook, 
  FaTwitter, 
  FaInstagram, 
  FaEnvelope, 
  FaPhone, 
  FaMapMarkerAlt,
  FaPaperPlane,
  FaSpinner
} from 'react-icons/fa';

const ContactPage = () => {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    subject: '',
    message: ''
  });
  
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitSuccess, setSubmitSuccess] = useState(false);
  const [submitError, setSubmitError] = useState(null);
  
  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };
  
  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);
    setSubmitError(null);
    
    try {
      // Here you would typically call an API to send the email
      // For now, we'll simulate a successful submission after 1 second
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      // Reset form and show success message
      setFormData({
        name: '',
        email: '',
        subject: '',
        message: ''
      });
      setSubmitSuccess(true);
      setTimeout(() => setSubmitSuccess(false), 5000);
      
    } catch (error) {
      console.error('Error submitting form:', error);
      setSubmitError('There was an error sending your message. Please try again later.');
    } finally {
      setIsSubmitting(false);
    }
  };
  
  return (
    <div className="bg-gray-50 min-h-screen">
      {/* Hero Section */}
      <div className="bg-gradient-to-r from-purple-700 to-indigo-800 text-white py-16">
        <div className="container mx-auto px-4 text-center">
          <h1 className="text-4xl md:text-5xl font-bold mb-4">Contact Us</h1>
          <p className="text-xl max-w-2xl mx-auto">
            We're here to help. For any questions get in touch with us by email, chat or phone.
          </p>
        </div>
      </div>
      
      {/* Contact Options */}
      <div className="container mx-auto px-4 py-12">
        {/* Options Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-16">
          {/* Email */}
          <div className="bg-white rounded-xl shadow-md p-8 text-center transition-transform hover:-translate-y-1">
            <div className="bg-purple-100 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
              <FaEnvelope className="text-purple-600 text-2xl" />
            </div>
            <h3 className="text-xl font-semibold mb-2">Email Us</h3>
            <p className="text-gray-600 mb-4">
              Send us an email and we'll get back to you within 24 hours.
            </p>
            <a 
              href="mailto:braconieruvalica99@gmail.com" 
              className="text-purple-600 font-medium hover:text-purple-800"
            >
              braconieruvalica99@gmail.com
            </a>
          </div>
          
          {/* Chat */}
          <div className="bg-white rounded-xl shadow-md p-8 text-center transition-transform hover:-translate-y-1">
            <div className="bg-purple-100 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
              <FaPaperPlane className="text-purple-600 text-2xl" />
            </div>
            <h3 className="text-xl font-semibold mb-2">Live Chat</h3>
            <p className="text-gray-600 mb-4">
              Already have tickets? Chat with us through your account.
            </p>
            <button 
              className="bg-purple-600 hover:bg-purple-700 text-white px-6 py-2 rounded-lg font-medium transition-colors"
              onClick={() => alert('Chat feature coming soon!')}
            >
              Start Chat
            </button>
          </div>
          
          {/* Social Media */}
          <div className="bg-white rounded-xl shadow-md p-8 text-center transition-transform hover:-translate-y-1">
            <div className="bg-purple-100 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
              <FaTwitter className="text-purple-600 text-2xl" />
            </div>
            <h3 className="text-xl font-semibold mb-2">Social Media</h3>
            <p className="text-gray-600 mb-4">
              Connect with us on social media for updates and support.
            </p>
            <div className="flex justify-center space-x-4">
              <a 
                href="https://www.facebook.com/ghita.valentin.92/" 
                target="_blank" 
                rel="noopener noreferrer"
                className="text-gray-500 hover:text-purple-600"
              >
                <FaFacebook size={24} />
              </a>
              <a 
                href="https://x.com/ValyOnHL" 
                target="_blank" 
                rel="noopener noreferrer"
                className="text-gray-500 hover:text-purple-600"
              >
                <FaTwitter size={24} />
              </a>
              <a 
                href="https://www.instagram.com/ghitavalentinn/" 
                target="_blank" 
                rel="noopener noreferrer"
                className="text-gray-500 hover:text-purple-600"
              >
                <FaInstagram size={24} />
              </a>
            </div>
          </div>
        </div>
        
        {/* Help Topics */}
        <div className="mb-16">
          <h2 className="text-2xl font-bold text-center mb-8">Frequently Asked Help Topics</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            <a 
              href="/faq" 
              className="bg-white p-4 rounded-lg shadow hover:shadow-md border border-gray-100 transition-shadow"
            >
              <h3 className="font-semibold text-lg mb-1">Frequently Asked Questions</h3>
              <p className="text-gray-600">Find answers to common questions</p>
            </a>
            <a 
              href="/profile/tickets" 
              className="bg-white p-4 rounded-lg shadow hover:shadow-md border border-gray-100 transition-shadow"
            >
              <h3 className="font-semibold text-lg mb-1">My Tickets</h3>
              <p className="text-gray-600">Manage your event tickets</p>
            </a>
            <a 
              href="/refunds" 
              className="bg-white p-4 rounded-lg shadow hover:shadow-md border border-gray-100 transition-shadow"
            >
              <h3 className="font-semibold text-lg mb-1">Refunds & Exchanges</h3>
              <p className="text-gray-600">Learn about our refund policies</p>
            </a>
          </div>
        </div>
        
        {/* Contact Form */}
        <div className="max-w-3xl mx-auto">
          <h2 className="text-2xl font-bold text-center mb-8">Send Us a Message</h2>
          <div className="bg-white rounded-xl shadow-md p-8">
            {submitSuccess ? (
              <div className="bg-green-100 text-green-800 p-4 rounded-lg mb-6">
                Thank you for your message! We'll get back to you soon.
              </div>
            ) : null}
            
            {submitError ? (
              <div className="bg-red-100 text-red-800 p-4 rounded-lg mb-6">
                {submitError}
              </div>
            ) : null}
            
            <form onSubmit={handleSubmit}>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
                <div>
                  <label htmlFor="name" className="block text-gray-700 font-medium mb-2">
                    Your Name
                  </label>
                  <input
                    type="text"
                    id="name"
                    name="name"
                    value={formData.name}
                    onChange={handleChange}
                    required
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                    placeholder="John Doe"
                  />
                </div>
                <div>
                  <label htmlFor="email" className="block text-gray-700 font-medium mb-2">
                    Email Address
                  </label>
                  <input
                    type="email"
                    id="email"
                    name="email"
                    value={formData.email}
                    onChange={handleChange}
                    required
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                    placeholder="john@example.com"
                  />
                </div>
              </div>
              
              <div className="mb-6">
                <label htmlFor="subject" className="block text-gray-700 font-medium mb-2">
                  Subject
                </label>
                <input
                  type="text"
                  id="subject"
                  name="subject"
                  value={formData.subject}
                  onChange={handleChange}
                  required
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                  placeholder="How can we help you?"
                />
              </div>
              
              <div className="mb-6">
                <label htmlFor="message" className="block text-gray-700 font-medium mb-2">
                  Message
                </label>
                <textarea
                  id="message"
                  name="message"
                  value={formData.message}
                  onChange={handleChange}
                  required
                  rows="5"
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                  placeholder="Please describe your question or issue in detail..."
                />
              </div>
              
              <button
                type="submit"
                disabled={isSubmitting}
                className="bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700 text-white font-medium py-3 px-6 rounded-lg transition-all shadow-md hover:shadow-lg flex items-center justify-center"
              >
                {isSubmitting ? (
                  <>
                    <FaSpinner className="animate-spin mr-2" />
                    Sending...
                  </>
                ) : (
                  <>
                    <FaPaperPlane className="mr-2" />
                    Send Message
                  </>
                )}
              </button>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ContactPage;