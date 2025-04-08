// src/pages/admin/AdminUsers.jsx
import { useState, useEffect } from 'react';
import { 
  FaSpinner, 
  FaEdit, 
  FaTrash, 
  FaCheckCircle, 
  FaTimesCircle,
  FaSearch,
  FaUserShield,
  FaUser,
  FaExclamationTriangle,
  FaSync
} from 'react-icons/fa';
import api from '../../services/api';
import { useAuth } from '../../hooks/useAuth';

const AdminUsers = () => {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);
  const [editingUser, setEditingUser] = useState(null);
  const [search, setSearch] = useState('');
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [userToDelete, setUserToDelete] = useState(null);
  
  const { user: currentUser } = useAuth();

  useEffect(() => {
    fetchUsers();
  }, []);

  const fetchUsers = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const response = await api.get('/admin/users');
      setUsers(response.data.users || []);
    } catch (err) {
      console.error('Error fetching users:', err);
      setError('Could not load users. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleRoleChange = async (userId, newRole) => {
    if (userId === currentUser.id) {
      setError("You cannot change your own role.");
      setTimeout(() => setError(null), 3000);
      return;
    }
    
    try {
      setEditingUser(userId);
      setError(null);
      setSuccess(null);
      
      const response = await api.put(`/admin/users/${userId}/role`, { role: newRole });
      
      // Update user in the list
      setUsers(users.map(user => 
        user.id === userId ? { ...user, role: response.data.user.role } : user
      ));
      
      setSuccess(`User role updated to ${newRole}`);
      setTimeout(() => setSuccess(null), 3000);
    } catch (err) {
      console.error('Error updating user role:', err);
      setError('Failed to update user role. Please try again.');
    } finally {
      setEditingUser(null);
    }
  };

  const openDeleteModal = (user) => {
    if (user.id === currentUser.id) {
      setError("You cannot delete your own account.");
      setTimeout(() => setError(null), 3000);
      return;
    }
    setUserToDelete(user);
    setShowDeleteModal(true);
  };

  const handleDeleteUser = async () => {
    if (!userToDelete) return;
    
    try {
      setLoading(true);
      setError(null);
      setSuccess(null);
      
      await api.delete(`/admin/users/${userToDelete.id}`);
      
      // Remove user from the list
      setUsers(users.filter(user => user.id !== userToDelete.id));
      
      setSuccess('User deleted successfully');
      setShowDeleteModal(false);
      setTimeout(() => setSuccess(null), 3000);
    } catch (err) {
      console.error('Error deleting user:', err);
      setError('Failed to delete user. Please try again.');
    } finally {
      setLoading(false);
      setUserToDelete(null);
    }
  };

  // Filter users based on search query
  const filteredUsers = users.filter(user =>
    user.name.toLowerCase().includes(search.toLowerCase()) ||
    user.email.toLowerCase().includes(search.toLowerCase())
  );

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString();
  };

  if (loading && users.length === 0) {
    return (
      <div className="flex justify-center items-center h-96">
        <FaSpinner className="animate-spin text-purple-600 text-4xl" />
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">User Management</h1>
        <button 
          onClick={fetchUsers}
          className="bg-purple-600 text-white px-3 py-2 rounded-md flex items-center"
        >
          <FaSync className="mr-2" /> Refresh
        </button>
      </div>

      {error && (
        <div className="bg-red-100 text-red-800 p-4 rounded-md mb-6">
          <div className="flex items-start">
            <FaExclamationTriangle className="mt-1 mr-2" />
            <span>{error}</span>
          </div>
        </div>
      )}

      {success && (
        <div className="bg-green-100 text-green-800 p-4 rounded-md mb-6">
          <div className="flex items-start">
            <FaCheckCircle className="mt-1 mr-2" />
            <span>{success}</span>
          </div>
        </div>
      )}

      {/* Search */}
      <div className="mb-6 relative">
        <div className="relative">
          <input
            type="text"
            placeholder="Search users by name or email..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-10 pr-4 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500"
          />
          <FaSearch className="absolute left-3 top-3 text-gray-400" />
        </div>
      </div>

      {/* Users table */}
      <div className="bg-white rounded-md shadow overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                User
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Email
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Role
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Created At
              </th>
              <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                Actions
              </th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {filteredUsers.map((user) => (
              <tr key={user.id} className={user.id === currentUser.id ? 'bg-purple-50' : ''}>
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="flex items-center">
                    <div className="flex-shrink-0 h-10 w-10">
                      {user.profile_image ? (
                        <img 
                          className="h-10 w-10 rounded-full" 
                          src={user.profile_image} 
                          alt={user.name} 
                        />
                      ) : (
                        <div className="h-10 w-10 rounded-full bg-purple-200 flex items-center justify-center">
                          <span className="text-purple-600 font-medium">{user.name.charAt(0).toUpperCase()}</span>
                        </div>
                      )}
                    </div>
                    <div className="ml-4">
                      <div className="text-sm font-medium text-gray-900">
                        {user.name}
                      </div>
                      {user.id === currentUser.id && (
                        <span className="text-xs text-purple-600">(You)</span>
                      )}
                    </div>
                  </div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="text-sm text-gray-900">{user.email}</div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <span className={`px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${
                    user.role === 'admin' 
                      ? 'bg-purple-100 text-purple-800' 
                      : 'bg-gray-100 text-gray-800'
                  }`}>
                    {user.role === 'admin' ? (
                      <><FaUserShield className="mr-1" /> Admin</>
                    ) : (
                      <><FaUser className="mr-1" /> User</>
                    )}
                  </span>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                  {formatDate(user.created_at)}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                  <div className="flex justify-end space-x-2">
                    {user.id !== currentUser.id && (
                      <>
                        {user.role === 'user' ? (
                          <button
                            onClick={() => handleRoleChange(user.id, 'admin')}
                            disabled={editingUser === user.id}
                            className="text-purple-600 hover:text-purple-900"
                            title="Make Admin"
                          >
                            {editingUser === user.id ? <FaSpinner className="animate-spin" /> : <FaUserShield />}
                          </button>
                        ) : (
                          <button
                            onClick={() => handleRoleChange(user.id, 'user')}
                            disabled={editingUser === user.id}
                            className="text-gray-600 hover:text-gray-900"
                            title="Make Regular User"
                          >
                            {editingUser === user.id ? <FaSpinner className="animate-spin" /> : <FaUser />}
                          </button>
                        )}
                        <button
                          onClick={() => openDeleteModal(user)}
                          className="text-red-600 hover:text-red-900"
                          title="Delete User"
                        >
                          <FaTrash />
                        </button>
                      </>
                    )}
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Delete Confirmation Modal */}
      {showDeleteModal && userToDelete && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg max-w-md w-full p-6">
            <h3 className="text-lg font-medium text-gray-900 mb-4">Confirm User Deletion</h3>
            <p className="text-sm text-gray-500 mb-4">
              Are you sure you want to delete <span className="font-medium">{userToDelete.name}</span> ({userToDelete.email})? This action cannot be undone.
            </p>
            <div className="flex justify-end space-x-3">
              <button
                onClick={() => setShowDeleteModal(false)}
                className="bg-gray-200 hover:bg-gray-300 px-4 py-2 rounded-md text-sm font-medium"
              >
                Cancel
              </button>
              <button
                onClick={handleDeleteUser}
                className="bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-md text-sm font-medium"
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminUsers;