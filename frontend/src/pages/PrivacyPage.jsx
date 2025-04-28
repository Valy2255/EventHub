import { useState, useEffect } from "react";
import { FaSpinner } from "react-icons/fa";
import api from "../services/api";
import { format } from "date-fns";

const PrivacyPage = () => {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [privacyPolicy, setPrivacyPolicy] = useState(null);

  useEffect(() => {
    const fetchPrivacyPolicy = async () => {
      try {
        setLoading(true);
        const response = await api.get("/legal/privacy_policy");
        console.log("Privacy Policy Response:", response.data);
        setPrivacyPolicy(response.data.document);
        setLoading(false);
      } catch (err) {
        console.error("Error fetching privacy policy:", err);
        setError("Failed to load privacy policy. Please try again later.");
        setLoading(false);
      }
    };

    fetchPrivacyPolicy();
  }, []);

  if (loading) {
    return (
      <div className="bg-gray-50 min-h-screen flex justify-center items-center">
        <FaSpinner className="animate-spin text-purple-600 text-4xl" />
        <span className="ml-3 text-xl text-gray-600">
          Loading Privacy Policy...
        </span>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-gray-50 min-h-screen flex justify-center items-center">
        <div className="bg-red-100 text-red-700 p-6 rounded-lg max-w-lg">
          <h2 className="text-xl font-bold mb-2">Error</h2>
          <p>{error}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-gray-50 min-h-screen">
      {/* Hero Section */}
      <div className="bg-gradient-to-r from-purple-700 to-indigo-800 text-white py-16">
        <div className="container mx-auto px-4 text-center">
          <h1 className="text-4xl md:text-5xl font-bold mb-4">
            {privacyPolicy?.title || "Privacy Policy"}
          </h1>
          <p className="text-xl max-w-2xl mx-auto">
            We respect your privacy and are committed to protecting your
            personal data.
          </p>
        </div>
      </div>

      {/* Privacy Content */}
      <div className="container mx-auto px-4 py-12">
        <div className="max-w-4xl mx-auto bg-white rounded-xl shadow-md p-8">
          <div className="prose max-w-none">
            {privacyPolicy ? (
              <>
                <p className="text-gray-600">
                  Last Updated:{" "}
                  {format(new Date(privacyPolicy.published_at), "MMMM d, yyyy")}
                </p>
                <div className="legal-content">
                  <div
                    dangerouslySetInnerHTML={{ __html: privacyPolicy.content }}
                  />
                </div>
              </>
            ) : (
              <p className="text-gray-500 italic">
                No privacy policy information available.
              </p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default PrivacyPage;
