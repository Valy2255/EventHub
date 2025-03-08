// src/App.jsx
import { Routes, Route } from "react-router-dom";
import Header from "./components/layout/Header";
import Footer from "./components/layout/Footer";
import Home from "./pages/Home";
import Login from "./pages/Login";
import Register from "./pages/Register";
import EventsPage from "./pages/EventsPage";
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
            <Route path="/events" element={<EventsPage />} />
            <Route path="/social-auth-callback" element={<SocialAuthCallback />} />
            
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