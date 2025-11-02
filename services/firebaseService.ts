// FIX: Using named imports for firebase/app to fix module resolution errors.
import { initializeApp, getApps, getApp } from 'firebase/app';
import {
  getAuth,
  onAuthStateChanged,
  signOut,
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  sendPasswordResetEmail,
  type User
} from 'firebase/auth';
import {
  getFirestore,
  collection,
  query,
  orderBy,
  getDocs,
  addDoc,
  updateDoc,
  doc,
  deleteDoc,
  runTransaction,
  writeBatch,
  Timestamp,
  type QueryDocumentSnapshot,
  type DocumentData,
  getDoc,
  setDoc,
  limit,
  startAfter,
  where,
} from 'firebase/firestore';

import { Product, Sale, PaymentMode, SaleItem, UserSubscription, AnalyticsSummary, TopSellingItem, DateRange } from '../types';

const firebaseConfig = {
  apiKey: "AIzaSyDeeTbf8bHrgDFdqC58WNkjSePHHzG1mig",
  authDomain: "shoptracking-7d1ca.firebaseapp.com",
  projectId: "shoptracking-7d1ca",
  storageBucket: "shoptracking-7d1ca.appspot.com",
  messagingSenderId: "303546726753",
  appId: "1:303546726753:web:e5717b535e799861a36d20",
  measurementId: "G-4FTCDEV7Y5"
};

// Initialize app safely using the modular SDK
// FIX: Replaced namespace access (`firebaseApp.getApps`) with direct function calls (`getApps`)
// from named imports to resolve module resolution errors with Firebase v9+.
const app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApp();

export const db = getFirestore(app);
export const auth = getAuth(app);


// Export auth helpers for components
export { onAuthStateChanged, signOut, createUserWithEmailAndPassword, signInWithEmailAndPassword, sendPasswordResetEmail };
export type { User };

// --- Analytics Summary Helpers ---
const getDefaultAnalyticsSummary = (): AnalyticsSummary => ({
  allTime: {
    totalRevenue: 0,
    totalProfit: 0,
    totalProducts: 0,
    totalStock: 0,
    topSellingItems: [],
    paymentModeStats: Object.values(PaymentMode).reduce((acc, mode) => {
      acc[mode] = 0;
      return acc;
    }, {} as { [key in PaymentMode]: number }),
  },
  daily: {},
  monthly: {},
});

export const getAnalyticsSummary = async (userId: string): Promise<AnalyticsSummary> => {
    const userDocRef = doc(db, 'users', userId);
    const docSnap = await getDoc(userDocRef);
    if (docSnap.exists()) {
        const userData = docSnap.data() as UserSubscription;
        const summary: Partial<AnalyticsSummary> = userData.analyticsData || {};
        // Reconstruct the object, ignoring invalid top-level fields to ensure clean data.
        return {
            ...getDefaultAnalyticsSummary(),
            allTime: {
                ...getDefaultAnalyticsSummary().allTime,
                ...(summary.allTime || {}),
            },
            daily: {
                ...getDefaultAnalyticsSummary().daily,
                ...(summary.daily || {}),
            },
            monthly: {
                ...getDefaultAnalyticsSummary().monthly,
                ...(summary.monthly || {}),
            },
        };
    }
    return getDefaultAnalyticsSummary();
};

export const syncAnalyticsWithInventory = async (userId: string, inventory: Product[]): Promise<void> => {
    const userDocRef = doc(db, 'users', userId);
    try {
        await runTransaction(db, async (transaction) => {
            const userDoc = await transaction.get(userDocRef);
            if (!userDoc.exists()) return;

            const userData = userDoc.data() as UserSubscription;
            // FIX: Explicitly type `existingData` as `Partial<AnalyticsSummary>` to inform TypeScript about the possible properties.
            const existingData: Partial<AnalyticsSummary> = userData.analyticsData || {};

            // Build a new, clean summary object to guarantee structure and prevent legacy fields.
            const cleanSummary = getDefaultAnalyticsSummary();

            // Carefully preserve the non-inventory stats from the existing data.
            if (existingData.allTime) {
                cleanSummary.allTime.totalRevenue = existingData.allTime.totalRevenue || 0;
                cleanSummary.allTime.totalProfit = existingData.allTime.totalProfit || 0;
                cleanSummary.allTime.topSellingItems = existingData.allTime.topSellingItems || [];
                cleanSummary.allTime.paymentModeStats = existingData.allTime.paymentModeStats || getDefaultAnalyticsSummary().allTime.paymentModeStats;
            }
            if (existingData.daily) {
                cleanSummary.daily = existingData.daily;
            }
            if (existingData.monthly) {
                cleanSummary.monthly = existingData.monthly;
            }

            // Overwrite inventory-specific stats with the correct, synced values.
            cleanSummary.allTime.totalProducts = inventory.length;
            cleanSummary.allTime.totalStock = inventory.reduce((acc, product) => {
                return product.type === 'item' ? acc + product.stock : acc;
            }, 0);

            transaction.update(userDocRef, { analyticsData: cleanSummary });
        });
    } catch (error) {
        console.error("Failed to sync analytics with inventory:", error);
        // We throw the error so the calling context knows the transaction failed.
        throw error;
    }
};

