/**
 * Tests for Availability API Route
 * Tests IKEA API integration, stock parsing, and parameter validation
 */

import { StoreAvailability } from '@ikea-compare/types';
import {
  highStockAvailability,
  mediumStockAvailability,
  lowStockAvailability,
  outOfStockWithRestockDate,
  outOfStockNoRestock,
  availabilityWithoutMessageType,
  storeNotFoundResponse,
  emptyAvailabilities,
  malformedResponse,
  multipleStoresResponse,
  multipleRestockDates,
  invalidQuantityFormat,
} from '../../../__tests__/fixtures/availability-responses';
import {
  createMockRequestWithPathAndQuery,
} from '../../../__tests__/helpers/api-test-utils';

// Create a mock axios get function that we can control
const mockAxiosGet = jest.fn();

// Mock axios module
jest.mock('axios', () => ({
  default: {
    get: mockAxiosGet,
  },
}));

// Mock Firebase getStoresByCountry
jest.mock('@ikea-compare/firebase', () => ({
  getStoresByCountry: jest.fn((countryCode: string) => {
    const stores = {
      BE: [
        { buCode: '085', name: 'IKEA Zaventem' },
        { buCode: '123', name: 'IKEA Ghent' },
      ],
      NL: [
        { buCode: '085', name: 'IKEA Amsterdam' },
      ],
      FR: [
        { buCode: '085', name: 'IKEA Paris' },
      ],
      DE: [
        { buCode: '085', name: 'IKEA Berlin' },
      ],
    };
    return stores[countryCode as keyof typeof stores] || [];
  }),
}));

// Import after mocks are set up
import { GET } from '../route';

