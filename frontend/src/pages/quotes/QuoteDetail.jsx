import { useEffect, useState } from 'react';
import { useDispatch } from 'react-redux';
import { Send, CheckCircle, XCircle, ArrowRight } from 'lucide-react';
import { quotesApi } from '../../api/quotes.api';
import { showToast } from '../../store/slices/uiSlice';
import { formatCurrency, formatDate } from '../../utils/format';
import Button from '../../components/common/Button';
import Badge from '../../components/common/Badge';
import Spinner from '../../components/common/Spinner';

export default function QuoteDetail({ quoteId, onRefresh }) {
  const dispatch = useDispatch();
  const [quote, setQuote] = useState(null);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);

  const load = async () => {
    setLoading(true);
    try {
      const { data } = await quotesApi.getById(quoteId);
      setQuote(data.data);
    } catch (err) {
      dispatch(showToast({ type: 'error', message: 'Error al cargar' }));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, [quoteId]);

  const changeStatus = async (status) => {
    setActionLoading(true);
    try {
      await quotesApi.changeStatus(quote.id, status);
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

  const convert = async () => {
    setActionLoading(true);
    try {
      const { data } = await quotesApi.convert(quote.id);
      dispatch(showToast({
        type: 'success',
        message: `Orden ${data.data.code} generada`,
      }));
      load();
      onRefresh?.();
    } catch (err) {
      dispatch(showToast({
        type: 'error',
        message: err.response?.data?.message || 'Error al convertir',
      }));
    } finally {
      setActionLoading(false);
    }
  };

  if (loading) return <Spinner />;
  if (!quote) return <p>Cotización no encontrada</p>;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <p className="text-sm text-gray-500">Cotización</p>
          <h3 className="text-2xl font-bold font-mono text-gray-800">{quote.code}</h3>
          <div className="mt-2 flex items-center gap-2">
            <Badge status={quote.status} />
            <span className="text-xs text-gray-500">
              {formatDate(quote.created_at)}
            </span>
          </div>
        </div>
        <div className="text-right">
          <p className="text-sm text-gray-500">Total</p>
          <p className="text-2xl font-bold text-primary-600">
            {formatCurrency(quote.total)}
          </p>
        </div>
      </div>

      {/* Cliente / Vendedor */}
      <div className="grid grid-cols-2 gap-4 p-4 bg-gray-50 rounded-lg">
        <div>
          <p className="text-xs text-gray-500 uppercase">Cliente</p>
          <p className="text-sm font-medium text-gray-800">{quote.client?.name}</p>
          <p className="text-xs text-gray-500">{quote.client?.email}</p>
        </div>
        <div>
          <p className="text-xs text-gray-500 uppercase">Vendedor</p>
          <p className="text-sm font-medium text-gray-800">{quote.seller?.name}</p>
          <p className="text-xs text-gray-500">{quote.seller?.email}</p>
        </div>
      </div>

      {/* Items */}
      <div>
        <h4 className="font-semibold text-gray-700 mb-2">Ítems</h4>
        <div className="border border-gray-200 rounded-lg overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-gray-50">
              <tr>
                <th className="text-left px-4 py-2 text-xs text-gray-500 font-medium">Producto</th>
                <th className="text-right px-4 py-2 text-xs text-gray-500 font-medium">Cant.</th>
                <th className="text-right px-4 py-2 text-xs text-gray-500 font-medium">Precio</th>
                <th className="text-right px-4 py-2 text-xs text-gray-500 font-medium">IVA</th>
                <th className="text-right px-4 py-2 text-xs text-gray-500 font-medium">Total</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {quote.items?.map((item) => (
                <tr key={item.id}>
                  <td className="px-4 py-2">
                    <p className="font-medium text-gray-800">{item.product?.name || item.description}</p>
                    <p className="text-xs text-gray-500">{item.product?.sku}</p>
                  </td>
                  <td className="px-4 py-2 text-right">{Number(item.quantity)}</td>
                  <td className="px-4 py-2 text-right">{formatCurrency(item.unit_price)}</td>
                  <td className="px-4 py-2 text-right">{item.tax_rate}%</td>
                  <td className="px-4 py-2 text-right font-medium">
                    {formatCurrency(item.line_total)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Totales */}
      <div className="flex justify-end">
        <div className="w-64 space-y-1 text-sm">
          <div className="flex justify-between text-gray-600">
            <span>Subtotal:</span>
            <span>{formatCurrency(quote.subtotal)}</span>
          </div>
          <div className="flex justify-between text-gray-600">
            <span>IVA:</span>
            <span>{formatCurrency(quote.tax_total)}</span>
          </div>
          <div className="flex justify-between text-gray-600">
            <span>Descuento:</span>
            <span>-{formatCurrency(quote.discount)}</span>
          </div>
          <div className="flex justify-between pt-2 border-t border-gray-200 font-semibold text-base">
            <span>Total:</span>
            <span className="text-primary-600">{formatCurrency(quote.total)}</span>
          </div>
        </div>
      </div>

      {/* Actions */}
      <div className="flex flex-wrap justify-end gap-2 pt-4 border-t border-gray-100">
        {quote.status === 'draft' && (
          <Button onClick={() => changeStatus('sent')} loading={actionLoading}>
            <Send className="w-4 h-4" />
            Enviar
          </Button>
        )}
        {quote.status === 'sent' && (
          <>
            <Button variant="danger" onClick={() => changeStatus('rejected')} loading={actionLoading}>
              <XCircle className="w-4 h-4" />
              Rechazar
            </Button>
            <Button onClick={() => changeStatus('approved')} loading={actionLoading}>
              <CheckCircle className="w-4 h-4" />
              Aprobar
            </Button>
          </>
        )}
        {quote.status === 'approved' && (
          <Button onClick={convert} loading={actionLoading}>
            <ArrowRight className="w-4 h-4" />
            Convertir a orden
          </Button>
        )}
      </div>
    </div>
  );
}