import { useEffect, useState } from 'react';
import { Plus, Trash2 } from 'lucide-react';
import { useDispatch } from 'react-redux';
import { quotesApi } from '../../api/quotes.api';
import { clientsApi } from '../../api/clients.api';
import { productsApi } from '../../api/products.api';
import { showToast } from '../../store/slices/uiSlice';
import { formatCurrency } from '../../utils/format';
import Modal from '../../components/common/Modal';
import Button from '../../components/common/Button';
import Input from '../../components/common/Input';

const emptyItem = {
  product_id: '',
  description: '',
  quantity: 1,
  unit_price: 0,
  tax_rate: 16,
  discount: 0,
};

export default function QuoteForm({ open, onClose, quote, onSaved }) {
  const dispatch = useDispatch();
  const [clients, setClients] = useState([]);
  const [products, setProducts] = useState([]);
  const [saving, setSaving] = useState(false);

  const [form, setForm] = useState({
    client_id: '',
    valid_until: '',
    notes: '',
    discount: 0,
    items: [{ ...emptyItem }],
  });

  useEffect(() => {
    if (open) {
      clientsApi.list({ limit: 100 }).then(({ data }) => setClients(data.data.data));
      productsApi.list({ limit: 200, is_active: true }).then(({ data }) => setProducts(data.data.data));

      if (quote) {
        quotesApi.getById(quote.id).then(({ data }) => {
          const q = data.data;
          setForm({
            client_id: q.client_id,
            valid_until: q.valid_until || '',
            notes: q.notes || '',
            discount: q.discount || 0,
            items: q.items.map((it) => ({
              product_id: it.product_id,
              description: it.description || '',
              quantity: Number(it.quantity),
              unit_price: Number(it.unit_price),
              tax_rate: Number(it.tax_rate),
              discount: Number(it.discount),
            })),
          });
        });
      } else {
        setForm({
          client_id: '',
          valid_until: '',
          notes: '',
          discount: 0,
          items: [{ ...emptyItem }],
        });
      }
    }
  }, [open, quote]);

  const handleProductChange = (index, productId) => {
    const product = products.find((p) => p.id === Number(productId));
    const newItems = [...form.items];
    newItems[index] = {
      ...newItems[index],
      product_id: productId,
      unit_price: product ? Number(product.price) : 0,
      tax_rate: product ? Number(product.tax_rate) : 16,
      description: product?.name || '',
    };
    setForm({ ...form, items: newItems });
  };

  const updateItem = (index, field, value) => {
    const newItems = [...form.items];
    newItems[index][field] = value;
    setForm({ ...form, items: newItems });
  };

  const addItem = () => {
    setForm({ ...form, items: [...form.items, { ...emptyItem }] });
  };

  const removeItem = (index) => {
    if (form.items.length === 1) return;
    setForm({ ...form, items: form.items.filter((_, i) => i !== index) });
  };

  // Cálculos en vivo
  const calculateTotals = () => {
    let subtotal = 0, taxTotal = 0;
    form.items.forEach((it) => {
      const qty = Number(it.quantity) || 0;
      const price = Number(it.unit_price) || 0;
      const disc = Number(it.discount) || 0;
      const rate = Number(it.tax_rate) || 0;
      const line = qty * price - disc;
      subtotal += line;
      taxTotal += line * (rate / 100);
    });
    const total = subtotal + taxTotal - (Number(form.discount) || 0);
    return { subtotal, taxTotal, total };
  };

  const totals = calculateTotals();

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!form.client_id) {
      return dispatch(showToast({ type: 'error', message: 'Selecciona un cliente' }));
    }
    if (form.items.some((it) => !it.product_id || !it.quantity)) {
      return dispatch(showToast({ type: 'error', message: 'Completa todos los ítems' }));
    }

    setSaving(true);
    try {
      const payload = {
        client_id: Number(form.client_id),
        valid_until: form.valid_until || null,
        notes: form.notes || null,
        discount: Number(form.discount),
        items: form.items.map((it) => ({
          product_id: Number(it.product_id),
          description: it.description || null,
          quantity: Number(it.quantity),
          unit_price: Number(it.unit_price),
          tax_rate: Number(it.tax_rate),
          discount: Number(it.discount),
        })),
      };

      if (quote) {
        await quotesApi.update(quote.id, payload);
        dispatch(showToast({ type: 'success', message: 'Cotización actualizada' }));
      } else {
        await quotesApi.create(payload);
        dispatch(showToast({ type: 'success', message: 'Cotización creada' }));
      }
      onClose();
      onSaved();
    } catch (err) {
      dispatch(showToast({
        type: 'error',
        message: err.response?.data?.message || 'Error al guardar',
      }));
    } finally {
      setSaving(false);
    }
  };

  return (
    <Modal
      open={open}
      onClose={onClose}
      title={quote ? 'Editar cotización' : 'Nueva cotización'}
      size="xl"
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="label">Cliente *</label>
            <select
              className="input"
              value={form.client_id}
              onChange={(e) => setForm({ ...form, client_id: e.target.value })}
              required
            >
              <option value="">Selecciona un cliente</option>
              {clients.map((c) => (
                <option key={c.id} value={c.id}>{c.name}</option>
              ))}
            </select>
          </div>
          <Input
            label="Válida hasta"
            type="date"
            value={form.valid_until}
            onChange={(e) => setForm({ ...form, valid_until: e.target.value })}
          />
        </div>

        {/* Items */}
        <div>
          <div className="flex items-center justify-between mb-2">
            <label className="label !mb-0">Ítems *</label>
            <Button type="button" variant="secondary" onClick={addItem} className="!py-1.5 !px-3 text-xs">
              <Plus className="w-3 h-3" />
              Agregar ítem
            </Button>
          </div>

          <div className="border border-gray-200 rounded-lg overflow-hidden">
            <table className="w-full text-sm">
              <thead className="bg-gray-50">
                <tr>
                  <th className="text-left px-3 py-2 text-xs font-medium text-gray-500">Producto</th>
                  <th className="text-right px-3 py-2 text-xs font-medium text-gray-500 w-20">Cant.</th>
                  <th className="text-right px-3 py-2 text-xs font-medium text-gray-500 w-28">Precio</th>
                  <th className="text-right px-3 py-2 text-xs font-medium text-gray-500 w-20">IVA %</th>
                  <th className="text-right px-3 py-2 text-xs font-medium text-gray-500 w-24">Desc.</th>
                  <th className="text-right px-3 py-2 text-xs font-medium text-gray-500 w-28">Subtotal</th>
                  <th className="w-10"></th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {form.items.map((item, index) => {
                  const lineTotal = (Number(item.quantity) || 0) * (Number(item.unit_price) || 0) - (Number(item.discount) || 0);
                  return (
                    <tr key={index}>
                      <td className="px-3 py-2">
                        <select
                          className="input !py-1.5 text-sm"
                          value={item.product_id}
                          onChange={(e) => handleProductChange(index, e.target.value)}
                          required
                        >
                          <option value="">Selecciona...</option>
                          {products.map((p) => (
                            <option key={p.id} value={p.id}>
                              {p.sku} - {p.name} ({formatCurrency(p.price)})
                            </option>
                          ))}
                        </select>
                      </td>
                      <td className="px-3 py-2">
                        <input
                          type="number"
                          min="0.01"
                          step="0.01"
                          className="input !py-1.5 text-sm text-right"
                          value={item.quantity}
                          onChange={(e) => updateItem(index, 'quantity', e.target.value)}
                        />
                      </td>
                      <td className="px-3 py-2">
                        <input
                          type="number"
                          min="0"
                          step="0.01"
                          className="input !py-1.5 text-sm text-right"
                          value={item.unit_price}
                          onChange={(e) => updateItem(index, 'unit_price', e.target.value)}
                        />
                      </td>
                      <td className="px-3 py-2">
                        <input
                          type="number"
                          min="0"
                          step="0.01"
                          className="input !py-1.5 text-sm text-right"
                          value={item.tax_rate}
                          onChange={(e) => updateItem(index, 'tax_rate', e.target.value)}
                        />
                      </td>
                      <td className="px-3 py-2">
                        <input
                          type="number"
                          min="0"
                          step="0.01"
                          className="input !py-1.5 text-sm text-right"
                          value={item.discount}
                          onChange={(e) => updateItem(index, 'discount', e.target.value)}
                        />
                      </td>
                      <td className="px-3 py-2 text-right font-medium text-gray-800">
                        {formatCurrency(lineTotal)}
                      </td>
                      <td className="px-3 py-2">
                        <button
                          type="button"
                          onClick={() => removeItem(index)}
                          disabled={form.items.length === 1}
                          className="p-1.5 hover:bg-red-50 text-red-600 rounded-md disabled:opacity-30 disabled:cursor-not-allowed"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>

        {/* Totales y notas */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="label">Notas</label>
            <textarea
              className="input"
              rows={4}
              value={form.notes}
              onChange={(e) => setForm({ ...form, notes: e.target.value })}
              placeholder="Observaciones, condiciones, etc."
            />
          </div>
          <div className="bg-gray-50 rounded-lg p-4 space-y-2">
            <div className="flex justify-between text-sm">
              <span className="text-gray-600">Subtotal:</span>
              <span className="font-medium">{formatCurrency(totals.subtotal)}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-gray-600">IVA:</span>
              <span className="font-medium">{formatCurrency(totals.taxTotal)}</span>
            </div>
            <div className="flex justify-between text-sm items-center gap-3">
              <span className="text-gray-600">Descuento global:</span>
              <input
                type="number"
                min="0"
                step="0.01"
                className="input !py-1 !px-2 w-32 text-right text-sm"
                value={form.discount}
                onChange={(e) => setForm({ ...form, discount: e.target.value })}
              />
            </div>
            <div className="flex justify-between pt-2 border-t border-gray-200">
              <span className="font-semibold text-gray-800">Total:</span>
              <span className="font-bold text-primary-600 text-lg">{formatCurrency(totals.total)}</span>
            </div>
          </div>
        </div>

        <div className="flex justify-end gap-2 pt-4 border-t border-gray-100">
          <Button type="button" variant="secondary" onClick={onClose}>Cancelar</Button>
          <Button type="submit" loading={saving}>
            {quote ? 'Actualizar' : 'Crear cotización'}
          </Button>
        </div>
      </form>
    </Modal>
  );
}