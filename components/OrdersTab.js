'use client';

import { useState, useEffect } from 'react';
import { ClipboardList, Plus, Trash2, CheckCircle2, AlertCircle } from 'lucide-react';

export default function OrdersTab() {
  const [orders, setOrders] = useState([]);
  const [productsCatalog, setProductsCatalog] = useState([]);
  const [loading, setLoading] = useState(true);

  // Form states
  const [clientName, setClientName] = useState('');
  const [dueDate, setDueDate] = useState('');
  const [orderItems, setOrderItems] = useState([]); // [{ product: Object, quantity: number }]
  const [selectedProductId, setSelectedProductId] = useState('');
  const [selectedQty, setSelectedQty] = useState('1');

  useEffect(() => {
    fetchInitialData();
  }, []);

  const fetchInitialData = async () => {
    try {
      setLoading(true);
      const [orderRes, prodRes] = await Promise.all([
        fetch('/api/orders'),
        fetch('/api/products')
      ]);

      const ords = await orderRes.json();
      const prods = await prodRes.json();

      if (orderRes.ok) setOrders(ords);
      if (prodRes.ok) setProductsCatalog(prods);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const addItemToOrder = () => {
    if (!selectedProductId || !selectedQty) return;

    const exists = orderItems.find(item => item.product._id === selectedProductId);
    if (exists) {
      alert('Este producto ya está en el pedido. Modifica la cantidad directamente.');
      return;
    }

    const prod = productsCatalog.find(p => p._id === selectedProductId);
    if (!prod) return;

    setOrderItems([
      ...orderItems,
      {
        product: prod,
        quantity: Number(selectedQty)
      }
    ]);
    setSelectedProductId('');
    setSelectedQty('1');
  };

  const updateItemQty = (index, value) => {
    const newItems = [...orderItems];
    newItems[index].quantity = Math.max(1, Number(value));
    setOrderItems(newItems);
  };

  const removeItemFromOrder = (index) => {
    setOrderItems(orderItems.filter((_, i) => i !== index));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!clientName.trim()) {
      alert('Por favor ingresa el nombre del cliente.');
      return;
    }

    if (orderItems.length === 0) {
      alert('Agrega al menos un producto al pedido.');
      return;
    }

    const payload = {
      clientName: clientName.trim(),
      products: orderItems.map(item => ({
        product: item.product._id,
        quantity: Number(item.quantity)
      })),
      dueDate: dueDate ? new Date(dueDate) : null
    };

    try {
      const res = await fetch('/api/orders', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });

      if (res.ok) {
        setClientName('');
        setDueDate('');
        setOrderItems([]);
        fetchInitialData();
        alert('Pedido registrado con éxito.');
      } else {
        const err = await res.json();
        alert(`Error al registrar pedido: ${err.error}`);
      }
    } catch (err) {
      console.error(err);
      alert('Error de conexión.');
    }
  };

  const toggleOrderStatus = async (orderId, currentStatus) => {
    const newStatus = currentStatus === 'Pendiente' ? 'Entregado' : 'Pendiente';
    try {
      const res = await fetch(`/api/orders/${orderId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: newStatus })
      });
      if (res.ok) {
        fetchInitialData();
      } else {
        alert('Error al actualizar estado del pedido.');
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleDelete = async (orderId) => {
    if (!confirm('¿Estás seguro de eliminar este pedido?')) return;
    try {
      const res = await fetch(`/api/orders/${orderId}`, { method: 'DELETE' });
      if (res.ok) {
        fetchInitialData();
      } else {
        alert('Error al eliminar pedido.');
      }
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <div className="space-y-6 pb-20">
      {/* Formulario de registro */}
      <div className="bg-white p-5 rounded-2xl shadow-sm border border-gray-100">
        <h2 className="text-xl font-bold text-gray-800 mb-4 flex items-center gap-2">
          <ClipboardList className="text-blue-500" /> Nuevo Pedido
        </h2>

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Cliente */}
          <div>
            <label className="block text-xs font-semibold text-gray-700 mb-1">Nombre del Cliente *</label>
            <input
              type="text"
              required
              placeholder="Ej: Juan Pérez"
              value={clientName}
              onChange={(e) => setClientName(e.target.value)}
              className="w-full px-4 py-2 border border-gray-200 rounded-xl focus:outline-none text-gray-800"
            />
          </div>

          {/* Selector de Producto */}
          <div className="bg-gray-50 p-3 rounded-xl space-y-2 border border-gray-150">
            <span className="block text-xs font-bold text-gray-600">Agregar productos al pedido</span>
            <div className="flex gap-2">
              <div className="flex-1">
                <select
                  value={selectedProductId}
                  onChange={(e) => setSelectedProductId(e.target.value)}
                  className="w-full px-2 py-1.5 text-xs border border-gray-200 rounded-lg text-gray-800 bg-white"
                >
                  <option value="">-- Seleccionar producto --</option>
                  {productsCatalog.map(p => (
                    <option key={p._id} value={p._id}>{p.title}</option>
                  ))}
                </select>
              </div>
              <div className="w-16">
                <input
                  type="number"
                  min="1"
                  placeholder="Cant"
                  value={selectedQty}
                  onChange={(e) => setSelectedQty(e.target.value)}
                  className="w-full px-2 py-1.5 text-xs border border-gray-200 rounded-lg text-gray-800"
                />
              </div>
              <button
                type="button"
                onClick={addItemToOrder}
                className="px-3 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-xs font-bold"
              >
                +
              </button>
            </div>

            {/* Listado en el formulario */}
            {orderItems.length > 0 && (
              <div className="space-y-1 mt-2">
                {orderItems.map((item, idx) => (
                  <div key={idx} className="flex justify-between items-center bg-white px-3 py-1.5 rounded-lg border border-gray-200 text-xs">
                    <span className="text-gray-700 font-medium">{item.product.title}</span>
                    <div className="flex items-center gap-2">
                      <input
                        type="number"
                        min="1"
                        value={item.quantity}
                        onChange={(e) => updateItemQty(idx, e.target.value)}
                        className="w-10 text-center border border-gray-200 rounded-md py-0.5 text-gray-800 font-bold"
                      />
                      <button
                        type="button"
                        onClick={() => removeItemFromOrder(idx)}
                        className="text-red-500 hover:text-red-700"
                      >
                        <Trash2 size={14} />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Para cuándo (Due Date) */}
          <div>
            <label className="block text-xs font-semibold text-gray-700 mb-1">Para cuándo (Fecha límite, Opcional)</label>
            <input
              type="date"
              value={dueDate}
              onChange={(e) => setDueDate(e.target.value)}
              className="w-full px-4 py-2 border border-gray-200 rounded-xl focus:outline-none text-gray-800"
            />
          </div>

          <button
            type="submit"
            disabled={orderItems.length === 0}
            className="w-full py-3.5 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl shadow-md transition-colors disabled:bg-gray-200 disabled:text-gray-400"
          >
            Registrar Pedido
          </button>
        </form>
      </div>

      {/* Lista de Pedidos */}
      <div className="space-y-3">
        <h3 className="text-lg font-bold text-gray-800">Listado de Pedidos</h3>
        {loading ? (
          <div className="text-center py-6 text-gray-500">Cargando pedidos...</div>
        ) : orders.length === 0 ? (
          <div className="bg-gray-50 text-center py-6 rounded-2xl text-gray-500 border border-dashed border-gray-200">
            No has registrado ningún pedido.
          </div>
        ) : (
          <div className="space-y-3">
            {orders.map(order => (
              <div
                key={order._id}
                className={`p-4 rounded-2xl border shadow-sm space-y-2 bg-white ${
                  order.status === 'Entregado' ? 'border-gray-200 opacity-70' : 'border-blue-100'
                }`}
              >
                {/* Cabecera */}
                <div className="flex justify-between items-start">
                  <div>
                    <h4 className="font-bold text-gray-800 text-sm">{order.clientName}</h4>
                    {order.dueDate && (
                      <p className="text-[10px] text-gray-400">
                        📅 Límite: {new Date(order.dueDate).toLocaleDateString('es-ES', { timeZone: 'UTC' })}
                      </p>
                    )}
                  </div>
                  <span
                    className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                      order.status === 'Entregado'
                        ? 'bg-gray-150 text-gray-600'
                        : 'bg-amber-50 text-amber-700 border border-amber-100'
                    }`}
                  >
                    {order.status}
                  </span>
                </div>

                {/* Productos Pedidos */}
                <div className="space-y-1 bg-gray-50 p-2.5 rounded-xl border border-gray-100 text-xs">
                  {order.products.map((item, idx) => {
                    const hasProduct = !!item.product;
                    const stock = hasProduct ? item.product.stock || 0 : 0;
                    const required = item.quantity;
                    const hasEnoughStock = stock >= required;

                    return (
                      <div key={idx} className="flex justify-between items-center text-gray-700 py-0.5">
                        <span>{item.product?.title || 'Producto Eliminado'} <span className="font-semibold text-gray-400">x{required}</span></span>
                        
                        {order.status === 'Pendiente' && hasProduct && (
                          <span className={`text-[10px] px-1.5 py-0.5 rounded-md font-bold ${
                            hasEnoughStock ? 'bg-green-50 text-green-700' : 'bg-red-50 text-red-700'
                          }`}>
                            {hasEnoughStock ? `Stock OK (${stock})` : `Faltan ${required - stock} (${stock}/${required})`}
                          </span>
                        )}
                      </div>
                    );
                  })}
                </div>

                {/* Acciones */}
                <div className="flex justify-end gap-2 border-t border-gray-100 pt-2 text-xs">
                  <button
                    onClick={() => toggleOrderStatus(order._id, order.status)}
                    className={`flex items-center gap-1 px-3 py-1.5 rounded-xl font-bold transition-all border ${
                      order.status === 'Entregado'
                        ? 'text-gray-500 border-gray-200 hover:bg-gray-50'
                        : 'text-green-700 border-green-200 bg-green-50 hover:bg-green-100'
                    }`}
                  >
                    <CheckCircle2 size={14} />
                    <span>{order.status === 'Entregado' ? 'Pendiente' : 'Entregado'}</span>
                  </button>
                  <button
                    onClick={() => handleDelete(order._id)}
                    className="p-1.5 text-gray-400 hover:text-red-600 bg-gray-50 rounded-xl border border-gray-200"
                  >
                    <Trash2 size={14} />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
