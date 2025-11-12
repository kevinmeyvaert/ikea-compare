import { NextRequest, NextResponse } from 'next/server';
import { StoreAvailability } from '@ikea-compare/types';
import { getStoresByCountry } from '@ikea-compare/firebase';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ productId: string }> }
) {
  const { productId } = await params;
  const { searchParams } = new URL(request.url);
  const country = searchParams.get('country'); // 'be', 'nl', or 'fr'
  const storeId = searchParams.get('storeId'); // buCode

  // Validate inputs
  if (!/^\d{8}$/.test(productId)) {
    return NextResponse.json(
      { error: 'Product ID must be exactly 8 digits' },
      { status: 400 }
    );
  }

  if (!country || !['be', 'nl', 'fr', 'de'].includes(country)) {
    return NextResponse.json(
      { error: 'Invalid country code. Must be: be, nl, fr, or de' },
      { status: 400 }
    );
  }

  if (!storeId) {
    return NextResponse.json(
      { error: 'Store ID (buCode) is required' },
      { status: 400 }
    );
  }

  try {
    const availability: StoreAvailability = await fetchStoreAvailability(
      productId,
      country.toUpperCase() as 'BE' | 'NL' | 'FR' | 'DE',
      storeId
    );

    return NextResponse.json(availability);
  } catch (error: any) {
    console.error('Error fetching store availability:', error);
    return NextResponse.json(
      { error: 'Failed to fetch store availability', message: error.message },
      { status: 500 }
    );
  }
}

/**
 * Fetch store availability by scraping IKEA product pages
 */
async function fetchStoreAvailability(
  productId: string,
  countryCode: 'BE' | 'NL' | 'FR' | 'DE',
  storeId: string
): Promise<StoreAvailability> {
  try {
    const axios = await import('axios');

    // Get store name
    const stores = getStoresByCountry(countryCode);
    const store = stores.find((s) => s.buCode === storeId);
    const storeName = store ? store.name : `Store ${storeId}`;

    console.log(
      `[Availability API] Fetching from IKEA API for store ${storeId} (${storeName}), product ${productId}`
    );

    // Map country codes to IKEA's internal country codes
    const countryMap = {
      BE: 'be',
      NL: 'nl',
      FR: 'fr',
      DE: 'de',
    };
    const ikeaCountry = countryMap[countryCode];

    // Call IKEA's availability API directly
    // Format: https://api.ingka.ikea.com/cia/availabilities/ru/{country}?itemNos={productId}
    // This returns all stores in the country, we filter for our specific store
    const apiUrl = `https://api.ingka.ikea.com/cia/availabilities/ru/${ikeaCountry}`;

    const response = await axios.default.get(apiUrl, {
      params: {
        itemNos: productId,
        expand: 'StoresList,Restocks',
      },
      headers: {
        Accept: 'application/json;version=1',
        'x-client-id': 'b6c117e5-ae61-4ef5-b4cc-e0b1e37f0631', // Public client ID from IKEA's website
        'User-Agent':
          'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36',
      },
    });

    console.log(
      `[Availability API] Got ${
        response.data.availabilities?.length || 0
      } store results`
    );

    // Parse the IKEA API response
    const data = response.data;

    // The response structure: { availabilities: [ { classUnitKey, buyingOption: { cashCarry: { availability: { quantity, probability } } } } ] }
    let quantity = 0;
    let available = false;
    let stockLevel:
      | 'HIGH_IN_STOCK'
      | 'MEDIUM_IN_STOCK'
      | 'LOW_IN_STOCK'
      | 'OUT_OF_STOCK'
      | 'UNKNOWN' = 'UNKNOWN';
    let restockDate: string | undefined;

    if (data?.availabilities && Array.isArray(data.availabilities)) {
      // Find availability for our specific store
      const storeAvailability = data.availabilities.find(
        (avail: any) => avail.classUnitKey?.classUnitCode === storeId
      );

      if (storeAvailability) {
        console.log(
          `[Availability API] Found store ${storeId}:`,
          JSON.stringify(storeAvailability, null, 2)
        );

        // Extract quantity from cashCarry availability
        const cashCarryAvailability =
          storeAvailability.buyingOption?.cashCarry?.availability;
        if (cashCarryAvailability) {
          quantity = parseInt(cashCarryAvailability.quantity) || 0;
          available = quantity > 0;

          // Get stock level from IKEA's probability message type
          const messageType =
            cashCarryAvailability.probability?.thisDay?.messageType;
          if (messageType) {
            stockLevel = messageType as any; // IKEA uses same values: HIGH_IN_STOCK, MEDIUM_IN_STOCK, LOW_IN_STOCK, OUT_OF_STOCK
          } else {
            // Fallback: determine stock level based on quantity
            if (quantity === 0) {
              stockLevel = 'OUT_OF_STOCK';
            } else if (quantity >= 10) {
              stockLevel = 'HIGH_IN_STOCK';
            } else if (quantity >= 5) {
              stockLevel = 'MEDIUM_IN_STOCK';
            } else {
              stockLevel = 'LOW_IN_STOCK';
            }
          }

          // Check for restock information
          const restocks = storeAvailability.buyingOption?.cashCarry?.restocks;
          if (restocks && Array.isArray(restocks) && restocks.length > 0) {
            const nextRestock = restocks[0];
            if (nextRestock.earliestDate) {
              restockDate = nextRestock.earliestDate;
            }
          }
        }
      } else {
        console.log(`[Availability API] Store ${storeId} not found in results`);
      }
    }

    const availability: StoreAvailability = {
      buCode: storeId,
      storeName,
      cashCarry: {
        quantity,
        available,
        stockLevel,
        restockDate,
        restockQuantity: undefined,
      },
      clickCollect: {
        quantity,
        available,
        stockLevel,
      },
      lastUpdated: new Date().toISOString(),
    };

    console.log(`[Availability API] Parsed availability:`, availability);

    return availability;
  } catch (error: any) {
    console.error(
      `[Availability API] Error:`,
      error.response?.data || error.message
    );
    throw new Error(`Failed to fetch availability: ${error.message}`);
  }
}
