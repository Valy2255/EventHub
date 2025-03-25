import { useState } from 'react';
import { Link } from 'react-router-dom';
import { FaMapMarkerAlt, FaCalendarAlt, FaTicketAlt } from 'react-icons/fa';

// Dummy data for events
const dummyEvents = [
  {
    id: 1,
    name: 'Untold Festival 2025',
    date: '2025-08-01',
    venue: 'Cluj Arena',
    city: 'Cluj-Napoca',
    imageUrl: 'https://placehold.co/600x400/purple/white?text=Untold+2025',
    category: 'Concerts',
    minPrice: 350
  },
  {
    id: 2,
    name: 'Electric Castle 2025',
    date: '2025-07-15',
    venue: 'Banffy Castle',
    city: 'Bontida',
    imageUrl: 'https://placehold.co/600x400/blue/white?text=Electric+Castle',
    category: 'Festivals',
    minPrice: 300
  },
  {
    id: 3,
    name: 'CFR Cluj vs. FCSB Match',
    date: '2025-05-20',
    venue: 'Dr. Constantin Radulescu Stadium',
    city: 'Cluj-Napoca',
    imageUrl: 'https://placehold.co/600x400/red/white?text=CFR+vs+FCSB',
    category: 'Sports',
    minPrice: 120
  },
  {
    id: 4,
    name: 'Hamlet - National Theater',
    date: '2025-06-10',
    venue: 'National Theater',
    city: 'Bucharest',
    imageUrl: 'https://placehold.co/600x400/gray/white?text=Hamlet',
    category: 'Theater',
    minPrice: 150
  }
];

const categories = ['All', 'Concerts', 'Theater', 'Sports', 'Festivals', 'Conferences'];

const Home = () => {
  const [activeFilter, setActiveFilter] = useState('All');
  
  return (
    <div className="bg-gray-50 min-h-screen">
      {/* Hero Section */}
      <section 
        className="relative py-20 px-4 overflow-hidden"
        style={{ 
          backgroundImage: 'linear-gradient(rgba(0, 0, 0, 0.7), rgba(0, 0, 0, 0.7)), url("https://placehold.co/1920x1080/purple/white?text=EventHub")', 
          backgroundSize: 'cover', 
          backgroundPosition: 'center' 
        }}
      >
        <div className="container mx-auto text-center relative z-10">
          <h1 className="text-4xl md:text-5xl font-bold mb-4 text-white">Discover the best events</h1>
          <p className="text-xl mb-8 max-w-2xl mx-auto text-gray-200">
            Buy tickets quickly and securely for concerts, festivals, shows and more
          </p>
          <Link 
            to="/events" 
            className="bg-purple-600 hover:bg-purple-700 text-white font-medium py-3 px-8 rounded-full text-lg transition-colors"
          >
            Explore events
          </Link>
        </div>
      </section>

      <div className="container mx-auto px-4 py-12">
        {/* Filter Section */}
        <div className="mb-8 flex flex-wrap gap-2">
          {categories.map(category => (
            <button
              key={category}
              onClick={() => setActiveFilter(category)}
              className={`px-4 py-2 rounded-full font-medium transition-colors ${
                activeFilter === category 
                ? 'bg-purple-600 text-white' 
                : 'bg-gray-200 text-gray-800 hover:bg-gray-300'
              }`}
            >
              {category}
            </button>
          ))}
        </div>

        {/* Upcoming Events Section */}
        <section className="mb-16">
          <h2 className="text-2xl font-bold mb-6 text-gray-800 border-b pb-2 border-gray-200">
            Upcoming Events
          </h2>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {dummyEvents.map(event => (
              <div key={event.id} className="bg-white rounded-lg shadow-md overflow-hidden group hover:shadow-xl transition-shadow duration-300">
                <div className="relative overflow-hidden">
                  <img
                    src={event.imageUrl}
                    alt={event.name}
                    className="w-full h-48 object-cover transition-transform duration-300 group-hover:scale-105"
                  />
                  <div className="absolute top-2 right-2 bg-purple-600 text-white px-2 py-1 text-xs rounded-md">
                    {event.category}
                  </div>
                </div>
                
                <div className="p-4">
                  <h3 className="text-lg font-semibold mb-2 text-gray-800">{event.name}</h3>
                  
                  <div className="flex items-center text-gray-600 mb-1 text-sm">
                    <FaCalendarAlt className="mr-2" />
                    <span>{new Date(event.date).toLocaleDateString()}</span>
                  </div>
                  
                  <div className="flex items-center text-gray-600 mb-3 text-sm">
                    <FaMapMarkerAlt className="mr-2" />
                    <span>{event.venue}, {event.city}</span>
                  </div>
                  
                  <div className="flex justify-between items-center mt-4">
                    <span className="font-bold text-purple-700">
                      From {event.minPrice} RON
                    </span>
                    <Link 
                      to={`/events/${event.id}`}
                      className="bg-purple-600 hover:bg-purple-700 text-white px-4 py-2 rounded-md inline-flex items-center transition-colors"
                    >
                      <FaTicketAlt className="mr-1" /> Details
                    </Link>
                  </div>
                </div>
              </div>
            ))}
          </div>
          
          <div className="text-center mt-8">
            <Link 
              to="/events" 
              className="border border-gray-300 bg-white text-gray-700 hover:bg-gray-50 px-6 py-2 rounded-md inline-block"
            >
              View all events
            </Link>
          </div>
        </section>
      </div>
    </div>
  );
};

export default Home;