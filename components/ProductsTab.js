'use client';

import { useState, useEffect } from 'react';
import { Plus, Edit2, Trash2, Camera, Image as ImageIcon, X } from 'lucide-react';

export default function ProductsTab() {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isEditing, setIsEditing] = useState(false);
  const [currentId, setCurrentId] = useState(null);

  // Form states
  const [title, setTitle] = useState('');
  const [filamentWeight, setFilamentWeight] = useState('');
  const [printTime, setPrintTime] = useState('');
  const [additionalElements, setAdditionalElements] = useState([]);
  const [photo, setPhoto] = useState(null);

  // Dynamic additional element form states
  const [elemName, setElemName] = useState('');
  const [elemPrice, setElemPrice] = useState('');
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    fetchProducts();
  }, []);

  const fetchProducts = async () => {
    try {
      setLoading(true);
      const res = await fetch('/api/products');
      const data = await res.json();
      if (res.ok) setProducts(data);
    } catch (err) {
      console.error('Error fetching products:', err);
    } finally {
      setLoading(false);
    }
  };

  const handlePhotoChange = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    // Redimensionar imagen para ahorrar espacio en MongoDB (max 200KB)
    const reader = new FileReader();
    reader.onload = (event) => {
      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement('canvas');
        const MAX_WIDTH = 400;
        const MAX_HEIGHT = 400;
        let width = img.width;
        let height = img.height;

        if (width > height) {
          if (width > MAX_WIDTH) {
            height *= MAX_WIDTH / width;
            width = MAX_WIDTH;
          }
        } else {
          if (height > MAX_HEIGHT) {
            width *= MAX_HEIGHT / height;
            height = MAX_HEIGHT;
          }
        }

        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');
        ctx.drawImage(img, 0, 0, width, height);
        const dataUrl = canvas.toDataURL('image/jpeg', 0.7); // 70% calidad
        setPhoto(dataUrl);
      };
      img.src = event.target.result;
    };
    reader.readAsDataURL(file);
    e.target.value = '';
  };

  const addAdditionalElement = () => {
    if (!elemName.trim() && elemPrice === '') return;
    const parsedPrice = Number(elemPrice);
    if (isNaN(parsedPrice) || parsedPrice < 0) return;
    setAdditionalElements([
      ...additionalElements,
      { name: elemName.trim() || 'Adicional', price: parsedPrice }
    ]);
    setElemName('');
    setElemPrice('');
  };

  const removeAdditionalElement = (index) => {
    setAdditionalElements(additionalElements.filter((_, i) => i !== index));
  };

  const resetForm = () => {
    setTitle('');
    setFilamentWeight('');
    setPrintTime('');
    setAdditionalElements([]);
    setElemName('');
    setElemPrice('');
    setPhoto(null);
    setIsEditing(false);
    setCurrentId(null);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (submitting) return;

    // Si el usuario escribió un elemento adicional y no presionó "+ Agregar Elemento", incluirlo automáticamente
    const finalAdditionalElements = [...additionalElements];
    if (elemName.trim() || elemPrice !== '') {
      const parsedPrice = Number(elemPrice) || 0;
      if (elemName.trim() || parsedPrice > 0) {
        finalAdditionalElements.push({
          name: elemName.trim() || 'Adicional',
          price: parsedPrice
        });
      }
    }

    const productPayload = {
      title: title.trim(),
      filamentWeight: Number(filamentWeight),
      printTime: printTime ? Number(printTime) : null,
      additionalElements: finalAdditionalElements,
      photo
    };

    try {
      setSubmitting(true);
      const url = isEditing ? `/api/products/${currentId}` : '/api/products';
      const method = isEditing ? 'PUT' : 'POST';

      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(productPayload)
      });

      if (res.ok) {
        resetForm();
        fetchProducts();
      } else {
        const errData = await res.json();
        alert(`Error: ${errData.error}`);
      }
    } catch (err) {
      console.error('Error saving product:', err);
    } finally {
      setSubmitting(false);
    }
  };

  const handleEdit = (prod) => {
    setIsEditing(true);
    setCurrentId(prod._id);
    setTitle(prod.title);
    setFilamentWeight(prod.filamentWeight);
    setPrintTime(prod.printTime || '');
    setAdditionalElements(prod.additionalElements || []);
    setElemName('');
    setElemPrice('');
    setPhoto(prod.photo || null);
    // Hacer scroll al formulario
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleDelete = async (id) => {
    if (!confirm('¿Estás seguro de eliminar este producto del catálogo?')) return;
    try {
      const res = await fetch(`/api/products/${id}`, { method: 'DELETE' });
      if (res.ok) {
        fetchProducts();
      } else {
        alert('Error al eliminar producto.');
      }
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <div className="space-y-6 pb-20">
      <div className="bg-white p-5 rounded-2xl shadow-sm border border-gray-100">
        <h2 className="text-xl font-bold text-gray-800 mb-4">
          {isEditing ? '✏️ Editar Producto' : '➕ Nuevo Producto'}
        </h2>
        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Título */}
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-1">Título del Producto *</label>
            <input
              type="text"
              required
              placeholder="Ej: Maceta Articulada, Llavero..."
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="w-full px-4 py-2 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:outline-none text-gray-800"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            {/* Peso Filamento */}
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-1">Filamento (gramos) *</label>
              <input
                type="number"
                required
                min="0"
                step="any"
                placeholder="Ej: 45"
                value={filamentWeight}
                onChange={(e) => setFilamentWeight(e.target.value)}
                className="w-full px-4 py-2 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:outline-none text-gray-800"
              />
            </div>

            {/* Tiempo de impresión */}
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-1">Tiempo (minutos)</label>
              <input
                type="number"
                min="0"
                placeholder="Ej: 120"
                value={printTime}
                onChange={(e) => setPrintTime(e.target.value)}
                className="w-full px-4 py-2 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:outline-none text-gray-800"
              />
            </div>
          </div>

          {/* Elementos Adicionales */}
          <div className="bg-gray-50 p-4 rounded-xl space-y-3">
            <span className="block text-sm font-bold text-gray-700">Elementos adicionales (Tornillos, imanes, etc.)</span>
            
            <div className="grid grid-cols-5 gap-2">
              <input
                type="text"
                placeholder="Ej: Imán 8mm"
                value={elemName}
                onChange={(e) => setElemName(e.target.value)}
                className="col-span-3 px-3 py-1.5 text-sm border border-gray-200 rounded-lg focus:outline-none text-gray-800"
              />
              <input
                type="number"
                min="0"
                placeholder="Precio"
                value={elemPrice}
                onChange={(e) => setElemPrice(e.target.value)}
                className="col-span-2 px-3 py-1.5 text-sm border border-gray-200 rounded-lg focus:outline-none text-gray-800"
              />
            </div>
            <button
              type="button"
              onClick={addAdditionalElement}
              className="w-full py-1.5 text-xs bg-gray-200 hover:bg-gray-300 text-gray-700 font-bold rounded-lg transition-colors"
            >
              + Agregar Elemento
            </button>

            {additionalElements.length > 0 && (
              <div className="mt-2 space-y-1 max-h-24 overflow-y-auto">
                {additionalElements.map((elem, idx) => (
                  <div key={idx} className="flex justify-between items-center bg-white px-3 py-1 rounded-md border border-gray-100 text-xs">
                    <span className="text-gray-700">{elem.name}</span>
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-gray-900">${elem.price}</span>
                      <button
                        type="button"
                        onClick={() => removeAdditionalElement(idx)}
                        className="text-red-500 hover:text-red-700"
                      >
                        <X size={14} />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Foto */}
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-1">Foto del producto</label>
            <div className="flex flex-wrap items-center gap-2">
              <label className="flex items-center gap-1.5 px-3.5 py-2 border border-blue-200 rounded-xl cursor-pointer hover:bg-blue-50 transition-colors text-sm text-blue-700 bg-blue-50/40 font-medium">
                <Camera size={18} />
                <span>Sacar Foto</span>
                <input
                  type="file"
                  accept="image/*"
                  capture="environment"
                  onChange={handlePhotoChange}
                  className="hidden"
                />
              </label>
              <label className="flex items-center gap-1.5 px-3.5 py-2 border border-gray-200 rounded-xl cursor-pointer hover:bg-gray-50 transition-colors text-sm text-gray-600 bg-white font-medium">
                <ImageIcon size={18} />
                <span>Galería</span>
                <input
                  type="file"
                  accept="image/*"
                  onChange={handlePhotoChange}
                  className="hidden"
                />
              </label>
              {photo && (
                <div className="relative w-12 h-12 rounded-lg border border-gray-200 overflow-hidden">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={photo} alt="Vista previa" className="w-full h-full object-cover" />
                  <button
                    type="button"
                    onClick={() => setPhoto(null)}
                    className="absolute top-0 right-0 bg-red-500 text-white rounded-full p-0.5"
                  >
                    <X size={10} />
                  </button>
                </div>
              )}
            </div>
          </div>

          {/* Botones de acción */}
          <div className="flex gap-2 pt-2">
            <button
              type="submit"
              disabled={submitting}
              className="flex-1 py-3 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl shadow-md transition-colors disabled:bg-gray-300"
            >
              {submitting ? 'Guardando...' : isEditing ? 'Guardar Cambios' : 'Crear Producto'}
            </button>
            {isEditing && (
              <button
                type="button"
                onClick={resetForm}
                className="px-4 py-3 bg-gray-150 hover:bg-gray-200 text-gray-700 font-bold rounded-xl transition-colors border border-gray-200"
              >
                Cancelar
              </button>
            )}
          </div>
        </form>
      </div>

      {/* Lista de productos */}
      <div className="space-y-3">
        <h3 className="text-lg font-bold text-gray-800">Catálogo de Productos</h3>
        {loading ? (
          <div className="text-center py-8 text-gray-500">Cargando catálogo...</div>
        ) : products.length === 0 ? (
          <div className="bg-gray-50 text-center py-8 rounded-2xl border border-dashed border-gray-200 text-gray-500">
            No tienes productos creados. ¡Agrega uno arriba!
          </div>
        ) : (
          <div className="grid gap-3">
            {products.map((prod) => (
              <div
                key={prod._id}
                className="flex items-center gap-3 bg-white p-3 rounded-2xl border border-gray-100 shadow-sm"
              >
                {/* Imagen del producto */}
                <div className="w-16 h-16 bg-gray-100 rounded-xl overflow-hidden flex-shrink-0 border border-gray-100">
                  {prod.photo ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={prod.photo} alt={prod.title} className="w-full h-full object-cover" />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-xs text-gray-400 font-semibold bg-gray-50">
                      Sin foto
                    </div>
                  )}
                </div>

                {/* Detalles */}
                <div className="flex-1 min-w-0">
                  <h4 className="font-bold text-gray-800 truncate">{prod.title}</h4>
                  <p className="text-xs text-gray-500">
                    ⚖️ {prod.filamentWeight}g 
                    {prod.printTime ? ` • ⏱️ ${prod.printTime}m` : ''}
                  </p>
                  {prod.additionalElements && prod.additionalElements.length > 0 && (
                    <p className="text-xs text-blue-600 font-medium truncate mt-0.5">
                      ➕ {prod.additionalElements.length} adicional{prod.additionalElements.length > 1 ? 'es' : ''} (${prod.additionalElements.reduce((sum, e) => sum + (e.price || 0), 0)})
                    </p>
                  )}
                </div>

                {/* Acciones */}
                <div className="flex gap-1">
                  <button
                    onClick={() => handleEdit(prod)}
                    className="p-2 text-gray-500 hover:text-blue-600 bg-gray-50 rounded-xl border border-gray-100"
                  >
                    <Edit2 size={16} />
                  </button>
                  <button
                    onClick={() => handleDelete(prod._id)}
                    className="p-2 text-gray-500 hover:text-red-600 bg-gray-50 rounded-xl border border-gray-100"
                  >
                    <Trash2 size={16} />
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
