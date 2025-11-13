import {
  doc,
  increment,
  serverTimestamp,
  writeBatch,
  getDoc,
  Firestore,
} from 'firebase/firestore';
import { db } from '../firebase';
import type { ProductComparisonResult } from '@ikea-compare/types';
import type { ShoppingListAnalysis, ShoppingListProduct } from '../types/shopping-list-types';

/**
 * Track a single product comparison
 * @param result - The product comparison result
 * @param firestoreDb - Optional Firestore instance (for Chrome extension use)
 */
export async function trackProductComparison(
  result: ProductComparisonResult,
  firestoreDb?: Firestore
): Promise<void> {
  try {
    const dbInstance = firestoreDb || db;
    if (!dbInstance) {
      console.warn('Firestore not initialized, skipping analytics tracking');
      return;
    }
    const batch = writeBatch(dbInstance);

    // Get all available products with their countries
    const availableProducts = Object.entries(result.products)
      .filter(([_, p]) => p !== null)
      .map(([country, p]) => ({ country: country as keyof typeof result.products, data: p! }));

    if (availableProducts.length < 2) {
      return; // Need at least 2 prices to calculate meaningful stats
    }

    const prices = availableProducts.map(p => p.data.price);
    const maxPrice = Math.max(...prices);
    const minPrice = Math.min(...prices);
    const savings = maxPrice - minPrice;

    // Find cheapest and most expensive countries
    const cheapestCountries = availableProducts
      .filter(p => p.data.price === minPrice)
      .map(p => p.country);
    const mostExpensiveCountries = availableProducts
      .filter(p => p.data.price === maxPrice)
      .map(p => p.country);

    // Update global stats
    const globalStatsRef = doc(dbInstance, 'analytics', 'global-stats');
    batch.set(
      globalStatsRef,
      {
        totalComparisons: increment(1),
        totalSavings: increment(savings),
        lastUpdated: serverTimestamp(),
      },
      { merge: true }
    );

    // Update product stats with price range and countries
    const productName = availableProducts[0].data.name;
    const productImage = availableProducts[0].data.imageUrl;
    const countriesCompared = availableProducts.map(p => p.country);

    const productStatsRef = doc(dbInstance, 'product-stats', result.productId);
    const productStatsSnapshot = await getDoc(productStatsRef);
    const currentMaxDiff = productStatsSnapshot.exists()
      ? productStatsSnapshot.data().maxPriceDifference || 0
      : 0;

    // Convert country keys to country codes
    const countryToCode = (country: string): string => {
      return country === 'belgium' ? 'BE' :
             country === 'netherlands' ? 'NL' :
             country === 'france' ? 'FR' : 'DE';
    };

    const cheapestCountryCodes = cheapestCountries.map(c => countryToCode(c as string));
    const mostExpensiveCountryCodes = mostExpensiveCountries.map(c => countryToCode(c as string));

    batch.set(
      productStatsRef,
      {
        productId: result.productId,
        name: productName,
        imageUrl: productImage,
        comparisonCount: increment(1),
        maxPriceDifference: savings > currentMaxDiff ? savings : currentMaxDiff,
        minPrice: minPrice,
        maxPrice: maxPrice,
        countriesCompared: countriesCompared,
        cheapestCountries: cheapestCountryCodes,
        mostExpensiveCountries: mostExpensiveCountryCodes,
        lastComparedAt: serverTimestamp(),
      },
      { merge: true }
    );

    // Track country-level statistics
    for (const { country, data } of availableProducts) {
      const countryCode = country === 'belgium' ? 'BE' :
                          country === 'netherlands' ? 'NL' :
                          country === 'france' ? 'FR' : 'DE';

      const countryStatsRef = doc(dbInstance, 'country-stats', countryCode);

      // Calculate price difference vs Belgium (reference country)
      const belgiumPrice = result.products.belgium?.price;
      const priceDifference = belgiumPrice ? data.price - belgiumPrice : 0;

      batch.set(
        countryStatsRef,
        {
          country: countryCode,
          timesWasCheapest: increment(cheapestCountries.includes(country) ? 1 : 0),
          timesWasMostExpensive: increment(mostExpensiveCountries.includes(country) ? 1 : 0),
          totalPriceDifference: increment(priceDifference),
          comparisonCount: increment(1),
        },
        { merge: true }
      );
    }

    // Track product availability patterns
    const allCountries = ['belgium', 'netherlands', 'france', 'germany'];
    const availableInAllCountries = allCountries.every(c => result.products[c as keyof typeof result.products] !== null);

    const availabilityStatsRef = doc(dbInstance, 'product-availability-stats', result.productId);
    batch.set(
      availabilityStatsRef,
      {
        productId: result.productId,
        availableInAllCountries,
        availableCountries: countriesCompared,
        lastChecked: serverTimestamp(),
      },
      { merge: true }
    );

    await batch.commit();
  } catch (error) {
    console.error('Error tracking product comparison:', error);
    // Don't throw - analytics failures shouldn't break the app
  }
}

