import { Outlet, useLocation } from 'react-router-dom';
import Sidebar from './Sidebar';
import Header from './Header';
import Toast from '../common/Toast';

const titleMap = {
  '/': 'Dashboard',
  '/clients': 'Clientes',
  '/products': 'Productos',
  '/categories': 'Categorías',
  '/quotes': 'Cotizaciones',
  '/orders': 'Órdenes de Venta',
  '/invoices': 'Facturas',
  '/reports': 'Reportes',
  '/users': 'Usuarios',
};

export default function Layout() {
  const location = useLocation();
  const title = titleMap[location.pathname] || 'CRM Ventas';

  return (
    <div className="flex h-screen bg-gray-50">
      <Sidebar />
      <div className="flex-1 flex flex-col overflow-hidden">
        <Header title={title} />
        <main className="flex-1 overflow-y-auto p-6">
          <Outlet />
        </main>
      </div>
      <Toast />
    </div>
  );
}