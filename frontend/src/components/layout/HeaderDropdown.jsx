// src/components/layout/HeaderDropdown.jsx
import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { FaChevronDown } from 'react-icons/fa';
import api from '../../services/api';

export default function HeaderDropdown() {
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeDropdown, setActiveDropdown] = useState(null);

  useEffect(() => {
    const fetchCategories = async () => {
      try {
        const response = await api.get('/categories');
        setCategories(response.data.categories);
      } catch (error) {
        console.error('Error loading categories:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchCategories();
  }, []);

  // Function to open/close dropdown
  const toggleDropdown = (categoryId) => {
    if (activeDropdown === categoryId) {
      setActiveDropdown(null);
    } else {
      setActiveDropdown(categoryId);
    }
  };

  // Close dropdown when clicking elsewhere
  useEffect(() => {
    const closeDropdown = () => setActiveDropdown(null);
    document.body.addEventListener('click', closeDropdown);
    
    return () => {
      document.body.removeEventListener('click', closeDropdown);
    };
  }, []);
  
  // Stop click propagation in dropdown to prevent closing
  const handleDropdownClick = (e) => {
    e.stopPropagation();
  };

  if (loading) {
    return <div className="animate-pulse h-6 w-24 bg-gray-700 rounded"></div>;
  }

  return (
    <nav className="hidden md:flex space-x-6">
      {categories.map((category) => (
        <div key={category.id} className="relative" onClick={handleDropdownClick}>
          <button
            className="flex items-center hover:text-purple-500 transition-colors"
            onClick={() => toggleDropdown(category.id)}
          >
            {category.name}
            <FaChevronDown className="ml-1 text-xs" />
          </button>
          
          {activeDropdown === category.id && (
            <div className="absolute left-0 mt-2 w-60 bg-white rounded-md shadow-lg z-20">
              <div className="py-1">
                <Link
                  to={`/events/category/${category.slug}`}
                  className="block px-4 py-2 text-sm text-gray-800 font-semibold border-b border-gray-200 hover:bg-gray-100"
                >
                  All {category.name} 
                </Link>
                
                {category.subcategories.map((subcategory) => (
                  <Link
                    key={subcategory.id}
                    to={`/events/category/${category.slug}/${subcategory.slug}`}
                    className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                  >
                    {subcategory.name}
                  </Link>
                ))}
              </div>
            </div>
          )}
        </div>
      ))}
    </nav>
  );
}