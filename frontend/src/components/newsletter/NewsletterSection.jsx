// src/components/newsletter/NewsletterSection.jsx
import { useState } from "react";
import {
  FaEnvelope,
  FaSpinner,
  FaCheckCircle,
  FaExclamationCircle,
} from "react-icons/fa";
import newsletterService from "../../services/newsletterService";

const NewsletterSection = () => {
  const [email, setEmail] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formStatus, setFormStatus] = useState({
    message: "",
    type: "", // 'success' or 'error'
  });

  const handleEmailChange = (e) => {
    setEmail(e.target.value);
    // Clear any previous form status
    if (formStatus.message) setFormStatus({ message: "", type: "" });
  };

  const handleSubscribe = async (e) => {
    e.preventDefault();

    // Basic email validation
    if (!email || !email.includes("@") || !email.includes(".")) {
      setFormStatus({
        message: "Please enter a valid email address",
        type: "error",
      });
      return;
    }

    setIsSubmitting(true);

    try {
      await newsletterService.subscribe(email);

      setFormStatus({
        message: "Thank you for subscribing!",
        type: "success",
      });

      // Clear form
      setEmail("");
    } catch (error) {
      console.error("Newsletter subscription error:", error);

      // Set appropriate error message based on the response
      const errorMsg =
        error.response?.data?.message ||
        "Failed to subscribe. Please try again later.";

      setFormStatus({
        message: errorMsg,
        type: "error",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <section className="bg-gradient-to-r from-purple-600 to-indigo-600 rounded-2xl p-8 md:p-12 mb-12">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-center">
        <div>
          <h2 className="text-3xl font-bold text-white mb-4">
            Never Miss An Event Again
          </h2>
          <p className="text-purple-100 mb-6">
            Subscribe to our newsletter and be the first to know about upcoming
            events, exclusive pre-sales and special promotions.
          </p>

          <form
            onSubmit={handleSubscribe}
            className="flex flex-col sm:flex-row gap-3"
          >
            <div className="flex-grow relative">
              <div className="absolute left-3 top-1/2 -translate-y-1/2 text-purple-700">
                <FaEnvelope />
              </div>
              <input
                type="email"
                placeholder="Your email address"
                value={email}
                onChange={handleEmailChange}
                className="w-full pl-10 pr-4 py-3 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-400"
                disabled={isSubmitting}
              />
            </div>
            <button
              type="submit"
              disabled={isSubmitting}
              className="bg-white text-purple-700 font-medium px-6 py-3 rounded-lg hover:bg-gray-100 transition-colors flex items-center justify-center min-w-[120px]"
            >
              {isSubmitting ? (
                <FaSpinner className="animate-spin" />
              ) : (
                "Subscribe"
              )}
            </button>
          </form>

          {/* Status message */}
          {formStatus.message && (
            <div
              className={`mt-3 ${
                formStatus.type === "success"
                  ? "text-green-200"
                  : "text-red-200"
              } flex items-center`}
            >
              {formStatus.type === "success" ? (
                <FaCheckCircle className="mr-2" />
              ) : (
                <FaExclamationCircle className="mr-2" />
              )}
              {formStatus.message}
            </div>
          )}
        </div>
        <div className="hidden md:block">
          <img
            src="https://placehold.co/600x400/C7D2FE/4338CA?text=EventHub+"
            alt="Newsletter promotion"
            className="rounded-lg"
          />
        </div>
      </div>
    </section>
  );
};

export default NewsletterSection;
