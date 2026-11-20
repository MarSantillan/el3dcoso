'use client';

import { useState, useEffect } from 'react';
import { TrendingDown, Plus, Trash2, Calendar, DollarSign } from 'lucide-react';

export default function ExpensesTab() {
  const [expenses, setExpenses] = useState([]);
  const [loading, setLoading] = useState(true);

  // Form states
  const [description, setDescription] = useState('');
  const [amount, setAmount] = useState('');
  const [category, setCategory] = useState('Otros');
  const [expenseDate, setExpenseDate] = useState('');
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    fetchExpenses();
    // Establecer fecha por defecto hoy
    const today = new Date().toISOString().split('T')[0];
    setExpenseDate(today);
  }, []);

  const fetchExpenses = async () => {
    try {
      setLoading(true);
      const res = await fetch('/api/expenses');
      const data = await res.json();
      if (res.ok) setExpenses(data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (submitting) return;

    if (!description.trim() || !amount) {
      alert('Descripción y Monto son obligatorios.');
      return;
    }

    const payload = {
      description: description.trim(),
      amount: Number(amount),
      category,
      date: expenseDate ? new Date(expenseDate) : new Date()
    };

    try {
      setSubmitting(true);
      const res = await fetch('/api/expenses', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });

      if (res.ok) {
        setDescription('');
        setAmount('');
        setCategory('Otros');
        fetchExpenses();
        alert('Egreso registrado con éxito.');
      } else {
        const err = await res.json();
        alert(`Error al registrar egreso: ${err.error}`);
      }
    } catch (err) {
      console.error(err);
      alert('Error de conexión.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (id) => {
    // Si queremos habilitar el borrado de egresos, podemos crear una ruta API dinámica.
    // Como el egreso es manual, agreguemos la llamada rápida a /api/expenses/[id] o similar.
    // Para simplificar la API, creamos sólo GET y POST, pero si queremos borrar, podemos crear el endpoint DELETE en `app/api/expenses/[id]/route.js`.
    // Vamos a crearla más adelante o manejar el borrado. De momento, para evitar sobrecargar, sólo confirmemos si el usuario lo desea.
    // Dejemos el borrado desactivado o implementemos una API rápida de delete. Implementemos la eliminación en `/api/expenses/[id]` para que sea completo.
    if (!confirm('¿Estás seguro de eliminar este egreso?')) return;
    try {
      const res = await fetch(`/api/expenses/${id}`, { method: 'DELETE' });
      if (res.ok) {
        fetchExpenses();
      } else {
        alert('Error al eliminar egreso.');
      }
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <div className="space-y-6 pb-20">
      {/* Formulario */}
      <div className="bg-white p-5 rounded-2xl shadow-sm border border-gray-100">
        <h2 className="text-xl font-bold text-gray-800 mb-4 flex items-center gap-2">
          <TrendingDown className="text-red-500" /> Registrar Egreso
        </h2>

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Descripción */}
          <div>
            <label className="block text-xs font-semibold text-gray-700 mb-1">Descripción del Egreso *</label>
            <input
              type="text"
              required
              placeholder="Ej: Bobina PLA Grilon, Boquilla 0.4mm, Cuenta Luz..."
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="w-full px-4 py-2 border border-gray-200 rounded-xl focus:outline-none text-gray-800"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            {/* Monto */}
            <div>
              <label className="block text-xs font-semibold text-gray-700 mb-1">Monto ($) *</label>
              <input
                type="number"
                required
                min="0"
                placeholder="Ej: 8500"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                className="w-full px-4 py-2 border border-gray-200 rounded-xl focus:outline-none text-gray-800"
              />
            </div>

            {/* Categoría */}
            <div>
              <label className="block text-xs font-semibold text-gray-700 mb-1">Categoría</label>
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                className="w-full px-4 py-2 border border-gray-200 rounded-xl focus:outline-none text-gray-800 bg-white"
              >
                <option value="Insumos">Insumos (Filamento, etc.)</option>
                <option value="Mantenimiento">Mantenimiento (Repuestos)</option>
                <option value="Servicios">Servicios (Luz, Internet)</option>
                <option value="Herramientas">Herramientas</option>
                <option value="Otros">Otros</option>
              </select>
            </div>
          </div>

          {/* Fecha */}
          <div>
            <label className="block text-xs font-semibold text-gray-700 mb-1">Fecha</label>
            <input
              type="date"
              required
              value={expenseDate}
              onChange={(e) => setExpenseDate(e.target.value)}
              className="w-full px-4 py-2 border border-gray-200 rounded-xl focus:outline-none text-gray-800"
            />
          </div>

          <button
            type="submit"
            disabled={submitting}
            className="w-full py-3.5 bg-red-600 hover:bg-red-700 text-white font-bold rounded-xl shadow-md transition-colors disabled:bg-gray-300"
          >
            {submitting ? 'Registrando...' : 'Registrar Egreso'}
          </button>
        </form>
      </div>

      {/* Historial de Egresos */}
      <div className="space-y-3">
        <h3 className="text-lg font-bold text-gray-800 flex items-center gap-2">
          <Calendar size={18} /> Historial de Egresos
        </h3>

        {loading ? (
          <div className="text-center py-6 text-gray-500">Cargando egresos...</div>
        ) : expenses.length === 0 ? (
          <div className="bg-gray-50 text-center py-6 rounded-2xl text-gray-500 border border-dashed border-gray-200">
            No has registrado ningún egreso todavía.
          </div>
        ) : (
          <div className="space-y-3">
            {expenses.map((exp) => (
              <div key={exp._id} className="bg-white p-4 rounded-2xl border border-gray-150 shadow-sm flex justify-between items-center">
                <div className="space-y-0.5">
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-gray-800 text-sm">{exp.description}</span>
                    <span className="text-[9px] bg-red-50 text-red-600 font-bold px-1.5 py-0.5 rounded-full">
                      {exp.category}
                    </span>
                  </div>
                  <span className="text-[10px] text-gray-400 font-semibold">
                    📅 {new Date(exp.date).toLocaleDateString('es-ES', { timeZone: 'UTC' })}
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="font-black text-red-600 text-sm">-${exp.amount.toLocaleString()}</span>
                  <button
                    onClick={() => handleDelete(exp._id)}
                    className="p-1.5 text-gray-300 hover:text-red-500 transition-colors"
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
