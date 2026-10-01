import React, { useState } from 'react';
import { 
  ArrowDownToLine, 
  Plus, 
  Check, 
  Building2, 
  FileText, 
  Calendar, 
  Search, 
  Package, 
  Truck,
  History,
  CheckCircle2
} from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { INITIAL_SUPPLIERS } from '../../data/seedData';
import { Product } from '../../types';

export const StockInView: React.FC = () => {
  const { products, recordStockIn, mutations, currentUser } = useApp();

  const [selectedProductId, setSelectedProductId] = useState<string>('');
  const [qty, setQty] = useState<number>(10);
  const [unitCost, setUnitCost] = useState<number>(0);
  const [referenceNo, setReferenceNo] = useState<string>(() => `PO-${new Date().getFullYear()}-${Math.floor(1000 + Math.random() * 9000)}`);
  const [supplierName, setSupplierName] = useState<string>(INITIAL_SUPPLIERS[0]?.name || '');
  const [notes, setNotes] = useState<string>('');
  const [searchProductQuery, setSearchProductQuery] = useState('');
  const [successNotice, setSuccessNotice] = useState<string | null>(null);

  const formatIDR = (val: number) => 'Rp ' + Math.round(val).toLocaleString('id-ID');

  const selectedProduct = products.find(p => p.id === selectedProductId);

  // When product changes, pre-fill current buy price
  const handleSelectProduct = (prod: Product) => {
    setSelectedProductId(prod.id);
    setUnitCost(prod.buyPrice);
  };

  const filteredSelectableProducts = products.filter(p => 
    !searchProductQuery ||
    p.name.toLowerCase().includes(searchProductQuery.toLowerCase()) ||
    p.sku.toLowerCase().includes(searchProductQuery.toLowerCase())
  );

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedProductId) {
      alert('Pilih produk yang masuk terlebih dahulu.');
      return;
    }
    if (qty <= 0) {
      alert('Jumlah masuk harus lebih besar dari 0.');
      return;
    }

    const success = recordStockIn({
      productId: selectedProductId,
      qty: Number(qty),
      unitCost: Number(unitCost),
      referenceNo,
      supplierName: supplierName || 'Supplier Umum',
      notes,
    });

    if (success) {
      setSuccessNotice(`Berhasil mencatat barang masuk: ${qty} ${selectedProduct?.unit} untuk ${selectedProduct?.name}`);
      setTimeout(() => setSuccessNotice(null), 5000);
      
      // Reset form
      setSelectedProductId('');
      setQty(10);
      setNotes('');
      setReferenceNo(`PO-${new Date().getFullYear()}-${Math.floor(1000 + Math.random() * 9000)}`);
    }
  };

  // Recent Stock In Mutations
  const inboundHistory = mutations.filter(m => m.type === 'IN');

  return (
    <div className="flex-1 flex flex-col lg:flex-row overflow-hidden bg-[#f3f4f6] dark:bg-[#18181b] h-[calc(100vh-57px)] transition-colors duration-200">
      
      {/* LEFT: INBOUND ENTRY FORM */}
      <div className="w-full lg:w-[480px] border-r border-slate-200 dark:border-slate-800 flex flex-col bg-white dark:bg-[#1f1f23] overflow-y-auto shrink-0 p-5 space-y-4 shadow-xs">
        
        <div className="border-b border-slate-200 dark:border-slate-800 pb-3">
          <div className="flex items-center gap-2 text-blue-600 dark:text-indigo-400">
            <ArrowDownToLine className="w-5 h-5" />
            <h3 className="font-bold text-base text-slate-900 dark:text-white tracking-tight">Pencatatan Barang Masuk (Inbound)</h3>
          </div>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
            Input penerimaan barang dari Supplier / Pembelian PO untuk menambah saldo stok secara otomatis.
          </p>
        </div>

        {successNotice && (
          <div className="p-3 bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-500/40 rounded-xl text-xs text-emerald-800 dark:text-emerald-300 flex items-center gap-2 animate-in fade-in duration-200">
            <CheckCircle2 className="w-4 h-4 text-emerald-600 dark:text-emerald-400 shrink-0" />
            <span>{successNotice}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          
          {/* Select Product with live search */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
              Pilih Produk *
            </label>
            
            <div className="space-y-2">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-400" />
                <input
                  type="text"
                  placeholder="Ketik untuk mencari produk..."
                  value={searchProductQuery}
                  onChange={(e) => setSearchProductQuery(e.target.value)}
                  className="w-full pl-8 pr-3 py-1.5 bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg text-xs text-slate-900 dark:text-slate-200 placeholder-slate-400 dark:placeholder-slate-500 focus:outline-none focus:border-blue-600 shadow-xs"
                />
              </div>

              <div className="max-h-36 overflow-y-auto rounded-xl border border-slate-200 dark:border-slate-700/80 bg-slate-50/50 dark:bg-slate-800/40 divide-y divide-slate-100 dark:divide-slate-800 p-1">
                {filteredSelectableProducts.slice(0, 8).map(prod => {
                  const isSelected = prod.id === selectedProductId;
                  return (
                    <button
                      key={prod.id}
                      type="button"
                      onClick={() => handleSelectProduct(prod)}
                      className={`w-full text-left p-2 rounded-lg text-xs transition-colors flex items-center justify-between cursor-pointer ${
                        isSelected 
                          ? 'bg-blue-600 dark:bg-indigo-600 text-white font-semibold' 
                          : 'text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-750 hover:text-slate-950 dark:hover:text-white'
                      }`}
                    >
                      <div className="truncate pr-2">
                        <p className="truncate">{prod.name}</p>
                        <span className={`text-[10px] ${isSelected ? 'text-blue-100 dark:text-indigo-200' : 'text-slate-500 dark:text-slate-400'}`}>
                          {prod.sku} • Stok Saat Ini: {prod.stock} {prod.unit}
                        </span>
                      </div>
                      <span className="text-[11px] font-mono shrink-0">
                        {prod.buyPrice > 0 ? formatIDR(prod.buyPrice) : `Jual: ${formatIDR(prod.sellPrice)}`}
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>

            {selectedProduct && (
              <div className="mt-2 p-2.5 rounded-xl bg-blue-50 dark:bg-indigo-950/20 border border-blue-200 dark:border-indigo-500/30 flex items-center justify-between text-xs">
                <div>
                  <span className="text-slate-500 dark:text-slate-400 text-[10px]">Produk Dipilih:</span>
                  <p className="font-semibold text-blue-700 dark:text-indigo-300">{selectedProduct.name}</p>
                </div>
                <div className="text-right">
                  <span className="text-slate-500 dark:text-slate-400 text-[10px]">Stok Terkini:</span>
                  <p className="font-bold text-slate-900 dark:text-white">{selectedProduct.stock} {selectedProduct.unit}</p>
                </div>
              </div>
            )}
          </div>

          {/* Qty & Unit Cost */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Jumlah Masuk ({selectedProduct?.unit || 'Unit'}) *
              </label>
              <input
                type="number"
                min="1"
                required
                value={qty}
                onChange={(e) => setQty(Math.max(1, parseInt(e.target.value) || 1))}
                className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl text-xs font-bold text-emerald-600 dark:text-emerald-400 focus:outline-none focus:border-blue-600 shadow-xs"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Harga Beli Satuan (HPP) <span className="text-slate-400 font-normal">(Opsional)</span>
              </label>
              <input
                type="number"
                min="0"
                placeholder="Kosong (0)"
                value={unitCost || ''}
                onChange={(e) => setUnitCost(Math.max(0, parseInt(e.target.value) || 0))}
                className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl text-xs font-mono text-slate-900 dark:text-slate-200 focus:outline-none focus:border-blue-600 shadow-xs"
              />
            </div>
          </div>

          {/* Reference PO & Supplier */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                No. PO / Surat Jalan *
              </label>
              <input
                type="text"
                required
                value={referenceNo}
                onChange={(e) => setReferenceNo(e.target.value)}
                className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl text-xs font-mono text-slate-900 dark:text-slate-200 focus:outline-none focus:border-blue-600 shadow-xs"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Supplier
              </label>
              <select
                value={supplierName}
                onChange={(e) => setSupplierName(e.target.value)}
                className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl text-xs text-slate-900 dark:text-slate-200 focus:outline-none focus:border-blue-600 shadow-xs"
              >
                {INITIAL_SUPPLIERS.map(s => (
                  <option key={s.id} value={s.name}>{s.name}</option>
                ))}
                <option value="Supplier Lainnya">Supplier Lainnya...</option>
              </select>
            </div>
          </div>

          {/* Notes */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
              Catatan Penerimaan / No. Batch
            </label>
            <textarea
              rows={2}
              placeholder="Contoh: Batch produksi September 2026, kondisi fisik baik."
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl text-xs text-slate-900 dark:text-slate-200 placeholder-slate-400 dark:placeholder-slate-500 focus:outline-none focus:border-blue-600 shadow-xs"
            />
          </div>

          {/* Estimated Total Calculation */}
          {selectedProduct && (
            <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700/60 flex items-center justify-between text-xs">
              <span className="text-slate-500 dark:text-slate-400">Total Nilai Pembelian:</span>
              <span className="font-bold text-emerald-600 dark:text-emerald-400 text-sm">
                {formatIDR(qty * unitCost)}
              </span>
            </div>
          )}

          <button
            type="submit"
            className="w-full py-2.5 rounded-xl bg-blue-600 hover:bg-blue-500 dark:bg-indigo-600 dark:hover:bg-indigo-500 text-white font-bold text-xs shadow-md shadow-blue-600/20 dark:shadow-indigo-600/30 flex items-center justify-center gap-2 transition-all cursor-pointer"
          >
            <Check className="w-4 h-4" />
            <span>Simpan Barang Masuk & Update Stok</span>
          </button>

        </form>

      </div>

      {/* RIGHT: INBOUND HISTORY AUDIT LIST */}
      <div className="flex-1 flex flex-col bg-[#f3f4f6] dark:bg-[#18181b] p-5 overflow-hidden transition-colors duration-200">
        
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <History className="w-5 h-5 text-blue-600 dark:text-indigo-400" />
            <h3 className="font-bold text-sm text-slate-900 dark:text-slate-100">Riwayat Mutasi Barang Masuk</h3>
            <span className="text-[11px] px-2 py-0.5 rounded-full bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700 shadow-xs">
              {inboundHistory.length} Transaksi
            </span>
          </div>
          <span className="text-xs text-slate-500 dark:text-slate-400">
            Pencatatan Audit Trail Otomatis
          </span>
        </div>

        <div className="flex-1 overflow-y-auto rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-850/60 shadow-xs">
          <table className="w-full text-left text-xs text-slate-700 dark:text-slate-300">
            <thead className="sticky top-0 bg-slate-100/90 dark:bg-slate-800 text-[11px] uppercase tracking-wider text-slate-600 dark:text-slate-400 font-semibold border-b border-slate-200 dark:border-slate-700 z-10">
              <tr>
                <th className="py-3 px-4">TANGGAL & JAM</th>
                <th className="py-3 px-4">REF / NO. PO</th>
                <th className="py-3 px-4">NAMA PRODUK / SKU</th>
                <th className="py-3 px-4 text-center">JUMLAH MASUK</th>
                <th className="py-3 px-4 text-center">STOK AKHIR</th>
                <th className="py-3 px-4">PETUGAS / NOTES</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800/80">
              {inboundHistory.map((m) => (
                <tr key={m.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/40 transition-colors">
                  <td className="py-3 px-4 font-mono text-slate-500 dark:text-slate-400">
                    {new Date(m.createdAt).toLocaleString('id-ID', {
                      dateStyle: 'short',
                      timeStyle: 'short'
                    })}
                  </td>
                  <td className="py-3 px-4 font-mono font-semibold text-blue-600 dark:text-indigo-400">
                    {m.referenceNumber}
                  </td>
                  <td className="py-3 px-4">
                    <p className="font-semibold text-slate-900 dark:text-slate-100">{m.productName}</p>
                    <span className="text-[10px] text-slate-500 font-mono">{m.sku}</span>
                  </td>
                  <td className="py-3 px-4 text-center">
                    <span className="px-2 py-0.5 rounded font-black font-mono text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-500/10 border border-emerald-200 dark:border-emerald-500/20">
                      +{m.qty}
                    </span>
                  </td>
                  <td className="py-3 px-4 text-center font-mono font-bold text-slate-900 dark:text-slate-200">
                    {m.currentStock}
                  </td>
                  <td className="py-3 px-4">
                    <p className="text-slate-700 dark:text-slate-300 text-[11px] line-clamp-1">{m.notes}</p>
                    <span className="text-[10px] text-slate-400 dark:text-slate-500">Oleh: {m.performedBy}</span>
                  </td>
                </tr>
              ))}

              {inboundHistory.length === 0 && (
                <tr>
                  <td colSpan={6} className="py-12 text-center text-slate-400">
                    Belum ada riwayat barang masuk tercatat.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

      </div>

    </div>
  );
};
