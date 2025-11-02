import React, { useMemo, useState, useEffect } from 'react';
import { Product } from '../../types';
import { getInventory, auth } from '../../services/firebaseService';

interface LowStockPageProps {
  onEditProduct: (product: Product) => void;
}

const LowStockPage: React.FC<LowStockPageProps> = ({ onEditProduct }) => {
  const [fullInventory, setFullInventory] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchAllInventory = async () => {
      if (auth.currentUser) {
        setLoading(true);
        try {
          const items = await getInventory(auth.currentUser.uid);
          setFullInventory(items);
        } catch (error) {
          console.error("Failed to fetch full inventory for low stock page:", error);
        } finally {
          setLoading(false);
        }
      }
    };
    fetchAllInventory();
  }, []);


  const lowStockItems = useMemo(() => {
    return fullInventory
      .filter(p => p.type === 'item' && p.stock <= p.lowStockThreshold)
      .sort((a, b) => a.stock - b.stock);
  }, [fullInventory]);

  if (loading) {
    return <div className="text-center p-10">Loading low stock items...</div>;
  }

  return (
    <div className="bg-card-light dark:bg-card-dark p-4 sm:p-6 rounded-lg shadow-md">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-bold">Low Stock Items ({lowStockItems.length})</h2>
      </div>
      
      <div>
        <table className="min-w-full responsive-table dark">
          <thead className="bg-slate-50 dark:bg-slate-800">
            <tr>
              <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-subtle-light dark:text-subtle-dark uppercase tracking-wider">Product Name</th>
              <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-subtle-light dark:text-subtle-dark uppercase tracking-wider">Category</th>
              <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-subtle-light dark:text-subtle-dark uppercase tracking-wider">Current Stock</th>
              <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-subtle-light dark:text-subtle-dark uppercase tracking-wider">Threshold</th>
              <th scope="col" className="relative px-6 py-3"><span className="sr-only">Actions</span></th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border-light dark:divide-border-dark">
            {lowStockItems.length > 0 ? lowStockItems.map(product => (
              <tr key={product.id} className="bg-card-light dark:bg-card-dark hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors">
                <td data-label="Product Name" className="px-6 py-4 whitespace-nowrap font-medium text-primary dark:text-text-dark">{product.name}</td>
                <td data-label="Category" className="px-6 py-4 whitespace-nowrap text-sm text-primary dark:text-subtle-dark">{product.category || '-'}</td>
                <td data-label="Current Stock" className="px-6 py-4 whitespace-nowrap text-sm font-semibold text-red-500">{product.stock}</td>
                <td data-label="Threshold" className="px-6 py-4 whitespace-nowrap text-sm text-primary dark:text-subtle-dark">{product.lowStockThreshold}</td>
                <td data-label="Actions" className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium text-primary dark:text-subtle-dark">
                  <button onClick={() => onEditProduct(product)} className="text-primary hover:text-primary-hover font-semibold">
                    Edit / Restock
                  </button>
                </td>
              </tr>
            )) : (
              <tr>
                <td colSpan={5} className="placeholder-cell text-center py-10 text-gray-500 dark:text-gray-400">
                  No items are currently low on stock.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default LowStockPage;