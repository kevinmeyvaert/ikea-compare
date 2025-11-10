'use client';

import { useEffect } from 'react';
import Image from 'next/image';

interface GlobalStats {
  totalComparisons: number;
  totalSavings: number;
  lastUpdated: unknown;
}

interface ProductStat {
  productId: string;
  name: string;
  imageUrl: string;
  comparisonCount: number;
  maxPriceDifference: number;
  minPrice: number;
  maxPrice: number;
  cheapestCountries?: string[];
  mostExpensiveCountries?: string[];
  lastComparedAt?: { toDate?: () => Date };
}

interface CountryStat {
  country: string;
  timesWasCheapest: number;
  timesWasMostExpensive: number;
  totalPriceDifference: number;
  comparisonCount: number;
  avgPriceDifference: number;
  cheapestPercentage: number;
  mostExpensivePercentage: number;
}

interface AvailabilityStats {
  totalProducts: number;
  availableInAllCountries: number;
  availableInSomeCountries: number;
  percentageInAllCountries: number;
}

interface StatsModalProps {
  isOpen: boolean;
  onClose: () => void;
  globalStats: GlobalStats;
  topProducts: ProductStat[];
  countryStats: CountryStat[];
  availabilityStats: AvailabilityStats;
  productsPerCountry: Record<string, number>;
  avgSavingsPerComparison: number;
  countryNames: Record<string, string>;
}

