import { Timestamp } from "firebase/firestore";

export interface Product {
  id: string;
  name: string;
  type: 'item' | 'service';
  stock: number;
  purchasePrice: number;
  sellingPrice: number;
  category: string;
  lowStockThreshold: number;
}

export interface SaleItem {
  productId: string;
  productName: string;
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
  analyticsData?: AnalyticsSummary;
}

export interface DateRange {
  startDate: Date | null;
  endDate: Date | null;
}

export interface TopSellingItem {
  name: string;
  quantity: number;
}

export interface PeriodStats {
  revenue: number;
  profit: number;
}

export interface AnalyticsSummary {
  allTime: {
    totalRevenue: number;
    totalProfit: number;
    totalProducts: number;
    totalStock: number;
    topSellingItems: TopSellingItem[];
    paymentModeStats: { [key in PaymentMode]: number };
  };
  daily: {
    [date: string]: PeriodStats; // YYYY-MM-DD
  };
  monthly: {
    [month: string]: PeriodStats; // YYYY-MM
  };
}