// services/firebaseService.ts
// FIX: Corrected Firebase v9 app initialization imports to resolve module errors.
// FIX: Changed to namespace import for firebase/app to resolve potential module resolution issues.
import * as firebaseApp from 'firebase/app';
import {
  getAuth,
  onAuthStateChanged,
  signOut,
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
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
} from 'firebase/firestore';

import { Product, Sale, PaymentMode, SaleItem, UserSubscription } from '../types';

const firebaseConfig = {
  apiKey: "AIzaSyDeeTbf8bHrgDFdqC58WNkjSePHHzG1mig",
  authDomain: "shoptracking-7d1ca.firebaseapp.com",
  projectId: "shoptracking-7d1ca",
  storageBucket: "shoptracking-7d1ca.appspot.com",
  messagingSenderId: "303546726753",
  appId: "1:303546726753:web:e5717b535e799861a36d20",
  measurementId: "G-4FTCDEV7Y5"
};

// Initialize app safely (avoid duplicate initialization)
// FIX: Use the firebaseApp namespace for getApps, initializeApp, and getApp.
const app = !firebaseApp.getApps().length ? firebaseApp.initializeApp(firebaseConfig) : firebaseApp.getApp();
export const db = getFirestore(app);
export const auth = getAuth(app);

// Export auth helpers for components
export { onAuthStateChanged, signOut, createUserWithEmailAndPassword, signInWithEmailAndPassword };
export type { User };

// Subscription functions
export const initializeUserSubscription = async (userId: string): Promise<void> => {
    const userDocRef = doc(db, 'users', userId);
    const initialSub: UserSubscription = {
        subscriptionStatus: 'expired',
        subscriptionEndDate: null,
    };
    await setDoc(userDocRef, initialSub);
};

export const getUserSubscription = async (userId: string): Promise<UserSubscription> => {
    const userDocRef = doc(db, 'users', userId);
    const docSnap = await getDoc(userDocRef);

    if (docSnap.exists()) {
        const data = docSnap.data();
        const endDate = data.subscriptionEndDate instanceof Timestamp ? data.subscriptionEndDate.toDate() : null;
        
        // Automatically expire if the date has passed
        if (data.subscriptionStatus === 'active' && endDate && endDate < new Date()) {
            return {
                subscriptionStatus: 'expired',
                subscriptionEndDate: data.subscriptionEndDate,
            };
        }
        
        return {
            subscriptionStatus: data.subscriptionStatus || 'expired',
            subscriptionEndDate: data.subscriptionEndDate,
        };

    } else {
        // If doc doesn't exist, create it with expired status
        await initializeUserSubscription(userId);
        return {
            subscriptionStatus: 'expired',
            subscriptionEndDate: null,
        };
    }
};


// Helper: product document -> Product
const docToProduct = (d: QueryDocumentSnapshot<DocumentData>): Product => {
  const data = d.data() || {};
  return {
    id: d.id,
    name: typeof data.name === 'string' ? data.name : 'Unnamed Product',
    stock: typeof data.stock === 'number' ? data.stock : Number(data.stock) || 0,
    purchasePrice: typeof data.purchasePrice === 'number' ? data.purchasePrice : Number(data.purchasePrice) || 0,
    sellingPrice: typeof data.sellingPrice === 'number' ? data.sellingPrice : Number(data.sellingPrice) || 0,
    category: typeof data.category === 'string' ? data.category : '',
    lowStockThreshold: typeof data.lowStockThreshold === 'number' ? data.lowStockThreshold : Number(data.lowStockThreshold) || 0,
  };
};

