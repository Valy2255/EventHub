// src/components/layout/Header.jsx
import { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { 
  FaTicketAlt, 
  FaSearch, 
  FaUserCircle, 
  FaBars, 
  FaMapMarkerAlt, 
  FaCalendar 
} from 'react-icons/fa';
import { useAuth } from '../../hooks/useAuth';
import HeaderDropdown from './HeaderDropdown';

export default function Header() {
  const [searchText, setSearchText] = useState('');
  const [locationInput, setLocationInput] = useState('');
  const [dateInput, setDateInput] = useState('');
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  const { user, logout } = useAuth();
  const { pathname } = useLocation();
  
  // True if we are on /events/category/... or /events/category/.../...
  const isCategoryPage = pathname.includes('/events/category');

  // Handler for big wide search bar (non-category pages)
  const handleWideSearch = () => {
    console.log('Wide Search triggered:', { locationInput, dateInput, searchText });
    // Implement actual search logic here
  };

  // Handler for top-right search bar (category pages)
  const handleTopRightSearch = () => {
    console.log('Top-Right Search triggered:', { searchText });
    // Implement search logic for category pages here
  };

  return (
    <header className="bg-gray-900 text-white">
      {/* Main navigation bar */}
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

        {/* Right side of header */}
        <div className="hidden md:flex items-center">
          {/* 
            If we are on a category page, show the smaller top-right search bar.
            Otherwise, only show the user controls
          */}
          {isCategoryPage && (
            <div className="relative flex items-center mr-4">
              <input
                type="text"
                placeholder="Search by Artist, Event or Venue"
                value={searchText}
                onChange={(e) => setSearchText(e.target.value)}
                className="bg-white text-gray-800 px-4 py-2 pr-10 rounded-full w-80 focus:outline-none"
              />
              <button 
                onClick={handleTopRightSearch}
                className="absolute right-3 text-gray-600"
              >
                <FaSearch />
              </button>
            </div>
          )}

          {/* User account - always visible in desktop */}
          {user ? (
            <div className="relative">
              <button 
                onClick={() => setIsDropdownOpen(!isDropdownOpen)}
                className="flex items-center space-x-2 hover:text-purple-400 transition-colors"
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
            <Link
              to="/login"
              className="flex items-center space-x-1 hover:text-purple-400 transition-colors"
            >
              <FaUserCircle size={24} />
              <span>Sign In/Register</span>
            </Link>
          )}
        </div>
      </div>

      {/* Mobile menu */}
      {isMobileMenuOpen && (
        <div className="md:hidden bg-gray-800 px-4 py-2">
          <div className="flex flex-col space-y-2">
            <Link to="/events/category/concerts" className="py-2 hover:text-purple-400">Concerts</Link>
            <Link to="/events/category/sports" className="py-2 hover:text-purple-400">Sports</Link>
            <Link to="/events/category/theater-comedy" className="py-2 hover:text-purple-400">Theater & Comedy</Link>
            <Link to="/events/category/festivals" className="py-2 hover:text-purple-400">Festivals</Link>
            <div className="pt-2 border-t border-gray-700">
              {user ? (
                <>
                  <Link to="/profile" className="py-2 hover:text-purple-400">My Profile</Link>
                  <Link to="/tickets" className="py-2 hover:text-purple-400">My Tickets</Link>
                  <button 
                    onClick={logout}
                    className="w-full text-left py-2 hover:text-purple-400"
                  >
                    Logout
                  </button>
                </>
              ) : (
                <Link to="/login" className="py-2 hover:text-purple-400">Sign In/Register</Link>
              )}
            </div>
          </div>
        </div>
      )}

      {/* 
        Big wide search bar displayed ONLY if NOT on a category/subcategory page
        (like the Ticketmaster screenshot).
      */}
      {!isCategoryPage && (
        <div className="w-full mx-auto px-4 pb-6">
          <div className="bg-gray-800 rounded-lg flex flex-col md:flex-row overflow-hidden shadow-lg max-w-4xl mx-auto">
            {/* Location input */}
            <div className="flex items-center border-b md:border-b-0 md:border-r border-gray-700 px-4 py-3 md:w-1/3">
              <FaMapMarkerAlt className="text-gray-400 mr-2" />
              <input
                type="text"
                placeholder="City or Postal Code"
                value={locationInput}
                onChange={(e) => setLocationInput(e.target.value)}
                className="w-full outline-none bg-transparent text-white"
              />
            </div>

            {/* Date selector */}
            <div className="flex items-center border-b md:border-b-0 md:border-r border-gray-700 px-4 py-3 md:w-1/3">
              <FaCalendar className="text-gray-400 mr-2" />
              <select
                className="w-full outline-none bg-transparent text-white appearance-none"
                value={dateInput}
                onChange={(e) => setDateInput(e.target.value)}
              >
                <option>All Dates</option>
                <option>This Weekend</option>
                <option>This Month</option>
                <option>Next Month</option>
              </select>
            </div>

            {/* Search text + button */}
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
              <button 
                onClick={handleWideSearch}
                className="bg-purple-600 text-white px-6 py-3 font-semibold hover:bg-purple-700 transition-colors"
              >
                Search
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Mobile search - Only show on category pages */}
      {isCategoryPage && (
        <div className="md:hidden w-full px-4 pb-3">
          <div className="relative">
            <input
              type="text"
              placeholder="Search events"
              value={searchText}
              onChange={(e) => setSearchText(e.target.value)}
              className="bg-white text-gray-800 px-4 py-2 pr-10 rounded-full w-full focus:outline-none"
            />
            <button 
              onClick={handleTopRightSearch}
              className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-600"
            >
              <FaSearch />
            </button>
          </div>
        </div>
      )}
    </header>
  );
}