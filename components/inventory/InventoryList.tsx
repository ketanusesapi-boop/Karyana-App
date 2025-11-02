import React, { useState, useMemo } from 'react';
import { useData } from '../../context/DataContext';
import { Product } from '../../types';
import Modal from '../ui/Modal';
import InventoryImportModal from './InventoryImportModal';

interface InventoryListProps {
  onEditProduct: (product: Product) => void;
  onAddNewProduct: () => void;
}

const InventoryList: React.FC<InventoryListProps> = ({ onEditProduct, onAddNewProduct }) => {
  const { 
    inventory, 
    deleteProduct, 
    inventoryLoading,
    loadingMoreInventory,
    fetchMoreInventory,
    hasMoreInventory
  } = useData();
  const [searchTerm, setSearchTerm] = useState('');
  const [productToDelete, setProductToDelete] = useState<Product | null>(null);
  const [isImportModalOpen, setImportModalOpen] = useState(false);

  const filteredInventory = useMemo(() => {
    if (!searchTerm) {
      return inventory;
    }
    return inventory.filter(product =>
      product.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (product.category && product.category.toLowerCase().includes(searchTerm.toLowerCase()))
    );
  }, [inventory, searchTerm]);

  const confirmDelete = () => {
    if (productToDelete) {
      deleteProduct(productToDelete.id);
      setProductToDelete(null);
    }
  };

  if (inventoryLoading) {
    return <div className="text-center p-10">Loading inventory...</div>;
  }

  return (
    <div className="bg-card-light dark:bg-card-dark p-4 sm:p-6 rounded-lg shadow-md pb-16 md:pb-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6 gap-4">
        <h2 className="text-2xl font-bold">Inventory Management</h2>
        <div className="flex items-center space-x-2 w-full sm:w-auto">
          <input
            type="text"
            placeholder="Search loaded products..."
            value={searchTerm}
            onChange={e => setSearchTerm(e.target.value)}
            className="w-full sm:w-64 px-3 py-2 border border-border-light dark:border-border-dark rounded-md shadow-sm focus:outline-none focus:ring-primary focus:border-primary bg-transparent"
          />
           <button onClick={() => setImportModalOpen(true)} className="px-4 py-2 text-sm font-medium border border-secondary text-secondary rounded-md hover:bg-secondary/10 whitespace-nowrap">
            Import CSV
          </button>
        </div>
      </div>
      
      <div>
        <table className="min-w-full responsive-table dark">
          <thead className="bg-slate-50 dark:bg-slate-800">
            <tr>
              <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-subtle-light dark:text-subtle-dark uppercase tracking-wider">Product Name</th>
              <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-subtle-light dark:text-subtle-dark uppercase tracking-wider">Type</th>
              <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-subtle-light dark:text-subtle-dark uppercase tracking-wider">Stock</th>
              <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-subtle-light dark:text-subtle-dark uppercase tracking-wider">Purchase Price</th>
              <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-subtle-light dark:text-subtle-dark uppercase tracking-wider">Selling Price</th>
              <th scope="col" className="relative px-6 py-3"><span className="sr-only">Actions</span></th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border-light dark:divide-border-dark">
            {filteredInventory.length > 0 ? filteredInventory.map(product => (
              <tr key={product.id} className="bg-card-light dark:bg-card-dark hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors">
                <td data-label="Product Name" className="px-6 py-4 whitespace-nowrap font-medium text-primary dark:text-text-dark">
                    {product.name}
                </td>
                <td data-label="Type" className="px-6 py-4 whitespace-nowrap text-sm">
                    <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                        product.type === 'item' ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900 dark:text-emerald-200' : 'bg-sky-100 text-sky-800 dark:bg-sky-900 dark:text-sky-200'
                    }`}>
                        {product.type === 'item' ? 'Item' : 'Service'}
                    </span>
                </td>
                <td data-label="Stock" className={`px-6 py-4 whitespace-nowrap text-sm font-semibold ${product.type === 'item' && product.stock <= product.lowStockThreshold ? 'text-red-500' : 'text-primary dark:text-subtle-dark'}`}>
                    {product.type === 'item' ? (
                        <>
                            {product.stock}
                            <span className="text-xs text-primary dark:text-subtle-dark"> / {product.lowStockThreshold}</span>
                        </>
                    ) : (
                        <span className="text-subtle-light dark:text-subtle-dark">—</span>
                    )}
                </td>
                <td data-label="Purchase Price" className="px-6 py-4 whitespace-nowrap text-sm text-primary dark:text-subtle-dark">
                    {product.type === 'item' ? `₹${product.purchasePrice.toFixed(2)}` : <span className="text-subtle-light dark:text-subtle-dark">—</span>}
                </td>
                <td data-label="Selling Price" className="px-6 py-4 whitespace-nowrap text-sm text-primary dark:text-subtle-dark">₹{product.sellingPrice.toFixed(2)}</td>
                <td data-label="Actions" className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium space-x-4 text-primary dark:text-subtle-dark">
                  <button onClick={() => onEditProduct(product)} className="text-primary hover:text-primary-hover font-semibold">Edit</button>
                  <button onClick={() => setProductToDelete(product)} className="text-red-600 hover:text-red-800 font-semibold">Delete</button>
                </td>
              </tr>
            )) : (
              <tr>
                <td colSpan={6} className="placeholder-cell text-center py-10 text-gray-500 dark:text-gray-400">
                  {inventory.length === 0 ? 'No products in inventory. Click "Add Product" in the header to get started.' : 'No products match your search.'}
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
      
      {hasMoreInventory && (
        <div className="mt-6 flex justify-center">
          <button
            onClick={fetchMoreInventory}
            disabled={loadingMoreInventory}
            className="px-6 py-2 text-sm font-medium text-white bg-primary rounded-md hover:bg-primary-hover focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary disabled:bg-slate-400 disabled:cursor-not-allowed"
          >
            {loadingMoreInventory ? 'Loading...' : 'Load More'}
          </button>
        </div>
      )}

      {productToDelete && (
        <Modal isOpen={!!productToDelete} onClose={() => setProductToDelete(null)} title="Confirm Deletion">
          <div className="space-y-4">
            <p>Are you sure you want to permanently delete "{productToDelete.name}"? This action cannot be undone.</p>
            <div className="flex justify-end space-x-3 pt-4">
              <button onClick={() => setProductToDelete(null)} className="px-4 py-2 text-sm font-medium rounded-md border border-border-light dark:border-border-dark hover:bg-slate-100 dark:hover:bg-slate-700">
                Cancel
              </button>
              <button onClick={confirmDelete} className="px-4 py-2 text-sm font-medium text-white bg-red-600 rounded-md hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500">
                Yes, Delete
              </button>
            </div>
          </div>
        </Modal>
      )}

      {isImportModalOpen && (
        <InventoryImportModal onClose={() => setImportModalOpen(false)} />
      )}
    </div>
  );
};

export default InventoryList;