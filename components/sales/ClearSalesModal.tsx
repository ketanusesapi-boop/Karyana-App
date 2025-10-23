import React from 'react';
import { useData } from '../../context/DataContext';
import Modal from '../ui/Modal';

interface ClearSalesModalProps {
  onClose: () => void;
}

const ClearSalesModal: React.FC<ClearSalesModalProps> = ({ onClose }) => {
  const { clearSales } = useData();

  const handleClear = () => {
    clearSales();
    onClose();
  };

  return (
    <Modal isOpen={true} onClose={onClose} title="Clear Sales History">
      <div className="space-y-4">
        <p>Are you sure you want to permanently delete all sales history? This action cannot be undone.</p>
        <div className="flex justify-end space-x-3">
          <button onClick={onClose} className="px-4 py-2 text-sm font-medium rounded-md border border-border-light dark:border-border-dark hover:bg-slate-100 dark:hover:bg-slate-700">
            Cancel
          </button>
          <button onClick={handleClear} className="px-4 py-2 text-sm font-medium text-white bg-red-600 rounded-md hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500">
            Yes, Clear History
          </button>
        </div>
      </div>
    </Modal>
  );
};

export default ClearSalesModal;
