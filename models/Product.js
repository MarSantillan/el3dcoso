import mongoose from 'mongoose';

const ProductSchema = new mongoose.Schema({
  title: {
    type: String,
    required: [true, 'El título del producto es obligatorio.'],
    trim: true,
  },
  filamentWeight: {
    type: Number,
    required: [true, 'La cantidad de filamento (gramos) es obligatoria.'],
    min: [0, 'El peso del filamento no puede ser negativo.'],
  },
  printTime: {
    type: Number, // en minutos
    default: null,
  },
  additionalElements: [
    {
      name: { type: String, trim: true },
      price: { type: Number, default: 0 },
    }
  ],
  photo: {
    type: String, // Imagen codificada en Base64
    default: null,
  },
  stock: {
    type: Number,
    default: 0,
    min: [0, 'El stock no puede ser negativo.'],
  }
}, {
  timestamps: true,
});

export default mongoose.models.Product || mongoose.model('Product', ProductSchema);
