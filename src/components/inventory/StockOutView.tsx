import React, { useState } from 'react';
import { 
  ArrowUpFromLine, 
  Check, 
  AlertTriangle, 
  Search, 
  History, 
  CheckCircle2, 
  Wrench, 
  PackageX, 
  HelpCircle,
  FileSpreadsheet
} from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { Product } from '../../types';

export const StockOutView: React.FC = () => {
  const { products, recordStockOut, mutations, currentUser } = useApp();

  const [selectedProductId, setSelectedProductId] = useState<string>('');
  const [qty, setQty] = useState<number>(1);
  const [reason, setReason] = useState<'OPERATIONAL' | 'DAMAGED' | 'LOST' | 'EXPIRED' | 'OTHER'>('OPERATIONAL');
  const [referenceNo, setReferenceNo] = useState<string>(() => `OPR-${new Date().getFullYear()}-${Math.floor(100 + Math.random() * 900)}`);
  const [notes, setNotes] = useState<string>('');
  const [searchProductQuery, setSearchProductQuery] = useState('');
  const [feedback, setFeedback] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  const selectedProduct = products.find(p => p.id === selectedProductId);

  const filteredSelectableProducts = products.filter(p => 
    !searchProductQuery ||
    p.name.toLowerCase().includes(searchProductQuery.toLowerCase()) ||
    p.sku.toLowerCase().includes(searchProductQuery.toLowerCase())
  );

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedProductId) {
      setFeedback({ type: 'error', message: 'Silakan pilih produk yang dikeluarkan.' });
      return;
    }
    if (qty <= 0) {
      setFeedback({ type: 'error', message: 'Jumlah barang keluar harus lebih dari 0.' });
      return;
    }

    const res = recordStockOut({
      productId: selectedProductId,
      qty: Number(qty),
      reason,
      referenceNo,
      notes,
    });

    if (res.success) {
      setFeedback({
        type: 'success',
        message: `Pengeluaran ${qty} ${selectedProduct?.unit} (${reason}) untuk ${selectedProduct?.name} berhasil dicatat.`
      });
      setTimeout(() => setFeedback(null), 5000);

      // Reset Form
      setSelectedProductId('');
      setQty(1);
      setNotes('');
      setReferenceNo(`OPR-${new Date().getFullYear()}-${Math.floor(100 + Math.random() * 900)}`);
    } else {
      setFeedback({ type: 'error', message: res.error || 'Gagal memproses pengeluaran barang.' });
    }
  };

  // Recent Outbound Non-sale history
  const outboundHistory = mutations.filter(m => m.type === 'OUT' && m.referenceType !== 'SALE');

  return (
    <div className="flex-1 flex flex-col lg:flex-row overflow-hidden bg-[#f3f4f6] dark:bg-[#18181b] h-[calc(100vh-57px)] transition-colors duration-200">
      
      {/* LEFT: OUTBOUND FORM */}
      <div className="w-full lg:w-[480px] border-r border-slate-200 dark:border-slate-800 flex flex-col bg-white dark:bg-[#1f1f23] overflow-y-auto shrink-0 p-5 space-y-4 shadow-xs">
        
        <div className="border-b border-slate-200 dark:border-slate-800 pb-3">
          <div className="flex items-center gap-2 text-rose-600 dark:text-rose-400">
            <ArrowUpFromLine className="w-5 h-5" />
            <h3 className="font-bold text-base text-slate-900 dark:text-white tracking-tight">Barang Keluar Non-Penjualan (Outbound)</h3>
          </div>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
            Catat pemakaian internal, sampel demo teknisi, barang rusak/cacat pabrik, atau selisih stok opname.
          </p>
        </div>

        {feedback && (
          <div className={`p-3 rounded-xl text-xs flex items-center gap-2 animate-in fade-in duration-200 ${
            feedback.type === 'success' 
              ? 'bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-500/40 text-emerald-800 dark:text-emerald-300' 
              : 'bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-500/40 text-rose-800 dark:text-rose-300'
          }`}>
            {feedback.type === 'success' ? (
              <CheckCircle2 className="w-4 h-4 text-emerald-600 dark:text-emerald-400 shrink-0" />
            ) : (
              <AlertTriangle className="w-4 h-4 text-rose-600 dark:text-rose-400 shrink-0" />
            )}
            <span>{feedback.message}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          
          {/* Select Product */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
              Pilih Produk yang Dikeluarkan *
            </label>

            <div className="space-y-2">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-400" />
                <input
                  type="text"
                  placeholder="Ketik nama atau SKU produk..."
                  value={searchProductQuery}
                  onChange={(e) => setSearchProductQuery(e.target.value)}
                  className="w-full pl-8 pr-3 py-1.5 bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg text-xs text-slate-900 dark:text-slate-200 placeholder-slate-400 dark:placeholder-slate-500 focus:outline-none focus:border-rose-500 shadow-xs"
                />
              </div>

              <div className="max-h-36 overflow-y-auto rounded-xl border border-slate-200 dark:border-slate-700/80 bg-slate-50/50 dark:bg-slate-800/40 divide-y divide-slate-100 dark:divide-slate-800 p-1">
                {filteredSelectableProducts.slice(0, 8).map(prod => {
                  const isSelected = prod.id === selectedProductId;
                  const isAvailable = prod.stock > 0;
                  return (
                    <button
                      key={prod.id}
                      type="button"
                      disabled={!isAvailable}
                      onClick={() => setSelectedProductId(prod.id)}
                      className={`w-full text-left p-2 rounded-lg text-xs transition-colors flex items-center justify-between cursor-pointer ${
                        !isAvailable
                          ? 'opacity-40 cursor-not-allowed text-slate-400 dark:text-slate-500'
                          : isSelected 
                          ? 'bg-rose-600 text-white font-semibold' 
                          : 'text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-750 hover:text-slate-950 dark:hover:text-white'
                      }`}
                    >
                      <div className="truncate pr-2">
                        <p className="truncate">{prod.name}</p>
                        <span className={`text-[10px] ${isSelected ? 'text-rose-100' : 'text-slate-500 dark:text-slate-400'}`}>
                          {prod.sku} • {prod.category}
                        </span>
                      </div>
                      <span className="text-[11px] font-mono font-bold shrink-0">
                        {prod.stock} {prod.unit}
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>

            {selectedProduct && (
              <div className="mt-2 p-2.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 flex items-center justify-between text-xs">
                <div>
                  <span className="text-slate-500 dark:text-slate-400 text-[10px]">Item Terpilih:</span>
                  <p className="font-semibold text-slate-800 dark:text-slate-200">{selectedProduct.name}</p>
                </div>
                <div className="text-right">
                  <span className="text-slate-500 dark:text-slate-400 text-[10px]">Stok Tersedia:</span>
                  <p className="font-bold text-emerald-600 dark:text-emerald-400">{selectedProduct.stock} {selectedProduct.unit}</p>
                </div>
              </div>
            )}
          </div>

          {/* Reason & Qty */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Alasan Pengeluaran *
              </label>
              <select
                value={reason}
                onChange={(e) => setReason(e.target.value as any)}
                className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl text-xs text-slate-900 dark:text-slate-200 focus:outline-none focus:border-rose-500 shadow-xs"
              >
                <option value="OPERATIONAL">Operasional / Demo Teknisi</option>
                <option value="DAMAGED">Barang Rusak / Cacat (Damaged)</option>
                <option value="LOST">Selisih / Hilang (Lost)</option>
                <option value="EXPIRED">Kedaluwarsa (Expired)</option>
                <option value="OTHER">Lainnya...</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Jumlah Dikeluarkan *
              </label>
              <input
                type="number"
                min="1"
                max={selectedProduct ? selectedProduct.stock : 99999}
                required
                value={qty}
                onChange={(e) => setQty(Math.max(1, parseInt(e.target.value) || 1))}
                className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl text-xs font-bold text-rose-600 dark:text-rose-400 focus:outline-none focus:border-rose-500 shadow-xs"
              />
            </div>
          </div>

          {/* Reference Document */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
              No. Berita Acara / Memo Internal *
            </label>
            <input
              type="text"
              required
              value={referenceNo}
              onChange={(e) => setReferenceNo(e.target.value)}
              className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl text-xs font-mono text-slate-900 dark:text-slate-200 focus:outline-none focus:border-rose-500 shadow-xs"
            />
          </div>

          {/* Notes */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
              Keterangan Rinci (Kondisi / Petugas PIC)
            </label>
            <textarea
              rows={3}
              placeholder="Contoh: Digunakan untuk uji coba line konveyor pabrik PT Indofood atau cartridge bocor saat unboxing."
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl text-xs text-slate-900 dark:text-slate-200 placeholder-slate-400 dark:placeholder-slate-500 focus:outline-none focus:border-rose-500 shadow-xs"
            />
          </div>

          <button
            type="submit"
            className="w-full py-2.5 rounded-xl bg-rose-600 hover:bg-rose-500 text-white font-bold text-xs shadow-md shadow-rose-600/20 flex items-center justify-center gap-2 transition-all cursor-pointer"
          >
            <Check className="w-4 h-4" />
            <span>Keluarkan Barang & Kurangi Stok</span>
          </button>

        </form>

      </div>

      {/* RIGHT: OUTBOUND AUDIT HISTORY */}
      <div className="flex-1 flex flex-col bg-[#f3f4f6] dark:bg-[#18181b] p-5 overflow-hidden transition-colors duration-200">
        
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <History className="w-5 h-5 text-rose-600 dark:text-rose-400" />
            <h3 className="font-bold text-sm text-slate-900 dark:text-slate-100">Riwayat Pengeluaran Non-Penjualan</h3>
            <span className="text-[11px] px-2 py-0.5 rounded-full bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700 shadow-xs">
              {outboundHistory.length} Transaksi
            </span>
          </div>
          <span className="text-xs text-slate-500 dark:text-slate-400">
            Audit Pelacakan Barang Rusak & Pemakaian
          </span>
        </div>

        <div className="flex-1 overflow-y-auto rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-850/60 shadow-xs">
          <table className="w-full text-left text-xs text-slate-700 dark:text-slate-300">
            <thead className="sticky top-0 bg-slate-100/90 dark:bg-slate-800 text-[11px] uppercase tracking-wider text-slate-600 dark:text-slate-400 font-semibold border-b border-slate-200 dark:border-slate-700 z-10">
              <tr>
                <th className="py-3 px-4">TANGGAL</th>
                <th className="py-3 px-4">NO. DOKUMEN</th>
                <th className="py-3 px-4">PRODUK</th>
                <th className="py-3 px-4">ALASAN</th>
                <th className="py-3 px-4 text-center">QTY KELUAR</th>
                <th className="py-3 px-4 text-center">SISA STOK</th>
                <th className="py-3 px-4">KETERANGAN</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800/80">
              {outboundHistory.map((m) => (
                <tr key={m.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/40 transition-colors">
                  <td className="py-3 px-4 font-mono text-slate-500 dark:text-slate-400">
                    {new Date(m.createdAt).toLocaleString('id-ID', {
                      dateStyle: 'short',
                      timeStyle: 'short'
                    })}
                  </td>
                  <td className="py-3 px-4 font-mono font-semibold text-rose-600 dark:text-rose-400">
                    {m.referenceNumber}
                  </td>
                  <td className="py-3 px-4">
                    <p className="font-semibold text-slate-900 dark:text-slate-100">{m.productName}</p>
                    <span className="text-[10px] text-slate-500 font-mono">{m.sku}</span>
                  </td>
                  <td className="py-3 px-4">
                    <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-rose-100 dark:bg-rose-500/20 text-rose-700 dark:text-rose-300 border border-rose-200 dark:border-rose-500/30">
                      {m.referenceType}
                    </span>
                  </td>
                  <td className="py-3 px-4 text-center">
                    <span className="px-2 py-0.5 rounded font-black font-mono text-rose-600 dark:text-rose-400 bg-rose-50 dark:bg-rose-500/10 border border-rose-200 dark:border-rose-500/20">
                      -{m.qty}
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

              {outboundHistory.length === 0 && (
                <tr>
                  <td colSpan={7} className="py-12 text-center text-slate-400">
                    Belum ada riwayat pengeluaran barang non-penjualan.
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