// --- Subscription functions ---
export const initializeUserSubscription = async (userId: string): Promise<void> => {
    const userDocRef = doc(db, 'users', userId);
    const initialSub: UserSubscription = {
        subscriptionStatus: 'expired',
        subscriptionEndDate: null,
        analyticsData: getDefaultAnalyticsSummary(),
    };
    await setDoc(userDocRef, initialSub);
};

export const getUserSubscription = async (userId: string): Promise<UserSubscription> => {
    const userDocRef = doc(db, 'users', userId);
    const docSnap = await getDoc(userDocRef);

    if (docSnap.exists()) {
        const data = docSnap.data();
        const endDate = data.subscriptionEndDate instanceof Timestamp ? data.subscriptionEndDate.toDate() : null;
        
        if (data.subscriptionStatus === 'active' && endDate && endDate < new Date()) {
            return {
                subscriptionStatus: 'expired',
                subscriptionEndDate: data.subscriptionEndDate,
            };
        }
        
        return {
            subscriptionStatus: data.subscriptionStatus || 'expired',
            subscriptionEndDate: data.subscriptionEndDate,
            analyticsData: data.analyticsData || getDefaultAnalyticsSummary(),
        };

    } else {
        await initializeUserSubscription(userId);
        return {
            subscriptionStatus: 'expired',
            subscriptionEndDate: null,
            analyticsData: getDefaultAnalyticsSummary(),
        };
    }
};

// --- Data Converters ---
const docToProduct = (d: QueryDocumentSnapshot<DocumentData> | DocumentData): Product => {
  const data = 'data' in d ? d.data() || {} : d; // Handle both snapshot and raw data
  const id = 'id' in d ? d.id : '';
  return {
    id: id,
    name: typeof data.name === 'string' ? data.name : 'Unnamed Product',
    type: data.type === 'service' ? 'service' : 'item',
    stock: typeof data.stock === 'number' ? data.stock : Number(data.stock) || 0,
    purchasePrice: typeof data.purchasePrice === 'number' ? data.purchasePrice : Number(data.purchasePrice) || 0,
    sellingPrice: typeof data.sellingPrice === 'number' ? data.sellingPrice : Number(data.sellingPrice) || 0,
    category: typeof data.category === 'string' ? data.category : '',
    lowStockThreshold: typeof data.lowStockThreshold === 'number' ? data.lowStockThreshold : Number(data.lowStockThreshold) || 0,
  };
};

const docToSale = (d: QueryDocumentSnapshot<DocumentData>): Sale => {
  const data = d.data();
  if (!data) {
    return { id: d.id, date: new Date().toISOString(), items: [], totalAmount: 0, paymentMode: PaymentMode.Other };
  }
  const saleDate = data.date instanceof Timestamp ? data.date.toDate().toISOString() : new Date(data.date || Date.now()).toISOString();
  const items = (Array.isArray(data.items) ? data.items : []).map((item: Partial<SaleItem>): SaleItem => ({
    productId: item.productId || '', productName: item.productName || 'Legacy Sale Item',
    quantity: item.quantity ?? 0, pricePerItem: item.pricePerItem ?? 0, purchasePricePerItem: item.purchasePricePerItem ?? 0,
  }));
  return {
    id: d.id, date: saleDate, items, totalAmount: data.totalAmount ?? 0,
    paymentMode: Object.values(PaymentMode).includes(data.paymentMode) ? data.paymentMode : PaymentMode.Cash
  };
};

