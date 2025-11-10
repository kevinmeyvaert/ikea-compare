'use client';

import { useState, useCallback, useEffect, Suspense } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { logEvent } from 'firebase/analytics';
import { analytics } from '../../../lib/firebase';
import { initializeAnonymousAuth, addToHistory } from '../../../lib/user-data/user-data-manager';
import { migrateLocalStorageToFirestore, getSelectedStore } from '../../../lib/stores/store-manager';
import { trackProductComparison } from '../../../lib/analytics/analytics-service';
import Sidebar from '../../components/Sidebar';
import ProductSearch from '../../components/ProductSearch';
import ComparisonTable from '../../components/ComparisonTable';
import LoadingState from '../../components/LoadingState';
import StatsCard from '../../components/StatsCard';
import UserDataSection from '../../components/UserDataSection';
import { ProductComparisonResult } from '../../../lib/scrapers/types';

function ProductContent() {
  const params = useParams();
  const router = useRouter();
  const productId = params.productId as string;

  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<ProductComparisonResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [hasLoaded, setHasLoaded] = useState(false);

  // Initialize anonymous auth on mount
  useEffect(() => {
    const initialize = async () => {
      await initializeAnonymousAuth();
      await migrateLocalStorageToFirestore();
    };
    initialize();
  }, []);

  const handleSearch = useCallback(async (searchProductId: string) => {
    setLoading(true);
    setError(null);
    setResult(null);

    // Navigate to the product page for this ID
    if (searchProductId !== productId) {
      router.push(`/product/${searchProductId}`);
      return;
    }

    try {
      // Fetch product prices
      const priceResponse = await fetch(`/api/product/${searchProductId}`);

      if (!priceResponse.ok) {
        const errorData = await priceResponse.json();
        throw new Error(errorData.error || 'Failed to fetch product data');
      }

      const priceData: ProductComparisonResult = await priceResponse.json();

      // Fetch store-specific availability for each country
      const availabilityPromises: Promise<void>[] = [];

      // Helper function to fetch and attach availability
      const fetchAvailability = async (
        country: 'BE' | 'NL' | 'FR' | 'DE',
        productKey: 'belgium' | 'netherlands' | 'france' | 'germany'
      ) => {
        const store = await getSelectedStore(country);
        if (!store || !priceData.products[productKey]) return;

        try {
          const availResponse = await fetch(
            `/api/availability/${searchProductId}?country=${country.toLowerCase()}&storeId=${store.buCode}`
          );

          if (availResponse.ok) {
            const availability = await availResponse.json();
            if (priceData.products[productKey]) {
              priceData.products[productKey]!.storeAvailability = availability;
            }
          }
        } catch (err) {
          console.error(`Failed to fetch availability for ${country}:`, err);
        }
      };

      availabilityPromises.push(fetchAvailability('BE', 'belgium'));
      availabilityPromises.push(fetchAvailability('NL', 'netherlands'));
      availabilityPromises.push(fetchAvailability('FR', 'france'));
      availabilityPromises.push(fetchAvailability('DE', 'germany'));

      await Promise.all(availabilityPromises);

      setResult(priceData);

      // Track successful product comparison
      if (analytics) {
        logEvent(analytics, 'product_compared', {
          product_id: searchProductId,
          product_name: priceData.products.belgium?.name || priceData.products.netherlands?.name || priceData.products.france?.name || 'Unknown',
        });
      }

      // Track analytics for dashboard
      await trackProductComparison(priceData);

      // Add to history
      const anyProduct = priceData.products.belgium || priceData.products.netherlands || priceData.products.france;
      if (anyProduct) {
        const cheapestCountry = priceData.cheapest?.[0] as 'BE' | 'NL' | 'FR' | undefined;
        const prices = [
          priceData.products.belgium?.price,
          priceData.products.netherlands?.price,
          priceData.products.france?.price
        ].filter(p => p !== undefined) as number[];
        const cheapestPrice = prices.length > 0 ? Math.min(...prices) : undefined;

        addToHistory({
          productId: searchProductId,
          name: anyProduct.name,
          imageUrl: anyProduct.imageUrl || '',
          cheapestCountry,
          cheapestPrice,
        }).catch(err => console.error('Error adding to history:', err));
      }
    } catch (err: any) {
      setError(err.message || 'An error occurred while fetching product data');
    } finally {
      setLoading(false);
    }
  }, [productId, router]);

  // Auto-load product on mount
  useEffect(() => {
    if (!hasLoaded && productId) {
      setHasLoaded(true);
      handleSearch(productId);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [productId, hasLoaded]);

  const handleStoreChange = useCallback(() => {
    // Refresh the current product
    if (productId) {
      handleSearch(productId);
    }
  }, [productId, handleSearch]);

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="flex flex-col lg:flex-row min-h-screen">
        {/* Sidebar */}
        <Sidebar onStoreChange={handleStoreChange}>
          <ProductSearch onSearch={handleSearch} isLoading={loading} />
          <UserDataSection onProductClick={handleSearch} />
        </Sidebar>

        {/* Main Content Area */}
        <main className="flex-1 p-6 lg:p-8">
          <div className="max-w-6xl mx-auto">
            {/* Global Stats Dashboard */}
            <StatsCard />

            {/* Loading State */}
            {loading && <LoadingState />}

            {/* Error State */}
            {error && !loading && (
              <div className="max-w-2xl mx-auto bg-red-50 border-2 border-red-600 p-6">
                <div className="flex items-center gap-3">
                  <svg
                    className="w-6 h-6 text-red-600 flex-shrink-0"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth="2"
                      d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                    />
                  </svg>
                  <div>
                    <h3 className="text-lg font-semibold text-red-900">Foutmelding</h3>
                    <p className="text-red-700">{error}</p>
                  </div>
                </div>
              </div>
            )}

            {/* Results */}
            {result && !loading && (
              <ComparisonTable result={result} />
            )}

            {/* Empty State */}
            {!loading && !result && !error && (
              <div className="max-w-3xl mx-auto py-12 px-6">
                <div className="text-center">
                  <div className="text-6xl mb-4">🛋️</div>
                  <p className="text-xl text-gray-600">
                    Product aan het laden...
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

export default function ProductPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="text-6xl mb-4">🛋️</div>
          <p className="text-xl text-gray-600">Laden...</p>
        </div>
      </div>
    }>
      <ProductContent />
    </Suspense>
  );
}
