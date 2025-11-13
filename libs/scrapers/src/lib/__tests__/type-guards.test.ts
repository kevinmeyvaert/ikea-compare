import { isScraperError } from '../ikea-scraper';
import { createMockProductData, createMockScraperError } from './helpers/test-utils';

describe('Type Guards', () => {
  describe('isScraperError', () => {
    it('should return true for valid ScraperError objects', () => {
      const error = createMockScraperError();
      expect(isScraperError(error)).toBe(true);
    });

    it('should return true for ScraperError with different countries', () => {
      const errors = [
        createMockScraperError({ country: 'BE' }),
        createMockScraperError({ country: 'NL' }),
        createMockScraperError({ country: 'FR' }),
        createMockScraperError({ country: 'DE' }),
      ];

      errors.forEach((error) => {
        expect(isScraperError(error)).toBe(true);
      });
    });

    it('should return true for ScraperError with different messages', () => {
      const errors = [
        createMockScraperError({ message: 'Product not found' }),
        createMockScraperError({ message: 'Could not extract product data' }),
        createMockScraperError({ message: 'Network timeout' }),
        createMockScraperError({ message: 'Failed to fetch product' }),
      ];

      errors.forEach((error) => {
        expect(isScraperError(error)).toBe(true);
      });
    });

    it('should return false for valid ProductData objects', () => {
      const product = createMockProductData();
      expect(isScraperError(product)).toBe(false);
    });

    it('should return false for ProductData with different countries', () => {
      const products = [
        createMockProductData({ country: 'BE' }),
        createMockProductData({ country: 'NL' }),
        createMockProductData({ country: 'FR' }),
        createMockProductData({ country: 'DE' }),
      ];

      products.forEach((product) => {
        expect(isScraperError(product)).toBe(false);
      });
    });

    it('should correctly distinguish between error and product based on properties', () => {
      const error = createMockScraperError();
      const product = createMockProductData();

      // Error has 'message' but not 'name'
      expect('message' in error).toBe(true);
      expect('name' in error).toBe(false);

      // Product has 'name' but not 'message'
      expect('name' in product).toBe(true);
      expect('message' in product).toBe(false);

      // Type guard works correctly
      expect(isScraperError(error)).toBe(true);
      expect(isScraperError(product)).toBe(false);
    });

    it('should handle edge cases', () => {
      // Object with both message and name should be treated as ProductData (not an error)
      const ambiguous = {
        ...createMockProductData(),
        message: 'Some message',
      };
      expect(isScraperError(ambiguous as any)).toBe(false);

      // Object with only message (no productId or country) should still be detected as error
      const minimalError = {
        country: 'BE',
        message: 'Error',
        productId: '123',
      };
      expect(isScraperError(minimalError)).toBe(true);
    });

    it('should work with type narrowing', () => {
      const result: any = createMockScraperError();

      if (isScraperError(result)) {
        // TypeScript should narrow the type to ScraperError
        expect(result.message).toBeDefined();
        expect(result.country).toBeDefined();
        expect(result.productId).toBeDefined();
      } else {
        // This branch should not be reached
        fail('Expected result to be a ScraperError');
      }
    });

    it('should work with ProductData type narrowing', () => {
      const result: any = createMockProductData();

      if (!isScraperError(result)) {
        // TypeScript should narrow the type to ProductData
        expect(result.name).toBeDefined();
        expect(result.price).toBeDefined();
        expect(result.currency).toBeDefined();
        expect(result.imageUrl).toBeDefined();
        expect(result.available).toBeDefined();
      } else {
        // This branch should not be reached
        fail('Expected result to be ProductData');
      }
    });
  });
});
