import dbConnect from '@/lib/mongodb';
import Product from '@/models/Product';
import Sale from '@/models/Sale';
import Expense from '@/models/Expense';
import Order from '@/models/Order';
import { NextResponse } from 'next/server';

export async function GET() {
  try {
    await dbConnect();

    // 1. Totales de ventas
    const sales = await Sale.find({});
    let totalRevenue = 0;
    let totalNetProfitFromSales = 0;
    sales.forEach(sale => {
      totalRevenue += sale.totalRevenue || 0;
      totalNetProfitFromSales += sale.netProfit || 0;
    });

    // 2. Totales de egresos
    const expenses = await Expense.find({});
    let totalExpenses = 0;
    expenses.forEach(exp => {
      totalExpenses += exp.amount || 0;
    });

    // Flujo de Caja (Ventas Brutas - Egresos totales, sin restar doble los insumos)
    const cashFlow = totalRevenue - totalExpenses;

    // 3. Pedidos pendientes
    const pendingOrders = await Order.find({ status: 'Pendiente' })
      .populate('products.product', 'title stock');

    // 4. Calcular faltantes de stock
    const stockAlerts = [];
    pendingOrders.forEach(order => {
      order.products.forEach(item => {
        if (item.product) {
          const required = item.quantity;
          const currentStock = item.product.stock || 0;
          if (currentStock < required) {
            stockAlerts.push({
              orderId: order._id,
              clientName: order.clientName,
              productTitle: item.product.title,
              missingQuantity: required - currentStock,
              requiredQuantity: required,
              currentStock: currentStock
            });
          }
        }
      });
    });

    return NextResponse.json({
      totalRevenue,
      totalNetProfitFromSales,
      totalExpenses,
      cashFlow,
      netBalance: totalNetProfitFromSales,
      pendingOrdersCount: pendingOrders.length,
      stockAlerts
    });
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
