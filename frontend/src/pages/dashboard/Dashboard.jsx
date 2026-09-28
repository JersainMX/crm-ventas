import { useEffect, useState } from 'react';
import {
  DollarSign, ShoppingCart, Users, TrendingUp, TrendingDown,
  Package, Clock, AlertCircle,
} from 'lucide-react';
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
} from 'recharts';
import { reportsApi } from '../../api/reports.api';
import { formatCurrency } from '../../utils/format';
import Card from '../../components/common/Card';
import Spinner from '../../components/common/Spinner';

export default function Dashboard() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    reportsApi.dashboard()
      .then(({ data }) => setData(data.data))
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <Spinner size="lg" />;
  if (!data) return <p className="text-gray-500">Sin datos disponibles</p>;

  const { kpis, sales_trend } = data;

  const kpiCards = [
    {
      label: 'Ventas del período',
      value: formatCurrency(kpis.sales_total),
      icon: DollarSign,
      color: 'bg-blue-500',
      growth: kpis.growth_rate,
    },
    {
      label: 'Órdenes',
      value: kpis.orders_count,
      icon: ShoppingCart,
      color: 'bg-green-500',
    },
    {
      label: 'Ticket promedio',
      value: formatCurrency(kpis.avg_ticket),
      icon: TrendingUp,
      color: 'bg-purple-500',
    },
    {
      label: 'Clientes activos',
      value: kpis.active_clients,
      icon: Users,
      color: 'bg-orange-500',
    },
    {
      label: 'Facturado',
      value: formatCurrency(kpis.invoiced_total),
      icon: Package,
      color: 'bg-indigo-500',
    },
    {
      label: 'Cobrado',
      value: formatCurrency(kpis.collected_total),
      icon: DollarSign,
      color: 'bg-emerald-500',
    },
    {
      label: 'Por cobrar',
      value: formatCurrency(kpis.pending_receivable),
      icon: Clock,
      color: 'bg-red-500',
    },
    {
      label: 'Clientes nuevos',
      value: kpis.new_clients,
      icon: Users,
      color: 'bg-pink-500',
    },
  ];

  const chartData = sales_trend.map((t) => ({
    date: new Date(t.date).toLocaleDateString('es-MX', { day: '2-digit', month: 'short' }),
    total: Number(t.total),
  }));

  return (
    <div className="space-y-6">
      {/* KPIs */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {kpiCards.map((kpi) => (
          <Card key={kpi.label}>
            <div className="flex items-start justify-between">
              <div className="flex-1">
                <p className="text-sm text-gray-500">{kpi.label}</p>
                <p className="text-2xl font-bold text-gray-800 mt-1">{kpi.value}</p>
                {kpi.growth !== undefined && (
                  <div className={`flex items-center gap-1 mt-2 text-xs ${
                    kpi.growth >= 0 ? 'text-green-600' : 'text-red-600'
                  }`}>
                    {kpi.growth >= 0 ? (
                      <TrendingUp className="w-3 h-3" />
                    ) : (
                      <TrendingDown className="w-3 h-3" />
                    )}
                    {kpi.growth.toFixed(1)}% vs mes anterior
                  </div>
                )}
              </div>
              <div className={`p-3 rounded-lg ${kpi.color}`}>
                <kpi.icon className="w-5 h-5 text-white" />
              </div>
            </div>
          </Card>
        ))}
      </div>

      {/* Chart */}
      <Card>
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-gray-800">Ventas últimos 30 días</h3>
        </div>
        {chartData.length > 0 ? (
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
              <XAxis dataKey="date" tick={{ fontSize: 12 }} stroke="#9ca3af" />
              <YAxis tick={{ fontSize: 12 }} stroke="#9ca3af" />
              <Tooltip
                formatter={(v) => [formatCurrency(v), 'Ventas']}
                contentStyle={{ borderRadius: 8, border: '1px solid #e5e7eb' }}
              />
              <Line
                type="monotone"
                dataKey="total"
                stroke="#2563eb"
                strokeWidth={2}
                dot={{ r: 3 }}
                activeDot={{ r: 5 }}
              />
            </LineChart>
          </ResponsiveContainer>
        ) : (
          <div className="flex flex-col items-center justify-center py-12 text-gray-400">
            <AlertCircle className="w-8 h-8 mb-2" />
            <p className="text-sm">Sin ventas en los últimos 30 días</p>
          </div>
        )}
      </Card>
    </div>
  );
}