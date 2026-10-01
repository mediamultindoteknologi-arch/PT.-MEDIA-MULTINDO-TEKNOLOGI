import React, { useState, useMemo, useRef, useEffect } from 'react';
import { 
  Search, 
  ShoppingCart, 
  Trash2, 
  Plus, 
  Minus, 
  Check, 
  CreditCard, 
  Banknote, 
  QrCode, 
  Receipt, 
  AlertCircle,
  Sparkles,
  Barcode,
  Layers,
  ArrowRight,
  Filter,
  User,
  UserPlus,
  Building2,
  Phone,
  Tag,
  Edit3,
  History,
  CheckCircle2,
  X,
  ChevronDown,
  Percent,
  DollarSign
} from 'lucide-react';
import confetti from 'canvas-confetti';
import { useApp } from '../../context/AppContext';
import { Product, ProductCategory, SaleTransaction, Customer, CustomerTier } from '../../types';
import { ReceiptModal } from './ReceiptModal';

const CATEGORIES: ('ALL' | ProductCategory)[] = [
  'ALL',
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

interface POSViewProps {
  searchTerm: string;
}

export const POSView: React.FC<POSViewProps> = ({ searchTerm }) => {
  const { 
    products, 
    cart, 
    addToCart, 
    updateCartQty, 
    updateCartItemPrice,
    updateCartPriceTier,
    applyCustomerToCart,
    removeFromCart, 
    clearCart, 
    checkout,
    customers,
    addCustomer,
    getCustomerLastPrice,
    currentUser 
  } = useApp();

  const [selectedCategory, setSelectedCategory] = useState<'ALL' | ProductCategory>('ALL');
  const [localSearch, setLocalSearch] = useState('');
  const [barcodeInput, setBarcodeInput] = useState('');
  const [useTax, setUseTax] = useState(false);
  const [discountAmount, setDiscountAmount] = useState(0);

  // Customer Autocomplete & Selection State
  const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(null);
  const [customerSearchQuery, setCustomerSearchQuery] = useState('');
  const [isCustomerDropdownOpen, setIsCustomerDropdownOpen] = useState(false);
  const customerDropdownRef = useRef<HTMLDivElement>(null);

  // Add Customer Modal State
  const [showAddCustomerModal, setShowAddCustomerModal] = useState(false);
  const [newCustomerForm, setNewCustomerForm] = useState({
    name: '',
    companyName: '',
    phone: '',
    address: '',
    email: '',
    tier: 'STANDAR' as CustomerTier,
    notes: '',
  });

  // Inline Price Editing State (which item is in manual price editing mode)
  const [editingPriceProductId, setEditingPriceProductId] = useState<string | null>(null);
  const [customPriceInputVal, setCustomPriceInputVal] = useState<string>('');

  // Payment Modal State
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [paymentMethod, setPaymentMethod] = useState<'CASH' | 'QRIS' | 'TRANSFER' | 'DEBIT'>('CASH');
  const [cashGiven, setCashGiven] = useState<number>(0);
  const [checkoutError, setCheckoutError] = useState<string | null>(null);

  // Receipt Modal State
  const [completedTransaction, setCompletedTransaction] = useState<SaleTransaction | null>(null);

  // Format currency
  const formatIDR = (val: number) => 'Rp ' + Math.round(val).toLocaleString('id-ID');

  // Close customer dropdown on outside click
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (customerDropdownRef.current && !customerDropdownRef.current.contains(event.target as Node)) {
        setIsCustomerDropdownOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Filtered Products for Catalog Grid
  const effectiveSearch = (localSearch || searchTerm).trim().toLowerCase();
  const filteredProducts = useMemo(() => {
    return products.filter((p) => {
      const matchCat = selectedCategory === 'ALL' || p.category === selectedCategory;
      const matchSearch = 
        !effectiveSearch ||
        p.name.toLowerCase().includes(effectiveSearch) ||
        p.sku.toLowerCase().includes(effectiveSearch) ||
        p.barcode.toLowerCase().includes(effectiveSearch);
      return matchCat && matchSearch;
    });
  }, [products, selectedCategory, effectiveSearch]);

  // Filtered Customers for Autocomplete Dropdown
  const filteredCustomers = useMemo(() => {
    const q = customerSearchQuery.trim().toLowerCase();
    if (!q) return customers;
    return customers.filter(c => 
      c.name.toLowerCase().includes(q) ||
      (c.companyName && c.companyName.toLowerCase().includes(q)) ||
      c.phone.includes(q)
    );
  }, [customers, customerSearchQuery]);

  // Cart calculations
  const subtotal = useMemo(() => {
    return cart.reduce((acc, item) => acc + item.unitPrice * item.qty, 0);
  }, [cart]);

  const tax = useMemo(() => {
    return useTax ? Math.round(subtotal * 0.11) : 0;
  }, [useTax, subtotal]);

  const total = useMemo(() => {
    return Math.max(0, subtotal - discountAmount + tax);
  }, [subtotal, discountAmount, tax]);

  // Handle direct barcode scanner enter
  const handleBarcodeSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!barcodeInput.trim()) return;

    const term = barcodeInput.trim().toLowerCase();
    const found = products.find(
      p => p.barcode.toLowerCase() === term || p.sku.toLowerCase() === term
    );

    if (found) {
      if (found.stock <= 0) {
        alert(`Stok produk "${found.name}" habis (0 ${found.unit})!`);
      } else {
        const lastPrice = selectedCustomer ? getCustomerLastPrice(selectedCustomer.id, found.id) : undefined;
        addToCart(found, 1, lastPrice, selectedCustomer?.tier || 'STANDAR', lastPrice);
        setBarcodeInput('');
      }
    } else {
      alert(`Produk dengan Barcode/SKU "${barcodeInput}" tidak ditemukan.`);
    }
  };

  const handleSelectCustomer = (customer: Customer | null) => {
    setSelectedCustomer(customer);
    if (customer) {
      setCustomerSearchQuery(customer.companyName ? `${customer.name} (${customer.companyName})` : customer.name);
      applyCustomerToCart(customer);
    } else {
      setCustomerSearchQuery('');
      applyCustomerToCart(null);
    }
    setIsCustomerDropdownOpen(false);
  };

  const handleOpenAddCustomer = () => {
    setIsCustomerDropdownOpen(false);
    setNewCustomerForm({
      name: customerSearchQuery.trim() || '',
      companyName: '',
      phone: '',
      address: '',
      email: '',
      tier: 'STANDAR',
      notes: '',
    });
    setShowAddCustomerModal(true);
  };

  const handleSaveNewCustomer = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newCustomerForm.name.trim() || !newCustomerForm.phone.trim()) {
      alert('Nama pelanggan dan nomor telepon wajib diisi!');
      return;
    }

    const created = addCustomer({
      name: newCustomerForm.name.trim(),
      companyName: newCustomerForm.companyName.trim() || undefined,
      phone: newCustomerForm.phone.trim(),
      address: newCustomerForm.address.trim() || undefined,
      email: newCustomerForm.email.trim() || undefined,
      tier: newCustomerForm.tier,
      notes: newCustomerForm.notes.trim() || undefined,
    });

    handleSelectCustomer(created);
    setShowAddCustomerModal(false);
  };

  // Start inline price edit
  const handleStartPriceEdit = (productId: string, currentPrice: number) => {
    setEditingPriceProductId(productId);
    setCustomPriceInputVal(String(currentPrice));
  };

  // Save manual custom price
  const handleSaveCustomPrice = (productId: string) => {
    const val = Number(customPriceInputVal);
    if (!isNaN(val) && val >= 0) {
      updateCartItemPrice(productId, val, 'STANDAR', true);
    }
    setEditingPriceProductId(null);
  };

  const handleOpenPayment = () => {
    if (cart.length === 0) return;
    setCashGiven(total);
    setCheckoutError(null);
    setShowPaymentModal(true);
  };

  const handleProcessCheckout = () => {
    setCheckoutError(null);
    const res = checkout({
      paymentMethod,
      amountPaid: paymentMethod === 'CASH' ? cashGiven : total,
      customer: selectedCustomer,
      customerName: selectedCustomer ? selectedCustomer.name : (customerSearchQuery || 'Pelanggan Umum (Walk-in)'),
      discount: discountAmount,
      tax,
    });

    if (res.success && res.transaction) {
      confetti({
        particleCount: 80,
        spread: 70,
        origin: { y: 0.6 }
      });
      setShowPaymentModal(false);
      setCompletedTransaction(res.transaction);
      setDiscountAmount(0);
      setSelectedCustomer(null);
      setCustomerSearchQuery('');
    } else {
      setCheckoutError(res.error || 'Terjadi kesalahan saat memproses transaksi.');
    }
  };

  const quickCashPresets = [
    { label: 'Uang Pas', amount: total },
    { label: '50.000', amount: 50000 },
    { label: '100.000', amount: 100000 },
    { label: '200.000', amount: 200000 },
    { label: '500.000', amount: 500000 },
    { label: '1.000.000', amount: 1000000 },
    { label: '5.000.000', amount: 5000000 },
    { label: '10.000.000', amount: 10000000 },
  ];

  return (
    <div className="flex-1 flex flex-col lg:flex-row overflow-hidden h-[calc(100vh-57px)] bg-[#f3f4f6] dark:bg-[#18181b] transition-colors duration-200">
      
      {/* LEFT COLUMN: Product Catalog & Fast Grid */}
      <div className="flex-1 flex flex-col min-w-0 bg-[#f3f4f6] dark:bg-[#18181b] border-r border-slate-200 dark:border-slate-800">
        
        {/* Top Controls: Barcode scan input + Category Pills */}
        <div className="p-3.5 border-b border-slate-200 dark:border-slate-800 space-y-2.5 bg-white/80 dark:bg-slate-900/60 backdrop-blur-sm">
          
          <div className="flex flex-col sm:flex-row gap-2.5 items-stretch sm:items-center">
            {/* Direct Barcode Scanner Input */}
            <form onSubmit={handleBarcodeSubmit} className="relative flex-1">
              <Barcode className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-blue-600 dark:text-indigo-400" />
              <input
                type="text"
                placeholder="Scan Barcode / Ketik SKU lalu tekan ENTER..."
                value={barcodeInput}
                onChange={(e) => setBarcodeInput(e.target.value)}
                className="w-full pl-9 pr-20 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-indigo-500/40 focus:border-blue-600 dark:focus:border-indigo-400 rounded-xl text-xs sm:text-sm text-slate-900 dark:text-slate-100 placeholder-slate-400 dark:placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500/20 dark:focus:ring-indigo-500/30 font-mono transition-all shadow-xs"
              />
              <button 
                type="submit"
                className="absolute right-1.5 top-1/2 -translate-y-1/2 px-2.5 py-1 bg-blue-600 hover:bg-blue-500 dark:bg-indigo-600 dark:hover:bg-indigo-500 text-white text-[11px] font-semibold rounded-lg shadow-xs transition-colors cursor-pointer"
              >
                Scan (+1)
              </button>
            </form>

            {/* Quick in-view search */}
            <div className="relative sm:w-64">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-400" />
              <input
                type="text"
                placeholder="Filter nama produk..."
                value={localSearch}
                onChange={(e) => setLocalSearch(e.target.value)}
                className="w-full pl-8 pr-3 py-2 bg-slate-50 dark:bg-slate-800/80 border border-slate-300 dark:border-slate-700/80 rounded-xl text-xs text-slate-900 dark:text-slate-200 placeholder-slate-400 dark:placeholder-slate-500 focus:outline-none focus:border-blue-500 dark:focus:border-slate-500 transition-all shadow-xs"
              />
            </div>
          </div>

          {/* Horizontal Category Scroller */}
          <div className="flex items-center gap-1.5 overflow-x-auto pb-1 no-scrollbar text-xs">
            {CATEGORIES.map((cat) => {
              const active = selectedCategory === cat;
              return (
                <button
                  key={cat}
                  onClick={() => setSelectedCategory(cat)}
                  className={`px-3 py-1.5 rounded-xl whitespace-nowrap font-medium transition-all ${
                    active
                      ? 'bg-blue-600 dark:bg-indigo-600 text-white shadow-xs'
                      : 'bg-white dark:bg-slate-800/90 text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-750 border border-slate-200 dark:border-slate-700/60 shadow-xs'
                  }`}
                >
                  {cat === 'ALL' ? 'Semua Produk' : cat}
                </button>
              );
            })}
          </div>

        </div>

        {/* Product Cards Grid */}
        <div className="flex-1 overflow-y-auto p-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 2xl:grid-cols-4 gap-3">
            {filteredProducts.map((p) => {
              const inCart = cart.find((c) => c.product.id === p.id);
              const isOutOfStock = p.stock <= 0;
              const isLowStock = p.stock > 0 && p.stock <= p.minStock;
              const lastPurchasedPrice = selectedCustomer ? getCustomerLastPrice(selectedCustomer.id, p.id) : undefined;

              return (
                <div
                  key={p.id}
                  className={`group rounded-2xl p-3.5 border transition-all flex flex-col justify-between relative ${
                    isOutOfStock
                      ? 'bg-slate-100/60 dark:bg-slate-900/40 border-slate-200 dark:border-slate-800 opacity-60'
                      : inCart
                      ? 'bg-blue-50/70 dark:bg-indigo-950/20 border-blue-400 dark:border-indigo-500/40 shadow-xs'
                      : 'bg-white dark:bg-slate-800/60 hover:bg-white dark:hover:bg-slate-800 border-slate-200/90 dark:border-slate-700/70 hover:border-blue-400 dark:hover:border-slate-600 shadow-xs hover:shadow-md'
                  }`}
                >
                  <div>
                    {/* Header: Category & Stock Status */}
                    <div className="flex items-start justify-between gap-1.5 mb-2">
                      <span className="text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded-md bg-slate-100 dark:bg-slate-700/60 text-slate-600 dark:text-slate-300 truncate max-w-[130px]">
                        {p.category}
                      </span>
                      
                      {isOutOfStock ? (
                        <span className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-rose-100 dark:bg-rose-500/20 text-rose-700 dark:text-rose-300 border border-rose-200 dark:border-rose-500/30">
                          Habis
                        </span>
                      ) : isLowStock ? (
                        <span className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-amber-100 dark:bg-amber-500/20 text-amber-700 dark:text-amber-300 border border-amber-200 dark:border-amber-500/30">
                          Sisa {p.stock} {p.unit}
                        </span>
                      ) : (
                        <span className="text-[10px] font-semibold px-2 py-0.5 rounded-md bg-emerald-100 dark:bg-emerald-500/15 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-500/30">
                          Stok: {p.stock} {p.unit}
                        </span>
                      )}
                    </div>

                    {/* Product Name & SKU */}
                    <h4 className="font-semibold text-slate-900 dark:text-slate-100 text-xs sm:text-sm line-clamp-2 leading-snug group-hover:text-blue-600 dark:group-hover:text-indigo-300 transition-colors">
                      {p.name}
                    </h4>
                    <p className="text-[10px] font-mono text-slate-500 dark:text-slate-400 mt-1 flex items-center gap-1.5">
                      <span>{p.sku}</span>
                      <span>•</span>
                      <span>{p.barcode}</span>
                    </p>

                    {/* Prior Customer Price Indicator if exists */}
                    {lastPurchasedPrice && (
                      <div className="mt-1.5 flex items-center gap-1 text-[10px] text-amber-700 dark:text-amber-300 bg-amber-50 dark:bg-amber-950/30 px-2 py-0.5 rounded-md border border-amber-200 dark:border-amber-500/30">
                        <History className="w-3 h-3" />
                        <span>Histori {selectedCustomer?.name.split(' ')[0]}: {formatIDR(lastPurchasedPrice)}</span>
                      </div>
                    )}
                  </div>

                  {/* Price & Add to Cart action */}
                  <div className="mt-3 pt-2.5 border-t border-slate-100 dark:border-slate-700/60 flex items-center justify-between gap-2">
                    <div>
                      <p className="text-[10px] text-slate-400 dark:text-slate-500 leading-none">Harga Jual</p>
                      <p className="text-xs sm:text-sm font-bold text-slate-900 dark:text-slate-100 mt-0.5">
                        {formatIDR(p.sellPrice)}
                      </p>
                    </div>

                    <button
                      disabled={isOutOfStock}
                      onClick={() => addToCart(p, 1, lastPurchasedPrice, selectedCustomer?.tier || 'STANDAR', lastPurchasedPrice)}
                      className={`px-3 py-1.5 rounded-xl font-semibold text-xs flex items-center gap-1.5 transition-all cursor-pointer ${
                        isOutOfStock
                          ? 'bg-slate-200 dark:bg-slate-800 text-slate-400 dark:text-slate-500 cursor-not-allowed'
                          : inCart
                          ? 'bg-blue-600 hover:bg-blue-500 dark:bg-indigo-600 dark:hover:bg-indigo-500 text-white shadow-xs'
                          : 'bg-slate-100 dark:bg-slate-700 hover:bg-blue-600 dark:hover:bg-indigo-600 text-slate-700 dark:text-slate-200 hover:text-white'
                      }`}
                    >
                      <Plus className="w-3.5 h-3.5" />
                      <span>{inCart ? `+${inCart.qty}` : 'Tambah'}</span>
                    </button>
                  </div>

                </div>
              );
            })}
          </div>

          {filteredProducts.length === 0 && (
            <div className="p-12 text-center text-slate-400">
              <Filter className="w-10 h-10 mx-auto mb-3 text-slate-400 opacity-60" />
              <p className="font-semibold text-slate-700 dark:text-slate-300 text-sm">Tidak ada produk yang cocok</p>
              <p className="text-xs text-slate-500 mt-1">Coba ubah kata kunci pencarian atau kategori.</p>
            </div>
          )}
        </div>

      </div>

      {/* RIGHT COLUMN: Interactive Shopping Cart Sidebar */}
      <div className="w-full lg:w-96 flex flex-col bg-white dark:bg-[#1f1f23] shadow-lg border-l border-slate-200 dark:border-slate-800 shrink-0">
        
        {/* Cart Header */}
        <div className="p-3.5 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between bg-slate-50/50 dark:bg-slate-850/50">
          <div className="flex items-center gap-2">
            <ShoppingCart className="w-4 h-4 text-blue-600 dark:text-indigo-400" />
            <h3 className="font-bold text-sm text-slate-900 dark:text-slate-100">Keranjang Kasir</h3>
            <span className="text-[11px] font-bold px-2 py-0.5 rounded-full bg-blue-100 dark:bg-indigo-500/20 text-blue-700 dark:text-indigo-300 border border-blue-200 dark:border-indigo-500/30">
              {cart.reduce((a, b) => a + b.qty, 0)} Pcs
            </span>
          </div>
          {cart.length > 0 && (
            <button
              onClick={clearCart}
              className="text-[11px] text-rose-600 dark:text-rose-400 hover:text-rose-700 hover:bg-rose-50 dark:hover:bg-rose-500/10 px-2 py-1 rounded-lg flex items-center gap-1 transition-colors cursor-pointer"
            >
              <Trash2 className="w-3.5 h-3.5" />
              <span>Kosongkan</span>
            </button>
          )}
        </div>

        {/* MODUL 1: NAMA PELANGGAN (AUTOCOMPLETE & HISTORI) */}
        <div className="p-3.5 bg-slate-50/90 dark:bg-slate-850 border-b border-slate-200 dark:border-slate-800 relative" ref={customerDropdownRef}>
          <div className="flex items-center justify-between mb-1.5">
            <label className="text-[11px] font-bold text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
              <User className="w-3.5 h-3.5 text-blue-600 dark:text-indigo-400" />
              <span>Nama Pelanggan / PT Pembeli:</span>
            </label>
            {selectedCustomer && (
              <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full uppercase ${
                selectedCustomer.tier === 'VIP' 
                  ? 'bg-purple-100 dark:bg-purple-950/60 text-purple-700 dark:text-purple-300 border border-purple-200 dark:border-purple-500/40' 
                  : selectedCustomer.tier === 'GROSIR' 
                  ? 'bg-amber-100 dark:bg-amber-950/60 text-amber-700 dark:text-amber-300 border border-amber-200 dark:border-amber-500/40' 
                  : 'bg-blue-100 dark:bg-blue-950/60 text-blue-700 dark:text-blue-300'
              }`}>
                Tier: {selectedCustomer.tier === 'VIP' ? 'VIP / Khusus PT' : selectedCustomer.tier}
              </span>
            )}
          </div>

          {/* Autocomplete Search Input */}
          <div className="relative">
            <input
              type="text"
              placeholder="Pelanggan Umum (Walk-in)"
              value={customerSearchQuery}
              onFocus={() => setIsCustomerDropdownOpen(true)}
              onChange={(e) => {
                setCustomerSearchQuery(e.target.value);
                setIsCustomerDropdownOpen(true);
              }}
              className="w-full pl-3 pr-8 py-2 bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl text-xs text-slate-900 dark:text-slate-100 placeholder-slate-400 dark:placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20 dark:focus:ring-indigo-500/30 focus:border-blue-600 dark:focus:border-indigo-500 shadow-xs font-medium"
            />
            {selectedCustomer ? (
              <button
                type="button"
                onClick={() => handleSelectCustomer(null)}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-rose-600 p-0.5 rounded transition-colors"
                title="Hapus / Reset ke Pelanggan Umum"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            ) : (
              <button
                type="button"
                onClick={() => setIsCustomerDropdownOpen(!isCustomerDropdownOpen)}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
              >
                <ChevronDown className="w-3.5 h-3.5" />
              </button>
            )}
          </div>

          {/* Selected Customer Active Info Card */}
          {selectedCustomer && (
            <div className="mt-2 p-2 rounded-xl bg-blue-50/80 dark:bg-indigo-950/30 border border-blue-200 dark:border-indigo-500/30 flex items-center justify-between text-xs">
              <div className="truncate pr-2">
                <p className="font-bold text-blue-900 dark:text-indigo-200 truncate">{selectedCustomer.name}</p>
                <p className="text-[10px] text-slate-500 dark:text-slate-400 truncate flex items-center gap-1.5 mt-0.5">
                  {selectedCustomer.companyName && <span>🏢 {selectedCustomer.companyName}</span>}
                  <span>📞 {selectedCustomer.phone}</span>
                </p>
              </div>
              <span className="text-[10px] px-2 py-0.5 rounded-md font-bold bg-white dark:bg-slate-800 text-blue-700 dark:text-indigo-300 border border-blue-100 dark:border-slate-700 shrink-0">
                {selectedCustomer.tier === 'VIP' ? 'Diskon VIP -15%' : selectedCustomer.tier === 'GROSIR' ? 'Diskon Grosir -8%' : 'Standar'}
              </span>
            </div>
          )}

          {/* Autocomplete Dropdown List */}
          {isCustomerDropdownOpen && (
            <div className="absolute left-3 right-3 top-[74px] z-50 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl shadow-xl max-h-64 overflow-y-auto divide-y divide-slate-100 dark:divide-slate-750 p-1 animate-in fade-in zoom-in-95 duration-100">
              
              {/* Default Option: Pelanggan Umum */}
              <button
                type="button"
                onClick={() => handleSelectCustomer(null)}
                className={`w-full p-2.5 rounded-xl text-left text-xs transition-colors flex items-center justify-between cursor-pointer ${
                  !selectedCustomer ? 'bg-blue-50 dark:bg-indigo-950/40 text-blue-700 dark:text-indigo-300 font-bold' : 'text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-750'
                }`}
              >
                <div>
                  <p className="font-semibold">Pelanggan Umum (Walk-in)</p>
                  <p className="text-[10px] text-slate-400 font-normal">Harga normal retail standar tanpa kontrak</p>
                </div>
                {!selectedCustomer && <Check className="w-3.5 h-3.5 text-blue-600" />}
              </button>

              {/* Registered Customers List */}
              {filteredCustomers.map((cust) => {
                const isSelected = selectedCustomer?.id === cust.id;
                return (
                  <button
                    key={cust.id}
                    type="button"
                    onClick={() => handleSelectCustomer(cust)}
                    className={`w-full p-2.5 rounded-xl text-left text-xs transition-colors flex items-center justify-between cursor-pointer ${
                      isSelected ? 'bg-blue-50 dark:bg-indigo-950/40 text-blue-700 dark:text-indigo-300 font-bold' : 'text-slate-800 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-750'
                    }`}
                  >
                    <div className="truncate pr-2">
                      <div className="flex items-center gap-1.5">
                        <span className="font-bold truncate">{cust.name}</span>
                        <span className={`text-[9px] px-1.5 py-0.2 rounded font-bold uppercase ${
                          cust.tier === 'VIP' ? 'bg-purple-100 text-purple-700 dark:bg-purple-900/40 dark:text-purple-300' : cust.tier === 'GROSIR' ? 'bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-300' : 'bg-slate-200 text-slate-700 dark:bg-slate-700'
                        }`}>
                          {cust.tier}
                        </span>
                      </div>
                      <p className="text-[10px] text-slate-500 dark:text-slate-400 truncate mt-0.5">
                        {cust.companyName ? `🏢 ${cust.companyName} • ` : ''}📞 {cust.phone}
                      </p>
                    </div>
                    {isSelected && <Check className="w-4 h-4 text-blue-600 shrink-0" />}
                  </button>
                );
              })}

              {/* Action: Add New Customer */}
              <div className="p-1 pt-1.5">
                <button
                  type="button"
                  onClick={handleOpenAddCustomer}
                  className="w-full py-2 px-3 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold flex items-center justify-center gap-2 transition-colors cursor-pointer shadow-xs"
                >
                  <UserPlus className="w-3.5 h-3.5" />
                  <span>+ Tambah Pelanggan Baru</span>
                </button>
              </div>

            </div>
          )}
        </div>

        {/* MODUL 2: DAFTAR KERANJANG DENGAN CUSTOM PRICE & HARGA TERAKHIR */}
        <div className="flex-1 overflow-y-auto p-3 divide-y divide-slate-100 dark:divide-slate-800/80">
          {cart.map((item) => {
            const isEditingPrice = editingPriceProductId === item.product.id;
            const lastPrice = selectedCustomer ? getCustomerLastPrice(selectedCustomer.id, item.product.id) : undefined;
            const hasLastPrice = lastPrice !== undefined && lastPrice > 0;
            const isMatchingLastPrice = hasLastPrice && item.unitPrice === lastPrice;

            return (
              <div key={item.product.id} className="py-3 first:pt-0 last:pb-0 space-y-2">
                
                {/* Row 1: Product Name, Stepper & Trash */}
                <div className="flex items-start justify-between gap-2">
                  <div className="flex-1 min-w-0">
                    <h5 className="text-xs font-semibold text-slate-900 dark:text-slate-200 leading-tight">
                      {item.product.name}
                    </h5>
                    <p className="text-[10px] font-mono text-slate-400 mt-0.5">{item.product.sku}</p>
                  </div>

                  {/* Quantity Stepper */}
                  <div className="flex items-center gap-1 shrink-0 bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700/80 rounded-xl p-1">
                    <button
                      onClick={() => updateCartQty(item.product.id, item.qty - 1)}
                      className="w-6 h-6 rounded-lg bg-white dark:bg-slate-700/80 hover:bg-slate-200 dark:hover:bg-slate-600 flex items-center justify-center text-slate-700 dark:text-slate-200 transition-colors shadow-xs cursor-pointer"
                    >
                      <Minus className="w-3 h-3" />
                    </button>
                    <input
                      type="number"
                      min="1"
                      max={item.product.stock}
                      value={item.qty}
                      onChange={(e) => updateCartQty(item.product.id, parseInt(e.target.value) || 1)}
                      className="w-8 text-center font-bold text-xs bg-transparent text-slate-900 dark:text-slate-100 focus:outline-none"
                    />
                    <button
                      onClick={() => updateCartQty(item.product.id, item.qty + 1)}
                      disabled={item.qty >= item.product.stock}
                      className="w-6 h-6 rounded-lg bg-white dark:bg-slate-700/80 hover:bg-slate-200 dark:hover:bg-slate-600 disabled:opacity-40 disabled:cursor-not-allowed flex items-center justify-center text-slate-700 dark:text-slate-200 transition-colors shadow-xs cursor-pointer"
                    >
                      <Plus className="w-3 h-3" />
                    </button>
                  </div>

                  {/* Remove Button */}
                  <button
                    onClick={() => removeFromCart(item.product.id)}
                    className="text-slate-400 hover:text-rose-600 dark:hover:text-rose-400 p-1.5 transition-colors cursor-pointer"
                    title="Hapus item"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>

                {/* Row 2: Unit Price (Manual Edit / Custom Price) */}
                <div className="flex items-center justify-between text-xs bg-slate-50 dark:bg-slate-800/50 p-2 rounded-xl border border-slate-200/80 dark:border-slate-700/60">
                  <div className="flex items-center gap-1.5 flex-1 min-w-0">
                    <span className="text-[11px] text-slate-500 dark:text-slate-400 shrink-0">Harga Satuan:</span>
                    
                    {isEditingPrice ? (
                      /* Inline Price Input */
                      <div className="flex items-center gap-1 flex-1">
                        <span className="text-[11px] font-bold text-slate-500">Rp</span>
                        <input
                          type="number"
                          min="0"
                          autoFocus
                          value={customPriceInputVal}
                          onChange={(e) => setCustomPriceInputVal(e.target.value)}
                          onKeyDown={(e) => {
                            if (e.key === 'Enter') handleSaveCustomPrice(item.product.id);
                            if (e.key === 'Escape') setEditingPriceProductId(null);
                          }}
                          className="w-24 px-2 py-0.5 bg-white dark:bg-slate-900 border border-blue-500 rounded text-xs font-mono font-bold text-slate-900 dark:text-white focus:outline-none"
                        />
                        <button
                          onClick={() => handleSaveCustomPrice(item.product.id)}
                          className="p-1 rounded bg-emerald-600 text-white hover:bg-emerald-500 cursor-pointer"
                          title="Terapkan Harga Custom"
                        >
                          <Check className="w-3 h-3" />
                        </button>
                        <button
                          onClick={() => setEditingPriceProductId(null)}
                          className="p-1 rounded bg-slate-200 dark:bg-slate-700 text-slate-600 dark:text-slate-300 hover:bg-slate-300 cursor-pointer"
                          title="Batal"
                        >
                          <X className="w-3 h-3" />
                        </button>
                      </div>
                    ) : (
                      /* Static Price with Edit Trigger */
                      <div className="flex items-center gap-1.5 truncate">
                        <span className="font-mono font-bold text-slate-900 dark:text-white">
                          {formatIDR(item.unitPrice)}
                        </span>
                        <span className="text-[10px] text-slate-400">/{item.product.unit}</span>

                        <button
                          type="button"
                          onClick={() => handleStartPriceEdit(item.product.id, item.unitPrice)}
                          className="p-1 text-blue-600 dark:text-indigo-400 hover:bg-blue-100 dark:hover:bg-slate-700 rounded transition-colors cursor-pointer"
                          title="Ubah Harga Satuan Secara Manual (Custom Price)"
                        >
                          <Edit3 className="w-3 h-3" />
                        </button>

                        {item.customPriceApplied && (
                          <span className="text-[9px] px-1.5 py-0.2 rounded font-bold bg-amber-100 dark:bg-amber-900/50 text-amber-700 dark:text-amber-300 border border-amber-300 dark:border-amber-500/40">
                            Custom
                          </span>
                        )}
                      </div>
                    )}
                  </div>

                  {/* Subtotal on the right */}
                  <div className="text-right shrink-0">
                    <span className="font-bold text-blue-600 dark:text-indigo-400 font-mono text-sm">
                      {formatIDR(item.subtotal)}
                    </span>
                  </div>
                </div>

                {/* Row 3: Quick Price Tier Selector Pills */}
                <div className="flex items-center gap-1.5 text-[10px]">
                  <span className="text-slate-400 dark:text-slate-500 text-[10px] shrink-0">Tier:</span>
                  <div className="flex items-center gap-1 overflow-x-auto no-scrollbar">
                    {[
                      { id: 'STANDAR' as CustomerTier, label: 'Standar' },
                      { id: 'GROSIR' as CustomerTier, label: 'Grosir (-8%)' },
                      { id: 'VIP' as CustomerTier, label: 'VIP (-15%)' },
                    ].map(tier => {
                      const isActive = item.priceTier === tier.id && !item.customPriceApplied;
                      return (
                        <button
                          key={tier.id}
                          type="button"
                          onClick={() => updateCartPriceTier(item.product.id, tier.id, selectedCustomer?.id)}
                          className={`px-2 py-0.5 rounded-md font-semibold transition-all cursor-pointer ${
                            isActive
                              ? 'bg-blue-600 text-white shadow-xs'
                              : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700'
                          }`}
                        >
                          {tier.label}
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* Row 4: Pengingat Harga Terakhir Pelanggan (Customer Last Purchased Price Alert) */}
                {hasLastPrice && (
                  <div className={`flex items-center justify-between p-2 rounded-xl text-[10px] border ${
                    isMatchingLastPrice
                      ? 'bg-emerald-50 dark:bg-emerald-950/20 border-emerald-200 dark:border-emerald-500/30 text-emerald-800 dark:text-emerald-300'
                      : 'bg-amber-50 dark:bg-amber-950/20 border-amber-200 dark:border-amber-500/30 text-amber-800 dark:text-amber-300'
                  }`}>
                    <div className="flex items-center gap-1.5 truncate pr-1">
                      <History className={`w-3.5 h-3.5 shrink-0 ${isMatchingLastPrice ? 'text-emerald-600' : 'text-amber-600'}`} />
                      <span className="truncate">
                        Harga Terakhir Beli ({selectedCustomer?.name.split(' ')[0]}): <strong className="font-mono">{formatIDR(lastPrice)}</strong>
                      </span>
                    </div>

                    {!isMatchingLastPrice ? (
                      <button
                        type="button"
                        onClick={() => updateCartItemPrice(item.product.id, lastPrice, selectedCustomer?.tier, true)}
                        className="px-2 py-0.5 rounded-md bg-amber-600 hover:bg-amber-700 text-white font-bold shrink-0 transition-colors shadow-xs cursor-pointer"
                        title="Terapkan harga yang pernah dibeli pelanggan ini"
                      >
                        Terapkan
                      </button>
                    ) : (
                      <span className="flex items-center gap-0.5 text-emerald-600 dark:text-emerald-400 font-bold shrink-0">
                        <CheckCircle2 className="w-3 h-3" />
                        Aktif
                      </span>
                    )}
                  </div>
                )}

              </div>
            );
          })}

          {cart.length === 0 && (
            <div className="h-full flex flex-col items-center justify-center text-center p-8 text-slate-400 dark:text-slate-500">
              <ShoppingCart className="w-10 h-10 mb-2 opacity-30 text-blue-600 dark:text-indigo-400" />
              <p className="text-xs font-semibold text-slate-700 dark:text-slate-400">Keranjang kasir masih kosong</p>
              <p className="text-[11px] text-slate-500 dark:text-slate-600 mt-1">Pilih produk di katalog atau scan barcode untuk menambahkan.</p>
            </div>
          )}
        </div>

        {/* Pricing Summary & Checkout Button */}
        <div className="p-4 bg-slate-50/90 dark:bg-slate-850 border-t border-slate-200 dark:border-slate-800 space-y-2.5">
          
          <div className="space-y-1.5 text-xs text-slate-600 dark:text-slate-400">
            <div className="flex justify-between">
              <span>Subtotal:</span>
              <span className="text-slate-900 dark:text-slate-200 font-semibold">{formatIDR(subtotal)}</span>
            </div>

            {/* Discount Row */}
            <div className="flex items-center justify-between">
              <span>Potongan / Diskon:</span>
              <div className="flex items-center gap-1">
                <span className="text-slate-400 text-[11px]">Rp</span>
                <input
                  type="number"
                  min="0"
                  max={subtotal}
                  value={discountAmount || ''}
                  onChange={(e) => setDiscountAmount(Math.max(0, parseInt(e.target.value) || 0))}
                  placeholder="0"
                  className="w-24 text-right px-2 py-0.5 bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded text-xs text-emerald-600 dark:text-emerald-400 font-semibold focus:outline-none"
                />
              </div>
            </div>

            {/* Tax Row */}
            <div className="flex items-center justify-between">
              <label className="flex items-center gap-1.5 cursor-pointer">
                <input
                  type="checkbox"
                  checked={useTax}
                  onChange={(e) => setUseTax(e.target.checked)}
                  className="rounded border-slate-300 dark:border-slate-700 text-blue-600 focus:ring-0"
                />
                <span>PPN 11%</span>
              </label>
              <span className="text-slate-800 dark:text-slate-200 font-medium">{formatIDR(tax)}</span>
            </div>

            {/* Total Grand */}
            <div className="flex justify-between items-baseline pt-2 border-t border-slate-200 dark:border-slate-700/80 text-sm">
              <span className="font-bold text-slate-800 dark:text-slate-200">TOTAL BAYAR:</span>
              <span className="text-xl font-black text-blue-600 dark:text-indigo-400 tracking-tight">
                {formatIDR(total)}
              </span>
            </div>
          </div>

          {/* Action Trigger */}
          <button
            disabled={cart.length === 0}
            onClick={handleOpenPayment}
            className="w-full py-3 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 disabled:from-slate-300 disabled:to-slate-300 dark:disabled:from-slate-800 dark:disabled:to-slate-800 disabled:text-slate-400 dark:disabled:text-slate-600 text-white font-bold text-sm shadow-md shadow-emerald-600/20 disabled:shadow-none flex items-center justify-center gap-2 transition-all cursor-pointer"
          >
            <Banknote className="w-5 h-5" />
            <span>Bayar Transaksi ({cart.length} Produk)</span>
            <ArrowRight className="w-4 h-4 ml-1" />
          </button>

        </div>

      </div>

      {/* MODAL TAMBAH PELANGGAN BARU */}
      {showAddCustomerModal && (
        <div className="fixed inset-0 z-50 bg-black/60 dark:bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto animate-in fade-in duration-150">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 w-full max-w-md rounded-2xl shadow-2xl overflow-hidden flex flex-col my-auto text-slate-800 dark:text-slate-100">
            
            <div className="px-5 py-4 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between bg-slate-50 dark:bg-slate-800/80">
              <div className="flex items-center gap-2">
                <UserPlus className="w-5 h-5 text-blue-600 dark:text-indigo-400" />
                <h3 className="font-bold text-slate-900 dark:text-slate-100 text-sm">Tambah Pelanggan Baru</h3>
              </div>
              <button 
                onClick={() => setShowAddCustomerModal(false)}
                className="text-slate-400 hover:text-slate-700 dark:hover:text-white cursor-pointer"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleSaveNewCustomer} className="p-5 space-y-3.5 text-xs">
              <div>
                <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Nama Pelanggan / PIC *
                </label>
                <input
                  type="text"
                  required
                  placeholder="Contoh: Bpk. Budi Santoso"
                  value={newCustomerForm.name}
                  onChange={(e) => setNewCustomerForm({ ...newCustomerForm, name: e.target.value })}
                  className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white focus:outline-none focus:border-blue-600 shadow-xs"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Nama Perusahaan / PT Pembeli (Opsional)
                </label>
                <input
                  type="text"
                  placeholder="Contoh: PT Kemasan Mandiri Sejahtera"
                  value={newCustomerForm.companyName}
                  onChange={(e) => setNewCustomerForm({ ...newCustomerForm, companyName: e.target.value })}
                  className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white focus:outline-none focus:border-blue-600 shadow-xs"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    No. Telepon / WhatsApp *
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="0812-xxxx-xxxx"
                    value={newCustomerForm.phone}
                    onChange={(e) => setNewCustomerForm({ ...newCustomerForm, phone: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white focus:outline-none focus:border-blue-600 shadow-xs"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Tingkat Harga Default
                  </label>
                  <select
                    value={newCustomerForm.tier}
                    onChange={(e) => setNewCustomerForm({ ...newCustomerForm, tier: e.target.value as CustomerTier })}
                    className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white focus:outline-none focus:border-blue-600 shadow-xs"
                  >
                    <option value="STANDAR">STANDAR (Harga Normal)</option>
                    <option value="GROSIR">GROSIR (Diskon 8%)</option>
                    <option value="VIP">VIP / Khusus PT (Diskon 15%)</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Alamat Pengiriman / Gudang
                </label>
                <textarea
                  rows={2}
                  placeholder="Kawasan Industri MM2100, Cikarang..."
                  value={newCustomerForm.address}
                  onChange={(e) => setNewCustomerForm({ ...newCustomerForm, address: e.target.value })}
                  className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white focus:outline-none focus:border-blue-600 shadow-xs"
                />
              </div>

              <div className="pt-2 flex items-center justify-end gap-2 border-t border-slate-200 dark:border-slate-800">
                <button
                  type="button"
                  onClick={() => setShowAddCustomerModal(false)}
                  className="px-4 py-2 rounded-xl border border-slate-300 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 font-semibold cursor-pointer"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-bold shadow-md cursor-pointer"
                >
                  Simpan & Pilih Pelanggan
                </button>
              </div>
            </form>

          </div>
        </div>
      )}

      {/* PAYMENT MODAL (POPUP) */}
      {showPaymentModal && (
        <div className="fixed inset-0 z-50 bg-black/60 dark:bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto animate-in fade-in duration-150">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 w-full max-w-lg rounded-2xl shadow-2xl overflow-hidden flex flex-col my-auto text-slate-800 dark:text-slate-100">
            
            <div className="px-5 py-4 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between bg-slate-50 dark:bg-slate-800/80">
              <div className="flex items-center gap-2">
                <Receipt className="w-5 h-5 text-blue-600 dark:text-indigo-400" />
                <h3 className="font-bold text-slate-900 dark:text-slate-100 text-sm">Pembayaran Kasir POS</h3>
              </div>
              <button 
                onClick={() => setShowPaymentModal(false)}
                className="text-slate-400 hover:text-slate-700 dark:hover:text-white cursor-pointer"
              >
                ✕
              </button>
            </div>

            <div className="p-5 space-y-4">
              
              {/* Total Banner */}
              <div className="p-4 rounded-xl bg-blue-50 dark:bg-indigo-950/40 border border-blue-200 dark:border-indigo-500/30 text-center">
                <p className="text-xs text-blue-700 dark:text-indigo-300 font-semibold">Tagihan Pembayaran</p>
                <p className="text-2xl sm:text-3xl font-black text-slate-900 dark:text-white tracking-tight mt-1">
                  {formatIDR(total)}
                </p>
                <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-1">
                  {selectedCustomer 
                    ? `Pelanggan: ${selectedCustomer.name} ${selectedCustomer.companyName ? `(${selectedCustomer.companyName})` : ''} [${selectedCustomer.tier}]` 
                    : (customerSearchQuery ? `Pelanggan: ${customerSearchQuery}` : 'Pelanggan: Umum (Walk-in)')
                  } • {cart.length} Jenis Item
                </p>
              </div>

              {/* Payment Methods */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-2">Metode Pembayaran:</label>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                  {[
                    { id: 'CASH', label: 'Tunai (Cash)', icon: Banknote },
                    { id: 'QRIS', label: 'QRIS Statis', icon: QrCode },
                    { id: 'TRANSFER', label: 'Bank Transfer', icon: CreditCard },
                    { id: 'DEBIT', label: 'Debit EDC', icon: CreditCard },
                  ].map((pm) => {
                    const active = paymentMethod === pm.id;
                    const Icon = pm.icon;
                    return (
                      <button
                        key={pm.id}
                        type="button"
                        onClick={() => setPaymentMethod(pm.id as any)}
                        className={`p-3 rounded-xl border text-center transition-all cursor-pointer ${
                          active
                            ? 'bg-blue-600 text-white border-blue-600 shadow-md shadow-blue-500/20'
                            : 'bg-slate-50 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-750'
                        }`}
                      >
                        <Icon className="w-5 h-5 mx-auto mb-1.5" />
                        <span className="text-[11px] font-bold block leading-tight">{pm.label}</span>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Cash given & Change logic */}
              {paymentMethod === 'CASH' && (
                <div className="space-y-3 pt-2 border-t border-slate-200 dark:border-slate-800">
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                      Uang Diterima dari Pelanggan (Rp):
                    </label>
                    <div className="relative">
                      <span className="absolute left-3 top-1/2 -translate-y-1/2 font-bold text-slate-400">Rp</span>
                      <input
                        type="number"
                        min="0"
                        value={cashGiven || ''}
                        onChange={(e) => setCashGiven(Number(e.target.value) || 0)}
                        placeholder="0"
                        className="w-full pl-10 pr-3 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl text-base font-black text-slate-900 dark:text-white font-mono focus:outline-none focus:border-blue-600 shadow-xs"
                      />
                    </div>
                  </div>

                  {/* Cash Quick Presets */}
                  <div className="flex flex-wrap gap-1.5">
                    {quickCashPresets.map((preset, idx) => (
                      <button
                        key={idx}
                        type="button"
                        onClick={() => setCashGiven(preset.amount)}
                        className="px-2.5 py-1 text-[11px] font-medium rounded-lg bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700 cursor-pointer"
                      >
                        {preset.label}
                      </button>
                    ))}
                  </div>

                  {/* Change calculation */}
                  <div className="p-3 rounded-xl bg-slate-100 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700/60 flex items-center justify-between">
                    <span className="text-xs font-semibold text-slate-700 dark:text-slate-300">Kembalian:</span>
                    <span className={`text-base font-black font-mono ${cashGiven >= total ? 'text-emerald-600 dark:text-emerald-400' : 'text-rose-600 dark:text-rose-400'}`}>
                      {cashGiven >= total ? formatIDR(cashGiven - total) : `Kurang ${formatIDR(total - cashGiven)}`}
                    </span>
                  </div>
                </div>
              )}

              {checkoutError && (
                <div className="p-3 rounded-xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-500/30 text-rose-700 dark:text-rose-300 text-xs flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 shrink-0" />
                  <span>{checkoutError}</span>
                </div>
              )}

              {/* Confirm Checkout Button */}
              <div className="pt-2">
                <button
                  type="button"
                  disabled={paymentMethod === 'CASH' && cashGiven < total}
                  onClick={handleProcessCheckout}
                  className="w-full py-3 rounded-xl bg-emerald-600 hover:bg-emerald-500 disabled:bg-slate-300 dark:disabled:bg-slate-800 text-white font-bold text-sm shadow-md shadow-emerald-600/20 disabled:shadow-none flex items-center justify-center gap-2 transition-all cursor-pointer"
                >
                  <Check className="w-5 h-5" />
                  <span>Selesaikan & Cetak Struk (Faktur)</span>
                </button>
              </div>

            </div>

          </div>
        </div>
      )}

      {/* THERMAL RECEIPT MODAL */}
      {completedTransaction && (
        <ReceiptModal
          transaction={completedTransaction}
          onClose={() => setCompletedTransaction(null)}
        />
      )}

    </div>
  );
};
