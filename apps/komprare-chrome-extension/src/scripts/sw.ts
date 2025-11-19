// Background service worker for IKEA Price Compare Extension
// Handles fetching product data from different countries
import { type StoreAvailability } from '@ikea-compare/types';
import { scrapeIkeaProduct, isScraperError } from '@ikea-compare/scrapers';
import * as ChromeStorage from '../services/chrome-storage.service';
import { getStoresByCountry } from '../utils/stores';

// Initialize user ID when service worker starts
let userId: string | null = null;

async function initializeUserId() {
  if (userId) return;

  try {
    userId = await ChromeStorage.getUserId();
    console.log('[SW] User ID initialized:', userId);
  } catch (error) {
    console.error('[SW] Failed to initialize user ID:', error);
  }
}

// Initialize on startup
initializeUserId();

interface PriceData {
  country: 'BE' | 'NL' | 'FR' | 'DE';
  price: number;
  currency: string;
  available: boolean;
  url: string;
  name?: string;
  imageUrl?: string;
  storeAvailability?: StoreAvailability;
  isCombination?: boolean;
  subproducts?: string[];
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
      isCombination: result.isCombination,
      subproducts: result.subproducts,
    };
  } catch (error) {
    console.error(`[${country}] Error fetching product data:`, error);
    return null;
  }
}

/**
 * Fetch and combine prices for combination products
 * Fetches each sub-product and sums their prices
 */
async function fetchCombinationProductPrices(
  country: keyof typeof COUNTRY_CONFIGS,
  subproducts: string[]
): Promise<{ price: number; currency: string; available: boolean } | null> {
  try {
    console.log(`[${country}] Fetching ${subproducts.length} sub-products for combination product`);

    // Fetch all sub-products in parallel
    const subproductPromises = subproducts.map((subId) =>
      scrapeIkeaProduct(country, subId)
    );
    const results = await Promise.all(subproductPromises);

    // Calculate total price
    let totalPrice = 0;
    let currency = 'EUR';
    let allAvailable = true;

    for (let i = 0; i < results.length; i++) {
      const result = results[i];
      const subId = subproducts[i];

      if (isScraperError(result)) {
        console.error(`[${country}] Failed to fetch sub-product ${subId}:`, result.message);
        return null;
      }

      totalPrice += result.price;
      currency = result.currency;

      // Product is only available if ALL sub-products are available
      if (!result.available) {
        allAvailable = false;
      }

      console.log(`[${country}] Sub-product ${subId}: €${result.price} (${result.available ? 'available' : 'unavailable'})`);
    }

    console.log(`[${country}] Combined price: €${totalPrice} (${allAvailable ? 'all available' : 'some unavailable'})`);

    return {
      price: totalPrice,
      currency,
      available: allAvailable,
    };
  } catch (error) {
    console.error(`[${country}] Error fetching combination product prices:`, error);
    return null;
  }
}

/**
 * NOTE: This function is currently unused as stock fetching for combination products
 * has been disabled due to API reliability issues. Users are directed to check
 * individual product pages instead.
 *
 * Fetch combined store availability for combination products
 * Returns the minimum availability across all sub-products
 */
