import mongoose from 'mongoose';

const ExpenseSchema = new mongoose.Schema({
  description: {
    type: String,
    required: [true, 'La descripción del egreso es obligatoria.'],
    trim: true,
  },
  amount: {
    type: Number,
    required: [true, 'El monto del egreso es obligatorio.'],
    min: [0, 'El monto del egreso no puede ser negativo.'],
  },
  date: {
    type: Date,
    default: Date.now,
  },
  category: {
    type: String,
    trim: true,
    default: 'Otros',
  }
}, {
  timestamps: true,
});

export default mongoose.models.Expense || mongoose.model('Expense', ExpenseSchema);
