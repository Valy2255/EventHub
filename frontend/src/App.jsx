// src/App.jsx
import { Routes, Route } from "react-router-dom";
import Header from "./components/layout/Header";
import Footer from "./components/layout/Footer";
import Home from "./pages/Home";
import Login from "./pages/Login";
import Register from "./pages/Register";
import ForgotPassword from "./pages/ForgotPassword";
import ResetPassword from "./pages/ResetPassword";
import EventsPage from "./pages/EventsPage";
import EventDetails from "./pages/EventDetails";
import CategoryEvents from "./pages/CategoryEvents";
import SubcategoryEvents from "./pages/SubcategoryEvents";
import SearchResultsPage from "./pages/SearchResultsPage";
import NotFound from "./pages/NotFound";
import SocialAuthCallback from "./components/auth/SocialAuthCallback";
import PrivateRoute from "./components/routing/PrivateRoute";
import Checkout from "./pages/Checkout";
import UserTickets from "./pages/UserTickets";
import UserProfile from "./pages/UserProfile";
import ContactPage from "./pages/ContactPage";
import FAQPage from "./pages/FAQPage";
import TermsPage from "./pages/TermsPage";
import PrivacyPage from "./pages/PrivacyPage";
import RefundPage from "./pages/RefundPage";
import CreditHistory from "./pages/CreditHistory";
import TicketPage from "./pages/TicketPage";
import PurchasePage from "./pages/PurchasePage";
import PurchaseHistoryPage from "./pages/PurchaseHistoryPage";
import PaymentMethods from "./pages/PaymentMethods";

import { AuthProvider } from "./context/AuthContext";
import AdminRoutes from "./routes/AdminRoutes";

function App() {
  return (
    <AuthProvider>
      <div className="flex flex-col min-h-screen">
        <Routes>
          {/* Admin Routes - Completely separate */}
          <Route path="/admin/*" element={<AdminRoutes />} />

          {/* User Routes - Main layout for all user-facing pages */}
          <Route
            path="*"
            element={
              <>
                <Header />
                <main className="flex-grow bg-gray-100">
                  <Routes>
                    <Route path="/" element={<Home />} />
                    <Route path="/login" element={<Login />} />
                    <Route path="/register" element={<Register />} />
                    <Route
                      path="/forgot-password"
                      element={<ForgotPassword />}
                    />
                    <Route
                      path="/reset-password/:token"
                      element={<ResetPassword />}
                    />
                    <Route path="/events" element={<EventsPage />} />
                    <Route path="/events/:id" element={<EventDetails />} />
                    <Route
                      path="/social-auth-callback"
                      element={<SocialAuthCallback />}
                    />
                    <Route path="/contact" element={<ContactPage />} />
                    <Route path="/faq" element={<FAQPage />} />
                    <Route path="/terms" element={<TermsPage />} />
                    <Route path="/privacy" element={<PrivacyPage />} />
                    <Route path="refunds" element={<RefundPage />} />

                    {/* Routes for categories and subcategories */}
                    <Route
                      path="/events/category/:slug"
                      element={<CategoryEvents />}
                    />
                    <Route
                      path="/events/category/:categorySlug/:subcategorySlug"
                      element={<SubcategoryEvents />}
                    />

                    {/* Search results page */}
                    <Route
                      path="/events/search"
                      element={<SearchResultsPage />}
                    />

                    {/* Protected routes */}
                    <Route element={<PrivateRoute />}>
                      <Route path="/checkout" element={<Checkout />} />
                      <Route path="/profile" element={<UserProfile />} />
                      <Route
                        path="/profile/credits"
                        element={<CreditHistory />}
                      />
                      <Route
                        path="/profile/tickets"
                        element={<UserTickets />}
                      />
                      <Route
                        path="/profile/purchases"
                        element={<PurchaseHistoryPage />}
                      />
                      <Route
                        path="/profile/purchases/:id"
                        element={<PurchasePage />}
                      />
                      <Route
                        path="/profile/tickets/:id"
                        element={<TicketPage />}
                      />
                    </Route>
                    <Route
                      path="/profile/payment-methods"
                      element={<PaymentMethods />}
                    />
                    <Route
                      path="/profile/payment"
                      element={<PaymentMethods />}
                    />

                    <Route path="*" element={<NotFound />} />
                  </Routes>
                </main>
                <Footer />
              </>
            }
          />
        </Routes>
      </div>
    </AuthProvider>
  );
}

export default App;
