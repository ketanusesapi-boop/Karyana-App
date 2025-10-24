import React from 'react';
import Modal from '../ui/Modal';

interface ExportConfirmationModalProps {
  onClose: () => void;
  onConfirm: () => void;
}

const ExportConfirmationModal: React.FC<ExportConfirmationModalProps> = ({ onClose, onConfirm }) => {
  return (
    <Modal isOpen={true} onClose={onClose} title="Confirm Export">
      <div className="space-y-4">
        <p className="text-text-light dark:text-text-dark">Are you sure you want to export the current view of sales history as a CSV file?</p>
        <div className="flex justify-end space-x-3 pt-4">
          <button onClick={onClose} className="px-4 py-2 text-sm font-medium rounded-md border border-border-light dark:border-border-dark hover:bg-slate-100 dark:hover:bg-slate-700">
            Cancel
          </button>
          <button onClick={onConfirm} className="px-4 py-2 text-sm font-medium text-white bg-primary rounded-md hover:bg-primary-hover focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary">
            Yes, Export
          </button>
        </div>
      </div>
    </Modal>
  );
};

export default ExportConfirmationModal;