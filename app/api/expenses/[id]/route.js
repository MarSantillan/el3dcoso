import dbConnect from '@/lib/mongodb';
import Expense from '@/models/Expense';
import { NextResponse } from 'next/server';

export async function DELETE(request, { params }) {
  try {
    await dbConnect();
    const { id } = await params;
    const expense = await Expense.findByIdAndDelete(id);
    if (!expense) {
      return NextResponse.json({ error: 'Egreso no encontrado' }, { status: 404 });
    }
    return NextResponse.json({ message: 'Egreso eliminado con éxito' });
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
