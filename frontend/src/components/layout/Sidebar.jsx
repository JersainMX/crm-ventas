import { NavLink } from 'react-router-dom';
import {
  LayoutDashboard, Users, Package, FileText, ShoppingCart,
  Receipt, BarChart3, FolderTree, LogOut, Settings,
} from 'lucide-react';
import { useSelector, useDispatch } from 'react-redux';
import { logout } from '../../store/slices/authSlice';

const menu = [
  { to: '/', icon: LayoutDashboard, label: 'Dashboard', roles: ['admin', 'supervisor', 'seller'] },
  { to: '/clients', icon: Users, label: 'Clientes', roles: ['admin', 'supervisor', 'seller'] },
  { to: '/products', icon: Package, label: 'Productos', roles: ['admin', 'supervisor', 'seller'] },
  { to: '/categories', icon: FolderTree, label: 'Categorías', roles: ['admin', 'supervisor'] },
  { to: '/quotes', icon: FileText, label: 'Cotizaciones', roles: ['admin', 'supervisor', 'seller'] },
  { to: '/orders', icon: ShoppingCart, label: 'Órdenes', roles: ['admin', 'supervisor', 'seller'] },
  { to: '/invoices', icon: Receipt, label: 'Facturas', roles: ['admin', 'supervisor', 'seller'] },
  { to: '/reports', icon: BarChart3, label: 'Reportes', roles: ['admin', 'supervisor'] },
  { to: '/users', icon: Settings, label: 'Usuarios', roles: ['admin'] },
];

export default function Sidebar() {
  const dispatch = useDispatch();
  const { user } = useSelector((s) => s.auth);
  const { sidebarOpen } = useSelector((s) => s.ui);

  const filteredMenu = menu.filter((item) => item.roles.includes(user?.role));

  return (
    <aside
      className={`bg-gray-900 text-gray-100 flex flex-col transition-all duration-300 ${
        sidebarOpen ? 'w-64' : 'w-16'
      }`}
    >
      {/* Logo */}
      <div className="h-16 flex items-center px-4 border-b border-gray-800">
        <div className="w-8 h-8 rounded-lg bg-primary-600 flex items-center justify-center font-bold text-white flex-shrink-0">
          C
        </div>
        {sidebarOpen && (
          <span className="ml-3 font-semibold text-white">CRM Ventas</span>
        )}
      </div>

      {/* Menu */}
      <nav className="flex-1 py-4 overflow-y-auto">
        {filteredMenu.map((item) => (
          <NavLink
            key={item.to}
            to={item.to}
            end={item.to === '/'}
            className={({ isActive }) =>
              `flex items-center gap-3 px-4 py-3 mx-2 rounded-md transition-colors ${
                isActive
                  ? 'bg-primary-600 text-white'
                  : 'text-gray-400 hover:bg-gray-800 hover:text-white'
              }`
            }
          >
            <item.icon className="w-5 h-5 flex-shrink-0" />
            {sidebarOpen && <span className="text-sm">{item.label}</span>}
          </NavLink>
        ))}
      </nav>

      {/* User */}
      <div className="p-4 border-t border-gray-800">
        {sidebarOpen && user && (
          <div className="mb-3">
            <p className="text-sm font-medium text-white truncate">{user.name}</p>
            <p className="text-xs text-gray-400 truncate">{user.email}</p>
          </div>
        )}
        <button
          onClick={() => dispatch(logout())}
          className="flex items-center gap-3 w-full px-2 py-2 text-sm text-gray-400 hover:text-white hover:bg-gray-800 rounded-md transition-colors"
        >
          <LogOut className="w-4 h-4 flex-shrink-0" />
          {sidebarOpen && 'Cerrar sesión'}
        </button>
      </div>
    </aside>
  );
}