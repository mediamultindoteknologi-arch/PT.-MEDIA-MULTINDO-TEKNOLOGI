import React, { useState } from 'react';
import { AppProvider, useApp } from './context/AppContext';
import { Header } from './components/common/Header';
import { Sidebar, TabType } from './components/common/Sidebar';
import { POSView } from './components/pos/POSView';
import { ProductCatalogView } from './components/products/ProductCatalogView';
import { StockInView } from './components/inventory/StockInView';
import { StockOutView } from './components/inventory/StockOutView';
import { StockCardView } from './components/inventory/StockCardView';
import { DashboardAnalyticsView } from './components/dashboard/DashboardAnalyticsView';
import { ArchitectureDocsModal } from './components/architecture/ArchitectureDocsModal';

const MainLayout: React.FC = () => {
  const { currentUser } = useApp();
  const [activeTab, setActiveTab] = useState<TabType>('pos');
  const [searchTerm, setSearchTerm] = useState('');
  const [showArchitectureModal, setShowArchitectureModal] = useState(false);

  return (
    <div className="h-screen max-h-screen bg-[#f3f4f6] text-slate-800 dark:bg-[#18181b] dark:text-slate-100 flex flex-col font-sans transition-colors duration-200 overflow-hidden">
      
      {/* Top Header */}
      <Header
        activeTab={activeTab}
        searchTerm={searchTerm}
        onSearchChange={setSearchTerm}
        onOpenArchitecture={() => setShowArchitectureModal(true)}
      />

      <div className="flex-1 flex min-h-0 overflow-hidden">
        
        {/* Navigation Sidebar */}
        <Sidebar 
          activeTab={activeTab} 
          setActiveTab={(tab) => {
            if (tab === 'architecture') {
              setShowArchitectureModal(true);
            } else {
              setActiveTab(tab);
            }
          }} 
        />

        {/* Dynamic Content Views */}
        <main className="flex-1 flex flex-col min-w-0 min-h-0 overflow-hidden bg-[#f3f4f6] dark:bg-[#18181b] transition-colors duration-200">
          {activeTab === 'pos' && <POSView searchTerm={searchTerm} />}
          {activeTab === 'products' && <ProductCatalogView searchTerm={searchTerm} />}
          {activeTab === 'stock-in' && <StockInView />}
          {activeTab === 'stock-out' && <StockOutView />}
          {activeTab === 'stock-card' && <StockCardView />}
          {activeTab === 'dashboard' && <DashboardAnalyticsView />}
        </main>

      </div>

      {/* Technical Architecture & SQL DDL Modal */}
      {showArchitectureModal && (
        <ArchitectureDocsModal onClose={() => setShowArchitectureModal(false)} />
      )}

    </div>
  );
};

export default function App() {
  return (
    <AppProvider>
      <MainLayout />
    </AppProvider>
  );
}
