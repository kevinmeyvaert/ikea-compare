// Background service worker for IKEA Price Compare Extension
// Handles fetching product data from different countries
import { db, auth } from '../lib/firebase-extension';
import { signInAnonymously } from 'firebase/auth';
import {
  trackProductComparison,
  addToHistory,
  getSelectedStore,
  getStoresByCountry,
} from '@ikea-compare/firebase';
import { type StoreAvailability } from '@ikea-compare/types';
import { scrapeIkeaProduct, isScraperError } from '@ikea-compare/scrapers';

// Initialize Firebase Anonymous Auth
let isAuthInitialized = false;
let authPromise: Promise<void> | null = null;

async function initializeAuth() {
  if (isAuthInitialized) return;
  if (authPromise) return authPromise;

  authPromise = (async () => {
    try {
      const userCredential = await signInAnonymously(auth);
      console.log(
        '[Firebase SW] Anonymous auth initialized:',
        userCredential.user.uid
      );

      // Verify auth.currentUser is set
      if (auth.currentUser) {
        console.log(
          '[Firebase SW] auth.currentUser confirmed:',
          auth.currentUser.uid
        );
        isAuthInitialized = true;
      } else {
        console.warn('[Firebase SW] auth.currentUser is null after sign in');
      }
    } catch (error) {
      console.error('[Firebase SW] Auth initialization failed:', error);
    } finally {
      authPromise = null;
    }
  })();

  return authPromise;
}

// Initialize auth when service worker starts
initializeAuth();

interface PriceData {
  country: 'BE' | 'NL' | 'FR' | 'DE';
  price: number;
  currency: string;
  available: boolean;
  url: string;
  name?: string;
  imageUrl?: string;
  storeAvailability?: StoreAvailability;
}

interface FetchPricesMessage {
  type: 'FETCH_PRICES';
  productId: string;
}

interface FetchPricesResponse {
  success: boolean;
  prices?: Record<string, PriceData>;
  error?: string;
}

const COUNTRY_CONFIGS = {
  BE: {
    code: 'be',
    language: 'nl',
    baseUrl: 'https://www.ikea.com/be/nl',
  },
  NL: {
    code: 'nl',
    language: 'nl',
    baseUrl: 'https://www.ikea.com/nl/nl',
  },
  FR: {
    code: 'fr',
    language: 'fr',
    baseUrl: 'https://www.ikea.com/fr/fr',
  },
  DE: {
    code: 'de',
    language: 'de',
    baseUrl: 'https://www.ikea.com/de/de',
  },
} as const;

/**
 * Fetch product data for a specific country using shared scraper
 */
async function fetchProductData(
  country: keyof typeof COUNTRY_CONFIGS,
  productId: string
): Promise<PriceData | null> {
  try {
    console.log(`[${country}] Fetching product ${productId}`);

    const result = await scrapeIkeaProduct(country, productId);

    if (isScraperError(result)) {
      console.error(`[${country}] Scraper error:`, result.message);
      return null;
    }

    console.log(`[${country}] Successfully scraped:`, result);

    return {
      country,
      price: result.price,
      currency: result.currency,
      available: result.available,
      url: result.url,
      name: result.name,
      imageUrl: result.imageUrl,
    };
  } catch (error) {
    console.error(`[${country}] Error fetching product data:`, error);
    return null;
  }
}

/**
 * Fetch store availability from IKEA API for a specific product and store
 */