// --- Inventory functions ---
export const getInventoryPaginated = async (
  userId: string,
  pageSize: number,
  lastVisible: QueryDocumentSnapshot<DocumentData> | null
): Promise<{ products: Product[], lastDoc: QueryDocumentSnapshot<DocumentData> | null }> => {
  const inventoryRef = collection(db, 'users', userId, 'inventory');
  
  let qConstraints = [orderBy('name'), limit(pageSize)];
  if (lastVisible) {
    qConstraints.push(startAfter(lastVisible));
  }
  
  const q = query(inventoryRef, ...qConstraints);

  const inventorySnapshot = await getDocs(q);
  const products = inventorySnapshot.docs.map(docToProduct);
  const lastDoc = inventorySnapshot.docs[inventorySnapshot.docs.length - 1] || null;
  
  return { products, lastDoc };
};

export const getInventory = async (userId: string): Promise<Product[]> => {
  const inventoryRef = collection(db, 'users', userId, 'inventory');
  const q = query(inventoryRef, orderBy('name'));
  const inventorySnapshot = await getDocs(q);
  return inventorySnapshot.docs.map(docToProduct);
};

export const addProduct = async (userId: string, productData: Omit<Product, 'id'>): Promise<Product> => {
    const inventoryRef = collection(db, 'users', userId, 'inventory');
    const userDocRef = doc(db, 'users', userId);
    const newProductRef = doc(inventoryRef);

    await runTransaction(db, async (transaction) => {
        const userDoc = await transaction.get(userDocRef);
        if (!userDoc.exists()) throw new Error("User document not found");
        
        const summary = await getAnalyticsSummary(userId);
        
        summary.allTime.totalProducts += 1;
        if (productData.type === 'item') {
            summary.allTime.totalStock += productData.stock;
        }
        
        transaction.set(newProductRef, productData);
        transaction.update(userDocRef, { analyticsData: summary });
    });

    return { ...productData, id: newProductRef.id };
};

export const batchAddProducts = async (userId: string, productsData: Omit<Product, 'id'>[]): Promise<void> => {
    const inventoryRef = collection(db, 'users', userId, 'inventory');
    const userDocRef = doc(db, 'users', userId);
  
    await runTransaction(db, async (transaction) => {
      const userDoc = await transaction.get(userDocRef);
      if (!userDoc.exists()) throw new Error("User document not found");

      const summary = await getAnalyticsSummary(userId);

      let stockToAdd = 0;
      productsData.forEach(productData => {
        if (productData.type === 'item') {
          stockToAdd += productData.stock;
        }
        const docRef = doc(inventoryRef);
        transaction.set(docRef, productData);
      });
      
      summary.allTime.totalProducts += productsData.length;
      summary.allTime.totalStock += stockToAdd;

      transaction.update(userDocRef, { analyticsData: summary });
    });
};

export const updateProduct = async (userId: string, product: Product): Promise<void> => {
    const { id, ...productData } = product;
    const productRef = doc(db, 'users', userId, 'inventory', id);
    const userDocRef = doc(db, 'users', userId);

    await runTransaction(db, async (transaction) => {
        const productDoc = await transaction.get(productRef);
        if (!productDoc.exists()) throw new Error("Product not found");
        
        const oldProduct = docToProduct(productDoc);
        const summary = await getAnalyticsSummary(userId);

        const stockDifference = (productData.type === 'item' ? productData.stock : 0) - (oldProduct.type === 'item' ? oldProduct.stock : 0);
        summary.allTime.totalStock += stockDifference;

        transaction.update(productRef, productData);
        transaction.update(userDocRef, { analyticsData: summary });
    });
};

export const deleteProduct = async (userId: string, productId: string): Promise<void> => {
    const productRef = doc(db, 'users', userId, 'inventory', productId);
    const userDocRef = doc(db, 'users', userId);

    await runTransaction(db, async (transaction) => {
        const productDoc = await transaction.get(productRef);
        if (!productDoc.exists()) throw new Error("Product not found");

        const productToDelete = docToProduct(productDoc);
        const summary = await getAnalyticsSummary(userId);

        summary.allTime.totalProducts -= 1;
        if (productToDelete.type === 'item') {
            summary.allTime.totalStock -= productToDelete.stock;
        }

        transaction.delete(productRef);
        transaction.update(userDocRef, { analyticsData: summary });
    });
};

// --- Sales functions ---
export const getSalesPaginated = async (
  userId: string,
  pageSize: number,
  lastVisible: QueryDocumentSnapshot<DocumentData> | null
): Promise<{ sales: Sale[], lastDoc: QueryDocumentSnapshot<DocumentData> | null }> => {
  const salesRef = collection(db, 'users', userId, 'sales');
  
  let qConstraints: any[] = [orderBy('date', 'desc'), limit(pageSize)];

  if (lastVisible) {
    qConstraints.push(startAfter(lastVisible));
  }
  
  const q = query(salesRef, ...qConstraints);

  const salesSnapshot = await getDocs(q);
  const sales = salesSnapshot.docs.map(docToSale);
  const lastDoc = salesSnapshot.docs[salesSnapshot.docs.length - 1] || null;
  
  return { sales, lastDoc };
};

