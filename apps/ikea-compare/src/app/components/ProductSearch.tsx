'use client';

import { useState } from 'react';

interface ProductSearchProps {
  onSearch: (productId: string) => void;
  isLoading: boolean;
}

export default function ProductSearch({ onSearch, isLoading }: ProductSearchProps) {
  const [productId, setProductId] = useState('');
  const [error, setError] = useState('');

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

  return (
    <div className="w-full">
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label htmlFor="productId" className="block text-sm font-bold text-gray-900 mb-2">
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
            <svg className="absolute right-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
          </div>
          {error && (
            <p className="mt-2 text-sm text-red-600">{error}</p>
          )}
          <button
            type="submit"
            disabled={isLoading}
            className="w-full mt-3 px-6 py-3 bg-black text-white text-base font-bold hover:bg-gray-800 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors"
          >
            {isLoading ? 'Prijzen ophalen...' : 'Vergelijk Prijzen'}
          </button>
        </div>
        <p className="text-xs text-gray-600">
          Voer een IKEA-productcode van 8 cijfers in
        </p>
      </form>
    </div>
  );
}
