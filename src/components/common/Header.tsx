import React, { useState } from 'react';
import { 
  Bell, 
  UserCheck, 
  Code2, 
  RefreshCw, 
  AlertTriangle, 
  ShieldCheck, 
  Store,
  Layers,
  Search,
  Sun,
  Moon,
  Monitor,
  PanelLeftClose,
  PanelLeftOpen
} from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { UserRole } from '../../types';

interface HeaderProps {
  onOpenArchitecture: () => void;
  searchTerm: string;
  onSearchChange: (val: string) => void;
  activeTab: string;
}

export const Header: React.FC<HeaderProps> = ({ 
  onOpenArchitecture, 
  searchTerm, 
  onSearchChange,
  activeTab
}) => {
  const { 
    currentUser, 
    setCurrentUserRole, 
    getLowStockProducts, 
    getOutOfStockProducts, 
    resetToDefaultData,
    theme,
    toggleTheme,
    sidebarCollapsed,
    toggleSidebar
  } = useApp();
  
  const [showNotifications, setShowNotifications] = useState(false);

  const lowStock = getLowStockProducts();
  const outOfStock = getOutOfStockProducts();
  const totalAlerts = lowStock.length + outOfStock.length;

  return (
    <header className="sticky top-0 z-30 bg-white/90 dark:bg-[#18181b]/95 backdrop-blur-md border-b border-slate-200 dark:border-slate-800 px-4 lg:px-6 py-2.5 transition-colors duration-200 shadow-[0_1px_3px_rgba(0,0,0,0.05)]">
      <div className="flex items-center justify-between gap-4">
        
        {/* Left: Windows Fluent Branding & Sidebar Toggle */}
        <div className="flex items-center gap-2.5">
          <button
            onClick={toggleSidebar}
            className="p-2 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-750 text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white border border-slate-300 dark:border-slate-700 shadow-xs transition-all cursor-pointer"
            title={sidebarCollapsed ? "Buka Menu Penuh (Expand Sidebar)" : "Kecilkan Menu (Minimize Sidebar)"}
          >
            {sidebarCollapsed ? <PanelLeftOpen className="w-4 h-4" /> : <PanelLeftClose className="w-4 h-4" />}
          </button>

          <div className="flex items-center justify-center w-9 h-9 rounded-xl bg-gradient-to-tr from-blue-700 via-indigo-600 to-cyan-500 shadow-md shadow-blue-500/25 text-white shrink-0 p-1">
            {/* Logo MM-Inv Vector Emblem */}
            <svg viewBox="0 0 36 36" fill="none" xmlns="http://www.w3.org/2000/svg" className="w-full h-full drop-shadow-xs">
              <path d="M5 26V10L11 19L17 10V26" stroke="white" strokeWidth="2.75" strokeLinecap="round" strokeLinejoin="round"/>
              <path d="M19 26V10L24.5 19L30 10V26" stroke="#38BDF8" strokeWidth="2.75" strokeLinecap="round" strokeLinejoin="round"/>
              <circle cx="30" cy="9.5" r="2.2" fill="#F59E0B" />
            </svg>
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="font-bold text-base sm:text-lg text-slate-900 dark:text-white tracking-tight">
                MM<span className="text-blue-600 dark:text-cyan-400">-Inv</span>
              </span>
              <span className="text-[10px] font-bold tracking-wider uppercase px-2 py-0.5 rounded-full bg-blue-50 dark:bg-cyan-500/15 text-blue-700 dark:text-cyan-400 border border-blue-200 dark:border-cyan-500/30">
                v2026.1 Enterprise
              </span>
            </div>
            <p className="text-[11px] text-slate-500 dark:text-slate-400 hidden sm:block">
              PT Media Multindo Teknologi • Inventory & POS Management
            </p>
          </div>
        </div>

        {/* Middle: Universal Quick Search (for POS / Product Catalog) */}
        <div className="hidden md:flex items-center flex-1 max-w-md mx-2">
          <div className="relative w-full">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <input
              type="text"
              placeholder="Cari SKU, Barcode, atau Nama Barang (mis: TIJ, Ribbon, Cartridge)..."
              value={searchTerm}
              onChange={(e) => onSearchChange(e.target.value)}
              className="w-full pl-9 pr-12 py-1.5 text-xs sm:text-sm bg-slate-100/90 dark:bg-slate-800/80 hover:bg-slate-100 focus:bg-white dark:focus:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl text-slate-900 dark:text-slate-100 placeholder-slate-400 dark:placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500/30 dark:focus:ring-indigo-500/40 focus:border-blue-500 dark:focus:border-indigo-500 transition-all shadow-xs"
            />
            {searchTerm && (
              <button 
                onClick={() => onSearchChange('')}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 font-medium"
              >
                Clear
              </button>
            )}
          </div>
        </div>

        {/* Right Action Bar */}
        <div className="flex items-center gap-2">
          
          {/* WINDOWS THEME MODE TOGGLE BUTTON (LIGHT / DARK) */}
          <button
            onClick={toggleTheme}
            className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 border border-slate-300 dark:border-slate-700 text-xs font-semibold shadow-xs transition-all cursor-pointer"
            title={theme === 'light' ? 'Beralih ke Windows Dark Mode (Mode Gelap)' : 'Beralih ke Windows Light Mode (Mode Terang)'}
          >
            {theme === 'light' ? (
              <>
                <Moon className="w-4 h-4 text-indigo-600 shrink-0" />
                <span className="hidden sm:inline">Windows Dark</span>
              </>
            ) : (
              <>
                <Sun className="w-4 h-4 text-amber-400 shrink-0" />
                <span className="hidden sm:inline">Windows Light</span>
              </>
            )}
          </button>

          {/* Technical Architecture & SQL DDL Modal Trigger */}
          <button
            onClick={onOpenArchitecture}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-blue-50 hover:bg-blue-100 dark:bg-gradient-to-r dark:from-cyan-500/10 dark:via-indigo-500/10 dark:to-purple-500/10 dark:hover:from-cyan-500/20 text-blue-700 dark:text-cyan-300 border border-blue-200 dark:border-cyan-500/30 text-xs font-semibold shadow-xs transition-all group"
            title="Buka Skema Database DDL, ERD, dan Arsitektur Backend"
          >
            <Code2 className="w-4 h-4 text-blue-600 dark:text-cyan-400 group-hover:rotate-12 transition-transform" />
            <span className="hidden lg:inline">Blueprint & DDL SQL</span>
          </button>

          {/* Stock Alert Notification Bell */}
          <div className="relative">
            <button
              onClick={() => setShowNotifications(!showNotifications)}
              className="relative p-2 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-600 dark:text-slate-300 border border-slate-300 dark:border-slate-700 transition-all cursor-pointer"
              title="Notifikasi Stok Menipis & Habis"
            >
              <Bell className="w-4 h-4" />
              {totalAlerts > 0 && (
                <span className="absolute -top-1 -right-1 flex h-4 w-4 items-center justify-center rounded-full bg-rose-500 text-[10px] font-bold text-white shadow-lg animate-pulse">
                  {totalAlerts}
                </span>
              )}
            </button>

            {/* Notification Dropdown */}
            {showNotifications && (
              <div className="absolute right-0 mt-2 w-80 sm:w-96 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl shadow-2xl overflow-hidden z-50 animate-in fade-in slide-in-from-top-2 duration-150 text-slate-800 dark:text-slate-100">
                <div className="px-4 py-3 border-b border-slate-200 dark:border-slate-700 flex items-center justify-between bg-slate-50 dark:bg-slate-850">
                  <div className="flex items-center gap-2">
                    <AlertTriangle className="w-4 h-4 text-amber-500 dark:text-amber-400" />
                    <span className="font-semibold text-sm">Peringatan Stok ({totalAlerts})</span>
                  </div>
                  <span className="text-[11px] text-slate-500 dark:text-slate-400">Ambang Min. Stok</span>
                </div>

                <div className="max-h-72 overflow-y-auto divide-y divide-slate-100 dark:divide-slate-700/50 p-1">
                  {outOfStock.length > 0 && (
                    <div className="p-2">
                      <p className="text-[11px] font-bold text-rose-600 dark:text-rose-400 uppercase tracking-wider mb-1 flex items-center gap-1.5">
                        <span className="w-1.5 h-1.5 rounded-full bg-rose-500" />
                        Stok Habis (0 Unit) - Segera PO
                      </p>
                      {outOfStock.slice(0, 4).map(item => (
                        <div key={item.id} className="p-2 rounded-lg bg-rose-50 dark:bg-rose-950/20 mb-1 border border-rose-200 dark:border-rose-900/30 flex justify-between items-center text-xs">
                          <div>
                            <p className="font-medium text-slate-800 dark:text-slate-200 truncate max-w-[200px]">{item.name}</p>
                            <span className="text-[10px] text-slate-500 dark:text-slate-400">{item.sku} • {item.category}</span>
                          </div>
                          <span className="font-bold text-rose-600 dark:text-rose-400 bg-rose-100 dark:bg-rose-500/10 px-2 py-0.5 rounded border border-rose-200 dark:border-rose-500/20">
                            0 {item.unit}
                          </span>
                        </div>
                      ))}
                    </div>
                  )}

                  {lowStock.length > 0 && (
                    <div className="p-2">
                      <p className="text-[11px] font-bold text-amber-600 dark:text-amber-400 uppercase tracking-wider mb-1 flex items-center gap-1.5">
                        <span className="w-1.5 h-1.5 rounded-full bg-amber-500" />
                        Stok Menipis (Di Bawah Minimum)
                      </p>
                      {lowStock.slice(0, 4).map(item => (
                        <div key={item.id} className="p-2 rounded-lg bg-amber-50 dark:bg-amber-950/20 mb-1 border border-amber-200 dark:border-amber-900/30 flex justify-between items-center text-xs">
                          <div>
                            <p className="font-medium text-slate-800 dark:text-slate-200 truncate max-w-[200px]">{item.name}</p>
                            <span className="text-[10px] text-slate-500 dark:text-slate-400">{item.sku} (Min: {item.minStock})</span>
                          </div>
                          <span className="font-bold text-amber-600 dark:text-amber-400 bg-amber-100 dark:bg-amber-500/10 px-2 py-0.5 rounded border border-amber-200 dark:border-amber-500/20">
                            {item.stock} {item.unit}
                          </span>
                        </div>
                      ))}
                    </div>
                  )}

                  {totalAlerts === 0 && (
                    <div className="p-6 text-center text-slate-500 dark:text-slate-400 text-xs">
                      <ShieldCheck className="w-8 h-8 text-emerald-500 mx-auto mb-2 opacity-80" />
                      Semua stok barang dalam kondisi aman.
                    </div>
                  )}
                </div>

                <div className="p-2.5 bg-slate-50 dark:bg-slate-900/60 border-t border-slate-200 dark:border-slate-700 text-center">
                  <span className="text-xs text-slate-500 dark:text-slate-400">
                    Total {totalAlerts} produk memerlukan perhatian pengadaan
                  </span>
                </div>
              </div>
            )}
          </div>

          {/* Role Switcher (RBAC) */}
          <div className="flex items-center gap-1 bg-slate-100 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl p-1">
            <span className="text-[11px] font-medium text-slate-500 dark:text-slate-400 pl-2 hidden xl:inline">Peran:</span>
            {(['ADMIN', 'KASIR', 'GUDANG'] as UserRole[]).map((role) => {
              const active = currentUser.role === role;
              return (
                <button
                  key={role}
                  onClick={() => setCurrentUserRole(role)}
                  className={`px-2.5 py-1 text-xs font-semibold rounded-lg transition-all ${
                    active
                      ? 'bg-blue-600 dark:bg-indigo-600 text-white shadow-xs'
                      : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200 hover:bg-slate-200 dark:hover:bg-slate-700/50'
                  }`}
                  title={`Ganti Peran ke ${role}`}
                >
                  {role}
                </button>
              );
            })}
          </div>

          {/* User Profile Mini */}
          <div className="hidden sm:flex items-center gap-2 pl-1 border-l border-slate-200 dark:border-slate-800">
            <img 
              src={currentUser.avatar} 
              alt={currentUser.name} 
              className="w-7 h-7 rounded-full ring-2 ring-blue-500/40 dark:ring-indigo-500/40 object-cover" 
            />
            <div className="text-left hidden 2xl:block">
              <p className="text-xs font-semibold text-slate-800 dark:text-slate-200 leading-tight">{currentUser.name}</p>
              <p className="text-[10px] text-slate-500 dark:text-slate-400 font-mono">{currentUser.role}</p>
            </div>
          </div>

          {/* Reset Seed Button */}
          <button
            onClick={() => {
              if (confirm('Kembalikan seluruh data produk, mutasi, dan transaksi ke data awal CSV 2026?')) {
                resetToDefaultData();
              }
            }}
            className="p-2 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-500 dark:text-slate-400 hover:text-amber-500 dark:hover:text-amber-400 border border-slate-300 dark:border-slate-700 transition-all cursor-pointer"
            title="Reset Database ke Seed Awal CSV 2026"
          >
            <RefreshCw className="w-3.5 h-3.5" />
          </button>

        </div>
      </div>
    </header>
  );
};
