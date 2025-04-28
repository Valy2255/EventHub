import { useState, useEffect } from "react";
import { FaSpinner } from "react-icons/fa";
import api from "../services/api";
import { format } from "date-fns";

const TermsPage = () => {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [terms, setTerms] = useState(null);

  useEffect(() => {
    const fetchTerms = async () => {
      try {
        setLoading(true);
        const response = await api.get("/legal/terms_conditions");
        setTerms(response.data.document);
        setLoading(false);
      } catch (err) {
        console.error("Error fetching terms & conditions:", err);
        setError(
          "Failed to load terms and conditions. Please try again later."
        );
        setLoading(false);
      }
    };

    fetchTerms();
  }, []);

  if (loading) {
    return (
      <div className="bg-gray-50 min-h-screen flex justify-center items-center">
        <FaSpinner className="animate-spin text-purple-600 text-4xl" />
        <span className="ml-3 text-xl text-gray-600">
          Loading Terms & Conditions...
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
            {terms?.title || "Terms & Conditions"}
          </h1>
          <p className="text-xl max-w-2xl mx-auto">
            Please read these terms and conditions carefully before using
            EventHub.
          </p>
        </div>
      </div>

      {/* Terms Content */}
      <div className="container mx-auto px-4 py-12">
        <div className="max-w-4xl mx-auto bg-white rounded-xl shadow-md p-8">
          <div className="prose max-w-none">
            {terms ? (
              <>
                <p className="text-gray-600">
                  Last Updated:{" "}
                  {format(new Date(terms.published_at), "MMMM d, yyyy")}
                </p>
                <div className="legal-content">
                  <div dangerouslySetInnerHTML={{ __html: terms.content }} />
                </div>
              </>
            ) : (
              <p className="text-gray-500 italic">
                No terms and conditions information available.
              </p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default TermsPage;
