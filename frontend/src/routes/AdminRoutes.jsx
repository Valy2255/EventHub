// src/routes/AdminRoutes.jsx
import { Route, Routes } from 'react-router-dom';
import AdminRoute from '../components/routing/AdminRoute';
import AdminLayout from '../components/layout/AdminLayout';
import AdminDashboard from '../pages/admin/AdminDashboard';
import AdminUsers from '../pages/admin/AdminUsers';
import AdminEvents from '../pages/admin/AdminEvents';
import AdminEventForm from '../pages/admin/AdminEventForm';
import AdminCategories from '../pages/admin/AdminCategories';
import AdminSubcategories from '../pages/admin/AdminSubcategories';
import AdminRefunds from '../pages/admin/AdminRefunds';
import AdminFAQs from '../pages/admin/AdminFAQs';
import AdminLegalDocuments from '../pages/admin/AdminLegalDocuments';
import TicketCheckIn from '../pages/admin/TicketCheckIn';

const AdminRoutes = () => {
  return (
    <Routes>
      <Route element={<AdminRoute />}>
        <Route element={<AdminLayout />}>
          <Route index element={<AdminDashboard />} />
          <Route path="users" element={<AdminUsers />} />
          <Route path="events" element={<AdminEvents />} />
          <Route path="events/new" element={<AdminEventForm />} />
          <Route path="events/:id/edit" element={<AdminEventForm />} />
          <Route path="categories" element={<AdminCategories />} />
          <Route path="subcategories" element={<AdminSubcategories />} />
          <Route path="faqs" element={<AdminFAQs />} />
          <Route path="legal-documents" element={<AdminLegalDocuments />} />
          <Route path="refunds" element={<AdminRefunds />} />
          <Route path="check-in" element={<TicketCheckIn />} />
        </Route>
      </Route>
    </Routes>
  );
};

export default AdminRoutes;