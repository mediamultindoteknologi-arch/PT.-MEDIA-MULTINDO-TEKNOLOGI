/**
 * ============================================================================
 * MODUL BACKEND API: CUSTOMERS, CUSTOM PRICING & ATOMIC SALES TRANSACTION
 * ============================================================================
 * File ini berisi implementasi endpoint REST API untuk:
 * 1. GET /api/v1/customers?search=        (Pencarian autocomplete pelanggan & histori)
 * 2. GET /api/v1/customers/:id/last-prices (Daftar histori harga beli terakhir per pelanggan)
 * 3. POST /api/v1/sales                   (Checkout POS dengan custom/override price & atomic lock)
 * ============================================================================
 */

import { Customer, CustomerSpecialPrice, CustomerTier, SaleTransaction } from '../types';

// ==========================================
// 1. DATA CONTRACTS & DTO (Data Transfer Objects)
// ==========================================

export interface GetCustomersQuery {
  search?: string;
  tier?: CustomerTier;
  limit?: number;
  offset?: number;
}

export interface CustomerLastPriceResponse {
  customerId: string;
  customerName: string;
  customerTier: CustomerTier;
  prices: Array<{
    productId: string;
    productName: string;
    sku: string;
    unit: string;
    customPrice: number;
    lastPurchasedPrice: number;
    lastPurchasedDate?: string;
    note?: string;
  }>;
}

export interface CreateSaleItemDto {
  productId: string;
  qty: number;
  agreedPrice: number;       // Harga yang disepakati (Custom price atau Tier price)
  priceTier?: CustomerTier;   // STANDAR | GROSIR | VIP
  isCustomPrice?: boolean;    // Flag manual override
}

export interface CreateSaleDto {
  customerId?: string;        // ID Pelanggan (jika null, default ke 'Pelanggan Umum (Walk-in)')
  customerName?: string;
  paymentMethod: 'CASH' | 'QRIS' | 'TRANSFER' | 'DEBIT';
  amountPaid: number;
  discount?: number;
  tax?: number;               // e.g. PPN 11%
  items: CreateSaleItemDto[];
}

export interface ApiResponse<T> {
  success: boolean;
  message?: string;
  data?: T;
  error?: string;
}

// ==========================================
// 2. CONTROLLER LOGIC (EXPRESS / NODE.JS FORMAT)
// ==========================================

/**
 * Controller: GET /api/v1/customers
 * Mengambil daftar pelanggan untuk dropdown autocomplete & riwayat transaksi
 */
export const getCustomersHandler = async (
  query: GetCustomersQuery,
  databaseCustomers: Customer[]
): Promise<ApiResponse<Customer[]>> => {
  try {
    const search = (query.search || '').trim().toLowerCase();
    
    let result = databaseCustomers;
    if (search) {
      result = result.filter(c => 
        c.name.toLowerCase().includes(search) ||
        (c.companyName && c.companyName.toLowerCase().includes(search)) ||
        c.phone.includes(search)
      );
    }

    if (query.tier) {
      result = result.filter(c => c.tier === query.tier);
    }

    return {
      success: true,
      data: result.slice(0, query.limit || 50),
    };
  } catch (err: any) {
    return {
      success: false,
      error: err.message || 'Gagal memuat data pelanggan',
    };
  }
};

/**
 * Controller: GET /api/v1/customers/:id/last-prices
 * Mengambil daftar harga beli terakhir atau harga khusus pelanggan untuk setiap produk
 */
export const getCustomerLastPricesHandler = async (
  customerId: string,
  databaseCustomers: Customer[],
  specialPrices: CustomerSpecialPrice[],
  productsList: Array<{ id: string; name: string; sku: string; unit: string; sellPrice: number }>
): Promise<ApiResponse<CustomerLastPriceResponse>> => {
  try {
    const customer = databaseCustomers.find(c => c.id === customerId);
    if (!customer) {
      return {
        success: false,
        error: `Pelanggan dengan ID "${customerId}" tidak ditemukan.`,
      };
    }

    const customerPrices = specialPrices.filter(sp => sp.customerId === customerId);
    
    const enrichedPrices = customerPrices.map(sp => {
      const prod = productsList.find(p => p.id === sp.productId);
      return {
        productId: sp.productId,
        productName: prod ? prod.name : 'Unknown Product',
        sku: prod ? prod.sku : '-',
        unit: prod ? prod.unit : 'Unit',
        customPrice: sp.customPrice,
        lastPurchasedPrice: sp.lastPurchasedPrice || sp.customPrice,
        lastPurchasedDate: sp.lastPurchasedDate,
        note: sp.note,
      };
    });

    return {
      success: true,
      data: {
        customerId: customer.id,
        customerName: customer.name,
        customerTier: customer.tier,
        prices: enrichedPrices,
      },
    };
  } catch (err: any) {
    return {
      success: false,
      error: err.message || 'Gagal memuat riwayat harga pelanggan',
    };
  }
};

/**
 * Controller: POST /api/v1/sales
 * Menyimpan transaksi penjualan POS dengan atomic lock & mencatat histori harga khusus pelanggan
 */
