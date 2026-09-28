import { useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { Plus, Edit2, Power, Key, Settings, Search } from 'lucide-react';
import { usersApi } from '../../api/users.api';
import { showToast } from '../../store/slices/uiSlice';
import { useDebounce } from '../../utils/useDebounce';
import { formatDate } from '../../utils/format';
import Button from '../../components/common/Button';
import Card from '../../components/common/Card';
import Spinner from '../../components/common/Spinner';
import Pagination from '../../components/common/Pagination';
import Input from '../../components/common/Input';
import Modal from '../../components/common/Modal';
import UserForm from './UserForm';

export default function UsersList() {
  const dispatch = useDispatch();
  const { user: currentUser } = useSelector((s) => s.auth);
  const [users, setUsers] = useState([]);
  const [meta, setMeta] = useState(null);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const debouncedSearch = useDebounce(search);

  const [formOpen, setFormOpen] = useState(false);
  const [editing, setEditing] = useState(null);
  const [pwdTarget, setPwdTarget] = useState(null);
  const [newPassword, setNewPassword] = useState('');
  const [saving, setSaving] = useState(false);

  const load = async () => {
    setLoading(true);
    try {
      const { data } = await usersApi.list({ page, limit: 10, search: debouncedSearch });
      setUsers(data.data.data);
      setMeta(data.data.meta);
    } catch (err) {
      dispatch(showToast({ type: 'error', message: 'Error al cargar usuarios' }));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, [debouncedSearch, page]);
  useEffect(() => { setPage(1); }, [debouncedSearch]);

  const handleToggle = async (u) => {
    try {
      await usersApi.toggleActive(u.id);
      dispatch(showToast({ type: 'success', message: u.is_active ? 'Usuario desactivado' : 'Usuario activado' }));
      load();
    } catch (err) {
      dispatch(showToast({
        type: 'error',
        message: err.response?.data?.message || 'Error',
      }));
    }
  };

  const handleChangePassword = async () => {
    if (newPassword.length < 8) {
      return dispatch(showToast({ type: 'error', message: 'Mínimo 8 caracteres' }));
    }
    setSaving(true);
    try {
      await usersApi.changePassword(pwdTarget.id, newPassword);
      dispatch(showToast({ type: 'success', message: 'Contraseña actualizada' }));
      setPwdTarget(null);
      setNewPassword('');
    } catch (err) {
      dispatch(showToast({ type: 'error', message: 'Error al cambiar contraseña' }));
    } finally {
      setSaving(false);
    }
  };

  const roleLabels = {
    admin: 'Administrador',
    supervisor: 'Supervisor',
    seller: 'Vendedor',
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-primary-100 rounded-lg">
            <Settings className="w-5 h-5 text-primary-600" />
          </div>
          <div>
            <h2 className="text-xl font-bold text-gray-800">Usuarios</h2>
            <p className="text-sm text-gray-500">{meta?.total || 0} usuarios</p>
          </div>
        </div>
        <Button onClick={() => { setEditing(null); setFormOpen(true); }}>
          <Plus className="w-4 h-4" />
          Nuevo usuario
        </Button>
      </div>

      <Card className="!py-4">
        <div className="relative max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input
            type="text"
            placeholder="Buscar por nombre o email..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="input pl-10"
          />
        </div>
      </Card>

      <Card className="!p-0 overflow-hidden">
        {loading ? (
          <Spinner />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  <th className="text-left px-6 py-3 text-xs font-medium text-gray-500 uppercase">Usuario</th>
                  <th className="text-left px-6 py-3 text-xs font-medium text-gray-500 uppercase">Rol</th>
                  <th className="text-center px-6 py-3 text-xs font-medium text-gray-500 uppercase">Estado</th>
                  <th className="text-left px-6 py-3 text-xs font-medium text-gray-500 uppercase">Registro</th>
                  <th className="text-right px-6 py-3 text-xs font-medium text-gray-500 uppercase">Acciones</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {users.map((u) => (
                  <tr key={u.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-full bg-primary-100 text-primary-600 flex items-center justify-center font-semibold text-sm">
                          {u.name.charAt(0).toUpperCase()}
                        </div>
                        <div>
                          <p className="text-sm font-medium text-gray-800">{u.name}</p>
                          <p className="text-xs text-gray-500">{u.email}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-700">{roleLabels[u.role]}</td>
                    <td className="px-6 py-4 text-center">
                      <span className={`inline-flex px-2 py-0.5 rounded-full text-xs font-medium ${
                        u.is_active ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-600'
                      }`}>
                        {u.is_active ? 'Activo' : 'Inactivo'}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-600">{formatDate(u.created_at)}</td>
                    <td className="px-6 py-4 text-right">
                      <button
                        onClick={() => { setEditing(u); setFormOpen(true); }}
                        className="p-2 hover:bg-blue-50 text-blue-600 rounded-md"
                        title="Editar"
                      >
                        <Edit2 className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => setPwdTarget(u)}
                        className="p-2 hover:bg-yellow-50 text-yellow-600 rounded-md ml-1"
                        title="Cambiar contraseña"
                      >
                        <Key className="w-4 h-4" />
                      </button>
                      {u.id !== currentUser.id && (
                        <button
                          onClick={() => handleToggle(u)}
                          className={`p-2 rounded-md ml-1 ${
                            u.is_active
                              ? 'hover:bg-red-50 text-red-600'
                              : 'hover:bg-green-50 text-green-600'
                          }`}
                          title={u.is_active ? 'Desactivar' : 'Activar'}
                        >
                          <Power className="w-4 h-4" />
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

      <UserForm
        open={formOpen}
        onClose={() => setFormOpen(false)}
        user={editing}
        onSaved={load}
      />

      <Modal
        open={!!pwdTarget}
        onClose={() => { setPwdTarget(null); setNewPassword(''); }}
        title={`Cambiar contraseña a ${pwdTarget?.name}`}
        size="sm"
      >
        <Input
          label="Nueva contraseña"
          type="password"
          value={newPassword}
          onChange={(e) => setNewPassword(e.target.value)}
          placeholder="Mínimo 8 caracteres"
        />
        <div className="flex justify-end gap-2 mt-6">
          <Button variant="secondary" onClick={() => { setPwdTarget(null); setNewPassword(''); }}>
            Cancelar
          </Button>
          <Button onClick={handleChangePassword} loading={saving}>Cambiar</Button>
        </div>
      </Modal>
    </div>
  );
}