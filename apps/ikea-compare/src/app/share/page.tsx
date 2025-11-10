'use client';

import { useState, useCallback, useEffect, Suspense } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { logEvent } from 'firebase/analytics';
import { analytics } from '../../lib/firebase';
import { initializeAnonymousAuth } from '../../lib/user-data/user-data-manager';
import { migrateLocalStorageToFirestore } from '../../lib/stores/store-manager';
import { trackShoppingListComparison } from '../../lib/analytics/analytics-service';
import Sidebar from '../components/Sidebar';
import ShareLinkInput from '../components/ShareLinkInput';
import ShoppingListAnalysis from '../components/ShoppingListAnalysis';
import LoadingState from '../components/LoadingState';
import StatsCard from '../components/StatsCard';
import { ShoppingListAnalysis as ShoppingListAnalysisType } from '../../lib/shopping-list/types';

function ShareContent() {
  const searchParams = useSearchParams();
  const router = useRouter();

  const urlShareLink = searchParams.get('shareLink');

  const [loading, setLoading] = useState(false);
  const [shoppingListAnalysis, setShoppingListAnalysis] = useState<ShoppingListAnalysisType | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [hasLoadedFromUrl, setHasLoadedFromUrl] = useState(false);

  // Initialize anonymous auth on mount
  useEffect(() => {
    const initialize = async () => {
      await initializeAnonymousAuth();
      await migrateLocalStorageToFirestore();
    };
    initialize();
  }, []);

  const handleShareLinkSubmit = useCallback(async (shareLink: string) => {
    setLoading(true);
    setError(null);

    // Update URL with share link
    const params = new URLSearchParams();
    params.set('shareLink', encodeURIComponent(shareLink));
    router.push(`/share?${params.toString()}`, { scroll: false });

    try {
      const response = await fetch('/api/share-link', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ shareLink }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Share link verwerken mislukt');
      }

      const analysis = await response.json();
      setShoppingListAnalysis(analysis);
      setError(null);

      // Track successful share link analysis
      if (analytics) {
        logEvent(analytics, 'share_link_analyzed', {
          product_count: analysis.products?.length || 0,
          total_items: analysis.products?.reduce((sum: number, p: any) => sum + (p.quantity || 1), 0) || 0,
        });
      }

      // Track analytics for dashboard
      await trackShoppingListComparison(analysis);
    } catch (err: any) {
      setError(err.message || 'Er is een fout opgetreden bij het verwerken van de share link');
    } finally {
      setLoading(false);
    }
  }, [router]);

  // Auto-load from URL params on mount
  useEffect(() => {
    if (hasLoadedFromUrl) return;

    if (urlShareLink) {
      setHasLoadedFromUrl(true);
      handleShareLinkSubmit(decodeURIComponent(urlShareLink));
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [urlShareLink, hasLoadedFromUrl]);

  const handleReset = useCallback(() => {
    setShoppingListAnalysis(null);
    setError(null);
    router.push('/share', { scroll: false });
  }, [router]);

  const handleStoreChange = useCallback(() => {
    // If there's a shopping list analysis, user can re-run it
    // For now we just notify them to re-submit
  }, []);

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="flex flex-col lg:flex-row min-h-screen">
        {/* Sidebar */}
        <Sidebar onStoreChange={handleStoreChange}>
          <ShareLinkInput
            onSubmit={handleShareLinkSubmit}
            isLoading={loading}
          />
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
            {shoppingListAnalysis && !loading && (
              <ShoppingListAnalysis
                analysis={shoppingListAnalysis}
                onReset={handleReset}
              />
            )}

            {/* Empty State */}
            {!loading && !shoppingListAnalysis && !error && (
              <div className="max-w-3xl mx-auto py-12 px-6">
                <div className="text-center mb-8">
                  <div className="text-6xl mb-4">🛋️</div>
                  <p className="text-xl text-gray-600 mb-2">
                    Plak een IKEA share link om te vergelijken
                  </p>
                  <p className="text-sm text-gray-500">
                    Gebruik de share functie in je IKEA winkelwagen
                  </p>
                </div>

                {/* Share Link Instructions */}
                <div className="bg-blue-50 border-2 border-ikea-blue p-6">
                  <h3 className="text-lg font-bold text-gray-900 mb-4">Hoe krijg je een share link?</h3>

                  <div className="mb-6">
                    <h4 className="text-sm font-bold text-gray-900 mb-2">Via de IKEA website:</h4>
                    <ol className="text-sm text-gray-700 space-y-2 list-decimal list-inside ml-2">
                      <li>Voeg producten toe aan je winkelwagen</li>
                      <li>Open je <strong>winkelwagen</strong> en klik op de <strong>...</strong></li>
                      <li>Klik op de <strong>&ldquo;Deel&rdquo;</strong> knop</li>
                      <li>Kopieer de gegenereerde share link</li>
                    </ol>
                  </div>

                  <div className="mb-6">
                    <h4 className="text-sm font-bold text-gray-900 mb-2">Via de IKEA mobiele app:</h4>
                    <ol className="text-sm text-gray-700 space-y-2 list-decimal list-inside ml-2">
                      <li>Voeg producten toe aan je winkelwagen</li>
                      <li>Open je <strong>winkelwagen</strong></li>
                      <li>Klik op het <strong>deel-icoon</strong></li>
                      <li>Kopieer de gegenereerde share link</li>
                    </ol>
                  </div>

                  <p className="text-sm text-gray-700 mb-4">
                    Plak de link in het invoerveld links en klik op <strong>&ldquo;Vergelijk prijzen&rdquo;</strong>
                  </p>

                  <div className="pt-4 border-t border-gray-300">
                    <p className="text-sm text-gray-700 font-semibold mb-2">
                      Voorbeeld links:
                    </p>
                    <code className="block text-xs bg-white px-4 py-3 border-2 border-gray-300 break-all mb-2">
                      https://www.ikea.com/be/nl/favourites/receive-share/69505955:2,60275812:3
                    </code>
                    <code className="block text-xs bg-white px-4 py-3 border-2 border-gray-300 break-all">
                      https://applink.ikea.com/...
                    </code>
                    <p className="text-xs text-gray-600 mt-2">
                      Beide formaten worden ondersteund
                    </p>
                  </div>
                </div>
              </div>
            )}
          </div>
        </main>
      </div>
    </div>
  );
}

export default function SharePage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="text-6xl mb-4">🛋️</div>
          <p className="text-xl text-gray-600">Laden...</p>
        </div>
      </div>
    }>
      <ShareContent />
    </Suspense>
  );
}
