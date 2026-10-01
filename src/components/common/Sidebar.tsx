import React from 'react';
import { 
  ShoppingCart, 
  Package, 
  ArrowDownToLine, 
  ArrowUpFromLine, 
  FileText, 
  BarChart3, 
  Code2, 
  Shield, 
  Database,
  PanelLeftClose,
  PanelLeftOpen,
  ChevronLeft,
  ChevronRight
} from 'lucide-react';
import { useApp } from '../../context/AppContext';

export type TabType = 
  | 'pos' 
  | 'products' 
  | 'stock-in' 
  | 'stock-out' 
  | 'stock-card' 
  | 'dashboard' 
  | 'architecture';

interface SidebarProps {
  activeTab: TabType;
  setActiveTab: (tab: TabType) => void;
}

export const Sidebar: React.FC<SidebarProps> = ({ activeTab, setActiveTab }) => {
  const { 
    currentUser, 
    cart, 
    products, 
    getLowStockProducts,
    sidebarCollapsed,
    toggleSidebar 
  } = useApp();
  
  const lowStockCount = getLowStockProducts().length;

  const navItems = [
    {
      id: 'pos' as TabType,
      label: 'Kasir POS (Penjualan)',
      shortLabel: 'POS',
      icon: ShoppingCart,
      badge: cart.length > 0 ? `${cart.length} item` : undefined,
      badgeShort: cart.length > 0 ? `${cart.length}` : undefined,
      badgeColor: 'bg-emerald-600 text-white',
      allowedRoles: ['ADMIN', 'KASIR'],
      description: 'Transaksi cepat, struk thermal & barcode'
    },
    {
      id: 'products' as TabType,
      label: 'Katalog & Barcode SKU',
      shortLabel: 'Katalog',
      icon: Package,
      badge: `${products.length}`,
      badgeShort: `${products.length}`,
      badgeColor: 'bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-300',
      allowedRoles: ['ADMIN', 'KASIR', 'GUDANG'],
      description: 'Master harga beli, jual & limit stok'
    },
    {
      id: 'stock-in' as TabType,
      label: 'Barang Masuk (Inbound)',
      shortLabel: 'Masuk',
      icon: ArrowDownToLine,
      allowedRoles: ['ADMIN', 'GUDANG'],
      description: 'Penerimaan PO & pasokan supplier'
    },
    {
      id: 'stock-out' as TabType,
      label: 'Barang Keluar (Outbound)',
      shortLabel: 'Keluar',
      icon: ArrowUpFromLine,
      allowedRoles: ['ADMIN', 'GUDANG'],
      description: 'Operasional, barang rusak & demo'
    },
    {
      id: 'stock-card' as TabType,
      label: 'Kartu Stok (Audit Trail)',
      shortLabel: 'Kartu Stok',
      icon: FileText,
      allowedRoles: ['ADMIN', 'GUDANG', 'KASIR'],
      description: 'Histori mutasi mutlak per item'
    },
    {
      id: 'dashboard' as TabType,
      label: 'Laporan & Analitik',
      shortLabel: 'Laporan',
      icon: BarChart3,
      badge: lowStockCount > 0 ? `${lowStockCount} alert` : undefined,
      badgeShort: lowStockCount > 0 ? `!` : undefined,
      badgeColor: 'bg-amber-100 dark:bg-amber-500/20 text-amber-700 dark:text-amber-300 border border-amber-300 dark:border-amber-500/30',
      allowedRoles: ['ADMIN'],
      description: 'Omzet, laba bersih & fast moving'
    },
    {
      id: 'architecture' as TabType,
      label: 'Blueprint & DDL SQL',
      shortLabel: 'Blueprint',
      icon: Code2,
      allowedRoles: ['ADMIN', 'KASIR', 'GUDANG'],
      description: 'Skema ERD, SQL & Race condition'
    },
  ];

  return (
    <aside 
      className={`${
        sidebarCollapsed ? 'w-[72px]' : 'w-64'
      } bg-[#f8fafc] dark:bg-[#18181b] border-r border-slate-200 dark:border-slate-800 flex flex-col shrink-0 min-h-[calc(100vh-57px)] select-none transition-all duration-300 ease-in-out relative`}
    >
      
      {/* Top Header Section with Collapse / Expand Toggle Button */}
      <div className={`p-3 border-b border-slate-200/60 dark:border-slate-800/60 flex items-center ${sidebarCollapsed ? 'justify-center' : 'justify-between'}`}>
        {!sidebarCollapsed ? (
          <>
            <span className="px-2 text-[10px] font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500 truncate">
              Windows Apps & Modul
            </span>
            <button
              onClick={toggleSidebar}
              className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 dark:text-slate-500 dark:hover:text-slate-200 hover:bg-slate-200/60 dark:hover:bg-slate-800 transition-all cursor-pointer"
              title="Kecilkan Menu (Minimize Sidebar)"
            >
              <PanelLeftClose className="w-4 h-4" />
            </button>
          </>
        ) : (
          <button
            onClick={toggleSidebar}
            className="p-2 rounded-xl bg-blue-50 dark:bg-indigo-950/40 text-blue-600 dark:text-indigo-400 hover:bg-blue-100 dark:hover:bg-indigo-900/50 border border-blue-200/80 dark:border-indigo-500/30 transition-all cursor-pointer shadow-xs"
            title="Perluas Menu Penuh (Expand Sidebar)"
          >
            <PanelLeftOpen className="w-4 h-4" />
          </button>
        )}
      </div>

      {/* Navigation Items List */}
      <div className="p-2 space-y-1.5 flex-1 overflow-y-auto overflow-x-hidden no-scrollbar">
        {navItems.map((item) => {
          const isAllowed = item.allowedRoles.includes(currentUser.role);
          const isActive = activeTab === item.id;
          const Icon = item.icon;

          return (
            <button
              key={item.id}
              onClick={() => isAllowed && setActiveTab(item.id)}
              disabled={!isAllowed}
              title={
                sidebarCollapsed 
                  ? `${item.label} ${!isAllowed ? `(Terkunci - Hanya Role: ${item.allowedRoles.join(', ')})` : `\n${item.description}`}`
                  : !isAllowed 
                  ? `Fitur terbatas untuk role: ${item.allowedRoles.join(', ')}` 
                  : undefined
              }
              className={`w-full group rounded-xl transition-all relative flex items-center ${
                sidebarCollapsed 
                  ? 'justify-center p-3' 
                  : 'justify-start gap-3 px-3 py-2.5 text-left'
              } ${
                isActive
                  ? 'bg-blue-50 dark:bg-indigo-600/15 text-blue-700 dark:text-indigo-300 border border-blue-200 dark:border-indigo-500/30 font-semibold shadow-xs'
                  : isAllowed
                  ? 'text-slate-700 dark:text-slate-300 hover:text-slate-950 dark:hover:text-white hover:bg-slate-200/60 dark:hover:bg-slate-800/60 border border-transparent'
                  : 'text-slate-400 dark:text-slate-600 cursor-not-allowed opacity-40 border border-transparent'
              }`}
            >
              {/* Icon Container with Floating Badge in Collapsed Mode */}
              <div className="relative flex items-center justify-center shrink-0">
                <Icon 
                  className={`w-4 h-4 transition-colors ${
                    isActive 
                      ? 'text-blue-600 dark:text-indigo-400' 
                      : isAllowed 
                      ? 'text-slate-500 dark:text-slate-400 group-hover:text-slate-900 dark:group-hover:text-slate-200' 
                      : 'text-slate-400 dark:text-slate-600'
                  }`} 
                />
                
                {/* Floating Compact Badge in Collapsed Mode */}
                {sidebarCollapsed && item.badgeShort && isAllowed && (
                  <span className={`absolute -top-2 -right-2.5 text-[9px] min-w-4 h-4 px-1 rounded-full font-bold flex items-center justify-center shadow-xs ${item.badgeColor}`}>
                    {item.badgeShort}
                  </span>
                )}
              </div>
              
              {/* Text Information (Shown when Expanded) */}
              {!sidebarCollapsed && (
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between gap-1">
                    <span className="text-xs truncate">{item.label}</span>
                    {item.badge && isAllowed && (
                      <span className={`text-[10px] px-1.5 py-0.2 rounded-full font-bold shrink-0 ${item.badgeColor}`}>
                        {item.badge}
                      </span>
                    )}
                  </div>
                  <p className="text-[10px] text-slate-400 dark:text-slate-500 truncate mt-0.5">
                    {item.description}
                  </p>
                </div>
              )}

              {/* Role Restricted Icon */}
              {!isAllowed && (
                sidebarCollapsed ? (
                  <Shield className="w-2.5 h-2.5 text-slate-400 dark:text-slate-600 absolute bottom-1 right-1" />
                ) : (
                  <Shield className="w-3.5 h-3.5 text-slate-400 dark:text-slate-600 shrink-0 self-center" />
                )
              )}
            </button>
          );
        })}
      </div>

      {/* Database & System Info Box (Windows Tile Style) */}
      {!sidebarCollapsed ? (
        <div className="p-3 m-3 rounded-2xl bg-white dark:bg-gradient-to-b dark:from-slate-850 dark:to-slate-800/40 border border-slate-200 dark:border-slate-700/60 text-xs shadow-xs animate-in fade-in duration-200">
          <div className="flex items-center gap-2 mb-1.5 text-blue-600 dark:text-indigo-400">
            <Database className="w-4 h-4 shrink-0" />
            <span className="font-semibold text-slate-800 dark:text-slate-200 truncate">Catalog Database</span>
          </div>
          <p className="text-[11px] text-slate-600 dark:text-slate-400 leading-relaxed mb-2.5">
            Memuat <strong className="text-slate-900 dark:text-slate-200">{products.length} SKU</strong> suku cadang coding, mesin, ribbon, & consumables 2026.
          </p>
          <div className="flex items-center justify-between text-[10px] pt-2 border-t border-slate-100 dark:border-slate-700/60 text-slate-500 dark:text-slate-400">
            <span>Audit Mutasi: <strong className="text-emerald-600 dark:text-emerald-400">Aktif (ACID)</strong></span>
            <span className="font-mono">v2026</span>
          </div>
        </div>
      ) : (
        <div 
          className="mx-auto mb-3 p-2.5 rounded-xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 flex items-center justify-center text-blue-600 dark:text-indigo-400 shadow-xs cursor-pointer hover:bg-slate-50 dark:hover:bg-slate-750 transition-colors"
          title={`Catalog Database: ${products.length} SKU aktif (Audit ACID)`}
          onClick={toggleSidebar}
        >
          <Database className="w-4 h-4" />
        </div>
      )}

      {/* Role Notice & Footer */}
      <div className="p-3 border-t border-slate-200 dark:border-slate-800 text-[11px] text-slate-500 dark:text-slate-400 flex items-center justify-between">
        {!sidebarCollapsed ? (
          <>
            <div className="flex items-center gap-2 truncate">
              <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse shrink-0" />
              <span className="truncate">Role: <strong className="text-slate-800 dark:text-slate-200">{currentUser.role}</strong></span>
            </div>
            <span className="text-[10px] shrink-0">MM-Inv v2026</span>
          </>
        ) : (
          <div 
            className="w-full flex items-center justify-center cursor-pointer"
            title={`Role aktif: ${currentUser.role} (Klik untuk memperluas menu)`}
            onClick={toggleSidebar}
          >
            <div className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse" />
          </div>
        )}
      </div>

    </aside>
  );
};
