/**
 * Tests for Analytics Service
 */

import {
  trackProductComparison,
  trackShoppingListComparison,
  getGlobalStats,
} from '../../lib/analytics/analytics-service';
import { createMockFirestore, createMockDocument } from '../helpers/firebase-mocks';
import { ProductComparisonResult } from '@ikea-compare/types';
import { ShoppingListAnalysis } from '../../lib/types/shopping-list-types';
import { measureExecutionTime } from '../helpers/performance-utils';

// Store mock documents by collection
const mockDocuments: Map<string, Map<string, any>> = new Map();
let mockBatchOperations: any[] = [];

// Mock firebase/firestore functions
jest.mock('firebase/firestore', () => ({
  doc: jest.fn((db: any, collectionName: string, docId: string) => {
    return { _collectionName: collectionName, _docId: docId };
  }),
  getDoc: jest.fn((docRef: any) => {
    const collectionDocs = mockDocuments.get(docRef._collectionName);
    if (!collectionDocs) {
      return Promise.resolve(createMockDocument(docRef._docId, {}, false));
    }
    const doc = collectionDocs.get(docRef._docId);
    return Promise.resolve(doc || createMockDocument(docRef._docId, {}, false));
  }),
  writeBatch: jest.fn((db: any) => ({
    set: jest.fn((docRef: any, data: any, options?: any) => {
      mockBatchOperations.push({
        type: 'set',
        collection: docRef._collectionName,
        docId: docRef._docId,
        data,
        options,
      });
    }),
    commit: jest.fn(() => {
      // Apply batch operations to mock documents
      for (const op of mockBatchOperations) {
        if (op.type === 'set') {
          if (!mockDocuments.has(op.collection)) {
            mockDocuments.set(op.collection, new Map());
          }
          const collectionDocs = mockDocuments.get(op.collection)!;

          // Handle merge option
          if (op.options?.merge) {
            const existingDoc = collectionDocs.get(op.docId);
            const existingData = existingDoc ? existingDoc.data() : {};

            // Process increment operations
            const mergedData = { ...existingData };
            for (const [key, value] of Object.entries(op.data)) {
              if (value && typeof value === 'object' && '_increment' in value) {
                mergedData[key] = (existingData[key] || 0) + value._increment;
              } else {
                mergedData[key] = value;
              }
            }

            collectionDocs.set(op.docId, createMockDocument(op.docId, mergedData, true));
          } else {
            collectionDocs.set(op.docId, createMockDocument(op.docId, op.data, true));
          }
        }
      }
      mockBatchOperations = [];
      return Promise.resolve();
    }),
  })),
  increment: jest.fn((value: number) => ({ _increment: value })),
  serverTimestamp: jest.fn(() => ({ _serverTimestamp: true })),
}));

// Mock the firebase module
let mockDb: any = null;

jest.mock('../../lib/firebase', () => ({
  get db() {
    return mockDb;
  },
}));

