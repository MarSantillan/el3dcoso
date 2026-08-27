'use client';

import { useState } from 'react';
import { Home, DollarSign, TrendingDown, Tag, Package, ClipboardList } from 'lucide-react';
import Dashboard from '@/components/Dashboard';
import SalesTab from '@/components/SalesTab';
import ExpensesTab from '@/components/ExpensesTab';
import ProductsTab from '@/components/ProductsTab';
import StockTab from '@/components/StockTab';
import OrdersTab from '@/components/OrdersTab';

export default function HomeSPA() {
  const [activeTab, setActiveTab] = useState('dashboard');

  const renderContent = () => {
    switch (activeTab) {
      case 'dashboard':
        return <Dashboard setActiveTab={setActiveTab} />;
      case 'sales':
        return <SalesTab />;
      case 'expenses':
        return <ExpensesTab />;
      case 'products':
        return <ProductsTab />;
      case 'stock':
        return <StockTab />;
      case 'orders':
        return <OrdersTab />;
      default:
        return <Dashboard setActiveTab={setActiveTab} />;
    }
  };

  const navItems = [
    { id: 'dashboard', label: 'Inicio', icon: Home },
    { id: 'sales', label: 'Ventas', icon: DollarSign },
    { id: 'expenses', label: 'Egresos', icon: TrendingDown },
    { id: 'products', label: 'Catálogo', icon: Tag },
    { id: 'stock', label: 'Stock', icon: Package },
    { id: 'orders', label: 'Pedidos', icon: ClipboardList },
  ];

  return (
    <main className="flex-1 bg-gray-50 min-h-screen text-gray-900 pb-16">
      {/* Header Fijo */}
      <header className="sticky top-0 bg-white border-b border-gray-150 py-3 px-4 flex justify-between items-center z-50 shadow-sm">
        <h1 className="text-md font-black tracking-tight text-gray-800 flex items-center gap-1.5">
          <span>⚙️ Control 3D</span>
        </h1>
        <span className="text-[10px] bg-blue-50 text-blue-600 font-bold px-2.5 py-0.5 rounded-full">
          {navItems.find(item => item.id === activeTab)?.label}
        </span>
      </header>

      {/* Contenido Principal */}
      <div className="max-w-md mx-auto p-4">
        {renderContent()}
      </div>

      {/* Barra de Navegación Inferior Móvil */}
      <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 shadow-xl z-50">
        <nav className="max-w-md mx-auto py-1 px-1 flex justify-around items-center">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = activeTab === item.id;
            return (
              <button
                key={item.id}
                onClick={() => setActiveTab(item.id)}
                className={`flex flex-col items-center justify-center flex-1 py-1 rounded-lg transition-all ${
                  isActive 
                    ? 'text-blue-600 font-bold bg-blue-50/70' 
                    : 'text-gray-400 hover:text-gray-600'
                }`}
              >
                <Icon size={18} className={isActive ? 'stroke-[2.5px]' : 'stroke-[1.8px]'} />
                <span className="text-[9px] mt-0.5 tracking-tight truncate w-full text-center">
                  {item.label}
                </span>
              </button>
            );
          })}
        </nav>
      </div>
    </main>
  );
}
