import { useState } from 'react';
import { Link } from 'react-router-dom';
import { FaTicketAlt, FaSearch, FaMapMarkerAlt, FaCalendar } from 'react-icons/fa';

export default function Header() {
  const [searchText, setSearchText] = useState('');
  const [location, setLocation] = useState('');

  return (
    <header className="bg-gray-900 text-white">
      {/* Bara de navigație de sus */}
      <div className="w-full mx-auto px-4 py-3 flex items-center justify-between">
        {/* Logo + Meniu stânga */}
        <div className="flex items-center space-x-8">
          {/* Logo */}
          <Link to="/" className="flex items-center">
            <FaTicketAlt className="text-purple-500 mr-2" size={26} />
            <span className="text-2xl font-bold">EventHub</span>
          </Link>

          {/* Meniu principal (vizibil de la md în sus) */}
          <nav className="hidden md:flex space-x-6">
            <Link
              to="/events/category/concerts"
              className="hover:text-purple-500 transition-colors"
            >
              Concerte
            </Link>
            <Link
              to="/events/category/sports"
              className="hover:text-purple-500 transition-colors"
            >
              Sport
            </Link>
            <Link
              to="/events/category/theater"
              className="hover:text-purple-500 transition-colors"
            >
              Teatru & Comedie
            </Link>
            <Link
              to="/events/category/festivals"
              className="hover:text-purple-500 transition-colors"
            >
              Festivaluri
            </Link>
          </nav>
        </div>

        {/* Butoane dreapta */}
        <div className="flex items-center space-x-4">
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
        </div>
      </div>

      {/* Bară de căutare */}
      <div className="w-full mx-auto px-4 pb-6">
        <div className="bg-gray-800 rounded-lg flex flex-col md:flex-row overflow-hidden shadow-lg max-w-4xl mx-auto">
          {/* Locație */}
          <div className="flex items-center border-b md:border-b-0 md:border-r border-gray-700 px-4 py-3 md:w-1/3">
            <FaMapMarkerAlt className="text-gray-400 mr-2" />
            <input
              type="text"
              placeholder="Oraș sau Cod Poștal"
              value={location}
              onChange={(e) => setLocation(e.target.value)}
              className="w-full outline-none bg-transparent text-white"
            />
          </div>

          {/* Selector Dată */}
          <div className="flex items-center border-b md:border-b-0 md:border-r border-gray-700 px-4 py-3 md:w-1/3">
            <FaCalendar className="text-gray-400 mr-2" />
            <select className="w-full outline-none bg-transparent text-white appearance-none">
              <option>Toate Datele</option>
              <option>Acest Weekend</option>
              <option>Luna Aceasta</option>
              <option>Luna Viitoare</option>
            </select>
          </div>

          {/* Căutare */}
          <div className="flex items-center flex-1">
            <div className="flex-1 flex items-center px-4 py-3">
              <FaSearch className="text-gray-400 mr-2" />
              <input
                type="text"
                placeholder="Caută după Artist, Eveniment sau Locație"
                value={searchText}
                onChange={(e) => setSearchText(e.target.value)}
                className="w-full outline-none bg-transparent text-white"
              />
            </div>
            <button className="bg-purple-600 text-white px-6 py-3 font-semibold hover:bg-purple-700 transition-colors">
              Caută
            </button>
          </div>
        </div>
      </div>
    </header>
  );
}
