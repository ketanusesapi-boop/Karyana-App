import React, { useState, useEffect } from 'react';
import { auth, onAuthStateChanged, User, getUserSubscription } from './services/firebaseService';
import { DataProvider } from './context/DataContext';
import Login from './components/auth/Login';
import Header from './components/layout/Header';
import Dashboard from './components/dashboard/Dashboard';
import InventoryList from './components/inventory/InventoryList';
import SalesHistory from './components/sales/SalesHistory';
import ProductForm from './components/inventory/ProductForm';
import SalesForm from './components/sales/SalesForm';
import { Product } from './types';
import LowStockPage from './components/lowstock/LowStockPage';
import SubscriptionExpired from './components/auth/SubscriptionExpired';

type View = 'dashboard' | 'inventory' | 'sales' | 'lowstock';

const App: React.FC = () => {
  const [user, setUser] = useState<User | null>(null);
  const [authLoading, setAuthLoading] = useState(true);
  const [isSubscribed, setIsSubscribed] = useState<boolean | null>(null);
  const [currentView, setCurrentView] = useState<View>('dashboard');

  const [isProductFormOpen, setProductFormOpen] = useState(false);
  const [isSalesFormOpen, setSalesFormOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | undefined>(undefined);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      setUser(user);
      if (user) {
        setIsSubscribed(null); // Set to checking state
        try {
          const subscription = await getUserSubscription(user.uid);
          setIsSubscribed(subscription.subscriptionStatus === 'active');
        } catch (error) {
          console.error("Failed to check subscription:", error);
          setIsSubscribed(false);
        }
      } else {
        setIsSubscribed(null);
      }
      setAuthLoading(false);
    });
    return () => unsubscribe();
  }, []);

  const handleEditProduct = (product: Product) => {
    setEditingProduct(product);
    setProductFormOpen(true);
  };

  const handleAddNewProduct = () => {
    setEditingProduct(undefined);
    setProductFormOpen(true);
  };
  
  const closeProductForm = () => {
    setEditingProduct(undefined);
    setProductFormOpen(false);
  }

  const isLoading = authLoading || (user && isSubscribed === null);
  if (isLoading) {
    return <div className="min-h-screen flex items-center justify-center bg-bg-light dark:bg-bg-dark text-text-dark">Checking access...</div>;
  }

  if (!user) {
    return <Login />;
  }
  
  if (!isSubscribed) {
    return <SubscriptionExpired />;
  }

  const renderView = () => {
    switch (currentView) {
      case 'dashboard':
        return <Dashboard />;
      case 'inventory':
        return <InventoryList onEditProduct={handleEditProduct} onAddNewProduct={handleAddNewProduct} />;
      case 'sales':
        return <SalesHistory />;
      case 'lowstock':
        return <LowStockPage onEditProduct={handleEditProduct} />;
      default:
        return <Dashboard />;
    }
  }

  return (
    <DataProvider user={user}>
      <div className="min-h-screen bg-bg-light dark:bg-bg-dark text-text-light dark:text-text-dark">
        <Header 
          onAddNewProduct={handleAddNewProduct}
          onNewSale={() => setSalesFormOpen(true)}
          currentView={currentView}
          setCurrentView={setCurrentView}
        />
        <main className="p-4 sm:p-6 pb-24 sm:pb-6">
          {renderView()}
        </main>
        {isProductFormOpen && <ProductForm onClose={closeProductForm} product={editingProduct} />}
        {isSalesFormOpen && <SalesForm onClose={() => setSalesFormOpen(false)} />}
      </div>
    </DataProvider>
  );
};

export default App;
