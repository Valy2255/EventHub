// src/pages/admin/AdminLegalDocuments.jsx
import { useState, useEffect } from 'react';
import { FaPlus, FaEdit, FaTrash, FaSpinner, FaCheck } from 'react-icons/fa';
import { Tab } from '@headlessui/react';
import api from '../../services/api';
import AdminLegalDocumentForm from './AdminLegalDocumentForm';
import { format } from 'date-fns';

const AdminLegalDocuments = () => {
  const [privacyPolicyVersions, setPrivacyPolicyVersions] = useState([]);
  const [termsVersions, setTermsVersions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [currentDocument, setCurrentDocument] = useState(null);
  const [currentDocumentType, setCurrentDocumentType] = useState(null);
  const [deleteConfirm, setDeleteConfirm] = useState(null);
  const [activateConfirm, setActivateConfirm] = useState(null);
  
  // Add state for selected tab
  const [selectedTabIndex, setSelectedTabIndex] = useState(0);

  // Fetch documents on component mount
  useEffect(() => {
    fetchDocuments();
  }, []);

  const fetchDocuments = async () => {
    try {
      setLoading(true);
      setError(null);
      
      // Fetch privacy policy versions
      const privacyResponse = await api.get('/admin/legal/privacy_policy/versions');
      
      setPrivacyPolicyVersions(privacyResponse.data.documents);
      
      // Fetch terms & conditions versions
      const termsResponse = await api.get('/admin/legal/terms_conditions/versions');
      setTermsVersions(termsResponse.data.documents);
      
      setLoading(false);
    } catch (err) {
      console.error('Error fetching legal documents:', err);
      setError('Failed to load legal documents. Please try again.');
      setLoading(false);
    }
  };

  const handleEdit = (document) => {
    setCurrentDocument(document);
    setCurrentDocumentType(document.document_type);
    
    // Set the correct tab based on document type
    if (document.document_type === 'terms_conditions') {
      setSelectedTabIndex(1);
    } else {
      setSelectedTabIndex(0);
    }
    
    setIsFormOpen(true);
  };

  const handleAdd = (documentType) => {
    setCurrentDocument(null);
    setCurrentDocumentType(documentType);
    
    // Set the correct tab based on document type
    if (documentType === 'terms_conditions') {
      setSelectedTabIndex(1);
    } else {
      setSelectedTabIndex(0);
    }
    
    setIsFormOpen(true);
  };

  const handleFormClose = () => {
    setIsFormOpen(false);
    setCurrentDocument(null);
    setCurrentDocumentType(null);
  };

  const handleDeleteConfirm = (id) => {
    setDeleteConfirm(id);
  };

  const handleActivateConfirm = (id) => {
    setActivateConfirm(id);
  };

  const handleDelete = async (id) => {
    try {
      await api.delete(`/admin/legal/${id}`);
      fetchDocuments();
      setDeleteConfirm(null);
    } catch (err) {
      console.error('Error deleting document:', err);
      alert(`Failed to delete document: ${err.response?.data?.message || err.message}`);
    }
  };

  const handleActivate = async (id) => {
    try {
      await api.put(`/admin/legal/${id}`, { is_active: true });
      fetchDocuments();
      setActivateConfirm(null);
    } catch (err) {
      console.error('Error activating document:', err);
      alert(`Failed to activate document: ${err.response?.data?.message || err.message}`);
    }
  };

  const handleFormSubmit = async (formData) => {
    try {
      if (currentDocument) {
        // Update existing document
        await api.put(`/admin/legal/${currentDocument.id}`, formData);
      } else {
        // Create new document version
        await api.post('/admin/legal', formData);
      }
      // Refresh the documents list
      fetchDocuments();
      handleFormClose();
    } catch (err) {
      console.error('Error saving document:', err);
      alert(`Failed to save document: ${err.response?.data?.message || err.message}`);
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <FaSpinner className="animate-spin text-purple-600 text-4xl" />
        <span className="ml-3 text-xl text-gray-600">Loading documents...</span>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-100 text-red-700 p-4 rounded-lg">
        <p>{error}</p>
        <button 
          className="mt-2 bg-red-600 text-white px-4 py-2 rounded hover:bg-red-700"
          onClick={fetchDocuments}
        >
          Retry
        </button>
      </div>
    );
  }

  const renderDocumentTable = (documents) => {
    if (documents.length === 0) {
      return (
        <div className="text-center py-10 text-gray-500">
          No document versions found.
        </div>
      );
    }

    return (
      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Version
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Title
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Published
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Status
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Actions
              </th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {documents.map((doc) => (
              <tr key={doc.id} className={doc.is_active ? 'bg-green-50' : 'hover:bg-gray-50'}>
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="text-sm font-medium text-gray-900">
                    {doc.version}
                  </div>
                </td>
                <td className="px-6 py-4">
                  <div className="text-sm text-gray-900">
                    {doc.title}
                  </div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="text-sm text-gray-500">
                    {format(new Date(doc.published_at), 'MMM d, yyyy')}
                  </div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  {doc.is_active ? (
                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                      <FaCheck className="mr-1" /> Active
                    </span>
                  ) : (
                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800">
                      Archive
                    </span>
                  )}
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="flex space-x-2">
                    <button
                      onClick={() => handleEdit(doc)}
                      className="text-indigo-600 hover:text-indigo-900"
                      title="Edit"
                    >
                      <FaEdit />
                    </button>
                    
                    {!doc.is_active && (
                      activateConfirm === doc.id ? (
                        <div className="flex items-center space-x-2">
                          <button
                            onClick={() => handleActivate(doc.id)}
                            className="text-green-600 hover:text-green-900 text-xs"
                          >
                            Confirm
                          </button>
                          <button
                            onClick={() => setActivateConfirm(null)}
                            className="text-gray-600 hover:text-gray-900 text-xs"
                          >
                            Cancel
                          </button>
                        </div>
                      ) : (
                        <button
                          onClick={() => handleActivateConfirm(doc.id)}
                          className="text-green-600 hover:text-green-900"
                          title="Make Active"
                        >
                          <FaCheck />
                        </button>
                      )
                    )}
                    
                    {!doc.is_active && (
                      deleteConfirm === doc.id ? (
                        <div className="flex items-center space-x-2">
                          <button
                            onClick={() => handleDelete(doc.id)}
                            className="text-red-600 hover:text-red-900 text-xs"
                          >
                            Confirm
                          </button>
                          <button
                            onClick={() => setDeleteConfirm(null)}
                            className="text-gray-600 hover:text-gray-900 text-xs"
                          >
                            Cancel
                          </button>
                        </div>
                      ) : (
                        <button
                          onClick={() => handleDeleteConfirm(doc.id)}
                          className="text-red-600 hover:text-red-900"
                          title="Delete"
                        >
                          <FaTrash />
                        </button>
                      )
                    )}
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    );
  };

  return (
    <div className="bg-white rounded-lg shadow-md p-6">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-800">Manage Legal Documents</h1>
        <p className="text-gray-600 mt-2">
          Create and manage versions of your Privacy Policy and Terms & Conditions.
        </p>
      </div>

      <Tab.Group selectedIndex={selectedTabIndex} onChange={setSelectedTabIndex}>
        <Tab.List className="flex p-1 space-x-1 bg-purple-100 rounded-xl mb-6">
          <Tab
            className={({ selected }) =>
              `w-full py-2.5 text-sm font-medium text-purple-800 rounded-lg focus:outline-none ${
                selected ? 'bg-white shadow' : 'hover:bg-purple-200'
              }`
            }
          >
            Privacy Policy
          </Tab>
          <Tab
            className={({ selected }) =>
              `w-full py-2.5 text-sm font-medium text-purple-800 rounded-lg focus:outline-none ${
                selected ? 'bg-white shadow' : 'hover:bg-purple-200'
              }`
            }
          >
            Terms & Conditions
          </Tab>
        </Tab.List>
        
        <Tab.Panels>
          <Tab.Panel>
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-semibold text-gray-800">Privacy Policy Versions</h2>
              <button
                onClick={() => handleAdd('privacy_policy')}
                className="bg-purple-600 hover:bg-purple-700 text-white px-4 py-2 rounded-lg flex items-center"
              >
                <FaPlus className="mr-2" /> Create New Version
              </button>
            </div>
            {renderDocumentTable(privacyPolicyVersions)}
          </Tab.Panel>
          
          <Tab.Panel>
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-semibold text-gray-800">Terms & Conditions Versions</h2>
              <button
                onClick={() => handleAdd('terms_conditions')}
                className="bg-purple-600 hover:bg-purple-700 text-white px-4 py-2 rounded-lg flex items-center"
              >
                <FaPlus className="mr-2" /> Create New Version
              </button>
            </div>
            {renderDocumentTable(termsVersions)}
          </Tab.Panel>
        </Tab.Panels>
      </Tab.Group>

      {/* Document Form Modal */}
      {isFormOpen && (
        <AdminLegalDocumentForm
          document={currentDocument}
          documentType={currentDocumentType}
          onClose={handleFormClose}
          onSubmit={handleFormSubmit}
        />
      )}
    </div>
  );
};

export default AdminLegalDocuments;