import { Product } from "../types";

export type ParsedProduct = Omit<Product, 'id'>;

export const parseCSV = (csvText: string): Promise<ParsedProduct[]> => {
    return new Promise((resolve, reject) => {
        try {
            const lines = csvText.split(/\r?\n/).filter(line => line.trim() !== '');
            if (lines.length < 2) {
                return reject(new Error("CSV file must have a header row and at least one data row."));
            }

            const header = lines[0].split(',').map(h => h.trim().toLowerCase());
            const requiredHeaders = ['name', 'stock', 'purchaseprice', 'sellingprice', 'category', 'lowstockthreshold'];
            
            for (const reqHeader of requiredHeaders) {
                if (!header.includes(reqHeader)) {
                    return reject(new Error(`Missing required CSV header column: ${reqHeader}. Please use the template.`));
                }
            }
            
            const products: ParsedProduct[] = [];
            for (let i = 1; i < lines.length; i++) {
                const values = lines[i].split(',');
                
                const name = values[header.indexOf('name')]?.trim();
                const stock = parseInt(values[header.indexOf('stock')]?.trim(), 10);
                const purchasePrice = parseFloat(values[header.indexOf('purchaseprice')]?.trim());
                const sellingPrice = parseFloat(values[header.indexOf('sellingprice')]?.trim());
                const category = values[header.indexOf('category')]?.trim() || '';
                const lowStockThreshold = parseInt(values[header.indexOf('lowstockthreshold')]?.trim(), 10);

                if (!name) {
                    return reject(new Error(`Row ${i + 1}: 'name' cannot be empty.`));
                }
                if (isNaN(stock) || isNaN(purchasePrice) || isNaN(sellingPrice) || isNaN(lowStockThreshold)) {
                    return reject(new Error(`Row ${i + 1}: Please ensure stock, prices, and threshold are valid numbers.`));
                }

                products.push({
                    name,
                    stock,
                    purchasePrice,
                    sellingPrice,
                    category,
                    lowStockThreshold,
                    // FIX: Add missing 'type' property, assuming imported products are items.
                    type: 'item',
                });
            }
            resolve(products);
        } catch (error) {
            reject(new Error("Failed to parse CSV file. Please check the format."));
        }
    });
};