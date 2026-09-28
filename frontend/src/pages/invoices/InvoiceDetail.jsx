import { useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { DollarSign, Ban } from 'lucide-react';
import { invoicesApi } from '../../api/invoices.api';
import { showToast } from '../../store/slices/uiSlice';
import { formatCurrency, formatDate } from '../../utils/format';
import Button from '../../components/common/Button';
import Badge from '../../components/common/Badge';
import Spinner from '../../components/common/Spinner';
import Modal from '../../components/common/Modal';
import Input from '../../components/common/Input';

export default function InvoiceDetail({ invoiceId, onRefresh }) {
  const dispatch = useDispatch();
  const { user } = useSelector((s) => s.auth);
  const [invoice, setInvoice] = useState(null);
  const [loading, setLoading] = useState(true);
  const [paymentOpen, setPaymentOpen] = useState(false);
  const [voidOpen, setVoidOpen] = useState(false);
  const [actionLoading, setActionLoading] = useState(false);

  const [payment, setPayment] = useState({ amount: '', method: 'cash', reference: '' });
  const [voidReason, setVoidReason] = useState('');

  const load = async () => {
    setLoading(true);
    try {
      const { data } = await invoicesApi.getById(invoiceId);
      setInvoice(data.data);
    } catch (err) {
      dispatch(showToast({ type: 'error', message: 'Error al cargar' }));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, [invoiceId]);

  const handlePayment = async () => {
    setActionLoading(true);
    try {
      await invoicesApi.registerPayment(invoice.id, {
        amount: Number(payment.amount),
        method: payment.method,
        reference: payment.reference || null,
      });
      dispatch(showToast({ type: 'success', message: 'Pago registrado' }));
      setPaymentOpen(false);
      setPayment({ amount: '', method: 'cash', reference: '' });
      load();
      onRefresh?.();
    } catch (err) {
      dispatch(showToast({
        type: 'error',
        message: err.response?.data?.message || 'Error al registrar',
      }));
    } finally {
      setActionLoading(false);
    }
  };

  const handleVoid = async () => {
    setActionLoading(true);
    try {
      await invoicesApi.void(invoice.id, voidReason);
      dispatch(showToast({ type: 'success', message: 'Factura anulada' }));
      setVoidOpen(false);
      setVoidReason('');
      load();
      onRefresh?.();
    } catch (err) {
      dispatch(showToast({
        type: 'error',
        message: err.response?.data?.message || 'Error al anular',
      }));
    } finally {
      setActionLoading(false);
    }
  };

  if (loading) return <Spinner />;
  if (!invoice) return <p>Factura no encontrada</p>;

  const balance = Number(invoice.total) - Number(invoice.paid_amount);
  const canPay = invoice.status !== 'paid' && invoice.status !== 'void' && balance > 0;
  const canVoid = ['issued', 'overdue'].includes(invoice.status)
    && Number(invoice.paid_amount) === 0
    && ['admin', 'supervisor'].includes(user?.role);

  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between">
        <div>
          <p className="text-sm text-gray-500">Factura</p>
          <h3 className="text-2xl font-bold font-mono text-gray-800">{invoice.code}</h3>
          <div className="mt-2 flex items-center gap-2">
            <Badge status={invoice.status} />
            <span className="text-xs text-gray-500">{formatDate(invoice.created_at)}</span>
          </div>
        </div>
        <div className="text-right">
          <p className="text-sm text-gray-500">Total</p>
          <p className="text-2xl font-bold text-primary-600">{formatCurrency(invoice.total)}</p>
        </div>
      </div>

      <div className="grid grid-cols-3 gap-4 p-4 bg-gray-50 rounded-lg">
        <div>
          <p className="text-xs text-gray-500 uppercase">Total</p>
          <p className="text-lg font-semibold text-gray-800">{formatCurrency(invoice.total)}</p>
        </div>
        <div>
          <p className="text-xs text-gray-500 uppercase">Pagado</p>
          <p className="text-lg font-semibold text-green-600">{formatCurrency(invoice.paid_amount)}</p>
        </div>
        <div>
          <p className="text-xs text-gray-500 uppercase">Saldo</p>
          <p className="text-lg font-semibold text-red-600">{formatCurrency(balance)}</p>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4 text-sm">
        <div>
          <p className="text-xs text-gray-500 uppercase mb-1">Cliente</p>
          <p className="font-medium text-gray-800">{invoice.client?.name}</p>
          <p className="text-gray-500">{invoice.client?.email}</p>
        </div>
        <div>
          <p className="text-xs text-gray-500 uppercase mb-1">Fechas</p>
          <p className="text-gray-700">Emisión: {formatDate(invoice.created_at)}</p>
          <p className="text-gray-700">Vence: {formatDate(invoice.due_date)}</p>
          {invoice.paid_at && (
            <p className="text-green-600">Pagada: {formatDate(invoice.paid_at)}</p>
          )}
        </div>
      </div>

      {invoice.payments?.length > 0 && (
        <div>
          <h4 className="font-semibold text-gray-700 mb-2">Pagos registrados</h4>
          <div className="border border-gray-200 rounded-lg overflow-hidden">
            <table className="w-full text-sm">
              <thead className="bg-gray-50">
                <tr>
                  <th className="text-left px-4 py-2 text-xs text-gray-500 font-medium">Fecha</th>
                  <th className="text-left px-4 py-2 text-xs text-gray-500 font-medium">Método</th>
                  <th className="text-left px-4 py-2 text-xs text-gray-500 font-medium">Referencia</th>
                  <th className="text-left px-4 py-2 text-xs text-gray-500 font-medium">Registrado por</th>
                  <th className="text-right px-4 py-2 text-xs text-gray-500 font-medium">Monto</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {invoice.payments.map((p) => (
                  <tr key={p.id}>
                    <td className="px-4 py-2 text-gray-600">{formatDate(p.created_at)}</td>
                    <td className="px-4 py-2 text-gray-700 capitalize">{p.method}</td>
                    <td className="px-4 py-2 text-gray-600 font-mono text-xs">{p.reference || '-'}</td>
                    <td className="px-4 py-2 text-gray-600">{p.created_by_user?.name}</td>
                    <td className="px-4 py-2 text-right font-medium">{formatCurrency(p.amount)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      <div className="flex flex-wrap justify-end gap-2 pt-4 border-t border-gray-100">
        {canVoid && (
          <Button variant="danger" onClick={() => setVoidOpen(true)}>
            <Ban className="w-4 h-4" />
            Anular
          </Button>
        )}
        {canPay && (
          <Button onClick={() => setPaymentOpen(true)}>
            <DollarSign className="w-4 h-4" />
            Registrar pago
          </Button>
        )}
      </div>

      {/* Modal pago */}
      <Modal
        open={paymentOpen}
        onClose={() => setPaymentOpen(false)}
        title="Registrar pago"
        size="sm"
      >
        <div className="space-y-4">
          <div className="p-3 bg-blue-50 rounded-md text-sm text-blue-800">
            Saldo pendiente: <strong>{formatCurrency(balance)}</strong>
          </div>
          <Input
            label="Monto *"
            type="number"
            step="0.01"
            value={payment.amount}
            onChange={(e) => setPayment({ ...payment, amount: e.target.value })}
            placeholder={balance.toFixed(2)}
          />
          <div>
            <label className="label">Método</label>
            <select
              className="input"
              value={payment.method}
              onChange={(e) => setPayment({ ...payment, method: e.target.value })}
            >
              <option value="cash">Efectivo</option>
              <option value="card">Tarjeta</option>
              <option value="transfer">Transferencia</option>
              <option value="check">Cheque</option>
              <option value="other">Otro</option>
            </select>
          </div>
          <Input
            label="Referencia"
            value={payment.reference}
            onChange={(e) => setPayment({ ...payment, reference: e.target.value })}
            placeholder="Ej: TRF-12345"
          />
          <div className="flex justify-end gap-2 pt-2">
            <Button variant="secondary" onClick={() => setPaymentOpen(false)}>Cancelar</Button>
            <Button onClick={handlePayment} loading={actionLoading}>Registrar</Button>
          </div>
        </div>
      </Modal>

      {/* Modal anular */}
      <Modal
        open={voidOpen}
        onClose={() => setVoidOpen(false)}
        title="Anular factura"
        size="sm"
      >
        <div className="space-y-4">
          <div className="p-3 bg-red-50 rounded-md text-sm text-red-800">
            Esta acción no se puede deshacer. La factura quedará anulada.
          </div>
          <div>
            <label className="label">Motivo *</label>
            <textarea
              className="input"
              rows={3}
              value={voidReason}
              onChange={(e) => setVoidReason(e.target.value)}
              placeholder="Ej: Cliente canceló la compra"
            />
          </div>
          <div className="flex justify-end gap-2 pt-2">
            <Button variant="secondary" onClick={() => setVoidOpen(false)}>Cancelar</Button>
            <Button
              variant="danger"
              onClick={handleVoid}
              loading={actionLoading}
              disabled={voidReason.trim().length < 3}
            >
              Anular factura
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}