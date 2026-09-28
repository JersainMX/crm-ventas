import { useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { Plus, Search, Edit2, Trash2, Users, Eye } from 'lucide-react';
import { clientsApi } from '../../api/clients.api';
import { showToast } from '../../store/slices/uiSlice';
import { useDebounce } from '../../utils/useDebounce';
import { formatDate, STATUS_LABELS } from '../../utils/format';
import Button from '../../components/common/Button';
import Card from '../../components/common/Card';
import Input from '../../components/common/Input';
import Modal from '../../components/common/Modal';
import Badge from '../../components/common/Badge';
import Spinner from '../../components/common/Spinner';
import Pagination from '../../components/common/Pagination';
import ConfirmDialog from '../../components/common/ConfirmDialog';
import ClientForm from './ClientForm';
import ClientDetail from './ClientDetail';

export default function ClientsList() {
  const dispatch = useDispatch();
  const { user } = useSelector((s) => s.auth);
  const [clients, setClients] = useState([]);
  const [meta, setMeta] = useState(null);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const [statusFilter, setStatusFilter] = useState('');
  const debouncedSearch = useDebounce(search);

  const [formOpen, setFormOpen] = useState(false);
  const [editing, setEditing] = useState(null);
  const [detailOpen, setDetailOpen] = useState(false);
  const [selected, setSelected] = useState(null);
  const [deleteTarget, setDeleteTarget] = useState(null);

  const load = async () => {
    setLoading(true);
    try {
      const { data } = await clientsApi.list({
        page,
        limit: 10,
        search: debouncedSearch,
        status: statusFilter || undefined,
      });
      setClients(data.data.data);
      setMeta(data.data.meta);
    } catch (err) {
      dispatch(showToast({ type: 'error', message: 'Error al cargar clientes' }));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, [debouncedSearch, page, statusFilter]);
  useEffect(() => { setPage(1); }, [debouncedSearch, statusFilter]);

  const handleDelete = async () => {
    try {
      await clientsApi.remove(deleteTarget.id);
      dispatch(showToast({ type: 'success', message: 'Cliente eliminado' }));
      setDeleteTarget(null);
      load();
    } catch (err) {
      dispatch(showToast({ type: 'error', message: 'Error al eliminar' }));
      setDeleteTarget(null);
    }
  };

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-primary-100 rounded-lg">
            <Users className="w-5 h-5 text-primary-600" />
          </div>
          <div>
            <h2 className="text-xl font-bold text-gray-800">Clientes</h2>
            <p className="text-sm text-gray-500">{meta?.total || 0} clientes</p>
          </div>
        </div>
        <Button onClick={() => { setEditing(null); setFormOpen(true); }}>
          <Plus className="w-4 h-4" />
          Nuevo cliente
        </Button>
      </div>

      {/* Filtros */}
      <Card className="!py-4">
        <div className="flex flex-wrap items-center gap-3">
          <div className="relative flex-1 min-w-[240px]">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              type="text"
              placeholder="Buscar por nombre, email o RFC..."
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
            <option value="">Todos los estados</option>
            <option value="prospect">Prospectos</option>
            <option value="active">Activos</option>
            <option value="inactive">Inactivos</option>
          </select>
        </div>
      </Card>

      {/* Tabla */}
      <Card className="!p-0 overflow-hidden">
        {loading ? (
          <Spinner />
        ) : clients.length === 0 ? (
          <div className="p-12 text-center text-gray-500">
            <Users className="w-12 h-12 mx-auto mb-3 text-gray-300" />
            <p>No hay clientes que coincidan</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  <th className="text-left px-6 py-3 text-xs font-medium text-gray-500 uppercase">Cliente</th>
                  <th className="text-left px-6 py-3 text-xs font-medium text-gray-500 uppercase">Contacto</th>
                  <th className="text-left px-6 py-3 text-xs font-medium text-gray-500 uppercase">Estado</th>
                  <th className="text-left px-6 py-3 text-xs font-medium text-gray-500 uppercase">Registro</th>
                  <th className="text-right px-6 py-3 text-xs font-medium text-gray-500 uppercase">Acciones</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {clients.map((c) => (
                  <tr key={c.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-full bg-primary-100 text-primary-600 flex items-center justify-center font-semibold text-sm">
                          {c.name.charAt(0).toUpperCase()}
                        </div>
                        <div>
                          <p className="text-sm font-medium text-gray-800">{c.name}</p>
                          <p className="text-xs text-gray-500">{c.tax_id || 'Sin RFC'}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <p className="text-sm text-gray-700">{c.email || '-'}</p>
                      <p className="text-xs text-gray-500">{c.phone || '-'}</p>
                    </td>
                    <td className="px-6 py-4">
                      <Badge status={c.status} />
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-600">{formatDate(c.created_at)}</td>
                    <td className="px-6 py-4 text-right">
                      <button
                        onClick={() => { setSelected(c); setDetailOpen(true); }}
                        className="p-2 hover:bg-gray-100 text-gray-600 rounded-md"
                        title="Ver detalle"
                      >
                        <Eye className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => { setEditing(c); setFormOpen(true); }}
                        className="p-2 hover:bg-blue-50 text-blue-600 rounded-md ml-1"
                        title="Editar"
                      >
                        <Edit2 className="w-4 h-4" />
                      </button>
                      {user?.role !== 'seller' && (
                        <button
                          onClick={() => setDeleteTarget(c)}
                          className="p-2 hover:bg-red-50 text-red-600 rounded-md ml-1"
                          title="Eliminar"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
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

      <ClientForm
        open={formOpen}
        onClose={() => setFormOpen(false)}
        client={editing}
        onSaved={load}
      />

      <Modal
        open={detailOpen}
        onClose={() => setDetailOpen(false)}
        title="Detalle del cliente"
        size="lg"
      >
        {selected && (
          <ClientDetail clientId={selected.id} />
        )}
      </Modal>

      <ConfirmDialog
        open={!!deleteTarget}
        onClose={() => setDeleteTarget(null)}
        onConfirm={handleDelete}
        title="Eliminar cliente"
        message={`¿Eliminar a "${deleteTarget?.name}"? Esta acción no se puede deshacer.`}
      />
    </div>
  );
}