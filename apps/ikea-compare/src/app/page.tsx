'use client';

import { useState, useEffect, Suspense } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import Image from 'next/image';
import ProductSearch from './components/ProductSearch';
import ComparisonTable from './components/ComparisonTable';
import LoadingState from './components/LoadingState';
import StoreSettingsModal from './components/StoreSettingsModal';
import PDFUpload from './components/PDFUpload';
import ShareLinkInput from './components/ShareLinkInput';
import ShoppingListAnalysis from './components/ShoppingListAnalysis';
import { ProductComparisonResult } from '../lib/scrapers/types';
import { ShoppingListAnalysis as ShoppingListAnalysisType } from '../lib/shopping-list/types';
import { getSelectedStore } from '../lib/stores/store-manager';

function IndexContent() {
  const searchParams = useSearchParams();
  const router = useRouter();

  // Get mode from URL, default to 'single'
  const urlMode = searchParams.get('mode') as 'single' | 'list' | 'share' | null;
  const urlProductId = searchParams.get('productId');
  const urlShareLink = searchParams.get('shareLink');

  const [mode, setModeState] = useState<'single' | 'list' | 'share'>(urlMode || 'single');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<ProductComparisonResult | null>(null);
  const [shoppingListAnalysis, setShoppingListAnalysis] = useState<ShoppingListAnalysisType | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [hasLoadedFromUrl, setHasLoadedFromUrl] = useState(false);

  // Handler functions need to be defined before useEffect
  const handleSearch = async (productId: string) => {
    setLoading(true);
    setError(null);
    setResult(null);

    // Update URL with product ID
    const params = new URLSearchParams();
    params.set('mode', 'single');
    params.set('productId', productId);
    router.push(`/?${params.toString()}`, { scroll: false });

    try {
      // Fetch product prices
      const priceResponse = await fetch(`/api/product/${productId}`);

      if (!priceResponse.ok) {
        const errorData = await priceResponse.json();
        throw new Error(errorData.error || 'Failed to fetch product data');
      }

      const priceData: ProductComparisonResult = await priceResponse.json();

      // Fetch store-specific availability for each country
      const availabilityPromises: Promise<void>[] = [];

      // Helper function to fetch and attach availability
      const fetchAvailability = async (
        country: 'BE' | 'NL' | 'FR',
        productKey: 'belgium' | 'netherlands' | 'france'
      ) => {
        const store = getSelectedStore(country);
        if (!store || !priceData.products[productKey]) return;

        try {
          const availResponse = await fetch(
            `/api/availability/${productId}?country=${country.toLowerCase()}&storeId=${store.buCode}`
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

      await Promise.all(availabilityPromises);

      setResult(priceData);
    } catch (err: any) {
      setError(err.message || 'An error occurred while fetching product data');
    } finally {
      setLoading(false);
    }
  };

  const handleShareLinkSubmit = async (shareLink: string) => {
    setLoading(true);
    setError(null);

    // Update URL with share link
    const params = new URLSearchParams();
    params.set('mode', 'share');
    params.set('shareLink', encodeURIComponent(shareLink));
    router.push(`/?${params.toString()}`, { scroll: false });

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
    } catch (err: any) {
      setError(err.message || 'Er is een fout opgetreden bij het verwerken van de share link');
    } finally {
      setLoading(false);
    }
  };

  // Auto-load from URL params on mount
  useEffect(() => {
    if (hasLoadedFromUrl) return;

    if (urlMode === 'single' && urlProductId) {
      setHasLoadedFromUrl(true);
      handleSearch(urlProductId);
    } else if (urlMode === 'share' && urlShareLink) {
      setHasLoadedFromUrl(true);
      handleShareLinkSubmit(decodeURIComponent(urlShareLink));
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [urlMode, urlProductId, urlShareLink, hasLoadedFromUrl]);

  // Sync URL with mode state
  useEffect(() => {
    if (urlMode && urlMode !== mode) {
      setModeState(urlMode);
    }
  }, [urlMode, mode]);

  // Update URL when mode changes
  const setMode = (newMode: 'single' | 'list' | 'share') => {
    setModeState(newMode);
    // Clear results when switching modes
    setResult(null);
    setShoppingListAnalysis(null);
    setError(null);
    // Clear product/share params when switching modes
    router.push(`/?mode=${newMode}`, { scroll: false });
  };

  const handleStoreChange = () => {
    // If there's a current result, refresh it to show new store availability
    if (result) {
      handleSearch(result.productId);
    }
    // If there's a shopping list analysis, you might want to refresh that too
    // For now, we'll just let the user know they need to re-run the comparison
  };

  const handlePDFUploadSuccess = (analysis: ShoppingListAnalysisType) => {
    setShoppingListAnalysis(analysis);
    setError(null);
    // Don't call setMode('list') here since we're already in list mode
    // and setMode clears all results
  };

  const handleResetShoppingList = () => {
    setShoppingListAnalysis(null);
    setMode('single');
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="flex flex-col lg:flex-row min-h-screen">
        {/* Left Sidebar */}
        <aside className="lg:w-96 bg-white border-r border-gray-200 lg:sticky lg:top-0 lg:h-screen lg:overflow-y-auto">
          <div className="p-6">
            {/* Header */}
            <div className="mb-8">
              <div className="flex items-center justify-between mb-2 gap-3">
                <div className="relative h-16 flex-1">
                  <Image
                    src="/assets/logo.png"
                    alt="IKEA Price Comparison"
                    fill
                    className="object-contain object-left"
                    priority
                  />
                </div>
                <button
                  onClick={() => setIsSettingsOpen(true)}
                  className="flex items-center gap-2 text-sm text-gray-700 hover:text-ikea-blue transition-colors flex-shrink-0"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                  </svg>
                  <span className="font-medium">Winkel instellingen</span>
                </button>
              </div>
              <p className="text-sm text-gray-700">
                Altijd de juiste GRÄBPRIS.
              </p>
            </div>

            {/* Mode Toggle */}
            <div className="mb-6 flex gap-3">
              <button
                onClick={() => setMode('single')}
                className={`flex items-center gap-2 px-4 py-2.5 text-sm font-medium border-2 transition-colors ${
                  mode === 'single'
                    ? 'bg-black text-white border-black'
                    : 'bg-white text-gray-900 border-gray-900 hover:bg-gray-50'
                }`}
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z" />
                </svg>
                Enkel product
              </button>
              <button
                onClick={() => setMode('share')}
                className={`flex items-center gap-2 px-4 py-2.5 text-sm font-medium border-2 transition-colors ${
                  mode === 'share'
                    ? 'bg-black text-white border-black'
                    : 'bg-white text-gray-900 border-gray-900 hover:bg-gray-50'
                }`}
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.368 2.684 3 3 0 00-5.368-2.684z" />
                </svg>
                Share link
              </button>
              <button
                onClick={() => setMode('list')}
                className={`flex items-center gap-2 px-4 py-2.5 text-sm font-medium border-2 transition-colors ${
                  mode === 'list'
                    ? 'bg-black text-white border-black'
                    : 'bg-white text-gray-900 border-gray-900 hover:bg-gray-50'
                }`}
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
                Pdf upload
              </button>
            </div>

            {/* Single Product Mode */}
            {mode === 'single' && (
              <>
                {/* Search Component */}
                <div className="mb-8">
                  <ProductSearch onSearch={handleSearch} isLoading={loading} />
                </div>
              </>
            )}

            {/* Share Link Mode */}
            {mode === 'share' && (
              <>
                <div className="mb-8">
                  <ShareLinkInput
                    onSubmit={handleShareLinkSubmit}
                    isLoading={loading}
                  />
                </div>
              </>
            )}

            {/* Shopping List Mode */}
            {mode === 'list' && (
              <>
                <div className="mb-8">
                  <PDFUpload
                    onUploadSuccess={handlePDFUploadSuccess}
                    isLoading={loading}
                    setIsLoading={setLoading}
                  />
                </div>
              </>
            )}

            {/* Footer */}
            <div className="mt-8 pt-6 border-t border-gray-200">
              <p className="text-xs text-gray-600">
                Prijzen worden in real-time opgehaald en kunnen variëren. Verifieer altijd op de officiële IKEA website.
              </p>
            </div>
          </div>
        </aside>

        {/* Main Content Area */}
        <main className="flex-1 p-6 lg:p-8">
          <div className="max-w-6xl mx-auto">
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

            {/* Single Product Results */}
            {mode === 'single' && result && !loading && <ComparisonTable result={result} />}

            {/* Shopping List Analysis */}
            {(mode === 'list' || mode === 'share') && shoppingListAnalysis && !loading && (
              <ShoppingListAnalysis
                analysis={shoppingListAnalysis}
                onReset={handleResetShoppingList}
              />
            )}

            {/* Empty State */}
            {!loading && !result && !shoppingListAnalysis && !error && (
              <div className="max-w-3xl mx-auto py-12 px-6">
                <div className="text-center mb-8">
                  <div className="text-6xl mb-4">🛋️</div>
                  {mode === 'single' ? (
                    <>
                      <p className="text-xl text-gray-600">
                        Voer een IKEA-productcode in om te beginnen
                      </p>
                      <p className="text-sm text-gray-500 mt-2">
                        Voorbeeld: 002.638.50 (BILLY boekenkast)
                      </p>
                    </>
                  ) : mode === 'share' ? (
                    <>
                      <p className="text-xl text-gray-600 mb-2">
                        Plak een IKEA share link om te vergelijken
                      </p>
                      <p className="text-sm text-gray-500">
                        Gebruik de share functie in je IKEA winkelwagen
                      </p>
                    </>
                  ) : (
                    <>
                      <p className="text-xl text-gray-600">
                        Upload een PDF om je winkellijst te analyseren
                      </p>
                      <p className="text-sm text-gray-500 mt-2">
                        De PDF moet IKEA-productcodes bevatten
                      </p>
                    </>
                  )}
                </div>

                {/* Share Link Instructions */}
                {mode === 'share' && (
                  <div className="bg-blue-50 border-2 border-ikea-blue p-6">
                    <h3 className="text-lg font-bold text-gray-900 mb-4">Hoe krijg je een share link?</h3>
                    <ol className="text-sm text-gray-700 space-y-3 list-decimal list-inside">
                      <li>Ga naar de <strong>IKEA website</strong> en voeg producten toe aan je winkelwagen</li>
                      <li>Open je <strong>winkelwagen</strong></li>
                      <li>Klik op de <strong>&ldquo;Deel&rdquo;</strong> of <strong>&ldquo;Share&rdquo;</strong> knop</li>
                      <li>Kopieer de gegenereerde share link</li>
                      <li>Plak de link in het invoerveld links en klik op <strong>&ldquo;Vergelijk prijzen&rdquo;</strong></li>
                    </ol>
                    <div className="mt-6 pt-4 border-t border-gray-300">
                      <p className="text-sm text-gray-700 font-semibold mb-2">
                        Voorbeeld link:
                      </p>
                      <code className="block text-xs bg-white px-4 py-3 border-2 border-gray-300 break-all">
                        https://www.ikea.com/be/nl/favourites/receive-share/69505955:2,60275812:3
                      </code>
                      <p className="text-xs text-gray-600 mt-2">
                        Deze link bevat 2x product 69505955 en 3x product 60275812
                      </p>
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        </main>
      </div>

      {/* Store Settings Modal */}
      <StoreSettingsModal
        isOpen={isSettingsOpen}
        onClose={() => setIsSettingsOpen(false)}
        onStoreChange={handleStoreChange}
      />
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
