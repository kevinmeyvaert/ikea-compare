'use client';

import { memo } from 'react';
import { ProductComparisonResult, ProductData } from '@ikea-compare/types';
import Image from 'next/image';
import FavoriteButton from './FavoriteButton';

interface ComparisonTableProps {
  result: ProductComparisonResult;
}

interface CountryCardProps {
  country: string;
  countryCode: 'BE' | 'NL' | 'FR' | 'DE';
  product: ProductData | null;
  isCheapest: boolean;
}

function CountryCard({
  country,
  countryCode,
  product,
  isCheapest,
}: CountryCardProps) {
  const countryFlags = {
    BE: '🇧🇪',
    NL: '🇳🇱',
    FR: '🇫🇷',
    DE: '🇩🇪',
  };

  if (!product) {
    return (
      <div className="bg-white p-6 border-2 border-gray-300">
        <div className="text-center">
          <div className="text-4xl mb-2">{countryFlags[countryCode]}</div>
          <h3 className="text-xl font-semibold mb-2">{country}</h3>
          <p className="text-gray-500">Product niet beschikbaar</p>
        </div>
      </div>
    );
  }

  // Determine the display name (store name if available, otherwise country name)
  const displayName = product.storeAvailability?.storeName || country;

  return (
    <div
      className={`bg-white p-6 border-2 transition-all ${
        isCheapest ? 'border-black' : 'border-gray-300'
      }`}
    >
      <div className="text-center mb-4">
        <div className="text-4xl mb-2">{countryFlags[countryCode]}</div>
        <h3 className="text-lg font-semibold">{displayName}</h3>
        {isCheapest && (
          <div className="mt-2 inline-block bg-ikea-pink text-white px-3 py-1 text-xs font-bold uppercase tracking-wide">
            Beste prijs
          </div>
        )}
      </div>

      <div className="space-y-4">
        <div className="text-center">
          <div className="text-2xl font-semibold text-gray-900">
            {product.currency} {Number(product.price).toFixed(2)}
          </div>

          {/* Store availability information */}
          {product.storeAvailability ? (
            <div className="mt-3 space-y-2">
              {/* Stock quantity with level */}
              <div
                className={`text-sm font-medium ${
                  product.storeAvailability.cashCarry.stockLevel ===
                  'HIGH_IN_STOCK'
                    ? 'text-green-600'
                    : product.storeAvailability.cashCarry.stockLevel ===
                      'MEDIUM_IN_STOCK'
                    ? 'text-yellow-600'
                    : product.storeAvailability.cashCarry.stockLevel ===
                      'LOW_IN_STOCK'
                    ? 'text-orange-600'
                    : 'text-red-600'
                }`}
              >
                {product.storeAvailability.cashCarry.quantity > 0 ? (
                  <>
                    {product.storeAvailability.cashCarry.quantity} op voorraad
                    <div className="text-xs mt-1">
                      (
                      {product.storeAvailability.cashCarry.stockLevel
                        .replace(/_/g, ' ')
                        .replace('IN STOCK', '')
                        .trim()}
                      )
                    </div>
                  </>
                ) : (
                  <span className="text-red-600">Niet op voorraad</span>
                )}
              </div>

              {/* Restock information */}
              {product.storeAvailability.cashCarry.restockDate && (
                <div className="text-xs text-gray-600 bg-blue-50 p-2 border border-gray-300">
                  📦 Nieuwe voorraad verwacht:{' '}
                  {new Date(
                    product.storeAvailability.cashCarry.restockDate
                  ).toLocaleDateString('nl-BE')}
                  {product.storeAvailability.cashCarry.restockQuantity && (
                    <span>
                      {' '}
                      ({
                        product.storeAvailability.cashCarry.restockQuantity
                      }{' '}
                      stuks)
                    </span>
                  )}
                </div>
              )}
            </div>
          ) : (
            <div className="mt-3">
              {product.available ? (
                <div className="text-sm text-gray-500">
                  ℹ️ Selecteer winkel om beschikbaarheid te zien
                </div>
              ) : (
                <div className="text-sm text-red-600">Niet beschikbaar</div>
              )}
            </div>
          )}
        </div>

        <a
          href={product.url}
          target="_blank"
          rel="noopener noreferrer"
          className="block text-center text-sm font-medium text-ikea-blue hover:underline transition-colors"
        >
          Bekijk op IKEA {countryCode} →
        </a>
      </div>
    </div>
  );
}

