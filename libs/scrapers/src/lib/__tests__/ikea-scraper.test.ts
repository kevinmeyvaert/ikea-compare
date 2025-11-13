import axios from 'axios';
import MockAdapter from 'axios-mock-adapter';
import { scrapeIkeaProduct, isScraperError } from '../ikea-scraper';
import {
  loadFixture,
  expectValidProduct,
  expectValidScraperError,
  generateIkeaUrl,
} from './helpers/test-utils';
import { expectPerformance } from './helpers/performance';

describe('IKEA Scraper', () => {
  let mock: MockAdapter;

  beforeEach(() => {
    mock = new MockAdapter(axios);
  });

  afterEach(() => {
    mock.reset();
  });

  describe('scrapeIkeaProduct - Successful scraping', () => {
    it('should scrape Belgian product with JSON-LD format', async () => {
      const productId = '40263850';
      const url = generateIkeaUrl('BE', productId);
      const html = loadFixture('be-product-jsonld.html');

      mock.onGet(url).reply(200, html);

      const result = await scrapeIkeaProduct('BE', productId);

      expect(isScraperError(result)).toBe(false);
      if (!isScraperError(result)) {
        expectValidProduct(result, 'BE');
        expect(result.name).toBe('BILLY boekenkast wit');
        expect(result.price).toBe(89.99);
        expect(result.currency).toBe('EUR');
        expect(result.available).toBe(true);
        expect(result.imageUrl).toContain('billy-boekenkast');
      }
    });

    it('should scrape Dutch product with AggregateOffer format', async () => {
      const productId = '20275885';
      const url = generateIkeaUrl('NL', productId);
      const html = loadFixture('nl-product-aggregate.html');

      mock.onGet(url).reply(200, html);

      const result = await scrapeIkeaProduct('NL', productId);

      expect(isScraperError(result)).toBe(false);
      if (!isScraperError(result)) {
        expectValidProduct(result, 'NL');
        expect(result.name).toBe('KALLAX stellingkast wit');
        expect(result.price).toBe(69.99);
        expect(result.currency).toBe('EUR');
        expect(result.available).toBe(true);
        expect(result.imageUrl).toContain('kallax');
      }
    });

    it('should scrape French product with utag_data format', async () => {
      const productId = '49131828';
      const url = generateIkeaUrl('FR', productId);
      const html = loadFixture('fr-product-utag.html');

      mock.onGet(url).reply(200, html);

      const result = await scrapeIkeaProduct('FR', productId);

      expect(isScraperError(result)).toBe(false);
      if (!isScraperError(result)) {
        expectValidProduct(result, 'FR');
        expect(result.name).toBe('MALM Structure de lit');
        expect(result.price).toBe(149.0);
        expect(result.currency).toBe('EUR');
      }
    });

    it('should scrape German product with HTML fallback', async () => {
      const productId = '79123456';
      const url = generateIkeaUrl('DE', productId);
      const html = loadFixture('de-product-fallback.html');

      mock.onGet(url).reply(200, html);

      const result = await scrapeIkeaProduct('DE', productId);

      expect(isScraperError(result)).toBe(false);
      if (!isScraperError(result)) {
        expectValidProduct(result, 'DE');
        expect(result.name).toBe('PAX Kleiderschrank');
        expect(result.price).toBe(235);
        expect(result.currency).toBe('EUR');
        expect(result.imageUrl).toContain('pax-kleiderschrank');
      }
    });
  });

  describe('scrapeIkeaProduct - Error handling', () => {
    it('should handle 404 responses', async () => {
      const productId = '99999999';
      const url = generateIkeaUrl('BE', productId);
      const html = loadFixture('404-error.html');

      mock.onGet(url).reply(404, html);

      const result = await scrapeIkeaProduct('BE', productId);

      expect(isScraperError(result)).toBe(true);
      if (isScraperError(result)) {
        expectValidScraperError(result, 'BE');
        expect(result.message).toBe('Product not found');
        expect(result.productId).toBe(productId);
      }
    });

    it('should handle malformed HTML', async () => {
      const productId = '12345678';
      const url = generateIkeaUrl('NL', productId);
      const html = loadFixture('malformed.html');

      mock.onGet(url).reply(200, html);

      const result = await scrapeIkeaProduct('NL', productId);

      expect(isScraperError(result)).toBe(true);
      if (isScraperError(result)) {
        expectValidScraperError(result, 'NL');
        expect(result.message).toBe('Could not extract product data');
      }
    });

    it('should handle network timeouts', async () => {
      const productId = '12345678';
      const url = generateIkeaUrl('FR', productId);

      mock.onGet(url).timeout();

      const result = await scrapeIkeaProduct('FR', productId);

      expect(isScraperError(result)).toBe(true);
      if (isScraperError(result)) {
        expectValidScraperError(result, 'FR');
        expect(result.message).toBeTruthy();
      }
    });

    it('should handle network errors', async () => {
      const productId = '12345678';
      const url = generateIkeaUrl('DE', productId);

      mock.onGet(url).networkError();

      const result = await scrapeIkeaProduct('DE', productId);

      expect(isScraperError(result)).toBe(true);
      if (isScraperError(result)) {
        expectValidScraperError(result, 'DE');
        expect(result.message).toBeTruthy();
      }
    });

    it('should handle 500 server errors', async () => {
      const productId = '12345678';
      const url = generateIkeaUrl('BE', productId);

      mock.onGet(url).reply(500, 'Internal Server Error');

      const result = await scrapeIkeaProduct('BE', productId);

      expect(isScraperError(result)).toBe(true);
      if (isScraperError(result)) {
        expectValidScraperError(result, 'BE');
      }
    });
  });

  describe('scrapeIkeaProduct - All countries', () => {
    it('should scrape from all supported countries', async () => {
      const countries: Array<'BE' | 'NL' | 'FR' | 'DE'> = ['BE', 'NL', 'FR', 'DE'];
      const fixtures = {
        BE: 'be-product-jsonld.html',
        NL: 'nl-product-aggregate.html',
        FR: 'fr-product-utag.html',
        DE: 'de-product-fallback.html',
      };

      for (const country of countries) {
        const productId = '12345678';
        const url = generateIkeaUrl(country, productId);
        const html = loadFixture(fixtures[country]);

        mock.onGet(url).reply(200, html);

        const result = await scrapeIkeaProduct(country, productId);

        expect(isScraperError(result)).toBe(false);
        if (!isScraperError(result)) {
          expectValidProduct(result, country);
          expect(result.country).toBe(country);
        }

        mock.reset();
      }
    });

    it('should handle 404 for all countries', async () => {
      const countries: Array<'BE' | 'NL' | 'FR' | 'DE'> = ['BE', 'NL', 'FR', 'DE'];

      for (const country of countries) {
        const productId = '99999999';
        const url = generateIkeaUrl(country, productId);

        mock.onGet(url).reply(404, 'Not Found');

        const result = await scrapeIkeaProduct(country, productId);

        expect(isScraperError(result)).toBe(true);
        if (isScraperError(result)) {
          expectValidScraperError(result, country);
          expect(result.message).toBe('Product not found');
        }

        mock.reset();
      }
    });
  });

  describe('scrapeIkeaProduct - Data extraction methods', () => {
    it('should extract data from JSON-LD with single Offer', async () => {
      const productId = '40263850';
      const url = generateIkeaUrl('BE', productId);
      const html = loadFixture('be-product-jsonld.html');

      mock.onGet(url).reply(200, html);

      const result = await scrapeIkeaProduct('BE', productId);

      expect(isScraperError(result)).toBe(false);
      if (!isScraperError(result)) {
        expect(result.price).toBe(89.99);
        expect(result.currency).toBe('EUR');
        expect(result.available).toBe(true);
      }
    });

    it('should extract data from JSON-LD with AggregateOffer', async () => {
      const productId = '20275885';
      const url = generateIkeaUrl('NL', productId);
      const html = loadFixture('nl-product-aggregate.html');

      mock.onGet(url).reply(200, html);

      const result = await scrapeIkeaProduct('NL', productId);

      expect(isScraperError(result)).toBe(false);
      if (!isScraperError(result)) {
        expect(result.price).toBe(69.99);
        expect(result.currency).toBe('EUR');
        expect(result.available).toBe(true);
      }
    });

    it('should extract data from utag_data', async () => {
      const productId = '49131828';
      const url = generateIkeaUrl('FR', productId);
      const html = loadFixture('fr-product-utag.html');

      mock.onGet(url).reply(200, html);

      const result = await scrapeIkeaProduct('FR', productId);

      expect(isScraperError(result)).toBe(false);
      if (!isScraperError(result)) {
        expect(result.name).toBe('MALM Structure de lit');
        expect(result.price).toBe(149.0);
      }
    });

    it('should use HTML fallback when JSON methods fail', async () => {
      const productId = '79123456';
      const url = generateIkeaUrl('DE', productId);
      const html = loadFixture('de-product-fallback.html');

      mock.onGet(url).reply(200, html);

      const result = await scrapeIkeaProduct('DE', productId);

      expect(isScraperError(result)).toBe(false);
      if (!isScraperError(result)) {
        expect(result.name).toBe('PAX Kleiderschrank');
        expect(result.price).toBe(235);
      }
    });
  });

  describe('scrapeIkeaProduct - Snapshots', () => {
    it('should match snapshot for Belgian product', async () => {
      const productId = '40263850';
      const url = generateIkeaUrl('BE', productId);
      const html = loadFixture('be-product-jsonld.html');

      mock.onGet(url).reply(200, html);

      const result = await scrapeIkeaProduct('BE', productId);

      expect(result).toMatchSnapshot();
    });

    it('should match snapshot for Dutch product', async () => {
      const productId = '20275885';
      const url = generateIkeaUrl('NL', productId);
      const html = loadFixture('nl-product-aggregate.html');

      mock.onGet(url).reply(200, html);

      const result = await scrapeIkeaProduct('NL', productId);

      expect(result).toMatchSnapshot();
    });

    it('should match snapshot for error response', async () => {
      const productId = '99999999';
      const url = generateIkeaUrl('BE', productId);

      mock.onGet(url).reply(404, 'Not Found');

      const result = await scrapeIkeaProduct('BE', productId);

      expect(result).toMatchSnapshot();
    });
  });

  describe('scrapeIkeaProduct - Performance', () => {
    it('should complete scraping within 2 seconds', async () => {
      const productId = '40263850';
      const url = generateIkeaUrl('BE', productId);
      const html = loadFixture('be-product-jsonld.html');

      mock.onGet(url).reply(200, html);

      await expectPerformance(
        async () => scrapeIkeaProduct('BE', productId),
        2000
      );
    });

    it('should handle multiple concurrent scrapes efficiently', async () => {
      const countries: Array<'BE' | 'NL' | 'FR' | 'DE'> = ['BE', 'NL', 'FR', 'DE'];
      const fixtures = {
        BE: 'be-product-jsonld.html',
        NL: 'nl-product-aggregate.html',
        FR: 'fr-product-utag.html',
        DE: 'de-product-fallback.html',
      };

      // Setup all mocks
      countries.forEach((country) => {
        const url = generateIkeaUrl(country, '12345678');
        const html = loadFixture(fixtures[country]);
        mock.onGet(url).reply(200, html);
      });

      // Run all scrapes concurrently
      const results = await expectPerformance(
        async () =>
          Promise.all(
            countries.map((country) => scrapeIkeaProduct(country, '12345678'))
          ),
        3000 // Should complete all 4 requests within 3 seconds
      );

      expect(results).toHaveLength(4);
      results.forEach((result, index) => {
        expect(isScraperError(result)).toBe(false);
        if (!isScraperError(result)) {
          expect(result.country).toBe(countries[index]);
        }
      });
    });
  });

  describe('scrapeIkeaProduct - Product URLs', () => {
    it('should generate correct URL for each country', async () => {
      const productId = '12345678';
      const expectedUrls = {
        BE: 'https://www.ikea.com/be/nl/p/12345678/',
        NL: 'https://www.ikea.com/nl/nl/p/12345678/',
        FR: 'https://www.ikea.com/fr/fr/p/12345678/',
        DE: 'https://www.ikea.com/de/de/p/12345678/',
      };

      const countries: Array<'BE' | 'NL' | 'FR' | 'DE'> = ['BE', 'NL', 'FR', 'DE'];

      for (const country of countries) {
        const url = generateIkeaUrl(country, productId);
        expect(url).toBe(expectedUrls[country]);

        // Verify the scraper makes request to correct URL
        mock.onGet(url).reply(200, loadFixture('be-product-jsonld.html'));

        await scrapeIkeaProduct(country, productId);

        // Check that the request was made to the expected URL
        expect(mock.history.get.length).toBe(1);
        expect(mock.history.get[0].url).toBe(url);

        mock.reset();
      }
    });

    it('should include correct country in returned product data', async () => {
      const productId = '12345678';
      const countries: Array<'BE' | 'NL' | 'FR' | 'DE'> = ['BE', 'NL', 'FR', 'DE'];

      for (const country of countries) {
        const url = generateIkeaUrl(country, productId);
        mock.onGet(url).reply(200, loadFixture('be-product-jsonld.html'));

        const result = await scrapeIkeaProduct(country, productId);

        expect(isScraperError(result)).toBe(false);
        if (!isScraperError(result)) {
          expect(result.country).toBe(country);
          expect(result.url).toContain(`/${country.toLowerCase()}/`);
        }

        mock.reset();
      }
    });
  });
});