/*
async function fetchCombinationStoreAvailability(
  country: keyof typeof COUNTRY_CONFIGS,
  subproducts: string[],
  buCode: string
): Promise<StoreAvailability | null> {
  try {
    console.log(`[${country}] Fetching availability for ${subproducts.length} sub-products at store ${buCode}`);

    // Fetch availability for all sub-products in parallel
    const availabilityPromises = subproducts.map((subId) =>
      fetchStoreAvailability(country, subId, buCode)
    );
    const results = await Promise.all(availabilityPromises);

    // Filter out null results
    const validResults = results.filter((r): r is StoreAvailability => r !== null);

    if (validResults.length === 0) {
      console.error(`[${country}] Failed to fetch availability for all sub-products`);
      return null;
    }

    if (validResults.length < subproducts.length) {
      console.warn(`[${country}] Only got ${validResults.length}/${subproducts.length} sub-product availabilities`);
    }

    // Calculate minimum stock across all sub-products
    const minCashCarryQuantity = Math.min(...validResults.map((r) => r.cashCarry.quantity));
    const minClickCollectQuantity = Math.min(...validResults.map((r) => r.clickCollect.quantity));

    // Determine most restrictive stock level for cash & carry
    const stockLevelPriority = {
      'OUT_OF_STOCK': 0,
      'LOW_IN_STOCK': 1,
      'MEDIUM_IN_STOCK': 2,
      'HIGH_IN_STOCK': 3,
      'UNKNOWN': 4,
    };

    const mostRestrictiveCashCarry = validResults.reduce((min, curr) => {
      const minPriority = stockLevelPriority[min.cashCarry.stockLevel];
      const currPriority = stockLevelPriority[curr.cashCarry.stockLevel];
      return currPriority < minPriority ? curr : min;
    });

    const mostRestrictiveClickCollect = validResults.reduce((min, curr) => {
      const minPriority = stockLevelPriority[min.clickCollect.stockLevel];
      const currPriority = stockLevelPriority[curr.clickCollect.stockLevel];
      return currPriority < minPriority ? curr : min;
    });

    // Find earliest restock date if any sub-product needs restocking
    const restockDates = validResults
      .map((r) => r.cashCarry.restockDate)
      .filter((date): date is string => date !== undefined)
      .sort();
    const earliestRestockDate = restockDates.length > 0 ? restockDates[0] : undefined;

    // Get the highest restock quantity (most optimistic)
    const restockQuantities = validResults
      .map((r) => r.cashCarry.restockQuantity)
      .filter((qty): qty is number => qty !== undefined);
    const maxRestockQuantity = restockQuantities.length > 0 ? Math.max(...restockQuantities) : undefined;

    const combinedAvailability: StoreAvailability = {
      buCode: validResults[0].buCode,
      storeName: validResults[0].storeName,
      cashCarry: {
        quantity: minCashCarryQuantity,
        available: minCashCarryQuantity > 0,
        stockLevel: mostRestrictiveCashCarry.cashCarry.stockLevel,
        restockDate: earliestRestockDate,
        restockQuantity: maxRestockQuantity,
      },
      clickCollect: {
        quantity: minClickCollectQuantity,
        available: minClickCollectQuantity > 0,
        stockLevel: mostRestrictiveClickCollect.clickCollect.stockLevel,
      },
      lastUpdated: new Date().toISOString(),
    };

    console.log(`[${country}] Combined availability: ${minCashCarryQuantity} units (${combinedAvailability.cashCarry.stockLevel})`);
    return combinedAvailability;
  } catch (error) {
    console.error(`[${country}] Error fetching combination availability:`, error);
    return null;
  }
}
*/

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

    const data: { availabilities?: Array<{ classUnitKey?: { classUnitCode?: string }; buyingOption?: { cashCarry?: { availability?: unknown; restocks?: unknown } } }> } = await response.json();

    console.log(
      `[${country}] Got ${data.availabilities?.length || 0} store results`
    );

    // Find availability for our specific store
    // Response structure: { availabilities: [ { classUnitKey: { classUnitCode }, buyingOption: { ... } } ] }
    const storeAvailability = data.availabilities?.find(
      (avail) => avail.classUnitKey?.classUnitCode === buCode
    );

    if (!storeAvailability) {
      console.warn(
        `[${country}] Store ${buCode} not found in availability results - treating as out of stock`
      );
      // Return out of stock availability instead of null
      // This allows combination products to still show stock (as 0)
      return {
        buCode: buCode,
        storeName: storeName,
        cashCarry: {
          quantity: 0,
          available: false,
          stockLevel: 'OUT_OF_STOCK',
        },
        clickCollect: {
          quantity: 0,
          available: false,
          stockLevel: 'OUT_OF_STOCK',
        },
        lastUpdated: new Date().toISOString(),
      };
    }

    console.log(`[${country}] Found store ${buCode} data:`, storeAvailability);

    // Extract quantity from cashCarry availability
    const cashCarryAvailability = storeAvailability.buyingOption?.cashCarry?.availability as {
      quantity?: string;
      probability?: { thisDay?: { messageType?: string } };
    } | undefined;
    let quantity = 0;
    let available = false;
    let stockLevel: StoreAvailability['cashCarry']['stockLevel'] = 'UNKNOWN';
    let restockDate: string | undefined;

    if (cashCarryAvailability) {
      quantity = parseInt(cashCarryAvailability.quantity || '0') || 0;
      available = quantity > 0;

      // Get stock level from IKEA's probability message type
      const messageType =
        cashCarryAvailability.probability?.thisDay?.messageType;
      if (messageType) {
        stockLevel = messageType as StoreAvailability['cashCarry']['stockLevel']; // IKEA uses: HIGH_IN_STOCK, MEDIUM_IN_STOCK, LOW_IN_STOCK, OUT_OF_STOCK
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
 * Track product view and add to history (Chrome Storage)
 */
async function trackProductView(
  productId: string,
  prices: Record<string, PriceData>
): Promise<void> {
  try {
    // Get product name and image from any available country
    const firstAvailablePrice = Object.values(prices).find((p) => p !== null);
    const productName = firstAvailablePrice?.name || `Product ${productId}`;
    const productImage = firstAvailablePrice?.imageUrl || '';

    // Calculate cheapest country and price
    const availablePrices = Object.entries(prices)
      .filter((entry): entry is [string, PriceData] => entry[1] !== null)
      .map(([country, data]) => ({ country, price: data.price }));

    let cheapestCountry: 'BE' | 'NL' | 'FR' | 'DE' | undefined;
    let cheapestPrice: number | undefined;

    if (availablePrices.length > 0) {
      const minPrice = Math.min(...availablePrices.map((p) => p.price));
      const cheapestItems = availablePrices.filter((p) => p.price === minPrice);
      cheapestCountry = cheapestItems[0].country as 'BE' | 'NL' | 'FR' | 'DE';
      cheapestPrice = minPrice;
    }

    // Add to Chrome Storage history
    await ChromeStorage.addToHistory({
      productId,
      name: productName,
      imageUrl: productImage,
      searchedAt: new Date().toISOString(),
      cheapestCountry,
      cheapestPrice,
    });

    console.log('[SW] Added to history:', productId);
  } catch (error) {
    console.error('[SW] Failed to track product view:', error);
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

  // Ensure user ID is initialized
  await initializeUserId();

  // First, fetch from one country to check if it's a combination product
  console.log(`[Background] Checking if ${productId} is a combination product...`);
  const firstResult = await scrapeIkeaProduct('BE', productId);

  let isCombinationProduct = false;
  let subproducts: string[] | undefined;

  if (!isScraperError(firstResult) && firstResult.isCombination && firstResult.subproducts) {
    isCombinationProduct = true;
    subproducts = firstResult.subproducts;
    console.log(`[Background] Detected combination product with ${subproducts.length} sub-products:`, subproducts);
  } else {
    console.log(`[Background] Product ${productId} is a standard product (not combination)`);
  }

  console.log(`[Background] isCombinationProduct=${isCombinationProduct}, subproducts=`, subproducts);

  // Fetch prices based on product type
  const priceResults = await Promise.all(
    countries.map(async (country) => {
      if (isCombinationProduct && subproducts) {
        // For combination products, fetch and sum sub-product prices
        const combinedResult = await fetchCombinationProductPrices(country, subproducts);
        if (!combinedResult) return null;

        // Get product details from the main product page
        const mainProduct = await scrapeIkeaProduct(country, productId);
        if (isScraperError(mainProduct)) return null;

        return {
          country,
          price: combinedResult.price,
          currency: combinedResult.currency,
          available: combinedResult.available,
          url: mainProduct.url,
          name: mainProduct.name,
          imageUrl: mainProduct.imageUrl,
          isCombination: true,
          subproducts: subproducts,
        };
      } else {
        // For standard products, use existing logic
        return fetchProductData(country, productId);
      }
    })
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
      // Get selected store buCode from Chrome Storage
      const buCode = await ChromeStorage.getSelectedStoreCode(country);
      if (!buCode) {
        console.log(`[${country}] No store selected, skipping availability`);
        return;
      }

      // Get store details
      const stores = getStoresByCountry(country);
      const selectedStore = stores.find((s) => s.buCode === buCode);
      const storeName = selectedStore?.name || `Store ${buCode}`;

      console.log(
        `[${country}] Fetching availability for store ${buCode} (${storeName})`
      );

      // Skip availability for combination products - not reliable
      if (isCombinationProduct) {
        console.log(`[${country}] Skipping availability for combination product - users should check individual product pages`);
        return;
      }

      // Fetch standard availability for single product
      console.log(`[${country}] → Fetching standard availability for product ${productId}`);
      const availability = await fetchStoreAvailability(
        country,
        productId,
        buCode
      );

      if (availability) {
        console.log(`[${country}] ✓ Successfully fetched availability:`, availability.cashCarry.stockLevel);
        prices[country].storeAvailability = availability;
      } else {
        console.log(`[${country}] ✗ Failed to fetch availability (returned null)`);
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
    return false;
  }
);

console.log('[Background] IKEA Price Compare service worker initialized');

export {};
