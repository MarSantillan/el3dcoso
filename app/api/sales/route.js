import dbConnect from '@/lib/mongodb';
import Product from '@/models/Product';
import Sale from '@/models/Sale';
import { NextResponse } from 'next/server';

export async function GET() {
  try {
    await dbConnect();
    const sales = await Sale.find({})
      .populate('products.product', 'title')
      .sort({ date: -1 });
    return NextResponse.json(sales);
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function POST(request) {
  try {
    await dbConnect();
    const body = await request.json();
    const { products, filamentCostPerKg, additionalCost = 0, date } = body;

    if (!products || !products.length) {
      return NextResponse.json({ error: 'La venta debe contener al menos un producto' }, { status: 400 });
    }

    let totalRevenue = 0;
    let totalFilamentCost = 0;
    let totalProductsAdditionalCost = 0;

    for (const item of products) {
      const productData = await Product.findById(item.product);
      if (!productData) {
        return NextResponse.json({ error: `Producto con ID ${item.product} no encontrado` }, { status: 404 });
      }

      const quantity = Number(item.quantity);
      const soldPrice = Number(item.soldPrice);
      
      totalRevenue += quantity * soldPrice;

      const itemFilamentCost = productData.filamentWeight * quantity * (filamentCostPerKg / 1000);
      totalFilamentCost += itemFilamentCost;

      const itemAdditionalCost = (productData.additionalElements || []).reduce(
        (sum, elem) => sum + (elem.price || 0), 0
      ) * quantity;
      totalProductsAdditionalCost += itemAdditionalCost;
    }

    const netProfit = totalRevenue - totalFilamentCost - totalProductsAdditionalCost - Number(additionalCost);

    const saleData = {
      products,
      filamentCostPerKg,
      totalRevenue,
      netProfit,
      date: date ? new Date(date) : new Date()
    };

    const sale = await Sale.create(saleData);
    return NextResponse.json(sale, { status: 201 });
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 400 });
  }
}
