// src/routes/AdminRoutes.jsx
import { Route, Routes } from 'react-router-dom';
import AdminRoute from '../components/routing/AdminRoute';
import AdminLayout from '../components/layout/AdminLayout';
import AdminDashboard from '../pages/admin/AdminDashboard';
import AdminUsers from '../pages/admin/AdminUsers';
import AdminEvents from '../pages/admin/AdminEvents';
import AdminCategories from '../pages/admin/AdminCategories';
import AdminRefunds from '../pages/admin/AdminRefunds';

const AdminRoutes = () => {
  return (
    <Routes>
      <Route element={<AdminRoute />}>
        <Route element={<AdminLayout />}>
          <Route index element={<AdminDashboard />} />
          <Route path="users" element={<AdminUsers />} />
          <Route path="events" element={<AdminEvents />} />
          <Route path="categories" element={<AdminCategories />} />
          <Route path="refunds" element={<AdminRefunds />} />
        </Route>
      </Route>
    </Routes>
  );
};

export default AdminRoutes;