/**
 * Track a shopping list comparison (share link or PDF)
 */
export async function trackShoppingListComparison(
  analysis: ShoppingListAnalysis
): Promise<void> {
  try {
    if (!db) {
      console.warn('Firestore not initialized, skipping analytics tracking');
      return;
    }
    const batch = writeBatch(db);

    // Deduplicate products - only track unique products for analytics
    // Multiple quantities of the same product should only count as 1 comparison
    const uniqueProducts = new Map<string, typeof analysis.products[0]>();
    for (const product of analysis.products) {
      if (!uniqueProducts.has(product.productId)) {
        uniqueProducts.set(product.productId, product);
      }
    }

    // Only count products that successfully fetched from at least one country
    const successfulProducts = Array.from(uniqueProducts.values()).filter(
      (p) =>
        p.products.belgium ||
        p.products.netherlands ||
        p.products.france ||
        p.products.germany
    );

    // Calculate savings compared to Belgium (matching what's displayed in UI)
    // This ensures savings are always positive or zero and match user expectations
    // IMPORTANT: Use analysis.products (with quantities), not uniqueProducts
    const belgiumTotal = analysis.products
      .filter((p: ShoppingListProduct) => p.products.belgium)
      .reduce((sum: number, p: ShoppingListProduct) => sum + p.products.belgium!.price, 0);

    const savings = belgiumTotal - analysis.multiStoreStrategy.totalCost;

    // Count all items with quantities (for shopping lists, quantities matter)
    const totalItems = analysis.products.filter(
      (p) =>
        p.products.belgium ||
        p.products.netherlands ||
        p.products.france ||
        p.products.germany
    ).length;

    // Update global stats with total item count including quantities
    const globalStatsRef = doc(db, 'analytics', 'global-stats');
    batch.set(
      globalStatsRef,
      {
        totalComparisons: increment(totalItems),
        totalSavings: increment(savings),
        lastUpdated: serverTimestamp(),
      },
      { merge: true }
    );

    // Update stats for each successfully fetched product in the shopping list
    for (const product of successfulProducts) {
      // Get all available products with their countries
      const availableProducts = Object.entries(product.products)
        .filter(([_, p]) => p !== null)
        .map(([country, p]) => ({ country: country as keyof typeof product.products, data: p! }));

      if (availableProducts.length < 2) {
        continue; // Skip products with only one price
      }

      const prices = availableProducts.map(p => p.data.price);
      const maxPrice = Math.max(...prices);
      const minPrice = Math.min(...prices);
      const productSavings = maxPrice - minPrice;

      // Find cheapest and most expensive countries
      const cheapestCountries = availableProducts
        .filter(p => p.data.price === minPrice)
        .map(p => p.country);
      const mostExpensiveCountries = availableProducts
        .filter(p => p.data.price === maxPrice)
        .map(p => p.country);

      // Update product stats with price range
      const productName = availableProducts[0].data.name;
      const productImage = availableProducts[0].data.imageUrl;
      const countriesCompared = availableProducts.map(p => p.country);

      const productStatsRef = doc(db, 'product-stats', product.productId);
      const productStatsSnapshot = await getDoc(productStatsRef);
      const currentMaxDiff = productStatsSnapshot.exists()
        ? productStatsSnapshot.data().maxPriceDifference || 0
        : 0;

      // Convert country keys to country codes
      const countryToCode = (country: string): string => {
        return country === 'belgium' ? 'BE' :
               country === 'netherlands' ? 'NL' :
               country === 'france' ? 'FR' : 'DE';
      };

      const cheapestCountryCodes = cheapestCountries.map(c => countryToCode(c as string));
      const mostExpensiveCountryCodes = mostExpensiveCountries.map(c => countryToCode(c as string));

      batch.set(
        productStatsRef,
        {
          productId: product.productId,
          name: productName,
          imageUrl: productImage,
          comparisonCount: increment(1),
          maxPriceDifference: productSavings > currentMaxDiff ? productSavings : currentMaxDiff,
          minPrice: minPrice,
          maxPrice: maxPrice,
          countriesCompared: countriesCompared,
          cheapestCountries: cheapestCountryCodes,
          mostExpensiveCountries: mostExpensiveCountryCodes,
          lastComparedAt: serverTimestamp(),
        },
        { merge: true }
      );

      // Track country-level statistics
      for (const { country, data } of availableProducts) {
        const countryCode = country === 'belgium' ? 'BE' :
                            country === 'netherlands' ? 'NL' :
                            country === 'france' ? 'FR' : 'DE';

        const countryStatsRef = doc(db, 'country-stats', countryCode);

        // Calculate price difference vs Belgium (reference country)
        const belgiumPrice = product.products.belgium?.price;
        const priceDifference = belgiumPrice ? data.price - belgiumPrice : 0;

        batch.set(
          countryStatsRef,
          {
            country: countryCode,
            timesWasCheapest: increment(cheapestCountries.includes(country) ? 1 : 0),
            timesWasMostExpensive: increment(mostExpensiveCountries.includes(country) ? 1 : 0),
            totalPriceDifference: increment(priceDifference),
            comparisonCount: increment(1),
          },
          { merge: true }
        );
      }

      // Track product availability patterns
      const allCountries = ['belgium', 'netherlands', 'france', 'germany'];
      const availableInAllCountries = allCountries.every(c => product.products[c as keyof typeof product.products] !== null);

      const availabilityStatsRef = doc(db, 'product-availability-stats', product.productId);
      batch.set(
        availabilityStatsRef,
        {
          productId: product.productId,
          availableInAllCountries,
          availableCountries: countriesCompared,
          lastChecked: serverTimestamp(),
        },
        { merge: true }
      );
    }

    await batch.commit();
  } catch (error) {
    console.error('Error tracking shopping list comparison:', error);
    // Don't throw - analytics failures shouldn't break the app
  }
}

/**
 * Get global analytics stats
 */
export async function getGlobalStats() {
  try {
    if (!db) {
      return {
        totalComparisons: 0,
        totalSavings: 0,
        lastUpdated: null,
      };
    }
    const globalStatsRef = doc(db, 'analytics', 'global-stats');
    const snapshot = await getDoc(globalStatsRef);

    if (!snapshot.exists()) {
      return {
        totalComparisons: 0,
        totalSavings: 0,
        lastUpdated: null,
      };
    }

    return snapshot.data() as {
      totalComparisons: number;
      totalSavings: number;
      lastUpdated: any;
    };
  } catch (error) {
    console.error('Error getting global stats:', error);
    return {
      totalComparisons: 0,
      totalSavings: 0,
      lastUpdated: null,
    };
  }
}
