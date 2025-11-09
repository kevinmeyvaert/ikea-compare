'use client';

import { ProductComparisonResult, ProductData } from '../../lib/scrapers/types';
import Image from 'next/image';

interface ComparisonTableProps {
  result: ProductComparisonResult;
}

interface CountryCardProps {
  country: string;
  countryCode: 'BE' | 'NL' | 'FR';
  product: ProductData | null;
  isCheapest: boolean;
}

function CountryCard({ country, countryCode, product, isCheapest }: CountryCardProps) {
  const countryFlags = {
    BE: '🇧🇪',
    NL: '🇳🇱',
    FR: '🇫🇷',
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
        isCheapest
          ? 'border-black'
          : 'border-gray-300'
      }`}
    >
      <div className="text-center mb-4">
        <div className="text-4xl mb-2">{countryFlags[countryCode]}</div>
        <h3 className="text-xl font-bold">{displayName}</h3>
        {isCheapest && (
          <div className="mt-2 inline-block bg-ikea-yellow text-gray-900 px-4 py-1 border-2 border-black text-sm font-bold">
            ✓ Beste Prijs
          </div>
        )}
      </div>

      <div className="space-y-4">
        <div className="text-center">
          <div className="text-3xl font-bold text-gray-900">
            {product.currency} {Number(product.price).toFixed(2)}
          </div>

          {/* Store availability information */}
          {product.storeAvailability ? (
            <div className="mt-3 space-y-2">
              {/* Stock quantity with level */}
              <div className={`text-sm font-medium ${
                product.storeAvailability.cashCarry.stockLevel === 'HIGH_IN_STOCK' ? 'text-green-600' :
                product.storeAvailability.cashCarry.stockLevel === 'MEDIUM_IN_STOCK' ? 'text-yellow-600' :
                product.storeAvailability.cashCarry.stockLevel === 'LOW_IN_STOCK' ? 'text-orange-600' :
                'text-red-600'
              }`}>
                {product.storeAvailability.cashCarry.quantity > 0 ? (
                  <>
                    {product.storeAvailability.cashCarry.quantity} op voorraad
                    <div className="text-xs mt-1">
                      ({product.storeAvailability.cashCarry.stockLevel.replace(/_/g, ' ').replace('IN STOCK', '').trim()})
                    </div>
                  </>
                ) : (
                  <span className="text-red-600">Niet op voorraad</span>
                )}
              </div>

              {/* Restock information */}
              {product.storeAvailability.cashCarry.restockDate && (
                <div className="text-xs text-gray-600 bg-blue-50 p-2 border border-gray-300">
                  📦 Nieuwe voorraad verwacht: {new Date(product.storeAvailability.cashCarry.restockDate).toLocaleDateString('nl-BE')}
                  {product.storeAvailability.cashCarry.restockQuantity && (
                    <span> ({product.storeAvailability.cashCarry.restockQuantity} stuks)</span>
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

export default function ComparisonTable({ result }: ComparisonTableProps) {
  const { products, cheapest } = result;

  // Get product name and image from any available product
  const anyProduct = products.belgium || products.netherlands || products.france;

  if (!anyProduct) {
    return (
      <div className="text-center py-12">
        <p className="text-xl text-gray-600">Geen productgegevens beschikbaar</p>
      </div>
    );
  }

  return (
    <div className="w-full max-w-6xl mx-auto space-y-8">
      {/* Product Header */}
      <div className="bg-white border-2 border-gray-300 p-6">
        <div className="flex flex-col md:flex-row gap-6 items-center">
          {anyProduct.imageUrl && (
            <div className="flex-shrink-0">
              <div className="w-48 h-48 relative">
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
            <h2 className="text-3xl font-bold text-gray-900 mb-2">
              {anyProduct.name}
            </h2>
            <p className="text-gray-600">
              Productcode: <span className="font-mono font-semibold">{result.productId}</span>
            </p>
          </div>
        </div>
      </div>

      {/* Price Comparison Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
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
      </div>

      {/* Price Difference Summary */}
      {cheapest && cheapest.length > 0 && (
        <div className="p-4 border-2 bg-ikea-yellow-light border-black">
          <p className="text-center text-sm text-gray-900">
            <strong>Beste prijs:</strong>{' '}
            {cheapest.map((code, idx) => {
              const countryMap = { BE: 'België', NL: 'Nederland', FR: 'Frankrijk' };
              const product = code === 'BE' ? products.belgium : code === 'NL' ? products.netherlands : products.france;
              const storeName = product?.storeAvailability?.storeName || countryMap[code];
              return (
                <span key={code}>
                  {idx > 0 && (idx === cheapest.length - 1 ? ' en ' : ', ')}
                  {storeName}
                </span>
              );
            })}.
            {(() => {
              const prices = [
                products.belgium?.price,
                products.netherlands?.price,
                products.france?.price,
              ].filter((p): p is number => p !== null && p !== undefined);

              if (prices.length > 1) {
                const min = Math.min(...prices);
                const max = Math.max(...prices);
                const savings = max - min;
                return savings > 0 ? ` Je kan €${savings.toFixed(2)} besparen door de goedkoopste optie te kiezen.` : '';
              }
              return '';
            })()}
          </p>
        </div>
      )}
    </div>
  );
}
