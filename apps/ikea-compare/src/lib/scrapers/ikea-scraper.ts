import axios from 'axios';
import * as cheerio from 'cheerio';
import { ProductData, ScraperError } from './types';

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
} as const;

/**
 * Constructs the IKEA product URL for a given country
 */
function buildProductUrl(
  country: keyof typeof COUNTRY_CONFIGS,
  productId: string
): string {
  const config = COUNTRY_CONFIGS[country];
  // IKEA URLs follow pattern: /be/nl/p/product-name-00263850/
  // We'll try to fetch with a minimal URL structure
  return `${config.baseUrl}/p/${productId}/`;
}

/**
 * Extracts product data from IKEA product page HTML
 */
function extractProductData(
  html: string,
  productId: string,
  country: keyof typeof COUNTRY_CONFIGS
): ProductData | null {
  const $ = cheerio.load(html);

  try {
    // IKEA embeds product data in script tags as JSON
    // Look for the utag_data or similar data structures
    let productData: any = null;

    // Strategy 1: Find JSON-LD structured data
    $('script[type="application/ld+json"]').each((_, element) => {
      try {
        const jsonData = JSON.parse($(element).html() || '');
        if (jsonData['@type'] === 'Product') {
          productData = jsonData;
        }
      } catch (e) {
        // Continue to next script tag
      }
    });

    // Strategy 2: Look for embedded data in script tags
    if (!productData) {
      $('script').each((_, element) => {
        const scriptContent = $(element).html() || '';

        // Look for utag_data
        if (scriptContent.includes('utag_data')) {
          try {
            const match = scriptContent.match(/utag_data\s*=\s*({[\s\S]*?});/);
            if (match) {
              productData = JSON.parse(match[1]);
            }
          } catch (e) {
            // Continue
          }
        }

        // Look for window.__INITIAL_STATE__ or similar
        if (scriptContent.includes('__INITIAL_STATE__')) {
          try {
            const match = scriptContent.match(/__INITIAL_STATE__\s*=\s*({[\s\S]*?});/);
            if (match) {
              const initialState = JSON.parse(match[1]);
              productData = initialState;
            }
          } catch (e) {
            // Continue
          }
        }
      });
    }

    // Extract data from the parsed JSON or HTML
    let name = '';
    let price = 0;
    let currency = 'EUR';
    let imageUrl = '';
    let available = true;

    if (productData) {
      // Handle JSON-LD format
      if (productData['@type'] === 'Product') {
        name = productData.name || '';

        // Handle different offer structures
        if (productData.offers) {
          // AggregateOffer with nested offers array
          if (productData.offers['@type'] === 'AggregateOffer' && productData.offers.offers?.[0]) {
            price = parseFloat(productData.offers.offers[0].price) || parseFloat(productData.offers.lowPrice) || 0;
            currency = productData.offers.offers[0].priceCurrency || productData.offers.priceCurrency || 'EUR';
            available = productData.offers.offers[0].availability === 'https://schema.org/InStock';
          }
          // Single Offer
          else {
            price = parseFloat(productData.offers.price) || 0;
            currency = productData.offers.priceCurrency || 'EUR';
            available = productData.offers.availability === 'https://schema.org/InStock';
          }
        }

        imageUrl = productData.image?.[0] || productData.image || '';
      }
      // Handle utag_data format
      else if (productData.product_names) {
        name = Array.isArray(productData.product_names)
          ? productData.product_names[0]
          : productData.product_names;

        const priceStr = Array.isArray(productData.price)
          ? productData.price[0]
          : productData.price;
        price = parseFloat(String(priceStr || '0'));
        currency = 'EUR';
      }
    }

    // Fallback: Parse from HTML if JSON extraction failed
    if (!name) {
      name = $('h1.pip-header-section__title').text().trim() ||
             $('h1[class*="title"]').first().text().trim() ||
             $('meta[property="og:title"]').attr('content') || '';
    }

    if (!price) {
      const priceText = $('.pip-temp-price__integer').first().text().trim() ||
                       $('[class*="price"]').first().text().trim();
      if (priceText) {
        const priceMatch = priceText.match(/[\d,]+\.?\d*/);
        if (priceMatch) {
          price = parseFloat(priceMatch[0].replace(',', '.'));
        }
      }
    }

    if (!imageUrl) {
      imageUrl = $('meta[property="og:image"]').attr('content') ||
                $('img.pip-image').first().attr('src') ||
                $('img[class*="product"]').first().attr('src') || '';
    }

    // Check if product exists
    if (!name || price === 0) {
      console.log(`[${country}] Failed to extract product data - name: ${name}, price: ${price}`);
      return null;
    }

    const result = {
      productId,
      name,
      price,
      currency,
      imageUrl,
      available,
      country,
      url: buildProductUrl(country, productId),
    };

    console.log(`[${country}] Successfully extracted:`, { name, price, currency, available });
    return result;
  } catch (error) {
    console.error(`Error extracting data for ${country}:`, error);
    return null;
  }
}

/**
 * Scrapes product data from a specific IKEA country website
 */
export async function scrapeIkeaProduct(
  country: keyof typeof COUNTRY_CONFIGS,
  productId: string
): Promise<ProductData | ScraperError> {
  try {
    const url = buildProductUrl(country, productId);

    const response = await axios.get(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
        'Accept-Language': 'en-US,en;q=0.5',
        'Accept-Encoding': 'gzip, deflate, br',
        'Connection': 'keep-alive',
        'Upgrade-Insecure-Requests': '1',
      },
      timeout: 10000, // 10 second timeout
    });

    if (response.status === 404) {
      return {
        country,
        message: 'Product not found',
        productId,
      };
    }

    const productData = extractProductData(response.data, productId, country);

    if (!productData) {
      return {
        country,
        message: 'Could not extract product data',
        productId,
      };
    }

    return productData;
  } catch (error: any) {
    if (error.response?.status === 404) {
      return {
        country,
        message: 'Product not found',
        productId,
      };
    }

    return {
      country,
      message: error.message || 'Failed to fetch product',
      productId,
    };
  }
}

/**
 * Helper function to check if result is an error
 */
export function isScraperError(result: ProductData | ScraperError): result is ScraperError {
  return 'message' in result && !('name' in result);
}
