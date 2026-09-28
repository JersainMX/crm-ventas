import { useEffect, useState } from 'react';
import { useDispatch } from 'react-redux';
import { ShoppingCart, Eye, Search } from 'lucide-react';
import { ordersApi } from '../../api/orders.api';
import { showToast } from '../../store/slices/uiSlice';
import { useDebounce } from '../../utils/useDebounce';
import { formatCurrency, formatDate } from '../../utils/format';
import Card from '../../components/common/Card';
import Badge from '../../components/common/Badge';
import Spinner from '../../components/common/Spinner';
import Pagination from '../../components/common/Pagination';
import Modal from '../../components/common/Modal';
import OrderDetail from './OrderDetail';

export default function OrdersList() {
  const dispatch = useDispatch();
  const [orders, setOrders] = useState([]);
  const [meta, setMeta] = useState(null);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [page, setPage] = useState(1);
  const [detailId, setDetailId] = useState(null);
  const debouncedSearch = useDebounce(search);

  const load = async () => {
    setLoading(true);
    try {
      const { data } = await ordersApi.list({
        page, limit: 10,
        search: debouncedSearch,
        status: statusFilter || undefined,
      });
      setOrders(data.data.data);
      setMeta(data.data.meta);
    } catch (err) {
      dispatch(showToast({ type: 'error', message: 'Error al cargar órdenes' }));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, [debouncedSearch, page, statusFilter]);
  useEffect(() => { setPage(1); }, [debouncedSearch, statusFilter]);

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-3">
        <div className="p-2 bg-primary-100 rounded-lg">
          <ShoppingCart className="w-5 h-5 text-primary-600" />
        </div>
        <div>
          <h2 className="text-xl font-bold text-gray-800">Órdenes de Venta</h2>
          <p className="text-sm text-gray-500">{meta?.total || 0} órdenes</p>
        </div>
      </div>

      <Card className="!py-4">
        <div className="flex flex-wrap items-center gap-3">
          <div className="relative flex-1 min-w-[240px]">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              type="text"
              placeholder="Buscar por código..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="input pl-10"
            />
          </div>
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="input max-w-[180px]"
          >
            <option value="">Todos</option>
            <option value="pending">Pendientes</option>
            <option value="confirmed">Confirmadas</option>
            <option value="delivered">Entregadas</option>
            <option value="cancelled">Canceladas</option>
          </select>
        </div>
      </Card>

      <Card className="!p-0 overflow-hidden">
        {loading ? (
          <Spinner />
        ) : orders.length === 0 ? (
          <div className="p-12 text-center text-gray-500">
            <ShoppingCart className="w-12 h-12 mx-auto mb-3 text-gray-300" />
            <p>No hay órdenes</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  <th className="text-left px-6 py-3 text-xs font-medium text-gray-500 uppercase">Código</th>
                  <th className="text-left px-6 py-3 text-xs font-medium text-gray-500 uppercase">Cliente</th>
                  <th className="text-left px-6 py-3 text-xs font-medium text-gray-500 uppercase">Estado</th>
                  <th className="text-right px-6 py-3 text-xs font-medium text-gray-500 uppercase">Total</th>
                  <th className="text-left px-6 py-3 text-xs font-medium text-gray-500 uppercase">Fecha</th>
                  <th className="text-right px-6 py-3 text-xs font-medium text-gray-500 uppercase">Acciones</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {orders.map((o) => (
                  <tr key={o.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 text-sm font-mono font-medium text-gray-800">{o.code}</td>
                    <td className="px-6 py-4 text-sm text-gray-700">{o.client?.name}</td>
                    <td className="px-6 py-4"><Badge status={o.status} /></td>
                    <td className="px-6 py-4 text-right text-sm font-semibold text-gray-800">
                      {formatCurrency(o.total)}
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-600">{formatDate(o.created_at)}</td>
                    <td className="px-6 py-4 text-right">
                      <button
                        onClick={() => setDetailId(o.id)}
                        className="p-2 hover:bg-gray-100 text-gray-600 rounded-md"
                      >
                        <Eye className="w-4 h-4" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
        <Pagination meta={meta} onPageChange={setPage} />
      </Card>

      <Modal
        open={!!detailId}
        onClose={() => setDetailId(null)}
        title="Detalle de orden"
        size="lg"
      >
        {detailId && <OrderDetail orderId={detailId} onRefresh={load} />}
      </Modal>
    </div>
  );
}