import { useEffect, useState } from 'react';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, Legend, LineChart, Line,
} from 'recharts';
import { reportsApi } from '../../api/reports.api';
import { formatCurrency } from '../../utils/format';
import Card from '../../components/common/Card';
import Spinner from '../../components/common/Spinner';
import Input from '../../components/common/Input';
import Button from '../../components/common/Button';

const COLORS = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899'];

export default function Reports() {
  const today = new Date();
  const firstDay = new Date(today.getFullYear(), today.getMonth(), 1);

  const [from, setFrom] = useState(firstDay.toISOString().slice(0, 10));
  const [to, setTo] = useState(today.toISOString().slice(0, 10));

  const [data, setData] = useState({
    byPeriod: [],
    bySeller: [],
    byClient: [],
    topProducts: [],
    accountsReceivable: null,
    summary: null,
  });
  const [loading, setLoading] = useState(true);

  const load = async () => {
    setLoading(true);
    try {
      const params = { from, to };
      const [period, seller, client, products, ar, summary] = await Promise.all([
        reportsApi.salesByPeriod({ ...params, group: 'day' }),
        reportsApi.salesBySeller(params),
        reportsApi.salesByClient({ ...params, limit: 10 }),
        reportsApi.topProducts({ ...params, limit: 10 }),
        reportsApi.accountsReceivable(),
        reportsApi.financialSummary(params),
      ]);

      setData({
        byPeriod: period.data.data.data,
        bySeller: seller.data.data.data,
        byClient: client.data.data.data,
        topProducts: products.data.data.data,
        accountsReceivable: ar.data.data,
        summary: summary.data.data,
      });
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, []);

  if (loading) return <Spinner size="lg" />;

  return (
    <div className="space-y-6">
      {/* Filtros */}
      <Card>
        <div className="flex flex-wrap items-end gap-3">
          <Input
            label="Desde"
            type="date"
            value={from}
            onChange={(e) => setFrom(e.target.value)}
          />
          <Input
            label="Hasta"
            type="date"
            value={to}
            onChange={(e) => setTo(e.target.value)}
          />
          <Button onClick={load}>Aplicar filtros</Button>
        </div>
      </Card>

      {/* Resumen financiero */}
      {data.summary && (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card>
            <p className="text-sm text-gray-500">Ventas brutas</p>
            <p className="text-2xl font-bold text-gray-800 mt-1">
              {formatCurrency(data.summary.sales.gross)}
            </p>
          </Card>
          <Card>
            <p className="text-sm text-gray-500">Facturado</p>
            <p className="text-2xl font-bold text-blue-600 mt-1">
              {formatCurrency(data.summary.invoices.invoiced)}
            </p>
          </Card>
          <Card>
            <p className="text-sm text-gray-500">Cobrado</p>
            <p className="text-2xl font-bold text-green-600 mt-1">
              {formatCurrency(data.summary.invoices.collected)}
            </p>
          </Card>
          <Card>
            <p className="text-sm text-gray-500">Por cobrar</p>
            <p className="text-2xl font-bold text-red-600 mt-1">
              {formatCurrency(data.summary.invoices.pending)}
            </p>
          </Card>
        </div>
      )}

      {/* Ventas por período */}
      <Card>
        <h3 className="text-lg font-semibold text-gray-800 mb-4">Ventas por día</h3>
        {data.byPeriod.length > 0 ? (
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={data.byPeriod.map((d) => ({ ...d, total: Number(d.total) }))}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
              <XAxis dataKey="period" tick={{ fontSize: 12 }} />
              <YAxis tick={{ fontSize: 12 }} />
              <Tooltip formatter={(v) => formatCurrency(v)} />
              <Line type="monotone" dataKey="total" stroke="#3b82f6" strokeWidth={2} />
            </LineChart>
          </ResponsiveContainer>
        ) : (
          <p className="text-gray-400 text-center py-8">Sin datos</p>
        )}
      </Card>

      {/* Top productos y clientes */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <h3 className="text-lg font-semibold text-gray-800 mb-4">Top productos</h3>
          {data.topProducts.length > 0 ? (
            <ResponsiveContainer width="100%" height={300}>
              <BarChart
                data={data.topProducts.slice(0, 6).map((p) => ({
                  name: p.product_name.substring(0, 20),
                  revenue: Number(p.total_revenue),
                }))}
                layout="vertical"
              >
                <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                <XAxis type="number" tick={{ fontSize: 11 }} />
                <YAxis dataKey="name" type="category" width={120} tick={{ fontSize: 11 }} />
                <Tooltip formatter={(v) => formatCurrency(v)} />
                <Bar dataKey="revenue" fill="#3b82f6" radius={[0, 4, 4, 0]} />
              </BarChart>
            </ResponsiveContainer>
          ) : (
            <p className="text-gray-400 text-center py-8">Sin datos</p>
          )}
        </Card>

        <Card>
          <h3 className="text-lg font-semibold text-gray-800 mb-4">Ventas por vendedor</h3>
          {data.bySeller.length > 0 ? (
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={data.bySeller.map((s) => ({
                    name: s.seller_name,
                    value: Number(s.total_sales),
                  }))}
                  cx="50%"
                  cy="50%"
                  outerRadius={90}
                  dataKey="value"
                  label={(entry) => entry.name}
                >
                  {data.bySeller.map((_, index) => (
                    <Cell key={index} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip formatter={(v) => formatCurrency(v)} />
                <Legend />
              </PieChart>
            </ResponsiveContainer>
          ) : (
            <p className="text-gray-400 text-center py-8">Sin datos</p>
          )}
        </Card>
      </div>

      {/* Cuentas por cobrar */}
      {data.accountsReceivable && (
        <Card>
          <h3 className="text-lg font-semibold text-gray-800 mb-4">Cuentas por cobrar</h3>
          <div className="grid grid-cols-1 md:grid-cols-5 gap-3 mb-4">
            {Object.entries(data.accountsReceivable.summary.buckets).map(([key, val]) => (
              <div key={key} className="p-3 bg-gray-50 rounded-lg">
                <p className="text-xs text-gray-500 uppercase">
                  {key === 'current' ? 'Al día' : `${key} días`}
                </p>
                <p className="text-lg font-semibold text-gray-800 mt-1">
                  {formatCurrency(val)}
                </p>
              </div>
            ))}
          </div>

          {data.accountsReceivable.data.length > 0 ? (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="text-left px-4 py-2 text-xs text-gray-500 font-medium">Factura</th>
                    <th className="text-left px-4 py-2 text-xs text-gray-500 font-medium">Cliente</th>
                    <th className="text-left px-4 py-2 text-xs text-gray-500 font-medium">Vencimiento</th>
                    <th className="text-right px-4 py-2 text-xs text-gray-500 font-medium">Saldo</th>
                    <th className="text-center px-4 py-2 text-xs text-gray-500 font-medium">Estado</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {data.accountsReceivable.data.slice(0, 10).map((inv) => (
                    <tr key={inv.invoice_id}>
                      <td className="px-4 py-2 font-mono">{inv.invoice_code}</td>
                      <td className="px-4 py-2">{inv.client.name}</td>
                      <td className="px-4 py-2">{inv.due_date || '-'}</td>
                      <td className="px-4 py-2 text-right font-medium">
                        {formatCurrency(inv.balance)}
                      </td>
                      <td className="px-4 py-2 text-center">
                        <span className={`inline-flex px-2 py-0.5 rounded-full text-xs font-medium ${
                          inv.bucket === 'current'
                            ? 'bg-green-100 text-green-700'
                            : 'bg-red-100 text-red-700'
                        }`}>
                          {inv.bucket === 'current' ? 'Al día' : `${inv.days_overdue}d`}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <p className="text-gray-400 text-center py-4">Sin facturas pendientes</p>
          )}
        </Card>
      )}
    </div>
  );
}