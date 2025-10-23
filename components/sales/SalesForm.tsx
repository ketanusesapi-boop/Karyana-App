import React, { useState, useMemo, useCallback } from 'react';
import { useData } from '../../context/DataContext';
import { Sale, SaleItem, PaymentMode, Product } from '../../types';
import Modal from '../ui/Modal';

interface CartItem extends SaleItem {
    name: string;
    stock: number;
}

interface SalesFormProps {
  onClose: () => void;
}

const SalesForm: React.FC<SalesFormProps> = ({ onClose }) => {
    const { inventory, addSale } = useData();
    const [cart, setCart] = useState<CartItem[]>([]);
    const [searchTerm, setSearchTerm] = useState('');
    const [paymentMode, setPaymentMode] = useState<PaymentMode>(PaymentMode.Cash);
    const [error, setError] = useState('');

    const filteredInventory = useMemo(() => {
        if (!searchTerm.trim()) {
            return [];
        }
        const lowercasedTerm = searchTerm.toLowerCase();
        return inventory.filter(p =>
            p.name.toLowerCase().includes(lowercasedTerm) &&
            p.stock > 0 &&
            !cart.some(item => item.productId === p.id)
        );
    }, [inventory, cart, searchTerm]);

    const addProductToSale = useCallback((product: Product) => {
        setError('');
        
        if (product.stock < 1) {
            setError(`${product.name} is out of stock.`);
            return;
        }

        const newItem: CartItem = {
            productId: product.id,
            quantity: 1,
            pricePerItem: product.sellingPrice,
            purchasePricePerItem: product.purchasePrice,
            name: product.name,
            stock: product.stock,
        };

        setCart(prev => [...prev, newItem]);
        setSearchTerm('');
    }, []);

    const updateQuantity = (productId: string, value: string) => {
        setError('');
        const newQuantity = parseInt(value, 10);
        
        setCart(prevCart =>
            prevCart.map(item => {
                if (item.productId === productId) {
                    if (value === '') {
                        return { ...item, quantity: 0 }; // Allow empty input temporarily by setting quantity to 0
                    }
                    if (isNaN(newQuantity) || newQuantity < 1) {
                        return item; // Ignore invalid characters or values less than 1
                    }
                    if (newQuantity > item.stock) {
                        setError(`Not enough stock for ${item.name}. Only ${item.stock} available.`);
                        return { ...item, quantity: item.stock };
                    }
                    return { ...item, quantity: newQuantity };
                }
                return item;
            })
        );
    };

    const handleRemoveItem = (productId: string) => {
        setCart(prev => prev.filter(item => item.productId !== productId));
    };

    const totalAmount = useMemo(() => {
        return cart.reduce((sum, item) => sum + (item.pricePerItem * item.quantity), 0);
    }, [cart]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');
        if (cart.length === 0) {
            setError('Please add at least one item to the sale.');
            return;
        }

        if (cart.some(item => item.quantity <= 0)) {
            setError('All items must have a quantity of at least 1.');
            return;
        }

        try {
            const saleData: Omit<Sale, 'id' | 'date'> = {
                items: cart.map(({ name, stock, ...item }) => item),
                totalAmount,
                paymentMode,
            };
            await addSale(saleData);
            onClose();
        } catch (err: any) {
            setError(err.message || 'Failed to record sale.');
        }
    };

    return (
        <Modal isOpen={true} onClose={onClose} title="New Sale">
            <form onSubmit={handleSubmit} className="space-y-4 pb-24">
                {error && <p className="text-red-500 bg-red-100 dark:bg-red-900/30 p-3 rounded-md text-sm">{error}</p>}
                
                <div className="relative">
                    <label htmlFor="search-product" className="block text-sm font-medium mb-1">Search Products</label>
                    <input
                        id="search-product"
                        type="text"
                        value={searchTerm}
                        onChange={e => setSearchTerm(e.target.value)}
                        placeholder="Start typing product name..."
                        autoComplete="off"
                        className="w-full px-3 py-2 border border-border-light dark:border-border-dark rounded-md shadow-sm focus:outline-none focus:ring-primary focus:border-primary bg-transparent"
                    />
                    {filteredInventory.length > 0 && (
                        <div className="absolute z-10 w-full mt-1 bg-card-light dark:bg-slate-800 border border-border-light dark:border-border-dark rounded-md shadow-lg max-h-48 overflow-y-auto">
                            {filteredInventory.map(product => (
                                <div
                                    key={product.id}
                                    onClick={() => addProductToSale(product)}
                                    className="p-3 cursor-pointer hover:bg-slate-100 dark:hover:bg-slate-700 flex justify-between items-center"
                                >
                                    <div>
                                        <span className="font-medium">{product.name}</span>
                                        <span className="text-sm text-subtle-light dark:text-subtle-dark ml-2">(Stock: {product.stock})</span>
                                    </div>
                                    <span className="text-sm font-semibold">₹{product.sellingPrice.toFixed(2)}</span>
                                </div>
                            ))}
                        </div>
                    )}
                </div>

                <div className="space-y-3">
                    <h3 className="font-semibold text-lg border-b border-border-light dark:border-border-dark pb-2">
                        Sale Items ({cart.length})
                    </h3>
                    {cart.length > 0 ? (
                        <div className="space-y-2 max-h-60 overflow-y-auto pr-2">
                            {cart.map(item => (
                                <div key={item.productId} className="flex flex-col sm:flex-row justify-between sm:items-center bg-slate-50 dark:bg-slate-800/50 p-3 rounded-md gap-2">
                                    <div className="flex-grow">
                                        <p className="font-semibold">{item.name}</p>
                                        <p className="text-sm text-subtle-light dark:text-subtle-dark">@ ₹{item.pricePerItem.toFixed(2)} each</p>
                                    </div>
                                    <div className="flex items-center space-x-2">
                                        <label htmlFor={`quantity-${item.productId}`} className="text-sm font-medium">Qty:</label>
                                        <input
                                            type="number"
                                            id={`quantity-${item.productId}`}
                                            value={item.quantity === 0 ? '' : item.quantity}
                                            onChange={(e) => updateQuantity(item.productId, e.target.value)}
                                            min="1"
                                            max={item.stock}
                                            className="w-16 px-2 py-1 border border-border-light dark:border-border-dark rounded-md bg-transparent text-center"
                                            aria-label={`Quantity for ${item.name}`}
                                        />
                                        <p className="font-semibold w-24 text-right">₹{(item.quantity * item.pricePerItem).toFixed(2)}</p>
                                        <button type="button" onClick={() => handleRemoveItem(item.productId)} className="text-red-500 hover:text-red-700 text-2xl font-bold leading-none p-1" aria-label={`Remove ${item.name}`}>&times;</button>
                                    </div>
                                </div>
                            ))}
                        </div>
                    ) : (
                        <p className="text-center py-4 text-subtle-light dark:text-subtle-dark">
                            Search for a product to add it to the sale.
                        </p>
                    )}
                </div>
                
                <div className="border-t border-border-light dark:border-border-dark pt-4">
                    <div className="flex justify-between items-center">
                        <span className="text-xl font-bold">Total: ₹{totalAmount.toFixed(2)}</span>
                        {/* Using a relative container to ensure the dropdown menu appears above other elements in the modal */}
                        <div className="relative">
                            <select
                                id="paymentMode"
                                value={paymentMode}
                                onChange={e => setPaymentMode(e.target.value as PaymentMode)}
                                className="w-40 p-2 border border-border-light dark:border-border-dark rounded-md shadow-sm focus:outline-none focus:ring-primary focus:border-primary bg-card-light dark:bg-card-dark"
                                aria-label="Payment Mode"
                            >
                                {Object.values(PaymentMode).map(mode => <option key={mode} value={mode}>{mode}</option>)}
                            </select>
                        </div>
                    </div>
                </div>

                <div className="pt-2 flex justify-end space-x-3">
                    <button type="button" onClick={onClose} className="px-4 py-2 text-sm font-medium rounded-md border border-border-light dark:border-border-dark hover:bg-slate-100 dark:hover:bg-slate-700">Cancel</button>
                    <button type="submit" disabled={cart.length === 0} className="px-4 py-2 text-sm font-medium text-white bg-secondary rounded-md hover:bg-secondary-hover focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-secondary disabled:bg-slate-400 disabled:cursor-not-allowed">Record Sale</button>
                </div>
            </form>
        </Modal>
    );
};

export default SalesForm;