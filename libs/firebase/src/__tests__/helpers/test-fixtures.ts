/**
 * Test fixtures - sample data for consistent testing
 */

import type { ProductData } from '@ikea-compare/types';
import type { StorePreferences } from '../../lib/types/user-data-types';

/**
 * Create a mock ProductData object
 */
export function createMockProduct(overrides: Partial<ProductData> = {}): ProductData {
  return {
    productId: '40263850',
    name: 'BILLY Bookcase',
    price: 89.99,
    currency: 'EUR',
    imageUrl: 'https://www.ikea.com/images/billy.jpg',
    available: true,
    country: 'BE',
    url: 'https://www.ikea.com/be/nl/p/billy-bookcase-40263850/',
    ...overrides,
  };
}

/**
 * Create a set of products for all countries
 */
export function createMockProductSet(basePrice = 89.99) {
  return {
    BE: createMockProduct({ country: 'BE', price: basePrice }),
    NL: createMockProduct({ country: 'NL', price: basePrice + 5 }),
    FR: createMockProduct({ country: 'FR', price: basePrice + 10 }),
    DE: createMockProduct({ country: 'DE', price: basePrice - 5 }),
  };
}

/**
 * Create unavailable products for testing
 */
export function createUnavailableProducts() {
  return {
    BE: createMockProduct({ country: 'BE', available: false }),
    NL: createMockProduct({ country: 'NL', available: false }),
    FR: createMockProduct({ country: 'FR', available: false }),
    DE: createMockProduct({ country: 'DE', available: false }),
  };
}

/**
 * Create a mock favorite entry
 */
export function createMockFavorite(productId = '40263850') {
  return {
    productId,
    addedAt: new Date(),
    productName: 'BILLY Bookcase',
    imageUrl: 'https://www.ikea.com/images/billy.jpg',
  };
}

/**
 * Create a mock history entry
 */
export function createMockHistoryEntry(
  productId = '40263850',
  timestamp: Date = new Date()
) {
  return {
    productId,
    searchedAt: timestamp,
    productName: 'BILLY Bookcase',
    imageUrl: 'https://www.ikea.com/images/billy.jpg',
  };
}

/**
 * Create mock store preferences
 */
export function createMockStorePreferences(
  overrides: Partial<StorePreferences> = {}
): StorePreferences {
  return {
    belgium: 'gent',
    netherlands: 'amsterdam',
    france: 'paris',
    germany: 'berlin',
    ...overrides,
  };
}

/**
 * Create a mock comparison event for analytics
 */
export function createMockComparisonEvent(productId = '40263850') {
  const products = createMockProductSet();

  return {
    productId,
    productName: 'BILLY Bookcase',
    imageUrl: 'https://www.ikea.com/images/billy.jpg',
    timestamp: new Date(),
    prices: {
      belgium: products.BE.price,
      netherlands: products.NL.price,
      france: products.FR.price,
      germany: products.DE.price,
    },
    availability: {
      belgium: products.BE.available,
      netherlands: products.NL.available,
      france: products.FR.available,
      germany: products.DE.available,
    },
    cheapestCountries: ['DE'],
    savings: {
      belgium: products.BE.price - products.DE.price,
      netherlands: products.NL.price - products.DE.price,
      france: products.FR.price - products.DE.price,
      germany: 0,
    },
  };
}

/**
 * Create a mock shopping list analysis
 */
export function createMockShoppingList() {
  return {
    items: [
      {
        productId: '40263850',
        quantity: 2,
        products: createMockProductSet(89.99),
      },
      {
        productId: '20275885',
        quantity: 1,
        products: createMockProductSet(69.99),
      },
    ],
    totals: {
      belgium: 249.97,
      netherlands: 259.97,
      france: 269.97,
      germany: 239.97,
    },
    cheapestCountry: 'germany',
    cheapestTotal: 239.97,
    savings: {
      belgium: 10.0,
      netherlands: 20.0,
      france: 30.0,
      germany: 0,
    },
  };
}

/**
 * Create a shopping list with unavailable products
 */
export function createMockShoppingListWithUnavailable() {
  const availableProducts = createMockProductSet(89.99);
  const unavailableProducts = createUnavailableProducts();

  return {
    items: [
      {
        productId: '40263850',
        quantity: 1,
        products: availableProducts,
      },
      {
        productId: '99999999',
        quantity: 1,
        products: unavailableProducts,
      },
    ],
  };
}

/**
 * Create a large shopping list for performance testing
 */
export function createLargeShoppingList(itemCount = 50) {
  const items = [];
  for (let i = 0; i < itemCount; i++) {
    items.push({
      productId: `4026385${i}`,
      quantity: Math.floor(Math.random() * 5) + 1,
      products: createMockProductSet(50 + Math.random() * 100),
    });
  }
  return { items };
}

/**
 * Create mock user data
 */
export function createMockUserData(uid = 'test-uid-123') {
  return {
    uid,
    email: null,
    createdAt: new Date(),
    lastActive: new Date(),
    preferences: createMockStorePreferences(),
  };
}

/**
 * Helper to create timestamp X hours ago
 */
export function hoursAgo(hours: number): Date {
  return new Date(Date.now() - hours * 60 * 60 * 1000);
}

/**
 * Helper to create timestamp X minutes ago
 */
export function minutesAgo(minutes: number): Date {
  return new Date(Date.now() - minutes * 60 * 1000);
}

/**
 * Helper to create timestamp X days ago
 */
export function daysAgo(days: number): Date {
  return new Date(Date.now() - days * 24 * 60 * 60 * 1000);
}
