// src/components/layout/CategoryHeader.jsx
import { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { FaSearch, FaFilter, FaCalendarAlt, FaMapMarkerAlt, FaChevronDown } from 'react-icons/fa';
import api from '../../services/api';

export default function CategoryHeader({ categoryData, subcategoryData }) {
  const [searchText, setSearchText] = useState('');
  const [dateFilter, setDateFilter] = useState('');
  const [locationFilter, setLocationFilter] = useState('');
  const [subcategories, setSubcategories] = useState([]);
  const [isSubcategoryDropdownOpen, setIsSubcategoryDropdownOpen] = useState(false);
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
    // Implement search functionality
    console.log('Search:', searchText, 'Date:', dateFilter, 'Location:', locationFilter);
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
          <div className="flex flex-wrap items-center gap-4">
            {/* Location filter */}
            <div className="flex-grow md:flex-grow-0">
              <div className="flex items-center">
                <FaMapMarkerAlt className="text-gray-500 mr-2" />
                <select 
                  className="p-2 border rounded min-w-[150px]"
                  value={locationFilter}
                  onChange={(e) => setLocationFilter(e.target.value)}
                >
                  <option value="">All Locations</option>
                  <option value="bucharest">Bucharest</option>
                  <option value="cluj-napoca">Cluj-Napoca</option>
                  <option value="timisoara">Timisoara</option>
                </select>
              </div>
            </div>

            {/* Date filter */}
            <div>
              <div className="flex items-center">
                <FaCalendarAlt className="text-gray-500 mr-2" />
                <select 
                  className="p-2 border rounded min-w-[150px]"
                  value={dateFilter}
                  onChange={(e) => setDateFilter(e.target.value)}
                >
                  <option value="">All Dates</option>
                  <option value="this-weekend">This Weekend</option>
                  <option value="today">Today</option>
                  <option value="tomorrow">Tomorrow</option>
                  <option value="this-week">This Week</option>
                  <option value="this-month">This Month</option>
                </select>
              </div>
            </div>

            {/* Subcategory filter dropdown - styled like the image */}
            {categorySlug && subcategories.length > 0 && (
              <div className="relative">
                <button 
                  onClick={() => setIsSubcategoryDropdownOpen(!isSubcategoryDropdownOpen)}
                  className="flex items-center justify-between w-64 p-2 border rounded bg-white"
                >
                  <span>{subcategory ? subcategory.name : `All ${category.name}`}</span>
                  <FaChevronDown className={isSubcategoryDropdownOpen ? "transform rotate-180" : ""} />
                </button>
                
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
            <div className="flex-grow md:ml-auto">
              <form onSubmit={handleSearch} className="flex">
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
              </form>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}