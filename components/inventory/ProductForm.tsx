import React, { useState, useEffect } from 'react';
import { useData } from '../../context/DataContext';
import { Product } from '../../types';
import Modal from '../ui/Modal';

interface ProductFormProps {
  product?: Product;
  onClose: () => void;
}

const ProductForm: React.FC<ProductFormProps> = ({ product, onClose }) => {
  const { addProduct, updateProduct, inventory } = useData();
  const [formData, setFormData] = useState({
    name: '',
    stock: '',
    purchasePrice: '',
    sellingPrice: '',
    category: '',
    lowStockThreshold: ''
  });
  const [error, setError] = useState('');

  useEffect(() => {
    if (product) {
      setFormData({
        name: product.name,
        stock: String(product.stock),
        purchasePrice: String(product.purchasePrice),
        sellingPrice: String(product.sellingPrice),
        category: product.category,
        lowStockThreshold: String(product.lowStockThreshold)
      });
    }
  }, [product]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    const { name, stock, purchasePrice, sellingPrice, category, lowStockThreshold } = formData;
    if (!name || !stock || !purchasePrice || !sellingPrice || !lowStockThreshold) {
      setError('Please fill out all required fields.');
      return;
    }

    const newProductData = {
      name,
      stock: parseInt(stock, 10),
      purchasePrice: parseFloat(purchasePrice),
      sellingPrice: parseFloat(sellingPrice),
      category,
      lowStockThreshold: parseInt(lowStockThreshold, 10),
    };

    if (isNaN(newProductData.stock) || isNaN(newProductData.purchasePrice) || isNaN(newProductData.sellingPrice) || isNaN(newProductData.lowStockThreshold)) {
      setError('Please enter valid numbers for stock and prices.');
      return;
    }

    if (product) {
      updateProduct({ ...product, ...newProductData });
    } else {
      addProduct(newProductData);
    }
    onClose();
  };
  
  const categories = [...new Set(inventory.map(p => p.category).filter(Boolean))];

  return (
    <Modal isOpen={true} onClose={onClose} title={product ? 'Edit Product' : 'Add New Product'}>
      <form onSubmit={handleSubmit} className="space-y-4">
        {error && <p className="text-red-500 bg-red-100 dark:bg-red-900/30 p-3 rounded-md">{error}</p>}
        
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
                <label htmlFor="name" className="block text-sm font-medium text-text-light dark:text-text-dark">Product Name</label>
                <input type="text" name="name" id="name" value={formData.name} onChange={handleChange} required className="mt-1 block w-full px-3 py-2 border border-border-light dark:border-border-dark rounded-md shadow-sm focus:outline-none focus:ring-primary focus:border-primary bg-transparent" />
            </div>
            <div>
                <label htmlFor="category" className="block text-sm font-medium text-text-light dark:text-text-dark">Category</label>
                <input type="text" name="category" id="category" list="categories" value={formData.category} onChange={handleChange} className="mt-1 block w-full px-3 py-2 border border-border-light dark:border-border-dark rounded-md shadow-sm focus:outline-none focus:ring-primary focus:border-primary bg-transparent" />
                <datalist id="categories">
                  {categories.map(cat => <option key={cat} value={cat} />)}
                </datalist>
            </div>
            <div>
                <label htmlFor="stock" className="block text-sm font-medium text-text-light dark:text-text-dark">Stock Quantity</label>
                <input type="number" name="stock" id="stock" value={formData.stock} onChange={handleChange} required min="0" className="mt-1 block w-full px-3 py-2 border border-border-light dark:border-border-dark rounded-md shadow-sm focus:outline-none focus:ring-primary focus:border-primary bg-transparent" />
            </div>
             <div>
                <label htmlFor="lowStockThreshold" className="block text-sm font-medium text-text-light dark:text-text-dark">Low Stock Threshold</label>
                <input type="number" name="lowStockThreshold" id="lowStockThreshold" value={formData.lowStockThreshold} onChange={handleChange} required min="0" className="mt-1 block w-full px-3 py-2 border border-border-light dark:border-border-dark rounded-md shadow-sm focus:outline-none focus:ring-primary focus:border-primary bg-transparent" />
            </div>
            <div>
                <label htmlFor="purchasePrice" className="block text-sm font-medium text-text-light dark:text-text-dark">Purchase Price (₹)</label>
                <input type="number" name="purchasePrice" id="purchasePrice" value={formData.purchasePrice} onChange={handleChange} required min="0" step="0.01" className="mt-1 block w-full px-3 py-2 border border-border-light dark:border-border-dark rounded-md shadow-sm focus:outline-none focus:ring-primary focus:border-primary bg-transparent" />
            </div>
            <div>
                <label htmlFor="sellingPrice" className="block text-sm font-medium text-text-light dark:text-text-dark">Selling Price (₹)</label>
                <input type="number" name="sellingPrice" id="sellingPrice" value={formData.sellingPrice} onChange={handleChange} required min="0" step="0.01" className="mt-1 block w-full px-3 py-2 border border-border-light dark:border-border-dark rounded-md shadow-sm focus:outline-none focus:ring-primary focus:border-primary bg-transparent" />
            </div>
        </div>

        <div className="pt-4 flex justify-end space-x-3">
          <button type="button" onClick={onClose} className="px-4 py-2 text-sm font-medium rounded-md border border-border-light dark:border-border-dark hover:bg-slate-100 dark:hover:bg-slate-700">Cancel</button>
          <button type="submit" className="px-4 py-2 text-sm font-medium text-white bg-primary rounded-md hover:bg-primary-hover focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary">{product ? 'Update Product' : 'Add Product'}</button>
        </div>
      </form>
    </Modal>
  );
};

export default ProductForm;