import React, { useMemo } from 'react';
import { useData } from '../../context/DataContext';
import { PaymentMode } from '../../types';
import StatCard from './StatCard';
import TopItemsChart from './TopItemsChart';
import PaymentModeStats from './PaymentModeStats';

const Dashboard: React.FC = () => {
  const { inventory, sales, loading } = useData();

  const stats = useMemo(() => {
    const totalSales = sales.reduce((sum, sale) => sum + sale.totalAmount, 0);
    const totalProducts = inventory.length;
    const totalStock = inventory.reduce((sum, product) => sum + product.stock, 0);
    
    const totalCostOfGoods = sales.flatMap(s => s.items).reduce((sum, item) => sum + item.purchasePricePerItem * item.quantity, 0);
    const profit = totalSales - totalCostOfGoods;

    return { totalSales, totalProducts, totalStock, profit };
  }, [inventory, sales]);

  const topSellingItems = useMemo(() => {
    const itemSales: { [key: string]: number } = {};
    sales.forEach(sale => {
      sale.items.forEach(item => {
        if (itemSales[item.productId]) {
          itemSales[item.productId] += item.quantity;
        } else {
          itemSales[item.productId] = item.quantity;
        }
      });
    });

    return Object.entries(itemSales)
      .map(([productId, quantity]) => ({
        name: inventory.find(p => p.id === productId)?.name || 'Unknown',
        quantity,
      }))
      .sort((a, b) => b.quantity - a.quantity)
      .slice(0, 5); // Top 5
  }, [sales, inventory]);
  
  const paymentStats = useMemo(() => {
    const initialStats = Object.values(PaymentMode).reduce((acc, mode) => {
        acc[mode] = 0;
        return acc;
    }, {} as { [key in PaymentMode]: number });

    sales.forEach(sale => {
      if (initialStats.hasOwnProperty(sale.paymentMode)) {
        initialStats[sale.paymentMode] += sale.totalAmount;
      }
    });
    return initialStats;
  }, [sales]);

  if (loading) {
    return <div className="text-center p-10">Loading dashboard...</div>;
  }
  
  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard title="Total Revenue" value={`₹${stats.totalSales.toFixed(2)}`} />
        <StatCard title="Profit" value={`₹${stats.profit.toFixed(2)}`} />
        <StatCard title="Total Products" value={String(stats.totalProducts)} />
        <StatCard title="Items in Stock" value={String(stats.totalStock)} />
      </div>
      
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-card-light dark:bg-card-dark p-4 sm:p-6 rounded-lg shadow-md">
          <h3 className="text-lg font-semibold mb-4">Top 5 Selling Items</h3>
          {topSellingItems.length > 0 ? (
            <TopItemsChart data={topSellingItems} />
          ) : (
            <p className="text-center py-10 text-subtle-light dark:text-subtle-dark">No sales data to show chart.</p>
          )}
        </div>
        <PaymentModeStats stats={paymentStats} />
      </div>
    </div>
  );
};

export default Dashboard;