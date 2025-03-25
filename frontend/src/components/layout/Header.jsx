// src/components/layout/Header.jsx
import { useState } from 'react';
import { Link } from 'react-router-dom';
import { FaTicketAlt, FaSearch, FaMapMarkerAlt, FaCalendar, FaUserCircle, FaBars } from 'react-icons/fa';
import { useAuth } from '../../hooks/useAuth';
import HeaderDropdown from './HeaderDropdown';

export default function Header() {
  const [searchText, setSearchText] = useState('');
  const [location, setLocation] = useState('');
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  
  const { user, logout } = useAuth();

  return (
    <header className="bg-gray-900 text-white">
      {/* Top navigation bar */}
      <div className="w-full mx-auto px-4 py-3 flex items-center justify-between">
        {/* Logo + Left menu */}
        <div className="flex items-center space-x-8">
          {/* Logo */}
          <Link to="/" className="flex items-center">
            <FaTicketAlt className="text-purple-500 mr-2" size={26} />
            <span className="text-2xl font-bold">EventHub</span>
          </Link>

          {/* Dropdown for categories and subcategories */}
          <HeaderDropdown />
          
          {/* Mobile menu button */}
          <button
            className="md:hidden text-white"
            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
          >
            <FaBars size={24} />
          </button>
        </div>

        {/* Right buttons */}
        <div className="flex items-center space-x-4">
          {user ? (
            <div className="relative">
              <button 
                onClick={() => setIsDropdownOpen(!isDropdownOpen)}
                className="flex items-center space-x-2 hover:text-purple-500 transition-colors"
              >
                <FaUserCircle size={24} />
                <span className="hidden md:block">{user.name}</span>
              </button>
              
              {isDropdownOpen && (
                <div className="absolute right-0 mt-2 w-48 bg-white rounded-md shadow-lg py-1 z-10">
                  <Link 
                    to="/profile" 
                    className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                  >
                    My Profile
                  </Link>
                  <Link 
                    to="/tickets" 
                    className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                  >
                    My Tickets
                  </Link>
                  <button 
                    onClick={logout}
                    className="block w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                  >
                    Logout
                  </button>
                </div>
              )}
            </div>
          ) : (
            <>
              <Link
                to="/login"
                className="px-4 py-2 text-white hover:text-purple-500 transition-colors"
              >
                Login
              </Link>
              <Link
                to="/register"
                className="px-4 py-2 bg-purple-600 rounded hover:bg-purple-700 transition-colors"
              >
                Register
              </Link>
            </>
          )}
        </div>
      </div>

      {/* Mobile menu */}
      {isMobileMenuOpen && (
        <div className="md:hidden bg-gray-800 px-4 py-2">
          {/* Simple mobile menu with categories */}
          <div className="flex flex-col space-y-2">
            <Link to="/events/category/concerts" className="py-2 hover:text-purple-500">Concerts</Link>
            <Link to="/events/category/sports" className="py-2 hover:text-purple-500">Sports</Link>
            <Link to="/events/category/theater" className="py-2 hover:text-purple-500">Theater & Comedy</Link>
            <Link to="/events/category/festivals" className="py-2 hover:text-purple-500">Festivals</Link>
          </div>
        </div>
      )}

      {/* Search bar */}
      <div className="w-full mx-auto px-4 pb-6">
        <div className="bg-gray-800 rounded-lg flex flex-col md:flex-row overflow-hidden shadow-lg max-w-4xl mx-auto">
          {/* Location */}
          <div className="flex items-center border-b md:border-b-0 md:border-r border-gray-700 px-4 py-3 md:w-1/3">
            <FaMapMarkerAlt className="text-gray-400 mr-2" />
            <input
              type="text"
              placeholder="City or Postal Code"
              value={location}
              onChange={(e) => setLocation(e.target.value)}
              className="w-full outline-none bg-transparent text-white"
            />
          </div>

          {/* Date Selector */}
          <div className="flex items-center border-b md:border-b-0 md:border-r border-gray-700 px-4 py-3 md:w-1/3">
            <FaCalendar className="text-gray-400 mr-2" />
            <select className="w-full outline-none bg-transparent text-white appearance-none">
              <option>All Dates</option>
              <option>This Weekend</option>
              <option>This Month</option>
              <option>Next Month</option>
            </select>
          </div>

          {/* Search */}
          <div className="flex items-center flex-1">
            <div className="flex-1 flex items-center px-4 py-3">
              <FaSearch className="text-gray-400 mr-2" />
              <input
                type="text"
                placeholder="Search by Artist, Event or Location"
                value={searchText}
                onChange={(e) => setSearchText(e.target.value)}
                className="w-full outline-none bg-transparent text-white"
              />
            </div>
            <button className="bg-purple-600 text-white px-6 py-3 font-semibold hover:bg-purple-700 transition-colors">
              Search
            </button>
          </div>
        </div>
      </div>
    </header>
  );
}