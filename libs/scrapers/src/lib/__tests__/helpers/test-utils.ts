import { readFileSync } from 'fs';
import { join } from 'path';
import MockAdapter from 'axios-mock-adapter';
import axios from 'axios';
import type { ProductData, ScraperError } from '@ikea-compare/types';

/**
 * Load an HTML fixture file from the fixtures directory
 */
export function loadFixture(filename: string): string {
  const fixturePath = join(__dirname, '..', 'fixtures', filename);
  return readFileSync(fixturePath, 'utf-8');
}

/**
 * Create a mock ProductData object with default values
 */
export function createMockProductData(
  overrides: Partial<ProductData> = {}
): ProductData {
  return {
    productId: '12345678',
    name: 'BILLY Bookcase',
    price: 49.99,
    currency: 'EUR',
    imageUrl: 'https://www.ikea.com/image.jpg',
    available: true,
    country: 'BE',
    url: 'https://www.ikea.com/be/en/p/billy-bookcase-12345678/',
    ...overrides,
  };
}

/**
 * Create a mock ScraperError object
 */
export function createMockScraperError(
  overrides: Partial<ScraperError> = {}
): ScraperError {
  return {
    country: 'BE',
    message: 'Product not found',
    productId: '12345678',
    ...overrides,
  };
}

/**
 * Setup axios mock adapter with a successful response
 */
export function mockAxiosSuccess(
  mock: MockAdapter,
  url: string,
  html: string,
  status: number = 200
): void {
  mock.onGet(url).reply(status, html, {
    'content-type': 'text/html; charset=utf-8',
  });
}

/**
 * Setup axios mock adapter with an error response
 */
export function mockAxiosError(
  mock: MockAdapter,
  url: string,
  status: number,
  message: string = 'Not found'
): void {
  mock.onGet(url).reply(status, message);
}

/**
 * Setup axios mock adapter with a network error
 */
export function mockAxiosNetworkError(
  mock: MockAdapter,
  url: string
): void {
  mock.onGet(url).networkError();
}

/**
 * Setup axios mock adapter with a timeout
 */
export function mockAxiosTimeout(mock: MockAdapter, url: string): void {
  mock.onGet(url).timeout();
}

/**
 * Create a new axios mock adapter
 */
export function createAxiosMock(): MockAdapter {
  return new MockAdapter(axios);
}

/**
 * Custom assertion to validate a ProductData object
 */
export function expectValidProduct(
  product: ProductData,
  expectedCountry: 'BE' | 'NL' | 'FR' | 'DE'
): void {
  expect(product).toMatchObject({
    productId: expect.any(String),
    name: expect.any(String),
    price: expect.any(Number),
    currency: expect.any(String),
    imageUrl: expect.any(String),
    available: expect.any(Boolean),
    country: expectedCountry,
    url: expect.any(String),
  });

  // Validate that required fields are not empty
  expect(product.productId).toBeTruthy();
  expect(product.name).toBeTruthy();
  expect(product.price).toBeGreaterThan(0);
  expect(product.currency).toBeTruthy();
  expect(product.imageUrl).toBeTruthy();
  expect(product.url).toBeTruthy();
}

/**
 * Custom assertion to validate a ScraperError object
 */
export function expectValidScraperError(
  error: ScraperError,
  expectedCountry?: string
): void {
  expect(error).toMatchObject({
    country: expect.any(String),
    message: expect.any(String),
    productId: expect.any(String),
  });

  expect(error.message).toBeTruthy();
  expect(error.productId).toBeTruthy();

  if (expectedCountry) {
    expect(error.country).toBe(expectedCountry);
  }
}

/**
 * Generate realistic IKEA product URLs for testing
 * Must match the COUNTRY_CONFIGS in ikea-scraper.ts
 */
export function generateIkeaUrl(
  country: 'BE' | 'NL' | 'FR' | 'DE',
  productId: string
): string {
  const baseUrls = {
    BE: 'https://www.ikea.com/be/nl',  // Belgium uses Dutch
    NL: 'https://www.ikea.com/nl/nl',
    FR: 'https://www.ikea.com/fr/fr',
    DE: 'https://www.ikea.com/de/de',
  };

  return `${baseUrls[country]}/p/${productId}/`;
}
