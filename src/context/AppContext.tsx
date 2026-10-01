import React, { createContext, useContext, useState, useEffect } from 'react';
import { 
  Product, 
  StockMutation, 
  SaleTransaction, 
  CartItem, 
  User, 
  UserRole,
  MutationReferenceType,
  ProductCategory,
  Customer,
  CustomerTier,
  CustomerSpecialPrice
} from '../types';
import { 
  INITIAL_PRODUCTS, 
  INITIAL_MUTATIONS, 
  INITIAL_USERS,
  INITIAL_CUSTOMERS,
  INITIAL_CUSTOMER_SPECIAL_PRICES
} from '../data/seedData';

export interface CheckoutParams {
  paymentMethod: 'CASH' | 'QRIS' | 'TRANSFER' | 'DEBIT';
  amountPaid: number;
  customer?: Customer | null;
  customerName?: string;
  discount?: number;
  tax?: number;
}

export const calculateTierPrice = (basePrice: number, tier: CustomerTier, customPrice?: number): number => {
  if (customPrice && customPrice > 0) return customPrice;
  switch (tier) {
    case 'VIP':
      return Math.round(basePrice * 0.85); // 15% VIP / Khusus PT discount
    case 'GROSIR':
      return Math.round(basePrice * 0.92); // 8% Grosir discount
    case 'STANDAR':
    default:
      return basePrice;
  }
};

interface StockInParams {
  productId: string;
  qty: number;
  unitCost: number;
  referenceNo: string;
  supplierName: string;
  notes: string;
}

interface StockOutParams {
  productId: string;
  qty: number;
  reason: 'OPERATIONAL' | 'DAMAGED' | 'LOST' | 'EXPIRED' | 'OTHER';
  referenceNo: string;
  notes: string;
}

interface AppContextType {
  products: Product[];
  mutations: StockMutation[];
  sales: SaleTransaction[];
  currentUser: User;
  cart: CartItem[];
  users: User[];
  customers: Customer[];
  customerSpecialPrices: CustomerSpecialPrice[];
  
  // Cart Actions
  addToCart: (product: Product, qty?: number, customPrice?: number, tier?: CustomerTier, lastPurchasedPrice?: number) => boolean;
  updateCartQty: (productId: string, qty: number) => void;
  updateCartItemPrice: (productId: string, newUnitPrice: number, tier?: CustomerTier, isCustom?: boolean) => void;
  updateCartPriceTier: (productId: string, tier: CustomerTier, customerId?: string) => void;
  applyCustomerToCart: (customer: Customer | null) => void;
  removeFromCart: (productId: string) => void;
  clearCart: () => void;
  
  // Customer Actions
  addCustomer: (customerData: Omit<Customer, 'id' | 'createdAt'>) => Customer;
  getCustomerLastPrice: (customerId: string, productId: string) => number | undefined;
  
  // Checkout
  checkout: (params: CheckoutParams) => { success: boolean; transaction?: SaleTransaction; error?: string };
  
  // Product Actions
  addProduct: (product: Omit<Product, 'id' | 'createdAt' | 'updatedAt'>) => Product;
  updateProduct: (id: string, product: Partial<Product>) => void;
  deleteProduct: (id: string) => void;
  
  // Inventory Movements
  recordStockIn: (params: StockInParams) => boolean;
  recordStockOut: (params: StockOutParams) => { success: boolean; error?: string };
  
  // User & RBAC
  setCurrentUserRole: (role: UserRole) => void;
  
  // Windows Theme (Light / Dark)
  theme: 'light' | 'dark';
  toggleTheme: () => void;
  setTheme: (theme: 'light' | 'dark') => void;

  // Sidebar Collapse / Expand (Minimize)
  sidebarCollapsed: boolean;
  toggleSidebar: () => void;
  setSidebarCollapsed: (collapsed: boolean) => void;

  // Utilities
  resetToDefaultData: () => void;
  getLowStockProducts: () => Product[];
  getOutOfStockProducts: () => Product[];
}

const AppContext = createContext<AppContextType | undefined>(undefined);

