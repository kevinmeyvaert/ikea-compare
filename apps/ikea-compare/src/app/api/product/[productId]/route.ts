import { NextRequest, NextResponse } from 'next/server';
import { scrapeIkeaProduct, isScraperError } from '../../../../lib/scrapers/ikea-scraper';
import { ProductComparisonResult } from '../../../../lib/scrapers/types';

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
    // Fetch from all four countries in parallel
    const [beResult, nlResult, frResult, deResult] = await Promise.allSettled([
      scrapeIkeaProduct('BE', productId),
      scrapeIkeaProduct('NL', productId),
      scrapeIkeaProduct('FR', productId),
      scrapeIkeaProduct('DE', productId),
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

    const germany = deResult.status === 'fulfilled' && !isScraperError(deResult.value)
      ? deResult.value
      : null;

    // Check if we got at least one successful result
    if (!belgium && !netherlands && !france && !germany) {
      return NextResponse.json(
        {
          error: 'Product not found in any country',
          productId,
        },
        { status: 404 }
      );
    }

    // Find cheapest country (or countries if there's a tie)
    const prices: Array<{ country: 'BE' | 'NL' | 'FR' | 'DE'; price: number }> = [];

    if (belgium) prices.push({ country: 'BE', price: belgium.price });
    if (netherlands) prices.push({ country: 'NL', price: netherlands.price });
    if (france) prices.push({ country: 'FR', price: france.price });
    if (germany) prices.push({ country: 'DE', price: germany.price });

    let cheapest: ('BE' | 'NL' | 'FR' | 'DE')[] | null = null;

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
        germany,
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
