/**
 * Mock product data responses
 * Matches the ProductComparisonResult type from @ikea-compare/types
 */

import { ProductComparisonResult } from '@ikea-compare/types';

/**
 * BILLY Bookcase - Available in all countries, cheapest in Belgium
 */
export const billyBookcase: ProductComparisonResult = {
  productId: '40263850',
  products: {
    belgium: {
      name: 'BILLY Bookcase, white, 80x28x202 cm',
      price: 69.99,
      available: true,
      imageUrl: 'https://www.ikea.com/be/nl/images/products/billy-bookcase-white__0625599_pe692385_s5.jpg',
    },
    netherlands: {
      name: 'BILLY Boekenkast, wit, 80x28x202 cm',
      price: 74.99,
      available: true,
      imageUrl: 'https://www.ikea.com/nl/nl/images/products/billy-bookcase-white__0625599_pe692385_s5.jpg',
    },
    france: {
      name: 'BILLY Bibliothèque, blanc, 80x28x202 cm',
      price: 79.99,
      available: true,
      imageUrl: 'https://www.ikea.com/fr/fr/images/products/billy-bookcase-white__0625599_pe692385_s5.jpg',
    },
    germany: {
      name: 'BILLY Bücherregal, weiß, 80x28x202 cm',
      price: 72.99,
      available: true,
      imageUrl: 'https://www.ikea.com/de/de/images/products/billy-bookcase-white__0625599_pe692385_s5.jpg',
    },
  },
  cheapest: ['BE'],
};

/**
 * KALLAX Shelf - Available in all countries
 */
export const kallaxShelf: ProductComparisonResult = {
  productId: '00373589',
  products: {
    belgium: {
      name: 'KALLAX Shelf unit, white, 77x147 cm',
      price: 49.99,
      available: true,
      imageUrl: 'https://www.ikea.com/be/nl/images/products/kallax-shelf-unit-white__0625599_pe692385_s5.jpg',
    },
    netherlands: {
      name: 'KALLAX Stellingkast, wit, 77x147 cm',
      price: 54.99,
      available: true,
      imageUrl: 'https://www.ikea.com/nl/nl/images/products/kallax-shelf-unit-white__0625599_pe692385_s5.jpg',
    },
    france: {
      name: 'KALLAX Étagère, blanc, 77x147 cm',
      price: 59.99,
      available: true,
      imageUrl: 'https://www.ikea.com/fr/fr/images/products/kallax-shelf-unit-white__0625599_pe692385_s5.jpg',
    },
    germany: {
      name: 'KALLAX Regal, weiß, 77x147 cm',
      price: 52.99,
      available: true,
      imageUrl: 'https://www.ikea.com/de/de/images/products/kallax-shelf-unit-white__0625599_pe692385_s5.jpg',
    },
  },
  cheapest: ['BE'],
};

/**
 * POÄNG Armchair - Available in all countries
 */
export const poangArmchair: ProductComparisonResult = {
  productId: '19829149',
  products: {
    belgium: {
      name: 'POÄNG Armchair, birch veneer/Knisa light beige',
      price: 79.99,
      available: true,
      imageUrl: 'https://www.ikea.com/be/nl/images/products/poang-armchair-birch-veneer-knisa-light-beige__0625599_pe692385_s5.jpg',
    },
    netherlands: {
      name: 'POÄNG Fauteuil, berkenfin/Knisa lichtbeige',
      price: 84.99,
      available: true,
      imageUrl: 'https://www.ikea.com/nl/nl/images/products/poang-armchair-birch-veneer-knisa-light-beige__0625599_pe692385_s5.jpg',
    },
    france: {
      name: 'POÄNG Fauteuil, plaqué bouleau/Knisa beige clair',
      price: 89.99,
      available: true,
      imageUrl: 'https://www.ikea.com/fr/fr/images/products/poang-armchair-birch-veneer-knisa-light-beige__0625599_pe692385_s5.jpg',
    },
    germany: {
      name: 'POÄNG Sessel, Birkenfurnier/Knisa hellbeige',
      price: 82.99,
      available: true,
      imageUrl: 'https://www.ikea.com/de/de/images/products/poang-armchair-birch-veneer-knisa-light-beige__0625599_pe692385_s5.jpg',
    },
  },
  cheapest: ['BE'],
};

/**
 * Product with partial availability (missing in some countries)
 */
export const partiallyAvailableProduct: ProductComparisonResult = {
  productId: '50427067',
  products: {
    belgium: {
      name: 'LACK Side table, white, 55x55 cm',
      price: 9.99,
      available: true,
      imageUrl: 'https://www.ikea.com/be/nl/images/products/lack-side-table-white__0625599_pe692385_s5.jpg',
    },
    netherlands: null,
    france: {
      name: 'LACK Table d\'appoint, blanc, 55x55 cm',
      price: 12.99,
      available: true,
      imageUrl: 'https://www.ikea.com/fr/fr/images/products/lack-side-table-white__0625599_pe692385_s5.jpg',
    },
    germany: null,
  },
  cheapest: ['BE'],
};

/**
 * Product unavailable in all countries
 */
export const unavailableProduct: ProductComparisonResult = {
  productId: '91754698',
  products: {
    belgium: null,
    netherlands: null,
    france: null,
    germany: null,
  },
  cheapest: [],
};

/**
 * Product with price ties (multiple cheapest countries)
 */
