import { useEffect, useState } from 'react';
import { useDispatch } from 'react-redux';
import { Plus, Edit2, Trash2, FolderTree } from 'lucide-react';
import { categoriesApi } from '../../api/products.api';
import { showToast } from '../../store/slices/uiSlice';
import Button from '../../components/common/Button';
import Card from '../../components/common/Card';
import Modal from '../../components/common/Modal';
import ConfirmDialog from '../../components/common/ConfirmDialog';
import Input from '../../components/common/Input';
import Spinner from '../../components/common/Spinner';

export default function CategoriesList() {
  const dispatch = useDispatch();
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState(null);
  const [name, setName] = useState('');
  const [saving, setSaving] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState(null);

  const load = async () => {
    setLoading(true);
    try {
      const { data } = await categoriesApi.list();
      setCategories(data.data);
    } catch (err) {
      dispatch(showToast({ type: 'error', message: 'Error al cargar categorías' }));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, []);

  const openCreate = () => {
    setEditing(null);
    setName('');
    setModalOpen(true);
  };

  const openEdit = (cat) => {
    setEditing(cat);
    setName(cat.name);
    setModalOpen(true);
  };

  const handleSave = async () => {
    if (!name.trim()) return;
    setSaving(true);
    try {
      if (editing) {
        await categoriesApi.update(editing.id, { name });
        dispatch(showToast({ type: 'success', message: 'Categoría actualizada' }));
      } else {
        await categoriesApi.create({ name });
        dispatch(showToast({ type: 'success', message: 'Categoría creada' }));
      }
      setModalOpen(false);
      load();
    } catch (err) {
      dispatch(showToast({
        type: 'error',
        message: err.response?.data?.message || 'Error al guardar',
      }));
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    try {
      await categoriesApi.remove(deleteTarget.id);
      dispatch(showToast({ type: 'success', message: 'Categoría eliminada' }));
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
            <FolderTree className="w-5 h-5 text-primary-600" />
          </div>
          <div>
            <h2 className="text-xl font-bold text-gray-800">Categorías</h2>
            <p className="text-sm text-gray-500">{categories.length} categorías</p>
          </div>
        </div>
        <Button onClick={openCreate}>
          <Plus className="w-4 h-4" />
          Nueva categoría
        </Button>
      </div>

      <Card className="!p-0">
        {loading ? (
          <Spinner />
        ) : categories.length === 0 ? (
          <div className="p-12 text-center text-gray-500">
            <FolderTree className="w-12 h-12 mx-auto mb-3 text-gray-300" />
            <p>No hay categorías. Crea la primera.</p>
          </div>
        ) : (
          <table className="w-full">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="text-left px-6 py-3 text-xs font-medium text-gray-500 uppercase">Nombre</th>
                <th className="text-left px-6 py-3 text-xs font-medium text-gray-500 uppercase">Productos</th>
                <th className="text-right px-6 py-3 text-xs font-medium text-gray-500 uppercase">Acciones</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {categories.map((cat) => (
                <tr key={cat.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 text-sm font-medium text-gray-800">{cat.name}</td>
                  <td className="px-6 py-4 text-sm text-gray-600">{cat.products_count}</td>
                  <td className="px-6 py-4 text-right">
                    <button
                      onClick={() => openEdit(cat)}
                      className="p-2 hover:bg-blue-50 text-blue-600 rounded-md"
                    >
                      <Edit2 className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => setDeleteTarget(cat)}
                      className="p-2 hover:bg-red-50 text-red-600 rounded-md ml-1"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </Card>

      <Modal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        title={editing ? 'Editar categoría' : 'Nueva categoría'}
        size="sm"
      >
        <Input
          label="Nombre"
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="Ej: Electrónica"
          autoFocus
        />
        <div className="flex justify-end gap-2 mt-6">
          <Button variant="secondary" onClick={() => setModalOpen(false)}>Cancelar</Button>
          <Button onClick={handleSave} loading={saving}>
            {editing ? 'Actualizar' : 'Crear'}
          </Button>
        </div>
      </Modal>

      <ConfirmDialog
        open={!!deleteTarget}
        onClose={() => setDeleteTarget(null)}
        onConfirm={handleDelete}
        title="Eliminar categoría"
        message={`¿Estás seguro de eliminar "${deleteTarget?.name}"? Esta acción no se puede deshacer.`}
        confirmText="Eliminar"
      />
    </div>
  );
}