'use client';

import { useState, lazy, Suspense } from 'react';

// Lazy load the BarcodeScanner to avoid loading camera libraries unnecessarily
const BarcodeScanner = lazy(() => import('./BarcodeScanner'));

interface ProductSearchProps {
  onSearch: (productId: string) => void;
  isLoading: boolean;
}

export default function ProductSearch({
  onSearch,
  isLoading,
}: ProductSearchProps) {
  const [productId, setProductId] = useState('');
  const [error, setError] = useState('');
  const [showScanner, setShowScanner] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    // Validate product ID
    const cleanedId = productId.replace(/[\s.-]/g, ''); // Remove spaces, dots, dashes

    if (!cleanedId) {
      setError('Voer een productcode in');
      return;
    }

    if (!/^\d{8}$/.test(cleanedId)) {
      setError('Productcode moet exact 8 cijfers bevatten');
      return;
    }

    onSearch(cleanedId);
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setProductId(value);
    setError('');
  };

  const handleBarcodeScan = (scannedProductId: string) => {
    setShowScanner(false);
    setProductId(scannedProductId);
    onSearch(scannedProductId);
  };

  const handleOpenScanner = () => {
    setError('');
    setShowScanner(true);
  };

  const handleCloseScanner = () => {
    setShowScanner(false);
  };

  return (
    <div className="w-full">
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label
            htmlFor="productId"
            className="block text-sm font-bold text-gray-900 mb-2"
          >
            Productcode
          </label>
          <div className="relative">
            <input
              id="productId"
              type="text"
              value={productId}
              onChange={handleInputChange}
              placeholder="002.638.50"
              className="w-full px-4 py-3 text-lg border-2 border-gray-900 focus:outline-none focus:border-ikea-blue transition-colors"
              disabled={isLoading}
              maxLength={10}
            />
            <svg
              className="absolute right-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth="2"
                d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
              />
            </svg>
          </div>
          {error && <p className="mt-2 text-sm text-red-600">{error}</p>}
          <div className="flex gap-2 mt-3">
            <button
              type="submit"
              disabled={isLoading}
              className="flex-1 px-6 py-3 bg-black text-white text-base font-bold hover:bg-gray-800 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors"
            >
              {isLoading ? 'Prijzen ophalen...' : 'Vergelijk prijzen'}
            </button>
            <button
              type="button"
              onClick={handleOpenScanner}
              disabled={isLoading}
              className="px-4 py-3 bg-ikea-blue text-white font-bold hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors flex items-center justify-center"
              title="Scan barcode"
              aria-label="Scan barcode"
            >
              <svg
                className="w-6 h-6"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth="2"
                  d="M12 4v1m6 11h2m-6 0h-2v4m0-11v3m0 0h.01M12 12h4.01M16 20h4M4 12h4m12 0h.01M5 8h2a1 1 0 001-1V5a1 1 0 00-1-1H5a1 1 0 00-1 1v2a1 1 0 001 1zm12 0h2a1 1 0 001-1V5a1 1 0 00-1-1h-2a1 1 0 00-1 1v2a1 1 0 001 1zM5 20h2a1 1 0 001-1v-2a1 1 0 00-1-1H5a1 1 0 00-1 1v2a1 1 0 001 1z"
                />
              </svg>
            </button>
          </div>
        </div>
        <p className="text-xs text-gray-600">
          Voer een IKEA-productcode van 8 cijfers in of scan de barcode
        </p>
      </form>

      {/* Barcode Scanner Modal */}
      {showScanner && (
        <Suspense
          fallback={
            <div className="fixed inset-0 z-50 bg-black bg-opacity-90 flex items-center justify-center">
              <div className="text-white text-center">
                <div className="animate-spin w-8 h-8 border-2 border-white border-t-transparent rounded-full mx-auto mb-2"></div>
                <p>Scanner laden...</p>
              </div>
            </div>
          }
        >
          <BarcodeScanner
            onScan={handleBarcodeScan}
            onClose={handleCloseScanner}
            isLoading={isLoading}
          />
        </Suspense>
      )}
    </div>
  );
}
