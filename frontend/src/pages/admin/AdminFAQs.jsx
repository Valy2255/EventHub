// src/pages/admin/AdminFAQs.jsx
import { useState, useEffect } from 'react';
import { FaPlus, FaEdit, FaTrash, FaArrowUp, FaArrowDown, FaSpinner } from 'react-icons/fa';
import api from '../../services/api';
import AdminFAQForm from './AdminFAQForm';

const AdminFAQs = () => {
  const [faqs, setFaqs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [currentFaq, setCurrentFaq] = useState(null);
  const [deleteConfirm, setDeleteConfirm] = useState(null);
  const [reordering, setReordering] = useState(false);

  // Fetch all FAQs on component mount
  useEffect(() => {
    fetchFAQs();
  }, []);

  const fetchFAQs = async () => {
    try {
      setLoading(true);
      const response = await api.get('faqs');
      setFaqs(response.data.faqs);
      setLoading(false);
    } catch (err) {
      console.error('Error fetching FAQs:', err);
      setError('Failed to load FAQs. Please try again.');
      setLoading(false);
    }
  };

  const handleEdit = (faq) => {
    setCurrentFaq(faq);
    setIsFormOpen(true);
  };

  const handleAdd = () => {
    setCurrentFaq(null);
    setIsFormOpen(true);
  };

  const handleFormClose = () => {
    setIsFormOpen(false);
    setCurrentFaq(null);
  };

  const handleDeleteConfirm = (id) => {
    setDeleteConfirm(id);
  };

  const handleDelete = async (id) => {
    try {
      await api.delete(`/admin/faqs/${id}`);
      setFaqs(faqs.filter(faq => faq.id !== id));
      setDeleteConfirm(null);
    } catch (err) {
      console.error('Error deleting FAQ:', err);
      alert('Failed to delete FAQ. Please try again.');
    }
  };

  const handleFormSubmit = async (formData) => {
    try {
      if (currentFaq) {
        // Update existing FAQ
        await api.put(`/admin/faqs/${currentFaq.id}`, formData);
      } else {
        // Create new FAQ
        await api.post('admin/faqs', formData);
      }
      // Refresh the FAQ list
      fetchFAQs();
      handleFormClose();
    } catch (err) {
      console.error('Error saving FAQ:', err);
      alert('Failed to save FAQ. Please try again.');
    }
  };

  // Replace the moveItem function in AdminFAQs.jsx with this fixed version
// in your React AdminFAQs.jsx → moveItem
const moveItem = async (id, direction) => {
    const index = faqs.findIndex(faq => faq.id === id);
    if ((direction === 'up' && index === 0) ||
        (direction === 'down' && index === faqs.length - 1)) {
      return;
    }
  
    const newIndex = direction === 'up' ? index - 1 : index + 1;
    const newFaqs = [...faqs];
    [newFaqs[index], newFaqs[newIndex]] =
      [newFaqs[newIndex], newFaqs[index]];
  
    // recalc display_order based on new positions:
    const orderData = newFaqs.map((faq, idx) => ({
      id: faq.id,
      display_order: idx + 1,
    }));
  
    setFaqs(newFaqs);
    setReordering(true);
  
    try {
      console.log('Sending orderData →', orderData);
      await api.post('admin/faqs/order', { order: orderData });
    } catch (err) {
      console.error('Error reordering FAQs:', err.response?.data || err);
      alert(`Failed to update FAQ order: ${err.response?.data?.message || err.message}`);
      fetchFAQs();
    } finally {
      setReordering(false);
    }
  };
  

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <FaSpinner className="animate-spin text-purple-600 text-4xl" />
        <span className="ml-3 text-xl text-gray-600">Loading FAQs...</span>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-100 text-red-700 p-4 rounded-lg">
        <p>{error}</p>
        <button 
          className="mt-2 bg-red-600 text-white px-4 py-2 rounded hover:bg-red-700"
          onClick={fetchFAQs}
        >
          Retry
        </button>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg shadow-md p-6">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold text-gray-800">Manage FAQs</h1>
        <button
          onClick={handleAdd}
          className="bg-purple-600 hover:bg-purple-700 text-white px-4 py-2 rounded-lg flex items-center"
        >
          <FaPlus className="mr-2" /> Add New FAQ
        </button>
      </div>

      {/* FAQ List */}
      {faqs.length === 0 ? (
        <div className="text-center py-10 text-gray-500">
          No FAQs found. Click the button above to add your first FAQ.
        </div>
      ) : (
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider w-12">
                  Order
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Question
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Answer Preview
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider w-32">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {faqs.map((faq, index) => (
                <tr key={faq.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center space-x-1">
                      <button
                        onClick={() => moveItem(faq.id, 'up')}
                        disabled={index === 0 || reordering}
                        className={`p-1 rounded ${
                          index === 0 || reordering ? 'text-gray-300 cursor-not-allowed' : 'text-gray-600 hover:bg-gray-200'
                        }`}
                      >
                        <FaArrowUp />
                      </button>
                      <button
                        onClick={() => moveItem(faq.id, 'down')}
                        disabled={index === faqs.length - 1 || reordering}
                        className={`p-1 rounded ${
                          index === faqs.length - 1 || reordering ? 'text-gray-300 cursor-not-allowed' : 'text-gray-600 hover:bg-gray-200'
                        }`}
                      >
                        <FaArrowDown />
                      </button>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="text-sm font-medium text-gray-900">
                      {faq.question}
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="text-sm text-gray-500 truncate max-w-md">
                      {faq.answer}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                    <div className="flex space-x-2 justify-end">
                      <button
                        onClick={() => handleEdit(faq)}
                        className="text-indigo-600 hover:text-indigo-900"
                      >
                        <FaEdit />
                      </button>
                      {deleteConfirm === faq.id ? (
                        <div className="flex items-center space-x-2">
                          <button
                            onClick={() => handleDelete(faq.id)}
                            className="text-red-600 hover:text-red-900"
                          >
                            Confirm
                          </button>
                          <button
                            onClick={() => setDeleteConfirm(null)}
                            className="text-gray-600 hover:text-gray-900"
                          >
                            Cancel
                          </button>
                        </div>
                      ) : (
                        <button
                          onClick={() => handleDeleteConfirm(faq.id)}
                          className="text-red-600 hover:text-red-900"
                        >
                          <FaTrash />
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* FAQ Form Modal */}
      {isFormOpen && (
        <AdminFAQForm
          faq={currentFaq}
          onClose={handleFormClose}
          onSubmit={handleFormSubmit}
        />
      )}
    </div>
  );
};

export default AdminFAQs;