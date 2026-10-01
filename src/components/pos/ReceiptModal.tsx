import React, { useRef } from 'react';
import { Printer, CheckCircle, X, Download, Share2, Receipt } from 'lucide-react';
import { SaleTransaction } from '../../types';

interface ReceiptModalProps {
  transaction: SaleTransaction;
  onClose: () => void;
}

export const ReceiptModal: React.FC<ReceiptModalProps> = ({ transaction, onClose }) => {
  const receiptRef = useRef<HTMLDivElement>(null);

  const formatIDR = (val: number) => {
    return 'Rp ' + Math.round(val).toLocaleString('id-ID');
  };

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/60 dark:bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto animate-in fade-in duration-200">
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 w-full max-w-md rounded-2xl shadow-2xl overflow-hidden flex flex-col my-auto text-slate-800 dark:text-slate-100">
        
        {/* Top Header */}
        <div className="px-5 py-3.5 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between bg-slate-50 dark:bg-slate-800/80">
          <div className="flex items-center gap-2">
            <CheckCircle className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
            <h3 className="font-semibold text-slate-900 dark:text-slate-100 text-sm">Transaksi Berhasil & Struk Kasir</h3>
          </div>
          <button 
            onClick={onClose} 
            className="text-slate-400 hover:text-slate-700 dark:hover:text-white p-1 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-700/60 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Thermal Receipt Preview (Paper look) */}
        <div className="p-5 bg-slate-100 dark:bg-slate-950/60 overflow-y-auto max-h-[65vh] flex justify-center">
          <div 
            ref={receiptRef}
            className="w-full max-w-[340px] bg-white text-slate-900 font-mono text-[11px] p-5 shadow-xl rounded-sm receipt-paper"
            style={{ fontFamily: "'Courier New', Courier, monospace" }}
          >
            {/* Store Header */}
            <div className="text-center pb-3 border-b border-dashed border-slate-400">
              <h2 className="font-bold text-sm tracking-wider uppercase text-slate-950">PT MEDIA MULTINDO TEKNOLOGI</h2>
              <p className="text-[10px] text-slate-600">Industrial Coding & Packaging Solutions</p>
              <p className="text-[9px] text-slate-500">Kawasan Industri Cikarang - Jakarta</p>
              <p className="text-[9px] text-slate-500">Telp: (021) 558-9021 / WA: 0812-3456-7890</p>
            </div>

            {/* Metadata */}
            <div className="py-2.5 border-b border-dashed border-slate-400 space-y-0.5 text-[10px]">
              <div className="flex justify-between">
                <span>No. Faktur:</span>
                <span className="font-bold">{transaction.invoiceNumber}</span>
              </div>
              <div className="flex justify-between">
                <span>Tanggal:</span>
                <span>{new Date(transaction.createdAt).toLocaleString('id-ID')}</span>
              </div>
              <div className="flex justify-between">
                <span>Kasir:</span>
                <span>{transaction.cashierName}</span>
              </div>
              <div className="flex justify-between">
                <span>Pelanggan:</span>
                <span className="font-bold">
                  {transaction.customerName || 'Pelanggan Umum'}
                  {transaction.customerCompany ? ` (${transaction.customerCompany})` : ''}
                  {transaction.customerTier && transaction.customerTier !== 'STANDAR' ? ` [${transaction.customerTier}]` : ''}
                </span>
              </div>
            </div>

            {/* Item Table */}
            <div className="py-2.5 border-b border-dashed border-slate-400">
              <table className="w-full text-left">
                <thead>
                  <tr className="border-b border-slate-300 text-[9px] text-slate-700">
                    <th className="pb-1">ITEM</th>
                    <th className="pb-1 text-center">QTY</th>
                    <th className="pb-1 text-right">HARGA</th>
                    <th className="pb-1 text-right">TOTAL</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-dotted divide-slate-200">
                  {transaction.items.map((item, idx) => (
                    <tr key={idx} className="align-top">
                      <td className="py-1 pr-1">
                        <div className="font-semibold text-slate-950 leading-tight">{item.productName}</div>
                        <div className="text-[9px] text-slate-500">
                          {item.sku}
                          {item.priceTier && item.priceTier !== 'STANDAR' && ` [${item.priceTier}]`}
                          {item.customPriceApplied && ` (Custom)`}
                        </div>
                      </td>
                      <td className="py-1 text-center font-bold">{item.qty}</td>
                      <td className="py-1 text-right text-slate-600">{item.sellPrice.toLocaleString('id-ID')}</td>
                      <td className="py-1 text-right font-semibold text-slate-950">{item.subtotal.toLocaleString('id-ID')}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Total & Payment Details */}
            <div className="py-2.5 border-b border-dashed border-slate-400 space-y-1 text-[10px]">
              <div className="flex justify-between text-slate-600">
                <span>Subtotal ({transaction.items.reduce((a, b) => a + b.qty, 0)} item):</span>
                <span>{formatIDR(transaction.subtotal)}</span>
              </div>
              {transaction.discount > 0 && (
                <div className="flex justify-between text-emerald-700">
                  <span>Diskon Promo:</span>
                  <span>- {formatIDR(transaction.discount)}</span>
                </div>
              )}
              {transaction.tax > 0 && (
                <div className="flex justify-between text-slate-600">
                  <span>PPN (11%):</span>
                  <span>+ {formatIDR(transaction.tax)}</span>
                </div>
              )}
              <div className="flex justify-between text-xs font-bold text-slate-950 pt-1 border-t border-slate-300">
                <span>TOTAL AKHIR:</span>
                <span>{formatIDR(transaction.total)}</span>
              </div>
              <div className="flex justify-between text-slate-700 pt-0.5">
                <span>Metode Bayar:</span>
                <span className="font-semibold">{transaction.paymentMethod}</span>
              </div>
              <div className="flex justify-between text-slate-700">
                <span>Bayar:</span>
                <span>{formatIDR(transaction.amountPaid)}</span>
              </div>
              <div className="flex justify-between text-slate-950 font-bold">
                <span>Kembalian:</span>
                <span>{formatIDR(transaction.change)}</span>
              </div>
            </div>

            {/* Barcode & Footer Greeting */}
            <div className="pt-3 text-center space-y-2">
              <div className="flex justify-center">
                {/* SVG Mock barcode */}
                <div className="h-8 w-44 bg-slate-200 p-1 flex items-center justify-between">
                  <div className="w-1.5 h-full bg-black"></div>
                  <div className="w-0.5 h-full bg-black"></div>
                  <div className="w-2 h-full bg-black"></div>
                  <div className="w-1 h-full bg-black"></div>
                  <div className="w-3 h-full bg-black"></div>
                  <div className="w-0.5 h-full bg-black"></div>
                  <div className="w-1.5 h-full bg-black"></div>
                  <div className="w-2 h-full bg-black"></div>
                  <div className="w-0.5 h-full bg-black"></div>
                  <div className="w-2.5 h-full bg-black"></div>
                  <div className="w-1 h-full bg-black"></div>
                </div>
              </div>
              <p className="text-[9px] text-slate-500 font-mono tracking-widest">{transaction.invoiceNumber}</p>
              <p className="text-[10px] font-semibold text-slate-800">*** TERIMA KASIH ATAS KUNJUNGAN ANDA ***</p>
              <p className="text-[8px] text-slate-500 leading-tight">
                Barang yang sudah dibeli dapat ditukar maksimal 3 hari kerja dengan menyertakan struk ini.
              </p>
            </div>
          </div>
        </div>

        {/* Bottom Actions */}
        <div className="p-4 bg-slate-50 dark:bg-slate-800/90 border-t border-slate-200 dark:border-slate-700 flex items-center justify-between gap-3">
          <div className="text-xs text-slate-500 dark:text-slate-400">
            Kembalian: <strong className="text-emerald-600 dark:text-emerald-400 text-sm">{formatIDR(transaction.change)}</strong>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={handlePrint}
              className="flex items-center gap-2 px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-500 dark:bg-indigo-600 dark:hover:bg-indigo-500 text-white font-semibold text-xs shadow-md shadow-blue-600/20 dark:shadow-indigo-600/30 transition-all cursor-pointer"
            >
              <Printer className="w-4 h-4" />
              <span>Cetak Struk (Thermal)</span>
            </button>
            <button
              onClick={onClose}
              className="px-4 py-2 rounded-xl bg-slate-200 hover:bg-slate-300 dark:bg-slate-700 dark:hover:bg-slate-600 text-slate-700 dark:text-slate-200 text-xs font-semibold transition-colors cursor-pointer"
            >
              Selesai (ESC)
            </button>
          </div>
        </div>

      </div>
    </div>
  );
};
