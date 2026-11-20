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
        default: null,
      },
      customTitle: {
        type: String,
        trim: true,
        default: null,
      },
      customFilamentWeight: {
        type: Number,
        default: 0,
        min: [0, 'El peso del filamento no puede ser negativo.'],
      },
      customAdditionalCost: {
        type: Number,
        default: 0,
        min: [0, 'El costo adicional no puede ser negativo.'],
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
