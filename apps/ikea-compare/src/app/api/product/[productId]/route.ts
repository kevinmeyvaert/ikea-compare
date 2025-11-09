import { NextRequest, NextResponse } from 'next/server';
import { scrapeIkeaProduct, isScraperError } from '../../../../lib/scrapers/ikea-scraper';
import { ProductComparisonResult, ProductData } from '../../../../lib/scrapers/types';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ productId: string }> }
) {
  const { productId } = await params;

  // Validate product ID (8 digits)
  if (!/^\d{8}$/.test(productId)) {
    return NextResponse.json(
      { error: 'Product ID must be exactly 8 digits' },
      { status: 400 }
    );
  }

  try {
    // Fetch from all three countries in parallel
    const [beResult, nlResult, frResult] = await Promise.allSettled([
      scrapeIkeaProduct('BE', productId),
      scrapeIkeaProduct('NL', productId),
      scrapeIkeaProduct('FR', productId),
    ]);

    // Process results
    const belgium = beResult.status === 'fulfilled' && !isScraperError(beResult.value)
      ? beResult.value
      : null;

    const netherlands = nlResult.status === 'fulfilled' && !isScraperError(nlResult.value)
      ? nlResult.value
      : null;

    const france = frResult.status === 'fulfilled' && !isScraperError(frResult.value)
      ? frResult.value
      : null;

    // Check if we got at least one successful result
    if (!belgium && !netherlands && !france) {
      return NextResponse.json(
        {
          error: 'Product not found in any country',
          productId,
        },
        { status: 404 }
      );
    }

    // Find cheapest country (or countries if there's a tie)
    const prices: Array<{ country: 'BE' | 'NL' | 'FR'; price: number }> = [];

    if (belgium) prices.push({ country: 'BE', price: belgium.price });
    if (netherlands) prices.push({ country: 'NL', price: netherlands.price });
    if (france) prices.push({ country: 'FR', price: france.price });

    let cheapest: ('BE' | 'NL' | 'FR')[] | null = null;

    if (prices.length > 0) {
      const minPrice = Math.min(...prices.map(p => p.price));
      cheapest = prices.filter(p => p.price === minPrice).map(p => p.country);
    }

    const result: ProductComparisonResult = {
      productId,
      products: {
        belgium,
        netherlands,
        france,
      },
      cheapest,
    };

    return NextResponse.json(result);
  } catch (error: any) {
    console.error('Error fetching product data:', error);
    return NextResponse.json(
      { error: 'Failed to fetch product data', message: error.message },
      { status: 500 }
    );
  }
}
