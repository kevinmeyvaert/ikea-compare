/**
 * IKEA share link examples for testing
 * Format: receive-share/PRODUCTID:QUANTITY,PRODUCTID:QUANTITY
 */

/**
 * Valid share link with multiple products and quantities
 */
export const validShareLink = 'receive-share/40263850:2,00373589:1,19829149:3';

/**
 * Share link with single product and quantity
 */
export const singleProductShareLink = 'receive-share/40263850:1';

/**
 * Share link with mixed quantities
 */
export const mixedQuantitiesShareLink = 'receive-share/40263850:5,00373589:2,19829149:1';

/**
 * Share link with product that doesn't exist (will fail to fetch)
 */
export const shareLinkWithInvalidProduct = 'receive-share/40263850:2,99999999:1';

/**
 * Empty share link (invalid)
 */
export const emptyShareLink = '';

/**
 * Malformed share link formats
 */
export const malformedShareLinks = [
  'invalid-format',
  'receive-share/',
  'receive-share/12345678', // Missing quantity
  'receive-share/abc:1', // Invalid product ID
  'receive-share/:1', // Missing product ID
  'receive-share/12345678:abc', // Invalid quantity
];

/**
 * IKEA applink URL that redirects to a share link
 * These are shortened URLs from IKEA that redirect to the full share link
 */
export const applinkUrl = 'https://applink.ikea.com/be/app/?target=receive-share/40263850:2,00373589:1';

/**
 * Expected redirect from applink
 */
export const applinkRedirectTarget = 'https://www.ikea.com/be/nl/shoppingcart/receive-share/40263850:2,00373589:1';

/**
 * Parse share link helper - extracted logic from route
 */
export function parseShareLink(shareLink: string): string[] {
  // Extract product IDs and quantities from share link format
  // Format: receive-share/PRODUCTID:QUANTITY,PRODUCTID:QUANTITY
  const match = shareLink.match(/receive-share\/(.+)/);
  if (!match) return [];

  const productsString = match[1];
  const productEntries = productsString.split(',');

  const productIds: string[] = [];
  for (const entry of productEntries) {
    const [productId, quantityStr] = entry.split(':');
    const quantity = parseInt(quantityStr || '1', 10);

    // Add product ID multiple times based on quantity
    for (let i = 0; i < quantity; i++) {
      productIds.push(productId);
    }
  }

  return productIds;
}

/**
 * Expected parsed results for test assertions
 */
export const parsedResults = {
  validShareLink: ['40263850', '40263850', '00373589', '19829149', '19829149', '19829149'],
  singleProductShareLink: ['40263850'],
  mixedQuantitiesShareLink: [
    '40263850', '40263850', '40263850', '40263850', '40263850',
    '00373589', '00373589',
    '19829149'
  ],
};