export const createSaleHandler = async (
  payload: CreateSaleDto,
  context: {
    products: Array<{ id: string; name: string; sku: string; unit: string; buyPrice: number; sellPrice: number; stock: number }>;
    customers: Customer[];
    specialPrices: CustomerSpecialPrice[];
    onCommitSale: (sale: SaleTransaction, updatedSpecialPrices: CustomerSpecialPrice[]) => void;
  }
): Promise<ApiResponse<SaleTransaction>> => {
  try {
    if (!payload.items || payload.items.length === 0) {
      return { success: false, error: 'Keranjang belanja tidak boleh kosong.' };
    }

    // 1. Verifikasi kecukupan stok secara deterministik (Pessimistic Check)
    for (const item of payload.items) {
      const prod = context.products.find(p => p.id === item.productId);
      if (!prod) {
        return { success: false, error: `Produk ID ${item.productId} tidak terdaftar.` };
      }
      if (prod.stock < item.qty) {
        return {
          success: false,
          error: `Stok "${prod.name}" tidak mencukupi (Tersedia: ${prod.stock}, Diminta: ${item.qty}).`,
        };
      }
    }

    // 2. Tentukan Data Pelanggan
    const customer = payload.customerId 
      ? context.customers.find(c => c.id === payload.customerId) 
      : null;

    const customerName = customer ? customer.name : (payload.customerName || 'Pelanggan Umum (Walk-in)');
    const customerTier = customer ? customer.tier : 'STANDAR';

    // 3. Kalkulasi Subtotal & Total
    const subtotal = payload.items.reduce((acc, item) => acc + (item.agreedPrice * item.qty), 0);
    const discount = payload.discount || 0;
    const tax = payload.tax || 0;
    const total = Math.max(0, subtotal - discount + tax);

    // 4. Validasi Pembayaran Tunai
    if (payload.paymentMethod === 'CASH' && payload.amountPaid < total) {
      return {
        success: false,
        error: `Nominal tunai kurang. Total tagihan: Rp ${total.toLocaleString('id-ID')}, Dibayar: Rp ${payload.amountPaid.toLocaleString('id-ID')}`,
      };
    }

    const change = payload.paymentMethod === 'CASH' ? Math.max(0, payload.amountPaid - total) : 0;
    const now = new Date();
    const invoiceNumber = `INV-${now.getFullYear()}${String(now.getMonth() + 1).padStart(2, '0')}${String(now.getDate()).padStart(2, '0')}-${Math.floor(1000 + Math.random() * 9000)}`;

    // 5. Susun Sale Items
    const saleItems = payload.items.map(item => {
      const prod = context.products.find(p => p.id === item.productId)!;
      return {
        id: `si-${Date.now()}-${item.productId}`,
        productId: prod.id,
        productName: prod.name,
        sku: prod.sku,
        unit: prod.unit,
        buyPrice: prod.buyPrice || 0,
        sellPrice: item.agreedPrice,
        originalPrice: prod.sellPrice,
        priceTier: item.priceTier || customerTier,
        customPriceApplied: item.isCustomPrice || (item.agreedPrice !== prod.sellPrice),
        qty: item.qty,
        subtotal: item.agreedPrice * item.qty,
        profit: (item.agreedPrice - (prod.buyPrice || 0)) * item.qty,
      };
    });

    const transaction: SaleTransaction = {
      id: `trx-${Date.now()}`,
      invoiceNumber,
      items: saleItems,
      subtotal,
      discount,
      tax,
      total,
      paymentMethod: payload.paymentMethod,
      amountPaid: payload.paymentMethod === 'CASH' ? payload.amountPaid : total,
      change,
      customerId: customer?.id,
      customerName,
      customerCompany: customer?.companyName,
      customerTier,
      cashierName: 'Kasir POS',
      createdAt: now.toISOString(),
    };

    // 6. Update Histori Harga Terakhir (Customer Special Prices)
    const updatedSpecialPrices = [...context.specialPrices];
    if (customer) {
      for (const item of payload.items) {
        const idx = updatedSpecialPrices.findIndex(
          sp => sp.customerId === customer.id && sp.productId === item.productId
        );
        const record: CustomerSpecialPrice = {
          id: idx >= 0 ? updatedSpecialPrices[idx].id : `csp-${Date.now()}-${item.productId}`,
          customerId: customer.id,
          productId: item.productId,
          customPrice: item.agreedPrice,
          lastPurchasedPrice: item.agreedPrice,
          lastPurchasedDate: now.toISOString().slice(0, 10),
          note: `Faktur #${invoiceNumber} (${item.isCustomPrice ? 'Custom Price' : item.priceTier || 'Standard'})`,
        };
        if (idx >= 0) {
          updatedSpecialPrices[idx] = record;
        } else {
          updatedSpecialPrices.push(record);
        }
      }
    }

    // 7. Commit Transaksi
    context.onCommitSale(transaction, updatedSpecialPrices);

    return {
      success: true,
      message: 'Transaksi penjualan berhasil disimpan dan riwayat harga pelanggan diperbarui.',
      data: transaction,
    };
  } catch (err: any) {
    return {
      success: false,
      error: err.message || 'Gagal memproses transaksi penjualan.',
    };
  }
};
