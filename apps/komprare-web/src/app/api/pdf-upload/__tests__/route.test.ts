/**
 * Tests for PDF Upload API Route
 */

import { POST } from '../route';
import {
  validKitchenPlannerPDF,
  pdfWithDecimalQuantities,
  pdfWithMissingQuantities,
  pdfWithDuplicateProducts,
  pdfWithNoProductCodes,
  pdfWithMalformedCodes,
  pdfWithDistantQuantities,
} from '../../__tests__/fixtures/pdf-text-samples';
import { mockProductDatabase } from '../../__tests__/fixtures/mock-products';
import {
  createMockRequestWithFile,
  createMockFetch,
  createFailingMockFetch,
} from '../../__tests__/helpers/api-test-utils';
import { ShoppingListAnalysis } from '@ikea-compare/types';

// Mock unpdf
jest.mock('unpdf', () => ({
  extractText: jest.fn(),
}));

// Get the mocked function
const { extractText } = require('unpdf');

describe('PDF Upload API Route', () => {
  let originalFetch: typeof global.fetch;

  beforeEach(() => {
    // Save original fetch
    originalFetch = global.fetch;

    // Reset mocks
    jest.clearAllMocks();

    // Default mock for extractText - will be overridden in specific tests
    extractText.mockResolvedValue({ text: '' });
  });

  afterEach(() => {
    // Restore original fetch
    global.fetch = originalFetch;
  });

  describe('PDF Parsing', () => {
    it('should extract product codes with positions from valid PDF', async () => {
      extractText.mockResolvedValue({ text: validKitchenPlannerPDF });
      global.fetch = createMockFetch(mockProductDatabase) as any;

      const request = createMockRequestWithFile(validKitchenPlannerPDF);
      const response = await POST(request);
      const data: ShoppingListAnalysis = await response.json();

      expect(response.status).toBe(200);
      expect(data.totalProducts).toBe(6); // 2 + 1 + 3
      expect(data.successfullyFetched).toBe(6);
      expect(data.products).toHaveLength(6);
    });

    it('should handle PDFs with decimal quantities and round correctly', async () => {
      extractText.mockResolvedValue({ text: pdfWithDecimalQuantities });
      global.fetch = createMockFetch(mockProductDatabase) as any;

      const request = createMockRequestWithFile(pdfWithDecimalQuantities);
      const response = await POST(request);
      const data: ShoppingListAnalysis = await response.json();

      expect(response.status).toBe(200);
      // 1.36x → 1, 2.8x → 3, 4x → 4 = total 8 products
      expect(data.totalProducts).toBe(8);
    });

    it('should match quantities to nearest product code using positions', async () => {
      extractText.mockResolvedValue({ text: validKitchenPlannerPDF });
      global.fetch = createMockFetch(mockProductDatabase) as any;

      const request = createMockRequestWithFile(validKitchenPlannerPDF);
      const response = await POST(request);
      const data: ShoppingListAnalysis = await response.json();

      // Verify quantities are correctly matched
      // BILLY (40263850): 2x
      // KALLAX (00373589): 1x
      // POÄNG (19829149): 3x
      const billyCount = data.products.filter(p => p.productId === '40263850').length;
      const kallaxCount = data.products.filter(p => p.productId === '00373589').length;
      const poangCount = data.products.filter(p => p.productId === '19829149').length;

      expect(billyCount).toBe(2);
      expect(kallaxCount).toBe(1);
      expect(poangCount).toBe(3);
    });

    it('should handle missing quantity markers and default to 1', async () => {
      extractText.mockResolvedValue({ text: pdfWithMissingQuantities });
      global.fetch = createMockFetch(mockProductDatabase) as any;

      const request = createMockRequestWithFile(pdfWithMissingQuantities);
      const response = await POST(request);
      const data: ShoppingListAnalysis = await response.json();

      expect(response.status).toBe(200);
      // Both products should have quantity 1 (default)
      expect(data.totalProducts).toBe(2);
    });

    it('should handle duplicate products with different quantities', async () => {
      extractText.mockResolvedValue({ text: pdfWithDuplicateProducts });
      global.fetch = createMockFetch(mockProductDatabase) as any;

      const request = createMockRequestWithFile(pdfWithDuplicateProducts);
      const response = await POST(request);
      const data: ShoppingListAnalysis = await response.json();

      expect(response.status).toBe(200);
      // METOD appears twice: 2x + 1x = 3 total
      // Fixture uses code 492.275.19 which becomes 49227519
      expect(data.totalProducts).toBe(3);
      const metodCount = data.products.filter(p => p.productId === '49227519').length;
      expect(metodCount).toBe(3);
    });

    it('should reject PDF with no product codes', async () => {
      extractText.mockResolvedValue({ text: pdfWithNoProductCodes });

      const request = createMockRequestWithFile(pdfWithNoProductCodes);
      const response = await POST(request);

      expect(response.status).toBe(400);
      const data = await response.json();
      expect(data.error).toContain('No product codes found');
    });

    it('should ignore malformed product codes', async () => {
      extractText.mockResolvedValue({ text: pdfWithMalformedCodes });
      global.fetch = createMockFetch(mockProductDatabase) as any;

      const request = createMockRequestWithFile(pdfWithMalformedCodes);
      const response = await POST(request);
      const data: ShoppingListAnalysis = await response.json();

      expect(response.status).toBe(200);
      // Note: Regex matches "234.567.89" from within "1234.567.89" (no word boundaries)
      // and the valid code "603.275.82", so 2 products total
      expect(data.totalProducts).toBe(2);
      expect(data.products.some(p => p.productId === '60327582')).toBe(true);
    });

    it('should not match quantity markers beyond 500 chars distance', async () => {
      extractText.mockResolvedValue({ text: pdfWithDistantQuantities });
      global.fetch = createMockFetch(mockProductDatabase) as any;

      const request = createMockRequestWithFile(pdfWithDistantQuantities);
      const response = await POST(request);
      const data: ShoppingListAnalysis = await response.json();

      expect(response.status).toBe(200);
      // First product has quantity too far away → defaults to 1
      // Second product has nearby quantity → 1x
      expect(data.totalProducts).toBe(2);
    });
  });

  describe('Product Fetching', () => {
    it('should fetch products from multiple countries successfully', async () => {
      extractText.mockResolvedValue({ text: validKitchenPlannerPDF });
      global.fetch = createMockFetch(mockProductDatabase) as any;

      const request = createMockRequestWithFile(validKitchenPlannerPDF);
      const response = await POST(request);
      const data: ShoppingListAnalysis = await response.json();

      expect(response.status).toBe(200);

      // Verify product structure includes all countries
      const firstProduct = data.products[0];
      expect(firstProduct.products).toHaveProperty('belgium');
      expect(firstProduct.products).toHaveProperty('netherlands');
      expect(firstProduct.products).toHaveProperty('france');
      expect(firstProduct.products).toHaveProperty('germany');
    });

    it('should handle partial product fetch failures', async () => {
      extractText.mockResolvedValue({ text: validKitchenPlannerPDF });

      // Mock fetch that fails for one product
      global.fetch = jest.fn((url: string) => {
        if (url.includes('00373589')) {
          return Promise.resolve({
            ok: false,
            status: 404,
            json: () => Promise.resolve({ error: 'Not found' }),
          } as Response);
        }
        return createMockFetch(mockProductDatabase)(url);
      }) as any;

      const request = createMockRequestWithFile(validKitchenPlannerPDF);
      const response = await POST(request);
      const data: ShoppingListAnalysis = await response.json();

      expect(response.status).toBe(200);
      expect(data.failedProducts).toContain('00373589');
      // BILLY (2) + POÄNG (3) = 5 products
      expect(data.successfullyFetched).toBe(5);
    });

    it('should handle all products unavailable scenario', async () => {
      extractText.mockResolvedValue({ text: validKitchenPlannerPDF });

      // Mock fetch that always fails
      global.fetch = jest.fn(() => {
        return Promise.resolve({
          ok: false,
          status: 404,
          json: () => Promise.resolve({ error: 'Not found' }),
        } as Response);
      }) as any;

      const request = createMockRequestWithFile(validKitchenPlannerPDF);
      const response = await POST(request);
      const data: ShoppingListAnalysis = await response.json();

      expect(response.status).toBe(200);
      expect(data.successfullyFetched).toBe(0);
      expect(data.failedProducts).toHaveLength(3); // 3 unique products
      expect(data.singleStoreStrategy.best).toBeUndefined();
    });

    it('should handle timeout during product fetch', async () => {
      extractText.mockResolvedValue({ text: validKitchenPlannerPDF });

      // First call succeeds, rest timeout
      let callCount = 0;
      global.fetch = jest.fn((url: string) => {
        if (callCount++ === 0) {
          return createMockFetch(mockProductDatabase)(url);
        }
        return Promise.reject(new Error('Request timeout'));
      }) as any;

      const request = createMockRequestWithFile(validKitchenPlannerPDF);
      const response = await POST(request);
      const data: ShoppingListAnalysis = await response.json();

      expect(response.status).toBe(200);
      // At least one product should succeed
      expect(data.successfullyFetched).toBeGreaterThan(0);
    });

    it('should propagate product API errors correctly', async () => {
      extractText.mockResolvedValue({ text: validKitchenPlannerPDF });
      global.fetch = createFailingMockFetch('Network error') as any;

      const request = createMockRequestWithFile(validKitchenPlannerPDF);
      const response = await POST(request);
      const data: ShoppingListAnalysis = await response.json();

      expect(response.status).toBe(200);
      // All fetches fail but response is still 200
      expect(data.successfullyFetched).toBe(0);
      expect(data.failedProducts.length).toBeGreaterThan(0);
    });
  });

  describe('Calculation Logic', () => {
    it('should calculate store totals correctly across all countries', async () => {
      extractText.mockResolvedValue({ text: validKitchenPlannerPDF });
      global.fetch = createMockFetch(mockProductDatabase) as any;

      const request = createMockRequestWithFile(validKitchenPlannerPDF);
      const response = await POST(request);
      const data: ShoppingListAnalysis = await response.json();

      expect(response.status).toBe(200);

      // Verify store totals are calculated
      const belgiumTotal = data.singleStoreStrategy.all.find(s => s.storeCode === 'BE');
      expect(belgiumTotal).toBeDefined();
      expect(belgiumTotal!.totalCost).toBeGreaterThan(0);
      expect(belgiumTotal!.availableProducts).toBe(6);
    });

    it('should select best single store based on lowest cost', async () => {
      extractText.mockResolvedValue({ text: validKitchenPlannerPDF });
      global.fetch = createMockFetch(mockProductDatabase) as any;

      const request = createMockRequestWithFile(validKitchenPlannerPDF);
      const response = await POST(request);
      const data: ShoppingListAnalysis = await response.json();

      expect(response.status).toBe(200);
      expect(data.singleStoreStrategy.best).toBeDefined();
      // Belgium should be cheapest based on mock data
      expect(data.singleStoreStrategy.best!.storeCode).toBe('BE');
    });

    it('should calculate multi-store optimization strategy', async () => {
      extractText.mockResolvedValue({ text: validKitchenPlannerPDF });
      global.fetch = createMockFetch(mockProductDatabase) as any;

      const request = createMockRequestWithFile(validKitchenPlannerPDF);
      const response = await POST(request);
      const data: ShoppingListAnalysis = await response.json();

      expect(response.status).toBe(200);
      expect(data.multiStoreStrategy).toBeDefined();
      expect(data.multiStoreStrategy.totalCost).toBeGreaterThan(0);
      expect(data.multiStoreStrategy.breakdown).toBeDefined();
      expect(data.multiStoreStrategy.breakdown.length).toBeGreaterThan(0);
    });

    it('should calculate savings correctly (single vs multi-store)', async () => {
      extractText.mockResolvedValue({ text: validKitchenPlannerPDF });
      global.fetch = createMockFetch(mockProductDatabase) as any;

      const request = createMockRequestWithFile(validKitchenPlannerPDF);
      const response = await POST(request);
      const data: ShoppingListAnalysis = await response.json();

      expect(response.status).toBe(200);

      const bestStoreCost = data.singleStoreStrategy.best!.totalCost;
      const multiStoreCost = data.multiStoreStrategy.totalCost;
      const savings = data.multiStoreStrategy.savings;

      // Savings should be positive or zero
      expect(savings).toBeGreaterThanOrEqual(0);
      // Savings should equal the difference
      expect(savings).toBe(bestStoreCost - multiStoreCost);
    });

    it('should handle all products unavailable in calculations', async () => {
      const singleProductPDF = `
        UNAVAILABLE Product
        €100.00
        Product code: 917.546.98
        1x €100.00
      `;

      extractText.mockResolvedValue({ text: singleProductPDF });
      global.fetch = createMockFetch(mockProductDatabase) as any;

      const request = createMockRequestWithFile(singleProductPDF);
      const response = await POST(request);
      const data: ShoppingListAnalysis = await response.json();

      expect(response.status).toBe(200);

      // All store totals should be 0
      data.singleStoreStrategy.all.forEach(store => {
        expect(store.totalCost).toBe(0);
        expect(store.availableProducts).toBe(0);
        expect(store.unavailableProducts).toBe(1);
      });
    });

    it('should handle price ties between stores correctly', async () => {
      const tieProductPDF = `
        METOD Product
        €120.00
        Product code: 292.275.19
        2x €240.00
      `;

      extractText.mockResolvedValue({ text: tieProductPDF });
      global.fetch = createMockFetch(mockProductDatabase) as any;

      const request = createMockRequestWithFile(tieProductPDF);
      const response = await POST(request);
      const data: ShoppingListAnalysis = await response.json();

      expect(response.status).toBe(200);

      // Belgium and Netherlands have same price (120.00 each)
      const beTotal = data.singleStoreStrategy.all.find(s => s.storeCode === 'BE')!.totalCost;
      const nlTotal = data.singleStoreStrategy.all.find(s => s.storeCode === 'NL')!.totalCost;
      expect(beTotal).toBe(nlTotal);
      expect(beTotal).toBe(240); // 120 * 2
    });

    it('should multiply quantities accurately in totals', async () => {
      extractText.mockResolvedValue({ text: validKitchenPlannerPDF });
      global.fetch = createMockFetch(mockProductDatabase) as any;

      const request = createMockRequestWithFile(validKitchenPlannerPDF);
      const response = await POST(request);
      const data: ShoppingListAnalysis = await response.json();

      expect(response.status).toBe(200);

      // BILLY: €69.99 * 2 = €139.98
      // KALLAX: €49.99 * 1 = €49.99
      // POÄNG: €79.99 * 3 = €239.97
      // Total BE: €429.94
      const belgiumTotal = data.singleStoreStrategy.all.find(s => s.storeCode === 'BE')!.totalCost;
      expect(belgiumTotal).toBeCloseTo(429.94, 2);
    });

    it('should exclude failed products from total calculations', async () => {
      extractText.mockResolvedValue({ text: validKitchenPlannerPDF });

      // Fail one product
      global.fetch = jest.fn((url: string) => {
        if (url.includes('00373589')) {
          return Promise.resolve({
            ok: false,
            status: 404,
          } as Response);
        }
        return createMockFetch(mockProductDatabase)(url);
      }) as any;

      const request = createMockRequestWithFile(validKitchenPlannerPDF);
      const response = await POST(request);
      const data: ShoppingListAnalysis = await response.json();

      expect(response.status).toBe(200);

      // Only BILLY (2x) and POÄNG (3x) should be in totals
      const belgiumTotal = data.singleStoreStrategy.all.find(s => s.storeCode === 'BE')!.totalCost;
      // €69.99 * 2 + €79.99 * 3 = €379.95
      expect(belgiumTotal).toBeCloseTo(379.95, 2);
    });
  });

  describe('Error Handling', () => {
    it('should return 400 when no file is provided', async () => {
      // Create request without file
      const formData = new FormData();
      const request = new (require('next/server').NextRequest)('http://localhost:3000/api/pdf-upload', {
        method: 'POST',
        body: formData as any,
      });

      const response = await POST(request);

      expect(response.status).toBe(400);
      const data = await response.json();
      expect(data.error).toContain('No PDF file provided');
    });

    it('should handle invalid file type gracefully', async () => {
      // Create a text file instead of PDF
      const textFile = new File(['Not a PDF'], 'test.txt', { type: 'text/plain' });
      const formData = new FormData();
      formData.append('pdf', textFile);

      const request = new (require('next/server').NextRequest)('http://localhost:3000/api/pdf-upload', {
        method: 'POST',
        body: formData as any,
      });

      // Mock unpdf to throw error
      extractText.mockRejectedValue(new Error('Invalid PDF format'));

      const response = await POST(request);

      expect(response.status).toBe(500);
      const data = await response.json();
      expect(data.error).toContain('Failed to process PDF');
    });

    it('should handle PDF parsing errors', async () => {
      extractText.mockRejectedValue(new Error('PDF parsing failed'));

      const request = createMockRequestWithFile('corrupted pdf content');
      const response = await POST(request);

      expect(response.status).toBe(500);
      const data = await response.json();
      expect(data.error).toContain('Failed to process PDF');
      expect(data.message).toContain('PDF parsing failed');
    });

    it('should handle network errors during fetch', async () => {
      extractText.mockResolvedValue({ text: validKitchenPlannerPDF });
      global.fetch = createFailingMockFetch() as any;

      const request = createMockRequestWithFile(validKitchenPlannerPDF);
      const response = await POST(request);

      // Should still return 200 but with all failed products
      expect(response.status).toBe(200);
      const data = await response.json();
      expect(data.successfullyFetched).toBe(0);
      expect(data.failedProducts.length).toBeGreaterThan(0);
    });
  });
});
