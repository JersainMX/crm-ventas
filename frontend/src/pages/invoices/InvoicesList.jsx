import { useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { Receipt, Eye, Search } from 'lucide-react';
import { invoicesApi } from '../../api/invoices.api';
import { showToast } from '../../store/slices/uiSlice';
import { useDebounce } from '../../utils/useDebounce';
import { formatCurrency, formatDate } from '../../utils/format';
import Card from '../../components/common/Card';
import Badge from '../../components/common/Badge';
import Spinner from '../../components/common/Spinner';
import Pagination from '../../components/common/Pagination';
import Modal from '../../components/common/Modal';
import InvoiceDetail from './InvoiceDetail';

export default function InvoicesList() {
  const dispatch = useDispatch();
  const [invoices, setInvoices] = useState([]);
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
      const { data } = await invoicesApi.list({
        page, limit: 10,
        search: debouncedSearch,
        status: statusFilter || undefined,
      });
      setInvoices(data.data.data);
      setMeta(data.data.meta);
    } catch (err) {
      dispatch(showToast({ type: 'error', message: 'Error al cargar facturas' }));
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
          <Receipt className="w-5 h-5 text-primary-600" />
        </div>
        <div>
          <h2 className="text-xl font-bold text-gray-800">Facturas</h2>
          <p className="text-sm text-gray-500">{meta?.total || 0} facturas</p>
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
            <option value="">Todas</option>
            <option value="issued">Emitidas</option>
            <option value="paid">Pagadas</option>
            <option value="overdue">Vencidas</option>
            <option value="void">Anuladas</option>
          </select>
        </div>
      </Card>

      <Card className="!p-0 overflow-hidden">
        {loading ? (
          <Spinner />
        ) : invoices.length === 0 ? (
          <div className="p-12 text-center text-gray-500">
            <Receipt className="w-12 h-12 mx-auto mb-3 text-gray-300" />
            <p>No hay facturas</p>
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
                  <th className="text-right px-6 py-3 text-xs font-medium text-gray-500 uppercase">Pagado</th>
                  <th className="text-left px-6 py-3 text-xs font-medium text-gray-500 uppercase">Vence</th>
                  <th className="text-right px-6 py-3 text-xs font-medium text-gray-500 uppercase">Acciones</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {invoices.map((inv) => (
                  <tr key={inv.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 text-sm font-mono font-medium text-gray-800">{inv.code}</td>
                    <td className="px-6 py-4 text-sm text-gray-700">{inv.client?.name}</td>
                    <td className="px-6 py-4"><Badge status={inv.status} /></td>
                    <td className="px-6 py-4 text-right text-sm font-semibold text-gray-800">
                      {formatCurrency(inv.total)}
                    </td>
                    <td className="px-6 py-4 text-right text-sm text-green-600 font-medium">
                      {formatCurrency(inv.paid_amount)}
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-600">{formatDate(inv.due_date)}</td>
                    <td className="px-6 py-4 text-right">
                      <button
                        onClick={() => setDetailId(inv.id)}
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
        title="Detalle de factura"
        size="lg"
      >
        {detailId && <InvoiceDetail invoiceId={detailId} onRefresh={load} />}
      </Modal>
    </div>
  );
}