// src/components/layout/Header.jsx
import { useState } from 'react';
import { Link } from 'react-router-dom';
import { FaTicketAlt, FaSearch, FaBars, FaTimes } from 'react-icons/fa';

export default function Header() {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [searchText, setSearchText] = useState('');

  const toggleMenu = () => setIsMenuOpen(!isMenuOpen);

  return (
    <header className="bg-gray-900 text-white sticky top-0 z-50 shadow">
      <div className="container mx-auto px-4 py-4 flex items-center justify-between">
        {/* Logo */}
        <Link to="/" className="flex items-center">
          <FaTicketAlt className="text-purple-500 mr-2" size={28} />
          <span className="text-2xl font-bold">EventHub</span>
        </Link>

        {/* Desktop Navigation */}
        <div className="hidden md:flex space-x-6 items-center">
          <Link to="/" className="hover:text-purple-500 transition-colors">Acasă</Link>
          <Link to="/events" className="hover:text-purple-500 transition-colors">Evenimente</Link>
          <Link to="/categories" className="hover:text-purple-500 transition-colors">Categorii</Link>
          <Link to="/contact" className="hover:text-purple-500 transition-colors">Contact</Link>
          
          <div className="relative">
            <input 
              type="text"
              placeholder="Caută evenimente..."
              value={searchText}
              onChange={(e) => setSearchText(e.target.value)}
              className="bg-gray-800 rounded-full pl-4 pr-10 py-2 focus:outline-none"
            />
            <button 
              type="submit" 
              className="absolute right-2 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-white"
            >
              <FaSearch />
            </button>
          </div>
          
          <Link to="/login" className="px-4 py-2 bg-purple-600 rounded hover:bg-purple-700 transition-colors">Login</Link>
          <Link to="/register" className="px-4 py-2 border border-purple-600 rounded hover:bg-purple-600 hover:text-white transition-colors">Register</Link>
        </div>

        {/* Mobile Menu Button */}
        <button className="md:hidden text-white focus:outline-none" onClick={toggleMenu}>
          {isMenuOpen ? <FaTimes size={24}/> : <FaBars size={24} />}
        </button>
      </div>

      {/* Mobile Navigation */}
      {isMenuOpen && (
        <div className="md:hidden bg-gray-900">
          <nav className="px-4 pt-2 pb-4 space-y-2">
            <Link to="/" onClick={toggleMenu} className="block hover:text-purple-500 transition-colors">Acasă</Link>
            <Link to="/events" onClick={toggleMenu} className="block hover:text-purple-500 transition-colors">Evenimente</Link>
            <Link to="/categories" onClick={toggleMenu} className="block hover:text-purple-500 transition-colors">Categorii</Link>
            <Link to="/contact" onClick={toggleMenu} className="block hover:text-purple-500 transition-colors">Contact</Link>
            <div className="relative">
              <input 
                type="text"
                placeholder="Caută evenimente..."
                value={searchText}
                onChange={(e) => setSearchText(e.target.value)}
                className="bg-gray-800 rounded-full pl-4 pr-10 py-2 w-full focus:outline-none"
              />
              <button 
                type="submit" 
                className="absolute right-2 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-white"
              >
                <FaSearch />
              </button>
            </div>
            <Link to="/login" onClick={toggleMenu} className="block px-4 py-2 bg-purple-600 rounded hover:bg-purple-700 transition-colors">Login</Link>
            <Link to="/register" onClick={toggleMenu} className="block px-4 py-2 border border-purple-600 rounded hover:bg-purple-600 hover:text-white transition-colors">Register</Link>
          </nav>
        </div>
      )}
    </header>
  );
}