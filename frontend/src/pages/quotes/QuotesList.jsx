import { useEffect, useState } from 'react';
import { useDispatch } from 'react-redux';
import { Plus, Search, Eye, Edit2, Trash2, FileText, ArrowRight } from 'lucide-react';
import { quotesApi } from '../../api/quotes.api';
import { showToast } from '../../store/slices/uiSlice';
import { useDebounce } from '../../utils/useDebounce';
import { formatCurrency, formatDate } from '../../utils/format';
import Button from '../../components/common/Button';
import Card from '../../components/common/Card';
import Badge from '../../components/common/Badge';
import Spinner from '../../components/common/Spinner';
import Pagination from '../../components/common/Pagination';
import ConfirmDialog from '../../components/common/ConfirmDialog';
import Modal from '../../components/common/Modal';
import QuoteForm from './QuoteForm';
import QuoteDetail from './QuoteDetail';

export default function QuotesList() {
  const dispatch = useDispatch();
  const [quotes, setQuotes] = useState([]);
  const [meta, setMeta] = useState(null);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [page, setPage] = useState(1);
  const debouncedSearch = useDebounce(search);

  const [formOpen, setFormOpen] = useState(false);
  const [editing, setEditing] = useState(null);
  const [detailId, setDetailId] = useState(null);
  const [deleteTarget, setDeleteTarget] = useState(null);

  const load = async () => {
    setLoading(true);
    try {
      const { data } = await quotesApi.list({
        page, limit: 10,
        search: debouncedSearch,
        status: statusFilter || undefined,
      });
      setQuotes(data.data.data);
      setMeta(data.data.meta);
    } catch (err) {
      dispatch(showToast({ type: 'error', message: 'Error al cargar cotizaciones' }));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, [debouncedSearch, page, statusFilter]);
  useEffect(() => { setPage(1); }, [debouncedSearch, statusFilter]);

  const handleDelete = async () => {
    try {
      await quotesApi.remove(deleteTarget.id);
      dispatch(showToast({ type: 'success', message: 'Cotización eliminada' }));
      setDeleteTarget(null);
      load();
    } catch (err) {
      dispatch(showToast({
        type: 'error',
        message: err.response?.data?.message || 'Error al eliminar',
      }));
      setDeleteTarget(null);
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-primary-100 rounded-lg">
            <FileText className="w-5 h-5 text-primary-600" />
          </div>
          <div>
            <h2 className="text-xl font-bold text-gray-800">Cotizaciones</h2>
            <p className="text-sm text-gray-500">{meta?.total || 0} cotizaciones</p>
          </div>
        </div>
        <Button onClick={() => { setEditing(null); setFormOpen(true); }}>
          <Plus className="w-4 h-4" />
          Nueva cotización
        </Button>
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
            <option value="draft">Borrador</option>
            <option value="sent">Enviadas</option>
            <option value="approved">Aprobadas</option>
            <option value="rejected">Rechazadas</option>
            <option value="converted">Convertidas</option>
          </select>
        </div>
      </Card>

      <Card className="!p-0 overflow-hidden">
        {loading ? (
          <Spinner />
        ) : quotes.length === 0 ? (
          <div className="p-12 text-center text-gray-500">
            <FileText className="w-12 h-12 mx-auto mb-3 text-gray-300" />
            <p>No hay cotizaciones</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  <th className="text-left px-6 py-3 text-xs font-medium text-gray-500 uppercase">Código</th>
                  <th className="text-left px-6 py-3 text-xs font-medium text-gray-500 uppercase">Cliente</th>
                  <th className="text-left px-6 py-3 text-xs font-medium text-gray-500 uppercase">Vendedor</th>
                  <th className="text-left px-6 py-3 text-xs font-medium text-gray-500 uppercase">Estado</th>
                  <th className="text-right px-6 py-3 text-xs font-medium text-gray-500 uppercase">Total</th>
                  <th className="text-left px-6 py-3 text-xs font-medium text-gray-500 uppercase">Vence</th>
                  <th className="text-right px-6 py-3 text-xs font-medium text-gray-500 uppercase">Acciones</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {quotes.map((q) => (
                  <tr key={q.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 text-sm font-mono font-medium text-gray-800">{q.code}</td>
                    <td className="px-6 py-4 text-sm text-gray-700">{q.client?.name}</td>
                    <td className="px-6 py-4 text-sm text-gray-600">{q.seller?.name}</td>
                    <td className="px-6 py-4"><Badge status={q.status} /></td>
                    <td className="px-6 py-4 text-right text-sm font-semibold text-gray-800">
                      {formatCurrency(q.total)}
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-600">{formatDate(q.valid_until)}</td>
                    <td className="px-6 py-4 text-right">
                      <button
                        onClick={() => setDetailId(q.id)}
                        className="p-2 hover:bg-gray-100 text-gray-600 rounded-md"
                        title="Ver detalle"
                      >
                        <Eye className="w-4 h-4" />
                      </button>
                      {q.status === 'draft' && (
                        <>
                          <button
                            onClick={() => { setEditing(q); setFormOpen(true); }}
                            className="p-2 hover:bg-blue-50 text-blue-600 rounded-md ml-1"
                          >
                            <Edit2 className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => setDeleteTarget(q)}
                            className="p-2 hover:bg-red-50 text-red-600 rounded-md ml-1"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
        <Pagination meta={meta} onPageChange={setPage} />
      </Card>

      <QuoteForm
        open={formOpen}
        onClose={() => setFormOpen(false)}
        quote={editing}
        onSaved={load}
      />

      <Modal
        open={!!detailId}
        onClose={() => setDetailId(null)}
        title="Detalle de cotización"
        size="lg"
      >
        {detailId && <QuoteDetail quoteId={detailId} onRefresh={load} />}
      </Modal>

      <ConfirmDialog
        open={!!deleteTarget}
        onClose={() => setDeleteTarget(null)}
        onConfirm={handleDelete}
        title="Eliminar cotización"
        message={`¿Eliminar la cotización ${deleteTarget?.code}?`}
      />
    </div>
  );
}