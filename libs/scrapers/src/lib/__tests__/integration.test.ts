/**
 * Integration tests with real HTTP requests to IKEA websites
 *
 * These tests are skipped by default to avoid dependencies on external services
 * and to prevent rate limiting issues.
 *
 * To run these tests, set the environment variable:
 * RUN_INTEGRATION_TESTS=true npm test
 *
 * Or run a specific test:
 * RUN_INTEGRATION_TESTS=true npx nx test scrapers --testNamePattern="Integration Tests"
 */

import { scrapeIkeaProduct, isScraperError } from '../ikea-scraper';
import { expectValidProduct } from './helpers/test-utils';

const shouldRunIntegrationTests = process.env.RUN_INTEGRATION_TESTS === 'true';
const describeIntegration = shouldRunIntegrationTests ? describe : describe.skip;

describeIntegration('Integration Tests - Real HTTP Requests', () => {
  // Increase timeout for real HTTP requests
  jest.setTimeout(30000);

  /**
   * Known working product IDs for each country (as of test creation)
   * These may need to be updated if products are discontinued
   */
  const testProducts = {
    BE: {
      productId: '40263850', // BILLY bookcase
      expectedName: 'BILLY',
    },
    NL: {
      productId: '20275885', // KALLAX
      expectedName: 'KALLAX',
    },
    FR: {
      productId: '40263850', // BILLY (same product, different country)
      expectedName: 'BILLY',
    },
    DE: {
      productId: '40263850', // BILLY
      expectedName: 'BILLY',
    },
  };

  describe('Real IKEA website scraping', () => {
    it('should scrape a real product from IKEA Belgium', async () => {
      const { productId, expectedName } = testProducts.BE;
      const result = await scrapeIkeaProduct('BE', productId);

      expect(isScraperError(result)).toBe(false);

      if (!isScraperError(result)) {
        expectValidProduct(result, 'BE');
        expect(result.name).toContain(expectedName);
        expect(result.productId).toBe(productId);
        expect(result.price).toBeGreaterThan(0);
        expect(result.imageUrl).toBeTruthy();

        console.log('✓ Belgium:', {
          name: result.name,
          price: `${result.price} ${result.currency}`,
          available: result.available,
        });
      }
    });

    it('should scrape a real product from IKEA Netherlands', async () => {
      const { productId, expectedName } = testProducts.NL;
      const result = await scrapeIkeaProduct('NL', productId);

      expect(isScraperError(result)).toBe(false);

      if (!isScraperError(result)) {
        expectValidProduct(result, 'NL');
        expect(result.name).toContain(expectedName);
        expect(result.productId).toBe(productId);
        expect(result.price).toBeGreaterThan(0);

        console.log('✓ Netherlands:', {
          name: result.name,
          price: `${result.price} ${result.currency}`,
          available: result.available,
        });
      }
    });

    it('should scrape a real product from IKEA France', async () => {
      const { productId, expectedName } = testProducts.FR;
      const result = await scrapeIkeaProduct('FR', productId);

      expect(isScraperError(result)).toBe(false);

      if (!isScraperError(result)) {
        expectValidProduct(result, 'FR');
        expect(result.name).toContain(expectedName);
        expect(result.productId).toBe(productId);
        expect(result.price).toBeGreaterThan(0);

        console.log('✓ France:', {
          name: result.name,
          price: `${result.price} ${result.currency}`,
          available: result.available,
        });
      }
    });

    it('should scrape a real product from IKEA Germany', async () => {
      const { productId, expectedName } = testProducts.DE;
      const result = await scrapeIkeaProduct('DE', productId);

      expect(isScraperError(result)).toBe(false);

      if (!isScraperError(result)) {
        expectValidProduct(result, 'DE');
        expect(result.name).toContain(expectedName);
        expect(result.productId).toBe(productId);
        expect(result.price).toBeGreaterThan(0);

        console.log('✓ Germany:', {
          name: result.name,
          price: `${result.price} ${result.currency}`,
          available: result.available,
        });
      }
    });
  });

  describe('Real error scenarios', () => {
    it('should handle non-existent product ID', async () => {
      const fakeProductId = '99999999';
      const result = await scrapeIkeaProduct('BE', fakeProductId);

      expect(isScraperError(result)).toBe(true);

      if (isScraperError(result)) {
        expect(result.country).toBe('BE');
        expect(result.productId).toBe(fakeProductId);
        expect(result.message).toBeTruthy();

        console.log('✓ Error handling:', result.message);
      }
    });
  });

  describe('Real performance benchmarks', () => {
    it('should complete real scraping within reasonable time', async () => {
      const { productId } = testProducts.BE;
      const startTime = performance.now();

      const result = await scrapeIkeaProduct('BE', productId);

      const duration = performance.now() - startTime;

      expect(isScraperError(result)).toBe(false);
      expect(duration).toBeLessThan(15000); // 15 seconds for real HTTP

      console.log(`✓ Performance: ${duration.toFixed(0)}ms`);
    });

    it('should handle concurrent requests to different countries', async () => {
      const startTime = performance.now();

      const results = await Promise.all([
        scrapeIkeaProduct('BE', testProducts.BE.productId),
        scrapeIkeaProduct('NL', testProducts.NL.productId),
        scrapeIkeaProduct('FR', testProducts.FR.productId),
        scrapeIkeaProduct('DE', testProducts.DE.productId),
      ]);

      const duration = performance.now() - startTime;

      results.forEach((result) => {
        expect(isScraperError(result)).toBe(false);
      });

      expect(duration).toBeLessThan(20000); // 20 seconds for 4 concurrent requests

      console.log(`✓ Concurrent requests: ${duration.toFixed(0)}ms for 4 countries`);
    });
  });

  describe('Data consistency checks', () => {
    it('should get consistent data when scraping the same product multiple times', async () => {
      const { productId } = testProducts.BE;

      // Scrape the same product twice
      const result1 = await scrapeIkeaProduct('BE', productId);
      await new Promise((resolve) => setTimeout(resolve, 1000)); // Wait 1 second
      const result2 = await scrapeIkeaProduct('BE', productId);

      expect(isScraperError(result1)).toBe(false);
      expect(isScraperError(result2)).toBe(false);

      if (!isScraperError(result1) && !isScraperError(result2)) {
        // Core product data should be consistent
        expect(result1.name).toBe(result2.name);
        expect(result1.productId).toBe(result2.productId);
        expect(result1.currency).toBe(result2.currency);

        // Price might change, but should be in reasonable range
        const priceDiff = Math.abs(result1.price - result2.price);
        expect(priceDiff).toBeLessThan(result1.price * 0.1); // Less than 10% difference

        console.log('✓ Data consistency verified');
      }
    });
  });
});

// Message to display when tests are skipped
if (!shouldRunIntegrationTests) {
  console.log('\n⚠️  Integration tests are skipped by default.');
  console.log('To run them, use: RUN_INTEGRATION_TESTS=true npm test\n');
}
