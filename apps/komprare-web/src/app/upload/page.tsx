'use client';

import { useState, useCallback, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { logAnalyticsEvent, initializeAnonymousAuth } from '@ikea-compare/firebase';
import { migrateLocalStorageToFirestore } from '@ikea-compare/firebase';
import { trackShoppingListComparison } from '@ikea-compare/firebase';
import Sidebar from '../components/Sidebar';
import PDFUpload from '../components/PDFUpload';
import ShoppingListAnalysis from '../components/ShoppingListAnalysis';
import StatsCard from '../components/StatsCard';
import { ShoppingListAnalysis as ShoppingListAnalysisType } from '@ikea-compare/types';

export default function UploadPage() {
  const router = useRouter();

  const [loading, setLoading] = useState(false);
  const [shoppingListAnalysis, setShoppingListAnalysis] =
    useState<ShoppingListAnalysisType | null>(null);

  // Initialize anonymous auth on mount
  useEffect(() => {
    const initialize = async () => {
      await initializeAnonymousAuth();
      await migrateLocalStorageToFirestore();
    };
    initialize();
  }, []);

  const handlePDFUploadSuccess = useCallback(
    async (analysis: ShoppingListAnalysisType) => {
      setShoppingListAnalysis(analysis);

      // Track successful PDF upload
      logAnalyticsEvent('pdf_uploaded', {
        product_count: analysis.products?.length || 0,
      });

      // Track analytics for dashboard
      await trackShoppingListComparison(analysis);
    },
    []
  );

  const handleReset = useCallback(() => {
    setShoppingListAnalysis(null);
    router.push('/upload', { scroll: false });
  }, [router]);

  const handleStoreChange = useCallback(() => {
    // If there's a shopping list analysis, user can re-upload
    // For now we just notify them to re-upload
  }, []);

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="flex flex-col lg:flex-row min-h-screen">
        {/* Sidebar */}
        <Sidebar onStoreChange={handleStoreChange}>
          <PDFUpload
            onUploadSuccess={handlePDFUploadSuccess}
            isLoading={loading}
            setIsLoading={setLoading}
          />
        </Sidebar>

        {/* Main Content Area */}
        <main className="flex-1 p-6 lg:p-8">
          <div className="max-w-6xl mx-auto">
            {/* Global Stats Dashboard */}
            <StatsCard />

            {/* Results */}
            {shoppingListAnalysis && !loading && (
              <ShoppingListAnalysis
                analysis={shoppingListAnalysis}
                onReset={handleReset}
              />
            )}

            {/* Empty State */}
            {!loading && !shoppingListAnalysis && (
              <div className="max-w-3xl mx-auto py-12 px-6">
                <div className="text-center mb-8">
                  <div className="text-6xl mb-4">🛋️</div>
                  <p className="text-xl text-gray-600">
                    Upload een PDF om je winkellijst te analyseren
                  </p>
                  <p className="text-sm text-gray-500 mt-2">
                    De PDF moet IKEA-productcodes bevatten
                  </p>
                </div>
              </div>
            )}
          </div>
        </main>
      </div>
    </div>
  );
}
