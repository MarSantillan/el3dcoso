'use client';

import { useState, useEffect } from 'react';
import { TrendingUp, TrendingDown, DollarSign, ClipboardCheck, AlertTriangle } from 'lucide-react';

export default function Dashboard({ setActiveTab }) {
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchStats();
  }, []);

  const fetchStats = async () => {
    try {
      setLoading(true);
      const res = await fetch('/api/dashboard');
      const data = await res.json();
      if (res.ok) setStats(data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return <div className="text-center py-10 text-gray-500 font-medium">Cargando estadísticas...</div>;
  }

  if (!stats) {
    return <div className="text-center py-10 text-red-500">Error al cargar estadísticas.</div>;
  }

  return (
    <div className="space-y-6 pb-20">
      {/* Saludo y Balance */}
      <div className="bg-gradient-to-br from-blue-600 to-indigo-700 p-6 rounded-3xl text-white shadow-lg space-y-4">
        <div>
          <span className="text-xs text-blue-100 font-semibold tracking-wide uppercase">Ganancia Neta de Ventas</span>
          <h2 className="text-4xl font-black mt-1">
            ${Math.round(stats.totalNetProfitFromSales).toLocaleString()}
          </h2>
          <p className="text-xs text-blue-200 mt-1">
            Ventas menos costos de filamento y adicionales
          </p>
        </div>

        <div className="grid grid-cols-2 gap-4 pt-2 border-t border-blue-500/40 text-xs">
          <div>
            <span className="text-blue-200 block">Ventas Brutas</span>
            <span className="text-base font-bold">${Math.round(stats.totalRevenue).toLocaleString()}</span>
          </div>
          <div>
            <span className="text-blue-200 block">Flujo de Caja (Ventas - Egresos)</span>
            <span className={`text-base font-bold ${stats.cashFlow < 0 ? 'text-red-200' : ''}`}>
              ${Math.round(stats.cashFlow).toLocaleString()}
            </span>
          </div>
        </div>
      </div>

      {/* Grid de Métricas Secundarias */}
      <div className="grid grid-cols-2 gap-4">
        {/* Egresos */}
        <div 
          onClick={() => setActiveTab('expenses')}
          className="bg-white p-4 rounded-2xl border border-gray-100 shadow-sm flex flex-col justify-between h-28 cursor-pointer active:scale-98 transition-transform"
        >
          <div className="flex justify-between items-center">
            <div className="p-2 bg-red-50 text-red-500 rounded-xl">
              <TrendingDown size={18} />
            </div>
            <span className="text-[10px] text-gray-400 font-bold uppercase">Egresos</span>
          </div>
          <div>
            <span className="text-xs text-gray-400 block">Variados manuales</span>
            <span className="text-lg font-black text-gray-800">
              ${Math.round(stats.totalExpenses).toLocaleString()}
            </span>
          </div>
        </div>

        {/* Pedidos Pendientes */}
        <div 
          onClick={() => setActiveTab('orders')}
          className="bg-white p-4 rounded-2xl border border-gray-100 shadow-sm flex flex-col justify-between h-28 cursor-pointer active:scale-98 transition-transform"
        >
          <div className="flex justify-between items-center">
            <div className="p-2 bg-amber-50 text-amber-500 rounded-xl">
              <ClipboardCheck size={18} />
            </div>
            <span className="text-[10px] text-gray-400 font-bold uppercase">Pedidos</span>
          </div>
          <div>
            <span className="text-xs text-gray-400 block">Por entregar</span>
            <span className="text-lg font-black text-gray-800">
              {stats.pendingOrdersCount} pendiente{stats.pendingOrdersCount !== 1 ? 's' : ''}
            </span>
          </div>
        </div>
      </div>

      {/* Alertas de Stock Críticas */}
      <div className="bg-white p-5 rounded-2xl shadow-sm border border-gray-100">
        <div className="flex justify-between items-center mb-3">
          <h3 className="font-bold text-gray-800 flex items-center gap-2 text-sm">
            <AlertTriangle className="text-amber-500" size={18} /> Alertas de Fabricación
          </h3>
          {stats.stockAlerts.length > 0 && (
            <span className="text-[10px] font-bold bg-red-50 text-red-600 px-2 py-0.5 rounded-full">
              {stats.stockAlerts.length} faltante{stats.stockAlerts.length !== 1 ? 's' : ''}
            </span>
          )}
        </div>

        {stats.stockAlerts.length === 0 ? (
          <div className="text-green-600 bg-green-50 p-4 rounded-xl text-xs font-semibold text-center">
            🎉 Todo al día. No faltan piezas para tus pedidos.
          </div>
        ) : (
          <div className="space-y-2.5 max-h-60 overflow-y-auto">
            {stats.stockAlerts.map((alt, idx) => (
              <div 
                key={idx} 
                onClick={() => setActiveTab('stock')}
                className="bg-red-50 hover:bg-red-100/70 border border-red-100/60 p-3 rounded-xl flex justify-between items-center cursor-pointer transition-colors"
              >
                <div className="space-y-0.5 pr-2">
                  <p className="text-xs text-red-950 font-bold">
                    Faltan {alt.missingQuantity} x "{alt.productTitle}"
                  </p>
                  <p className="text-[10px] text-red-700">
                    Para pedido de: {alt.clientName}
                  </p>
                </div>
                <div className="text-right text-[10px] text-red-700 font-bold bg-red-100/50 px-2 py-1 rounded-lg flex-shrink-0">
                  Stock: {alt.currentStock} / {alt.requiredQuantity}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
