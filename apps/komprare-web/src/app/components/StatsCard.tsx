'use client';

import { useEffect, useState } from 'react';
import { doc, onSnapshot } from 'firebase/firestore';
import { db } from '@ikea-compare/firebase';
import StatsModal from './StatsModal';

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

interface Statistics {
  countryStats: CountryStat[];
  topProducts: ProductStat[];
  availabilityStats: AvailabilityStats;
  productsPerCountry: Record<string, number>;
}

const countryNames: Record<string, string> = {
  BE: '🇧🇪 België',
  NL: '🇳🇱 Nederland',
  FR: '🇫🇷 Frankrijk',
  DE: '🇩🇪 Duitsland',
};

export default function StatsCard() {
  const [globalStats, setGlobalStats] = useState<GlobalStats>({
    totalComparisons: 0,
    totalSavings: 0,
    lastUpdated: null,
  });
  const [statistics, setStatistics] = useState<Statistics>({
    countryStats: [],
    topProducts: [],
    availabilityStats: {
      totalProducts: 0,
      availableInAllCountries: 0,
      availableInSomeCountries: 0,
      percentageInAllCountries: 0,
    },
    productsPerCountry: {},
  });
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);

  useEffect(() => {
    if (!db) return;

    // Listen to global stats for real-time updates in header
    const globalStatsRef = doc(db, 'analytics', 'global-stats');
    const unsubscribeGlobal = onSnapshot(
      globalStatsRef,
      (snapshot) => {
        if (snapshot.exists()) {
          setGlobalStats(snapshot.data() as GlobalStats);
        }
        setLoading(false);
      },
      (error) => {
        console.error('Error listening to global stats:', error);
        setLoading(false);
      }
    );

    return () => {
      unsubscribeGlobal();
    };
  }, []);

  // Fetch comprehensive statistics when modal opens
  useEffect(() => {
    if (isModalOpen && db) {
      fetchStatistics();
    }
  }, [isModalOpen]);

  const fetchStatistics = async () => {
    if (!db) return;

    try {
      const { collection, getDocs, query, orderBy, limit } = await import(
        'firebase/firestore'
      );

      // Fetch country statistics
      const countryStatsSnapshot = await getDocs(
        collection(db, 'country-stats')
      );
      const countryStats: CountryStat[] = countryStatsSnapshot.docs.map(
        (doc) => {
          const data = doc.data();
          const avgPriceDifference =
            data.comparisonCount > 0
              ? data.totalPriceDifference / data.comparisonCount
              : 0;
          const cheapestPercentage =
            data.comparisonCount > 0
              ? (data.timesWasCheapest / data.comparisonCount) * 100
              : 0;
          const mostExpensivePercentage =
            data.comparisonCount > 0
              ? (data.timesWasMostExpensive / data.comparisonCount) * 100
              : 0;

          return {
            country: data.country,
            timesWasCheapest: data.timesWasCheapest || 0,
            timesWasMostExpensive: data.timesWasMostExpensive || 0,
            totalPriceDifference: data.totalPriceDifference || 0,
            comparisonCount: data.comparisonCount || 0,
            avgPriceDifference,
            cheapestPercentage,
            mostExpensivePercentage,
          };
        }
      );

      // Fetch top 10 products by price difference
      const productStatsQuery = query(
        collection(db, 'product-stats'),
        orderBy('maxPriceDifference', 'desc'),
        limit(10)
      );
      const productStatsSnapshot = await getDocs(productStatsQuery);
      const topProducts: ProductStat[] = productStatsSnapshot.docs.map(
        (doc) => {
          const data = doc.data();
          return {
            productId: data.productId,
            name: data.name,
            imageUrl: data.imageUrl,
            maxPriceDifference: data.maxPriceDifference || 0,
            minPrice: data.minPrice || 0,
            maxPrice: data.maxPrice || 0,
            comparisonCount: data.comparisonCount || 0,
            cheapestCountries: data.cheapestCountries || [],
            mostExpensiveCountries: data.mostExpensiveCountries || [],
            lastComparedAt: data.lastComparedAt,
          };
        }
      );

      // Fetch product availability statistics
      const availabilityStatsSnapshot = await getDocs(
        collection(db, 'product-availability-stats')
      );
      const totalProducts = availabilityStatsSnapshot.size;
      const availableInAllCountries = availabilityStatsSnapshot.docs.filter(
        (doc) => doc.data().availableInAllCountries === true
      ).length;
      const availableInSomeCountries = totalProducts - availableInAllCountries;
      const percentageInAllCountries =
        totalProducts > 0 ? (availableInAllCountries / totalProducts) * 100 : 0;

      const availabilityStats: AvailabilityStats = {
        totalProducts,
        availableInAllCountries,
        availableInSomeCountries,
        percentageInAllCountries,
      };

      // Calculate products per country from country stats
      const productsPerCountry: Record<string, number> = {};
      countryStats.forEach((stat) => {
        productsPerCountry[stat.country] = stat.comparisonCount;
      });

      setStatistics({
        countryStats,
        topProducts,
        availabilityStats,
        productsPerCountry,
      });
    } catch (error) {
      console.error('Error fetching statistics:', error);
    }
  };

  // Calculate average savings per comparison
  const avgSavingsPerComparison =
    globalStats.totalComparisons > 0
      ? globalStats.totalSavings / globalStats.totalComparisons
      : 0;

  if (loading) {
    return (
      <div className="bg-black px-6 lg:px-8 py-3 mb-6 -mx-6 lg:-mx-8 -mt-6 lg:-mt-8 animate-pulse">
        <div className="max-w-6xl mx-auto">
          {/* Header skeleton */}
          <div className="mb-1.5">
            <div className="h-3 w-32 bg-gray-700"></div>
          </div>
          <div className="flex items-center justify-between gap-4 flex-wrap">
            {/* Stat skeletons */}
            {[1, 2, 3].map((i) => (
              <div key={i} className="flex-1 min-w-[120px]">
                <div className="h-3 w-24 bg-gray-700 mb-1"></div>
                <div className="h-5 w-16 bg-gray-700"></div>
              </div>
            ))}
            {/* Button skeleton */}
            <div className="w-24 h-7 bg-gray-700"></div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <>
      {/* Compact Stats Header */}
      <div className="bg-black px-6 lg:px-8 py-3 mb-6 -mx-6 lg:-mx-8 -mt-6 lg:-mt-8">
        <div className="max-w-6xl mx-auto">
          <div className="mb-1.5">
            <h3 className="text-[10px] font-medium text-gray-500 uppercase tracking-wider">
              KOMPRÅRE Statistieken
            </h3>
          </div>
          <div className="flex items-center justify-between gap-4 flex-wrap">
            {/* Total Comparisons */}
            <div className="flex-1 min-w-[120px]">
              <div className="text-[10px] text-gray-400 mb-0.5">
                Producten Vergeleken
              </div>
              <div className="text-lg font-bold text-white">
                {globalStats.totalComparisons.toLocaleString()}
              </div>
            </div>

            {/* Total Savings */}
            <div className="flex-1 min-w-[120px]">
              <div className="text-[10px] text-gray-400 mb-0.5">
                Totale besparing{' '}
                <span className="text-gray-500">vs België</span>
              </div>
              <div className="text-lg font-bold text-white">
                €{globalStats.totalSavings.toFixed(0)}
              </div>
            </div>

            {/* Average Savings */}
            <div className="flex-1 min-w-[120px]">
              <div className="text-[10px] text-gray-400 mb-0.5">
                Gem. besparing per product{' '}
                <span className="text-gray-500">vs België</span>
              </div>
              <div className="text-lg font-bold text-white">
                €{avgSavingsPerComparison.toFixed(2)}
              </div>
            </div>

            {/* See More Button */}
            <button
              onClick={() => setIsModalOpen(true)}
              className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium bg-white text-black hover:bg-gray-200 transition-colors border border-white"
            >
              <svg
                className="w-3 h-3"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth="2"
                  d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"
                />
              </svg>
              Meer details
            </button>
          </div>
        </div>
      </div>

      {/* Stats Modal */}
      <StatsModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        globalStats={globalStats}
        topProducts={statistics.topProducts}
        countryStats={statistics.countryStats}
        availabilityStats={statistics.availabilityStats}
        productsPerCountry={statistics.productsPerCountry}
        avgSavingsPerComparison={avgSavingsPerComparison}
        countryNames={countryNames}
      />
    </>
  );
}
