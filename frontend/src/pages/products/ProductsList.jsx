import { useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { Plus, Search, Edit2, Power, Package, Filter } from 'lucide-react';
import { productsApi, categoriesApi } from '../../api/products.api';
import { showToast } from '../../store/slices/uiSlice';
import { useDebounce } from '../../utils/useDebounce';
import { formatCurrency } from '../../utils/format';
import Button from '../../components/common/Button';
import Card from '../../components/common/Card';
import Badge from '../../components/common/Badge';
import Spinner from '../../components/common/Spinner';
import Pagination from '../../components/common/Pagination';
import ProductForm from './ProductForm';

export default function ProductsList() {
  const dispatch = useDispatch();
  const { user } = useSelector((s) => s.auth);
  const canEdit = ['admin', 'supervisor'].includes(user?.role);

  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [meta, setMeta] = useState(null);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('');
  const [page, setPage] = useState(1);
  const debouncedSearch = useDebounce(search);

  const [formOpen, setFormOpen] = useState(false);
  const [editing, setEditing] = useState(null);

  const load = async () => {
    setLoading(true);
    try {
      const { data } = await productsApi.list({
        page,
        limit: 10,
        search: debouncedSearch,
        category_id: categoryFilter || undefined,
      });
      setProducts(data.data.data);
      setMeta(data.data.meta);
    } catch (err) {
      dispatch(showToast({ type: 'error', message: 'Error al cargar productos' }));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    categoriesApi.list().then(({ data }) => setCategories(data.data));
  }, []);

  useEffect(() => { load(); }, [debouncedSearch, page, categoryFilter]);
  useEffect(() => { setPage(1); }, [debouncedSearch, categoryFilter]);

  const handleToggle = async (product) => {
    try {
      await productsApi.update(product.id, { is_active: !product.is_active });
      dispatch(showToast({ type: 'success', message: product.is_active ? 'Producto desactivado' : 'Producto activado' }));
      load();
    } catch (err) {
      dispatch(showToast({ type: 'error', message: 'Error al actualizar' }));
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-primary-100 rounded-lg">
            <Package className="w-5 h-5 text-primary-600" />
          </div>
          <div>
            <h2 className="text-xl font-bold text-gray-800">Productos</h2>
            <p className="text-sm text-gray-500">{meta?.total || 0} productos</p>
          </div>
        </div>
        {canEdit && (
          <Button onClick={() => { setEditing(null); setFormOpen(true); }}>
            <Plus className="w-4 h-4" />
            Nuevo producto
          </Button>
        )}
      </div>

      <Card className="!py-4">
        <div className="flex flex-wrap items-center gap-3">
          <div className="relative flex-1 min-w-[240px]">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              type="text"
              placeholder="Buscar por nombre o SKU..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="input pl-10"
            />
          </div>
          <select
            value={categoryFilter}
            onChange={(e) => setCategoryFilter(e.target.value)}
            className="input max-w-[200px]"
          >
            <option value="">Todas las categorías</option>
            {categories.map((c) => (
              <option key={c.id} value={c.id}>{c.name}</option>
            ))}
          </select>
        </div>
      </Card>

      <Card className="!p-0 overflow-hidden">
        {loading ? (
          <Spinner />
        ) : products.length === 0 ? (
          <div className="p-12 text-center text-gray-500">
            <Package className="w-12 h-12 mx-auto mb-3 text-gray-300" />
            <p>No hay productos</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  <th className="text-left px-6 py-3 text-xs font-medium text-gray-500 uppercase">SKU</th>
                  <th className="text-left px-6 py-3 text-xs font-medium text-gray-500 uppercase">Producto</th>
                  <th className="text-left px-6 py-3 text-xs font-medium text-gray-500 uppercase">Categoría</th>
                  <th className="text-right px-6 py-3 text-xs font-medium text-gray-500 uppercase">Precio</th>
                  <th className="text-center px-6 py-3 text-xs font-medium text-gray-500 uppercase">Stock</th>
                  <th className="text-center px-6 py-3 text-xs font-medium text-gray-500 uppercase">Estado</th>
                  <th className="text-right px-6 py-3 text-xs font-medium text-gray-500 uppercase">Acciones</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {products.map((p) => (
                  <tr key={p.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 text-sm font-mono text-gray-600">{p.sku}</td>
                    <td className="px-6 py-4">
                      <p className="text-sm font-medium text-gray-800">{p.name}</p>
                      <p className="text-xs text-gray-500 capitalize">{p.type}</p>
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-600">
                      {p.category?.name || '-'}
                    </td>
                    <td className="px-6 py-4 text-sm font-medium text-right text-gray-800">
                      {formatCurrency(p.price)}
                    </td>
                    <td className="px-6 py-4 text-sm text-center">
                      {p.type === 'service' ? '-' : p.stock}
                    </td>
                    <td className="px-6 py-4 text-center">
                      <span className={`inline-flex px-2 py-0.5 rounded-full text-xs font-medium ${
                        p.is_active ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-600'
                      }`}>
                        {p.is_active ? 'Activo' : 'Inactivo'}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-right">
                      {canEdit && (
                        <>
                          <button
                            onClick={() => { setEditing(p); setFormOpen(true); }}
                            className="p-2 hover:bg-blue-50 text-blue-600 rounded-md"
                          >
                            <Edit2 className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => handleToggle(p)}
                            className={`p-2 rounded-md ml-1 ${
                              p.is_active
                                ? 'hover:bg-red-50 text-red-600'
                                : 'hover:bg-green-50 text-green-600'
                            }`}
                            title={p.is_active ? 'Desactivar' : 'Activar'}
                          >
                            <Power className="w-4 h-4" />
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

      <ProductForm
        open={formOpen}
        onClose={() => setFormOpen(false)}
        product={editing}
        categories={categories}
        onSaved={load}
      />
    </div>
  );
}