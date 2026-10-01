import React from 'react';
import { 
  BarChart3, 
  TrendingUp, 
  DollarSign, 
  Package, 
  AlertTriangle, 
  ShoppingCart, 
  ArrowUpRight, 
  ArrowDownRight, 
  Layers,
  Sparkles,
  PieChart,
  Calendar
} from 'lucide-react';
import { useApp } from '../../context/AppContext';

export const DashboardAnalyticsView: React.FC = () => {
  const { products, sales, mutations, getLowStockProducts, getOutOfStockProducts } = useApp();

  const formatIDR = (val: number) => 'Rp ' + Math.round(val).toLocaleString('id-ID');

  // Core Financial Stats
  const totalOmzet = sales.reduce((acc, s) => acc + s.total, 0);
  const totalGrossProfit = sales.reduce((acc, s) => {
    const saleProfit = s.items.reduce((sum, item) => sum + item.profit, 0);
    return acc + saleProfit;
  }, 0);

  const totalAssetValue = products.reduce((acc, p) => acc + ((p.sellPrice || p.buyPrice || 0) * p.stock), 0);
  const totalSalesCount = sales.length;

  const lowStock = getLowStockProducts();
  const outOfStock = getOutOfStockProducts();

  // Monthly trends from 2026 raw data
  const monthlyTrends2026 = [
    { month: 'Jan', inQty: 10438, outQty: 15065 },
    { month: 'Feb', inQty: 10588, outQty: 8433 },
    { month: 'Mar', inQty: 8874, outQty: 9387 },
    { month: 'Apr', inQty: 13538, outQty: 13580 },
    { month: 'Mei', inQty: 12431, outQty: 9140 },
    { month: 'Jun', inQty: 14170, outQty: 14227 },
    { month: 'Jul', inQty: 16180, outQty: 15302 },
    { month: 'Ags', inQty: 7477, outQty: 10188 },
    { month: 'Sep', inQty: 11096, outQty: 12586 },
  ];

  // Top Fast Moving Items (based on highest sales & outgoing volume in 2026)
  const topFastMoving = [
    { name: 'HOT FOIL LC1 POLOS 30 X 100', category: 'RIBBON', outTotal: '35.400+ Roll', currentStock: 214, velocity: 'Ultra High' },
    { name: 'HOT FOIL LC1 BINTANG 25 X 100', category: 'RIBBON', outTotal: '27.800+ Roll', currentStock: 270, velocity: 'Ultra High' },
    { name: 'KERTAS KASIR NCR PM 75 X 60 F 2 PLY', category: 'KERTAS KASIR', outTotal: '23.400+ Roll', currentStock: 220, velocity: 'High' },
    { name: 'KERTAS KASIR HVS 75 X 63', category: 'KERTAS KASIR', outTotal: '11.800+ Roll', currentStock: 922, velocity: 'High' },
    { name: 'HOT FOIL LC1 BINTANG 30 X 100', category: 'RIBBON', outTotal: '3.600+ Roll', currentStock: 671, velocity: 'High' },
    { name: 'CARTRIDGE SB HP 2590 47ML', category: 'CARTRIDGE', outTotal: '118+ Pcs', currentStock: 62, velocity: 'Medium' },
    { name: 'CARTRIDGE SB GENERAL PP39N 42ML', category: 'CARTRIDGE', outTotal: '100+ Pcs', currentStock: 51, velocity: 'Medium' },
  ];

  // Category asset distribution
  const categoryDistribution = React.useMemo(() => {
    const map: Record<string, { count: number; totalVal: number }> = {};
    products.forEach(p => {
      if (!map[p.category]) map[p.category] = { count: 0, totalVal: 0 };
      map[p.category].count += 1;
      map[p.category].totalVal += (p.sellPrice || p.buyPrice || 0) * p.stock;
    });
    return Object.entries(map).sort((a, b) => b[1].totalVal - a[1].totalVal);
  }, [products]);

  const maxCategoryVal = Math.max(...categoryDistribution.map(c => c[1].totalVal), 1);
  const maxMonthlyVal = Math.max(...monthlyTrends2026.map(m => Math.max(m.inQty, m.outQty)));

  return (
    <div className="h-[calc(100vh-57px)] max-h-[calc(100vh-57px)] flex-1 flex flex-col overflow-y-auto bg-[#f3f4f6] dark:bg-[#18181b] p-4 lg:p-6 space-y-5 transition-colors duration-200">
      
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h2 className="text-xl font-bold text-slate-900 dark:text-white tracking-tight flex items-center gap-2">
            <BarChart3 className="w-6 h-6 text-blue-600 dark:text-indigo-400" />
            <span>Dashboard & Analitik Finansial Pergudangan</span>
          </h2>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
            Analisis omzet penjualan POS, estimasi laba kotor, perputaran stok, dan tren pergudangan 2026.
          </p>
        </div>

        <div className="flex items-center gap-2 text-xs text-slate-700 dark:text-slate-300 bg-white dark:bg-slate-800/80 px-3.5 py-1.5 rounded-xl border border-slate-200 dark:border-slate-700 shadow-xs">
          <Calendar className="w-4 h-4 text-blue-600 dark:text-indigo-400" />
          <span>Periode Audit: <strong>Januari - September 2026</strong></span>
        </div>
      </div>

      {/* KPI Cards Row (Windows Fluent Style) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        
        {/* Omzet Penjualan */}
        <div className="p-4 rounded-2xl bg-white dark:bg-gradient-to-br dark:from-indigo-950/40 dark:to-slate-850 border border-slate-200 dark:border-indigo-500/30 relative overflow-hidden shadow-xs">
          <div className="flex justify-between items-start">
            <span className="text-xs text-blue-700 dark:text-indigo-300 font-semibold">Total Omzet Penjualan (POS)</span>
            <div className="w-8 h-8 rounded-xl bg-blue-50 dark:bg-indigo-500/20 flex items-center justify-center text-blue-600 dark:text-indigo-400">
              <DollarSign className="w-4 h-4" />
            </div>
          </div>
          <p className="text-2xl font-black text-slate-900 dark:text-white mt-2">
            {formatIDR(totalOmzet)}
          </p>
          <div className="flex items-center gap-1.5 mt-2 text-[11px] text-emerald-600 dark:text-emerald-400">
            <TrendingUp className="w-3.5 h-3.5" />
            <span>{totalSalesCount} Struk Transaksi POS</span>
          </div>
        </div>

        {/* Keuntungan Bersih (Gross Profit) */}
        <div className="p-4 rounded-2xl bg-white dark:bg-gradient-to-br dark:from-emerald-950/40 dark:to-slate-850 border border-slate-200 dark:border-emerald-500/30 relative overflow-hidden shadow-xs">
          <div className="flex justify-between items-start">
            <span className="text-xs text-emerald-700 dark:text-emerald-300 font-semibold">Keuntungan Kotor (Gross Margin)</span>
            <div className="w-8 h-8 rounded-xl bg-emerald-50 dark:bg-emerald-500/20 flex items-center justify-center text-emerald-600 dark:text-emerald-400">
              <TrendingUp className="w-4 h-4" />
            </div>
          </div>
          <p className="text-2xl font-black text-emerald-600 dark:text-emerald-400 mt-2">
            {formatIDR(totalGrossProfit)}
          </p>
          <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-2">
            Margin: {totalOmzet > 0 ? Math.round((totalGrossProfit / totalOmzet) * 100) : 0}% dari Total Omzet
          </p>
        </div>

        {/* Nilai Valuasi Stok Fisik */}
        <div className="p-4 rounded-2xl bg-white dark:bg-gradient-to-br dark:from-cyan-950/40 dark:to-slate-850 border border-slate-200 dark:border-cyan-500/30 relative overflow-hidden shadow-xs">
          <div className="flex justify-between items-start">
            <span className="text-xs text-slate-700 dark:text-cyan-300 font-semibold">Valuasi Stok Pergudangan (Harga Jual)</span>
            <div className="w-8 h-8 rounded-xl bg-slate-100 dark:bg-cyan-500/20 flex items-center justify-center text-slate-700 dark:text-cyan-400">
              <Package className="w-4 h-4" />
            </div>
          </div>
          <p className="text-2xl font-black text-slate-900 dark:text-cyan-300 mt-2">
            {formatIDR(totalAssetValue)}
          </p>
          <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-2">
            {products.length} SKU Barang Aktif
          </p>
        </div>

        {/* Critical Low Stock Alert */}
        <div className="p-4 rounded-2xl bg-white dark:bg-gradient-to-br dark:from-rose-950/40 dark:to-slate-850 border border-slate-200 dark:border-rose-500/30 relative overflow-hidden shadow-xs">
          <div className="flex justify-between items-start">
            <span className="text-xs text-rose-700 dark:text-rose-300 font-semibold">Status Pengadaan Restock</span>
            <div className="w-8 h-8 rounded-xl bg-rose-50 dark:bg-rose-500/20 flex items-center justify-center text-rose-600 dark:text-rose-400">
              <AlertTriangle className="w-4 h-4" />
            </div>
          </div>
          <p className="text-2xl font-black text-rose-600 dark:text-rose-400 mt-2">
            {outOfStock.length + lowStock.length} Item
          </p>
          <div className="flex items-center gap-2 mt-2 text-[11px]">
            <span className="text-rose-600 dark:text-rose-400 font-bold">{outOfStock.length} Habis</span>
            <span className="text-slate-400">•</span>
            <span className="text-amber-600 dark:text-amber-400 font-medium">{lowStock.length} Di Bawah Min</span>
          </div>
        </div>

      </div>

      {/* Main Charts & Breakdown Row */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        
        {/* Monthly In/Out Comparison Chart (Jan - Sep 2026) */}
        <div className="lg:col-span-2 p-5 rounded-2xl bg-white dark:bg-slate-850/80 border border-slate-200 dark:border-slate-800 shadow-xs flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-2">
                <BarChart3 className="w-5 h-5 text-blue-600 dark:text-indigo-400" />
                <h3 className="font-bold text-sm text-slate-900 dark:text-slate-100">Tren Mutasi Volume Barang (Jan - Sep 2026)</h3>
              </div>
              <div className="flex items-center gap-3 text-xs">
                <div className="flex items-center gap-1.5 text-slate-600 dark:text-slate-300">
                  <span className="w-3 h-3 rounded bg-emerald-500 inline-block" />
                  <span>Barang Masuk (IN)</span>
                </div>
                <div className="flex items-center gap-1.5 text-slate-600 dark:text-slate-300">
                  <span className="w-3 h-3 rounded bg-rose-500 inline-block" />
                  <span>Barang Keluar (OUT)</span>
                </div>
              </div>
            </div>
            <p className="text-xs text-slate-500 dark:text-slate-400 mb-6">
              Volume akumulatif keluar-masuk barang pergudangan per bulan berdasarkan audit log stok 2026.
            </p>
          </div>

          {/* Bar Visualization */}
          <div className="h-64 flex items-end justify-between gap-2 pt-6 pb-2 px-2 border-b border-slate-200 dark:border-slate-700/60">
            {monthlyTrends2026.map((item, idx) => {
              const inHeight = Math.max(12, Math.round((item.inQty / maxMonthlyVal) * 100));
              const outHeight = Math.max(12, Math.round((item.outQty / maxMonthlyVal) * 100));

              return (
                <div key={idx} className="flex-1 flex flex-col items-center gap-1 h-full justify-end group">
                  <div className="w-full flex items-end justify-center gap-1 h-full">
                    {/* IN Bar */}
                    <div 
                      style={{ height: `${inHeight}%` }}
                      className="w-full max-w-[16px] bg-gradient-to-t from-emerald-600 to-emerald-400 rounded-t-sm transition-all group-hover:brightness-110 relative"
                      title={`${item.month} IN: ${item.inQty.toLocaleString('id-ID')}`}
                    />
                    {/* OUT Bar */}
                    <div 
                      style={{ height: `${outHeight}%` }}
                      className="w-full max-w-[16px] bg-gradient-to-t from-rose-600 to-rose-400 rounded-t-sm transition-all group-hover:brightness-110 relative"
                      title={`${item.month} OUT: ${item.outQty.toLocaleString('id-ID')}`}
                    />
                  </div>
                  <span className="text-[11px] font-semibold text-slate-500 dark:text-slate-400 mt-2">{item.month}</span>
                </div>
              );
            })}
          </div>

          <div className="mt-3 flex items-center justify-between text-xs text-slate-500 dark:text-slate-400 pt-2">
            <span>Rata-rata turnover bulanan: <strong className="text-slate-800 dark:text-slate-200">~12.000 unit/bulan</strong></span>
            <span>Total Qty Out 2026: <strong className="text-rose-600 dark:text-rose-400">107.500+ unit</strong></span>
          </div>
        </div>

        {/* Category Asset Valuation Breakdown */}
        <div className="p-5 rounded-2xl bg-white dark:bg-slate-850/80 border border-slate-200 dark:border-slate-800 shadow-xs flex flex-col justify-between">
          <div>
            <div className="flex items-center gap-2 mb-2">
              <PieChart className="w-5 h-5 text-blue-600 dark:text-indigo-400" />
              <h3 className="font-bold text-sm text-slate-900 dark:text-slate-100">Distribusi Nilai Aset per Kategori</h3>
            </div>
            <p className="text-xs text-slate-500 dark:text-slate-400 mb-4">
              Porsi modal inventaris tertanam dalam tiap lini produk.
            </p>

            <div className="space-y-3">
              {categoryDistribution.slice(0, 6).map(([cat, data]) => {
                const percent = Math.round((data.totalVal / maxCategoryVal) * 100);
                return (
                  <div key={cat} className="space-y-1">
                    <div className="flex justify-between text-xs">
                      <span className="font-medium text-slate-800 dark:text-slate-200 truncate max-w-[160px]">{cat}</span>
                      <span className="font-mono text-slate-500 dark:text-slate-400">{formatIDR(data.totalVal)}</span>
                    </div>
                    <div className="w-full h-2 rounded-full bg-slate-100 dark:bg-slate-800 overflow-hidden">
                      <div 
                        className="h-full rounded-full bg-gradient-to-r from-blue-600 to-cyan-500 dark:from-indigo-500 dark:to-cyan-400 transition-all duration-500"
                        style={{ width: `${Math.max(5, percent)}%` }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          <div className="mt-4 p-3 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700/60 text-xs text-slate-600 dark:text-slate-400">
            Kategori nilai tertinggi saat ini dipimpin oleh <strong className="text-slate-800 dark:text-slate-200">Mesin Coding & CIJ Consumables</strong>.
          </div>
        </div>

      </div>

      {/* Lower Row: Fast Moving vs Stock Alerts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        
        {/* Fast Moving Best Sellers */}
        <div className="p-5 rounded-2xl bg-white dark:bg-slate-850/80 border border-slate-200 dark:border-slate-800 shadow-xs">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <Sparkles className="w-5 h-5 text-amber-500 dark:text-amber-400" />
              <h3 className="font-bold text-sm text-slate-900 dark:text-slate-100">Barang Paling Laris (Fast Moving Items)</h3>
            </div>
            <span className="text-[11px] text-slate-500 dark:text-slate-400">Volume Terbesar</span>
          </div>

          <div className="divide-y divide-slate-100 dark:divide-slate-800">
            {topFastMoving.map((item, idx) => (
              <div key={idx} className="py-2.5 flex items-center justify-between gap-3 text-xs">
                <div className="flex items-center gap-2.5 min-w-0">
                  <span className="w-5 h-5 rounded-lg bg-blue-50 dark:bg-indigo-500/20 text-blue-700 dark:text-indigo-300 font-bold flex items-center justify-center text-[10px] shrink-0">
                    {idx + 1}
                  </span>
                  <div className="truncate">
                    <p className="font-semibold text-slate-800 dark:text-slate-200 truncate">{item.name}</p>
                    <span className="text-[10px] text-slate-500 dark:text-slate-400">{item.category} • Stok: {item.currentStock}</span>
                  </div>
                </div>

                <div className="text-right shrink-0">
                  <span className="font-bold text-emerald-600 dark:text-emerald-400">{item.outTotal}</span>
                  <span className="block text-[10px] text-slate-400">Total Mutasi Keluar</span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Low Stock Urgent PO Alerts */}
        <div className="p-5 rounded-2xl bg-white dark:bg-slate-850/80 border border-slate-200 dark:border-slate-800 shadow-xs">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <AlertTriangle className="w-5 h-5 text-rose-600 dark:text-rose-400" />
              <h3 className="font-bold text-sm text-slate-900 dark:text-slate-100">Prioritas Restock (Stok Habis & Kritis)</h3>
            </div>
            <span className="text-[11px] text-rose-600 dark:text-rose-400 font-semibold">Segera Buat PO</span>
          </div>

          <div className="divide-y divide-slate-100 dark:divide-slate-800 max-h-80 overflow-y-auto pr-1">
            {[...outOfStock, ...lowStock].slice(0, 8).map((p) => {
              const isZero = p.stock === 0;
              return (
                <div key={p.id} className="py-2.5 flex items-center justify-between gap-3 text-xs">
                  <div className="min-w-0">
                    <p className="font-semibold text-slate-800 dark:text-slate-200 truncate">{p.name}</p>
                    <div className="flex items-center gap-2 text-[10px] text-slate-500 dark:text-slate-400 mt-0.5">
                      <span>{p.sku}</span>
                      <span>•</span>
                      <span>Min: {p.minStock} {p.unit}</span>
                      <span>•</span>
                      <span>HPP: {formatIDR(p.buyPrice)}</span>
                    </div>
                  </div>

                  <div className="text-right shrink-0">
                    <span className={`px-2 py-0.5 rounded text-[10px] font-black font-mono ${
                      isZero 
                        ? 'bg-rose-100 dark:bg-rose-500/20 text-rose-700 dark:text-rose-300 border border-rose-200 dark:border-rose-500/30' 
                        : 'bg-amber-100 dark:bg-amber-500/20 text-amber-700 dark:text-amber-300 border border-amber-200 dark:border-amber-500/30'
                    }`}>
                      {p.stock} {p.unit}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

      </div>

    </div>
  );
};
