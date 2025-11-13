/**
 * Tests for Share Link API Route
 * Tests share link parsing, applink resolution, product fetching, and calculations
 */

import { POST } from '../route';
import { ShoppingListAnalysis } from '@ikea-compare/types';
import {
  validShareLink,
  singleProductShareLink,
  mixedQuantitiesShareLink,
  shareLinkWithInvalidProduct,
  emptyShareLink,
  malformedShareLinks,
  applinkUrl,
  applinkRedirectTarget,
  parsedResults,
} from '../../__tests__/fixtures/share-links';
import {
  mockProductDatabase,
  billyBookcase,
  kallaxShelf,
  poangArmchair,
} from '../../__tests__/fixtures/mock-products';
import {
  createMockFetch,
  createMockFetchWithRedirect,
  createFailingMockFetch,
  createTimeoutMockFetch,
  createMockRequestWithBody,
} from '../../__tests__/helpers/api-test-utils';

// Store original fetch
let originalFetch: typeof global.fetch;

describe('Share Link API Route', () => {
  beforeEach(() => {
    originalFetch = global.fetch;
    jest.clearAllMocks();
  });

  afterEach(() => {
    global.fetch = originalFetch;
  });

  describe('Share Link Parsing', () => {
    it('should parse valid share link with multiple products and quantities', async () => {
      global.fetch = createMockFetch(mockProductDatabase) as any;

      const request = createMockRequestWithBody({ shareLink: validShareLink });
      const response = await POST(request);
      const data: ShoppingListAnalysis = await response.json();

      expect(response.status).toBe(200);
      // validShareLink = 'receive-share/40263850:2,00373589:1,19829149:3'
      // Total: 2 + 1 + 3 = 6 products
      expect(data.totalProducts).toBe(6);
      expect(data.successfullyFetched).toBe(6);
      expect(data.failedProducts).toHaveLength(0);
    });

    it('should parse share link with single product', async () => {
      global.fetch = createMockFetch(mockProductDatabase) as any;

      const request = createMockRequestWithBody({ shareLink: singleProductShareLink });
      const response = await POST(request);
      const data: ShoppingListAnalysis = await response.json();

      expect(response.status).toBe(200);
      // singleProductShareLink = 'receive-share/40263850:1'
      expect(data.totalProducts).toBe(1);
      expect(data.products[0].productId).toBe('40263850');
    });

    it('should handle share link with mixed quantities', async () => {
      global.fetch = createMockFetch(mockProductDatabase) as any;

      const request = createMockRequestWithBody({ shareLink: mixedQuantitiesShareLink });
      const response = await POST(request);
      const data: ShoppingListAnalysis = await response.json();

      expect(response.status).toBe(200);
      // mixedQuantitiesShareLink = 'receive-share/40263850:5,00373589:2,19829149:1'
      // Total: 5 + 2 + 1 = 8 products
      expect(data.totalProducts).toBe(8);

      // Verify quantity counts per product
      const billyCount = data.products.filter(p => p.productId === '40263850').length;
      const kallaxCount = data.products.filter(p => p.productId === '00373589').length;
      const poangCount = data.products.filter(p => p.productId === '19829149').length;

      expect(billyCount).toBe(5);
      expect(kallaxCount).toBe(2);
      expect(poangCount).toBe(1);
    });

    it('should resolve applink URLs and extract products', async () => {
      // Mock fetch to handle both redirect and product fetching
      const mockFetch = jest.fn((url: string, options?: RequestInit) => {
        // Handle applink redirect
        if (url === applinkUrl && options?.method === 'HEAD') {
          return Promise.resolve({
            ok: true,
            status: 302,
            url: applinkRedirectTarget,
            headers: new Headers({
              location: applinkRedirectTarget,
            }),
          } as Response);
        }

        // Handle product fetching
        if (url.includes('/api/product/')) {
          const productIdMatch = url.match(/\/api\/product\/(\d{8})/);
          if (productIdMatch) {
            const productId = productIdMatch[1];
            const productData = mockProductDatabase[productId];
            if (productData) {
              return Promise.resolve({
                ok: true,
                status: 200,
                json: () => Promise.resolve(productData),
              } as Response);
            }
          }
        }

        return Promise.resolve({
          ok: false,
          status: 404,
        } as Response);
      });

      global.fetch = mockFetch as any;

      const request = createMockRequestWithBody({ shareLink: applinkUrl });
      const response = await POST(request);
      const data: ShoppingListAnalysis = await response.json();

      expect(response.status).toBe(200);
      expect(data.totalProducts).toBe(3); // 2 + 1 from the redirected share link
      expect(mockFetch).toHaveBeenCalledWith(applinkUrl, expect.objectContaining({
        method: 'HEAD',
      }));
    });

    it('should handle full URL share links', async () => {
      global.fetch = createMockFetch(mockProductDatabase) as any;

      const fullUrl = 'https://www.ikea.com/be/nl/shoppingcart/receive-share/40263850:2,00373589:1';

      const request = createMockRequestWithBody({ shareLink: fullUrl });
      const response = await POST(request);
      const data: ShoppingListAnalysis = await response.json();

      expect(response.status).toBe(200);
      expect(data.totalProducts).toBe(3);
    });

    it('should return error for missing share link', async () => {
      const request = createMockRequestWithBody({});
      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.error).toContain('vereist');
    });

    it('should return error for empty share link', async () => {
      const request = createMockRequestWithBody({ shareLink: '' });
      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.error).toContain('vereist');
    });

    it('should handle malformed share link format - invalid-format', async () => {
      const request = createMockRequestWithBody({ shareLink: 'invalid-format' });
      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.error).toContain('Geen productcodes');
    });

    it('should handle malformed share link format - receive-share with no data', async () => {
      const request = createMockRequestWithBody({ shareLink: 'receive-share/' });
      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.error).toContain('Geen productcodes');
    });
  });

  describe('Product Fetching', () => {
    it('should fetch all products from share link successfully', async () => {
      global.fetch = createMockFetch(mockProductDatabase) as any;

      const request = createMockRequestWithBody({ shareLink: validShareLink });
      const response = await POST(request);
      const data: ShoppingListAnalysis = await response.json();

      expect(response.status).toBe(200);
      expect(data.successfullyFetched).toBe(6);
      expect(data.failedProducts).toHaveLength(0);

      // Verify all products have data
      data.products.forEach(product => {
        expect(product.products.belgium).toBeDefined();
        expect(product.products.netherlands).toBeDefined();
        expect(product.cheapest).toBeDefined();
      });
    });

    it('should handle partial product fetch failures', async () => {
      global.fetch = createMockFetch(mockProductDatabase) as any;

      // Share link with one invalid product: 40263850:1,99999999:1
      const shareLink = 'receive-share/40263850:1,99999999:1';

      const request = createMockRequestWithBody({ shareLink });
      const response = await POST(request);
      const data: ShoppingListAnalysis = await response.json();

      expect(response.status).toBe(200);
      expect(data.totalProducts).toBe(2);
      expect(data.successfullyFetched).toBe(1);
      expect(data.failedProducts).toContain('99999999');
    });

    it('should handle all products failing to fetch', async () => {
      global.fetch = createMockFetch({}) as any; // Empty database

      const request = createMockRequestWithBody({ shareLink: singleProductShareLink });
      const response = await POST(request);
      const data: ShoppingListAnalysis = await response.json();

      expect(response.status).toBe(200);
      expect(data.successfullyFetched).toBe(0);
      expect(data.failedProducts).toHaveLength(1);
    });

    it('should handle timeout during product fetch', async () => {
      global.fetch = createTimeoutMockFetch(100) as any;

      const request = createMockRequestWithBody({ shareLink: singleProductShareLink });
      const response = await POST(request);
      const data: ShoppingListAnalysis = await response.json();

      expect(response.status).toBe(200);
      expect(data.failedProducts).toHaveLength(1);
    });

    it('should propagate product API errors correctly', async () => {
      global.fetch = createFailingMockFetch('Network error') as any;

      const request = createMockRequestWithBody({ shareLink: singleProductShareLink });
      const response = await POST(request);
      const data: ShoppingListAnalysis = await response.json();

      expect(response.status).toBe(200);
      expect(data.successfullyFetched).toBe(0);
      expect(data.failedProducts.length).toBeGreaterThan(0);
    });
  });

  describe('Calculation Logic', () => {
    it('should calculate store totals correctly', async () => {
      global.fetch = createMockFetch(mockProductDatabase) as any;

      const request = createMockRequestWithBody({ shareLink: singleProductShareLink });
      const response = await POST(request);
      const data: ShoppingListAnalysis = await response.json();

      expect(response.status).toBe(200);

      const beTotal = data.singleStoreStrategy.all.find(s => s.storeCode === 'BE');
      const nlTotal = data.singleStoreStrategy.all.find(s => s.storeCode === 'NL');

      // BILLY prices: BE=69.99, NL=74.99, FR=79.99, DE=72.99
      expect(beTotal?.totalCost).toBe(69.99);
      expect(nlTotal?.totalCost).toBe(74.99);
      expect(beTotal?.availableProducts).toBe(1);
    });

    it('should select best single store based on lowest cost', async () => {
      global.fetch = createMockFetch(mockProductDatabase) as any;

      const request = createMockRequestWithBody({ shareLink: validShareLink });
      const response = await POST(request);
      const data: ShoppingListAnalysis = await response.json();

      expect(response.status).toBe(200);
      expect(data.singleStoreStrategy.best.storeCode).toBe('BE');

      // Verify Belgium has the lowest total
      const allTotals = data.singleStoreStrategy.all.map(s => s.totalCost);
      expect(data.singleStoreStrategy.best.totalCost).toBe(Math.min(...allTotals));
    });

    it('should calculate multi-store optimization strategy', async () => {
      global.fetch = createMockFetch(mockProductDatabase) as any;

      const request = createMockRequestWithBody({ shareLink: validShareLink });
      const response = await POST(request);
      const data: ShoppingListAnalysis = await response.json();

      expect(response.status).toBe(200);
      expect(data.multiStoreStrategy).toBeDefined();
      expect(data.multiStoreStrategy.totalCost).toBeGreaterThan(0);
      expect(data.multiStoreStrategy.breakdown.length).toBeGreaterThan(0);

      // Verify breakdown sums to total
      const breakdownTotal = data.multiStoreStrategy.breakdown.reduce(
        (sum, store) => sum + store.subtotal,
        0
      );
      expect(breakdownTotal).toBeCloseTo(data.multiStoreStrategy.totalCost, 2);
    });

    it('should calculate savings correctly (single vs multi-store)', async () => {
      global.fetch = createMockFetch(mockProductDatabase) as any;

      const request = createMockRequestWithBody({ shareLink: validShareLink });
      const response = await POST(request);
      const data: ShoppingListAnalysis = await response.json();

      expect(response.status).toBe(200);

      const singleStoreCost = data.singleStoreStrategy.best.totalCost;
      const multiStoreCost = data.multiStoreStrategy.totalCost;
      const expectedSavings = singleStoreCost - multiStoreCost;

      expect(data.multiStoreStrategy.savings).toBeCloseTo(expectedSavings, 2);
      // Multi-store should be cheaper or equal
      expect(multiStoreCost).toBeLessThanOrEqual(singleStoreCost);
    });

    it('should handle all products unavailable in calculations', async () => {
      global.fetch = createMockFetch({
        '91754698': mockProductDatabase['91754698'], // unavailableProduct
      }) as any;

      const shareLink = 'receive-share/91754698:2';

      const request = createMockRequestWithBody({ shareLink });
      const response = await POST(request);
      const data: ShoppingListAnalysis = await response.json();

      expect(response.status).toBe(200);

      // All store totals should be 0
      data.singleStoreStrategy.all.forEach(store => {
        expect(store.totalCost).toBe(0);
        expect(store.availableProducts).toBe(0);
        expect(store.unavailableProducts).toBe(2);
      });
    });

    it('should handle price ties between stores correctly', async () => {
      global.fetch = createMockFetch(mockProductDatabase) as any;

      const shareLink = 'receive-share/29227519:1'; // productWithPriceTies

      const request = createMockRequestWithBody({ shareLink });
      const response = await POST(request);
      const data: ShoppingListAnalysis = await response.json();

      expect(response.status).toBe(200);

      // BE and NL both have price 120.00
      const beStore = data.singleStoreStrategy.all.find(s => s.storeCode === 'BE');
      const nlStore = data.singleStoreStrategy.all.find(s => s.storeCode === 'NL');

      expect(beStore?.totalCost).toBe(120.00);
      expect(nlStore?.totalCost).toBe(120.00);

      // Best store should be one of the tied stores
      expect(['BE', 'NL']).toContain(data.singleStoreStrategy.best.storeCode);
    });

    it('should multiply quantities accurately in totals', async () => {
      global.fetch = createMockFetch(mockProductDatabase) as any;

      const shareLink = 'receive-share/40263850:3'; // 3x BILLY at 69.99 BE

      const request = createMockRequestWithBody({ shareLink });
      const response = await POST(request);
      const data: ShoppingListAnalysis = await response.json();

      expect(response.status).toBe(200);

      const beStore = data.singleStoreStrategy.all.find(s => s.storeCode === 'BE');
      expect(beStore?.totalCost).toBeCloseTo(69.99 * 3, 2);
      expect(beStore?.availableProducts).toBe(3);
    });

    it('should exclude failed products from total calculations', async () => {
      global.fetch = createMockFetch(mockProductDatabase) as any;

      // Mix of valid and invalid products
      const shareLink = 'receive-share/40263850:2,99999999:3';

      const request = createMockRequestWithBody({ shareLink });
      const response = await POST(request);
      const data: ShoppingListAnalysis = await response.json();

      expect(response.status).toBe(200);
      expect(data.totalProducts).toBe(5); // 2 + 3
      expect(data.successfullyFetched).toBe(2); // Only BILLY x2
      expect(data.failedProducts).toContain('99999999');

      // Totals should only include successful products
      const beStore = data.singleStoreStrategy.all.find(s => s.storeCode === 'BE');
      expect(beStore?.totalCost).toBeCloseTo(69.99 * 2, 2);
      expect(beStore?.availableProducts).toBe(2);
    });
  });

  describe('Error Handling', () => {
    it('should return 400 when share link is missing', async () => {
      const request = createMockRequestWithBody({});
      const response = await POST(request);

      expect(response.status).toBe(400);
      const data = await response.json();
      expect(data.error).toBeDefined();
    });

    it('should handle share link with no product codes', async () => {
      const request = createMockRequestWithBody({ shareLink: 'invalid-format' });
      const response = await POST(request);

      expect(response.status).toBe(400);
      const data = await response.json();
      expect(data.error).toContain('Geen productcodes');
    });

    it('should handle network errors during applink resolution', async () => {
      global.fetch = createFailingMockFetch('Network error') as any;

      const request = createMockRequestWithBody({ shareLink: applinkUrl });
      const response = await POST(request);

      // Should fallback and try to parse applink URL directly
      // The applinkUrl contains receive-share data in query param, so parsing succeeds
      // but all product fetches will fail due to network error
      expect(response.status).toBe(200);
      const data = await response.json();
      expect(data.failedProducts.length).toBeGreaterThan(0);
      expect(data.successfullyFetched).toBe(0);
    });
  });
});
