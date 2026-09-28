import { Routes, Route, Navigate } from 'react-router-dom';
import ProtectedRoute from './ProtectedRoute';
import Layout from '../components/layout/Layout';
import Login from '../pages/auth/Login';
import Dashboard from '../pages/dashboard/Dashboard';
import ClientsList from '../pages/clients/ClientsList';
import ProductsList from '../pages/products/ProductsList';
import CategoriesList from '../pages/categories/CategoriesList';
import QuotesList from '../pages/quotes/QuotesList';
import OrdersList from '../pages/orders/OrdersList';
import InvoicesList from '../pages/invoices/InvoicesList';
import UsersList from '../pages/users/UsersList';
import Reports from '../pages/reports/Reports';

export default function AppRoutes() {
  return (
    <Routes>
      <Route path="/login" element={<Login />} />

      <Route element={<ProtectedRoute />}>
        <Route element={<Layout />}>
          <Route path="/" element={<Dashboard />} />
          <Route path="/clients" element={<ClientsList />} />
          <Route path="/products" element={<ProductsList />} />
          <Route path="/quotes" element={<QuotesList />} />
          <Route path="/orders" element={<OrdersList />} />
          <Route path="/invoices" element={<InvoicesList />} />

          <Route element={<ProtectedRoute roles={['admin', 'supervisor']} />}>
            <Route path="/categories" element={<CategoriesList />} />
            <Route path="/reports" element={<Reports />} />
          </Route>

          <Route element={<ProtectedRoute roles={['admin']} />}>
            <Route path="/users" element={<UsersList />} />
          </Route>
        </Route>
      </Route>

      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}