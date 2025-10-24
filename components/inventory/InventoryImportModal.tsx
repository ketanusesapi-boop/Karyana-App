import React, { useState, useCallback } from 'react';
import Modal from '../ui/Modal';
import { useData } from '../../context/DataContext';
import { auth, batchAddProducts } from '../../services/firebaseService';
import { parseCSV } from '../../utils/csvParser';

interface InventoryImportModalProps {
  onClose: () => void;
}

const InventoryImportModal: React.FC<InventoryImportModalProps> = ({ onClose }) => {
    const { refetchData } = useData();
    const [file, setFile] = useState<File | null>(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');
    const [fileName, setFileName] = useState('');

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        setError('');
        setSuccess('');
        if (e.target.files && e.target.files[0]) {
            const selectedFile = e.target.files[0];
            if (selectedFile.type !== 'text/csv') {
                setError('Please select a valid .csv file.');
                setFile(null);
                setFileName('');
                return;
            }
            setFile(selectedFile);
            setFileName(selectedFile.name);
        }
    };

    const handleImport = useCallback(async () => {
        if (!file) {
            setError('Please select a file to import.');
            return;
        }
        if (!auth.currentUser) {
            setError('You must be logged in to import products.');
            return;
        }

        setLoading(true);
        setError('');
        setSuccess('');

        const reader = new FileReader();
        reader.onload = async (event) => {
            try {
                const csvText = event.target?.result as string;
                const productsToImport = await parseCSV(csvText);
                
                if (productsToImport.length === 0) {
                  throw new Error("No products found in the file to import.");
                }

                await batchAddProducts(auth.currentUser!.uid, productsToImport);
                setSuccess(`${productsToImport.length} products have been successfully imported.`);
                await refetchData(); // Refresh data in the main view
                setFile(null);
                setFileName('');
            } catch (err: any) {
                setError(err.message || 'An unknown error occurred during import.');
            } finally {
                setLoading(false);
            }
        };
        reader.onerror = () => {
            setError('Failed to read the file.');
            setLoading(false);
        };
        reader.readAsText(file);
    }, [file, refetchData]);
    
    const downloadTemplate = () => {
        const headers = "name,category,stock,purchasePrice,sellingPrice,lowStockThreshold";
        const exampleRow1 = "Sample Product A,Category 1,50,100.50,150.75,10";
        const exampleRow2 = "Sample Product B,Category 2,25,25.00,49.99,5";
        const content = `${headers}\n${exampleRow1}\n${exampleRow2}`;
        const blob = new Blob([content], { type: 'text/csv;charset=utf-8;' });
        const link = document.createElement('a');
        link.href = URL.createObjectURL(blob);
        link.setAttribute('download', 'inventory_template.csv');
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    }

    return (
        <Modal isOpen={true} onClose={onClose} title="Import Products from CSV">
            <div className="space-y-4">
                {error && <p className="text-red-500 bg-red-100 dark:bg-red-900/30 p-3 rounded-md text-sm">{error}</p>}
                {success && <p className="text-green-600 bg-green-100 dark:bg-green-900/30 p-3 rounded-md text-sm">{success}</p>}
                
                <div className="p-4 border border-dashed border-border-dark rounded-md">
                    <p className="text-sm text-subtle-dark mb-2">
                        Your CSV file must have the following headers in the first row (case-insensitive):
                    </p>
                    <code className="text-xs bg-slate-700 p-2 rounded-md block whitespace-pre-wrap">
                        name, category, stock, purchasePrice, sellingPrice, lowStockThreshold
                    </code>
                     <button onClick={downloadTemplate} className="text-sm text-primary hover:underline mt-2">
                        Download Template CSV
                    </button>
                </div>
                
                <div>
                    <label htmlFor="file-upload" className="w-full inline-flex justify-center items-center px-4 py-2 border border-border-dark shadow-sm text-sm font-medium rounded-md text-text-dark bg-slate-700 hover:bg-slate-600 cursor-pointer">
                        <svg className="w-5 h-5 mr-2" fill="currentColor" viewBox="0 0 20 20"><path d="M16.88 9.1A4 4 0 0116 17H5a5 5 0 01-1-9.9V7a3 3 0 014.52-2.59A4.98 4.98 0 0117 8c0 .28-.02.55-.05.81d.05-.06a3.5 3.5 0 00-3.02-5.24 3.5 3.5 0 00-3.27 5.29 5.006 5.006 0 00-2.25-1.72 5.003 5.003 0 00-5.45 5.45c.18.98.75 1.85 1.55 2.53A4 4 0 005 17h11a2 2 0 001.94-2.53 3.5 3.5 0 00.94-2.37z"></path></svg>
                        <span>{fileName || 'Select .csv file'}</span>
                    </label>
                    <input id="file-upload" name="file-upload" type="file" className="sr-only" onChange={handleFileChange} accept=".csv" />
                </div>

                <div className="pt-4 flex justify-end space-x-3">
                    <button type="button" onClick={onClose} className="px-4 py-2 text-sm font-medium rounded-md border border-border-dark hover:bg-slate-700">Cancel</button>
                    <button 
                        type="button" 
                        onClick={handleImport} 
                        disabled={!file || loading} 
                        className="px-4 py-2 text-sm font-medium text-white bg-primary rounded-md hover:bg-primary-hover focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary disabled:bg-slate-500 disabled:cursor-not-allowed"
                    >
                        {loading ? 'Importing...' : 'Import Products'}
                    </button>
                </div>
            </div>
        </Modal>
    );
};

export default InventoryImportModal;
