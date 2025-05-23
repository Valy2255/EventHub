// src/pages/admin/TicketCheckIn.jsx
import { useState, useEffect, useCallback, useRef } from "react";
import { Html5QrcodeScanner } from "html5-qrcode";
import {
  FaTicketAlt,
  FaQrcode,
  FaCheckCircle,
  FaTimesCircle,
  FaSpinner,
  FaUserCheck,
  FaCalendarAlt,
  FaMapMarkerAlt,
  FaClock,
  FaIdCard,
  FaExclamationTriangle,
  FaSyncAlt,
  FaInfoCircle,
  FaUsers,
} from "react-icons/fa";
import api from "../../services/api";

const TicketCheckIn = () => {
  const [isScanning, setIsScanning] = useState(false);
  const [scannerInitialized, setScannerInitialized] = useState(false);
  const [ticketResult, setTicketResult] = useState(null);
  const [loading, setLoading] = useState(false);
  const [checkingIn, setCheckingIn] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);
  const [eventStats, setEventStats] = useState(null);
  const [currentEventId, setCurrentEventId] = useState(null);
  const [manualInput, setManualInput] = useState("");
  const [recentCheckIns, setRecentCheckIns] = useState([]);

  // Use the proper React useRef hook instead of a plain object
  const qrcodeScannerRef = useRef(null);

  // Validate ticket via API call - using useCallback to memoize the function
  const validateTicketQR = useCallback(async (qrCodeData) => {
    try {
      setLoading(true);
      setError(null);
      setTicketResult(null);

      // Send the QR data to the API
      const apiResponse = await api.post("/admin/check-in/validate", {
        qrData: qrCodeData,
      });

      setTicketResult(apiResponse.data.data);

      // If we have an event ID, fetch stats for that event
      if (
        apiResponse.data.data.ticket &&
        apiResponse.data.data.ticket.event_id
      ) {
        const eventId = apiResponse.data.data.ticket.event_id;
        setCurrentEventId(eventId);
        fetchEventStats(eventId);
      }
    } catch (apiError) {
      console.error("Error validating ticket:", apiError);

      // Special handling for already checked-in tickets
      if (
        apiError.response?.status === 400 &&
        (apiError.response?.data?.error?.includes("already") ||
          apiError.response?.data?.error?.includes("used"))
      ) {
        // Instead of showing an error, show a notification that automatically clears
        setSuccess(
          "This ticket has already been checked in. Ready for next scan."
        );

        // Automatically reset scanner after 2 seconds
        setTimeout(() => {
          resetScannerState();
          // Resume scanner
          if (qrcodeScannerRef.current && isScanning) {
            try {
              qrcodeScannerRef.current.resume();
            } catch (resumeError) {
              console.error("Error resuming scanner:", resumeError);
            }
          }
        }, 2000);
      } else {
        // Handle other errors normally
        setError(apiError.response?.data?.error || "Failed to validate ticket");
      }

      setTicketResult(null);
    } finally {
      setLoading(false);
    }
  }, [fetchEventStats, isScanning, resetScannerState]);

  // Fetch event check-in statistics
  const fetchEventStats = useCallback(async (eventId) => {
    try {
      const statsResponse = await api.get(`/admin/check-in/stats/${eventId}`);
      setEventStats(statsResponse.data.data.stats);
      setRecentCheckIns(statsResponse.data.data.recentCheckIns || []);
    } catch (statsError) {
      console.error("Error fetching event stats:", statsError);
    }
  }, []);

  const toggleScanner = () => {
    // Clear any existing errors when changing scanner state
    setError(null);
    setIsScanning((prev) => !prev);
  };

  // Initialize QR scanner
  useEffect(() => {
    // Make sure the element exists before initializing the scanner
    const qrReaderElement = document.getElementById("qr-reader");

    if (isScanning && !scannerInitialized && qrReaderElement) {
      try {
        // Create scanner with specific render options
        qrcodeScannerRef.current = new Html5QrcodeScanner(
          "qr-reader",
          {
            fps: 10,
            qrbox: { width: 250, height: 250 },
            rememberLastUsedCamera: true,
            aspectRatio: 1,

            showTorchButtonIfSupported: true,
            showZoomSliderIfSupported: true,
          },
          /* verbose= */ false
        );

        // Callback when QR is successfully scanned
        const onScanSuccess = async (decodedText) => {
          console.log(`QR Code detected: ${decodedText}`);

          try {
            // Always stop the scanner completely after a successful scan
            if (qrcodeScannerRef.current) {
              qrcodeScannerRef.current.pause();
            }
            await validateTicketQR(decodedText);
          } catch (scanError) {
            console.error("Error processing QR code:", scanError);
            // Only resume if there's an error
            if (qrcodeScannerRef.current) {
              qrcodeScannerRef.current.resume();
            }
          }
        };

        // Callback for errors
        const onScanFailure = () => {
          // We're going to completely silence these errors
          // The Html5QrcodeScanner throws these constantly when not finding a QR code
          // This is normal behavior and shouldn't be logged as errors
          // Uncomment this only for debugging specific scanner issues
          // console.log("Scanner status:", error?.name || "scanning");
        };

        qrcodeScannerRef.current.render(onScanSuccess, onScanFailure);
        setScannerInitialized(true);
      } catch (error) {
        console.error("Error initializing QR scanner:", error);
        setError(
          "Failed to initialize scanner. Please check your camera permissions."
        );
        setIsScanning(false);
      }
    }

    // Cleanup function to clear scanner when component unmounts or scanning stops
    return () => {
      if (qrcodeScannerRef.current && scannerInitialized) {
        try {
          qrcodeScannerRef.current.clear().catch((clearError) => {
            console.error("Failed to clear QR Code scanner", clearError);
          });
        } catch (e) {
          console.error("Error during scanner cleanup:", e);
        }
        setScannerInitialized(false);
        // Also clear any lingering errors when cleaning up
        setError(null);
      }
    };
  }, [isScanning, scannerInitialized, validateTicketQR]);

  // Handle manual ticket ID input
  const handleManualSubmit = async (e) => {
    e.preventDefault();

    if (!manualInput.trim()) {
      setError("Please enter a valid ticket ID");
      return;
    }

    try {
      // Check if input is a base64 image
      if (manualInput.startsWith("data:image")) {
        setError(
          "You pasted a QR code image. Please enter the ticket ID number instead."
        );
        return;
      }

      // If it's a number, send it directly - our backend now handles numeric IDs
      if (/^\d+$/.test(manualInput.trim())) {
        const ticketId = parseInt(manualInput.trim());
        console.log(`Checking ticket ID: ${ticketId}`);
        await validateTicketQR(ticketId);
      } else {
        setError("Please enter a valid ticket ID number");
      }
    } catch (inputError) {
      setError("Invalid input. Please enter a numeric ticket ID.");
      console.error("Input error:", inputError);
    }
  };

  // Confirm check-in
  const handleConfirmCheckIn = async () => {
    if (!ticketResult?.ticket) return;

    try {
      setCheckingIn(true);
      setError(null);
      setSuccess(null);

      await api.post(`/admin/check-in/${ticketResult.ticket.id}/confirm`, {});

      setSuccess("Ticket successfully checked in!");
      setTicketResult({
        ...ticketResult,
        ticket: {
          ...ticketResult.ticket,
          checked_in: true,
          checked_in_at: new Date().toISOString(),
        },
      });

      // Refresh event stats
      if (currentEventId) {
        fetchEventStats(currentEventId);
      }

      // Auto-clear after 3 seconds to prepare for next scan
      setTimeout(() => {
        resetScannerState();
      }, 3000);
    } catch (checkInError) {
      console.error("Error checking in ticket:", checkInError);

      // Special handling for already checked-in error
      if (
        checkInError.response?.status === 400 &&
        (checkInError.response?.data?.error?.includes("already") ||
          checkInError.response?.data?.error?.includes("used"))
      ) {
        setSuccess(
          "This ticket has already been checked in. Ready for next scan."
        );

        // Auto-reset after a brief delay
        setTimeout(() => {
          resetScannerState();
        }, 2000);
      } else {
        // Handle other errors normally
        setError(
          checkInError.response?.data?.error || "Failed to check in ticket"
        );
      }
    } finally {
      setCheckingIn(false);
    }
  };

  // Reset scanner state to scan another ticket
  const resetScannerState = useCallback(() => {
    setTicketResult(null);
    setError(null);
    setSuccess(null);
    setManualInput("");

    if (qrcodeScannerRef.current) {
      qrcodeScannerRef.current
        .clear()
        .then(() => {
          console.log("Scanner cleared successfully");
          setScannerInitialized(false);

          setTimeout(() => {
            if (isScanning) {
              setScannerInitialized(true);
            }
          }, 300);
        })
        .catch((clearError) => {
          console.error("Failed to clear scanner:", clearError);
          setScannerInitialized(false);
        });
    }
  }, [isScanning]);  // 👈 only re-create when `isScanning` changes

  // Format date for display
  const formatDate = (dateString) => {
    if (!dateString) return "N/A";
    return new Date(dateString).toLocaleDateString();
  };

  // Format time for display
  const formatTime = (timeString) => {
    if (!timeString) return "";

    const [hours, minutes] = timeString.split(":");
    const hour = parseInt(hours, 10);
    const ampm = hour >= 12 ? "PM" : "AM";
    const formattedHour = hour % 12 || 12;

    return `${formattedHour}:${minutes} ${ampm}`;
  };

  // Debug function to log ticket status - will help diagnose button issue
  const debugTicketStatus = () => {
    if (ticketResult) {
      console.log("Current ticket status:", {
        ticketStatus: ticketResult.status,
        isValid: ticketResult.status === "VALID_TODAY",
        isCheckedIn: ticketResult.ticket.checked_in,
        isCheckingIn: checkingIn,
        buttonDisabled: checkingIn || ticketResult.status !== "VALID_TODAY",
      });
    }
    return null;
  };

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-2xl font-bold mb-6">Ticket Check-In System</h1>

      {/* Debug info for ticket status - helps troubleshoot button issues */}
      {debugTicketStatus()}

      {/* Event Stats Card (if available) */}
      {eventStats && (
        <div className="bg-white rounded-lg shadow-md p-6 mb-6">
          <h2 className="text-lg font-medium mb-4">Event Check-In Stats</h2>

          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="bg-blue-50 p-4 rounded-md">
              <div className="text-blue-600 font-bold text-xl">
                {eventStats.validTickets}
              </div>
              <div className="text-gray-600">Total Tickets</div>
            </div>
            <div className="bg-green-50 p-4 rounded-md">
              <div className="text-green-600 font-bold text-xl">
                {eventStats.checkedInCount}
              </div>
              <div className="text-gray-600">Checked In</div>
            </div>
            <div className="bg-purple-50 p-4 rounded-md">
              <div className="text-purple-600 font-bold text-xl">
                {eventStats.checkInPercentage}%
              </div>
              <div className="text-gray-600">Check-In Rate</div>
            </div>
            <div className="bg-yellow-50 p-4 rounded-md">
              <div className="text-yellow-600 font-bold text-xl">
                {eventStats.remaining}
              </div>
              <div className="text-gray-600">Remaining</div>
            </div>
          </div>

          {/* Recent Check-ins */}
          {recentCheckIns && recentCheckIns.length > 0 && (
            <div className="mt-6">
              <h3 className="font-medium mb-2">Recent Check-ins</h3>
              <div className="overflow-x-auto">
                <table className="min-w-full text-sm">
                  <thead>
                    <tr className="border-b">
                      <th className="text-left p-2">Name</th>
                      <th className="text-left p-2">Ticket Type</th>
                      <th className="text-left p-2">Checked In At</th>
                    </tr>
                  </thead>
                  <tbody>
                    {recentCheckIns.map((checkIn, index) => (
                      <tr key={index} className="border-b">
                        <td className="p-2">{checkIn.user_name}</td>
                        <td className="p-2">{checkIn.ticket_type}</td>
                        <td className="p-2">
                          {new Date(checkIn.checked_in_at).toLocaleString()}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Error/Success Messages */}
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

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Left Column - Scanner or Ticket Result */}
        <div className="bg-white rounded-lg shadow-md p-6">
          {!ticketResult ? (
            <>
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-lg font-medium">Scan Ticket QR Code</h2>
                <div className="flex space-x-2">
                  <button
                    onClick={toggleScanner}
                    className={`text-sm px-3 py-1 rounded ${
                      isScanning
                        ? "bg-red-100 text-red-600"
                        : "bg-green-100 text-green-600"
                    }`}
                  >
                    {isScanning ? "Stop Scanner" : "Start Scanner"}
                  </button>
                </div>
              </div>

              {isScanning ? (
                // QR Scanner Container
                <div className="mb-6">
                  <div id="qr-reader" className="w-full"></div>
                </div>
              ) : (
                // Scanner Off Message
                <div className="flex flex-col items-center justify-center h-64 bg-gray-50 rounded-md border border-dashed border-gray-300">
                  <FaQrcode className="text-gray-400 text-5xl mb-3" />
                  <p className="text-gray-500">
                    Click "Start Scanner" to activate the QR code reader
                  </p>
                </div>
              )}

              {/* Manual Ticket Entry */}
              <div className="mt-4">
                <h3 className="text-md font-medium mb-2">
                  Or Enter Ticket ID Manually
                </h3>
                <form onSubmit={handleManualSubmit} className="flex">
                  <input
                    type="number"
                    value={manualInput}
                    onChange={(e) => setManualInput(e.target.value)}
                    placeholder="Enter ticket ID number"
                    className="flex-grow p-2 border rounded-l-md focus:outline-none focus:ring-2 focus:ring-purple-500"
                  />
                  <button
                    type="submit"
                    className="bg-purple-600 text-white px-4 py-2 rounded-r-md hover:bg-purple-700"
                    disabled={loading}
                  >
                    {loading ? (
                      <FaSpinner className="animate-spin" />
                    ) : (
                      "Validate"
                    )}
                  </button>
                </form>
              </div>
            </>
          ) : (
            // Ticket Result Display
            <div>
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-lg font-medium">Ticket Details</h2>
                <button
                  onClick={resetScannerState}
                  className="flex items-center text-sm px-3 py-1 rounded bg-blue-100 text-blue-600"
                >
                  <FaSyncAlt className="mr-1" /> Scan Another
                </button>
              </div>

              <div
                className={`p-4 rounded-md mb-4 ${
                  ticketResult.status === "VALID_TODAY"
                    ? "bg-green-50 border border-green-200"
                    : ticketResult.status === "FUTURE_EVENT"
                    ? "bg-blue-50 border border-blue-200"
                    : "bg-yellow-50 border border-yellow-200"
                }`}
              >
                <div className="flex items-center">
                  {ticketResult.status === "VALID_TODAY" && (
                    <FaCheckCircle className="text-green-500 mr-2" size={20} />
                  )}
                  {ticketResult.status === "FUTURE_EVENT" && (
                    <FaCalendarAlt className="text-blue-500 mr-2" size={20} />
                  )}
                  {ticketResult.status === "PAST_EVENT" && (
                    <FaExclamationTriangle
                      className="text-yellow-500 mr-2"
                      size={20}
                    />
                  )}
                  <span className="font-medium">
                    {ticketResult.status === "VALID_TODAY" &&
                      "Valid ticket for today's event"}
                    {ticketResult.status === "FUTURE_EVENT" &&
                      "Valid ticket for a future event"}
                    {ticketResult.status === "PAST_EVENT" &&
                      "Ticket is for a past event"}
                  </span>
                </div>
              </div>

              <div className="space-y-3">
                <div className="flex items-center">
                  <FaTicketAlt className="text-gray-400 mr-3" />
                  <div>
                    <div className="text-sm text-gray-500">Ticket ID</div>
                    <div className="font-medium">{ticketResult.ticket.id}</div>
                  </div>
                </div>

                <div className="flex items-center">
                  <FaIdCard className="text-gray-400 mr-3" />
                  <div>
                    <div className="text-sm text-gray-500">Attendee</div>
                    <div className="font-medium">
                      {ticketResult.ticket.user_name}
                    </div>
                    <div className="text-sm text-gray-500">
                      {ticketResult.ticket.user_email}
                    </div>
                  </div>
                </div>

                <div className="flex items-center">
                  <FaCalendarAlt className="text-gray-400 mr-3" />
                  <div>
                    <div className="text-sm text-gray-500">Event Date</div>
                    <div className="font-medium">
                      {formatDate(ticketResult.ticket.event_date)}
                    </div>
                  </div>
                </div>

                <div className="flex items-center">
                  <FaClock className="text-gray-400 mr-3" />
                  <div>
                    <div className="text-sm text-gray-500">Event Time</div>
                    <div className="font-medium">
                      {formatTime(ticketResult.ticket.event_time)}
                    </div>
                  </div>
                </div>

                <div className="flex items-center">
                  <FaMapMarkerAlt className="text-gray-400 mr-3" />
                  <div>
                    <div className="text-sm text-gray-500">Venue</div>
                    <div className="font-medium">
                      {ticketResult.ticket.venue}
                    </div>
                  </div>
                </div>

                <div className="flex items-center">
                  <FaTicketAlt className="text-gray-400 mr-3" />
                  <div>
                    <div className="text-sm text-gray-500">Ticket Type</div>
                    <div className="font-medium">
                      {ticketResult.ticket.ticket_type_name}
                    </div>
                  </div>
                </div>

                <div className="pt-4 mt-2 border-t border-gray-200">
                  <div className="text-sm text-gray-500 mb-2">
                    Check-in Status
                  </div>
                  {ticketResult.ticket.checked_in ? (
                    <div className="bg-green-100 text-green-800 p-3 rounded-md flex items-center">
                      <FaUserCheck className="mr-2" />
                      <div>
                        <div className="font-medium">Already Checked In</div>
                        <div className="text-sm">
                          {ticketResult.ticket.checked_in_at
                            ? `at ${new Date(
                                ticketResult.ticket.checked_in_at
                              ).toLocaleString()}`
                            : ""}
                        </div>
                      </div>
                    </div>
                  ) : (
                    <button
                      onClick={handleConfirmCheckIn}
                      disabled={
                        checkingIn || ticketResult.status !== "VALID_TODAY"
                      }
                      className={`w-full p-3 rounded-md font-medium flex justify-center items-center ${
                        ticketResult.status === "VALID_TODAY"
                          ? "bg-green-600 hover:bg-green-700 text-white"
                          : "bg-gray-200 text-gray-500 cursor-not-allowed"
                      }`}
                    >
                      {checkingIn ? (
                        <>
                          <FaSpinner className="animate-spin mr-2" />
                          Processing...
                        </>
                      ) : (
                        <>
                          <FaUserCheck className="mr-2" />
                          Confirm Check-In
                        </>
                      )}
                    </button>
                  )}
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Right Column - Instructions or Recent Check-ins */}
        <div className="bg-white rounded-lg shadow-md p-6">
          {!ticketResult ? (
            // Instructions when no ticket is scanned
            <>
              <h2 className="text-lg font-medium mb-4">
                Check-In Instructions
              </h2>

              <div className="space-y-6">
                <div className="flex">
                  <div className="mr-4 bg-purple-100 rounded-full h-8 w-8 flex items-center justify-center text-purple-600 font-bold">
                    1
                  </div>
                  <div>
                    <div className="font-medium mb-1">Start the Scanner</div>
                    <p className="text-gray-600 text-sm">
                      Click the "Start Scanner" button to activate your device's
                      camera. You may need to grant camera permissions.
                    </p>
                  </div>
                </div>

                <div className="flex">
                  <div className="mr-4 bg-purple-100 rounded-full h-8 w-8 flex items-center justify-center text-purple-600 font-bold">
                    2
                  </div>
                  <div>
                    <div className="font-medium mb-1">Scan Ticket QR Code</div>
                    <p className="text-gray-600 text-sm">
                      Hold the visitor's QR code in front of your camera. The
                      system will automatically detect valid tickets.
                    </p>
                  </div>
                </div>

                <div className="flex">
                  <div className="mr-4 bg-purple-100 rounded-full h-8 w-8 flex items-center justify-center text-purple-600 font-bold">
                    3
                  </div>
                  <div>
                    <div className="font-medium mb-1">
                      Verify Ticket Details
                    </div>
                    <p className="text-gray-600 text-sm">
                      Check that the ticket is valid for today's event and has
                      not been used before.
                    </p>
                  </div>
                </div>

                <div className="flex">
                  <div className="mr-4 bg-purple-100 rounded-full h-8 w-8 flex items-center justify-center text-purple-600 font-bold">
                    4
                  </div>
                  <div>
                    <div className="font-medium mb-1">Confirm Check-In</div>
                    <p className="text-gray-600 text-sm">
                      Click the "Confirm Check-In" button to mark the ticket as
                      used. The attendee can now enter the event.
                    </p>
                  </div>
                </div>
              </div>
            </>
          ) : (
            // Recent Check-ins when a ticket is scanned and we have event data
            <>
              <h2 className="text-lg font-medium mb-4">
                <div className="flex items-center">
                  <FaUsers className="mr-2 text-purple-500" />
                  Event Attendees
                </div>
              </h2>

              {recentCheckIns && recentCheckIns.length > 0 ? (
                <div className="overflow-y-auto max-h-96">
                  <table className="min-w-full text-sm">
                    <thead>
                      <tr className="bg-gray-50">
                        <th className="text-left p-2 border-b">Name</th>
                        <th className="text-left p-2 border-b">Ticket Type</th>
                        <th className="text-left p-2 border-b">Time</th>
                      </tr>
                    </thead>
                    <tbody>
                      {recentCheckIns.map((checkIn, index) => (
                        <tr key={index} className="border-b">
                          <td className="p-2">{checkIn.user_name}</td>
                          <td className="p-2">{checkIn.ticket_type}</td>
                          <td className="p-2 text-gray-500">
                            {new Date(
                              checkIn.checked_in_at
                            ).toLocaleTimeString()}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ) : (
                <div className="bg-gray-50 p-6 text-center rounded-md">
                  <FaInfoCircle className="mx-auto text-gray-400 text-3xl mb-2" />
                  <p className="text-gray-500">
                    No check-ins recorded for this event yet.
                  </p>
                </div>
              )}

              <div className="mt-8 p-4 bg-blue-50 rounded-md border border-blue-200">
                <div className="flex items-start">
                  <FaInfoCircle className="text-blue-500 mt-1 mr-2" />
                  <div>
                    <div className="font-medium text-blue-800 mb-1">
                      Event Statistics
                    </div>
                    <p className="text-sm text-blue-700">
                      {eventStats ? (
                        <>
                          {eventStats.checkedInCount} of{" "}
                          {eventStats.validTickets} attendees checked in (
                          {eventStats.checkInPercentage}%)
                        </>
                      ) : (
                        "Loading statistics..."
                      )}
                    </p>
                  </div>
                </div>
              </div>
            </>
          )}

          <div className="mt-8 p-4 bg-gray-50 rounded-md">
            <div className="flex items-start">
              <FaInfoCircle className="text-gray-500 mt-1 mr-2" />
              <div>
                <div className="font-medium text-gray-700 mb-1">
                  Troubleshooting
                </div>
                <p className="text-sm text-gray-600">
                  If the scanner isn't working, simply enter the ticket ID
                  number manually. You can find the ID on the ticket.
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default TicketCheckIn;
