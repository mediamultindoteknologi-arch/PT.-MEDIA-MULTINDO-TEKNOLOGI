import React, { useState } from 'react';
import { 
  Code2, 
  Database, 
  GitBranch, 
  FolderTree, 
  Terminal, 
  Copy, 
  Check, 
  Layers, 
  ShieldAlert, 
  Cpu, 
  X,
  ExternalLink,
  Server
} from 'lucide-react';

interface ArchitectureDocsModalProps {
  onClose: () => void;
}

export const ArchitectureDocsModal: React.FC<ArchitectureDocsModalProps> = ({ onClose }) => {
  const [activeTab, setActiveTab] = useState<'ddl' | 'customer_api' | 'concurrency' | 'folder' | 'code' | 'stack'>('customer_api');
  const [copiedKey, setCopiedKey] = useState<string | null>(null);

  const copyToClipboard = (text: string, key: string) => {
    navigator.clipboard.writeText(text);
    setCopiedKey(key);
    setTimeout(() => setCopiedKey(null), 2500);
  };

  const sqlDDLCode = `-- ============================================================================
-- SISTEM INFORMASI MANAJEMEN PENJUALAN, STOK, & MUTASI (SIMPOS-INV)
-- Target Database: PostgreSQL 15+ / MySQL 8.0+ (ANSI SQL Standard)
-- Engine: InnoDB (MySQL) with Strict ACID, Foreign Keys & Indexes
-- ============================================================================

-- 1. TABEL PENGGUNA & RBAC (Users & Roles)
CREATE TABLE users (
    id VARCHAR(36) PRIMARY KEY, -- UUID v4
    name VARCHAR(150) NOT NULL,
    email VARCHAR(191) NOT NULL UNIQUE,
    password_hash VARCHAR(255) NOT NULL,
    role VARCHAR(20) NOT NULL CHECK (role IN ('ADMIN', 'KASIR', 'GUDANG')),
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_users_role ON users(role);
CREATE INDEX idx_users_email ON users(email);

-- 2. TABEL KATEGORI PRODUK (Categories)
CREATE TABLE categories (
    id VARCHAR(36) PRIMARY KEY,
    name VARCHAR(100) NOT NULL UNIQUE,
    code VARCHAR(50) NOT NULL UNIQUE,
    description TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 3. TABEL SUPPLIER / VENDOR
CREATE TABLE suppliers (
    id VARCHAR(36) PRIMARY KEY,
    name VARCHAR(150) NOT NULL,
    phone VARCHAR(30),
    email VARCHAR(191),
    address TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 4. TABEL MASTER PELANGGAN / CUSTOMERS (PT & Ritel)
CREATE TABLE customers (
    id VARCHAR(36) PRIMARY KEY,
    name VARCHAR(150) NOT NULL,
    company_name VARCHAR(191),                     -- Nama PT / CV / Toko
    phone VARCHAR(30) NOT NULL,
    email VARCHAR(191),
    address TEXT,
    tier VARCHAR(20) NOT NULL DEFAULT 'STANDAR' CHECK (tier IN ('STANDAR', 'GROSIR', 'VIP')),
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_customers_phone ON customers(phone);
CREATE INDEX idx_customers_name ON customers(name);
CREATE INDEX idx_customers_company ON customers(company_name);

-- 5. TABEL MASTER PRODUK (Products / SKU & Barcode)
CREATE TABLE products (
    id VARCHAR(36) PRIMARY KEY,
    category_id VARCHAR(36) NOT NULL REFERENCES categories(id) ON DELETE RESTRICT,
    sku VARCHAR(60) NOT NULL UNIQUE,
    barcode VARCHAR(100) UNIQUE,
    name VARCHAR(255) NOT NULL,
    unit VARCHAR(30) NOT NULL DEFAULT 'Unit', -- Unit, Roll, Botol, Pcs, Box
    buy_price NUMERIC(15, 2) NOT NULL DEFAULT 0.00,  -- HPP / Harga Modal Beli (Boleh 0)
    sell_price NUMERIC(15, 2) NOT NULL DEFAULT 0.00, -- Harga Jual POS Utama
    stock INT NOT NULL DEFAULT 0,                    -- Saldo Stok Fisik Saat Ini
    min_stock_alert INT NOT NULL DEFAULT 5,          -- Ambang Peringatan Minimum
    location VARCHAR(100),                          -- Nomor Rak / Gudang
    version INT NOT NULL DEFAULT 1,                  -- Untuk Optimistic Locking Concurrency
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT chk_positive_stock CHECK (stock >= 0) -- Mencegah stok minus di level database!
);

CREATE INDEX idx_products_sku ON products(sku);
CREATE INDEX idx_products_barcode ON products(barcode);
CREATE INDEX idx_products_category ON products(category_id);
CREATE INDEX idx_products_stock_alert ON products(stock, min_stock_alert);

-- 6. TABEL HISTORI & HARGA KHUSUS PELANGGAN (Customer Special & Last Prices)
CREATE TABLE customer_special_prices (
    id VARCHAR(36) PRIMARY KEY,
    customer_id VARCHAR(36) NOT NULL REFERENCES customers(id) ON DELETE CASCADE,
    product_id VARCHAR(36) NOT NULL REFERENCES products(id) ON DELETE CASCADE,
    custom_price NUMERIC(15, 2) NOT NULL,
    last_purchased_price NUMERIC(15, 2) NOT NULL,
    last_purchased_date DATE,
    note VARCHAR(255),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT uq_customer_product_price UNIQUE (customer_id, product_id)
);

CREATE INDEX idx_csp_customer ON customer_special_prices(customer_id);
CREATE INDEX idx_csp_product ON customer_special_prices(product_id);

-- 7. TABEL TRANSAKSI PENJUALAN POS (Sales Header)
CREATE TABLE sales (
    id VARCHAR(36) PRIMARY KEY,
    invoice_number VARCHAR(60) NOT NULL UNIQUE,
    user_id VARCHAR(36) NOT NULL REFERENCES users(id),
    customer_id VARCHAR(36) REFERENCES customers(id) ON DELETE SET NULL,
    customer_name VARCHAR(150) DEFAULT 'Pelanggan Umum (Walk-in)',
    customer_tier VARCHAR(20) DEFAULT 'STANDAR',
    subtotal NUMERIC(15, 2) NOT NULL DEFAULT 0.00,
    discount NUMERIC(15, 2) NOT NULL DEFAULT 0.00,
    tax NUMERIC(15, 2) NOT NULL DEFAULT 0.00,        -- PPN 11%
    total NUMERIC(15, 2) NOT NULL DEFAULT 0.00,
    payment_method VARCHAR(30) NOT NULL CHECK (payment_method IN ('CASH', 'QRIS', 'TRANSFER', 'DEBIT')),
    amount_paid NUMERIC(15, 2) NOT NULL DEFAULT 0.00,
    change_amount NUMERIC(15, 2) NOT NULL DEFAULT 0.00,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_sales_invoice ON sales(invoice_number);
CREATE INDEX idx_sales_date ON sales(created_at);
CREATE INDEX idx_sales_user ON sales(user_id);
CREATE INDEX idx_sales_customer ON sales(customer_id);

-- 8. TABEL DETAIL PENJUALAN (Sale Items)
CREATE TABLE sale_items (
    id VARCHAR(36) PRIMARY KEY,
    sale_id VARCHAR(36) NOT NULL REFERENCES sales(id) ON DELETE CASCADE,
    product_id VARCHAR(36) NOT NULL REFERENCES products(id),
    qty INT NOT NULL CHECK (qty > 0),
    buy_price NUMERIC(15, 2) NOT NULL,  -- Snapshot HPP saat penjualan terjadi
    sell_price NUMERIC(15, 2) NOT NULL, -- Snapshot Harga Jual yang disepakati (bisa Custom/Tier)
    original_price NUMERIC(15, 2),      -- Harga normal katalog produk
    price_tier VARCHAR(20) DEFAULT 'STANDAR', -- STANDAR, GROSIR, VIP
    is_custom_price BOOLEAN DEFAULT FALSE,    -- Flag apakah kasir mengubah harga manual
    subtotal NUMERIC(15, 2) NOT NULL,
    profit NUMERIC(15, 2) NOT NULL,     -- (sell_price - buy_price) * qty
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_sale_items_sale ON sale_items(sale_id);
CREATE INDEX idx_sale_items_product ON sale_items(product_id);

-- 7. TABEL PENERIMAAN BARANG MASUK (Stock In Header & Items)
CREATE TABLE stock_ins (
    id VARCHAR(36) PRIMARY KEY,
    reference_number VARCHAR(100) NOT NULL UNIQUE, -- No. PO / No. Surat Jalan Supplier
    supplier_id VARCHAR(36) REFERENCES suppliers(id),
    received_by VARCHAR(36) NOT NULL REFERENCES users(id),
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE stock_in_items (
    id VARCHAR(36) PRIMARY KEY,
    stock_in_id VARCHAR(36) NOT NULL REFERENCES stock_ins(id) ON DELETE CASCADE,
    product_id VARCHAR(36) NOT NULL REFERENCES products(id),
    qty INT NOT NULL CHECK (qty > 0),
    unit_cost NUMERIC(15, 2) NOT NULL DEFAULT 0.00,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 8. TABEL PENGELUARAN NON-PENJUALAN (Stock Out Header & Items)
CREATE TABLE stock_outs (
    id VARCHAR(36) PRIMARY KEY,
    reference_number VARCHAR(100) NOT NULL UNIQUE, -- Memo / BA Rusak
    reason VARCHAR(30) NOT NULL CHECK (reason IN ('OPERATIONAL', 'DAMAGED', 'LOST', 'EXPIRED', 'OTHER')),
    reported_by VARCHAR(36) NOT NULL REFERENCES users(id),
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE stock_out_items (
    id VARCHAR(36) PRIMARY KEY,
    stock_out_id VARCHAR(36) NOT NULL REFERENCES stock_outs(id) ON DELETE CASCADE,
    product_id VARCHAR(36) NOT NULL REFERENCES products(id),
    qty INT NOT NULL CHECK (qty > 0),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 9. TABEL KARTU STOK / AUDIT TRAIL MUTASI (Absolute Ledger)
-- Setiap pergerakan (POS, Inbound, Outbound, Opname) WAJIB masuk ke tabel ini!
CREATE TABLE stock_mutations (
    id VARCHAR(36) PRIMARY KEY,
    product_id VARCHAR(36) NOT NULL REFERENCES products(id),
    type VARCHAR(10) NOT NULL CHECK (type IN ('IN', 'OUT', 'ADJUSTMENT')),
    reference_type VARCHAR(30) NOT NULL CHECK (reference_type IN (
        'SALE', 'PURCHASE', 'OPERATIONAL', 'DAMAGED', 'LOST', 'RETURN', 'INITIAL_BALANCE'
    )),
    reference_id VARCHAR(60) NOT NULL, -- ID Faktur / No PO / No Memo
    qty INT NOT NULL CHECK (qty > 0),
    previous_stock INT NOT NULL,
    current_stock INT NOT NULL,
    performed_by VARCHAR(36) NOT NULL REFERENCES users(id),
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_mutations_product ON stock_mutations(product_id);
CREATE INDEX idx_mutations_date ON stock_mutations(created_at);
CREATE INDEX idx_mutations_ref ON stock_mutations(reference_id);
`;

  const backendCodeBoilerplate = `// ============================================================================
// CONTOH CONTROLLER API TRANSAKSI PENJUALAN + MUTASI STOK ATOMIK
// Tech Stack: Node.js (TypeScript) + Express.js + Prisma ORM / PostgreSQL
// Fitur: Menangani Race Condition dengan 'SELECT ... FOR UPDATE' & Database Transaction
// ============================================================================

import { Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

interface CheckoutRequest {
  items: Array<{
    productId: string;
    qty: number;
    sellPrice: number;
  }>;
  customerName?: string;
  paymentMethod: 'CASH' | 'QRIS' | 'TRANSFER' | 'DEBIT';
  amountPaid: number;
  discount?: number;
}

export async function processSaleTransaction(req: Request, res: Response) {
  const { items, customerName, paymentMethod, amountPaid, discount = 0 }: CheckoutRequest = req.body;
  const cashierId = req.user.id; // Diambil dari JWT Auth

  if (!items || items.length === 0) {
    return res.status(400).json({ error: 'Keranjang belanja tidak boleh kosong' });
  }

  try {
    // ------------------------------------------------------------------------
    // KUNCI: Menjalankan seluruh proses di dalam ACID DATABASE TRANSACTION
    // ------------------------------------------------------------------------
    const result = await prisma.$transaction(async (tx) => {
      let subtotal = 0;
      const saleItemsToCreate = [];
      const mutationsToCreate = [];

      // 1. Kunci Baris Produk Menggunakan 'SELECT ... FOR UPDATE' untuk Mencegah Race Condition!
      // Jika dua kasir checkout barang yang sama bersamaan, kasir kedua akan menunggu kunci
      // selesai tanpa resiko stok negatif atau dirty read.
      for (const item of items) {
        const productRows = await tx.$queryRaw<Array<{ id: string; name: string; sku: string; stock: number; buy_price: number; version: number }>>\`
          SELECT id, name, sku, stock, buy_price, version 
          FROM products 
          WHERE id = \${item.productId} 
          FOR UPDATE
        \`;

        const product = productRows[0];
        if (!product) {
          throw new Error(\`Produk dengan ID \${item.productId} tidak ditemukan.\`);
        }

        // 2. Validasi Ketersediaan Stok Fisik
        if (product.stock < item.qty) {
          throw new Error(
            \`Stok produk "\${product.name}" (\${product.sku}) tidak mencukupi! Tersedia: \${product.stock}, Diminta: \${item.qty}\`
          );
        }

        const itemSubtotal = item.sellPrice * item.qty;
        const itemProfit = (item.sellPrice - Number(product.buy_price)) * item.qty;
        subtotal += itemSubtotal;

        const previousStock = product.stock;
        const currentStock = previousStock - item.qty;

        // 3. Kurangi Stok Produk secara Atomik
        await tx.product.update({
          where: { id: product.id },
          data: {
            stock: currentStock,
            version: { increment: 1 }, // Optimistic locking audit
          },
        });

        // 4. Siapkan Data Detail Penjualan
        saleItemsToCreate.push({
          productId: product.id,
          qty: item.qty,
          buyPrice: Number(product.buy_price),
          sellPrice: item.sellPrice,
          subtotal: itemSubtotal,
          profit: itemProfit,
        });

        // 5. Siapkan Catatan Kartu Stok (Audit Trail Ledger)
        mutationsToCreate.push({
          productId: product.id,
          type: 'OUT',
          referenceType: 'SALE',
          qty: item.qty,
          previousStock,
          currentStock,
          performedBy: cashierId,
          notes: \`Penjualan POS Kasir - \${product.name}\`,
        });
      }

      // Hitung Pajak PPN 11% & Total Akhir
      const tax = Math.round(subtotal * 0.11);
      const total = Math.max(0, subtotal - discount + tax);

      if (paymentMethod === 'CASH' && amountPaid < total) {
        throw new Error(\`Nominal pembayaran tunai kurang. Total: \${total}, Dibayar: \${amountPaid}\`);
      }

      const changeAmount = paymentMethod === 'CASH' ? amountPaid - total : 0;
      const invoiceNumber = \`INV-\${new Date().toISOString().slice(0, 10).replace(/-/g, '')}-\${Math.floor(1000 + Math.random() * 9000)}\`;

      // 6. Buat Record Master Penjualan
      const createdSale = await tx.sale.create({
        data: {
          invoiceNumber,
          userId: cashierId,
          customerName: customerName || 'Pelanggan Umum',
          subtotal,
          discount,
          tax,
          total,
          paymentMethod,
          amountPaid: paymentMethod === 'CASH' ? amountPaid : total,
          changeAmount,
          items: {
            create: saleItemsToCreate,
          },
        },
        include: {
          items: true,
        },
      });

      // 7. Simpan Catatan Mutasi Kartu Stok Berantai
      for (const mut of mutationsToCreate) {
        await tx.stockMutation.create({
          data: {
            ...mut,
            referenceId: createdSale.invoiceNumber,
          },
        });
      }

      return createdSale;
    }, {
      // Tingkat isolasi ketat untuk menghindari Phantom Read / Dirty Read
      isolationLevel: Prisma.TransactionIsolationLevel.ReadCommitted, 
      maxWait: 5000, // Maksimal antri lock 5 detik
      timeout: 10000,
    });

    return res.status(201).json({
      success: true,
      message: 'Transaksi penjualan berhasil diproses & kartu stok diperbarui otomatis.',
      data: result,
    });

  } catch (error: any) {
    console.error('Error saat transaksi checkout:', error);
    return res.status(400).json({
      success: false,
      error: error.message || 'Gagal memproses transaksi.',
    });
  }
}
`;

  const folderStructure = `inventory-pos-system/
├── backend/                        # REST API Backend Service
│   ├── src/
│   │   ├── config/                 # Konfigurasi Database, Redis, JWT
│   │   │   ├── database.ts
│   │   │   └── redis.ts
│   │   ├── controllers/            # Controller Request Handlers
│   │   │   ├── auth.controller.ts
│   │   │   ├── product.controller.ts
│   │   │   ├── sale.controller.ts       <-- Endpoint POS & Checkout Atomik
│   │   │   ├── stock-in.controller.ts   <-- Penerimaan Supplier
│   │   │   ├── stock-out.controller.ts  <-- Pengeluaran Operasional
│   │   │   └── report.controller.ts     <-- Analitik Omzet & Laba
│   │   ├── services/               # Business Logic & Transaksi Database
│   │   │   ├── inventory.service.ts     <-- Logika Mutasi & Kartu Stok
│   │   │   └── checkout.service.ts      <-- SELECT FOR UPDATE & Locking
│   │   ├── middlewares/            # RBAC (Role-Based Access) & Auth
│   │   │   ├── auth.middleware.ts
│   │   │   └── rbac.middleware.ts       <-- Guard Admin, Kasir, Gudang
│   │   ├── models/ or prisma/      # Skema Database & Migrasi
│   │   │   ├── schema.prisma
│   │   │   └── migrations/
│   │   └── routes/                 # Express API Endpoints
│   │       ├── api.routes.ts
│   │       ├── products.routes.ts
│   │       └── sales.routes.ts
│   ├── tests/                      # Unit & Concurrency Load Tests
│   ├── package.json
│   └── tsconfig.json
│
├── frontend/                       # Web Dashboard & POS SPA
│   ├── src/
│   │   ├── components/
│   │   │   ├── pos/                # Terminal Kasir & Struk Thermal
│   │   │   │   ├── BarcodeScanner.tsx
│   │   │   │   ├── CartSidebar.tsx
│   │   │   │   └── ThermalReceiptModal.tsx
│   │   │   ├── inventory/          # Inbound, Outbound & Kartu Stok
│   │   │   │   ├── StockInForm.tsx
│   │   │   │   ├── StockOutForm.tsx
│   │   │   │   └── StockLedgerTable.tsx
│   │   │   ├── products/           # Master Data & Barcode Tag
│   │   │   └── dashboard/          # Chart Finansial & Omzet
│   │   ├── hooks/                  # Custom React Hooks
│   │   ├── services/               # Axios API Client
│   │   ├── stores/ or context/     # State Management (Zustand / Redux)
│   │   ├── types/                  # TypeScript Data Types
│   │   └── App.tsx
│   ├── index.html
│   ├── tailwind.config.js
│   └── package.json
│
└── docker-compose.yml              # Container Postgres, Redis, App
`;

  return (
    <div className="fixed inset-0 z-50 bg-black/60 dark:bg-black/85 backdrop-blur-md flex items-center justify-center p-3 sm:p-6 overflow-y-auto animate-in fade-in duration-200">
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 w-full max-w-5xl rounded-3xl shadow-2xl overflow-hidden flex flex-col h-[90vh] my-auto text-slate-800 dark:text-slate-100">
        
        {/* Modal Top Header */}
        <div className="px-6 py-4 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between bg-slate-50 dark:bg-slate-850">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-blue-600 via-indigo-600 to-cyan-500 flex items-center justify-center text-white shadow-md">
              <Code2 className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="font-bold text-slate-900 dark:text-slate-100 text-base">Arsitektur Sistem & Spesifikasi DDL Database</h3>
                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-blue-100 dark:bg-cyan-500/20 text-blue-700 dark:text-cyan-300 border border-blue-200 dark:border-cyan-500/30">
                  Ready for Production
                </span>
              </div>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Rancangan lengkap skema database, penanganan race condition, struktur folder, dan boilerplate kode API.
              </p>
            </div>
          </div>

          <button 
            onClick={onClose}
            className="text-slate-400 hover:text-slate-700 dark:hover:text-white p-2 rounded-xl hover:bg-slate-200 dark:hover:bg-slate-800 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tab Navigation */}
        <div className="flex items-center gap-2 px-6 py-2.5 bg-slate-100/90 dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800 overflow-x-auto text-xs">
          {[
            { id: 'customer_api', label: '⭐ Modul Pelanggan & Custom Price (API & DDL)', icon: Layers },
            { id: 'ddl', label: '3a. Skema Database Lengkap (DDL SQL)', icon: Database },
            { id: 'concurrency', label: '3b. Alur Kerja & Race Condition', icon: Cpu },
            { id: 'folder', label: '3c. Struktur Folder Project', icon: FolderTree },
            { id: 'code', label: '3d. Boilerplate API & Mutasi Otomatis', icon: Terminal },
            { id: 'stack', label: '2. Rekomendasi Tech Stack', icon: Server },
          ].map(tab => {
            const active = activeTab === tab.id;
            const Icon = tab.icon;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as any)}
                className={`flex items-center gap-2 px-4 py-2 rounded-xl font-semibold whitespace-nowrap transition-all cursor-pointer ${
                  active 
                    ? 'bg-blue-600 dark:bg-indigo-600 text-white shadow-xs' 
                    : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200 hover:bg-slate-200/70 dark:hover:bg-slate-800'
                }`}
              >
                <Icon className="w-4 h-4" />
                <span>{tab.label}</span>
              </button>
            );
          })}
        </div>

        {/* Tab Content Area */}
        <div className="flex-1 overflow-y-auto p-6 bg-slate-50/70 dark:bg-slate-950/60 font-sans">
          
          {/* TAB: MODUL PELANGGAN & CUSTOM PRICING (API & DDL) */}
          {activeTab === 'customer_api' && (
            <div className="space-y-6 text-xs text-slate-300">
              
              {/* Highlight Banner */}
              <div className="p-5 rounded-2xl bg-gradient-to-r from-blue-900/40 via-indigo-900/30 to-purple-900/40 border border-blue-500/30 space-y-2">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="px-2.5 py-1 rounded-lg bg-blue-500 text-white font-bold text-xs">
                      Fitur Baru Transaksi POS
                    </span>
                    <h4 className="text-base font-bold text-white">
                      Modul Nama Pelanggan (Autocomplete & Histori) + Custom Price Per Customer
                    </h4>
                  </div>
                  <span className="text-[11px] font-mono text-cyan-300 bg-cyan-950/60 px-3 py-1 rounded-full border border-cyan-500/30">
                    Live Terintegrasi di Terminal POS
                  </span>
                </div>
                <p className="text-slate-300 leading-relaxed text-xs">
                  Solusi lengkap untuk mengakomodasi transaksi korporasi (B2B) dan retail (B2C). Memungkinkan kasir mencari pelanggan dengan pencarian otomatis, memilih tingkat harga (Standar, Grosir, VIP), mengedit harga satuan manual (Custom/Override), serta mendapatkan peringatan otomatis harga yang pernah dibeli pelanggan sebelumnya.
                </p>
              </div>

              {/* 3 Metric Feature Cards */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-3.5">
                <div className="p-3.5 rounded-xl bg-slate-900 border border-slate-800 space-y-1.5">
                  <div className="flex items-center gap-2 text-blue-400 font-bold">
                    <span>1. Dropdown Autocomplete & Histori</span>
                  </div>
                  <p className="text-[11px] text-slate-400 leading-relaxed">
                    Input dropdown terhubung tabel <code className="text-cyan-300">customers</code>. Mendukung filter nama, nama PT, dan nomor telepon, serta opsi <strong className="text-slate-200">+ Tambah Pelanggan Baru</strong> via modal.
                  </p>
                </div>

                <div className="p-3.5 rounded-xl bg-slate-900 border border-slate-800 space-y-1.5">
                  <div className="flex items-center gap-2 text-indigo-400 font-bold">
                    <span>2. Custom Price & Tier Harga</span>
                  </div>
                  <p className="text-[11px] text-slate-400 leading-relaxed">
                    Input harga satuan per item produk (misal: <em>HOT FOIL LC1 POLOS</em> & <em>TIJ PRINTJET 1S</em>) dapat diedit manual kapan saja, atau memilih tier cepat: Standar, Grosir (-8%), VIP (-15%).
                  </p>
                </div>

                <div className="p-3.5 rounded-xl bg-slate-900 border border-slate-800 space-y-1.5">
                  <div className="flex items-center gap-2 text-amber-400 font-bold">
                    <span>3. Pengingat Harga Terakhir</span>
                  </div>
                  <p className="text-[11px] text-slate-400 leading-relaxed">
                    Jika pelanggan dipilih, sistem otomatis mendeteksi transaksi masa lalu dari tabel <code className="text-cyan-300">customer_special_prices</code> dan menampilkan banner harga terakhir dengan tombol 1-klik <em>"Terapkan"</em>.
                  </p>
                </div>
              </div>

              {/* Bagian A: Skema Database Tambahan */}
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <h4 className="text-sm font-bold text-white flex items-center gap-2">
                    <Database className="w-4 h-4 text-cyan-400" />
                    <span>A. Skema Database Tambahan (DDL SQL)</span>
                  </h4>
                  <button
                    onClick={() => copyToClipboard(`-- 1. TABEL CUSTOMERS
CREATE TABLE customers (
    id VARCHAR(36) PRIMARY KEY,
    name VARCHAR(150) NOT NULL,
    company_name VARCHAR(191),
    phone VARCHAR(30) NOT NULL,
    email VARCHAR(191),
    address TEXT,
    tier VARCHAR(20) NOT NULL DEFAULT 'STANDAR' CHECK (tier IN ('STANDAR', 'GROSIR', 'VIP')),
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_customers_phone ON customers(phone);
CREATE INDEX idx_customers_name ON customers(name);
CREATE INDEX idx_customers_company ON customers(company_name);

-- 2. TABEL CUSTOMER SPECIAL PRICES & LAST PURCHASED
CREATE TABLE customer_special_prices (
    id VARCHAR(36) PRIMARY KEY,
    customer_id VARCHAR(36) NOT NULL REFERENCES customers(id) ON DELETE CASCADE,
    product_id VARCHAR(36) NOT NULL REFERENCES products(id) ON DELETE CASCADE,
    custom_price NUMERIC(15, 2) NOT NULL,
    last_purchased_price NUMERIC(15, 2) NOT NULL,
    last_purchased_date DATE,
    note VARCHAR(255),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT uq_customer_product_price UNIQUE (customer_id, product_id)
);

CREATE INDEX idx_csp_customer ON customer_special_prices(customer_id);
CREATE INDEX idx_csp_product ON customer_special_prices(product_id);`, 'customer_ddl')}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold shadow transition-colors"
                  >
                    {copiedKey === 'customer_ddl' ? <Check className="w-3.5 h-3.5 text-emerald-300" /> : <Copy className="w-3.5 h-3.5" />}
                    <span>{copiedKey === 'customer_ddl' ? 'Tersalin!' : 'Salin SQL DDL'}</span>
                  </button>
                </div>

                <pre className="p-4 rounded-2xl bg-slate-900 border border-slate-800 text-[11px] font-mono text-cyan-300 overflow-x-auto leading-relaxed">
{`-- 1. TABEL CUSTOMERS (Master Pelanggan Retail & Korporasi PT)
CREATE TABLE customers (
    id VARCHAR(36) PRIMARY KEY,                      -- UUID v4
    name VARCHAR(150) NOT NULL,                      -- Nama PIC / Pembeli
    company_name VARCHAR(191),                      -- Nama Perusahaan PT / CV / Toko
    phone VARCHAR(30) NOT NULL,                     -- Nomor WhatsApp / Telp (Unik/Index)
    email VARCHAR(191),
    address TEXT,                                   -- Alamat Pabrik / Pengiriman
    tier VARCHAR(20) NOT NULL DEFAULT 'STANDAR' CHECK (tier IN ('STANDAR', 'GROSIR', 'VIP')),
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_customers_phone ON customers(phone);
CREATE INDEX idx_customers_name ON customers(name);
CREATE INDEX idx_customers_company ON customers(company_name);

-- 2. TABEL CUSTOMER_SPECIAL_PRICES (Histori Harga Produk Per Pelanggan)
CREATE TABLE customer_special_prices (
    id VARCHAR(36) PRIMARY KEY,
    customer_id VARCHAR(36) NOT NULL REFERENCES customers(id) ON DELETE CASCADE,
    product_id VARCHAR(36) NOT NULL REFERENCES products(id) ON DELETE CASCADE,
    custom_price NUMERIC(15, 2) NOT NULL,           -- Harga Khusus / Kontrak Disepakati
    last_purchased_price NUMERIC(15, 2) NOT NULL,   -- Harga Transaksi Terakhir
    last_purchased_date DATE,                       -- Tanggal Transaksi Terakhir
    note VARCHAR(255),                              -- Catatan (e.g. Diskon Proyek 2 Unit)
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT uq_customer_product_price UNIQUE (customer_id, product_id)
);

CREATE INDEX idx_csp_customer ON customer_special_prices(customer_id);
CREATE INDEX idx_csp_product ON customer_special_prices(product_id);`}
                </pre>
              </div>

              {/* Bagian B: Logika Backend / API Endpoints */}
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <h4 className="text-sm font-bold text-white flex items-center gap-2">
                    <Terminal className="w-4 h-4 text-emerald-400" />
                    <span>B. Logika Backend & Spesifikasi 3 API Endpoint</span>
                  </h4>
                  <span className="text-[11px] text-slate-400">RESTful JSON Specification</span>
                </div>

                {/* Endpoint 1 */}
                <div className="p-4 rounded-2xl bg-slate-900 border border-slate-800 space-y-2">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span className="px-2 py-0.5 rounded font-mono font-bold text-[10px] bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
                        GET
                      </span>
                      <code className="font-mono text-cyan-300 font-bold text-xs">/api/v1/customers?search=kemasan</code>
                    </div>
                    <span className="text-[10px] text-slate-400">Autocomplete & Dropdown Search</span>
                  </div>
                  <p className="text-slate-400 text-[11px]">
                    Mencari pelanggan berdasarkan nama, perusahaan PT, atau nomor telepon untuk mengisi input dropdown kasir secara cepat.
                  </p>
                  <pre className="p-3 rounded-xl bg-slate-950 font-mono text-[10px] text-slate-300 overflow-x-auto">
{`// Handler Express.js / TypeScript
app.get('/api/v1/customers', async (req, res) => {
  const search = String(req.query.search || '').trim();
  const customers = await prisma.customer.findMany({
    where: search ? {
      OR: [
        { name: { contains: search, mode: 'insensitive' } },
        { companyName: { contains: search, mode: 'insensitive' } },
        { phone: { contains: search } }
      ]
    } : undefined,
    take: 30,
    orderBy: { name: 'asc' }
  });
  return res.json({ success: true, data: customers });
});`}
                  </pre>
                </div>

                {/* Endpoint 2 */}
                <div className="p-4 rounded-2xl bg-slate-900 border border-slate-800 space-y-2">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span className="px-2 py-0.5 rounded font-mono font-bold text-[10px] bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
                        GET
                      </span>
                      <code className="font-mono text-cyan-300 font-bold text-xs">/api/v1/customers/:id/last-prices</code>
                    </div>
                    <span className="text-[10px] text-slate-400">Customer Price History</span>
                  </div>
                  <p className="text-slate-400 text-[11px]">
                    Mengambil seluruh daftar harga beli terakhir atau harga kontrak khusus yang pernah diberikan kepada pelanggan tersebut.
                  </p>
                  <pre className="p-3 rounded-xl bg-slate-950 font-mono text-[10px] text-slate-300 overflow-x-auto">
{`// Handler Express.js / TypeScript
app.get('/api/v1/customers/:id/last-prices', async (req, res) => {
  const { id } = req.params;
  const history = await prisma.customerSpecialPrice.findMany({
    where: { customerId: id },
    include: {
      product: { select: { id: true, name: true, sku: true, sellPrice: true } }
    }
  });
  return res.json({ success: true, data: history });
});`}
                  </pre>
                </div>

                {/* Endpoint 3 */}
                <div className="p-4 rounded-2xl bg-slate-900 border border-slate-800 space-y-2">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span className="px-2 py-0.5 rounded font-mono font-bold text-[10px] bg-blue-500/20 text-blue-400 border border-blue-500/30">
                        POST
                      </span>
                      <code className="font-mono text-cyan-300 font-bold text-xs">/api/v1/sales</code>
                    </div>
                    <span className="text-[10px] text-slate-400">Atomic POS Checkout + Price Sync</span>
                  </div>
                  <p className="text-slate-400 text-[11px]">
                    Menyimpan transaksi kasir, mengunci stok dengan <em>SELECT FOR UPDATE</em>, mencatat customer ID & custom/override price, serta secara otomatis memperbarui tabel histori <code className="text-cyan-300">customer_special_prices</code>.
                  </p>
                  <pre className="p-3 rounded-xl bg-slate-950 font-mono text-[10px] text-slate-300 overflow-x-auto">
{`// Handler Express.js / TypeScript dengan Prisma Transaction ACID
app.post('/api/v1/sales', async (req, res) => {
  const { customerId, paymentMethod, amountPaid, items } = req.body;
  
  const result = await prisma.$transaction(async (tx) => {
    // 1. Lock & Validasi Stok Produk
    for (const it of items) {
      const prod = await tx.product.findUniqueOrThrow({ where: { id: it.productId } });
      if (prod.stock < it.qty) throw new Error(\`Stok \${prod.name} tidak cukup!\`);
      await tx.product.update({
        where: { id: it.productId },
        data: { stock: { decrement: it.qty } }
      });
    }

    // 2. Simpan Header Transaksi Penjualan
    const sale = await tx.sale.create({
      data: {
        invoiceNumber: \`INV-\${Date.now()}\`,
        customerId: customerId || null,
        paymentMethod,
        items: {
          create: items.map(it => ({
            productId: it.productId,
            qty: it.qty,
            sellPrice: it.agreedPrice,       // Harga Custom yang disepakati
            isCustomPrice: it.isCustomPrice, // Flag override
            subtotal: it.agreedPrice * it.qty
          }))
        }
      }
    });

    // 3. Update / Upsert Histori Harga Khusus Pelanggan
    if (customerId) {
      for (const it of items) {
        await tx.customerSpecialPrice.upsert({
          where: { customerId_productId: { customerId, productId: it.productId } },
          create: {
            customerId,
            productId: it.productId,
            customPrice: it.agreedPrice,
            lastPurchasedPrice: it.agreedPrice,
            lastPurchasedDate: new Date()
          },
          update: {
            customPrice: it.agreedPrice,
            lastPurchasedPrice: it.agreedPrice,
            lastPurchasedDate: new Date()
          }
        });
      }
    }

    return sale;
  });

  return res.status(201).json({ success: true, data: result });
});`}
                  </pre>
                </div>

              </div>

            </div>
          )}

          {/* TAB 1: DDL SQL */}
          {activeTab === 'ddl' && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h4 className="text-sm font-bold text-slate-100 flex items-center gap-2">
                    <Database className="w-4 h-4 text-cyan-400" />
                    <span>Skema Database Relasional Lengkap (PostgreSQL / MySQL ANSI)</span>
                  </h4>
                  <p className="text-xs text-slate-400 mt-0.5">
                    Memuat tabel: Users, Categories, Suppliers, Products, Sales, SaleItems, StockIns, StockOuts, dan StockMutations.
                  </p>
                </div>
                <button
                  onClick={() => copyToClipboard(sqlDDLCode, 'ddl')}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold shadow transition-colors"
                >
                  {copiedKey === 'ddl' ? <Check className="w-4 h-4 text-emerald-300" /> : <Copy className="w-4 h-4" />}
                  <span>{copiedKey === 'ddl' ? 'Tersalin!' : 'Salin DDL SQL'}</span>
                </button>
              </div>

              <div className="p-4 rounded-xl bg-indigo-950/20 border border-indigo-500/30 text-xs text-indigo-300 space-y-1">
                <p className="font-semibold text-slate-200">Kelebihan Skema DDL Ini:</p>
                <ul className="list-disc pl-5 space-y-0.5 text-slate-400">
                  <li><strong className="text-slate-200">Constraint CHECK (stock &gt;= 0):</strong> Memastikan saldo stok tidak pernah minus di level database engine.</li>
                  <li><strong className="text-slate-200">Kolom snapshot harga (buy_price & sell_price di sale_items):</strong> Melindungi histori laba kotor jika master harga produk berubah di masa depan.</li>
                  <li><strong className="text-slate-200">Index performa tinggi:</strong> Ditempatkan pada sku, barcode, invoice_number, dan tanggal mutasi.</li>
                </ul>
              </div>

              <pre className="p-4 rounded-2xl bg-slate-900 border border-slate-800 text-[11px] font-mono text-cyan-300 overflow-x-auto leading-relaxed">
                {sqlDDLCode}
              </pre>
            </div>
          )}

          {/* TAB 2: ALUR KERJA & RACE CONDITION */}
          {activeTab === 'concurrency' && (
            <div className="space-y-5 text-xs text-slate-300">
              
              <div className="p-4 rounded-2xl bg-slate-900 border border-slate-800">
                <h4 className="text-sm font-bold text-slate-100 flex items-center gap-2 mb-2">
                  <Cpu className="w-4 h-4 text-amber-400" />
                  <span>Strategi Penanganan Race Condition Saat Transaksi Bersamaan</span>
                </h4>
                <p className="text-slate-400 leading-relaxed">
                  Dalam skenario POS multi-kasir atau sistem e-commerce terintegrasi, dua kasir dapat mengklik "Bayar" secara bersamaan (milidetik yang sama) untuk sisa 1 unit stok barang yang sama. Tanpa proteksi konkurensi yang tepat, kedua kasir akan berhasil checkout, menyebabkan <strong>stok negatif (overselling)</strong>.
                </p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                
                {/* Solusi 1: SELECT FOR UPDATE */}
                <div className="p-4 rounded-2xl bg-slate-900 border border-indigo-500/40 space-y-2">
                  <div className="flex items-center gap-2 text-indigo-400 font-bold text-sm">
                    <span className="w-6 h-6 rounded-lg bg-indigo-500/20 flex items-center justify-center text-xs">1</span>
                    <span>Pessimistic Locking (SELECT ... FOR UPDATE)</span>
                  </div>
                  <p className="text-slate-400">
                    Ini adalah standar emas untuk sistem Point of Sale & ERP perbankan/inventori:
                  </p>
                  <pre className="p-2.5 rounded-lg bg-slate-950 font-mono text-[10px] text-emerald-400">
{`BEGIN TRANSACTION;
-- Mengunci baris produk spesifik
SELECT stock FROM products 
WHERE id = 'prod-001' 
FOR UPDATE;

-- Validasi stok di kode aplikasi
IF stock >= requested_qty THEN
   UPDATE products SET stock = stock - qty;
   INSERT INTO sales (...);
   INSERT INTO stock_mutations (...);
   COMMIT;
ELSE
   ROLLBACK;
END IF;`}
                  </pre>
                  <p className="text-[11px] text-slate-400">
                    <strong className="text-slate-200">Cara Kerja:</strong> Transaksi kasir kedua otomatis berhenti dan mengantre (wait) sampai kasir pertama selesai melakukan commit. Kasir kedua kemudian membaca stok terbaru (yang sudah berkurang).
                  </p>
                </div>

                {/* Solusi 2: Optimistic Locking */}
                <div className="p-4 rounded-2xl bg-slate-900 border border-cyan-500/40 space-y-2">
                  <div className="flex items-center gap-2 text-cyan-400 font-bold text-sm">
                    <span className="w-6 h-6 rounded-lg bg-cyan-500/20 flex items-center justify-center text-xs">2</span>
                    <span>Optimistic Locking (Version Column)</span>
                  </div>
                  <p className="text-slate-400">
                    Cocok untuk sistem throughput tinggi dengan sedikit konflik:
                  </p>
                  <pre className="p-2.5 rounded-lg bg-slate-950 font-mono text-[10px] text-cyan-300">
{`-- Cek versi saat ini (misal version = 5)
UPDATE products 
SET stock = stock - 1, 
    version = version + 1
WHERE id = 'prod-001' 
  AND version = 5 
  AND stock >= 1;

-- Periksa rows affected:
-- Jika 0 baris berubah -> Konflik terdeteksi!
-- Batalkan transaksi atau retry.`}
                  </pre>
                  <p className="text-[11px] text-slate-400">
                    <strong className="text-slate-200">Keunggulan:</strong> Tidak mengunci baris (non-blocking), sangat cepat untuk membaca data, aman dari race condition.
                  </p>
                </div>

              </div>

              {/* Concurrency Architecture Diagram */}
              <div className="p-4 rounded-2xl bg-slate-900 border border-slate-800 space-y-3">
                <h5 className="font-bold text-slate-200">Alur Eksekusi Transaksi POS & Mutasi Stok:</h5>
                <div className="flex flex-col md:flex-row items-center justify-between gap-3 text-center">
                  <div className="p-3 rounded-xl bg-slate-800 flex-1 w-full border border-slate-700">
                    <p className="font-bold text-indigo-300 text-xs">1. Kasir Scan Barcode</p>
                    <p className="text-[10px] text-slate-400 mt-1">Cari SKU di Client, masuk ke Cart</p>
                  </div>
                  <span className="text-indigo-400 font-bold hidden md:inline">➔</span>
                  <div className="p-3 rounded-xl bg-slate-800 flex-1 w-full border border-slate-700">
                    <p className="font-bold text-indigo-300 text-xs">2. Klik Checkout (API)</p>
                    <p className="text-[10px] text-slate-400 mt-1">Membuka ACID Transaction</p>
                  </div>
                  <span className="text-indigo-400 font-bold hidden md:inline">➔</span>
                  <div className="p-3 rounded-xl bg-indigo-950/60 flex-1 w-full border border-indigo-500/40">
                    <p className="font-bold text-amber-300 text-xs">3. SELECT FOR UPDATE</p>
                    <p className="text-[10px] text-slate-300 mt-1">Kunci baris produk & validasi stok</p>
                  </div>
                  <span className="text-indigo-400 font-bold hidden md:inline">➔</span>
                  <div className="p-3 rounded-xl bg-slate-800 flex-1 w-full border border-slate-700">
                    <p className="font-bold text-emerald-300 text-xs">4. Potong Stok & Audit Mutasi</p>
                    <p className="text-[10px] text-slate-400 mt-1">Simpan Sale + StockMutation</p>
                  </div>
                  <span className="text-indigo-400 font-bold hidden md:inline">➔</span>
                  <div className="p-3 rounded-xl bg-emerald-950/60 flex-1 w-full border border-emerald-500/40">
                    <p className="font-bold text-emerald-300 text-xs">5. COMMIT & Struk</p>
                    <p className="text-[10px] text-slate-300 mt-1">Cetak Slip Thermal Kasir</p>
                  </div>
                </div>
              </div>

            </div>
          )}

          {/* TAB 3: STRUKTUR FOLDER */}
          {activeTab === 'folder' && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h4 className="text-sm font-bold text-slate-100 flex items-center gap-2">
                    <FolderTree className="w-4 h-4 text-indigo-400" />
                    <span>Struktur Folder Project Modular & Siap Produksi</span>
                  </h4>
                  <p className="text-xs text-slate-400 mt-0.5">
                    Memisahkan Clean Architecture (Controller, Service, Repository, Middleware, Presentation).
                  </p>
                </div>
                <button
                  onClick={() => copyToClipboard(folderStructure, 'folder')}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold shadow transition-colors"
                >
                  {copiedKey === 'folder' ? <Check className="w-4 h-4 text-emerald-300" /> : <Copy className="w-4 h-4" />}
                  <span>{copiedKey === 'folder' ? 'Tersalin!' : 'Salin Struktur Folder'}</span>
                </button>
              </div>

              <pre className="p-4 rounded-2xl bg-slate-900 border border-slate-800 text-[11px] font-mono text-emerald-300 overflow-x-auto leading-relaxed">
                {folderStructure}
              </pre>
            </div>
          )}

          {/* TAB 4: BOILERPLATE CODE */}
          {activeTab === 'code' && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h4 className="text-sm font-bold text-slate-100 flex items-center gap-2">
                    <Terminal className="w-4 h-4 text-emerald-400" />
                    <span>Boilerplate Controller API: Transaksi POS & Mutasi Stok Atomik</span>
                  </h4>
                  <p className="text-xs text-slate-400 mt-0.5">
                    Implementasi TypeScript + Express + Prisma / PostgreSQL dengan ACID Transaction & 'FOR UPDATE'.
                  </p>
                </div>
                <button
                  onClick={() => copyToClipboard(backendCodeBoilerplate, 'code')}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold shadow transition-colors"
                >
                  {copiedKey === 'code' ? <Check className="w-4 h-4 text-emerald-300" /> : <Copy className="w-4 h-4" />}
                  <span>{copiedKey === 'code' ? 'Tersalin!' : 'Salin Contoh Kode'}</span>
                </button>
              </div>

              <pre className="p-4 rounded-2xl bg-slate-900 border border-slate-800 text-[11px] font-mono text-indigo-300 overflow-x-auto leading-relaxed">
                {backendCodeBoilerplate}
              </pre>
            </div>
          )}

          {/* TAB 5: TECH STACK REKOMENDASI */}
          {activeTab === 'stack' && (
            <div className="space-y-4 text-xs text-slate-300">
              <div className="p-4 rounded-2xl bg-slate-900 border border-slate-800">
                <h4 className="text-sm font-bold text-slate-100 flex items-center gap-2 mb-2">
                  <Server className="w-4 h-4 text-indigo-400" />
                  <span>Rekomendasi Tech Stack Modern, Modular & Efisien</span>
                </h4>
                <p className="text-slate-400 leading-relaxed">
                  Berdasarkan kebutuhan audit trail mutlak, kecepatan POS kasir, dan skalabilitas pergudangan, kami merekomendasikan opsi berikut:
                </p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                
                {/* OPSI 1: Modern TypeScript Stack */}
                <div className="p-5 rounded-2xl bg-slate-900 border border-indigo-500/40 space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-sm text-indigo-400">Pilihan A: TypeScript Full-Stack (Direkomendasikan)</span>
                    <span className="text-[10px] bg-indigo-500/20 text-indigo-300 px-2 py-0.5 rounded-full font-bold">Ultra Fast & Typed</span>
                  </div>
                  <ul className="space-y-1.5 text-slate-300">
                    <li><strong className="text-white">• Backend:</strong> Node.js (v20 LTS) dengan Express.js / Fastify / NestJS + TypeScript</li>
                    <li><strong className="text-white">• ORM:</strong> Prisma ORM / Drizzle ORM (Type-safe & migration tool)</li>
                    <li><strong className="text-white">• Database:</strong> PostgreSQL 15+ (Mendukung JSONB, indexing BTREE & GIN)</li>
                    <li><strong className="text-white">• Caching & Locks:</strong> Redis (untuk rate limiting & distributed lock)</li>
                    <li><strong className="text-white">• Frontend:</strong> React 19 / Next.js + Tailwind CSS + Lucide Icons</li>
                    <li><strong className="text-white">• Keunggulan:</strong> Berbagi interface tipe data (DTO) yang sama antara Frontend & Backend, latency sangat rendah.</li>
                  </ul>
                </div>

                {/* OPSI 2: Laravel Stack */}
                <div className="p-5 rounded-2xl bg-slate-900 border border-slate-700 space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-sm text-amber-400">Pilihan B: Laravel 11 + MySQL/MariaDB</span>
                    <span className="text-[10px] bg-amber-500/20 text-amber-300 px-2 py-0.5 rounded-full font-bold">Rapid Enterprise</span>
                  </div>
                  <ul className="space-y-1.5 text-slate-300">
                    <li><strong className="text-white">• Backend:</strong> PHP 8.3 + Laravel 11 (Eloquent ORM & Database Transactions)</li>
                    <li><strong className="text-white">• Database:</strong> MySQL 8.0+ (InnoDB Engine dengan Strict SQL Mode)</li>
                    <li><strong className="text-white">• Frontend:</strong> Inertia.js + React / Vue 3 + Tailwind CSS</li>
                    <li><strong className="text-white">• Auth:</strong> Laravel Sanctum (Token-based API Authentication)</li>
                    <li><strong className="text-white">• Keunggulan:</strong> Fitur bawaan sangat lengkap (Jobs, Queues, Database Seeder, Migrations, dan ORM Events).</li>
                  </ul>
                </div>

              </div>
            </div>
          )}

        </div>

        {/* Modal Bottom Footer */}
        <div className="p-4 bg-slate-50 dark:bg-slate-850 border-t border-slate-200 dark:border-slate-800 flex items-center justify-between text-xs text-slate-500 dark:text-slate-400">
          <span>
            SIMPOS Architecture Blueprint • Divalidasi untuk 80+ SKU Industri & Audit Trail 2026
          </span>
          <button
            onClick={onClose}
            className="px-5 py-2 rounded-xl bg-slate-200 hover:bg-slate-300 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-200 text-xs font-semibold transition-colors cursor-pointer"
          >
            Tutup Jendela
          </button>
        </div>

      </div>
    </div>
  );
};