const ComparisonTable = memo(function ComparisonTable({
  result,
}: ComparisonTableProps) {
  const { products, cheapest } = result;

  // Get product name and image from any available product
  const anyProduct =
    products.belgium ||
    products.netherlands ||
    products.france ||
    products.germany;

  if (!anyProduct) {
    return (
      <div className="text-center py-12">
        <p className="text-xl text-gray-600">
          Geen productgegevens beschikbaar
        </p>
      </div>
    );
  }

  // Calculate price overview
  const prices = [
    {
      country: 'BE',
      price: products.belgium?.price,
      name: products.belgium?.storeAvailability?.storeName || 'België',
    },
    {
      country: 'NL',
      price: products.netherlands?.price,
      name: products.netherlands?.storeAvailability?.storeName || 'Nederland',
    },
    {
      country: 'FR',
      price: products.france?.price,
      name: products.france?.storeAvailability?.storeName || 'Frankrijk',
    },
    {
      country: 'DE',
      price: products.germany?.price,
      name: products.germany?.storeAvailability?.storeName || 'Duitsland',
    },
  ].filter((p) => p.price !== undefined) as Array<{
    country: string;
    price: number;
    name: string;
  }>;

  const minPrice =
    prices.length > 0 ? Math.min(...prices.map((p) => p.price)) : 0;
  const maxPrice =
    prices.length > 0 ? Math.max(...prices.map((p) => p.price)) : 0;
  const savings = maxPrice - minPrice;
  const cheapestStores = prices.filter((p) => p.price === minPrice);

  return (
    <div className="w-full max-w-6xl mx-auto space-y-6">
      {/* Product Header and Overview */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Product Information */}
        <div className="bg-white border-2 border-gray-300 p-6">
          <div className="flex flex-col md:flex-row gap-6 items-center">
            {anyProduct.imageUrl && (
              <div className="flex-shrink-0">
                <div className="w-32 h-32 relative">
                  <Image
                    src={anyProduct.imageUrl}
                    alt={anyProduct.name}
                    fill
                    className="object-contain"
                    unoptimized
                  />
                </div>
              </div>
            )}
            <div className="flex-1 text-center md:text-left">
              <h2 className="text-xl font-semibold text-gray-900 mb-2">
                {anyProduct.name}
              </h2>
              <p className="text-sm text-gray-600 mb-3">
                Productcode:{' '}
                <span className="font-mono font-medium">
                  {result.productId}
                </span>
              </p>
              <FavoriteButton
                productData={{
                  productId: result.productId,
                  name: anyProduct.name,
                  imageUrl: anyProduct.imageUrl || '',
                  cheapestCountry: cheapest?.[0] as
                    | 'BE'
                    | 'NL'
                    | 'FR'
                    | 'DE'
                    | undefined,
                  cheapestPrice: minPrice,
                }}
              />
            </div>
          </div>
        </div>

        {/* Price Overview */}
        <div className="bg-ikea-blue border-2 border-black p-6 text-white">
          <h3 className="text-base font-semibold mb-4">Prijsoverzicht</h3>
          <div className="grid grid-cols-2 gap-6">
            <div>
              <div className="text-xs opacity-90 mb-1">Beste prijs</div>
              <div className="text-2xl font-semibold">
                €{minPrice.toFixed(2)}
              </div>
              <div className="text-sm mt-1 opacity-90">
                {cheapestStores.map((store, idx) => (
                  <span key={store.country}>
                    {idx > 0 &&
                      (idx === cheapestStores.length - 1 ? ' en ' : ', ')}
                    {store.name}
                  </span>
                ))}
              </div>
            </div>
            <div>
              <div className="text-xs opacity-90 mb-1">Je kunt besparen</div>
              <div className="text-2xl font-semibold text-ikea-pink-light">
                €{savings.toFixed(2)}
              </div>
              <div className="text-sm mt-1 opacity-90">
                {maxPrice > 0
                  ? `${((savings / maxPrice) * 100).toFixed(1)}% korting`
                  : '0% korting'}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Price Comparison Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <CountryCard
          country="België"
          countryCode="BE"
          product={products.belgium}
          isCheapest={cheapest?.includes('BE') ?? false}
        />
        <CountryCard
          country="Nederland"
          countryCode="NL"
          product={products.netherlands}
          isCheapest={cheapest?.includes('NL') ?? false}
        />
        <CountryCard
          country="Frankrijk"
          countryCode="FR"
          product={products.france}
          isCheapest={cheapest?.includes('FR') ?? false}
        />
        <CountryCard
          country="Duitsland"
          countryCode="DE"
          product={products.germany}
          isCheapest={cheapest?.includes('DE') ?? false}
        />
      </div>
    </div>
  );
});

export default ComparisonTable;
