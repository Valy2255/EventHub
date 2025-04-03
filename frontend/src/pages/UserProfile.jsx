// src/pages/UserProfile.jsx
import { useState } from 'react';
import { Link } from 'react-router-dom';
import { 
  FaUser,
  FaEnvelope,
  FaTicketAlt,
  FaHistory,
  FaCreditCard, 
  FaEdit,
  FaLock,
  FaSave,
  FaSpinner
} from 'react-icons/fa';
import { useAuth } from '../hooks/useAuth';

const UserProfile = () => {
  const { user } = useAuth();
  const [isEditing, setIsEditing] = useState(false);
  const [formData, setFormData] = useState({
    name: user?.name || '',
    email: user?.email || '',
    profileImage: user?.profile_image || ''
  });
  const [saving, setSaving] = useState(false);
  
  // Handle input change
  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };
  
  // Handle form submission
  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    
    // Simulate an API call
    setTimeout(() => {
      // In a real app, you would update the user profile via API
      console.log('Profile update data:', formData);
      setIsEditing(false);
      setSaving(false);
    }, 1000);
  };
  
  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold mb-6">My Profile</h1>
      
      <div className="bg-white rounded-lg shadow-md p-6 mb-6">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-bold">Account Information</h2>
          
          {!isEditing && (
            <button
              onClick={() => setIsEditing(true)}
              className="flex items-center text-sm text-purple-600 hover:text-purple-800"
            >
              <FaEdit className="mr-1" />
              Edit Profile
            </button>
          )}
        </div>
        
        {isEditing ? (
          <form onSubmit={handleSubmit}>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-gray-700 font-medium mb-2">
                  Name
                </label>
                <input
                  type="text"
                  name="name"
                  value={formData.name}
                  onChange={handleChange}
                  className="w-full p-3 border border-gray-300 rounded-md"
                  required
                />
              </div>
              
              <div>
                <label className="block text-gray-700 font-medium mb-2">
                  Email
                </label>
                <input
                  type="email"
                  name="email"
                  value={formData.email}
                  onChange={handleChange}
                  className="w-full p-3 border border-gray-300 rounded-md"
                  required
                />
              </div>
              
              <div>
                <label className="block text-gray-700 font-medium mb-2">
                  Profile Image URL
                </label>
                <input
                  type="text"
                  name="profileImage"
                  value={formData.profileImage}
                  onChange={handleChange}
                  className="w-full p-3 border border-gray-300 rounded-md"
                  placeholder="https://example.com/profile.jpg"
                />
              </div>
            </div>
            
            <div className="flex justify-end space-x-3 mt-6">
              <button
                type="button"
                onClick={() => setIsEditing(false)}
                className="px-4 py-2 border border-gray-300 rounded-md text-gray-700"
              >
                Cancel
              </button>
              
              <button
                type="submit"
                disabled={saving}
                className="px-4 py-2 bg-purple-600 text-white rounded-md hover:bg-purple-700 flex items-center"
              >
                {saving ? (
                  <>
                    <FaSpinner className="animate-spin mr-2" />
                    Saving...
                  </>
                ) : (
                  <>
                    <FaSave className="mr-2" />
                    Save Changes
                  </>
                )}
              </button>
            </div>
          </form>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="flex items-center">
              <div className="h-20 w-20 rounded-full bg-gray-200 mr-4 overflow-hidden">
                {user?.profile_image ? (
                  <img
                    src={user.profile_image}
                    alt={user.name}
                    className="h-full w-full object-cover"
                  />
                ) : (
                  <div className="h-full w-full flex items-center justify-center text-gray-500">
                    <FaUser size={32} />
                  </div>
                )}
              </div>
              
              <div>
                <h3 className="font-bold text-lg">{user?.name}</h3>
                <p className="text-gray-600 text-sm">Member since {new Date(user?.created_at || Date.now()).toLocaleDateString()}</p>
              </div>
            </div>
            
            <div>
              <div className="flex items-center mb-2">
                <FaEnvelope className="text-gray-500 mr-2" />
                <span>{user?.email}</span>
              </div>
              
              <div className="flex items-center">
                <FaUser className="text-gray-500 mr-2" />
                <span>{user?.role === 'admin' ? 'Administrator' : 'User'}</span>
              </div>
            </div>
          </div>
        )}
      </div>
      
      {/* Quick links */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        <Link 
          to="/profile/tickets" 
          className="bg-white rounded-lg p-6 shadow-md hover:shadow-lg transition flex items-center"
        >
          <div className="h-12 w-12 rounded-full bg-purple-100 flex items-center justify-center mr-4">
            <FaTicketAlt className="text-purple-600" />
          </div>
          <div>
            <h3 className="font-bold">My Tickets</h3>
            <p className="text-sm text-gray-600">View your event tickets</p>
          </div>
        </Link>
        
        <Link 
          to="/profile/purchases" 
          className="bg-white rounded-lg p-6 shadow-md hover:shadow-lg transition flex items-center"
        >
          <div className="h-12 w-12 rounded-full bg-blue-100 flex items-center justify-center mr-4">
            <FaHistory className="text-blue-600" />
          </div>
          <div>
            <h3 className="font-bold">Purchase History</h3>
            <p className="text-sm text-gray-600">View your past orders</p>
          </div>
        </Link>
        
        <Link 
          to="/profile/payment" 
          className="bg-white rounded-lg p-6 shadow-md hover:shadow-lg transition flex items-center"
        >
          <div className="h-12 w-12 rounded-full bg-green-100 flex items-center justify-center mr-4">
            <FaCreditCard className="text-green-600" />
          </div>
          <div>
            <h3 className="font-bold">Payment Methods</h3>
            <p className="text-sm text-gray-600">Manage payment options</p>
          </div>
        </Link>
        
        <Link 
          to="/profile/security" 
          className="bg-white rounded-lg p-6 shadow-md hover:shadow-lg transition flex items-center"
        >
          <div className="h-12 w-12 rounded-full bg-red-100 flex items-center justify-center mr-4">
            <FaLock className="text-red-600" />
          </div>
          <div>
            <h3 className="font-bold">Security</h3>
            <p className="text-sm text-gray-600">Update password & security</p>
          </div>
        </Link>
      </div>
      
      {/* Placeholder for Future Content */}
      <div className="bg-white rounded-lg p-8 shadow-md text-center">
        <h2 className="text-xl font-bold mb-2">Coming Soon</h2>
        <p className="text-gray-600 mb-4">
          We're working on more features for your profile page. Stay tuned!
        </p>
        <div className="text-purple-600 font-medium">
          <Link to="/">Back to Home</Link>
        </div>
      </div>
    </div>
  );
};

export default UserProfile;