export const productWithPriceTies: ProductComparisonResult = {
  productId: '29227519',
  products: {
    belgium: {
      name: 'METOD Base cabinet, white, 60x60 cm',
      price: 120.00,
      available: true,
      imageUrl: 'https://www.ikea.com/be/nl/images/products/metod-base-cabinet-white__0625599_pe692385_s5.jpg',
    },
    netherlands: {
      name: 'METOD Onderkast, wit, 60x60 cm',
      price: 120.00,
      available: true,
      imageUrl: 'https://www.ikea.com/nl/nl/images/products/metod-base-cabinet-white__0625599_pe692385_s5.jpg',
    },
    france: {
      name: 'METOD Élément bas, blanc, 60x60 cm',
      price: 135.00,
      available: true,
      imageUrl: 'https://www.ikea.com/fr/fr/images/products/metod-base-cabinet-white__0625599_pe692385_s5.jpg',
    },
    germany: {
      name: 'METOD Unterschrank, weiß, 60x60 cm',
      price: 125.00,
      available: true,
      imageUrl: 'https://www.ikea.com/de/de/images/products/metod-base-cabinet-white__0625599_pe692385_s5.jpg',
    },
  },
  cheapest: ['BE', 'NL'],
};

/**
 * Map of product IDs to mock responses for easy lookup in tests
 */
export const mockProductDatabase: Record<string, ProductComparisonResult> = {
  '40263850': billyBookcase,
  '00373589': kallaxShelf,
  '19829149': poangArmchair,
  '50427067': partiallyAvailableProduct,
  '91754698': unavailableProduct,
  '29227519': productWithPriceTies,
  // Products from decimal quantities PDF
  '20294904': {
    productId: '20294904',
    products: {
      belgium: { name: 'LYSEKIL Wall panel, white', price: 25.00, available: true, imageUrl: 'https://ikea.com/img.jpg' },
      netherlands: { name: 'LYSEKIL Wall panel, white', price: 27.00, available: true, imageUrl: 'https://ikea.com/img.jpg' },
      france: { name: 'LYSEKIL Wall panel, white', price: 29.00, available: true, imageUrl: 'https://ikea.com/img.jpg' },
      germany: { name: 'LYSEKIL Wall panel, white', price: 26.00, available: true, imageUrl: 'https://ikea.com/img.jpg' },
    },
    cheapest: ['BE'],
  },
  '80336563': {
    productId: '80336563',
    products: {
      belgium: { name: 'EKBACKEN Countertop, white', price: 89.00, available: true, imageUrl: 'https://ikea.com/img.jpg' },
      netherlands: { name: 'EKBACKEN Countertop, white', price: 94.00, available: true, imageUrl: 'https://ikea.com/img.jpg' },
      france: { name: 'EKBACKEN Countertop, white', price: 99.00, available: true, imageUrl: 'https://ikea.com/img.jpg' },
      germany: { name: 'EKBACKEN Countertop, white', price: 91.00, available: true, imageUrl: 'https://ikea.com/img.jpg' },
    },
    cheapest: ['BE'],
  },
  '60427582': {
    productId: '60427582',
    products: {
      belgium: { name: 'UTBYTT Door, white', price: 15.00, available: true, imageUrl: 'https://ikea.com/img.jpg' },
      netherlands: { name: 'UTBYTT Door, white', price: 16.00, available: true, imageUrl: 'https://ikea.com/img.jpg' },
      france: { name: 'UTBYTT Door, white', price: 17.00, available: true, imageUrl: 'https://ikea.com/img.jpg' },
      germany: { name: 'UTBYTT Door, white', price: 15.50, available: true, imageUrl: 'https://ikea.com/img.jpg' },
    },
    cheapest: ['BE'],
  },
  // Product with malformed code test
  '60327582': {
    productId: '60327582',
    products: {
      belgium: { name: 'Test Product C', price: 39.99, available: true, imageUrl: 'https://ikea.com/img.jpg' },
      netherlands: { name: 'Test Product C', price: 42.99, available: true, imageUrl: 'https://ikea.com/img.jpg' },
      france: { name: 'Test Product C', price: 44.99, available: true, imageUrl: 'https://ikea.com/img.jpg' },
      germany: { name: 'Test Product C', price: 41.99, available: true, imageUrl: 'https://ikea.com/img.jpg' },
    },
    cheapest: ['BE'],
  },
  // Product for duplicate test (code 492.275.19)
  '49227519': {
    productId: '49227519',
    products: {
      belgium: { name: 'METOD Base cabinet, white', price: 120.00, available: true, imageUrl: 'https://ikea.com/img.jpg' },
      netherlands: { name: 'METOD Onderkast, wit', price: 120.00, available: true, imageUrl: 'https://ikea.com/img.jpg' },
      france: { name: 'METOD Élément bas, blanc', price: 135.00, available: true, imageUrl: 'https://ikea.com/img.jpg' },
      germany: { name: 'METOD Unterschrank, weiß', price: 125.00, available: true, imageUrl: 'https://ikea.com/img.jpg' },
    },
    cheapest: ['BE', 'NL'],
  },
  // Product extracted from malformed code test (substring match 234.567.89)
  '23456789': {
    productId: '23456789',
    products: {
      belgium: { name: 'Test Product D', price: 29.99, available: true, imageUrl: 'https://ikea.com/img.jpg' },
      netherlands: { name: 'Test Product D', price: 32.99, available: true, imageUrl: 'https://ikea.com/img.jpg' },
      france: { name: 'Test Product D', price: 34.99, available: true, imageUrl: 'https://ikea.com/img.jpg' },
      germany: { name: 'Test Product D', price: 31.99, available: true, imageUrl: 'https://ikea.com/img.jpg' },
    },
    cheapest: ['BE'],
  },
};