// Helper: sale document -> Sale
const docToSale = (d: QueryDocumentSnapshot<DocumentData>): Sale => {
  const data = d.data();
  if (!data) {
    console.warn(`Document with ID ${d.id} in sales collection has no data.`);
    return { id: d.id, date: new Date().toISOString(), items: [], totalAmount: 0, paymentMode: PaymentMode.Other };
  }

  const saleDate =
    data.date instanceof Timestamp ? data.date.toDate().toISOString() : new Date(data.date || Date.now()).toISOString();

  const itemsArray = Array.isArray(data.items) ? data.items : [];
  const items = itemsArray.map((item: Partial<SaleItem>): SaleItem => ({
    productId: item.productId || '',
    quantity: item.quantity ?? 0,
    pricePerItem: item.pricePerItem ?? 0,
    purchasePricePerItem: item.purchasePricePerItem ?? 0,
  }));

  return {
    id: d.id,
    date: saleDate,
    items,
    totalAmount: data.totalAmount ?? 0,
    paymentMode: Object.values(PaymentMode).includes(data.paymentMode) ? data.paymentMode : PaymentMode.Cash
  };
};

// Inventory functions
export const getInventory = async (userId: string): Promise<Product[]> => {
  try {
    const inventoryRef = collection(db, 'users', userId, 'inventory');
    const inventorySnapshot = await getDocs(inventoryRef);
    return inventorySnapshot.docs.map(docToProduct);
  } catch (error) {
    console.error("Error fetching inventory:", error);
    return [];
  }
};

export const addProduct = async (userId: string, productData: Omit<Product, 'id'>): Promise<Product> => {
  const inventoryRef = collection(db, 'users', userId, 'inventory');
  const docRef = await addDoc(inventoryRef, productData);
  return { ...productData, id: docRef.id };
};

export const updateProduct = async (userId: string, product: Product): Promise<void> => {
  const { id, ...productData } = product;
  const productRef = doc(db, 'users', userId, 'inventory', id);
  await updateDoc(productRef, productData);
};

export const deleteProduct = async (userId: string, productId: string): Promise<void> => {
  const productRef = doc(db, 'users', userId, 'inventory', productId);
  await deleteDoc(productRef);
};

// Sales functions
export const getSales = async (userId: string): Promise<Sale[]> => {
  try {
    const salesRef = collection(db, 'users', userId, 'sales');
    const q = query(salesRef, orderBy('date', 'desc'));
    const salesSnapshot = await getDocs(q);
    return salesSnapshot.docs.map(docToSale);
  } catch (error) {
    console.error("Error fetching sales:", error);
    return [];
  }
};

export const addSale = async (userId: string, saleData: Omit<Sale, 'id' | 'date'>): Promise<Sale> => {
  const saleDate = new Date();
  const newSaleData = { ...saleData, date: Timestamp.fromDate(saleDate) };

  const salesCollectionRef = collection(db, 'users', userId, 'sales');
  const newSaleRef = doc(salesCollectionRef);

  await runTransaction(db, async (transaction) => {
    // ✅ Step 1: Read all product docs first
    const productDocs = await Promise.all(
      saleData.items.map(async (item) => {
        const productDocRef = doc(db, 'users', userId, 'inventory', item.productId);
        const productDoc = await transaction.get(productDocRef);

        if (!productDoc.exists()) {
          throw new Error(`Product with ID ${item.productId} not found.`);
        }

        const currentStock = productDoc.data()!.stock ?? 0;
        const newStock = currentStock - item.quantity;

        if (newStock < 0) {
          throw new Error(`Not enough stock for ${productDoc.data()!.name}. Only ${currentStock} available.`);
        }

        return { productDocRef, newStock };
      })
    );

    // ✅ Step 2: Perform all writes after reads
    transaction.set(newSaleRef, newSaleData);

    for (const { productDocRef, newStock } of productDocs) {
      transaction.update(productDocRef, { stock: newStock });
    }
  });

  return { ...saleData, id: newSaleRef.id, date: saleDate.toISOString() };
};

export const clearSales = async (userId: string): Promise<void> => {
  const salesRef = collection(db, 'users', userId, 'sales');
  const salesSnapshot = await getDocs(salesRef);
  if (salesSnapshot.empty) return;
  const batch = writeBatch(db);
  salesSnapshot.docs.forEach(d => batch.delete(d.ref));
  await batch.commit();
};
