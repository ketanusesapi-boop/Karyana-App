import React, { createContext, useState, useEffect, useContext, ReactNode, useCallback } from 'react';
import { Product, Sale, AnalyticsSummary } from '../types';
import * as firebaseService from '../services/firebaseService';
import type { User } from '../services/firebaseService';
import { QueryDocumentSnapshot, DocumentData } from 'firebase/firestore';

interface DataContextState {
  inventory: Product[];
  analyticsSummary: AnalyticsSummary | null;
  loading: boolean;
  inventoryLoading: boolean;
  loadingMoreInventory: boolean;
  hasMoreInventory: boolean;
  fetchMoreInventory: () => void;
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

const PAGE_SIZE = 10;

export const DataProvider: React.FC<DataProviderProps> = ({ children, user }) => {
  const [inventory, setInventory] = useState<Product[]>([]);
  const [lastProductVisible, setLastProductVisible] = useState<QueryDocumentSnapshot<DocumentData> | null>(null);
  const [hasMoreInventory, setHasMoreInventory] = useState(true);
  const [inventoryLoading, setInventoryLoading] = useState(true);
  const [loadingMoreInventory, setLoadingMoreInventory] = useState(false);
  
  const [analyticsSummary, setAnalyticsSummary] = useState<AnalyticsSummary | null>(null);
  const [loading, setLoading] = useState(true);

  const userId = user.uid;

  const refetchData = useCallback(async () => {
    if (!userId) return;
    setLoading(true);
    setInventoryLoading(true);
    try {
        const [summary, { products, lastDoc }] = await Promise.all([
            firebaseService.getAnalyticsSummary(userId),
            firebaseService.getInventoryPaginated(userId, PAGE_SIZE, null)
        ]);
        
        setAnalyticsSummary(summary);
        setInventory(products);
        setLastProductVisible(lastDoc);
        setHasMoreInventory(products.length === PAGE_SIZE);

    } catch (error) {
        console.error("Failed to fetch data from Firebase", error);
    } finally {
        setLoading(false);
        setInventoryLoading(false);
    }
  }, [userId]);

  useEffect(() => {
    if (user) {
        refetchData();
    }
  }, [user, refetchData]);

  const fetchMoreInventory = useCallback(async () => {
    if (!userId || !lastProductVisible || loadingMoreInventory) return;
    setLoadingMoreInventory(true);
    try {
      const { products, lastDoc } = await firebaseService.getInventoryPaginated(userId, PAGE_SIZE, lastProductVisible);
      setInventory(prev => [...prev, ...products]);
      setLastProductVisible(lastDoc);
      setHasMoreInventory(products.length === PAGE_SIZE);
    } catch (error) {
      console.error("Failed to fetch more inventory:", error);
    } finally {
      setLoadingMoreInventory(false);
    }
  }, [userId, lastProductVisible, loadingMoreInventory]);

  const addProduct = useCallback(async (productData: Omit<Product, 'id'>) => {
    await firebaseService.addProduct(userId, productData);
    await refetchData();
  }, [userId, refetchData]);

  const updateProduct = useCallback(async (updatedProduct: Product) => {
    await firebaseService.updateProduct(userId, updatedProduct);
    await refetchData();
  }, [userId, refetchData]);
  
  const deleteProduct = useCallback(async (productId: string) => {
    await firebaseService.deleteProduct(userId, productId);
    await refetchData();
  }, [userId, refetchData]);

  const addSale = useCallback(async (saleData: Omit<Sale, 'id' | 'date'>) => {
    await firebaseService.addSale(userId, saleData);
    // Fetch analytics to get latest stats, but only refetch inventory if stock might be affected.
    // For now, a full refetch is simplest.
    await refetchData();
  }, [userId, refetchData]);

  const clearSales = useCallback(async () => {
      await firebaseService.clearSales(userId);
      // Only analytics is affected, so just refetch that.
      const summary = await firebaseService.getAnalyticsSummary(userId);
      setAnalyticsSummary(summary);
  }, [userId]);

  const value = {
    inventory,
    analyticsSummary,
    loading,
    inventoryLoading,
    loadingMoreInventory,
    hasMoreInventory,
    fetchMoreInventory,
    addProduct,
    updateProduct,
    deleteProduct,
    addSale,
    clearSales,
    refetchData,
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