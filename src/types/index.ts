export type UserRole = 'ADMIN' | 'KASIR' | 'GUDANG';

export interface User {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  avatar?: string;
}

export type ProductCategory = 
  | 'MESIN CODING'
  | 'MACHINE'
  | 'CONSUMABLE CIJ'
  | 'CARTRIDGE'
  | 'CHIP'
  | 'RIBBON'
  | 'KERTAS KASIR'
  | 'LABEL'
  | 'PLASTIC ROLL'
  | 'OTHERS';

export interface Product {
  id: string;
  sku: string;
  barcode: string;
  name: string;
  category: ProductCategory;
  unit: string; // Unit, Roll, Botol, Pcs, Box, Pack
  buyPrice: number;
  sellPrice: number;
  stock: number;
  minStock: number;
  location?: string;
  description?: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export type MutationType = 'IN' | 'OUT' | 'ADJUSTMENT';

export type MutationReferenceType = 
  | 'SALE'              // Penjualan POS
  | 'PURCHASE'          // Barang Masuk dari Supplier
  | 'OPERATIONAL'       // Pemakaian Internal / Demo
  | 'DAMAGED'           // Rusak / Cacat
  | 'LOST'              // Selisih Hilang
  | 'RETURN'            // Retur Konsumen
  | 'INITIAL_BALANCE';  // Saldo Awal

export interface StockMutation {
  id: string;
  productId: string;
  productName: string;
  sku: string;
  type: MutationType;
  referenceType: MutationReferenceType;
  referenceNumber: string; // e.g. TRX-202609-001, PO-2026-088, ADJ-001
  qty: number;
  previousStock: number;
  currentStock: number;
  notes: string;
  performedBy: string; // User name
  createdAt: string;
}

export interface CartItem {
  product: Product;
  qty: number;
  unitPrice: number;
  originalPrice: number;
  priceTier: CustomerTier;
  customPriceApplied?: boolean;
  lastPurchasedPrice?: number;
  discount: number; // percentage or fixed
  subtotal: number;
}

export interface SaleItem {
  id: string;
  productId: string;
  productName: string;
  sku: string;
  unit: string;
  buyPrice: number;
  sellPrice: number;
  originalPrice?: number;
  priceTier?: CustomerTier;
  customPriceApplied?: boolean;
  qty: number;
  subtotal: number;
  profit: number;
}

export interface SaleTransaction {
  id: string;
  invoiceNumber: string;
  items: SaleItem[];
  subtotal: number;
  tax: number; // PPN 11% or 0%
  discount: number;
  total: number;
  paymentMethod: 'CASH' | 'QRIS' | 'TRANSFER' | 'DEBIT';
  amountPaid: number;
  change: number;
  customerId?: string;
  customerName?: string;
  customerCompany?: string;
  customerTier?: CustomerTier;
  cashierName: string;
  createdAt: string;
}

export type CustomerTier = 'STANDAR' | 'GROSIR' | 'VIP';

export interface Customer {
  id: string;
  name: string;
  companyName?: string;
  phone: string;
  address?: string;
  email?: string;
  tier: CustomerTier;
  notes?: string;
  createdAt: string;
}

export interface CustomerSpecialPrice {
  id: string;
  customerId: string;
  productId: string;
  customPrice: number;
  lastPurchasedPrice?: number;
  lastPurchasedDate?: string;
  note?: string;
}

export interface StockInRecord {
  id: string;
  referenceNo: string; // PO / Surat Jalan
  supplierName: string;
  productId: string;
  productName: string;
  sku: string;
  qty: number;
  unitCost: number;
  totalCost: number;
  receivedBy: string;
  notes: string;
  createdAt: string;
}

export interface StockOutRecord {
  id: string;
  referenceNo: string;
  reason: 'OPERATIONAL' | 'DAMAGED' | 'LOST' | 'EXPIRED' | 'OTHER';
  productId: string;
  productName: string;
  sku: string;
  qty: number;
  reportedBy: string;
  notes: string;
  createdAt: string;
}

export interface Supplier {
  id: string;
  name: string;
  phone: string;
  email: string;
  address: string;
}
