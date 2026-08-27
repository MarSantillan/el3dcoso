import mongoose from 'mongoose';

const SaleSchema = new mongoose.Schema({
  date: {
    type: Date,
    default: Date.now,
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
        min: [1, 'La cantidad vendida debe ser al menos 1.'],
      },
      soldPrice: {
        type: Number,
        required: true,
        min: [0, 'El precio de venta no puede ser negativo.'],
      }
    }
  ],
  filamentCostPerKg: {
    type: Number,
    required: true,
    min: [0, 'El costo del filamento no puede ser negativo.'],
  },
  totalRevenue: {
    type: Number,
    required: true,
  },
  netProfit: {
    type: Number,
    required: true,
  }
}, {
  timestamps: true,
});

export default mongoose.models.Sale || mongoose.model('Sale', SaleSchema);
