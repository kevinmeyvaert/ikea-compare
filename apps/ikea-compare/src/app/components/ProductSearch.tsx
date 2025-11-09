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
          <input
            id="productId"
            type="text"
            value={productId}
            onChange={handleInputChange}
            placeholder="002.638.50"
            className="w-full px-4 py-3 text-lg border-2 border-gray-300 rounded focus:ring-2 focus:border-gray-900 focus:outline-none transition-colors"
            disabled={isLoading}
            maxLength={10}
          />
          {error && (
            <p className="mt-2 text-sm text-red-600">{error}</p>
          )}
          <button
            type="submit"
            disabled={isLoading}
            className="w-full mt-3 px-6 py-3 bg-ikea-blue text-white text-base font-bold rounded hover:opacity-90 disabled:bg-gray-400 disabled:cursor-not-allowed transition-all"
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
