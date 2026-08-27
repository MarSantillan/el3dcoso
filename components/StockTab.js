'use client';

import { useState, useEffect } from 'react';
import { Package, Plus, Minus, Check, AlertTriangle } from 'lucide-react';

export default function StockTab() {
  const [products, setProducts] = useState([]);
  const [pendingOrders, setPendingOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [savingId, setSavingId] = useState(null);

  // Un mapa local para editar stocks de forma temporal
  const [localStocks, setLocalStocks] = useState({}); // { productId: stockValue }

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      setLoading(true);
      const [prodRes, orderRes] = await Promise.all([
        fetch('/api/products'),
        fetch('/api/orders')
      ]);

      const prods = await prodRes.json();
      const orders = await orderRes.json();

      if (prodRes.ok) {
        setProducts(prods);
        // Inicializar stock local
        const stocks = {};
        prods.forEach(p => {
          stocks[p._id] = p.stock || 0;
        });
        setLocalStocks(stocks);
      }
      if (orderRes.ok) {
        // Filtrar solo los pedidos pendientes para el cálculo de stock faltante
        setPendingOrders(orders.filter(o => o.status === 'Pendiente'));
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleStockChange = (productId, val) => {
    const newVal = Math.max(0, Number(val));
    setLocalStocks({
      ...localStocks,
      [productId]: newVal
    });
  };

  const adjustStock = (productId, amount) => {
    const current = localStocks[productId] || 0;
    const newVal = Math.max(0, current + amount);
    setLocalStocks({
      ...localStocks,
      [productId]: newVal
    });
  };

  const saveStock = async (productId) => {
    try {
      setSavingId(productId);
      const res = await fetch(`/api/products/${productId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ stock: localStocks[productId] })
      });

      if (res.ok) {
        // Actualizar la lista de productos original para reflejar el cambio
        setProducts(products.map(p => 
          p._id === productId ? { ...p, stock: localStocks[productId] } : p
        ));
        // Recargar datos de pedidos por si acaso
        const orderRes = await fetch('/api/orders');
        const orders = await orderRes.json();
        if (orderRes.ok) {
          setPendingOrders(orders.filter(o => o.status === 'Pendiente'));
        }
      } else {
        alert('Error al guardar stock');
      }
    } catch (err) {
      console.error(err);
    } finally {
      setSavingId(null);
    }
  };

  // Calcular alertas de stock en tiempo real basándose en los stocks locales y pedidos pendientes
  const getStockAlerts = () => {
    const alerts = [];
    
    pendingOrders.forEach(order => {
      order.products.forEach(item => {
        if (item.product) {
          const prodId = item.product._id;
          const required = item.quantity;
          const currentStock = localStocks[prodId] !== undefined ? localStocks[prodId] : (item.product.stock || 0);
          
          if (currentStock < required) {
            alerts.push({
              orderId: order._id,
              clientName: order.clientName,
              productTitle: item.product.title,
              missing: required - currentStock,
              required,
              currentStock
            });
          }
        }
      });
    });

    return alerts;
  };

  const alerts = getStockAlerts();

  return (
    <div className="space-y-6 pb-20">
      {/* Alertas de stock faltante por pedidos */}
      <div className="bg-white p-5 rounded-2xl shadow-sm border border-gray-100">
        <h2 className="text-lg font-bold text-gray-800 mb-3 flex items-center gap-2">
          <AlertTriangle className="text-amber-500" /> Relación con Pedidos Pendientes
        </h2>
        
        {loading ? (
          <div className="text-gray-400 text-sm">Calculando necesidades...</div>
        ) : alerts.length === 0 ? (
          <div className="text-green-600 bg-green-50 p-4 rounded-xl text-xs font-semibold">
            ✅ Tienes stock suficiente para cubrir todos tus pedidos pendientes actuales.
          </div>
        ) : (
          <div className="space-y-2">
            {alerts.map((alt, idx) => (
              <div key={idx} className="bg-red-50 border border-red-100 p-3 rounded-xl text-xs text-red-800">
                ⚠️ Faltan <span className="font-bold">{alt.missing}</span> cantidad de <span className="font-bold">"{alt.productTitle}"</span> para completar el pedido de <span className="font-bold">{alt.clientName}</span> (Stock: {alt.currentStock}/{alt.required})
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Control de Stock */}
      <div className="space-y-3">
        <h3 className="text-lg font-bold text-gray-800 flex items-center gap-2">
          <Package className="text-blue-500" /> Control Manual de Stock
        </h3>

        {loading ? (
          <div className="text-center py-6 text-gray-500">Cargando inventario...</div>
        ) : products.length === 0 ? (
          <div className="bg-gray-50 text-center py-6 rounded-2xl text-gray-500 border border-dashed border-gray-200">
            No hay productos cargados en el catálogo. Primero agrega productos en la pestaña Catálogo.
          </div>
        ) : (
          <div className="grid gap-3">
            {products.map(prod => {
              const isModified = (localStocks[prod._id] !== undefined) && (localStocks[prod._id] !== prod.stock);
              
              return (
                <div
                  key={prod._id}
                  className="flex items-center justify-between bg-white p-3 rounded-2xl border border-gray-100 shadow-sm gap-2"
                >
                  {/* Info Producto */}
                  <div className="flex items-center gap-2 min-w-0 flex-1">
                    <div className="w-10 h-10 bg-gray-100 rounded-lg overflow-hidden flex-shrink-0">
                      {prod.photo ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img src={prod.photo} alt={prod.title} className="w-full h-full object-cover" />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center text-[10px] text-gray-400 font-bold bg-gray-50">
                          3D
                        </div>
                      )}
                    </div>
                    <div className="min-w-0">
                      <h4 className="font-bold text-gray-800 truncate text-sm">{prod.title}</h4>
                      <p className="text-[10px] text-gray-400">Stock BD: {prod.stock}</p>
                    </div>
                  </div>

                  {/* Edición de Stock */}
                  <div className="flex items-center gap-2">
                    <div className="flex items-center border border-gray-200 rounded-xl bg-gray-50">
                      <button
                        onClick={() => adjustStock(prod._id, -1)}
                        className="px-2.5 py-1.5 text-gray-600 hover:bg-gray-150 rounded-l-xl transition-colors font-black text-md"
                      >
                        <Minus size={14} />
                      </button>
                      <input
                        type="number"
                        min="0"
                        value={localStocks[prod._id] !== undefined ? localStocks[prod._id] : (prod.stock || 0)}
                        onChange={(e) => handleStockChange(prod._id, e.target.value)}
                        className="w-10 text-center font-bold text-sm bg-transparent focus:outline-none text-gray-800"
                      />
                      <button
                        onClick={() => adjustStock(prod._id, 1)}
                        className="px-2.5 py-1.5 text-gray-600 hover:bg-gray-150 rounded-r-xl transition-colors font-black text-md"
                      >
                        <Plus size={14} />
                      </button>
                    </div>

                    {/* Botón de Guardar / Check */}
                    <button
                      onClick={() => saveStock(prod._id)}
                      disabled={!isModified || savingId === prod._id}
                      className={`p-2 rounded-xl border transition-all ${
                        isModified
                          ? 'bg-blue-600 border-blue-600 text-white shadow-sm'
                          : 'bg-gray-50 border-gray-100 text-gray-300 cursor-not-allowed'
                      }`}
                    >
                      <Check size={16} className={savingId === prod._id ? 'animate-spin' : ''} />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
