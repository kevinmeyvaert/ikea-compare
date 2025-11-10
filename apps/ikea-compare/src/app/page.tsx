'use client';

import { useCallback, useEffect, Suspense } from 'react';
import { useRouter } from 'next/navigation';
import { initializeAnonymousAuth } from '../lib/user-data/user-data-manager';
import { migrateLocalStorageToFirestore } from '../lib/stores/store-manager';
import Sidebar from './components/Sidebar';
import ProductSearch from './components/ProductSearch';
import StatsCard from './components/StatsCard';
import UserDataSection from './components/UserDataSection';

function IndexContent() {
  const router = useRouter();

  // Initialize anonymous auth on mount
  useEffect(() => {
    const initialize = async () => {
      await initializeAnonymousAuth();
      await migrateLocalStorageToFirestore();
    };
    initialize();
  }, []);

  const handleSearch = useCallback((productId: string) => {
    // Navigate to the dedicated product page
    router.push(`/product/${productId}`);
  }, [router]);

  const handleStoreChange = useCallback(() => {
    // Store change will be handled by individual product pages
  }, []);

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="flex flex-col lg:flex-row min-h-screen">
        {/* Sidebar */}
        <Sidebar onStoreChange={handleStoreChange}>
          <ProductSearch onSearch={handleSearch} isLoading={false} />
          <UserDataSection onProductClick={handleSearch} />
        </Sidebar>

        {/* Main Content Area */}
        <main className="flex-1 p-6 lg:p-8">
          <div className="max-w-6xl mx-auto">
            {/* Global Stats Dashboard */}
            <StatsCard />

            {/* Empty State */}
            <div className="max-w-3xl mx-auto py-12 px-6">
              <div className="text-center mb-8">
                <div className="text-6xl mb-4">🛋️</div>
                <p className="text-xl text-gray-600">
                  Voer een IKEA-productcode in om te beginnen
                </p>
                <p className="text-sm text-gray-500 mt-2">
                  Voorbeeld: 002.638.50 (BILLY boekenkast)
                </p>
              </div>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}

export default function Index() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="text-6xl mb-4">🛋️</div>
          <p className="text-xl text-gray-600">Laden...</p>
        </div>
      </div>
    }>
      <IndexContent />
    </Suspense>
  );
}
