import React, { useState, useMemo, useRef, useEffect, useCallback } from 'react';
import { downloadCSV } from '../../utils/csvExporter';
import ClearSalesModal from './ClearSalesModal';
import { Sale } from '../../types';
import ExportConfirmationModal from './ExportConfirmationModal';
import * as firebaseService from '../../services/firebaseService';
import { auth } from '../../services/firebaseService';
import { QueryDocumentSnapshot, DocumentData } from 'firebase/firestore';

const SettingsIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-6 h-6">
    <path strokeLinecap="round" strokeLinejoin="round" d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
    <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
  </svg>
);

const PAGE_SIZE = 10;

const SalesHistory: React.FC = () => {
  const [displayedSales, setDisplayedSales] = useState<Sale[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const [hasMore, setHasMore] = useState(true);
  const [lastVisibleDoc, setLastVisibleDoc] = useState<QueryDocumentSnapshot<DocumentData> | null>(null);

  const [isClearModalOpen, setClearModalOpen] = useState(false);
  const [isExportModalOpen, setExportModalOpen] = useState(false);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const settingsRef = useRef<HTMLDivElement>(null);
  const [searchTerm, setSearchTerm] = useState('');

  const userId = auth.currentUser?.uid;

  useEffect(() => {
    if (!userId) return;

    const fetchFirstPage = async () => {
      setIsLoading(true);
      try {
        const { sales: firstPageSales, lastDoc } = await firebaseService.getSalesPaginated(userId, PAGE_SIZE, null);
        setDisplayedSales(firstPageSales);
        setLastVisibleDoc(lastDoc);
        setHasMore(firstPageSales.length === PAGE_SIZE);
      } catch (error) {
        console.error("Failed to fetch first page of sales", error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchFirstPage();
  }, [userId]);

  const handleLoadMore = useCallback(async () => {
    if (!userId || !lastVisibleDoc || isLoadingMore) return;

    setIsLoadingMore(true);
    try {
      const { sales: newSales, lastDoc } = await firebaseService.getSalesPaginated(userId, PAGE_SIZE, lastVisibleDoc);
      setDisplayedSales(prev => [...prev, ...newSales]);
      setLastVisibleDoc(lastDoc);
      setHasMore(newSales.length === PAGE_SIZE);
    } catch (error) {
      console.error("Failed to load more sales", error);
    } finally {
      setIsLoadingMore(false);
    }
  }, [userId, lastVisibleDoc, isLoadingMore]);

  const filteredSales = useMemo(() => {
    if (!searchTerm.trim()) {
      return displayedSales;
    }

    const lowercasedTerm = searchTerm.toLowerCase();

    return displayedSales.filter(sale => {
      const hasMatchingItem = sale.items.some(item =>
        item.productName.toLowerCase().includes(lowercasedTerm)
      );
      const hasMatchingAmount = sale.totalAmount.toString().includes(lowercasedTerm);
      const hasMatchingPayment = sale.paymentMode.toLowerCase().includes(lowercasedTerm);

      return hasMatchingItem || hasMatchingAmount || hasMatchingPayment;
    });
  }, [displayedSales, searchTerm]);

  const handleExport = async () => {
      alert("Exporting is not yet supported in this simplified view.");
  };

  const confirmAndExport = () => {
    handleExport();
    setExportModalOpen(false);
  };

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
        if (settingsRef.current && !settingsRef.current.contains(event.target as Node)) {
            setIsSettingsOpen(false);
        }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => {
        document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  return (
    <div className="bg-card-light dark:bg-card-dark p-4 sm:p-6 rounded-lg shadow-md pb-16 md:pb-6 space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold">Sales Transactions</h2>
        <div className="relative" ref={settingsRef}>
            <button 
                onClick={() => setIsSettingsOpen(!isSettingsOpen)} 
                className="p-2 rounded-full text-subtle-dark hover:bg-slate-700 transition-colors"
                aria-label="Sales History Settings"
            >
                <SettingsIcon />
            </button>
            {isSettingsOpen && (
                <div className="absolute right-0 mt-2 w-48 bg-card-dark rounded-md shadow-lg z-20 border border-border-dark py-1">
                    <button 
                        onClick={() => { setClearModalOpen(true); setIsSettingsOpen(false); }}
                        className="w-full text-left px-4 py-2 text-sm text-danger hover:bg-slate-700 transition-colors"
                    >
                        Clear History
                    </button>
                </div>
            )}
        </div>
      </div>
      
      <input
        type="text"
        placeholder="Search within loaded transactions..."
        value={searchTerm}
        onChange={e => setSearchTerm(e.target.value)}
        className="w-full px-3 py-2 border border-border-dark rounded-md shadow-sm focus:outline-none focus:ring-primary focus:border-primary bg-transparent"
      />

      <div className="space-y-4">
        {isLoading ? <div className="text-center p-10">Loading transactions...</div> :
         filteredSales.length > 0 ? filteredSales.map(sale => (
          <div key={sale.id} className="border border-border-light dark:border-border-dark rounded-lg p-4">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-2 gap-2">
              <div>
                <p className="text-xl font-bold text-primary">₹{sale.totalAmount.toFixed(2)}</p>
                <p className="text-sm text-subtle-light dark:text-subtle-dark">Payment: {sale.paymentMode}</p>
              </div>
              <div className="w-full sm:w-auto text-left sm:text-right">
                <p className="text-sm text-subtle-light dark:text-subtle-dark">{new Date(sale.date).toLocaleString()}</p>
              </div>
            </div>
            <div className="mt-2 border-t border-border-light dark:border-border-dark pt-2">
              <h4 className="font-semibold text-sm mb-1">Items:</h4>
              <ul className="list-disc list-inside text-sm space-y-1">
                {sale.items.map((item, index) => (
                  <li key={`${item.productId}-${index}`}>{item.quantity} x {item.productName} @ ₹{item.pricePerItem.toFixed(2)} each</li>
                ))}
              </ul>
            </div>
          </div>
        )) : (
            <p className="text-center p-10 text-subtle-light dark:text-subtle-dark">
              No sales recorded yet.
            </p>
        )}
      </div>

      {hasMore && !isLoading && (
        <div className="mt-6 flex justify-center">
            <button
                onClick={handleLoadMore}
                disabled={isLoadingMore}
                className="px-6 py-2 text-sm font-medium text-white bg-primary rounded-md hover:bg-primary-hover focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary disabled:bg-slate-400 disabled:cursor-not-allowed"
            >
                {isLoadingMore ? 'Loading...' : 'Load More'}
            </button>
        </div>
      )}

      {isClearModalOpen && (
          <ClearSalesModal onClose={() => setClearModalOpen(false)} />
      )}
      {isExportModalOpen && (
        <ExportConfirmationModal 
            onClose={() => setExportModalOpen(false)}
            onConfirm={confirmAndExport}
        />
      )}
    </div>
  );
};

export default SalesHistory;