async function fetchStoreAvailability(
  country: keyof typeof COUNTRY_CONFIGS,
  productId: string,
  buCode: string
): Promise<StoreAvailability | null> {
  try {
    // Get store name
    const stores = getStoresByCountry(country);
    const store = stores.find((s) => s.buCode === buCode);
    const storeName = store ? store.name : `Store ${buCode}`;

    const ikeaCountry = COUNTRY_CONFIGS[country].code;
    const apiUrl = `https://api.ingka.ikea.com/cia/availabilities/ru/${ikeaCountry}?itemNos=${productId}&expand=StoresList,Restocks`;

    console.log(
      `[${country}] Fetching availability for store ${buCode} (${storeName}) from:`,
      apiUrl
    );

    const response = await fetch(apiUrl, {
      method: 'GET',
      headers: {
        Accept: 'application/json;version=1',
        'x-client-id': 'b6c117e5-ae61-4ef5-b4cc-e0b1e37f0631',
        'User-Agent':
          'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
      },
    });

    if (!response.ok) {
      console.error(`[${country}] Availability API HTTP ${response.status}`);
      return null;
    }

    const data = await response.json();

    console.log(
      `[${country}] Got ${data.availabilities?.length || 0} store results`
    );

    // Find availability for our specific store
    // Response structure: { availabilities: [ { classUnitKey: { classUnitCode }, buyingOption: { ... } } ] }
    const storeAvailability = data.availabilities?.find(
      (avail: any) => avail.classUnitKey?.classUnitCode === buCode
    );

    if (!storeAvailability) {
      console.error(
        `[${country}] Store ${buCode} not found in availability results`
      );
      return null;
    }

    console.log(`[${country}] Found store ${buCode} data:`, storeAvailability);

    // Extract quantity from cashCarry availability
    const cashCarryAvailability =
      storeAvailability.buyingOption?.cashCarry?.availability;
    let quantity = 0;
    let available = false;
    let stockLevel: StoreAvailability['cashCarry']['stockLevel'] = 'UNKNOWN';
    let restockDate: string | undefined;

    if (cashCarryAvailability) {
      quantity = parseInt(cashCarryAvailability.quantity) || 0;
      available = quantity > 0;

      // Get stock level from IKEA's probability message type
      const messageType =
        cashCarryAvailability.probability?.thisDay?.messageType;
      if (messageType) {
        stockLevel = messageType as any; // IKEA uses: HIGH_IN_STOCK, MEDIUM_IN_STOCK, LOW_IN_STOCK, OUT_OF_STOCK
      } else {
        // Fallback: determine stock level based on quantity
        if (quantity === 0) {
          stockLevel = 'OUT_OF_STOCK';
        } else if (quantity >= 10) {
          stockLevel = 'HIGH_IN_STOCK';
        } else if (quantity >= 5) {
          stockLevel = 'MEDIUM_IN_STOCK';
        } else {
          stockLevel = 'LOW_IN_STOCK';
        }
      }

      // Check for restock information
      const restocks = storeAvailability.buyingOption?.cashCarry?.restocks;
      if (restocks && Array.isArray(restocks) && restocks.length > 0) {
        const nextRestock = restocks[0];
        if (nextRestock.earliestDate) {
          restockDate = nextRestock.earliestDate;
        }
      }
    }

    const availability: StoreAvailability = {
      buCode,
      storeName,
      cashCarry: {
        quantity,
        available,
        stockLevel,
        restockDate,
        restockQuantity: undefined,
      },
      clickCollect: {
        quantity,
        available,
        stockLevel,
      },
      lastUpdated: new Date().toISOString(),
    };

    console.log(
      `[${country}] Availability fetched for store ${buCode}:`,
      availability
    );
    return availability;
  } catch (error) {
    console.error(`[${country}] Error fetching availability:`, error);
    return null;
  }
}

/**
 * Track product view in Firebase analytics and add to history
 */