export default function StatsModal({
  isOpen,
  onClose,
  globalStats,
  topProducts,
  countryStats,
  availabilityStats,
  productsPerCountry,
  avgSavingsPerComparison,
  countryNames,
}: StatsModalProps) {
  // Prevent background scrolling when modal is open
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }

    return () => {
      document.body.style.overflow = '';
    };
  }, [isOpen]);

  // Close modal on ESC key press
  useEffect(() => {
    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        onClose();
      }
    };

    if (isOpen) {
      document.addEventListener('keydown', handleEscape);
    }

    return () => {
      document.removeEventListener('keydown', handleEscape);
    };
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black bg-opacity-50 z-40"
        onClick={onClose}
      />

      {/* Modal */}
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
        <div className="bg-white border-2 border-black max-w-4xl w-full max-h-[90vh] overflow-y-auto">
          {/* Header */}
          <div className="sticky top-0 bg-black border-b-2 border-black px-6 py-4 flex items-center justify-between gap-4 z-10">
            <h2 className="text-lg font-bold text-white min-w-0 truncate">KOMPRÅRE statistieken</h2>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-white transition-colors flex-shrink-0"
              aria-label="Sluit"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>

          {/* Content */}
          <div className="p-6">
            {/* Main Stats Grid */}
            <p className="text-sm text-gray-600 mb-4">
              Globale statistieken van alle productvergelijkingen die gebruikers hebben uitgevoerd. Deze cijfers tonen hoeveel er potentieel kan worden bespaard door prijzen tussen landen te vergelijken.
            </p>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
              {/* Total Comparisons */}
              <div className="bg-white p-4 border-2 border-black">
                <div className="text-xs text-gray-600 mb-1">
                  Producten vergeleken
                </div>
                <div className="text-2xl font-bold text-gray-900">
                  {globalStats.totalComparisons.toLocaleString()}
                </div>
              </div>

              {/* Total Savings */}
              <div className="bg-white p-4 border-2 border-black">
                <div className="text-xs text-gray-600 mb-1">
                  Totale besparing
                  <span className="block text-gray-500">vs België</span>
                </div>
                <div className="text-2xl font-bold text-gray-900">
                  €{globalStats.totalSavings.toFixed(0)}
                </div>
              </div>

              {/* Average Savings */}
              <div className="bg-white p-4 border-2 border-black">
                <div className="text-xs text-gray-600 mb-1">
                  Gem. besparing per product
                  <span className="block text-gray-500">vs België</span>
                </div>
                <div className="text-2xl font-bold text-gray-900">
                  €{avgSavingsPerComparison.toFixed(2)}
                </div>
              </div>
            </div>

            {/* Country Price Levels */}
            <div className="mb-6">
              <h3 className="text-lg font-semibold mb-3 text-gray-900">
                Prijsniveaus per land (vs België)
              </h3>
              <p className="text-sm text-gray-600 mb-3">
                Het gemiddelde prijsverschil per product vergeleken met België. Groene waarden tonen hoeveel goedkoper het land is, rode waarden tonen hoeveel duurder.
              </p>
              {countryStats.length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3">
                  {countryStats
                    .filter(c => c.country !== 'BE')
                    .sort((a, b) => a.avgPriceDifference - b.avgPriceDifference)
                    .map((country) => {
                      const ischeaper = country.avgPriceDifference < 0;
                      const percentage = Math.abs(country.avgPriceDifference);
                      return (
                        <div
                          key={country.country}
                          className="p-4 border-2 border-black bg-white"
                        >
                          <div className="text-sm font-bold text-gray-900 mb-1">
                            {countryNames[country.country] || country.country}
                          </div>
                          <div className={`text-2xl font-bold ${
                            ischeaper ? 'text-green-700' : 'text-red-700'
                          }`}>
                            {ischeaper ? '-' : '+'}€{percentage.toFixed(2)}
                          </div>
                          <div className="text-xs text-gray-600 mt-1">
                            gem. per product
                          </div>
                        </div>
                      );
                    })}
                </div>
              ) : (
                <div className="text-sm text-gray-500 italic p-4 bg-white border-2 border-gray-300">
                  Nog geen landendata
                </div>
              )}
            </div>

            {/* Country Win/Loss Ratios */}
            <div className="mb-6">
              <h3 className="text-lg font-semibold mb-3 text-gray-900">
                Goedkoopst / duurste per land
              </h3>
              <p className="text-sm text-gray-600 mb-3">
                Hoe vaak elk land de goedkoopste of duurste prijs had in vergelijkingen. Dit geeft een indicatie van welke landen over het algemeen de beste prijzen bieden.
              </p>
              {countryStats.length > 0 ? (
                <div className="space-y-3">
                  {countryStats
                    .sort((a, b) => b.cheapestPercentage - a.cheapestPercentage)
                    .map((country) => (
                      <div key={country.country} className="bg-white p-4 border-2 border-black">
                        <div className="flex items-center justify-between mb-2">
                          <div className="text-sm font-bold text-gray-900">
                            {countryNames[country.country] || country.country}
                          </div>
                          <div className="text-xs text-gray-600">
                            {country.comparisonCount} vergelijkingen
                          </div>
                        </div>

                        {/* Progress bars */}
                        <div className="space-y-2">
                          <div>
                            <div className="flex items-center justify-between text-xs mb-1">
                              <span className="text-green-700">Goedkoopst</span>
                              <span className="font-semibold text-green-700">
                                {Math.min(country.cheapestPercentage, 100).toFixed(1)}%
                              </span>
                            </div>
                            <div className="w-full bg-gray-200 h-2 border border-gray-300 overflow-hidden">
                              <div
                                className="bg-green-600 h-full"
                                style={{ width: `${Math.min(country.cheapestPercentage, 100)}%` }}
                              />
                            </div>
                          </div>

                          <div>
                            <div className="flex items-center justify-between text-xs mb-1">
                              <span className="text-red-700">Duurste</span>
                              <span className="font-semibold text-red-700">
                                {Math.min(country.mostExpensivePercentage, 100).toFixed(1)}%
                              </span>
                            </div>
                            <div className="w-full bg-gray-200 h-2 border border-gray-300 overflow-hidden">
                              <div
                                className="bg-red-600 h-full"
                                style={{ width: `${Math.min(country.mostExpensivePercentage, 100)}%` }}
                              />
                            </div>
                          </div>
                        </div>
                      </div>
                    ))}
                </div>
              ) : (
                <div className="text-sm text-gray-500 italic p-4 bg-white border-2 border-gray-300">
                  Nog geen landendata
                </div>
              )}
            </div>

            {/* Top 10 Biggest Price Differences */}
            <div className="mb-6">
              <h3 className="text-lg font-semibold mb-3 text-gray-900">
                Top 10 grootste prijsverschillen
              </h3>
              <p className="text-sm text-gray-600 mb-3">
                De producten met het grootste prijsverschil tussen landen. Deze producten zijn het meest de moeite waard om te vergelijken voordat je koopt.
              </p>
              {topProducts.length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  {topProducts.map((product, index) => {
                    // Format date if available
                    const lastCompared = product.lastComparedAt?.toDate?.();
                    const dateStr = lastCompared ? new Intl.DateTimeFormat('nl-BE', {
                      day: 'numeric',
                      month: 'short',
                      year: 'numeric'
                    }).format(lastCompared) : null;

                    return (
                      <div
                        key={product.productId}
                        className="flex items-center gap-3 p-3 bg-white hover:bg-gray-50 transition-colors border-2 border-black"
                      >
                        <div className="flex-shrink-0 w-8 h-8 bg-black text-white flex items-center justify-center font-bold text-sm">
                          {index + 1}
                        </div>
                        {product.imageUrl && (
                          <div className="flex-shrink-0 w-16 h-16 relative">
                            <Image
                              src={product.imageUrl}
                              alt={product.name}
                              fill
                              className="object-contain"
                            />
                          </div>
                        )}
                        <div className="flex-1 min-w-0">
                          <div className="text-sm font-medium text-gray-900 truncate mb-1">
                            {product.name}
                          </div>
                          <div className="text-xs text-gray-600 mb-1">
                            {product.cheapestCountries && product.cheapestCountries.length > 0 && (
                              <span className="text-green-700">
                                {countryNames[product.cheapestCountries[0]] || product.cheapestCountries[0]} €{product.minPrice.toFixed(2)}
                              </span>
                            )}
                            {product.cheapestCountries && product.mostExpensiveCountries && product.cheapestCountries.length > 0 && product.mostExpensiveCountries.length > 0 && ' → '}
                            {product.mostExpensiveCountries && product.mostExpensiveCountries.length > 0 && (
                              <span className="text-red-700">
                                {countryNames[product.mostExpensiveCountries[0]] || product.mostExpensiveCountries[0]} €{product.maxPrice.toFixed(2)}
                              </span>
                            )}
                          </div>
                          <div className="text-sm font-bold text-gray-900">
                            Verschil: €{product.maxPriceDifference.toFixed(2)}
                          </div>
                          {dateStr && (
                            <div className="text-xs text-gray-500 mt-1">
                              {dateStr}
                            </div>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              ) : (
                <div className="text-sm text-gray-500 italic p-4 bg-white border-2 border-gray-300">
                  Nog geen producten vergeleken
                </div>
              )}
            </div>

            {/* Product Availability */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <div>
                <h3 className="text-lg font-semibold mb-3 text-gray-900">
                  Productbeschikbaarheid
                </h3>
                <p className="text-sm text-gray-600 mb-3">
                  Hoeveel producten in alle landen beschikbaar zijn versus slechts in sommige landen. Niet alle IKEA-producten zijn overal verkrijgbaar.
                </p>
                <div className="space-y-3">
                  <div className="bg-white p-4 border-2 border-black">
                    <div className="text-xs text-gray-600 mb-1">
                      Beschikbaar in alle landen
                    </div>
                    <div className="text-3xl font-bold text-gray-900">
                      {availabilityStats.availableInAllCountries}
                    </div>
                    <div className="text-xs text-gray-600 mt-1">
                      {availabilityStats.percentageInAllCountries.toFixed(1)}% van totaal
                    </div>
                  </div>

                  <div className="bg-white p-4 border-2 border-black">
                    <div className="text-xs text-gray-600 mb-1">
                      Slechts in sommige landen
                    </div>
                    <div className="text-3xl font-bold text-gray-900">
                      {availabilityStats.availableInSomeCountries}
                    </div>
                    <div className="text-xs text-gray-600 mt-1">
                      {(100 - availabilityStats.percentageInAllCountries).toFixed(1)}% van totaal
                    </div>
                  </div>
                </div>
              </div>

              {/* Products Per Country */}
              <div>
                <h3 className="text-lg font-semibold mb-3 text-gray-900">
                  Producten per land
                </h3>
                <p className="text-sm text-gray-600 mb-3">
                  Het aantal unieke productvergelijkingen per land. Dit toont in welke landen de meeste producten beschikbaar zijn.
                </p>
                <div className="space-y-2">
                  {Object.entries(productsPerCountry)
                    .sort((a, b) => b[1] - a[1])
                    .map(([country, count]) => (
                      <div
                        key={country}
                        className="flex items-center justify-between p-3 bg-white border-2 border-black"
                      >
                        <div className="text-sm font-medium text-gray-900">
                          {countryNames[country] || country}
                        </div>
                        <div className="text-lg font-bold text-gray-900">
                          {count.toLocaleString()}
                        </div>
                      </div>
                    ))}
                </div>
              </div>
            </div>
          </div>

          {/* Footer */}
          <div className="sticky bottom-0 bg-white border-t-2 border-black px-6 py-4">
            <button
              onClick={onClose}
              className="w-full px-4 py-3 bg-black text-white font-bold hover:bg-gray-800 transition-colors border-2 border-black"
            >
              Sluiten
            </button>
          </div>
        </div>
      </div>
    </>
  );
}