describe('Availability API Route', () => {
  // Reset mocks before each test
  beforeEach(() => {
    jest.clearAllMocks();

    // Default mock - successful response with high stock
    mockAxiosGet.mockResolvedValue({
      data: highStockAvailability,
      status: 200,
      statusText: 'OK',
    });
  });

  describe('Parameter Validation', () => {
    it('should return 400 for invalid product ID format (too short)', async () => {
      const request = createMockRequestWithPathAndQuery(
        { productId: '1234567' }, // 7 digits
        { country: 'be', storeId: '085' }
      );

      const response = await GET(request, { params: Promise.resolve({ productId: '1234567' }) });
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.error).toContain('8 digits');
    });

    it('should return 400 for invalid product ID format (too long)', async () => {
      const request = createMockRequestWithPathAndQuery(
        { productId: '123456789' }, // 9 digits
        { country: 'be', storeId: '085' }
      );

      const response = await GET(request, { params: Promise.resolve({ productId: '123456789' }) });
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.error).toContain('8 digits');
    });

    it('should return 400 for non-numeric product ID', async () => {
      const request = createMockRequestWithPathAndQuery(
        { productId: 'abcd1234' },
        { country: 'be', storeId: '085' }
      );

      const response = await GET(request, { params: Promise.resolve({ productId: 'abcd1234' }) });
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.error).toContain('8 digits');
    });

    it('should return 400 for missing country parameter', async () => {
      const request = createMockRequestWithPathAndQuery(
        { productId: '40263850' },
        { storeId: '085' } // Missing country
      );

      const response = await GET(request, { params: Promise.resolve({ productId: '40263850' }) });
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.error).toContain('country');
    });

    it('should return 400 for invalid country code', async () => {
      const request = createMockRequestWithPathAndQuery(
        { productId: '40263850' },
        { country: 'uk', storeId: '085' } // Invalid country
      );

      const response = await GET(request, { params: Promise.resolve({ productId: '40263850' }) });
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.error).toContain('Invalid country');
    });

    it('should return 400 for missing store ID', async () => {
      const request = createMockRequestWithPathAndQuery(
        { productId: '40263850' },
        { country: 'be' } // Missing storeId
      );

      const response = await GET(request, { params: Promise.resolve({ productId: '40263850' }) });
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.error).toContain('Store ID');
    });

    it('should accept valid parameters for all supported countries', async () => {
      const countries = ['be', 'nl', 'fr', 'de'];

      for (const country of countries) {
        // Reset axios mock for each iteration
        mockAxiosGet.mockResolvedValue({ data: highStockAvailability, status: 200, statusText: 'OK' });

        const request = createMockRequestWithPathAndQuery(
          { productId: '40263850' },
          { country, storeId: '085' }
        );

        const response = await GET(request, { params: Promise.resolve({ productId: '40263850' }) });

        expect(response.status).toBe(200);
      }
    });
  });

  describe('IKEA API Integration', () => {
    it('should successfully fetch availability from IKEA API', async () => {
      // Already mocked in beforeEach with highStockAvailability

      const request = createMockRequestWithPathAndQuery(
        { productId: '40263850' },
        { country: 'be', storeId: '085' }
      );

      const response = await GET(request, { params: Promise.resolve({ productId: '40263850' }) });
      const data: StoreAvailability = await response.json();

      expect(response.status).toBe(200);
      expect(data.buCode).toBe('085');
      expect(data.storeName).toBe('IKEA Zaventem');
      expect(data.cashCarry).toBeDefined();
      expect(data.clickCollect).toBeDefined();
      expect(data.lastUpdated).toBeDefined();
    });

    it('should handle IKEA API timeout', async () => {
      mockAxiosGet.mockRejectedValue(new Error('Request timeout'));

      const request = createMockRequestWithPathAndQuery(
        { productId: '40263850' },
        { country: 'be', storeId: '085' }
      );

      const response = await GET(request, { params: Promise.resolve({ productId: '40263850' }) });
      const data = await response.json();

      expect(response.status).toBe(500);
      expect(data.error).toContain('Failed to fetch');
    });

    it('should handle IKEA API error responses (4xx)', async () => {
      const error: any = new Error('Request failed');
      error.response = { status: 404, data: { message: 'Product not found' } };
      mockAxiosGet.mockRejectedValue(error);

      const request = createMockRequestWithPathAndQuery(
        { productId: '99999999' },
        { country: 'be', storeId: '085' }
      );

      const response = await GET(request, { params: Promise.resolve({ productId: '99999999' }) });
      const data = await response.json();

      expect(response.status).toBe(500);
      expect(data.error).toBeDefined();
    });

    it('should handle IKEA API error responses (5xx)', async () => {
      const error: any = new Error('Request failed');
      error.response = { status: 503, data: { message: 'Service unavailable' } };
      mockAxiosGet.mockRejectedValue(error);

      const request = createMockRequestWithPathAndQuery(
        { productId: '40263850' },
        { country: 'be', storeId: '085' }
      );

      const response = await GET(request, { params: Promise.resolve({ productId: '40263850' }) });
      const data = await response.json();

      expect(response.status).toBe(500);
      expect(data.error).toBeDefined();
    });

    it('should handle network errors', async () => {
      mockAxiosGet.mockRejectedValue(new Error('Network error'));

      const request = createMockRequestWithPathAndQuery(
        { productId: '40263850' },
        { country: 'be', storeId: '085' }
      );

      const response = await GET(request, { params: Promise.resolve({ productId: '40263850' }) });
      const data = await response.json();

      expect(response.status).toBe(500);
      expect(data.error).toBeDefined();
    });

    it('should handle malformed API responses', async () => {
      mockAxiosGet.mockResolvedValue({ data: malformedResponse, status: 200, statusText: 'OK' });

      const request = createMockRequestWithPathAndQuery(
        { productId: '40263850' },
        { country: 'be', storeId: '085' }
      );

      const response = await GET(request, { params: Promise.resolve({ productId: '40263850' }) });
      const data: StoreAvailability = await response.json();

      expect(response.status).toBe(200);
      // Should return default values when parsing fails
      expect(data.cashCarry.quantity).toBe(0);
      expect(data.cashCarry.available).toBe(false);
      expect(data.cashCarry.stockLevel).toBe('UNKNOWN');
    });
  });

  describe('Stock Level Parsing', () => {
    it('should parse HIGH_IN_STOCK correctly', async () => {
      mockAxiosGet.mockResolvedValue({ data: highStockAvailability, status: 200, statusText: 'OK' });

      const request = createMockRequestWithPathAndQuery(
        { productId: '40263850' },
        { country: 'be', storeId: '085' }
      );

      const response = await GET(request, { params: Promise.resolve({ productId: '40263850' }) });
      const data: StoreAvailability = await response.json();

      expect(response.status).toBe(200);
      expect(data.cashCarry.quantity).toBe(25);
      expect(data.cashCarry.available).toBe(true);
      expect(data.cashCarry.stockLevel).toBe('HIGH_IN_STOCK');
    });

    it('should parse MEDIUM_IN_STOCK correctly', async () => {
      mockAxiosGet.mockResolvedValue({ data: mediumStockAvailability, status: 200, statusText: 'OK' });

      const request = createMockRequestWithPathAndQuery(
        { productId: '40263850' },
        { country: 'be', storeId: '085' }
      );

      const response = await GET(request, { params: Promise.resolve({ productId: '40263850' }) });
      const data: StoreAvailability = await response.json();

      expect(response.status).toBe(200);
      expect(data.cashCarry.quantity).toBe(7);
      expect(data.cashCarry.available).toBe(true);
      expect(data.cashCarry.stockLevel).toBe('MEDIUM_IN_STOCK');
    });

    it('should parse LOW_IN_STOCK correctly', async () => {
      mockAxiosGet.mockResolvedValue({ data: lowStockAvailability, status: 200, statusText: 'OK' });

      const request = createMockRequestWithPathAndQuery(
        { productId: '40263850' },
        { country: 'be', storeId: '085' }
      );

      const response = await GET(request, { params: Promise.resolve({ productId: '40263850' }) });
      const data: StoreAvailability = await response.json();

      expect(response.status).toBe(200);
      expect(data.cashCarry.quantity).toBe(2);
      expect(data.cashCarry.available).toBe(true);
      expect(data.cashCarry.stockLevel).toBe('LOW_IN_STOCK');
    });

    it('should parse OUT_OF_STOCK correctly', async () => {
      mockAxiosGet.mockResolvedValue({ data: outOfStockNoRestock, status: 200, statusText: 'OK' });

      const request = createMockRequestWithPathAndQuery(
        { productId: '40263850' },
        { country: 'be', storeId: '085' }
      );

      const response = await GET(request, { params: Promise.resolve({ productId: '40263850' }) });
      const data: StoreAvailability = await response.json();

      expect(response.status).toBe(200);
      expect(data.cashCarry.quantity).toBe(0);
      expect(data.cashCarry.available).toBe(false);
      expect(data.cashCarry.stockLevel).toBe('OUT_OF_STOCK');
    });

    it('should calculate stock level when messageType is missing (high stock)', async () => {
      const response15Items = {
        ...availabilityWithoutMessageType,
        availabilities: [
          {
            ...availabilityWithoutMessageType.availabilities[0],
            buyingOption: {
              cashCarry: {
                availability: {
                  quantity: 15, // >= 10 = HIGH_IN_STOCK
                  probability: {},
                },
                restocks: [],
              },
            },
          },
        ],
      };
      mockAxiosGet.mockResolvedValue({ data: response15Items, status: 200, statusText: 'OK' });

      const request = createMockRequestWithPathAndQuery(
        { productId: '40263850' },
        { country: 'be', storeId: '085' }
      );

      const response = await GET(request, { params: Promise.resolve({ productId: '40263850' }) });
      const data: StoreAvailability = await response.json();

      expect(response.status).toBe(200);
      expect(data.cashCarry.stockLevel).toBe('HIGH_IN_STOCK');
    });

    it('should calculate stock level when messageType is missing (medium stock)', async () => {
      const response7Items = {
        ...availabilityWithoutMessageType,
        availabilities: [
          {
            ...availabilityWithoutMessageType.availabilities[0],
            buyingOption: {
              cashCarry: {
                availability: {
                  quantity: 7, // 5-9 = MEDIUM_IN_STOCK
                  probability: {},
                },
                restocks: [],
              },
            },
          },
        ],
      };
      mockAxiosGet.mockResolvedValue({ data: response7Items, status: 200, statusText: 'OK' });

      const request = createMockRequestWithPathAndQuery(
        { productId: '40263850' },
        { country: 'be', storeId: '085' }
      );

      const response = await GET(request, { params: Promise.resolve({ productId: '40263850' }) });
      const data: StoreAvailability = await response.json();

      expect(response.status).toBe(200);
      expect(data.cashCarry.stockLevel).toBe('MEDIUM_IN_STOCK');
    });

    it('should calculate stock level when messageType is missing (low stock)', async () => {
      const response3Items = {
        ...availabilityWithoutMessageType,
        availabilities: [
          {
            ...availabilityWithoutMessageType.availabilities[0],
            buyingOption: {
              cashCarry: {
                availability: {
                  quantity: 3, // 1-4 = LOW_IN_STOCK
                  probability: {},
                },
                restocks: [],
              },
            },
          },
        ],
      };
      mockAxiosGet.mockResolvedValue({ data: response3Items, status: 200, statusText: 'OK' });

      const request = createMockRequestWithPathAndQuery(
        { productId: '40263850' },
        { country: 'be', storeId: '085' }
      );

      const response = await GET(request, { params: Promise.resolve({ productId: '40263850' }) });
      const data: StoreAvailability = await response.json();

      expect(response.status).toBe(200);
      expect(data.cashCarry.stockLevel).toBe('LOW_IN_STOCK');
    });

    it('should handle invalid quantity format gracefully', async () => {
      mockAxiosGet.mockResolvedValue({ data: invalidQuantityFormat, status: 200, statusText: 'OK' });

      const request = createMockRequestWithPathAndQuery(
        { productId: '40263850' },
        { country: 'be', storeId: '085' }
      );

      const response = await GET(request, { params: Promise.resolve({ productId: '40263850' }) });
      const data: StoreAvailability = await response.json();

      expect(response.status).toBe(200);
      // parseInt('invalid') = NaN, should default to 0
      expect(data.cashCarry.quantity).toBe(0);
      expect(data.cashCarry.available).toBe(false);
    });
  });

  describe('Restock Date Handling', () => {
    it('should parse restock date when available', async () => {
      mockAxiosGet.mockResolvedValue({ data: outOfStockWithRestockDate, status: 200, statusText: 'OK' });

      const request = createMockRequestWithPathAndQuery(
        { productId: '40263850' },
        { country: 'be', storeId: '085' }
      );

      const response = await GET(request, { params: Promise.resolve({ productId: '40263850' }) });
      const data: StoreAvailability = await response.json();

      expect(response.status).toBe(200);
      expect(data.cashCarry.restockDate).toBe('2025-12-15');
    });

    it('should handle missing restock date', async () => {
      mockAxiosGet.mockResolvedValue({ data: outOfStockNoRestock, status: 200, statusText: 'OK' });

      const request = createMockRequestWithPathAndQuery(
        { productId: '40263850' },
        { country: 'be', storeId: '085' }
      );

      const response = await GET(request, { params: Promise.resolve({ productId: '40263850' }) });
      const data: StoreAvailability = await response.json();

      expect(response.status).toBe(200);
      expect(data.cashCarry.restockDate).toBeUndefined();
    });

    it('should use earliest restock date when multiple dates available', async () => {
      mockAxiosGet.mockResolvedValue({ data: multipleRestockDates, status: 200, statusText: 'OK' });

      const request = createMockRequestWithPathAndQuery(
        { productId: '40263850' },
        { country: 'be', storeId: '085' }
      );

      const response = await GET(request, { params: Promise.resolve({ productId: '40263850' }) });
      const data: StoreAvailability = await response.json();

      expect(response.status).toBe(200);
      // Should use first restock date (earliest)
      expect(data.cashCarry.restockDate).toBe('2025-12-10');
    });
  });

  describe('Store Filtering', () => {
    it('should filter for specific store from multiple stores response', async () => {
      mockAxiosGet.mockResolvedValue({ data: multipleStoresResponse, status: 200, statusText: 'OK' });

      const request = createMockRequestWithPathAndQuery(
        { productId: '40263850' },
        { country: 'be', storeId: '085' }
      );

      const response = await GET(request, { params: Promise.resolve({ productId: '40263850' }) });
      const data: StoreAvailability = await response.json();

      expect(response.status).toBe(200);
      expect(data.buCode).toBe('085');
      expect(data.cashCarry.quantity).toBe(12); // Store 085 has 12, not 5 or 3
      expect(data.cashCarry.stockLevel).toBe('HIGH_IN_STOCK');
    });

    it('should return default values when store not found in response', async () => {
      mockAxiosGet.mockResolvedValue({ data: storeNotFoundResponse, status: 200, statusText: 'OK' });

      const request = createMockRequestWithPathAndQuery(
        { productId: '40263850' },
        { country: 'be', storeId: '085' } // Looking for 085, but response has 123
      );

      const response = await GET(request, { params: Promise.resolve({ productId: '40263850' }) });
      const data: StoreAvailability = await response.json();

      expect(response.status).toBe(200);
      expect(data.cashCarry.quantity).toBe(0);
      expect(data.cashCarry.available).toBe(false);
      expect(data.cashCarry.stockLevel).toBe('UNKNOWN');
    });

    it('should handle empty availabilities array', async () => {
      mockAxiosGet.mockResolvedValue({ data: emptyAvailabilities, status: 200, statusText: 'OK' });

      const request = createMockRequestWithPathAndQuery(
        { productId: '40263850' },
        { country: 'be', storeId: '085' }
      );

      const response = await GET(request, { params: Promise.resolve({ productId: '40263850' }) });
      const data: StoreAvailability = await response.json();

      expect(response.status).toBe(200);
      expect(data.cashCarry.quantity).toBe(0);
      expect(data.cashCarry.available).toBe(false);
      expect(data.cashCarry.stockLevel).toBe('UNKNOWN');
    });

    it('should use store name from Firebase when store is found', async () => {
      mockAxiosGet.mockResolvedValue({ data: highStockAvailability, status: 200, statusText: 'OK' });

      const request = createMockRequestWithPathAndQuery(
        { productId: '40263850' },
        { country: 'be', storeId: '085' }
      );

      const response = await GET(request, { params: Promise.resolve({ productId: '40263850' }) });
      const data: StoreAvailability = await response.json();

      expect(response.status).toBe(200);
      expect(data.storeName).toBe('IKEA Zaventem');
    });

    it('should use fallback store name when store not in Firebase', async () => {
      mockAxiosGet.mockResolvedValue({ data: highStockAvailability, status: 200, statusText: 'OK' });

      const request = createMockRequestWithPathAndQuery(
        { productId: '40263850' },
        { country: 'be', storeId: '999' } // Unknown store
      );

      const response = await GET(request, { params: Promise.resolve({ productId: '40263850' }) });
      const data: StoreAvailability = await response.json();

      expect(response.status).toBe(200);
      expect(data.storeName).toBe('Store 999');
    });
  });

  describe('Response Formatting', () => {
    it('should return correctly formatted StoreAvailability object', async () => {
      mockAxiosGet.mockResolvedValue({ data: highStockAvailability, status: 200, statusText: 'OK' });

      const request = createMockRequestWithPathAndQuery(
        { productId: '40263850' },
        { country: 'be', storeId: '085' }
      );

      const response = await GET(request, { params: Promise.resolve({ productId: '40263850' }) });
      const data: StoreAvailability = await response.json();

      expect(response.status).toBe(200);

      // Verify structure
      expect(data).toHaveProperty('buCode');
      expect(data).toHaveProperty('storeName');
      expect(data).toHaveProperty('cashCarry');
      expect(data).toHaveProperty('clickCollect');
      expect(data).toHaveProperty('lastUpdated');

      // Verify cashCarry structure
      expect(data.cashCarry).toHaveProperty('quantity');
      expect(data.cashCarry).toHaveProperty('available');
      expect(data.cashCarry).toHaveProperty('stockLevel');
      // restockDate and restockQuantity are optional (omitted when undefined)

      // Verify clickCollect structure
      expect(data.clickCollect).toHaveProperty('quantity');
      expect(data.clickCollect).toHaveProperty('available');
      expect(data.clickCollect).toHaveProperty('stockLevel');

      // Verify lastUpdated is ISO date string
      expect(new Date(data.lastUpdated).toISOString()).toBe(data.lastUpdated);
    });

    it('should return error response in correct format', async () => {
      const request = createMockRequestWithPathAndQuery(
        { productId: 'invalid' },
        { country: 'be', storeId: '085' }
      );

      const response = await GET(request, { params: Promise.resolve({ productId: 'invalid' }) });
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data).toHaveProperty('error');
      expect(typeof data.error).toBe('string');
    });
  });
});
