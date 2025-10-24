import React, { createContext, useState, useEffect, useContext, ReactNode, useCallback } from 'react';
import { Product, Sale } from '../types';
import * as firebaseService from '../services/firebaseService';
// FIX: Import User type from our own service to avoid direct dependency on firebase libraries in components.
import type { User } from '../services/firebaseService';

interface DataContextState {
  inventory: Product[];
  sales: Sale[];
  loading: boolean;
  addProduct: (product: Omit<Product, 'id'>) => Promise<void>;
  updateProduct: (product: Product) => Promise<void>;
  deleteProduct: (productId: string) => Promise<void>;
  addSale: (sale: Omit<Sale, 'id' | 'date'>) => Promise<void>;
  clearSales: () => Promise<void>;
  refetchData: () => Promise<void>;
}

const DataContext = createContext<DataContextState | undefined>(undefined);

interface DataProviderProps {
    children: ReactNode;
    user: User;
}

export const DataProvider: React.FC<DataProviderProps> = ({ children, user }) => {
  const [inventory, setInventory] = useState<Product[]>([]);
  const [sales, setSales] = useState<Sale[]>([]);
  const [loading, setLoading] = useState(true);

  const userId = user.uid;

  const fetchData = useCallback(async () => {
    if (!userId) return;
    try {
      setLoading(true);
      const [fetchedInventory, fetchedSales] = await Promise.all([
        firebaseService.getInventory(userId),
        firebaseService.getSales(userId),
      ]);
      setInventory(fetchedInventory);
      setSales(fetchedSales);
    } catch (error) {
      console.error("Failed to fetch data from Firebase", error);
    } finally {
      setLoading(false);
    }
  }, [userId]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const addProduct = useCallback(async (productData: Omit<Product, 'id'>) => {
    const newProduct = await firebaseService.addProduct(userId, productData);
    setInventory(prev => [...prev, newProduct]);
  }, [userId]);

  const updateProduct = useCallback(async (updatedProduct: Product) => {
    await firebaseService.updateProduct(userId, updatedProduct);
    setInventory(prev => prev.map(p => p.id === updatedProduct.id ? updatedProduct : p));
  }, [userId]);
  
  const deleteProduct = useCallback(async (productId: string) => {
    await firebaseService.deleteProduct(userId, productId);
    setInventory(prev => prev.filter(p => p.id !== productId));
  }, [userId]);

  const addSale = useCallback(async (saleData: Omit<Sale, 'id' | 'date'>) => {
    // FIX: The `addSale` function in firebaseService expects only 2 arguments.
    const newSale = await firebaseService.addSale(userId, saleData);
    setSales(prev => [newSale, ...prev]);

    setInventory(prevInventory => {
      const newInventory = [...prevInventory];
      newSale.items.forEach(item => {
        const productIndex = newInventory.findIndex(p => p.id === item.productId);
        if (productIndex !== -1) {
          newInventory[productIndex] = {
            ...newInventory[productIndex],
            stock: newInventory[productIndex].stock - item.quantity,
          };
        }
      });
      return newInventory;
    });
    // FIX: Removed `inventory` from dependency array as it is not needed when using a functional update with `setInventory`.
  }, [userId]);

  const clearSales = useCallback(async () => {
      await firebaseService.clearSales(userId);
      setSales([]);
  }, [userId]);

  const value = {
    inventory,
    sales,
    loading,
    addProduct,
    updateProduct,
    deleteProduct,
    addSale,
    clearSales,
    refetchData: fetchData,
  };

  return <DataContext.Provider value={value}>{children}</DataContext.Provider>;
};

export const useData = () => {
  const context = useContext(DataContext);
  if (context === undefined) {
    throw new Error('useData must be used within a DataProvider');
  }
  return context;
};