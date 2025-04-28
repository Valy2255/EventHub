// src/components/layout/Footer.jsx
import { Link } from 'react-router-dom';
import { FaFacebook, FaTwitter, FaInstagram, FaEnvelope, FaTicketAlt, FaArrowRight } from 'react-icons/fa';

export default function Footer() {
  const currentYear = new Date().getFullYear();

  return (
    <footer className="bg-gray-900 text-white py-12 relative overflow-hidden">
      {/* Background pattern/decoration */}
      <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-purple-600 to-indigo-600"></div>
      <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjAiIGhlaWdodD0iNjAiIHZpZXdCb3g9IjAgMCA2MCA2MCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48ZyBmaWxsPSJub25lIiBmaWxsLXJ1bGU9ImV2ZW5vZGQiPjxnIGZpbGw9IiMyMjIiIGZpbGwtb3BhY2l0eT0iMC4wNSI+PHBhdGggZD0iTTM2IDM0djZoNnYtNmgtNnptNiA2djZoNnYtNmgtNnptLTEyIDBoNnY2aC02di02em0xMiAwaDZ2Nmg2di02aC02eiIvPjwvZz48L2c+PC9zdmc+')] opacity-10"></div>
      
      <div className="container mx-auto px-4 relative z-10">
        {/* Top section with logo and social links */}
        <div className="flex flex-col md:flex-row justify-between items-center mb-12 border-b border-gray-800 pb-8">
          <div className="flex items-center mb-6 md:mb-0">
            <FaTicketAlt className="text-purple-500 mr-2" size={32} />
            <span className="text-2xl font-bold tracking-tight">EventHub</span>
          </div>
          
          <div className="flex space-x-6">
            <a 
              href="https://www.facebook.com/ghita.valentin.92/" 
              target="_blank" 
              rel="noopener noreferrer" 
              className="text-gray-400 hover:text-purple-400 transform hover:scale-110 transition-all duration-200"
              aria-label="Facebook"
            >
              <FaFacebook size={24} />
            </a>
            <a 
              href="https://x.com/ValyOnHL" 
              target="_blank" 
              rel="noopener noreferrer" 
              className="text-gray-400 hover:text-purple-400 transform hover:scale-110 transition-all duration-200"
              aria-label="Twitter"
            >
              <FaTwitter size={24} />
            </a>
            <a 
              href="https://www.instagram.com/ghitavalentinn/" 
              target="_blank" 
              rel="noopener noreferrer" 
              className="text-gray-400 hover:text-purple-400 transform hover:scale-110 transition-all duration-200"
              aria-label="Instagram"
            >
              <FaInstagram size={24} />
            </a>
            <a 
              href="mailto:braconieruvalica99@gmail.com" 
              className="text-gray-400 hover:text-purple-400 transform hover:scale-110 transition-all duration-200"
              aria-label="Email"
            >
              <FaEnvelope size={24} />
            </a>
          </div>
        </div>

        {/* Main footer content */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-10 mb-10">
          {/* Column 1: About EventHub */}
          <div>
            <h3 className="text-xl font-bold mb-6 text-white relative inline-block">
              About EventHub
              <span className="absolute -bottom-2 left-0 w-12 h-1 bg-purple-500 rounded-full"></span>
            </h3>
            <p className="text-gray-400 mb-6 leading-relaxed">
              Discover the best events happening in your city. Buy tickets easily and securely for concerts, festivals, sports, and more.
            </p>
            <Link 
              to="/contact" 
              className="inline-flex items-center text-purple-400 hover:text-purple-300 font-medium group"
            >
              Contact Us 
              <FaArrowRight className="ml-2 transform group-hover:translate-x-1 transition-transform duration-200" size={14} />
            </Link>
          </div>

          {/* Column 2: Categories */}
          <div>
            <h3 className="text-xl font-bold mb-6 text-white relative inline-block">
              Categories
              <span className="absolute -bottom-2 left-0 w-12 h-1 bg-purple-500 rounded-full"></span>
            </h3>
            <ul className="space-y-3">
              <li>
                <Link to="/events/category/concerts" className="text-gray-400 hover:text-white transition-colors flex items-center">
                  <span className="w-1.5 h-1.5 bg-purple-500 rounded-full mr-2.5"></span>
                  Concerts
                </Link>
              </li>
              <li>
                <Link to="/events/category/festivals" className="text-gray-400 hover:text-white transition-colors flex items-center">
                  <span className="w-1.5 h-1.5 bg-purple-500 rounded-full mr-2.5"></span>
                  Festivals
                </Link>
              </li>
              <li>
                <Link to="/events/category/sports" className="text-gray-400 hover:text-white transition-colors flex items-center">
                  <span className="w-1.5 h-1.5 bg-purple-500 rounded-full mr-2.5"></span>
                  Sports
                </Link>
              </li>
              <li>
                <Link to="/events/category/theater-comedy" className="text-gray-400 hover:text-white transition-colors flex items-center">
                  <span className="w-1.5 h-1.5 bg-purple-500 rounded-full mr-2.5"></span>
                  Theater & Comedy
                </Link>
              </li>
            </ul>
          </div>

          {/* Column 3: Support */}
          <div>
            <h3 className="text-xl font-bold mb-6 text-white relative inline-block">
              Support
              <span className="absolute -bottom-2 left-0 w-12 h-1 bg-purple-500 rounded-full"></span>
            </h3>
            <ul className="space-y-3">
              <li>
                <Link to="/faq" className="text-gray-400 hover:text-white transition-colors flex items-center">
                  <span className="w-1.5 h-1.5 bg-purple-500 rounded-full mr-2.5"></span>
                  FAQ
                </Link>
              </li>
              <li>
                <Link to="/contact" className="text-gray-400 hover:text-white transition-colors flex items-center">
                  <span className="w-1.5 h-1.5 bg-purple-500 rounded-full mr-2.5"></span>
                  Contact
                </Link>
              </li>
              <li>
                <Link to="/terms" className="text-gray-400 hover:text-white transition-colors flex items-center">
                  <span className="w-1.5 h-1.5 bg-purple-500 rounded-full mr-2.5"></span>
                  Terms & Conditions
                </Link>
              </li>
              <li>
                <Link to="/privacy" className="text-gray-400 hover:text-white transition-colors flex items-center">
                  <span className="w-1.5 h-1.5 bg-purple-500 rounded-full mr-2.5"></span>
                  Privacy Policy
                </Link>
              </li>
            </ul>
          </div>
        </div>

        {/* Copyright */}
        <div className="border-t border-gray-800 pt-8 text-center text-gray-500">
          <p>&copy; {currentYear} EventHub. All rights reserved.</p>
        </div>
      </div>
    </footer>
  );
}