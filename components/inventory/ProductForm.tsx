import React, { useState, useEffect } from 'react';
import { useData } from '../../context/DataContext';
import { Product } from '../../types';
import Modal from '../ui/Modal';

interface ProductFormProps {
  product?: Product;
  onClose: () => void;
}

const ProductForm: React.FC<ProductFormProps> = ({ product, onClose }) => {
  const { addProduct, updateProduct } = useData();
  const [productType, setProductType] = useState<'item' | 'service'>('item');
  const [formData, setFormData] = useState({
    name: '',
    stock: '',
    purchasePrice: '',
    sellingPrice: '',
    lowStockThreshold: ''
  });
  const [error, setError] = useState('');

  useEffect(() => {
    if (product) {
      setProductType(product.type || 'item');
      setFormData({
        name: product.name,
        stock: String(product.stock),
        purchasePrice: String(product.purchasePrice),
        sellingPrice: String(product.sellingPrice),
        lowStockThreshold: String(product.lowStockThreshold)
      });
    } else {
        setProductType('item');
        setFormData({
            name: '', stock: '', purchasePrice: '', sellingPrice: '', lowStockThreshold: ''
        });
    }
  }, [product]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    const { name, stock, purchasePrice, sellingPrice, lowStockThreshold } = formData;

    if (!name || !sellingPrice) {
      setError('Please fill out Name and Selling Price.');
      return;
    }
    if (productType === 'item' && (!stock || !purchasePrice || !lowStockThreshold)) {
      setError('For items, please fill out all stock and price fields.');
      return;
    }

    let newProductData: Omit<Product, 'id'>;

    if (productType === 'item') {
        const stockNum = parseInt(stock, 10);
        const purchasePriceNum = parseFloat(purchasePrice);
        const sellingPriceNum = parseFloat(sellingPrice);
        const lowStockThresholdNum = parseInt(lowStockThreshold, 10);
        
        if (isNaN(stockNum) || isNaN(purchasePriceNum) || isNaN(sellingPriceNum) || isNaN(lowStockThresholdNum)) {
            setError('Please enter valid numbers for stock and prices.');
            return;
        }

        if (purchasePriceNum >= sellingPriceNum) {
            setError('Purchase Price must be lower than Selling Price to ensure profitability.');
            return;
        }

        newProductData = {
          name,
          type: 'item',
          sellingPrice: sellingPriceNum,
          stock: stockNum,
          purchasePrice: purchasePriceNum,
          lowStockThreshold: lowStockThresholdNum,
          category: '',
        };
    } else { // service
        const sellingPriceNum = parseFloat(sellingPrice);
        if (isNaN(sellingPriceNum)) {
             setError('Please enter a valid selling price.');
            return;
        }
        newProductData = {
          name,
          type: 'service',
          sellingPrice: sellingPriceNum,
          stock: 0,
          purchasePrice: 0,
          lowStockThreshold: 0,
          category: '',
        };
    }

    if (product) {
      // FIX: Ensure the new data properly merges with all fields of the existing product.
      const updatedProduct = { ...product, ...newProductData };
      updateProduct(updatedProduct);
    } else {
      addProduct(newProductData);
    }
    onClose();
  };

  return (
    <Modal isOpen={true} onClose={onClose} title={product ? 'Edit Product' : 'Add New Product'}>
      <form onSubmit={handleSubmit} className="space-y-6">
        {error && <p className="text-red-500 bg-red-100 dark:bg-red-900/30 p-3 rounded-md">{error}</p>}
        
        <div>
            <label className="block text-sm font-medium text-text-light dark:text-text-dark mb-2">Product Type</label>
            <div className="flex w-full bg-slate-200 dark:bg-slate-700 rounded-lg p-1">
                <button type="button" onClick={() => setProductType('item')} className={`w-1/2 py-2 text-sm font-semibold rounded-md transition-colors ${productType === 'item' ? 'bg-primary text-white shadow' : 'text-text-light dark:text-text-dark'}`}>
                    Item
                </button>
                <button type="button" onClick={() => setProductType('service')} className={`w-1/2 py-2 text-sm font-semibold rounded-md transition-colors ${productType === 'service' ? 'bg-primary text-white shadow' : 'text-text-light dark:text-text-dark'}`}>
                    Service
                </button>
            </div>
        </div>

        <div className="space-y-4">
            <div>
                <label htmlFor="name" className="block text-sm font-medium text-text-light dark:text-text-dark">{productType === 'item' ? 'Product Name' : 'Service Name'}</label>
                <input type="text" name="name" id="name" value={formData.name} onChange={handleChange} required className="mt-1 block w-full px-3 py-2 border border-border-light dark:border-border-dark rounded-md shadow-sm focus:outline-none focus:ring-primary focus:border-primary bg-transparent" />
            </div>

            {productType === 'item' && (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
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
            )}
            
            {productType === 'service' && (
                 <div>
                    <label htmlFor="sellingPrice" className="block text-sm font-medium text-text-light dark:text-text-dark">Selling Price (₹)</label>
                    <input type="number" name="sellingPrice" id="sellingPrice" value={formData.sellingPrice} onChange={handleChange} required min="0" step="0.01" className="mt-1 block w-full px-3 py-2 border border-border-light dark:border-border-dark rounded-md shadow-sm focus:outline-none focus:ring-primary focus:border-primary bg-transparent" />
                </div>
            )}
        </div>

        <div className="pt-4 flex justify-end space-x-3">
          <button type="button" onClick={onClose} className="px-4 py-2 text-sm font-medium rounded-md border border-border-light dark:border-border-dark hover:bg-slate-100 dark:hover:bg-slate-700">Cancel</button>
          <button type="submit" className="px-4 py-2 text-sm font-medium text-white bg-primary rounded-md hover:bg-primary-hover focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary">{product ? 'Update' : 'Add'}</button>
        </div>
      </form>
    </Modal>
  );
};

export default ProductForm;