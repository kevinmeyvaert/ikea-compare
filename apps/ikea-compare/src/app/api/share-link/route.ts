import { NextRequest, NextResponse } from 'next/server';
import { ShoppingListAnalysis, ShoppingListProduct, StoreTotal, MultiStoreStrategy } from '../../../lib/shopping-list/types';
import { ProductComparisonResult } from '../../../lib/scrapers/types';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { shareLink } = body;

    if (!shareLink) {
      return NextResponse.json(
        { error: 'Share link is vereist' },
        { status: 400 }
      );
    }

    // Parse the share link to extract product codes and quantities
    // Example: https://www.ikea.com/be/nl/favourites/receive-share/69505955:2,60275812:3?source=cart
    const productCodes = parseShareLink(shareLink);

    if (productCodes.length === 0) {
      return NextResponse.json(
        { error: 'Geen productcodes gevonden in de share link' },
        { status: 400 }
      );
    }

    // Get unique product IDs (we'll handle quantities in the analysis)
    const uniqueProductIds = [...new Set(productCodes)];

    console.log(`[Share Link] Found ${uniqueProductIds.length} unique product codes:`, uniqueProductIds);

    // Fetch prices for all products
    const products: ShoppingListProduct[] = [];
    const failedProducts: string[] = [];

    for (const productId of uniqueProductIds) {
      try {
        // Fetch product data from our existing API
        const response = await fetch(`${request.nextUrl.origin}/api/product/${productId}`);

        if (!response.ok) {
          failedProducts.push(productId);
          continue;
        }

        const productData: ProductComparisonResult = await response.json();

        // Count how many times this product appears in the share link
        const quantity = productCodes.filter(id => id === productId).length;

        // Add one entry per quantity
        for (let i = 0; i < quantity; i++) {
          products.push({
            productId,
            products: productData.products,
            cheapest: productData.cheapest,
            cheapestPrice: productData.cheapest
              ? productData.products[
                  productData.cheapest === 'BE' ? 'belgium'
                  : productData.cheapest === 'NL' ? 'netherlands'
                  : 'france'
                ]?.price || null
              : null,
          });
        }
      } catch (error) {
        console.error(`Failed to fetch product ${productId}:`, error);
        failedProducts.push(productId);
      }
    }

    // Calculate store totals
    const storeTotals: StoreTotal[] = [
      {
        storeCode: 'BE',
        storeName: 'Belgium',
        totalCost: 0,
        availableProducts: 0,
        unavailableProducts: 0,
      },
      {
        storeCode: 'NL',
        storeName: 'Netherlands',
        totalCost: 0,
        availableProducts: 0,
        unavailableProducts: 0,
      },
      {
        storeCode: 'FR',
        storeName: 'France',
        totalCost: 0,
        availableProducts: 0,
        unavailableProducts: 0,
      },
    ];

    products.forEach((product) => {
      ['belgium', 'netherlands', 'france'].forEach((country, idx) => {
        const countryKey = country as 'belgium' | 'netherlands' | 'france';
        const price = product.products[countryKey]?.price;
        if (price) {
          storeTotals[idx].totalCost += price;
          storeTotals[idx].availableProducts += 1;
        } else {
          storeTotals[idx].unavailableProducts += 1;
        }
      });
    });

    // Find best single store
    const bestStore = [...storeTotals]
      .filter((store) => store.availableProducts > 0)
      .sort((a, b) => a.totalCost - b.totalCost)[0];

    // Calculate multi-store strategy
    const multiStoreBreakdown: MultiStoreStrategy['breakdown'] = [
      { store: 'BE', storeName: 'Belgium', productCount: 0, subtotal: 0, products: [] },
      { store: 'NL', storeName: 'Netherlands', productCount: 0, subtotal: 0, products: [] },
      { store: 'FR', storeName: 'France', productCount: 0, subtotal: 0, products: [] },
    ];

    let multiStoreTotalCost = 0;

    products.forEach((product) => {
      if (product.cheapest && product.cheapestPrice) {
        const storeIdx = product.cheapest === 'BE' ? 0 : product.cheapest === 'NL' ? 1 : 2;
        multiStoreBreakdown[storeIdx].productCount += 1;
        multiStoreBreakdown[storeIdx].subtotal += product.cheapestPrice;
        multiStoreBreakdown[storeIdx].products.push(product.productId);
        multiStoreTotalCost += product.cheapestPrice;
      }
    });

    const multiStoreStrategy: MultiStoreStrategy = {
      totalCost: multiStoreTotalCost,
      savings: bestStore ? bestStore.totalCost - multiStoreTotalCost : 0,
      breakdown: multiStoreBreakdown.filter((store) => store.productCount > 0),
    };

    const analysis: ShoppingListAnalysis = {
      products,
      singleStoreStrategy: {
        best: bestStore,
        all: storeTotals,
      },
      multiStoreStrategy,
      totalProducts: productCodes.length, // Total including duplicates
      successfullyFetched: products.length,
      failedProducts,
    };

    return NextResponse.json(analysis);
  } catch (error: any) {
    console.error('[Share Link] Error:', error);
    return NextResponse.json(
      { error: error.message || 'Er is een fout opgetreden bij het verwerken van de share link' },
      { status: 500 }
    );
  }
}

/**
 * Parse IKEA share link to extract product codes with quantities
 * Format: https://www.ikea.com/be/nl/favourites/receive-share/69505955:2,60275812:3?source=cart
 * Returns: ['69505955', '69505955', '60275812', '60275812', '60275812']
 */
function parseShareLink(shareLink: string): string[] {
  try {
    // Extract the part after 'receive-share/'
    const match = shareLink.match(/receive-share\/([^?]+)/);
    if (!match) {
      return [];
    }

    const productString = match[1];
    const products: string[] = [];

    // Split by comma to get individual product entries
    const entries = productString.split(',');

    for (const entry of entries) {
      // Each entry is in format: productCode:quantity
      const [code, quantityStr] = entry.split(':');
      const quantity = parseInt(quantityStr || '1', 10);

      // Clean the product code (remove any non-digits)
      const cleanCode = code.replace(/\D/g, '');

      // Add product code for each quantity
      for (let i = 0; i < quantity; i++) {
        products.push(cleanCode);
      }
    }

    return products;
  } catch (error) {
    console.error('Error parsing share link:', error);
    return [];
  }
}
