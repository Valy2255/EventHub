// src/pages/admin/AdminRefunds.jsx
import { useState, useEffect } from "react";
import {
  FaCheck,
  FaSpinner,
  FaTimes,
  FaExclamationTriangle,
  FaInfoCircle,
  FaSearch,
  FaSync,
  FaClock,
  FaBan,
  FaRunning,
  FaCogs
} from "react-icons/fa";
import api from "../../services/api";

const AdminRefunds = () => {
  const [refunds, setRefunds] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [updating, setUpdating] = useState(null);
  const [updateSuccess, setUpdateSuccess] = useState(null);
  const [filterStatus, setFilterStatus] = useState("all");
  const [search, setSearch] = useState("");
  const [processingRefunds, setProcessingRefunds] = useState(false);
  const [showProcessingModal, setShowProcessingModal] = useState(false);
  const [daysThreshold, setDaysThreshold] = useState(5);

  useEffect(() => {
    fetchRefunds();
  }, []);

  const fetchRefunds = async () => {
    try {
      setLoading(true);
      setError(null);

      const response = await api.get("/admin/refunds");
      setRefunds(response.data.data || []);
    } catch (err) {
      console.error("Error fetching refunds:", err);
      setError("Could not load refund requests. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateStatus = async (ticketId, newStatus) => {
    try {
      setUpdating(ticketId);
      setUpdateSuccess(null);

      await api.put(`/admin/refunds/${ticketId}`, { status: newStatus });

      // Update refund in the list
      setRefunds((prevRefunds) =>
        prevRefunds.map((refund) =>
          refund.id === ticketId
            ? { ...refund, refund_status: newStatus }
            : refund
        )
      );

      setUpdateSuccess(`Refund status updated to ${newStatus}`);

      // Clear success message after 3 seconds
      setTimeout(() => {
        setUpdateSuccess(null);
      }, 3000);
    } catch (err) {
      console.error("Error updating refund status:", err);
      setError("Failed to update refund status. Please try again.");
    } finally {
      setUpdating(null);
    }
  };

  const handleProcessRefunds = async () => {
    try {
      setProcessingRefunds(true);
      setError(null);
      setUpdateSuccess(null);

      const response = await api.post('/admin/refunds/process', { 
        daysThreshold: parseInt(daysThreshold, 10) 
      });

      setShowProcessingModal(false);
      
      if (response.data.count > 0) {
        setUpdateSuccess(`Successfully processed ${response.data.count} pending refunds`);
        // Refresh the refunds list to show updated statuses
        fetchRefunds();
      } else {
        setUpdateSuccess('No pending refunds needed processing');
      }

      // Clear success message after 5 seconds
      setTimeout(() => {
        setUpdateSuccess(null);
      }, 5000);
    } catch (err) {
      console.error('Error processing refunds:', err);
      setError('Failed to process refunds. Please try again.');
    } finally {
      setProcessingRefunds(false);
    }
  };

  const formatDate = (dateString) => {
    if (!dateString) return "N/A";
    return new Date(dateString).toLocaleString();
  };

  const formatPrice = (price) => {
    return parseFloat(price).toFixed(2);
  };

  const calculateDaysInProcessing = (cancelledAt) => {
    if (!cancelledAt) return 0;
    const cancelDate = new Date(cancelledAt);
    const today = new Date();
    const differenceInTime = today - cancelDate;
    return Math.floor(differenceInTime / (1000 * 3600 * 24));
  };

  // Filter and search functionality
  const filteredRefunds = refunds.filter((refund) => {
    const refundStatus = refund.refund_status || "requested";
    const matchesStatus =
      filterStatus === "all" || refundStatus === filterStatus;
    const matchesSearch =
      search === "" ||
      refund.user_name?.toLowerCase().includes(search.toLowerCase()) ||
      refund.event_name?.toLowerCase().includes(search.toLowerCase()) ||
      refund.id?.toString().includes(search);

    return matchesStatus && matchesSearch;
  });

  if (loading && refunds.length === 0) {
    return (
      <div className="flex justify-center items-center h-96">
        <FaSpinner className="animate-spin text-purple-600 text-4xl" />
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">Refund Management</h1>
        <div className="flex space-x-2">
          <button
            onClick={() => setShowProcessingModal(true)}
            className="bg-blue-600 text-white px-3 py-2 rounded-md flex items-center hover:bg-blue-700"
          >
            <FaCogs className="mr-2" /> Process Pending Refunds
          </button>
          <button
            onClick={fetchRefunds}
            className="bg-purple-600 text-white px-3 py-2 rounded-md flex items-center hover:bg-purple-700"
          >
            <FaSync className="mr-2" /> Refresh
          </button>
        </div>
      </div>

      {error && (
        <div className="bg-red-100 text-red-800 p-4 rounded-md mb-6">
          <div className="flex items-start">
            <FaExclamationTriangle className="mt-1 mr-2" />
            <span>{error}</span>
          </div>
        </div>
      )}

      {updateSuccess && (
        <div className="bg-green-100 text-green-800 p-4 rounded-md mb-6">
          <div className="flex items-start">
            <FaCheck className="mt-1 mr-2" />
            <span>{updateSuccess}</span>
          </div>
        </div>
      )}

      <div className="mb-6 bg-gray-50 p-4 rounded-md shadow-sm">
        <div className="flex flex-wrap items-center gap-4">
          <div className="flex-1">
            <div className="relative">
              <input
                type="text"
                placeholder="Search by user, event or ticket ID..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500"
              />
              <FaSearch className="absolute left-3 top-3 text-gray-400" />
            </div>
          </div>

          <div>
            <select
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value)}
              className="border rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-purple-500"
            >
              <option value="all">All Statuses</option>
              <option value="requested">Requested</option>
              <option value="processing">Processing</option>
              <option value="completed">Completed</option>
              <option value="failed">Failed</option>
              <option value="denied">Denied</option>
            </select>
          </div>
        </div>
      </div>

      {filteredRefunds.length === 0 ? (
        <div className="text-center py-12 bg-white rounded-md shadow">
          <FaInfoCircle className="mx-auto text-gray-400 text-4xl mb-4" />
          <h3 className="text-lg font-medium text-gray-700">
            No refund requests found
          </h3>
          <p className="text-gray-500 mt-2">
            {search || filterStatus !== "all"
              ? "Try changing your search or filter criteria"
              : "There are no refund requests at this time"}
          </p>
        </div>
      ) : (
        <div className="bg-white rounded-md shadow overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Ticket ID
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  User
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Event
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Price
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Cancelled At
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
              {filteredRefunds.map((refund) => {
                const refundStatus = refund.refund_status || "requested";
                const daysInProcessing =
                  refundStatus === "processing"
                    ? calculateDaysInProcessing(refund.cancelled_at)
                    : null;

                return (
                  <tr key={refund.id}>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-medium text-gray-900">
                        #{refund.id}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-medium text-gray-900">
                        {refund.user_name}
                      </div>
                      <div className="text-sm text-gray-500">
                        {refund.user_email}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900">
                        {refund.event_name}
                      </div>
                      <div className="text-sm text-gray-500">
                        {refund.ticket_type_name}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900">
                        ${formatPrice(refund.price)}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-500">
                        {formatDate(refund.cancelled_at)}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <span
                          className={`px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full 
                          ${
                            refundStatus === "completed"
                              ? "bg-green-100 text-green-800"
                              : refundStatus === "processing"
                              ? "bg-blue-100 text-blue-800"
                              : refundStatus === "failed"
                              ? "bg-red-100 text-red-800"
                              : refundStatus === "denied"
                              ? "bg-gray-100 text-gray-800"
                              : "bg-yellow-100 text-yellow-800"
                          }`}
                        >
                          {refundStatus}
                        </span>
                        {refundStatus === "processing" && (
                          <span className="ml-2 text-xs text-gray-500 flex items-center">
                            <FaClock className="mr-1" />
                            {daysInProcessing} day
                            {daysInProcessing !== 1 ? "s" : ""}
                            {daysInProcessing >= 5 &&
                              " (auto-complete pending)"}
                          </span>
                        )}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      <div className="flex space-x-2">
                        {(refundStatus === "requested" ||
                          refundStatus === null) && (
                          <>
                            <button
                              onClick={() =>
                                handleUpdateStatus(refund.id, "processing")
                              }
                              disabled={updating === refund.id}
                              className="text-blue-600 hover:text-blue-800 tooltip"
                              title="Mark as Processing"
                            >
                              {updating === refund.id ? (
                                <FaSpinner className="animate-spin" />
                              ) : (
                                <FaSync />
                              )}
                            </button>
                            <button
                              onClick={() =>
                                handleUpdateStatus(refund.id, "completed")
                              }
                              disabled={updating === refund.id}
                              className="text-green-600 hover:text-green-800 tooltip"
                              title="Mark as Completed"
                            >
                              <FaCheck />
                            </button>
                            <button
                              onClick={() =>
                                handleUpdateStatus(refund.id, "denied")
                              }
                              disabled={updating === refund.id}
                              className="text-red-600 hover:text-red-800 tooltip"
                              title="Deny Refund"
                            >
                              <FaBan />
                            </button>
                          </>
                        )}

                        {refundStatus === "processing" && (
                          <>
                            <button
                              onClick={() =>
                                handleUpdateStatus(refund.id, "completed")
                              }
                              disabled={updating === refund.id}
                              className="text-green-600 hover:text-green-800 tooltip"
                              title="Mark as Completed"
                            >
                              <FaCheck />
                            </button>
                            <button
                              onClick={() =>
                                handleUpdateStatus(refund.id, "failed")
                              }
                              disabled={updating === refund.id}
                              className="text-red-600 hover:text-red-800 tooltip"
                              title="Mark as Failed"
                            >
                              <FaTimes />
                            </button>
                          </>
                        )}

                        {(refundStatus === "completed" ||
                          refundStatus === "failed" ||
                          refundStatus === "denied") && (
                          <span className="text-gray-400 italic text-xs">
                            No actions available
                          </span>
                        )}
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      {/* Process Refunds Modal */}
      {showProcessingModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg max-w-md w-full p-6">
            <h3 className="text-lg font-medium text-gray-900 mb-4">Process Pending Refunds</h3>
            <p className="text-gray-600 mb-4">
              This will automatically mark refunds that have been in "processing" status for longer than the specified number of days as "completed".
            </p>
            
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Days Threshold
              </label>
              <input
                type="number"
                min="1"
                max="30"
                value={daysThreshold}
                onChange={(e) => setDaysThreshold(e.target.value)}
                className="w-full border rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-purple-500"
              />
              <p className="mt-1 text-xs text-gray-500">
                Refunds in "processing" status for this many days will be automatically completed
              </p>
            </div>
            
            <div className="flex justify-end space-x-3 mt-6">
              <button
                onClick={() => setShowProcessingModal(false)}
                className="bg-gray-200 hover:bg-gray-300 px-4 py-2 rounded-md text-sm font-medium"
                disabled={processingRefunds}
              >
                Cancel
              </button>
              <button
                onClick={handleProcessRefunds}
                className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-md text-sm font-medium flex items-center"
                disabled={processingRefunds}
              >
                {processingRefunds ? (
                  <>
                    <FaSpinner className="animate-spin mr-2" />
                    Processing...
                  </>
                ) : (
                  <>
                    <FaRunning className="mr-2" />
                    Process Refunds
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminRefunds;