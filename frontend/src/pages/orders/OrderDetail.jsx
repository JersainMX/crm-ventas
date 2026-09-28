import { useEffect, useState } from 'react';
import { useDispatch } from 'react-redux';
import { CheckCircle, Truck, XCircle, Receipt } from 'lucide-react';
import { ordersApi } from '../../api/orders.api';
import { invoicesApi } from '../../api/invoices.api';
import { showToast } from '../../store/slices/uiSlice';
import { formatCurrency, formatDate } from '../../utils/format';
import Button from '../../components/common/Button';
import Badge from '../../components/common/Badge';
import Spinner from '../../components/common/Spinner';

export default function OrderDetail({ orderId, onRefresh }) {
  const dispatch = useDispatch();
  const [order, setOrder] = useState(null);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);

  const load = async () => {
    setLoading(true);
    try {
      const { data } = await ordersApi.getById(orderId);
      setOrder(data.data);
    } catch (err) {
      dispatch(showToast({ type: 'error', message: 'Error al cargar' }));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, [orderId]);

  const changeStatus = async (status) => {
    setActionLoading(true);
    try {
      await ordersApi.changeStatus(order.id, status);
      dispatch(showToast({ type: 'success', message: 'Estado actualizado' }));
      load();
      onRefresh?.();
    } catch (err) {
      dispatch(showToast({
        type: 'error',
        message: err.response?.data?.message || 'Error',
      }));
    } finally {
      setActionLoading(false);
    }
  };

  const generateInvoice = async () => {
    setActionLoading(true);
    try {
      const { data } = await invoicesApi.createFromOrder({ order_id: order.id });
      dispatch(showToast({
        type: 'success',
        message: `Factura ${data.data.code} generada`,
      }));
    } catch (err) {
      dispatch(showToast({
        type: 'error',
        message: err.response?.data?.message || 'Error al facturar',
      }));
    } finally {
      setActionLoading(false);
    }
  };

  if (loading) return <Spinner />;
  if (!order) return <p>Orden no encontrada</p>;

  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between">
        <div>
          <p className="text-sm text-gray-500">Orden de venta</p>
          <h3 className="text-2xl font-bold font-mono text-gray-800">{order.code}</h3>
          <div className="mt-2 flex items-center gap-2">
            <Badge status={order.status} />
            <span className="text-xs text-gray-500">{formatDate(order.created_at)}</span>
          </div>
        </div>
        <div className="text-right">
          <p className="text-sm text-gray-500">Total</p>
          <p className="text-2xl font-bold text-primary-600">{formatCurrency(order.total)}</p>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4 p-4 bg-gray-50 rounded-lg">
        <div>
          <p className="text-xs text-gray-500 uppercase">Cliente</p>
          <p className="text-sm font-medium text-gray-800">{order.client?.name}</p>
          <p className="text-xs text-gray-500">{order.client?.email}</p>
        </div>
        <div>
          <p className="text-xs text-gray-500 uppercase">Vendedor</p>
          <p className="text-sm font-medium text-gray-800">{order.seller?.name}</p>
        </div>
      </div>

      {order.quote && (
        <div className="text-sm text-gray-600">
          Generada desde cotización:{' '}
          <span className="font-mono font-medium">{order.quote.code}</span>
        </div>
      )}

      <div>
        <h4 className="font-semibold text-gray-700 mb-2">Ítems</h4>
        <div className="border border-gray-200 rounded-lg overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-gray-50">
              <tr>
                <th className="text-left px-4 py-2 text-xs text-gray-500 font-medium">Producto</th>
                <th className="text-right px-4 py-2 text-xs text-gray-500 font-medium">Cant.</th>
                <th className="text-right px-4 py-2 text-xs text-gray-500 font-medium">Precio</th>
                <th className="text-right px-4 py-2 text-xs text-gray-500 font-medium">Total</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {order.items?.map((item) => (
                <tr key={item.id}>
                  <td className="px-4 py-2 font-medium text-gray-800">
                    {item.product?.name || item.description}
                  </td>
                  <td className="px-4 py-2 text-right">{Number(item.quantity)}</td>
                  <td className="px-4 py-2 text-right">{formatCurrency(item.unit_price)}</td>
                  <td className="px-4 py-2 text-right font-medium">
                    {formatCurrency(item.line_total)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <div className="flex justify-end">
        <div className="w-64 space-y-1 text-sm">
          <div className="flex justify-between text-gray-600">
            <span>Subtotal:</span><span>{formatCurrency(order.subtotal)}</span>
          </div>
          <div className="flex justify-between text-gray-600">
            <span>IVA:</span><span>{formatCurrency(order.tax_total)}</span>
          </div>
          <div className="flex justify-between text-gray-600">
            <span>Descuento:</span><span>-{formatCurrency(order.discount)}</span>
          </div>
          <div className="flex justify-between pt-2 border-t border-gray-200 font-semibold text-base">
            <span>Total:</span>
            <span className="text-primary-600">{formatCurrency(order.total)}</span>
          </div>
        </div>
      </div>

      <div className="flex flex-wrap justify-end gap-2 pt-4 border-t border-gray-100">
        {order.status === 'pending' && (
          <>
            <Button variant="danger" onClick={() => changeStatus('cancelled')} loading={actionLoading}>
              <XCircle className="w-4 h-4" />
              Cancelar
            </Button>
            <Button onClick={() => changeStatus('confirmed')} loading={actionLoading}>
              <CheckCircle className="w-4 h-4" />
              Confirmar
            </Button>
          </>
        )}
        {order.status === 'confirmed' && (
          <>
            <Button onClick={generateInvoice} loading={actionLoading}>
              <Receipt className="w-4 h-4" />
              Generar factura
            </Button>
            <Button onClick={() => changeStatus('delivered')} loading={actionLoading}>
              <Truck className="w-4 h-4" />
              Marcar entregada
            </Button>
          </>
        )}
      </div>
    </div>
  );
}