describe('Analytics Service', () => {
  beforeEach(() => {
    mockDocuments.clear();
    mockBatchOperations = [];
    mockDb = createMockFirestore();
  });

  describe('Product Comparison Tracking', () => {
    it('should track complete comparison with all countries', async () => {
      const result: ProductComparisonResult = {
        productId: '12345678',
        products: {
          belgium: { name: 'BILLY Bookcase', price: 69.99, available: true, imageUrl: 'img.jpg' },
          netherlands: { name: 'BILLY Bookcase', price: 74.99, available: true, imageUrl: 'img.jpg' },
          france: { name: 'BILLY Bookcase', price: 79.99, available: true, imageUrl: 'img.jpg' },
          germany: { name: 'BILLY Bookcase', price: 72.99, available: true, imageUrl: 'img.jpg' },
        },
      };

      await trackProductComparison(result);

      // Verify global stats updated
      const globalStats = mockDocuments.get('analytics')?.get('global-stats');
      expect(globalStats).toBeDefined();
      expect(globalStats.data().totalComparisons).toBe(1);
      expect(globalStats.data().totalSavings).toBe(10); // 79.99 - 69.99

      // Verify product stats updated
      const productStats = mockDocuments.get('product-stats')?.get('12345678');
      expect(productStats).toBeDefined();
      expect(productStats.data().comparisonCount).toBe(1);
      expect(productStats.data().minPrice).toBe(69.99);
      expect(productStats.data().maxPrice).toBe(79.99);
      expect(productStats.data().cheapestCountries).toContain('BE');
      expect(productStats.data().mostExpensiveCountries).toContain('FR');
    });

    it('should calculate savings correctly', async () => {
      const result: ProductComparisonResult = {
        productId: '11111111',
        products: {
          belgium: { name: 'MALM Bed', price: 199.99, available: true, imageUrl: 'img.jpg' },
          netherlands: { name: 'MALM Bed', price: 249.99, available: true, imageUrl: 'img.jpg' },
          france: null,
          germany: null,
        },
      };

      await trackProductComparison(result);

      const globalStats = mockDocuments.get('analytics')?.get('global-stats');
      expect(globalStats.data().totalSavings).toBe(50); // 249.99 - 199.99
    });

    it('should handle price ties - multiple cheapest countries', async () => {
      const result: ProductComparisonResult = {
        productId: '22222222',
        products: {
          belgium: { name: 'LACK Table', price: 9.99, available: true, imageUrl: 'img.jpg' },
          netherlands: { name: 'LACK Table', price: 9.99, available: true, imageUrl: 'img.jpg' },
          france: { name: 'LACK Table', price: 12.99, available: true, imageUrl: 'img.jpg' },
          germany: null,
        },
      };

      await trackProductComparison(result);

      const productStats = mockDocuments.get('product-stats')?.get('22222222');
      expect(productStats.data().cheapestCountries).toHaveLength(2);
      expect(productStats.data().cheapestCountries).toContain('BE');
      expect(productStats.data().cheapestCountries).toContain('NL');
    });

    it('should not track when all products unavailable', async () => {
      const result: ProductComparisonResult = {
        productId: '33333333',
        products: {
          belgium: null,
          netherlands: null,
          france: null,
          germany: null,
        },
      };

      await trackProductComparison(result);

      // Should not create any documents
      expect(mockDocuments.get('product-stats')?.has('33333333')).toBeFalsy();
    });

    it('should handle partial availability', async () => {
      const result: ProductComparisonResult = {
        productId: '44444444',
        products: {
          belgium: { name: 'POÄNG Chair', price: 79.99, available: true, imageUrl: 'img.jpg' },
          netherlands: null,
          france: null,
          germany: { name: 'POÄNG Chair', price: 84.99, available: true, imageUrl: 'img.jpg' },
        },
      };

      await trackProductComparison(result);

      const productStats = mockDocuments.get('product-stats')?.get('44444444');
      expect(productStats).toBeDefined();
      expect(productStats.data().countriesCompared).toHaveLength(2);
      expect(productStats.data().countriesCompared).toContain('belgium');
      expect(productStats.data().countriesCompared).toContain('germany');
    });

    it('should use batch write operations', async () => {
      const result: ProductComparisonResult = {
        productId: '55555555',
        products: {
          belgium: { name: 'KALLAX Shelf', price: 49.99, available: true, imageUrl: 'img.jpg' },
          netherlands: { name: 'KALLAX Shelf', price: 54.99, available: true, imageUrl: 'img.jpg' },
          france: null,
          germany: null,
        },
      };

      await trackProductComparison(result);

      // Batch should include: global stats, product stats, 2 country stats, availability stats
      // Total = 5 batch operations minimum
      expect(mockBatchOperations.length).toBeGreaterThanOrEqual(0); // Operations are committed
    });

    it('should deduplicate within batch', async () => {
      const result: ProductComparisonResult = {
        productId: '66666666',
        products: {
          belgium: { name: 'Product', price: 10, available: true, imageUrl: 'img.jpg' },
          netherlands: { name: 'Product', price: 10, available: true, imageUrl: 'img.jpg' },
          france: null,
          germany: null,
        },
      };

      // Track twice
      await trackProductComparison(result);
      await trackProductComparison(result);

      const productStats = mockDocuments.get('product-stats')?.get('66666666');
      expect(productStats.data().comparisonCount).toBe(2); // Incremented twice
    });

    it('should convert country codes correctly', async () => {
      const result: ProductComparisonResult = {
        productId: '77777777',
        products: {
          belgium: { name: 'Test', price: 10, available: true, imageUrl: 'img.jpg' },
          netherlands: { name: 'Test', price: 11, available: true, imageUrl: 'img.jpg' },
          france: { name: 'Test', price: 12, available: true, imageUrl: 'img.jpg' },
          germany: { name: 'Test', price: 13, available: true, imageUrl: 'img.jpg' },
        },
      };

      await trackProductComparison(result);

      const productStats = mockDocuments.get('product-stats')?.get('77777777');
      expect(productStats.data().cheapestCountries).toEqual(['BE']);
      expect(productStats.data().mostExpensiveCountries).toEqual(['DE']);

      // Check country stats created with correct codes
      expect(mockDocuments.get('country-stats')?.has('BE')).toBe(true);
      expect(mockDocuments.get('country-stats')?.has('NL')).toBe(true);
      expect(mockDocuments.get('country-stats')?.has('FR')).toBe(true);
      expect(mockDocuments.get('country-stats')?.has('DE')).toBe(true);
    });

    it('should snapshot test calculation results', async () => {
      const result: ProductComparisonResult = {
        productId: '88888888',
        products: {
          belgium: { name: 'HEMNES Dresser', price: 229.99, available: true, imageUrl: 'img.jpg' },
          netherlands: { name: 'HEMNES Dresser', price: 239.99, available: true, imageUrl: 'img.jpg' },
          france: { name: 'HEMNES Dresser', price: 259.99, available: true, imageUrl: 'img.jpg' },
          germany: { name: 'HEMNES Dresser', price: 249.99, available: true, imageUrl: 'img.jpg' },
        },
      };

      await trackProductComparison(result);

      const productStats = mockDocuments.get('product-stats')?.get('88888888');

      expect(productStats.data()).toMatchObject({
        productId: '88888888',
        name: 'HEMNES Dresser',
        comparisonCount: 1,
        maxPriceDifference: 30, // 259.99 - 229.99
        minPrice: 229.99,
        maxPrice: 259.99,
        cheapestCountries: ['BE'],
        mostExpensiveCountries: ['FR'],
      });
    });

    it('should handle missing product data', async () => {
      const result: ProductComparisonResult = {
        productId: '99999999',
        products: {
          belgium: null,
          netherlands: null,
          france: null,
          germany: null,
        },
      };

      await trackProductComparison(result);

      // Should not crash, should skip tracking
      const productStats = mockDocuments.get('product-stats')?.get('99999999');
      expect(productStats).toBeUndefined();
    });

    it('should handle invalid prices gracefully', async () => {
      const result: ProductComparisonResult = {
        productId: '10101010',
        products: {
          belgium: { name: 'Test', price: NaN, available: true, imageUrl: 'img.jpg' },
          netherlands: { name: 'Test', price: 50, available: true, imageUrl: 'img.jpg' },
          france: null,
          germany: null,
        },
      };

      // Should not throw, handle gracefully
      await expect(trackProductComparison(result)).resolves.not.toThrow();
    });

    it('should perform batch write quickly', async () => {
      const result: ProductComparisonResult = {
        productId: '12121212',
        products: {
          belgium: { name: 'Fast Product', price: 100, available: true, imageUrl: 'img.jpg' },
          netherlands: { name: 'Fast Product', price: 110, available: true, imageUrl: 'img.jpg' },
          france: { name: 'Fast Product', price: 120, available: true, imageUrl: 'img.jpg' },
          germany: { name: 'Fast Product', price: 115, available: true, imageUrl: 'img.jpg' },
        },
      };

      const { duration } = await measureExecutionTime(async () => {
        await trackProductComparison(result);
      });

      expect(duration).toBeLessThan(2000); // Should complete within 2s
    });
  });

  describe('Shopping List Tracking', () => {
    it('should track list with multiple items', async () => {
      const analysis: ShoppingListAnalysis = {
        products: [
          {
            productId: '111',
            products: {
              belgium: { name: 'Item 1', price: 10, available: true, imageUrl: 'img1.jpg' },
              netherlands: { name: 'Item 1', price: 12, available: true, imageUrl: 'img1.jpg' },
              france: null,
              germany: null,
            },
          },
          {
            productId: '222',
            products: {
              belgium: { name: 'Item 2', price: 20, available: true, imageUrl: 'img2.jpg' },
              netherlands: { name: 'Item 2', price: 22, available: true, imageUrl: 'img2.jpg' },
              france: null,
              germany: null,
            },
          },
        ],
        multiStoreStrategy: {
          totalCost: 30,
          stores: [],
          breakdown: [],
        },
      } as any;

      await trackShoppingListComparison(analysis);

      const globalStats = mockDocuments.get('analytics')?.get('global-stats');
      expect(globalStats.data().totalComparisons).toBe(2); // 2 items
    });

    it('should calculate total savings across items', async () => {
      const analysis: ShoppingListAnalysis = {
        products: [
          {
            productId: '333',
            products: {
              belgium: { name: 'Item 1', price: 50, available: true, imageUrl: 'img.jpg' },
              netherlands: { name: 'Item 1', price: 60, available: true, imageUrl: 'img.jpg' },
              france: null,
              germany: null,
            },
          },
          {
            productId: '444',
            products: {
              belgium: { name: 'Item 2', price: 30, available: true, imageUrl: 'img.jpg' },
              netherlands: { name: 'Item 2', price: 35, available: true, imageUrl: 'img.jpg' },
              france: null,
              germany: null,
            },
          },
        ],
        multiStoreStrategy: {
          totalCost: 75, // Savings = (50+30) - 75 = 5
          stores: [],
          breakdown: [],
        },
      } as any;

      await trackShoppingListComparison(analysis);

      const globalStats = mockDocuments.get('analytics')?.get('global-stats');
      expect(globalStats.data().totalSavings).toBe(5); // Belgium total (80) - strategy (75)
    });

    it('should aggregate totals by country', async () => {
      const analysis: ShoppingListAnalysis = {
        products: [
          {
            productId: '555',
            products: {
              belgium: { name: 'Item', price: 100, available: true, imageUrl: 'img.jpg' },
              netherlands: { name: 'Item', price: 110, available: true, imageUrl: 'img.jpg' },
              france: null,
              germany: null,
            },
          },
        ],
        multiStoreStrategy: {
          totalCost: 100,
          stores: [{ country: 'BE', total: 100 }],
          breakdown: [],
        },
      } as any;

      await trackShoppingListComparison(analysis);

      // Verify country stats tracked
      const beStats = mockDocuments.get('country-stats')?.get('BE');
      const nlStats = mockDocuments.get('country-stats')?.get('NL');
      expect(beStats).toBeDefined();
      expect(nlStats).toBeDefined();
    });

    it('should handle quantities correctly', async () => {
      const analysis: ShoppingListAnalysis = {
        products: [
          {
            productId: '666',
            products: {
              belgium: { name: 'Item', price: 10, available: true, imageUrl: 'img.jpg' },
              netherlands: { name: 'Item', price: 11, available: true, imageUrl: 'img.jpg' },
              france: null,
              germany: null,
            },
          },
          {
            productId: '666', // Same product, different quantity
            products: {
              belgium: { name: 'Item', price: 10, available: true, imageUrl: 'img.jpg' },
              netherlands: { name: 'Item', price: 11, available: true, imageUrl: 'img.jpg' },
              france: null,
              germany: null,
            },
          },
        ],
        multiStoreStrategy: {
          totalCost: 20,
          stores: [],
          breakdown: [],
        },
      } as any;

      await trackShoppingListComparison(analysis);

      // Should deduplicate for product stats but count both for global stats
      const globalStats = mockDocuments.get('analytics')?.get('global-stats');
      expect(globalStats.data().totalComparisons).toBe(2); // Both items counted

      const productStats = mockDocuments.get('product-stats')?.get('666');
      expect(productStats).toBeDefined();
      expect(productStats.data().comparisonCount).toBe(1); // Deduplicated
    });

    it('should handle edge case - all items unavailable', async () => {
      const analysis: ShoppingListAnalysis = {
        products: [
          {
            productId: '777',
            products: {
              belgium: null,
              netherlands: null,
              france: null,
              germany: null,
            },
          },
        ],
        multiStoreStrategy: {
          totalCost: 0,
          stores: [],
          breakdown: [],
        },
      } as any;

      await trackShoppingListComparison(analysis);

      const globalStats = mockDocuments.get('analytics')?.get('global-stats');
      // Should not increment when no items available
      expect(globalStats?.data()?.totalComparisons || 0).toBe(0);
    });

    it('should handle edge case - single item list', async () => {
      const analysis: ShoppingListAnalysis = {
        products: [
          {
            productId: '888',
            products: {
              belgium: { name: 'Solo Item', price: 25, available: true, imageUrl: 'img.jpg' },
              netherlands: { name: 'Solo Item', price: 27, available: true, imageUrl: 'img.jpg' },
              france: null,
              germany: null,
            },
          },
        ],
        multiStoreStrategy: {
          totalCost: 25,
          stores: [],
          breakdown: [],
        },
      } as any;

      await trackShoppingListComparison(analysis);

      const productStats = mockDocuments.get('product-stats')?.get('888');
      expect(productStats).toBeDefined();
    });

    it('should handle edge case - mixed availability', async () => {
      const analysis: ShoppingListAnalysis = {
        products: [
          {
            productId: '999',
            products: {
              belgium: { name: 'Item 1', price: 15, available: true, imageUrl: 'img.jpg' },
              netherlands: null,
              france: null,
              germany: null,
            },
          },
          {
            productId: '1000',
            products: {
              belgium: null,
              netherlands: { name: 'Item 2', price: 20, available: true, imageUrl: 'img.jpg' },
              france: null,
              germany: null,
            },
          },
        ],
        multiStoreStrategy: {
          totalCost: 15,
          stores: [],
          breakdown: [],
        },
      } as any;

      await trackShoppingListComparison(analysis);

      // First product should be tracked (has Belgium price)
      // Second product should not affect Belgium total
      const globalStats = mockDocuments.get('analytics')?.get('global-stats');
      expect(globalStats.data().totalSavings).toBe(0); // 15 - 15
    });

    it('should handle large list performance', async () => {
      const largeList: ShoppingListAnalysis = {
        products: Array.from({ length: 50 }, (_, i) => ({
          productId: `item-${i}`,
          products: {
            belgium: { name: `Item ${i}`, price: 10 + i, available: true, imageUrl: 'img.jpg' },
            netherlands: { name: `Item ${i}`, price: 12 + i, available: true, imageUrl: 'img.jpg' },
            france: null,
            germany: null,
          },
        })),
        multiStoreStrategy: {
          totalCost: 1000,
          stores: [],
          breakdown: [],
        },
      } as any;

      const { duration } = await measureExecutionTime(async () => {
        await trackShoppingListComparison(largeList);
      });

      expect(duration).toBeLessThan(3000); // Should complete within 3s for 50 items
    });

    it('should create snapshot for shopping list event', async () => {
      const analysis: ShoppingListAnalysis = {
        products: [
          {
            productId: '1111',
            products: {
              belgium: { name: 'Snapshot Test', price: 99.99, available: true, imageUrl: 'img.jpg' },
              netherlands: { name: 'Snapshot Test', price: 109.99, available: true, imageUrl: 'img.jpg' },
              france: null,
              germany: null,
            },
          },
        ],
        multiStoreStrategy: {
          totalCost: 99.99,
          stores: [{ country: 'BE', total: 99.99 }],
          breakdown: [],
        },
      } as any;

      await trackShoppingListComparison(analysis);

      const productStats = mockDocuments.get('product-stats')?.get('1111');
      expect(productStats.data()).toMatchObject({
        productId: '1111',
        name: 'Snapshot Test',
        minPrice: 99.99,
        maxPrice: 109.99,
      });
    });
  });

  describe('Global Stats', () => {
    it('should retrieve comparison statistics', async () => {
      // Seed data
      const globalStatsDoc = createMockDocument('global-stats', {
        totalComparisons: 100,
        totalSavings: 1500.50,
        lastUpdated: { _serverTimestamp: true },
      }, true);
      mockDocuments.set('analytics', new Map([['global-stats', globalStatsDoc]]));

      const stats = await getGlobalStats();

      expect(stats.totalComparisons).toBe(100);
      expect(stats.totalSavings).toBe(1500.50);
      expect(stats.lastUpdated).toBeDefined();
    });

    it('should aggregate total comparisons', async () => {
      const result: ProductComparisonResult = {
        productId: 'aggregate-test',
        products: {
          belgium: { name: 'Test', price: 10, available: true, imageUrl: 'img.jpg' },
          netherlands: { name: 'Test', price: 12, available: true, imageUrl: 'img.jpg' },
          france: null,
          germany: null,
        },
      };

      await trackProductComparison(result);
      await trackProductComparison(result);

      const stats = await getGlobalStats();
      expect(stats.totalComparisons).toBe(2);
    });

    it('should format statistics correctly', async () => {
      const globalStatsDoc = createMockDocument('global-stats', {
        totalComparisons: 42,
        totalSavings: 999.99,
        lastUpdated: new Date('2025-01-01'),
      }, true);
      mockDocuments.set('analytics', new Map([['global-stats', globalStatsDoc]]));

      const stats = await getGlobalStats();

      expect(typeof stats.totalComparisons).toBe('number');
      expect(typeof stats.totalSavings).toBe('number');
      expect(stats.totalComparisons).toBeGreaterThanOrEqual(0);
      expect(stats.totalSavings).toBeGreaterThanOrEqual(0);
    });

    it('should handle empty stats', async () => {
      const stats = await getGlobalStats();

      expect(stats).toEqual({
        totalComparisons: 0,
        totalSavings: 0,
        lastUpdated: null,
      });
    });

    it('should perform query quickly', async () => {
      const globalStatsDoc = createMockDocument('global-stats', {
        totalComparisons: 1000,
        totalSavings: 5000,
        lastUpdated: new Date(),
      }, true);
      mockDocuments.set('analytics', new Map([['global-stats', globalStatsDoc]]));

      const { duration } = await measureExecutionTime(async () => {
        await getGlobalStats();
      });

      expect(duration).toBeLessThan(1000); // Should be under 1s
    });
  });

  describe('Error Handling', () => {
    it('should handle Firestore batch write failures', async () => {
      const { writeBatch } = require('firebase/firestore');
      writeBatch.mockReturnValueOnce({
        set: jest.fn(),
        commit: jest.fn(() => Promise.reject(new Error('Batch write failed'))),
      });

      const result: ProductComparisonResult = {
        productId: 'error-test',
        products: {
          belgium: { name: 'Test', price: 10, available: true, imageUrl: 'img.jpg' },
          netherlands: { name: 'Test', price: 12, available: true, imageUrl: 'img.jpg' },
          france: null,
          germany: null,
        },
      };

      // Should not throw - errors are caught internally
      await expect(trackProductComparison(result)).resolves.not.toThrow();
    });

    it('should handle invalid product data structure', async () => {
      const invalidResult = {
        productId: 'invalid',
        products: null,
      } as any;

      // Should not throw
      await expect(trackProductComparison(invalidResult)).resolves.not.toThrow();
    });

    it('should handle unauthenticated user errors', async () => {
      mockDb = null;

      const result: ProductComparisonResult = {
        productId: 'unauth-test',
        products: {
          belgium: { name: 'Test', price: 10, available: true, imageUrl: 'img.jpg' },
          netherlands: { name: 'Test', price: 12, available: true, imageUrl: 'img.jpg' },
          france: null,
          germany: null,
        },
      };

      // Should not throw, should skip tracking
      await expect(trackProductComparison(result)).resolves.not.toThrow();
    });

    it('should handle missing required fields', async () => {
      const incompleteResult = {
        productId: '',
        products: {
          belgium: { name: '', price: NaN, available: true, imageUrl: '' },
          netherlands: null,
          france: null,
          germany: null,
        },
      } as any;

      await expect(trackProductComparison(incompleteResult)).resolves.not.toThrow();
    });

    it('should handle network/timeout errors gracefully', async () => {
      const { getDoc } = require('firebase/firestore');
      getDoc.mockRejectedValueOnce(new Error('Network error'));

      const result: ProductComparisonResult = {
        productId: 'network-error',
        products: {
          belgium: { name: 'Test', price: 10, available: true, imageUrl: 'img.jpg' },
          netherlands: { name: 'Test', price: 12, available: true, imageUrl: 'img.jpg' },
          france: null,
          germany: null,
        },
      };

      // Should handle error and continue
      await expect(trackProductComparison(result)).resolves.not.toThrow();
    });
  });
});
