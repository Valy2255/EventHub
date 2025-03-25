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
import CategoryEvents from "./pages/CategoryEvents";
import SubcategoryEvents from "./pages/SubcategoryEvents";
import NotFound from "./pages/NotFound";
import SocialAuthCallback from "./components/auth/SocialAuthCallback";
import PrivateRoute from "./components/routing/PrivateRoute";
import { AuthProvider } from "./context/AuthContext";

function App() {
  return (
    <AuthProvider>
      <div className="flex flex-col min-h-screen">
        <Header />
        
        <main className="flex-grow bg-gray-100">
          <Routes>
            <Route path="/" element={<Home />} />
            <Route path="/login" element={<Login />} />
            <Route path="/register" element={<Register />} />
            <Route path="/forgot-password" element={<ForgotPassword />} />
            <Route path="/reset-password/:token" element={<ResetPassword />} />
            <Route path="/events" element={<EventsPage />} />
            <Route path="/social-auth-callback" element={<SocialAuthCallback />} />
            
            {/* Routes for categories and subcategories */}
            <Route path="/events/category/:slug" element={<CategoryEvents />} />
            <Route path="/events/category/:categorySlug/:subcategorySlug" element={<SubcategoryEvents />} />
            
            {/* Protected routes */}
            <Route element={<PrivateRoute />}>
              {/* Add protected routes here */}
            </Route>
            
            <Route path="*" element={<NotFound />} />
          </Routes>
        </main>
        
        <Footer />
      </div>
    </AuthProvider>
  );
}

export default App;