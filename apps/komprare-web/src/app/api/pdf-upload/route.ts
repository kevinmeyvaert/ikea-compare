import { NextRequest, NextResponse } from 'next/server';
import { extractText } from 'unpdf';
import {
  ShoppingListAnalysis,
  ShoppingListProduct,
  StoreTotal,
  MultiStoreStrategy,
  ProductComparisonResult,
} from '@ikea-compare/types';

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const file = formData.get('pdf') as File;

    if (!file) {
      return NextResponse.json(
        { error: 'No PDF file provided' },
        { status: 400 }
      );
    }

    // Convert file to Uint8Array for unpdf
    const arrayBuffer = await file.arrayBuffer();
    const uint8Array = new Uint8Array(arrayBuffer);

    // Extract text from PDF using unpdf
    const result = await extractText(uint8Array);
    // unpdf returns an object with text property that could be string or array
    const text =
      typeof result.text === 'string' ? result.text : result.text.join('\n');

    console.log(
      '[PDF Upload] Extracted text preview (first 1500 chars):',
      text.substring(0, 1500)
    );

    // IKEA PDFs have a consistent structure: product code, then "Nx € price"
    // Handle both integer quantities (2x) and decimal quantities (1.36x for square meters)
    // We'll round decimals to nearest integer
    const quantityPattern = /(\d+(?:\.\d+)?)x\s*€/gi;
    const productCodePattern = /\d{3}\.\d{3}\.\d{2}/g;

    // Extract all quantities with their positions
    const quantities: { quantity: number; index: number }[] = [];
    let quantityMatch;
    while ((quantityMatch = quantityPattern.exec(text)) !== null) {
      quantities.push({
        quantity: Math.round(parseFloat(quantityMatch[1])),
        index: quantityMatch.index,
      });
    }

    // Extract all product codes with their positions
    const productCodes: { code: string; index: number }[] = [];
    let codeMatch;
    while ((codeMatch = productCodePattern.exec(text)) !== null) {
      productCodes.push({
        code: codeMatch[0].replace(/\./g, ''),
        index: codeMatch.index,
      });
    }

    console.log(
      `[PDF Upload] Found ${quantities.length} quantity markers and ${productCodes.length} product codes`
    );

    // Match product codes with quantity markers that appear AFTER them
    // The PDF structure is: product name, price, product code, then "Nx € price"
    // Note: Same product code can appear multiple times in different sections
    const productIds: string[] = [];
    const usedQuantityIndices = new Set<number>();

    for (const productCode of productCodes) {
      // Find the nearest quantity marker that appears AFTER this product code
      // within a reasonable distance (500 chars)
      let quantity = 1; // default quantity
      let closestQuantityIdx = -1;

      for (let i = 0; i < quantities.length; i++) {
        if (
          quantities[i].index > productCode.index &&
          quantities[i].index - productCode.index < 500 &&
          !usedQuantityIndices.has(i)
        ) {
          quantity = quantities[i].quantity;
          closestQuantityIdx = i;
          break;
        }
      }

      // Mark this quantity marker as used
      if (closestQuantityIdx >= 0) {
        usedQuantityIndices.add(closestQuantityIdx);
      }

      console.log(
        `[PDF Upload] Product ${productCode.code} -> quantity: ${quantity}`
      );

      // Add the product code 'quantity' times to the array
      for (let i = 0; i < quantity; i++) {
        productIds.push(productCode.code);
      }
    }

    const uniqueProductIds = [...new Set(productIds)];

    if (uniqueProductIds.length === 0) {
      return NextResponse.json(
        { error: 'No product codes found in PDF' },
        { status: 400 }
      );
    }

    console.log(
      `[PDF Upload] Found ${productIds.length} total products (${uniqueProductIds.length} unique):`,
      productIds
    );

    // Fetch prices for unique products first, then duplicate for quantities
    const uniqueProducts: Map<string, ShoppingListProduct> = new Map();
    const failedProducts: string[] = [];

    for (const productId of uniqueProductIds) {
      try {
        // Fetch product data from our existing API
        const response = await fetch(
          `${request.nextUrl.origin}/api/product/${productId}`
        );

        if (!response.ok) {
          failedProducts.push(productId);
          continue;
        }

        const productData: ProductComparisonResult = await response.json();

        const cheapestCountry = productData.cheapest?.[0] || null;
        uniqueProducts.set(productId, {
          productId,
          products: productData.products,
          cheapest: cheapestCountry,
          cheapestPrice: cheapestCountry
            ? productData.products[
                cheapestCountry === 'BE'
                  ? 'belgium'
                  : cheapestCountry === 'NL'
                  ? 'netherlands'
                  : cheapestCountry === 'FR'
                  ? 'france'
                  : 'germany'
              ]?.price || null
            : null,
        });
      } catch (error) {
        console.error(`Failed to fetch product ${productId}:`, error);
        failedProducts.push(productId);
      }
    }

    // Now create the products array with duplicates based on quantities
    const products: ShoppingListProduct[] = [];
    for (const productId of productIds) {
      const product = uniqueProducts.get(productId);
      if (product) {
        products.push(product);
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
      {
        storeCode: 'DE',
        storeName: 'Germany',
        totalCost: 0,
        availableProducts: 0,
        unavailableProducts: 0,
      },
    ];

    products.forEach((product) => {
      ['belgium', 'netherlands', 'france', 'germany'].forEach(
        (country, idx) => {
          const countryKey = country as
            | 'belgium'
            | 'netherlands'
            | 'france'
            | 'germany';
          const price = product.products[countryKey]?.price;
          if (price) {
            storeTotals[idx].totalCost += price;
            storeTotals[idx].availableProducts += 1;
          } else {
            storeTotals[idx].unavailableProducts += 1;
          }
        }
      );
    });

    // Find best single store
    const bestStore = [...storeTotals]
      .filter((store) => store.availableProducts > 0)
      .sort((a, b) => a.totalCost - b.totalCost)[0];

    // Calculate multi-store strategy
    const multiStoreBreakdown: MultiStoreStrategy['breakdown'] = [
      {
        store: 'BE',
        storeName: 'Belgium',
        productCount: 0,
        subtotal: 0,
        products: [],
      },
      {
        store: 'NL',
        storeName: 'Netherlands',
        productCount: 0,
        subtotal: 0,
        products: [],
      },
      {
        store: 'FR',
        storeName: 'France',
        productCount: 0,
        subtotal: 0,
        products: [],
      },
      {
        store: 'DE',
        storeName: 'Germany',
        productCount: 0,
        subtotal: 0,
        products: [],
      },
    ];

    let multiStoreTotalCost = 0;

    products.forEach((product) => {
      if (product.cheapest && product.cheapestPrice) {
        const storeIdx =
          product.cheapest === 'BE'
            ? 0
            : product.cheapest === 'NL'
            ? 1
            : product.cheapest === 'FR'
            ? 2
            : 3;
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
      totalProducts: productIds.length,
      successfullyFetched: products.length,
      failedProducts,
    };

    return NextResponse.json(analysis);
  } catch (error: any) {
    console.error('[PDF Upload] Error:', error);
    return NextResponse.json(
      { error: 'Failed to process PDF', message: error.message },
      { status: 500 }
    );
  }
}
