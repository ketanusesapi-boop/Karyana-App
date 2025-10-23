import React, { useState, useMemo } from 'react';
import { useData } from '../../context/DataContext';
import { downloadCSV } from '../../utils/csvExporter';
import ClearSalesModal from './ClearSalesModal';

const SalesHistory: React.FC = () => {
  const { sales, inventory, loading } = useData();
  const [isClearModalOpen, setClearModalOpen] = useState(false);
  
  const salesWithDetails = useMemo(() => {
    return sales.map(sale => ({
      ...sale,
      items: sale.items.map(item => ({
        ...item,
        name: inventory.find(p => p.id === item.productId)?.name || 'Unknown Product',
      })),
    }));
  }, [sales, inventory]);

  const handleExport = () => {
    if (salesWithDetails.length === 0) {
      alert("No sales data to export.");
      return;
    }
    const dataToExport = salesWithDetails.flatMap(sale => 
        sale.items.map(item => ({
            saleId: sale.id,
            date: new Date(sale.date).toLocaleString(),
            productName: item.name,
            quantity: item.quantity,
            pricePerItem: item.pricePerItem,
            totalPrice: item.quantity * item.pricePerItem,
            paymentMode: sale.paymentMode,
        }))
    );
    downloadCSV(dataToExport, `sales-history-${new Date().toISOString().split('T')[0]}.csv`);
  };

  if (loading) return <div className="text-center p-10">Loading sales history...</div>;

  return (
    <div className="bg-card-light dark:bg-card-dark p-4 sm:p-6 rounded-lg shadow-md pb-16 md:pb-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6 gap-4">
        <h2 className="text-2xl font-bold">Sales History</h2>
        <div className="flex space-x-2">
            <button onClick={handleExport} className="px-4 py-2 text-sm font-medium border border-primary text-primary rounded-md hover:bg-primary/10">Export CSV</button>
            <button onClick={() => setClearModalOpen(true)} className="px-4 py-2 text-sm font-medium text-white bg-red-600 rounded-md hover:bg-red-700">Clear History</button>
        </div>
      </div>
      
      <div className="space-y-4">
        {salesWithDetails.length > 0 ? salesWithDetails.map(sale => (
          <div key={sale.id} className="border border-border-light dark:border-border-dark rounded-lg p-4">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-2">
              <div>
                <p className="font-semibold">Sale ID: {sale.id}</p>
                <p className="text-sm text-subtle-light dark:text-subtle-dark">{new Date(sale.date).toLocaleString()}</p>
              </div>
              <div className="mt-2 sm:mt-0 text-right">
                <p className="text-lg font-bold text-primary">₹{sale.totalAmount.toFixed(2)}</p>
                <p className="text-sm text-subtle-light dark:text-subtle-dark">Payment: {sale.paymentMode}</p>
              </div>
            </div>
            <div className="mt-2 border-t border-border-light dark:border-border-dark pt-2">
              <h4 className="font-semibold text-sm mb-1">Items:</h4>
              <ul className="list-disc list-inside text-sm space-y-1">
                {sale.items.map((item, index) => (
                  <li key={`${item.productId}-${index}`}>{item.quantity} x {item.name} @ ₹{item.pricePerItem.toFixed(2)} each</li>
                ))}
              </ul>
            </div>
          </div>
        )) : (
            <p className="text-center p-10 text-subtle-light dark:text-subtle-dark">No sales have been recorded yet.</p>
        )}
      </div>

      {isClearModalOpen && (
          <ClearSalesModal onClose={() => setClearModalOpen(false)} />
      )}
    </div>
  );
};

export default SalesHistory;