export const addSale = async (userId: string, saleData: Omit<Sale, 'id' | 'date'>): Promise<Sale> => {
  const saleDate = new Date();
  const newSaleData = { ...saleData, date: Timestamp.fromDate(saleDate) };
  
  const dateKey = saleDate.toISOString().split('T')[0]; // YYYY-MM-DD
  const monthKey = dateKey.substring(0, 7); // YYYY-MM

  const salesCollectionRef = collection(db, 'users', userId, 'sales');
  const newSaleRef = doc(salesCollectionRef);
  const userDocRef = doc(db, 'users', userId);

  await runTransaction(db, async (transaction) => {
    let stockChange = 0;
    const summary = await getAnalyticsSummary(userId);
    
    // 1. Update product stock
    for (const item of saleData.items) {
      if (item.quantity <= 0) continue;
      const productDocRef = doc(db, 'users', userId, 'inventory', item.productId);
      const productDoc = await transaction.get(productDocRef);
      if (!productDoc.exists()) throw new Error(`Product ${item.productName} not found.`);
      const productData = productDoc.data();
      
      if(productData.type === 'item') {
          const newStock = productData.stock - item.quantity;
          if (newStock < 0) throw new Error(`Not enough stock for ${productData.name}.`);
          stockChange -= item.quantity;
          transaction.update(productDocRef, { stock: newStock });
      }
    }
    
    // 2. Update all tiers of the analytics summary
    const saleProfit = saleData.items.reduce((acc, item) => acc + ((item.pricePerItem - item.purchasePricePerItem) * item.quantity), 0);
    
    // All-Time
    summary.allTime.totalRevenue += saleData.totalAmount;
    summary.allTime.totalProfit += saleProfit;
    summary.allTime.totalStock += stockChange;
    summary.allTime.paymentModeStats[saleData.paymentMode] += saleData.totalAmount;

    // Daily
    const dailyStats = summary.daily[dateKey] || { revenue: 0, profit: 0 };
    dailyStats.revenue += saleData.totalAmount;
    dailyStats.profit += saleProfit;
    summary.daily[dateKey] = dailyStats;

    // Monthly
    const monthlyStats = summary.monthly[monthKey] || { revenue: 0, profit: 0 };
    monthlyStats.revenue += saleData.totalAmount;
    monthlyStats.profit += saleProfit;
    summary.monthly[monthKey] = monthlyStats;

    // Update top selling items
    const itemSalesMap: { [name: string]: number } = {};
    summary.allTime.topSellingItems.forEach(item => { itemSalesMap[item.name] = item.quantity; });
    saleData.items.forEach(item => {
        itemSalesMap[item.productName] = (itemSalesMap[item.productName] || 0) + item.quantity;
    });
    summary.allTime.topSellingItems = Object.entries(itemSalesMap)
        .map(([name, quantity]) => ({ name, quantity }))
        .sort((a, b) => b.quantity - a.quantity)
        .slice(0, 5);
        
    // 3. Write new sale and updated summary
    transaction.set(newSaleRef, newSaleData);
    transaction.update(userDocRef, { analyticsData: summary });
  });

  return { ...saleData, id: newSaleRef.id, date: saleDate.toISOString() };
};

export const clearSales = async (userId: string): Promise<void> => {
    const salesRef = collection(db, 'users', userId, 'sales');
    const userDocRef = doc(db, 'users', userId);

    const salesSnapshot = await getDocs(salesRef);
    if (salesSnapshot.empty) return;

    await runTransaction(db, async (transaction) => {
        const summary = await getAnalyticsSummary(userId);

        // Reset all analytics tiers, but preserve inventory-related ones
        const newSummary: AnalyticsSummary = {
            ...getDefaultAnalyticsSummary(),
            allTime: {
                ...getDefaultAnalyticsSummary().allTime,
                totalProducts: summary.allTime.totalProducts,
                totalStock: summary.allTime.totalStock,
            },
        };

        // Delete all sales documents
        salesSnapshot.docs.forEach(saleDoc => {
            transaction.delete(saleDoc.ref);
        });

        // Update the user document with the reset analytics
        transaction.update(userDocRef, { analyticsData: newSummary });
    });
};