async function trackProductView(
  productId: string,
  prices: Record<string, PriceData>
): Promise<void> {
  try {
    // Ensure auth is initialized
    await initializeAuth();

    // Get product name and image from any available country
    const firstAvailablePrice = Object.values(prices).find((p) => p !== null);
    const productName = firstAvailablePrice?.name || `Product ${productId}`;
    const productImage = firstAvailablePrice?.imageUrl || '';

    // Calculate cheapest country and price
    const availablePrices = Object.entries(prices)
      .filter(([_, data]) => data !== null)
      .map(([country, data]) => ({ country, price: data!.price }));

    let cheapestCountry: 'BE' | 'NL' | 'FR' | 'DE' | undefined;
    let cheapestPrice: number | undefined;
    let cheapestCountries: ('BE' | 'NL' | 'FR' | 'DE')[] | null = null;

    if (availablePrices.length > 0) {
      const minPrice = Math.min(...availablePrices.map((p) => p.price));
      cheapestCountries = availablePrices
        .filter((p) => p.price === minPrice)
        .map((p) => p.country as 'BE' | 'NL' | 'FR' | 'DE');
      cheapestCountry = cheapestCountries[0];
      cheapestPrice = minPrice;
    }

    // Convert prices to ProductComparisonResult format
    const comparisonResult = {
      productId,
      cheapest: cheapestCountries,
      products: {
        belgium: prices['BE']
          ? {
              productId,
              price: prices['BE'].price,
              name: productName,
              imageUrl: productImage,
              currency: prices['BE'].currency,
              available: prices['BE'].available,
              country: 'BE' as const,
              url: prices['BE'].url,
            }
          : null,
        netherlands: prices['NL']
          ? {
              productId,
              price: prices['NL'].price,
              name: productName,
              imageUrl: productImage,
              currency: prices['NL'].currency,
              available: prices['NL'].available,
              country: 'NL' as const,
              url: prices['NL'].url,
            }
          : null,
        france: prices['FR']
          ? {
              productId,
              price: prices['FR'].price,
              name: productName,
              imageUrl: productImage,
              currency: prices['FR'].currency,
              available: prices['FR'].available,
              country: 'FR' as const,
              url: prices['FR'].url,
            }
          : null,
        germany: prices['DE']
          ? {
              productId,
              price: prices['DE'].price,
              name: productName,
              imageUrl: productImage,
              currency: prices['DE'].currency,
              available: prices['DE'].available,
              country: 'DE' as const,
              url: prices['DE'].url,
            }
          : null,
      },
    };

    // Track in Firebase (pass the extension's db instance)
    await trackProductComparison(comparisonResult, db);
    console.log('[Firebase SW] Tracked product comparison:', productId);

    // Add to history
    await addToHistory(
      {
        productId,
        name: productName,
        imageUrl: productImage,
        cheapestCountry,
        cheapestPrice,
      },
      db,
      auth
    );
    console.log('[Firebase SW] Added to history:', productId);
  } catch (error) {
    console.error('[Firebase SW] Failed to track product view:', error);
    // Don't throw - tracking failure shouldn't break the extension
  }
}

/**
 * Fetch prices and availability from all countries
 */
async function fetchAllPrices(
  productId: string
): Promise<Record<string, PriceData>> {
  const countries: Array<keyof typeof COUNTRY_CONFIGS> = [
    'BE',
    'NL',
    'FR',
    'DE',
  ];

  console.log(
    `[Background] Fetching prices and availability for product ${productId} from all countries`
  );

  // Ensure auth is initialized before fetching store preferences
  await initializeAuth();
  console.log('[Background] Auth state after init:', {
    currentUser: auth.currentUser?.uid,
    isInitialized: isAuthInitialized,
  });

  // First, fetch all prices
  const priceResults = await Promise.all(
    countries.map((country) => fetchProductData(country, productId))
  );

  const prices: Record<string, PriceData> = {};

  // Add price data to result
  priceResults.forEach((data, index) => {
    if (data) {
      prices[countries[index]] = data;
    }
  });

  console.log(`[Background] Fetched ${Object.keys(prices).length} prices`);

  // Now fetch availability for each country's selected store
  const availabilityPromises = countries.map(async (country) => {
    if (!prices[country]) return; // Skip if no price data

    try {
      const selectedStore = await getSelectedStore(country, db, auth);
      if (!selectedStore) {
        console.log(`[${country}] No store selected, skipping availability`);
        return;
      }

      console.log(
        `[${country}] Fetching availability for store ${selectedStore.buCode} (${selectedStore.name})`
      );
      const availability = await fetchStoreAvailability(
        country,
        productId,
        selectedStore.buCode
      );

      if (availability) {
        prices[country].storeAvailability = availability;
      }
    } catch (error) {
      console.error(`[${country}] Failed to fetch availability:`, error);
      // Don't fail the whole request if availability fails
    }
  });

  await Promise.all(availabilityPromises);

  console.log(`[Background] Completed fetching prices and availability`);

  return prices;
}

/**
 * Message listener
 */
chrome.runtime.onMessage.addListener(
  (message: FetchPricesMessage, sender, sendResponse) => {
    if (message.type === 'FETCH_PRICES') {
      console.log(
        `[Background] Received FETCH_PRICES request for product ${message.productId}`
      );

      fetchAllPrices(message.productId)
        .then(async (prices) => {
          // Track product comparison in Firebase analytics
          await trackProductView(message.productId, prices);

          const response: FetchPricesResponse = {
            success: true,
            prices,
          };
          sendResponse(response);
        })
        .catch((error) => {
          console.error('[Background] Error fetching prices:', error);
          const response: FetchPricesResponse = {
            success: false,
            error: error.message || 'Failed to fetch prices',
          };
          sendResponse(response);
        });

      // Return true to indicate we'll send response asynchronously
      return true;
    }
  }
);

console.log('[Background] IKEA Price Compare service worker initialized');

export {};
