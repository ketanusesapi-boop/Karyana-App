import React from 'react';
import { auth, signOut } from '../../services/firebaseService';

const PlusIcon = () => <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-6 h-6 sm:w-5 sm:h-5"><path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" /></svg>;
const CurrencyRupeeIcon = () => <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-6 h-6 sm:w-5 sm:h-5"><path strokeLinecap="round" strokeLinejoin="round" d="M15 8.25H9m6 3H9m3 6l-3-3h1.5a3 3 0 100-6M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>;
const Squares2X2Icon = () => <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5"><path strokeLinecap="round" strokeLinejoin="round" d="M3.75 6A2.25 2.25 0 016 3.75h2.25A2.25 2.25 0 0110.5 6v2.25a2.25 2.25 0 01-2.25 2.25H6a2.25 2.25 0 01-2.25-2.25V6zM3.75 15.75A2.25 2.25 0 016 13.5h2.25a2.25 2.25 0 012.25 2.25V18a2.25 2.25 0 01-2.25 2.25H6A2.25 2.25 0 013.75 18v-2.25zM13.5 6a2.25 2.25 0 012.25-2.25H18A2.25 2.25 0 0120.25 6v2.25A2.25 2.25 0 0118 10.5h-2.25a2.25 2.25 0 01-2.25-2.25V6zM13.5 15.75a2.25 2.25 0 012.25-2.25H18a2.25 2.25 0 012.25 2.25V18A2.25 2.25 0 0118 20.25h-2.25A2.25 2.25 0 0113.5 18v-2.25z" /></svg>;
const CubeIcon = () => <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5"><path strokeLinecap="round" strokeLinejoin="round" d="M21 7.5l-9-5.25L3 7.5m18 0l-9 5.25m9-5.25v9l-9 5.25M3 7.5l9 5.25M3 7.5v9l9 5.25m0-9v9" /></svg>;
const ShoppingCartIcon = () => <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5"><path strokeLinecap="round" strokeLinejoin="round" d="M2.25 3h1.386c.51 0 .955.343 1.087.835l.383 1.437M7.5 14.25a3 3 0 00-3 3h15.75m-12.75-3h11.218c.51 0 .962-.343 1.087-.835l1.823-6.431A.75.75 0 0018.044 6H5.218a.75.75 0 00-.722.564L2.25 3z" /></svg>;
const ExclamationTriangleIcon = () => <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5"><path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126zM12 15.75h.007v.008H12v-.008z" /></svg>;
const ArrowRightOnRectangleIcon = () => <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5"><path strokeLinecap="round" strokeLinejoin="round" d="M15.75 9V5.25A2.25 2.25 0 0013.5 3h-6a2.25 2.25 0 00-2.25 2.25v13.5A2.25 2.25 0 007.5 21h6a2.25 2.25 0 002.25-2.25V15m3 0l3-3m0 0l-3-3m3 3H9" /></svg>;


type View = 'dashboard' | 'inventory' | 'sales' | 'lowstock';

interface HeaderProps {
  onAddNewProduct: () => void;
  onNewSale: () => void;
  currentView: View;
  setCurrentView: (view: View) => void;
}

const Header: React.FC<HeaderProps> = ({ onAddNewProduct, onNewSale, currentView, setCurrentView }) => {

  const handleLogout = async () => {
    try {
      // FIX: Switched to Firebase v9+ modular syntax for signOut.
      await signOut(auth);
    } catch (error) {
      console.error("Error signing out: ", error);
    }
  };

  const NavLink: React.FC<{ view: View; label: string; icon: React.ReactNode }> = ({ view, label, icon }) => (
    <button 
      onClick={() => setCurrentView(view)} 
      className={`flex items-center space-x-2 px-3 py-2 rounded-md text-sm font-medium transition-colors ${
        currentView === view 
        ? 'bg-primary/10 text-primary' 
        : 'text-subtle-light dark:text-subtle-dark hover:bg-slate-100 dark:hover:bg-slate-700'
      }`}
    >
      {icon}
      <span className="hidden sm:inline">{label}</span>
    </button>
  );

  return (
    <header className="bg-card-light dark:bg-card-dark shadow-md sticky top-0 z-40">
      <div className="mx-auto px-4 sm:px-6">
        <div className="flex justify-between items-center h-16">
          <div className="flex items-center space-x-2 sm:space-x-4">
            <div className="flex-shrink-0">
                <h1 className="text-xl sm:text-2xl font-bold text-primary dark:text-sky-400 whitespace-nowrap">ShopTrack</h1>
            </div>
            <nav className="flex space-x-1 sm:space-x-2">
              <NavLink view="dashboard" label="Dashboard" icon={<Squares2X2Icon />} />
              <NavLink view="inventory" label="Inventory" icon={<CubeIcon />} />
              <NavLink view="sales" label="Sales" icon={<ShoppingCartIcon />} />
              <NavLink view="lowstock" label="Low Stock" icon={<ExclamationTriangleIcon />} />
            </nav>
          </div>

          <div className="flex items-center space-x-2 sm:space-x-4">
            <button
                onClick={onNewSale}
                className="hidden sm:flex items-center space-x-2 px-3 py-2 text-sm font-medium text-white bg-secondary rounded-md hover:bg-secondary-hover"
            >
                <CurrencyRupeeIcon />
                <span>New Sale</span>
            </button>
             <button
                onClick={onAddNewProduct}
                className="hidden sm:flex items-center space-x-2 px-3 py-2 text-sm font-medium border border-primary text-primary rounded-md hover:bg-primary/10"
            >
                <PlusIcon />
                <span>Add Product</span>
            </button>
            <button 
              onClick={handleLogout} 
              className="text-subtle-light dark:text-subtle-dark hover:text-text-light dark:hover:text-text-dark"
              aria-label="Logout"
            >
              <span className="hidden sm:inline text-sm font-medium">Logout</span>
              <span className="sm:hidden">
                <ArrowRightOnRectangleIcon />
              </span>
            </button>
          </div>
        </div>
      </div>
      {/* Mobile Actions Footer */}
      <div className="sm:hidden fixed bottom-0 left-0 right-0 bg-card-light dark:bg-card-dark border-t border-border-light dark:border-border-dark flex justify-around py-2">
         <button
            onClick={onNewSale}
            className="flex flex-col items-center text-secondary text-xs font-medium space-y-1"
        >
            <CurrencyRupeeIcon />
            <span>New Sale</span>
        </button>
         <button
            onClick={onAddNewProduct}
            className="flex flex-col items-center text-primary text-xs font-medium space-y-1"
        >
            <PlusIcon />
            <span>Add Product</span>
        </button>
      </div>
    </header>
  );
};

export default Header;