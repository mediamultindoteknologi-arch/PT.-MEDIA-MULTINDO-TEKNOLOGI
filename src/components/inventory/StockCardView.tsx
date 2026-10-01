import React, { useState, useMemo } from 'react';
import { 
  FileText, 
  Search, 
  Filter, 
  Download, 
  Printer, 
  ArrowUpRight, 
  ArrowDownLeft, 
  Package, 
  Barcode, 
  Calendar,
  Layers,
  History,
  CheckCircle2,
  DollarSign
} from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { Product, StockMutation } from '../../types';

export const StockCardView: React.FC = () => {
  const { products, mutations } = useApp();

  const [selectedProductId, setSelectedProductId] = useState<string>('ALL');
  const [selectedType, setSelectedType] = useState<string>('ALL');
  const [searchTerm, setSearchTerm] = useState<string>('');

  const selectedProduct = products.find(p => p.id === selectedProductId);

  const formatIDR = (val: number) => 'Rp ' + Math.round(val).toLocaleString('id-ID');

  // Filtered mutations
  const filteredMutations = useMemo(() => {
    return mutations.filter(m => {
      const matchProduct = selectedProductId === 'ALL' || m.productId === selectedProductId;
      const matchType = selectedType === 'ALL' || m.type === selectedType;
      const matchSearch = !searchTerm ||
        m.productName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        m.sku.toLowerCase().includes(searchTerm.toLowerCase()) ||
        m.referenceNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
        m.performedBy.toLowerCase().includes(searchTerm.toLowerCase());
      
      return matchProduct && matchType && matchSearch;
    });
  }, [mutations, selectedProductId, selectedType, searchTerm]);

  // Specific Product KPIs
  const productStats = useMemo(() => {
    if (!selectedProduct) {
      const totalIn = mutations.filter(m => m.type === 'IN').reduce((acc, m) => acc + m.qty, 0);
      const totalOut = mutations.filter(m => m.type === 'OUT').reduce((acc, m) => acc + m.qty, 0);
      return { totalIn, totalOut, currentStock: products.reduce((acc, p) => acc + p.stock, 0) };
    }

    const prodMuts = mutations.filter(m => m.productId === selectedProduct.id);
    const totalIn = prodMuts.filter(m => m.type === 'IN').reduce((acc, m) => acc + m.qty, 0);
    const totalOut = prodMuts.filter(m => m.type === 'OUT').reduce((acc, m) => acc + m.qty, 0);
    return {
      totalIn,
      totalOut,
      currentStock: selectedProduct.stock,
    };
  }, [selectedProduct, mutations, products]);

  const handlePrint = () => {
    window.print();
  };

  const handleExportCSV = () => {
    const headers = ['TANGGAL,NO_REFERENSI,SKU,NAMA_BARANG,TIPE,KATEGORI_MUTASI,STOK_AWAL,MASUK,KELUAR,STOK_AKHIR,PETUGAS,KETERANGAN'];
    const rows = filteredMutations.map(m => 
      `"${m.createdAt}","${m.referenceNumber}","${m.sku}","${m.productName.replace(/"/g, '""')}","${m.type}","${m.referenceType}",${m.previousStock},${m.type === 'IN' ? m.qty : 0},${m.type === 'OUT' ? m.qty : 0},${m.currentStock},"${m.performedBy}","${m.notes.replace(/"/g, '""')}"`
    );
    const csvContent = 'data:text/csv;charset=utf-8,' + [headers, ...rows].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `Kartu_Stok_Ledger_${selectedProduct ? selectedProduct.sku : 'Semua'}_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="h-[calc(100vh-57px)] max-h-[calc(100vh-57px)] flex-1 flex flex-col overflow-hidden bg-[#f3f4f6] dark:bg-[#18181b] p-4 lg:p-6 space-y-3.5 transition-colors duration-200">
      
      {/* Top Header */}
      <div className="shrink-0 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-slate-900 dark:text-white tracking-tight flex items-center gap-2">
            <FileText className="w-6 h-6 text-blue-600 dark:text-indigo-400" />
            <span>Kartu Stok (Audit Trail Mutasi Barang)</span>
          </h2>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
            Buku besar mutasi perpetual real-time: lacak saldo awal, keluar, masuk, dan saldo akhir tiap transaksi secara akuntabel.
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <button
            onClick={handleExportCSV}
            className="flex items-center gap-2 px-3.5 py-2 rounded-xl bg-white dark:bg-slate-800 hover:bg-slate-100 dark:hover:bg-slate-750 text-slate-700 dark:text-slate-300 border border-slate-300 dark:border-slate-700 text-xs font-semibold shadow-xs transition-all cursor-pointer"
          >
            <Download className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
            <span>Ekspor Mutasi</span>
          </button>
          <button
            onClick={handlePrint}
            className="flex items-center gap-2 px-3.5 py-2 rounded-xl bg-blue-600 hover:bg-blue-500 dark:bg-indigo-600 dark:hover:bg-indigo-500 text-white text-xs font-bold shadow-md shadow-blue-600/20 dark:shadow-indigo-600/30 transition-all cursor-pointer"
          >
            <Printer className="w-4 h-4" />
            <span>Cetak Kartu Stok</span>
          </button>
        </div>
      </div>

      {/* Product Selector Banner & Specific Item Ledger Card */}
      <div className="shrink-0 p-4 rounded-2xl bg-white dark:bg-gradient-to-r dark:from-slate-850 dark:to-slate-800 border border-slate-200 dark:border-slate-700/80 shadow-xs">
        <div className="flex flex-col lg:flex-row items-stretch lg:items-center justify-between gap-4">
          
          {/* Dropdown Selector */}
          <div className="flex-1 max-w-xl">
            <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-1.5">
              Pilih Produk untuk Melihat Kartu Stok Spesifik:
            </label>
            <select
              value={selectedProductId}
              onChange={(e) => setSelectedProductId(e.target.value)}
              className="w-full px-3.5 py-2 bg-slate-50 dark:bg-slate-900 border border-slate-300 dark:border-indigo-500/40 rounded-xl text-xs sm:text-sm text-slate-900 dark:text-slate-100 font-medium focus:outline-none focus:ring-2 focus:ring-blue-500/20 dark:focus:ring-indigo-500/30 shadow-xs"
            >
              <option value="ALL">-- SEMUA BARANG (Tampilkan Seluruh Mutasi Global) --</option>
              {products.map(p => (
                <option key={p.id} value={p.id}>
                  [{p.sku}] {p.name} (Stok: {p.stock} {p.unit})
                </option>
              ))}
            </select>
          </div>

          {/* KPI Summary for this View */}
          <div className="flex items-center gap-3 shrink-0">
            <div className="px-4 py-2 rounded-xl bg-slate-50 dark:bg-slate-900/80 border border-slate-200 dark:border-slate-700/60 text-center shadow-xs">
              <span className="text-[10px] text-slate-500 dark:text-slate-400 block font-medium">Total Masuk (IN)</span>
              <span className="text-base font-black text-emerald-600 dark:text-emerald-400">+{productStats.totalIn.toLocaleString('id-ID')}</span>
            </div>
            <div className="px-4 py-2 rounded-xl bg-slate-50 dark:bg-slate-900/80 border border-slate-200 dark:border-slate-700/60 text-center shadow-xs">
              <span className="text-[10px] text-slate-500 dark:text-slate-400 block font-medium">Total Keluar (OUT)</span>
              <span className="text-base font-black text-rose-600 dark:text-rose-400">-{productStats.totalOut.toLocaleString('id-ID')}</span>
            </div>
            <div className="px-4 py-2 rounded-xl bg-blue-50 dark:bg-indigo-950/40 border border-blue-200 dark:border-indigo-500/30 text-center shadow-xs">
              <span className="text-[10px] text-blue-700 dark:text-indigo-300 block font-medium">Saldo Akhir Fisik</span>
              <span className="text-lg font-black text-slate-900 dark:text-white">{productStats.currentStock.toLocaleString('id-ID')} {selectedProduct?.unit || 'Unit'}</span>
            </div>
          </div>

        </div>

        {/* If a single product is selected, display quick metadata */}
        {selectedProduct && (
          <div className="mt-3 pt-3 border-t border-slate-100 dark:border-slate-700/60 flex flex-wrap items-center gap-4 text-xs text-slate-700 dark:text-slate-300">
            <div>
              <span className="text-slate-500">Barcode:</span> <span className="font-mono font-bold text-slate-900 dark:text-slate-200">{selectedProduct.barcode}</span>
            </div>
            <div>
              <span className="text-slate-500">Kategori:</span> <span className="font-semibold text-blue-600 dark:text-indigo-300">{selectedProduct.category}</span>
            </div>
            <div>
              <span className="text-slate-500">HPP Beli:</span>{' '}
              <span className="font-mono text-slate-700 dark:text-slate-300">
                {selectedProduct.buyPrice > 0 ? formatIDR(selectedProduct.buyPrice) : <em className="text-slate-400 not-italic">(Kosong)</em>}
              </span>
            </div>
            <div>
              <span className="text-slate-500">Harga Jual:</span> <span className="font-mono font-bold text-emerald-600 dark:text-emerald-400">{formatIDR(selectedProduct.sellPrice)}</span>
            </div>
            <div>
              <span className="text-slate-500">Min. Alert:</span> <span className="font-bold text-amber-600 dark:text-amber-400">{selectedProduct.minStock} {selectedProduct.unit}</span>
            </div>
          </div>
        )}
      </div>

      {/* Filter and Search Bar */}
      <div className="shrink-0 flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 bg-white dark:bg-slate-800/40 p-2.5 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs">
        
        <div className="flex items-center gap-2">
          <span className="text-xs text-slate-500 dark:text-slate-400">Filter Tipe:</span>
          <div className="flex items-center gap-1 bg-slate-100 dark:bg-slate-800 p-0.5 rounded-lg border border-slate-200 dark:border-slate-700 text-xs">
            {[
              { id: 'ALL', label: 'Semua Mutasi' },
              { id: 'IN', label: 'Barang Masuk (+)' },
              { id: 'OUT', label: 'Barang Keluar (-)' },
            ].map(t => (
              <button
                key={t.id}
                onClick={() => setSelectedType(t.id)}
                className={`px-3 py-1 rounded-md text-[11px] font-medium transition-all ${
                  selectedType === t.id
                    ? 'bg-blue-600 dark:bg-indigo-600 text-white shadow-xs'
                    : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'
                }`}
              >
                {t.label}
              </button>
            ))}
          </div>
        </div>

        <div className="relative sm:w-72">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <input
            type="text"
            placeholder="Cari No. Faktur, SKU, Petugas..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-9 pr-3 py-1.5 bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg text-xs text-slate-900 dark:text-slate-200 placeholder-slate-400 dark:placeholder-slate-500 focus:outline-none focus:border-blue-600 shadow-xs"
          />
        </div>

      </div>

      {/* AUDIT TRAIL LEDGER TABLE (Only table rows scroll) */}
      <div className="flex-1 min-h-0 overflow-y-auto rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900/60 shadow-xs">
        <table className="w-full text-left text-xs text-slate-700 dark:text-slate-300">
          <thead className="sticky top-0 bg-slate-100/95 dark:bg-slate-800/95 backdrop-blur-sm text-[11px] uppercase tracking-wider text-slate-600 dark:text-slate-400 font-semibold border-b border-slate-200 dark:border-slate-700 z-10 shadow-xs">
            <tr>
              <th className="py-3 px-4">TANGGAL & WAKTU</th>
              <th className="py-3 px-4">NO. REFERENSI</th>
              <th className="py-3 px-4">NAMA PRODUK & SKU</th>
              <th className="py-3 px-4">JENIS MUTASI</th>
              <th className="py-3 px-4 text-center">STOK AWAL</th>
              <th className="py-3 px-4 text-center">MASUK (+)</th>
              <th className="py-3 px-4 text-center">KELUAR (-)</th>
              <th className="py-3 px-4 text-center">STOK AKHIR</th>
              <th className="py-3 px-4">PETUGAS / NOTES</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 dark:divide-slate-800/80">
            {filteredMutations.map((m) => {
              const isIn = m.type === 'IN';
              return (
                <tr key={m.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/40 transition-colors">
                  <td className="py-3 px-4 font-mono text-slate-500 dark:text-slate-400 whitespace-nowrap">
                    {new Date(m.createdAt).toLocaleString('id-ID', {
                      dateStyle: 'short',
                      timeStyle: 'medium'
                    })}
                  </td>

                  <td className="py-3 px-4 font-mono font-bold text-blue-600 dark:text-indigo-400">
                    {m.referenceNumber}
                  </td>

                  <td className="py-3 px-4">
                    <p className="font-semibold text-slate-900 dark:text-slate-100">{m.productName}</p>
                    <span className="text-[10px] text-slate-500 font-mono">{m.sku}</span>
                  </td>

                  <td className="py-3 px-4">
                    <span className={`px-2 py-0.5 rounded text-[10px] font-bold border ${
                      m.referenceType === 'SALE' 
                        ? 'bg-blue-50 dark:bg-blue-500/15 text-blue-700 dark:text-blue-300 border-blue-200 dark:border-blue-500/30'
                        : m.referenceType === 'PURCHASE'
                        ? 'bg-emerald-50 dark:bg-emerald-500/15 text-emerald-700 dark:text-emerald-300 border-emerald-200 dark:border-emerald-500/30'
                        : m.referenceType === 'OPERATIONAL'
                        ? 'bg-purple-50 dark:bg-purple-500/15 text-purple-700 dark:text-purple-300 border-purple-200 dark:border-purple-500/30'
                        : m.referenceType === 'DAMAGED'
                        ? 'bg-rose-50 dark:bg-rose-500/15 text-rose-700 dark:text-rose-300 border-rose-200 dark:border-rose-500/30'
                        : 'bg-slate-100 dark:bg-slate-700/60 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-600'
                    }`}>
                      {m.referenceType}
                    </span>
                  </td>

                  <td className="py-3 px-4 text-center font-mono text-slate-500 dark:text-slate-400">
                    {m.previousStock}
                  </td>

                  <td className="py-3 px-4 text-center font-mono">
                    {isIn ? (
                      <span className="font-bold text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-500/10 px-2 py-0.5 rounded border border-emerald-200 dark:border-emerald-500/20">
                        +{m.qty}
                      </span>
                    ) : (
                      <span className="text-slate-400 dark:text-slate-600">-</span>
                    )}
                  </td>

                  <td className="py-3 px-4 text-center font-mono">
                    {!isIn ? (
                      <span className="font-bold text-rose-600 dark:text-rose-400 bg-rose-50 dark:bg-rose-500/10 px-2 py-0.5 rounded border border-rose-200 dark:border-rose-500/20">
                        -{m.qty}
                      </span>
                    ) : (
                      <span className="text-slate-400 dark:text-slate-600">-</span>
                    )}
                  </td>

                  <td className="py-3 px-4 text-center font-mono font-black text-slate-900 dark:text-slate-100">
                    {m.currentStock}
                  </td>

                  <td className="py-3 px-4">
                    <p className="text-slate-700 dark:text-slate-300 text-[11px] line-clamp-1">{m.notes}</p>
                    <span className="text-[10px] text-slate-400 dark:text-slate-500">PIC: {m.performedBy}</span>
                  </td>
                </tr>
              );
            })}

            {filteredMutations.length === 0 && (
              <tr>
                <td colSpan={9} className="py-12 text-center text-slate-400">
                  <History className="w-8 h-8 mx-auto mb-2 opacity-30" />
                  <p className="font-semibold text-slate-700 dark:text-slate-300 text-sm">Tidak ada catatan kartu stok yang cocok.</p>
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

    </div>
  );
};
