'use client';

import { useState, useEffect } from 'react';
import { Plus, Trash2, ShoppingCart, DollarSign, Calendar } from 'lucide-react';

export default function SalesTab() {
  const [productsCatalog, setProductsCatalog] = useState([]);
  const [salesHistory, setSalesHistory] = useState([]);
  const [loading, setLoading] = useState(true);

  // Form states
  const [cart, setCart] = useState([]); // [{ product: Object, quantity: number, soldPrice: number }]
  const [selectedProductId, setSelectedProductId] = useState('');
  const [filamentCostPerKg, setFilamentCostPerKg] = useState('');
  const [additionalCost, setAdditionalCost] = useState('0');
  const [saleDate, setSaleDate] = useState('');

  // Live calculation states
  const [liveRevenue, setLiveRevenue] = useState(0);
  const [liveProfit, setLiveProfit] = useState(0);

  useEffect(() => {
    fetchInitialData();
    // Cargar costo del filamento guardado de forma local
    const savedCost = localStorage.getItem('default_filament_cost');
    if (savedCost) {
      setFilamentCostPerKg(savedCost);
    }
    // Establecer fecha por defecto hoy
    const today = new Date().toISOString().split('T')[0];
    setSaleDate(today);
  }, []);

  // Recalcular ganancias en vivo al modificar el carrito o costos
  useEffect(() => {
    let revenue = 0;
    let totalFilamentCost = 0;
    let totalAdditionalCost = 0;

    cart.forEach(item => {
      const qty = Number(item.quantity) || 0;
      const price = Number(item.soldPrice) || 0;
      revenue += qty * price;

      // Calcular costo de filamento para el item
      const weight = item.product.filamentWeight || 0;
      const costPerKg = Number(filamentCostPerKg) || 0;
      const itemFilamentCost = weight * qty * (costPerKg / 1000);
      totalFilamentCost += itemFilamentCost;

      // Costo de elementos adicionales configurados en catálogo
      const itemAddCost = (item.product.additionalElements || []).reduce(
        (sum, elem) => sum + (elem.price || 0), 0
      ) * qty;
      totalAdditionalCost += itemAddCost;
    });

    const netProfit = revenue - totalFilamentCost - totalAdditionalCost - (Number(additionalCost) || 0);

    setLiveRevenue(revenue);
    setLiveProfit(netProfit);
  }, [cart, filamentCostPerKg, additionalCost]);

  const fetchInitialData = async () => {
    try {
      setLoading(true);
      const [prodRes, salesRes] = await Promise.all([
        fetch('/api/products'),
        fetch('/api/sales')
      ]);

      const prods = await prodRes.json();
      const sales = await salesRes.json();

      if (prodRes.ok) setProductsCatalog(prods);
      if (salesRes.ok) setSalesHistory(sales);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const addToCart = () => {
    if (!selectedProductId) return;

    // Verificar si ya está en el carrito
    const exists = cart.find(item => item.product._id === selectedProductId);
    if (exists) {
      alert('El producto ya está en el carrito. Modifica la cantidad directamente.');
      return;
    }

    const prod = productsCatalog.find(p => p._id === selectedProductId);
    if (!prod) return;

    // Agregar al carrito
    setCart([
      ...cart,
      {
        product: prod,
        quantity: 1,
        soldPrice: 0 // Se inicia en 0 para que el usuario indique el precio
      }
    ]);
    setSelectedProductId('');
  };

  const updateCartItem = (index, field, value) => {
    const newCart = [...cart];
    newCart[index][field] = value;
    setCart(newCart);
  };

  const removeFromCart = (index) => {
    setCart(cart.filter((_, i) => i !== index));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (cart.length === 0) {
      alert('El carrito está vacío.');
      return;
    }

    if (!filamentCostPerKg) {
      alert('Por favor ingresa el costo actual del filamento.');
      return;
    }

    // Guardar el costo del filamento predeterminado en localStorage
    localStorage.setItem('default_filament_cost', filamentCostPerKg);

    const payload = {
      products: cart.map(item => ({
        product: item.product._id,
        quantity: Number(item.quantity),
        soldPrice: Number(item.soldPrice)
      })),
      filamentCostPerKg: Number(filamentCostPerKg),
      additionalCost: Number(additionalCost),
      date: saleDate
    };

    try {
      const res = await fetch('/api/sales', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });

      if (res.ok) {
        setCart([]);
        setAdditionalCost('0');
        fetchInitialData();
        alert('Venta registrada con éxito.');
      } else {
        const err = await res.json();
        alert(`Error al registrar venta: ${err.error}`);
      }
    } catch (err) {
      console.error(err);
      alert('Error de conexión.');
    }
  };

  return (
    <div className="space-y-6 pb-20">
      {/* Formulario / Registro de venta */}
      <div className="bg-white p-5 rounded-2xl shadow-sm border border-gray-100">
        <h2 className="text-xl font-bold text-gray-800 mb-4 flex items-center gap-2">
          <ShoppingCart className="text-blue-500" /> Registrar Venta
        </h2>

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Selector de Producto */}
          <div className="flex gap-2">
            <div className="flex-1">
              <label className="block text-xs font-semibold text-gray-500 mb-1">Agregar Producto</label>
              <select
                value={selectedProductId}
                onChange={(e) => setSelectedProductId(e.target.value)}
                className="w-full px-3 py-2 border border-gray-200 rounded-xl focus:outline-none text-gray-800 bg-white"
              >
                <option value="">-- Seleccionar producto --</option>
                {productsCatalog.map(prod => (
                  <option key={prod._id} value={prod._id}>
                    {prod.title} ({prod.filamentWeight}g)
                  </option>
                ))}
              </select>
            </div>
            <button
              type="button"
              onClick={addToCart}
              className="mt-5 p-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl flex items-center justify-center font-bold"
            >
              <Plus size={20} />
            </button>
          </div>

          {/* Carrito de Productos */}
          {cart.length > 0 && (
            <div className="space-y-3 bg-gray-50 p-3 rounded-xl border border-gray-150">
              <span className="block text-xs font-bold text-gray-600 mb-1">Carrito de Productos</span>
              {cart.map((item, idx) => (
                <div key={idx} className="bg-white p-3 rounded-xl border border-gray-200 flex flex-col gap-2 relative">
                  <button
                    type="button"
                    onClick={() => removeFromCart(idx)}
                    className="absolute top-2 right-2 text-red-500 hover:text-red-700"
                  >
                    <Trash2 size={16} />
                  </button>

                  <span className="font-bold text-gray-800 pr-6 text-sm">{item.product.title}</span>

                  <div className="grid grid-cols-2 gap-2 mt-1">
                    <div>
                      <label className="block text-xs text-gray-500">Cantidad</label>
                      <input
                        type="number"
                        min="1"
                        required
                        value={item.quantity}
                        onChange={(e) => updateCartItem(idx, 'quantity', e.target.value)}
                        className="w-full px-2 py-1 text-sm border border-gray-200 rounded-lg text-gray-800"
                      />
                    </div>
                    <div>
                      <label className="block text-xs text-gray-500">Precio Unitario ($)</label>
                      <input
                        type="number"
                        min="0"
                        required
                        placeholder="Ej: 5000"
                        value={item.soldPrice}
                        onChange={(e) => updateCartItem(idx, 'soldPrice', e.target.value)}
                        className="w-full px-2 py-1 text-sm border border-gray-200 rounded-lg text-gray-800"
                      />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Parametros de Costo de la Venta */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-gray-700 mb-1">Filamento ($ / Kg) *</label>
              <input
                type="number"
                required
                min="0"
                placeholder="Ej: 15000"
                value={filamentCostPerKg}
                onChange={(e) => setFilamentCostPerKg(e.target.value)}
                className="w-full px-4 py-2 border border-gray-200 rounded-xl focus:outline-none text-gray-800"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-gray-700 mb-1">Costo Adicional manual ($)</label>
              <input
                type="number"
                min="0"
                placeholder="Ej: 500"
                value={additionalCost}
                onChange={(e) => setAdditionalCost(e.target.value)}
                className="w-full px-4 py-2 border border-gray-200 rounded-xl focus:outline-none text-gray-800"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-gray-700 mb-1">Fecha de Venta</label>
            <input
              type="date"
              required
              value={saleDate}
              onChange={(e) => setSaleDate(e.target.value)}
              className="w-full px-4 py-2 border border-gray-200 rounded-xl focus:outline-none text-gray-800"
            />
          </div>

          {/* Resumen en vivo de Ganancias */}
          <div className="bg-blue-50 p-4 rounded-xl border border-blue-100 space-y-1">
            <div className="flex justify-between items-center text-sm">
              <span className="text-blue-700">Ingreso Bruto:</span>
              <span className="font-bold text-blue-900">${liveRevenue.toLocaleString()}</span>
            </div>
            <div className="flex justify-between items-center text-md font-bold">
              <span className="text-green-700 flex items-center gap-1">
                <DollarSign size={16} /> Ganancia Neta:
              </span>
              <span className={`text-green-950 font-black text-lg ${liveProfit < 0 ? 'text-red-600' : ''}`}>
                ${liveProfit.toLocaleString()}
              </span>
            </div>
          </div>

          <button
            type="submit"
            disabled={cart.length === 0}
            className="w-full py-3.5 bg-green-600 hover:bg-green-700 text-white font-bold rounded-xl shadow-md transition-colors disabled:bg-gray-200 disabled:text-gray-400"
          >
            Registrar Venta
          </button>
        </form>
      </div>

      {/* Historial de Ventas */}
      <div className="space-y-3">
        <h3 className="text-lg font-bold text-gray-800 flex items-center gap-2">
          <Calendar size={18} /> Historial de Ventas
        </h3>

        {loading ? (
          <div className="text-center py-6 text-gray-500">Cargando ventas...</div>
        ) : salesHistory.length === 0 ? (
          <div className="bg-gray-50 text-center py-6 rounded-2xl text-gray-500 border border-dashed border-gray-200">
            Aún no has registrado ninguna venta.
          </div>
        ) : (
          <div className="space-y-3">
            {salesHistory.map((sale) => (
              <div key={sale._id} className="bg-white p-4 rounded-2xl border border-gray-150 shadow-sm space-y-2">
                <div className="flex justify-between items-start">
                  <span className="text-xs text-gray-400 font-semibold">
                    📅 {new Date(sale.date).toLocaleDateString('es-ES', { timeZone: 'UTC' })}
                  </span>
                  <span className="text-xs bg-green-50 text-green-700 font-bold px-2 py-0.5 rounded-full">
                    Ganancia: +${Math.round(sale.netProfit).toLocaleString()}
                  </span>
                </div>

                <div className="space-y-1">
                  {sale.products.map((item, idx) => (
                    <div key={idx} className="flex justify-between text-xs text-gray-700">
                      <span>{item.product?.title || 'Producto Eliminado'} <span className="font-semibold text-gray-400">x{item.quantity}</span></span>
                      <span className="font-bold text-gray-900">${(item.quantity * item.soldPrice).toLocaleString()}</span>
                    </div>
                  ))}
                </div>

                <div className="border-t border-gray-100 pt-2 flex justify-between items-center text-xs">
                  <span className="text-gray-400">Filamento: ${sale.filamentCostPerKg}/kg</span>
                  <span className="font-black text-gray-800 text-sm">Total: ${sale.totalRevenue.toLocaleString()}</span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