const STORAGE_KEYS = {
  PRODUCTS: 'simpos_products_v2',
  MUTATIONS: 'simpos_mutations_v2',
  SALES: 'simpos_sales_v1',
  USER_ROLE: 'simpos_user_role_v1',
  THEME: 'simpos_theme_v1',
  SIDEBAR_COLLAPSED: 'simpos_sidebar_collapsed_v1',
  CUSTOMERS: 'simpos_customers_v1',
  CUSTOMER_PRICES: 'simpos_customer_prices_v1',
};

export const AppProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [theme, setThemeState] = useState<'light' | 'dark'>(() => {
    const saved = localStorage.getItem(STORAGE_KEYS.THEME) as 'light' | 'dark';
    return saved === 'dark' ? 'dark' : 'light';
  });

  const [sidebarCollapsed, setSidebarCollapsedState] = useState<boolean>(() => {
    return localStorage.getItem(STORAGE_KEYS.SIDEBAR_COLLAPSED) === 'true';
  });

  const toggleSidebar = () => {
    setSidebarCollapsedState(prev => {
      const next = !prev;
      localStorage.setItem(STORAGE_KEYS.SIDEBAR_COLLAPSED, String(next));
      return next;
    });
  };

  const setSidebarCollapsed = (collapsed: boolean) => {
    setSidebarCollapsedState(collapsed);
    localStorage.setItem(STORAGE_KEYS.SIDEBAR_COLLAPSED, String(collapsed));
  };

  const [products, setProducts] = useState<Product[]>(() => {
    // Check v2 or migrate v1
    const savedV2 = localStorage.getItem(STORAGE_KEYS.PRODUCTS);
    if (savedV2) {
      try {
        const parsed = JSON.parse(savedV2);
        return parsed.map((p: Product) => ({
          ...p,
          buyPrice: 0,
        }));
      } catch (e) { console.error(e); }
    }
    // Also clean up v1 if present
    localStorage.removeItem('simpos_products_v1');
    return INITIAL_PRODUCTS;
  });

  const [mutations, setMutations] = useState<StockMutation[]>(() => {
    const saved = localStorage.getItem(STORAGE_KEYS.MUTATIONS);
    if (saved) {
      try { return JSON.parse(saved); } catch (e) { console.error(e); }
    }
    return INITIAL_MUTATIONS;
  });

  const [sales, setSales] = useState<SaleTransaction[]>(() => {
    const saved = localStorage.getItem(STORAGE_KEYS.SALES);
    if (saved) {
      try { return JSON.parse(saved); } catch (e) { console.error(e); }
    }
    return [];
  });

  const [currentUserRole, setCurrentUserRoleState] = useState<UserRole>(() => {
    const saved = localStorage.getItem(STORAGE_KEYS.USER_ROLE) as UserRole;
    return saved && ['ADMIN', 'KASIR', 'GUDANG'].includes(saved) ? saved : 'ADMIN';
  });

  const [customers, setCustomers] = useState<Customer[]>(() => {
    const saved = localStorage.getItem(STORAGE_KEYS.CUSTOMERS);
    if (saved) {
      try { return JSON.parse(saved); } catch (e) { console.error(e); }
    }
    return INITIAL_CUSTOMERS;
  });

  const [customerSpecialPrices, setCustomerSpecialPrices] = useState<CustomerSpecialPrice[]>(() => {
    const saved = localStorage.getItem(STORAGE_KEYS.CUSTOMER_PRICES);
    if (saved) {
      try { return JSON.parse(saved); } catch (e) { console.error(e); }
    }
    return INITIAL_CUSTOMER_SPECIAL_PRICES;
  });

  const [cart, setCart] = useState<CartItem[]>([]);

  // Apply theme to document element
  useEffect(() => {
    localStorage.setItem(STORAGE_KEYS.THEME, theme);
    const root = document.documentElement;
    if (theme === 'dark') {
      root.classList.add('dark');
      root.classList.remove('light');
      document.body.className = 'bg-slate-900 text-slate-100 font-sans antialiased selection:bg-indigo-500 selection:text-white';
    } else {
      root.classList.remove('dark');
      root.classList.add('light');
      document.body.className = 'bg-[#f3f4f6] text-slate-900 font-sans antialiased selection:bg-blue-500 selection:text-white';
    }
  }, [theme]);

  const toggleTheme = () => {
    setThemeState(prev => (prev === 'light' ? 'dark' : 'light'));
  };

  const setTheme = (newTheme: 'light' | 'dark') => {
    setThemeState(newTheme);
  };

  // Sync to local storage
  useEffect(() => {
    localStorage.setItem(STORAGE_KEYS.PRODUCTS, JSON.stringify(products));
  }, [products]);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEYS.MUTATIONS, JSON.stringify(mutations));
  }, [mutations]);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEYS.SALES, JSON.stringify(sales));
  }, [sales]);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEYS.USER_ROLE, currentUserRole);
  }, [currentUserRole]);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEYS.CUSTOMERS, JSON.stringify(customers));
  }, [customers]);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEYS.CUSTOMER_PRICES, JSON.stringify(customerSpecialPrices));
  }, [customerSpecialPrices]);

  const currentUser = INITIAL_USERS.find(u => u.role === currentUserRole) || INITIAL_USERS[0];

  const setCurrentUserRole = (role: UserRole) => {
    setCurrentUserRoleState(role);
  };

  // Customer Management
  const addCustomer = (customerData: Omit<Customer, 'id' | 'createdAt'>): Customer => {
    const newCustomer: Customer = {
      ...customerData,
      id: `cust-${Date.now()}`,
      createdAt: new Date().toISOString(),
    };
    setCustomers(prev => [newCustomer, ...prev]);
    return newCustomer;
  };

  const getCustomerLastPrice = (customerId: string, productId: string): number | undefined => {
    const found = customerSpecialPrices.find(
      csp => csp.customerId === customerId && csp.productId === productId
    );
    return found ? (found.lastPurchasedPrice || found.customPrice) : undefined;
  };

  // Cart operations
  const addToCart = (
    product: Product, 
    qty: number = 1, 
    customPrice?: number, 
    tier: CustomerTier = 'STANDAR', 
    lastPurchasedPrice?: number
  ): boolean => {
    const existing = cart.find(item => item.product.id === product.id);
    const currentQtyInCart = existing ? existing.qty : 0;
    const requestedTotal = currentQtyInCart + qty;

    if (requestedTotal > product.stock) {
      return false; // Not enough stock
    }

    const price = customPrice !== undefined && customPrice > 0 
      ? customPrice 
      : calculateTierPrice(product.sellPrice, tier);

    if (existing) {
      setCart(prev => prev.map(item => 
        item.product.id === product.id 
          ? { 
              ...item, 
              qty: item.qty + qty,
              subtotal: (item.qty + qty) * item.unitPrice - item.discount
            }
          : item
      ));
    } else {
      setCart(prev => [
        ...prev,
        {
          product,
          qty,
          unitPrice: price,
          originalPrice: product.sellPrice,
          priceTier: tier,
          customPriceApplied: customPrice !== undefined && customPrice !== product.sellPrice,
          lastPurchasedPrice,
          discount: 0,
          subtotal: qty * price,
        }
      ]);
    }
    return true;
  };

  const updateCartQty = (productId: string, qty: number) => {
    const prod = products.find(p => p.id === productId);
    if (!prod) return;

    if (qty <= 0) {
      removeFromCart(productId);
      return;
    }

    if (qty > prod.stock) {
      qty = prod.stock;
    }

    setCart(prev => prev.map(item => {
      if (item.product.id === productId) {
        return {
          ...item,
          qty,
          subtotal: qty * item.unitPrice - item.discount,
        };
      }
      return item;
    }));
  };

  const updateCartItemPrice = (productId: string, newUnitPrice: number, tier?: CustomerTier, isCustom: boolean = true) => {
    setCart(prev => prev.map(item => {
      if (item.product.id === productId) {
        const safePrice = Math.max(0, newUnitPrice);
        return {
          ...item,
          unitPrice: safePrice,
          priceTier: tier || item.priceTier,
          customPriceApplied: isCustom,
          subtotal: item.qty * safePrice - item.discount,
        };
      }
      return item;
    }));
  };

  const updateCartPriceTier = (productId: string, tier: CustomerTier, customerId?: string) => {
    setCart(prev => prev.map(item => {
      if (item.product.id === productId) {
        let specialPrice: number | undefined;
        if (customerId) {
          const spec = customerSpecialPrices.find(csp => csp.customerId === customerId && csp.productId === productId);
          if (spec) specialPrice = spec.customPrice;
        }
        const newPrice = calculateTierPrice(item.originalPrice, tier, specialPrice);
        return {
          ...item,
          priceTier: tier,
          unitPrice: newPrice,
          customPriceApplied: false,
          subtotal: item.qty * newPrice - item.discount,
        };
      }
      return item;
    }));
  };

  const applyCustomerToCart = (customer: Customer | null) => {
    if (!customer) {
      setCart(prev => prev.map(item => ({
        ...item,
        lastPurchasedPrice: undefined,
      })));
      return;
    }

    setCart(prev => prev.map(item => {
      const spec = customerSpecialPrices.find(
        csp => csp.customerId === customer.id && csp.productId === item.product.id
      );
      const lastPrice = spec ? (spec.lastPurchasedPrice || spec.customPrice) : undefined;
      
      let newUnitPrice = item.unitPrice;
      let newTier = item.priceTier;
      
      if (!item.customPriceApplied) {
        newTier = customer.tier;
        newUnitPrice = calculateTierPrice(item.originalPrice, customer.tier, spec?.customPrice);
      }

      return {
        ...item,
        priceTier: newTier,
        unitPrice: newUnitPrice,
        lastPurchasedPrice: lastPrice,
        subtotal: item.qty * newUnitPrice - item.discount,
      };
    }));
  };

  const removeFromCart = (productId: string) => {
    setCart(prev => prev.filter(item => item.product.id !== productId));
  };

  const clearCart = () => {
    setCart([]);
  };

  // Atomic Checkout Process
  const checkout = (params: CheckoutParams): { success: boolean; transaction?: SaleTransaction; error?: string } => {
    if (cart.length === 0) {
      return { success: false, error: 'Keranjang belanja kosong' };
    }

    // 1. Validation check for stock sufficiency
    for (const item of cart) {
      const prod = products.find(p => p.id === item.product.id);
      if (!prod || prod.stock < item.qty) {
        return { 
          success: false, 
          error: `Stok produk "${item.product.name}" tidak mencukupi (Tersedia: ${prod ? prod.stock : 0}, Diminta: ${item.qty})` 
        };
      }
    }

    const subtotal = cart.reduce((acc, item) => acc + (item.unitPrice * item.qty), 0);
    const discount = params.discount || 0;
    const tax = params.tax || 0;
    const total = Math.max(0, subtotal - discount + tax);

    if (params.paymentMethod === 'CASH' && params.amountPaid < total) {
      return { 
        success: false, 
        error: `Nominal tunai tidak cukup. Total: Rp ${total.toLocaleString('id-ID')}, Dibayar: Rp ${params.amountPaid.toLocaleString('id-ID')}` 
      };
    }

    const change = params.paymentMethod === 'CASH' ? Math.max(0, params.amountPaid - total) : 0;
    const now = new Date();
    const invoiceNumber = `INV-${now.getFullYear()}${String(now.getMonth() + 1).padStart(2, '0')}${String(now.getDate()).padStart(2, '0')}-${String(sales.length + 1).padStart(4, '0')}`;

    // 2. Prepare items & mutation records
    const saleItems = cart.map(item => {
      const profit = (item.unitPrice - (item.product.buyPrice || 0)) * item.qty;
      return {
        id: `si-${Date.now()}-${item.product.id}`,
        productId: item.product.id,
        productName: item.product.name,
        sku: item.product.sku,
        unit: item.product.unit,
        buyPrice: item.product.buyPrice,
        sellPrice: item.unitPrice,
        originalPrice: item.originalPrice,
        priceTier: item.priceTier,
        customPriceApplied: item.customPriceApplied,
        qty: item.qty,
        subtotal: item.unitPrice * item.qty,
        profit,
      };
    });

    const custName = params.customer ? params.customer.name : (params.customerName?.trim() || 'Pelanggan Umum (Walk-in)');

    const newTransaction: SaleTransaction = {
      id: `trx-${Date.now()}`,
      invoiceNumber,
      items: saleItems,
      subtotal,
      discount,
      tax,
      total,
      paymentMethod: params.paymentMethod,
      amountPaid: params.paymentMethod === 'CASH' ? params.amountPaid : total,
      change,
      customerId: params.customer?.id,
      customerName: custName,
      customerCompany: params.customer?.companyName,
      customerTier: params.customer?.tier || 'STANDAR',
      cashierName: currentUser.name,
      createdAt: now.toISOString(),
    };

    // Update Customer Last Purchased Price history
    if (params.customer) {
      const custId = params.customer.id;
      setCustomerSpecialPrices(prev => {
        const next = [...prev];
        for (const item of cart) {
          const idx = next.findIndex(p => p.customerId === custId && p.productId === item.product.id);
          const newEntry: CustomerSpecialPrice = {
            id: idx >= 0 ? next[idx].id : `csp-${Date.now()}-${item.product.id}`,
            customerId: custId,
            productId: item.product.id,
            customPrice: item.unitPrice,
            lastPurchasedPrice: item.unitPrice,
            lastPurchasedDate: now.toISOString().slice(0, 10),
            note: `Faktur #${invoiceNumber}`
          };
          if (idx >= 0) {
            next[idx] = newEntry;
          } else {
            next.push(newEntry);
          }
        }
        return next;
      });
    }

    // 3. Atomically update product stock and create stock mutation ledger
    const newMutations: StockMutation[] = [];
    const updatedProducts = products.map(prod => {
      const cartItem = cart.find(ci => ci.product.id === prod.id);
      if (cartItem) {
        const prevStock = prod.stock;
        const nextStock = prevStock - cartItem.qty;

        newMutations.push({
          id: `mut-${Date.now()}-${prod.id}`,
          productId: prod.id,
          productName: prod.name,
          sku: prod.sku,
          type: 'OUT',
          referenceType: 'SALE',
          referenceNumber: invoiceNumber,
          qty: cartItem.qty,
          previousStock: prevStock,
          currentStock: nextStock,
          notes: `Penjualan POS #${invoiceNumber} (Kasir: ${currentUser.name})`,
          performedBy: currentUser.name,
          createdAt: now.toISOString(),
        });

        return {
          ...prod,
          stock: nextStock,
          updatedAt: now.toISOString(),
        };
      }
      return prod;
    });

    // Apply state
    setProducts(updatedProducts);
    setMutations(prev => [...newMutations, ...prev]);
    setSales(prev => [newTransaction, ...prev]);
    clearCart();

    return { success: true, transaction: newTransaction };
  };

  // Product CRUD
  const addProduct = (productData: Omit<Product, 'id' | 'createdAt' | 'updatedAt'>): Product => {
    const now = new Date().toISOString();
    const newProduct: Product = {
      ...productData,
      id: `prod-${Date.now()}`,
      createdAt: now,
      updatedAt: now,
    };

    setProducts(prev => [newProduct, ...prev]);

    // Initial stock mutation if stock > 0
    if (newProduct.stock > 0) {
      const initialMutation: StockMutation = {
        id: `mut-${Date.now()}`,
        productId: newProduct.id,
        productName: newProduct.name,
        sku: newProduct.sku,
        type: 'IN',
        referenceType: 'INITIAL_BALANCE',
        referenceNumber: 'INIT-001',
        qty: newProduct.stock,
        previousStock: 0,
        currentStock: newProduct.stock,
        notes: 'Pencatatan Saldo Awal Produk Baru',
        performedBy: currentUser.name,
        createdAt: now,
      };
      setMutations(prev => [initialMutation, ...prev]);
    }

    return newProduct;
  };

  const updateProduct = (id: string, updatedFields: Partial<Product>) => {
    const now = new Date().toISOString();
    setProducts(prev => prev.map(prod => {
      if (prod.id === id) {
        return {
          ...prod,
          ...updatedFields,
          updatedAt: now,
        };
      }
      return prod;
    }));
  };

  const deleteProduct = (id: string) => {
    setProducts(prev => prev.filter(prod => prod.id !== id));
  };

  // Stock In (Barang Masuk / Pembelian)
  const recordStockIn = (params: StockInParams): boolean => {
    const prod = products.find(p => p.id === params.productId);
    if (!prod) return false;

    const now = new Date().toISOString();
    const prevStock = prod.stock;
    const nextStock = prevStock + params.qty;

    const mutation: StockMutation = {
      id: `mut-${Date.now()}`,
      productId: prod.id,
      productName: prod.name,
      sku: prod.sku,
      type: 'IN',
      referenceType: 'PURCHASE',
      referenceNumber: params.referenceNo,
      qty: params.qty,
      previousStock: prevStock,
      currentStock: nextStock,
      notes: `Supplier: ${params.supplierName}. ${params.notes || ''}`.trim(),
      performedBy: currentUser.name,
      createdAt: now,
    };

    setProducts(prev => prev.map(p => 
      p.id === prod.id 
        ? { ...p, stock: nextStock, updatedAt: now } 
        : p
    ));

    setMutations(prev => [mutation, ...prev]);
    return true;
  };

  // Stock Out (Barang Keluar Operasional / Rusak / Hilang)
  const recordStockOut = (params: StockOutParams): { success: boolean; error?: string } => {
    const prod = products.find(p => p.id === params.productId);
    if (!prod) return { success: false, error: 'Produk tidak ditemukan' };

    if (prod.stock < params.qty) {
      return { 
        success: false, 
        error: `Stok saat ini (${prod.stock}) tidak mencukupi untuk pengeluaran ${params.qty} ${prod.unit}` 
      };
    }

    const now = new Date().toISOString();
    const prevStock = prod.stock;
    const nextStock = prevStock - params.qty;

    const mutation: StockMutation = {
      id: `mut-${Date.now()}`,
      productId: prod.id,
      productName: prod.name,
      sku: prod.sku,
      type: 'OUT',
      referenceType: params.reason as MutationReferenceType,
      referenceNumber: params.referenceNo,
      qty: params.qty,
      previousStock: prevStock,
      currentStock: nextStock,
      notes: `Alasan: ${params.reason}. ${params.notes || ''}`.trim(),
      performedBy: currentUser.name,
      createdAt: now,
    };

    setProducts(prev => prev.map(p => 
      p.id === prod.id 
        ? { ...p, stock: nextStock, updatedAt: now } 
        : p
    ));

    setMutations(prev => [mutation, ...prev]);
    return { success: true };
  };

  // Quick statistics queries
  const getLowStockProducts = () => {
    return products.filter(p => p.stock > 0 && p.stock <= p.minStock);
  };

  const getOutOfStockProducts = () => {
    return products.filter(p => p.stock <= 0);
  };

  const resetToDefaultData = () => {
    localStorage.removeItem(STORAGE_KEYS.PRODUCTS);
    localStorage.removeItem(STORAGE_KEYS.MUTATIONS);
    localStorage.removeItem(STORAGE_KEYS.SALES);
    setProducts(INITIAL_PRODUCTS);
    setMutations(INITIAL_MUTATIONS);
    setSales([]);
    setCart([]);
  };

  return (
    <AppContext.Provider
      value={{
        products,
        mutations,
        sales,
        currentUser,
        cart,
        users: INITIAL_USERS,
        customers,
        customerSpecialPrices,
        addToCart,
        updateCartQty,
        updateCartItemPrice,
        updateCartPriceTier,
        applyCustomerToCart,
        addCustomer,
        getCustomerLastPrice,
        removeFromCart,
        clearCart,
        checkout,
        addProduct,
        updateProduct,
        deleteProduct,
        recordStockIn,
        recordStockOut,
        setCurrentUserRole,
        theme,
        toggleTheme,
        setTheme,
        sidebarCollapsed,
        toggleSidebar,
        setSidebarCollapsed,
        resetToDefaultData,
        getLowStockProducts,
        getOutOfStockProducts,
      }}
    >
      {children}
    </AppContext.Provider>
  );
};

export const useApp = () => {
  const context = useContext(AppContext);
  if (!context) {
    throw new Error('useApp must be used within an AppProvider');
  }
  return context;
};
