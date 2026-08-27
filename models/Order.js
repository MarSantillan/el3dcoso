import mongoose from 'mongoose';

const OrderSchema = new mongoose.Schema({
  clientName: {
    type: String,
    required: [true, 'El nombre del cliente es obligatorio.'],
    trim: true,
  },
  products: [
    {
      product: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Product',
        required: true,
      },
      quantity: {
        type: Number,
        required: true,
        min: [1, 'La cantidad debe ser al menos 1.'],
      }
    }
  ],
  dueDate: {
    type: Date,
    default: null,
  },
  status: {
    type: String,
    enum: ['Pendiente', 'Entregado'],
    default: 'Pendiente',
  }
}, {
  timestamps: true,
});

export default mongoose.models.Order || mongoose.model('Order', OrderSchema);
