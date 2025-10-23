

export interface Product {
  id: string;
  name: string;
  stock: number;
  purchasePrice: number;
  sellingPrice: number;
  category: string;
  lowStockThreshold: number;
}

export interface SaleItem {
  productId: string;
  quantity: number;
  pricePerItem: number;
  purchasePricePerItem: number;
}

export enum PaymentMode {
  Cash = 'Cash',
  UPI = 'UPI',
  Bank = 'Bank Transfer',
  Other = 'Other'
}

export interface Sale {
  id: string;
  date: string; // ISO string
  items: SaleItem[];
  totalAmount: number;
  paymentMode: PaymentMode;
}

export interface FirebaseConfig {
  apiKey: string;
  authDomain: string;
  projectId: string;
  storageBucket: string;
  messagingSenderId: string;
  appId: string;
}

export interface UserSubscription {
  subscriptionStatus: 'active' | 'expired';
  subscriptionEndDate: any; // Firestore Timestamp
}
