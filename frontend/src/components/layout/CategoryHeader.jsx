// src/components/layout/CategoryHeader.jsx
import { useState, useEffect, useRef } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { 
  FaSearch, 
  FaCalendarAlt, 
  FaMapMarkerAlt, 
  FaChevronDown 
} from 'react-icons/fa';
import api from '../../services/api';

export default function CategoryHeader({ categoryData, subcategoryData }) {
  const [searchText, setSearchText] = useState('');
  const [dateFilter, setDateFilter] = useState('');
  const [locationFilter, setLocationFilter] = useState('');
  const [subcategories, setSubcategories] = useState([]);
  const [isSubcategoryDropdownOpen, setIsSubcategoryDropdownOpen] = useState(false);
  const [isDateDropdownOpen, setIsDateDropdownOpen] = useState(false);
  const [isLocationDropdownOpen, setIsLocationDropdownOpen] = useState(false);
  
  const subcategoryDropdownRef = useRef(null);
  const dateDropdownRef = useRef(null);
  const locationDropdownRef = useRef(null);
  
  const { categorySlug, subcategorySlug } = useParams();
  const navigate = useNavigate();

  useEffect(() => {
    if (categorySlug) {
      const fetchSubcategories = async () => {
        try {
          const response = await api.get(`/categories/${categorySlug}/subcategories`);
          setSubcategories(response.data.subcategories);
        } catch (error) {
          console.error('Error loading subcategories:', error);
        }
      };

      fetchSubcategories();
    }
  }, [categorySlug]);

  // Handle clicks outside dropdowns
  useEffect(() => {
    function handleClickOutside(event) {
      if (subcategoryDropdownRef.current && !subcategoryDropdownRef.current.contains(event.target)) {
        setIsSubcategoryDropdownOpen(false);
      }
      if (dateDropdownRef.current && !dateDropdownRef.current.contains(event.target)) {
        setIsDateDropdownOpen(false);
      }
      if (locationDropdownRef.current && !locationDropdownRef.current.contains(event.target)) {
        setIsLocationDropdownOpen(false);
      }
    }

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  // Use data passed in props if available
  const category = categoryData || { name: '', description: '' };
  const subcategory = subcategoryData;

  // Background image based on category
  const getBgImage = () => {
    switch (categorySlug) {
      case 'concerts':
        return 'url(https://placehold.co/1920x400/purple/white?text=Concert+Tickets)';
      case 'sports':
        return 'url(https://placehold.co/1920x400/purple/white?text=Sports+Events)';
      case 'theater-comedy':
        return 'url(https://placehold.co/1920x400/purple/white?text=Theater+and+Comedy)';
      case 'festivals':
        return 'url(https://placehold.co/1920x400/purple/white?text=Festivals)';
      default:
        return 'url(https://placehold.co/1920x400/purple/white?text=Events)';
    }
  };

  const handleSubcategoryChange = (slug) => {
    if (slug) {
      navigate(`/events/category/${categorySlug}/${slug}`);
    } else {
      navigate(`/events/category/${categorySlug}`);
    }
    setIsSubcategoryDropdownOpen(false);
  };

  const handleSearch = (e) => {
    e.preventDefault();
    // Construct search parameters
    const params = new URLSearchParams();
    if (locationFilter) params.append('location', locationFilter);
    if (dateFilter) params.append('date', dateFilter);
    if (categorySlug) params.append('category', categorySlug);
    if (subcategorySlug) params.append('subcategory', subcategorySlug);
    if (searchText) params.append('q', searchText);
    
    // Navigate to search results page
    navigate(`/events/search?${params.toString()}`);
  };

  return (
    <div>
      {/* Banner with category name overlay */}
      <div 
        className="w-full h-80 bg-cover bg-center relative" 
        style={{ backgroundImage: getBgImage() }}
      >
        <div className="absolute inset-0 bg-black bg-opacity-50 flex items-center justify-start">
          <div className="container mx-auto px-4">
            <h1 className="text-5xl font-bold text-white uppercase">
              {subcategory ? subcategory.name : category.name}
              {subcategory ? ' TICKETS' : ' TICKETS'}
            </h1>
            {subcategory && (
              <div className="mt-2">
                <Link to={`/events/category/${categorySlug}`} className="text-purple-400 hover:text-purple-300 text-lg">
                  {'< Back to '} {category.name}
                </Link>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Filter section */}
      <div className="bg-white border-b border-gray-200">
        <div className="container mx-auto px-4 py-4">
          <form onSubmit={handleSearch} className="flex items-center gap-4">
            {/* Location filter */}
            <div 
              ref={locationDropdownRef}
              className="relative w-56"
            >
              <div 
                className="flex items-center border rounded p-2 cursor-pointer"
                onClick={() => setIsLocationDropdownOpen(!isLocationDropdownOpen)}
              >
                <FaMapMarkerAlt className="text-gray-500 mr-2" />
                <span className="text-gray-800">
                  {locationFilter || "All Locations"}
                </span>
                <FaChevronDown className={`ml-auto text-gray-500 ${isLocationDropdownOpen ? "transform rotate-180" : ""}`} />
              </div>
              
              {isLocationDropdownOpen && (
                <div className="absolute left-0 right-0 mt-1 bg-white border border-gray-200 rounded shadow-lg z-30">
                  <div 
                    className="p-3 hover:bg-gray-100 cursor-pointer border-b border-gray-200"
                    onClick={() => {
                      setLocationFilter('');
                      setIsLocationDropdownOpen(false);
                    }}
                  >
                    All Locations
                  </div>
                  <div 
                    className="p-3 hover:bg-gray-100 cursor-pointer border-b border-gray-200"
                    onClick={() => {
                      setLocationFilter('Bucharest');
                      setIsLocationDropdownOpen(false);
                    }}
                  >
                    Bucharest
                  </div>
                  <div 
                    className="p-3 hover:bg-gray-100 cursor-pointer border-b border-gray-200"
                    onClick={() => {
                      setLocationFilter('Cluj-Napoca');
                      setIsLocationDropdownOpen(false);
                    }}
                  >
                    Cluj-Napoca
                  </div>
                  <div 
                    className="p-3 hover:bg-gray-100 cursor-pointer"
                    onClick={() => {
                      setLocationFilter('Timisoara');
                      setIsLocationDropdownOpen(false);
                    }}
                  >
                    Timisoara
                  </div>
                </div>
              )}
            </div>

            {/* Date filter */}
            <div 
              ref={dateDropdownRef}
              className="relative w-56"
            >
              <div 
                className="flex items-center border rounded p-2 cursor-pointer"
                onClick={() => setIsDateDropdownOpen(!isDateDropdownOpen)}
              >
                <FaCalendarAlt className="text-gray-500 mr-2" />
                <span className="text-gray-800">
                  {dateFilter || "All Dates"}
                </span>
                <FaChevronDown className={`ml-auto text-gray-500 ${isDateDropdownOpen ? "transform rotate-180" : ""}`} />
              </div>
              
              {isDateDropdownOpen && (
                <div className="absolute left-0 right-0 mt-1 bg-white border border-gray-200 rounded shadow-lg z-30">
                  <div 
                    className="p-3 hover:bg-gray-100 cursor-pointer border-b border-gray-200"
                    onClick={() => {
                      setDateFilter('');
                      setIsDateDropdownOpen(false);
                    }}
                  >
                    All Dates
                  </div>
                  <div 
                    className="p-3 hover:bg-gray-100 cursor-pointer border-b border-gray-200"
                    onClick={() => {
                      setDateFilter('Today');
                      setIsDateDropdownOpen(false);
                    }}
                  >
                    Today
                  </div>
                  <div 
                    className="p-3 hover:bg-gray-100 cursor-pointer border-b border-gray-200"
                    onClick={() => {
                      setDateFilter('This Weekend');
                      setIsDateDropdownOpen(false);
                    }}
                  >
                    This Weekend
                  </div>
                  <div 
                    className="p-3 hover:bg-gray-100 cursor-pointer border-b border-gray-200"
                    onClick={() => {
                      setDateFilter('This Week');
                      setIsDateDropdownOpen(false);
                    }}
                  >
                    This Week
                  </div>
                  <div 
                    className="p-3 hover:bg-gray-100 cursor-pointer"
                    onClick={() => {
                      setDateFilter('This Month');
                      setIsDateDropdownOpen(false);
                    }}
                  >
                    This Month
                  </div>
                </div>
              )}
            </div>

            {/* Subcategory filter dropdown */}
            {categorySlug && subcategories.length > 0 && (
              <div 
                ref={subcategoryDropdownRef}
                className="relative w-64"
              >
                <div 
                  className="flex items-center border rounded p-2 cursor-pointer"
                  onClick={() => setIsSubcategoryDropdownOpen(!isSubcategoryDropdownOpen)}
                >
                  <span className="text-gray-800">
                    {subcategory ? subcategory.name : `All ${category.name}`}
                  </span>
                  <FaChevronDown className={`ml-auto text-gray-500 ${isSubcategoryDropdownOpen ? "transform rotate-180" : ""}`} />
                </div>
                
                {isSubcategoryDropdownOpen && (
                  <div className="absolute left-0 right-0 mt-1 bg-white border border-gray-200 rounded shadow-lg z-30 max-h-80 overflow-y-auto">
                    <div 
                      className="p-3 hover:bg-gray-100 cursor-pointer border-b border-gray-200 flex justify-between items-center"
                      onClick={() => handleSubcategoryChange('')}
                    >
                      <span className="font-medium">All {category.name}</span>
                      {!subcategorySlug && <span className="text-gray-500">✓</span>}
                    </div>
                    
                    {subcategories.map(sub => (
                      <div 
                        key={sub.id}
                        className="p-3 hover:bg-gray-100 cursor-pointer border-b border-gray-200 flex justify-between items-center"
                        onClick={() => handleSubcategoryChange(sub.slug)}
                      >
                        <span>{sub.name}</span>
                        {subcategorySlug === sub.slug && <span className="text-gray-500">✓</span>}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* Search box */}
            <div className="flex-grow">
              <div className="flex">
                <input
                  type="text"
                  placeholder="Search events"
                  value={searchText}
                  onChange={(e) => setSearchText(e.target.value)}
                  className="p-2 border rounded-l flex-grow"
                />
                <button 
                  type="submit"
                  className="bg-purple-600 text-white px-4 py-2 rounded-r hover:bg-purple-700 transition-colors"
                >
                  <FaSearch />
                </button>
              </div>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}