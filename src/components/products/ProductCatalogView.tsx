import React, { useState, useMemo } from 'react';
import { 
  Package, 
  Plus, 
  Search, 
  Filter, 
  Download, 
  Edit3, 
  Trash2, 
  AlertTriangle, 
  ShieldCheck, 
  Barcode, 
  DollarSign, 
  X,
  Check,
  Building2,
  Layers,
  ArrowUpDown
} from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { Product, ProductCategory } from '../../types';

const CATEGORIES: ProductCategory[] = [
  'MESIN CODING',
  'MACHINE',
  'CONSUMABLE CIJ',
  'CARTRIDGE',
  'CHIP',
  'RIBBON',
  'KERTAS KASIR',
  'LABEL',
  'PLASTIC ROLL',
  'OTHERS',
];

const UNITS = ['Unit', 'Roll', 'Botol', 'Pcs', 'Box', 'Pack', 'Rim'];

interface ProductCatalogViewProps {
  searchTerm: string;
}

export const ProductCatalogView: React.FC<ProductCatalogViewProps> = ({ searchTerm }) => {
  const { 
    products, 
    addProduct, 
    updateProduct, 
    deleteProduct, 
    currentUser,
    getLowStockProducts,
    getOutOfStockProducts 
  } = useApp();

  const [localSearch, setLocalSearch] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('ALL');
  const [stockFilter, setStockFilter] = useState<'ALL' | 'SAFE' | 'LOW' | 'OUT'>('ALL');
  const [sortField, setSortField] = useState<'name' | 'stock' | 'sellPrice'>('name');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('asc');

  // Modal State
  const [showModal, setShowModal] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);

  // Form State
  const [formData, setFormData] = useState({
    name: '',
    sku: '',
    barcode: '',
    category: 'MESIN CODING' as ProductCategory,
    unit: 'Unit',
    buyPrice: 0,
    sellPrice: 0,
    stock: 0,
    minStock: 2,
    location: '',
    description: '',
  });

  const formatIDR = (val: number) => 'Rp ' + Math.round(val).toLocaleString('id-ID');

  const effectiveSearch = (localSearch || searchTerm).trim().toLowerCase();

  // Metrics
  const totalSKUs = products.length;
  const totalPhysicalStock = products.reduce((acc, p) => acc + p.stock, 0);
  const totalInventoryAssetValue = products.reduce((acc, p) => acc + ((p.sellPrice || p.buyPrice || 0) * p.stock), 0);
  const lowStockCount = getLowStockProducts().length;
  const outOfStockCount = getOutOfStockProducts().length;

  const filteredProducts = useMemo(() => {
    return products
      .filter((p) => {
        const matchCategory = selectedCategory === 'ALL' || p.category === selectedCategory;
        const matchSearch =
          !effectiveSearch ||
          p.name.toLowerCase().includes(effectiveSearch) ||
          p.sku.toLowerCase().includes(effectiveSearch) ||
          p.barcode.toLowerCase().includes(effectiveSearch);

        let matchStock = true;
        if (stockFilter === 'OUT') matchStock = p.stock <= 0;
        else if (stockFilter === 'LOW') matchStock = p.stock > 0 && p.stock <= p.minStock;
        else if (stockFilter === 'SAFE') matchStock = p.stock > p.minStock;

        return matchCategory && matchSearch && matchStock;
      })
      .sort((a, b) => {
        let valA = a[sortField];
        let valB = b[sortField];
        if (typeof valA === 'string') {
          return sortOrder === 'asc' 
            ? (valA as string).localeCompare(valB as string) 
            : (valB as string).localeCompare(valA as string);
        }
        return sortOrder === 'asc' ? (valA as number) - (valB as number) : (valB as number) - (valA as number);
      });
  }, [products, selectedCategory, effectiveSearch, stockFilter, sortField, sortOrder]);

  const handleOpenAdd = () => {
    const randomSuffix = Math.floor(1000 + Math.random() * 9000);
    setEditingProduct(null);
    setFormData({
      name: '',
      sku: `SKU-${randomSuffix}`,
      barcode: `899${randomSuffix}${Math.floor(10000 + Math.random() * 90000)}`,
      category: 'CARTRIDGE',
      unit: 'Pcs',
      buyPrice: 0,
      sellPrice: 150000,
      stock: 10,
      minStock: 5,
      location: 'Gudang Utama',
      description: '',
    });
    setShowModal(true);
  };

  const handleOpenEdit = (prod: Product) => {
    setEditingProduct(prod);
    setFormData({
      name: prod.name,
      sku: prod.sku,
      barcode: prod.barcode,
      category: prod.category,
      unit: prod.unit,
      buyPrice: prod.buyPrice,
      sellPrice: prod.sellPrice,
      stock: prod.stock,
      minStock: prod.minStock,
      location: prod.location || '',
      description: prod.description || '',
    });
    setShowModal(true);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name.trim() || !formData.sku.trim()) {
      alert('Nama produk dan SKU wajib diisi');
      return;
    }

    if (editingProduct) {
      updateProduct(editingProduct.id, {
        name: formData.name,
        sku: formData.sku,
        barcode: formData.barcode,
        category: formData.category,
        unit: formData.unit,
        buyPrice: Number(formData.buyPrice),
        sellPrice: Number(formData.sellPrice),
        stock: Number(formData.stock),
        minStock: Number(formData.minStock),
        location: formData.location,
        description: formData.description,
      });
    } else {
      addProduct({
        name: formData.name,
        sku: formData.sku,
        barcode: formData.barcode,
        category: formData.category,
        unit: formData.unit,
        buyPrice: Number(formData.buyPrice),
        sellPrice: Number(formData.sellPrice),
        stock: Number(formData.stock),
        minStock: Number(formData.minStock),
        location: formData.location,
        description: formData.description,
        isActive: true,
      });
    }

    setShowModal(false);
  };

  // CSV Export
  const handleExportCSV = () => {
    const headers = ['ID,SKU,BARCODE,NAMA_BARANG,KATEGORI,SATUAN,HARGA_BELI,HARGA_JUAL,STOK_SAAT_INI,MIN_STOK,LOKASI'];
    const rows = products.map(p => 
      `"${p.id}","${p.sku}","${p.barcode}","${p.name.replace(/"/g, '""')}","${p.category}","${p.unit}",${p.buyPrice},${p.sellPrice},${p.stock},${p.minStock},"${p.location || ''}"`
    );
    const csvContent = 'data:text/csv;charset=utf-8,' + [headers, ...rows].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `Katalog_Stok_SIMPOS_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const isAdmin = currentUser.role === 'ADMIN';

  return (
    <div className="h-[calc(100vh-57px)] max-h-[calc(100vh-57px)] flex-1 flex flex-col overflow-hidden bg-[#f3f4f6] dark:bg-[#18181b] p-4 lg:p-6 space-y-3.5 transition-colors duration-200">
      
      {/* Top Header & Metrics Bar (Fixed, Non-scrolling) */}
      <div className="shrink-0 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h2 className="text-xl font-bold text-slate-900 dark:text-white tracking-tight flex items-center gap-2">
            <Package className="w-6 h-6 text-blue-600 dark:text-indigo-400" />
            <span>Katalog Produk, Barcode & SKU</span>
          </h2>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
            Manajemen master data suku cadang, mesin, ribbon, & consumables 2026.
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <button
            onClick={handleExportCSV}
            className="flex items-center gap-2 px-3.5 py-2 rounded-xl bg-white dark:bg-slate-800 hover:bg-slate-100 dark:hover:bg-slate-750 text-slate-700 dark:text-slate-300 border border-slate-300 dark:border-slate-700 text-xs font-semibold shadow-xs transition-all cursor-pointer"
            title="Download CSV Katalog Lengkap"
          >
            <Download className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
            <span>Ekspor CSV</span>
          </button>

          {isAdmin && (
            <button
              onClick={handleOpenAdd}
              className="flex items-center gap-2 px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-500 dark:bg-indigo-600 dark:hover:bg-indigo-500 text-white text-xs font-bold shadow-md shadow-blue-600/20 dark:shadow-indigo-600/30 transition-all cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              <span>Tambah Produk Baru</span>
            </button>
          )}
        </div>
      </div>

      {/* KPI Metric Mini Cards (Fixed, Non-scrolling) */}
      <div className="shrink-0 grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div className="p-3 rounded-2xl bg-white dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700/60 shadow-xs">
          <p className="text-[11px] text-slate-500 dark:text-slate-400 font-medium">Total SKU Aktif</p>
          <p className="text-xl font-black text-slate-900 dark:text-slate-100 mt-0.5">{totalSKUs} Item</p>
          <p className="text-[10px] text-blue-600 dark:text-indigo-400 mt-0.5">10 Kategori Industri</p>
        </div>

        <div className="p-3 rounded-2xl bg-white dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700/60 shadow-xs">
          <p className="text-[11px] text-slate-500 dark:text-slate-400 font-medium">Total Unit Fisik</p>
          <p className="text-xl font-black text-slate-900 dark:text-slate-100 mt-0.5">{totalPhysicalStock.toLocaleString('id-ID')}</p>
          <p className="text-[10px] text-emerald-600 dark:text-emerald-400 mt-0.5">Unit/Roll/Pcs di Gudang</p>
        </div>

        <div className="p-3 rounded-2xl bg-white dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700/60 shadow-xs">
          <p className="text-[11px] text-slate-500 dark:text-slate-400 font-medium">Nilai Aset Stok (Harga Jual)</p>
          <p className="text-xl font-black text-emerald-600 dark:text-emerald-400 mt-0.5">{formatIDR(totalInventoryAssetValue)}</p>
          <p className="text-[10px] text-slate-500 dark:text-slate-400 mt-0.5">Valuasi Berdasarkan Harga Jual</p>
        </div>

        <div className="p-3 rounded-2xl bg-white dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700/60 shadow-xs">
          <p className="text-[11px] text-slate-500 dark:text-slate-400 font-medium">Perhatian Stok</p>
          <div className="flex items-center gap-2 mt-0.5">
            <span className="text-xl font-black text-rose-600 dark:text-rose-400">{outOfStockCount} Habis</span>
            <span className="text-xs text-slate-400">•</span>
            <span className="text-sm font-bold text-amber-600 dark:text-amber-400">{lowStockCount} Menipis</span>
          </div>
          <p className="text-[10px] text-amber-600 dark:text-amber-400 mt-0.5">Butuh Pengadaan PO</p>
        </div>
      </div>

      {/* Filter and Search Controls (Fixed, Non-scrolling) */}
      <div className="shrink-0 flex flex-col md:flex-row gap-3 items-stretch md:items-center justify-between bg-white dark:bg-slate-800/50 p-2.5 rounded-2xl border border-slate-200 dark:border-slate-700/60 shadow-xs">
        
        <div className="flex flex-wrap items-center gap-2">
          {/* Category Dropdown */}
          <div className="relative">
            <select
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
              className="px-3 py-1.5 bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg text-xs text-slate-800 dark:text-slate-200 focus:outline-none focus:border-blue-500"
            >
              <option value="ALL">Semua Kategori ({products.length})</option>
              {CATEGORIES.map(cat => (
                <option key={cat} value={cat}>{cat}</option>
              ))}
            </select>
          </div>

          {/* Stock Filter Pills */}
          <div className="flex items-center gap-1 bg-slate-100 dark:bg-slate-800 p-0.5 rounded-lg border border-slate-200 dark:border-slate-700 text-xs">
            {[
              { id: 'ALL', label: 'Semua Stok' },
              { id: 'SAFE', label: 'Stok Aman' },
              { id: 'LOW', label: `Menipis (${lowStockCount})` },
              { id: 'OUT', label: `Habis (${outOfStockCount})` },
            ].map((f) => (
              <button
                key={f.id}
                onClick={() => setStockFilter(f.id as any)}
                className={`px-2.5 py-1 rounded-md text-[11px] font-medium transition-all ${
                  stockFilter === f.id
                    ? 'bg-blue-600 dark:bg-indigo-600 text-white shadow-xs'
                    : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'
                }`}
              >
                {f.label}
              </button>
            ))}
          </div>
        </div>

        {/* Local Search input */}
        <div className="relative w-full md:w-72">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <input
            type="text"
            placeholder="Cari SKU, Barcode, Nama Produk..."
            value={localSearch}
            onChange={(e) => setLocalSearch(e.target.value)}
            className="w-full pl-9 pr-3 py-1.5 bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg text-xs text-slate-900 dark:text-slate-200 placeholder-slate-400 dark:placeholder-slate-500 focus:outline-none focus:border-blue-500 shadow-xs"
          />
        </div>

      </div>

      {/* Products Data Table (The ONLY Container That Scrolls) */}
      <div className="flex-1 min-h-0 overflow-y-auto rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900/60 shadow-xs">
        <table className="w-full text-left text-xs text-slate-700 dark:text-slate-300">
          <thead className="sticky top-0 bg-slate-100/95 dark:bg-slate-800/95 backdrop-blur-sm text-[11px] uppercase tracking-wider text-slate-600 dark:text-slate-400 font-semibold border-b border-slate-200 dark:border-slate-700 z-10 shadow-xs">
            <tr>
              <th className="py-3 px-4">SKU / BARCODE</th>
              <th className="py-3 px-4 cursor-pointer hover:text-slate-900 dark:hover:text-white" onClick={() => {
                setSortField('name');
                setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
              }}>
                <div className="flex items-center gap-1.5">
                  <span>NAMA PRODUK</span>
                  <ArrowUpDown className="w-3 h-3 text-slate-400" />
                </div>
              </th>
              <th className="py-3 px-4">KATEGORI</th>
              <th className="py-3 px-4 text-right">HARGA BELI (HPP)</th>
              <th className="py-3 px-4 text-right cursor-pointer hover:text-slate-900 dark:hover:text-white" onClick={() => {
                setSortField('sellPrice');
                setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
              }}>
                <div className="flex items-center justify-end gap-1.5">
                  <span>HARGA JUAL</span>
                  <ArrowUpDown className="w-3 h-3 text-slate-400" />
                </div>
              </th>
              <th className="py-3 px-4 text-center cursor-pointer hover:text-slate-900 dark:hover:text-white" onClick={() => {
                setSortField('stock');
                setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
              }}>
                <div className="flex items-center justify-center gap-1.5">
                  <span>STOK FISIK</span>
                  <ArrowUpDown className="w-3 h-3 text-slate-400" />
                </div>
              </th>
              <th className="py-3 px-4 text-center">STATUS</th>
              <th className="py-3 px-4 text-right">AKSI</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 dark:divide-slate-800/80">
            {filteredProducts.map((p) => {
              const isOutOfStock = p.stock <= 0;
              const isLowStock = p.stock > 0 && p.stock <= p.minStock;
              const margin = p.sellPrice > 0 ? Math.round(((p.sellPrice - p.buyPrice) / p.sellPrice) * 100) : 0;

              return (
                <tr key={p.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/40 transition-colors">
                  <td className="py-3 px-4 font-mono">
                    <div className="font-semibold text-blue-600 dark:text-indigo-400">{p.sku}</div>
                    <div className="text-[10px] text-slate-500 flex items-center gap-1 mt-0.5">
                      <Barcode className="w-3 h-3" />
                      <span>{p.barcode}</span>
                    </div>
                  </td>

                  <td className="py-3 px-4">
                    <div className="font-semibold text-slate-900 dark:text-slate-100">{p.name}</div>
                    <div className="text-[10px] text-slate-500 dark:text-slate-400 mt-0.5 flex items-center gap-2">
                      <span>Satuan: <strong className="text-slate-700 dark:text-slate-300">{p.unit}</strong></span>
                      {p.location && <span>• Lokasi: {p.location}</span>}
                    </div>
                  </td>

                  <td className="py-3 px-4">
                    <span className="px-2 py-0.5 rounded text-[10px] font-semibold bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700">
                      {p.category}
                    </span>
                  </td>

                  <td className="py-3 px-4 text-right font-mono text-slate-400 dark:text-slate-500">
                    {p.buyPrice > 0 ? (
                      formatIDR(p.buyPrice)
                    ) : (
                      <span className="inline-block px-1.5 py-0.5 rounded bg-slate-100 dark:bg-slate-800/80 text-[10px] text-slate-400 dark:text-slate-500 font-sans italic">
                        - (Kosong)
                      </span>
                    )}
                  </td>

                  <td className="py-3 px-4 text-right">
                    <div className="font-bold text-slate-900 dark:text-slate-100 font-mono text-sm">{formatIDR(p.sellPrice)}</div>
                    <div className="text-[10px] text-blue-600 dark:text-indigo-400 font-medium">
                      {p.buyPrice > 0 ? `Margin: +${margin}%` : 'Harga Jual'}
                    </div>
                  </td>

                  <td className="py-3 px-4 text-center">
                    <span className="text-sm font-black font-mono text-slate-900 dark:text-slate-100">{p.stock}</span>
                    <span className="text-[10px] text-slate-500 ml-1">{p.unit}</span>
                  </td>

                  <td className="py-3 px-4 text-center">
                    {isOutOfStock ? (
                      <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-rose-100 dark:bg-rose-500/20 text-rose-700 dark:text-rose-300 border border-rose-200 dark:border-rose-500/30">
                        <AlertTriangle className="w-3 h-3" />
                        Habis (0)
                      </span>
                    ) : isLowStock ? (
                      <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-amber-100 dark:bg-amber-500/20 text-amber-700 dark:text-amber-300 border border-amber-200 dark:border-amber-500/30">
                        <AlertTriangle className="w-3 h-3" />
                        Min. Alert (≤{p.minStock})
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-semibold bg-emerald-100 dark:bg-emerald-500/15 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-500/30">
                        <ShieldCheck className="w-3 h-3" />
                        Aman
                      </span>
                    )}
                  </td>

                  <td className="py-3 px-4 text-right">
                    <div className="flex items-center justify-end gap-1.5">
                      <button
                        onClick={() => handleOpenEdit(p)}
                        className="p-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white transition-colors cursor-pointer"
                        title="Edit Produk"
                      >
                        <Edit3 className="w-3.5 h-3.5" />
                      </button>
                      {isAdmin && (
                        <button
                          onClick={() => {
                            if (confirm(`Yakin ingin menghapus produk "${p.name}"?`)) {
                              deleteProduct(p.id);
                            }
                          }}
                          className="p-1.5 rounded-lg bg-slate-100 hover:bg-rose-100 dark:bg-slate-800 dark:hover:bg-rose-950/60 text-slate-500 hover:text-rose-600 dark:hover:text-rose-400 transition-colors cursor-pointer"
                          title="Hapus Produk"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>

        {filteredProducts.length === 0 && (
          <div className="p-12 text-center text-slate-400">
            <Package className="w-10 h-10 mx-auto mb-2 opacity-30" />
            <p className="font-semibold text-slate-700 dark:text-slate-300 text-sm">Tidak ada produk yang memenuhi kriteria filter</p>
          </div>
        )}
      </div>

      {/* ADD / EDIT PRODUCT MODAL */}
      {showModal && (
        <div className="fixed inset-0 z-50 bg-black/60 dark:bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto animate-in fade-in duration-150">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 w-full max-w-xl rounded-2xl shadow-2xl overflow-hidden my-auto text-slate-800 dark:text-slate-100">
            
            <div className="px-5 py-3.5 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between bg-slate-50 dark:bg-slate-800/80">
              <h3 className="font-bold text-slate-900 dark:text-slate-100 text-sm flex items-center gap-2">
                <Package className="w-4 h-4 text-blue-600 dark:text-indigo-400" />
                <span>{editingProduct ? 'Edit Data Produk & SKU' : 'Tambah Produk Baru ke Katalog'}</span>
              </h3>
              <button 
                onClick={() => setShowModal(false)}
                className="text-slate-400 hover:text-slate-700 dark:hover:text-white cursor-pointer"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleSubmit} className="p-5 space-y-4">
              
              {/* Product Name */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Nama Barang / Produk *
                </label>
                <input
                  type="text"
                  required
                  placeholder="Contoh: CARTRIDGE SB HP 2590 47ML"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl text-xs text-slate-900 dark:text-slate-100 placeholder-slate-400 dark:placeholder-slate-500 focus:outline-none focus:border-blue-600 shadow-xs"
                />
              </div>

              {/* SKU & Barcode */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Kode SKU (Stock Keeping Unit) *
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.sku}
                    onChange={(e) => setFormData({ ...formData, sku: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl text-xs font-mono text-blue-600 dark:text-indigo-300 focus:outline-none focus:border-blue-600 shadow-xs"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Nomor Barcode / EAN-13
                  </label>
                  <input
                    type="text"
                    value={formData.barcode}
                    onChange={(e) => setFormData({ ...formData, barcode: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl text-xs font-mono text-slate-900 dark:text-slate-200 focus:outline-none focus:border-blue-600 shadow-xs"
                  />
                </div>
              </div>

              {/* Category & Unit */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Kategori Produk
                  </label>
                  <select
                    value={formData.category}
                    onChange={(e) => setFormData({ ...formData, category: e.target.value as ProductCategory })}
                    className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl text-xs text-slate-900 dark:text-slate-200 focus:outline-none focus:border-blue-600 shadow-xs"
                  >
                    {CATEGORIES.map(cat => (
                      <option key={cat} value={cat}>{cat}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Satuan Barang
                  </label>
                  <select
                    value={formData.unit}
                    onChange={(e) => setFormData({ ...formData, unit: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl text-xs text-slate-900 dark:text-slate-200 focus:outline-none focus:border-blue-600 shadow-xs"
                  >
                    {UNITS.map(u => (
                      <option key={u} value={u}>{u}</option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Prices: Buy & Sell */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Harga Beli / HPP (IDR) <span className="text-slate-400 font-normal">(Boleh Kosong)</span>
                  </label>
                  <input
                    type="number"
                    min="0"
                    placeholder="Kosong (0)"
                    value={formData.buyPrice || ''}
                    onChange={(e) => setFormData({ ...formData, buyPrice: Number(e.target.value) || 0 })}
                    className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl text-xs font-mono text-slate-900 dark:text-slate-200 focus:outline-none focus:border-blue-600 shadow-xs"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Harga Jual POS (IDR) *
                  </label>
                  <input
                    type="number"
                    min="0"
                    required
                    placeholder="Wajib diisi"
                    value={formData.sellPrice || ''}
                    onChange={(e) => setFormData({ ...formData, sellPrice: Number(e.target.value) || 0 })}
                    className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl text-xs font-mono text-emerald-600 dark:text-emerald-400 font-bold focus:outline-none focus:border-blue-600 shadow-xs"
                  />
                </div>
              </div>

              {/* Stock & Min Stock Alert */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    {editingProduct ? 'Stok Fisik Saat Ini' : 'Stok Awal'}
                  </label>
                  <input
                    type="number"
                    min="0"
                    value={formData.stock}
                    onChange={(e) => setFormData({ ...formData, stock: Number(e.target.value) })}
                    className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl text-xs font-mono text-slate-900 dark:text-white font-bold focus:outline-none focus:border-blue-600 shadow-xs"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Batas Minimum Alert
                  </label>
                  <input
                    type="number"
                    min="0"
                    value={formData.minStock}
                    onChange={(e) => setFormData({ ...formData, minStock: Number(e.target.value) })}
                    className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl text-xs font-mono text-amber-600 dark:text-amber-400 focus:outline-none focus:border-blue-600 shadow-xs"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Lokasi Rak / Gudang
                  </label>
                  <input
                    type="text"
                    placeholder="mis: Rak A1"
                    value={formData.location}
                    onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl text-xs text-slate-900 dark:text-slate-200 focus:outline-none focus:border-blue-600 shadow-xs"
                  />
                </div>
              </div>

              {/* Description */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Keterangan & Spesifikasi Teknis
                </label>
                <textarea
                  rows={2}
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  placeholder="Spesifikasi ukuran, nozzle, ketahanan tinta, atau kompatibilitas printer..."
                  className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl text-xs text-slate-900 dark:text-slate-200 placeholder-slate-400 dark:placeholder-slate-500 focus:outline-none focus:border-blue-600 shadow-xs"
                />
              </div>

              {/* Action Buttons */}
              <div className="pt-3 border-t border-slate-200 dark:border-slate-800 flex items-center justify-end gap-2.5">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 cursor-pointer"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-blue-600 hover:bg-blue-500 dark:bg-indigo-600 dark:hover:bg-indigo-500 text-white font-bold text-xs shadow-md shadow-blue-600/20 dark:shadow-indigo-600/30 flex items-center gap-2 transition-all cursor-pointer"
                >
                  <Check className="w-4 h-4" />
                  <span>{editingProduct ? 'Simpan Perubahan' : 'Tambahkan ke Katalog'}</span>
                </button>
              </div>

            </form>

          </div>
        </div>
      )}

    </div>
  );
};
