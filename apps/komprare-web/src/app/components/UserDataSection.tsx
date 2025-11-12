'use client';

import { useState } from 'react';
import HistoryList from './HistoryList';
import FavoritesList from './FavoritesList';

interface UserDataSectionProps {
  onProductClick: (productId: string) => void;
}

export default function UserDataSection({
  onProductClick,
}: UserDataSectionProps) {
  const [historyExpanded, setHistoryExpanded] = useState(false);
  const [favoritesExpanded, setFavoritesExpanded] = useState(false);

  return (
    <div className="space-y-4">
      {/* Recent History Section */}
      <div className="border-t border-gray-200 pt-4">
        <button
          onClick={() => setHistoryExpanded(!historyExpanded)}
          className="w-full flex items-center justify-between mb-3 text-left group"
        >
          <h3 className="text-sm font-semibold text-gray-900 group-hover:text-ikea-blue transition-colors">
            Recente zoekopdrachten
          </h3>
          <svg
            className={`w-4 h-4 text-gray-500 transition-transform ${
              historyExpanded ? 'rotate-180' : ''
            }`}
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth="2"
              d="M19 9l-7 7-7-7"
            />
          </svg>
        </button>
        {historyExpanded && (
          <div className="animate-fadeIn">
            <HistoryList onProductClick={onProductClick} maxItems={5} />
          </div>
        )}
      </div>

      {/* Favorites Section */}
      <div className="border-t border-gray-200 pt-4">
        <button
          onClick={() => setFavoritesExpanded(!favoritesExpanded)}
          className="w-full flex items-center justify-between mb-3 text-left group"
        >
          <h3 className="text-sm font-semibold text-gray-900 group-hover:text-ikea-blue transition-colors">
            Favorieten
          </h3>
          <svg
            className={`w-4 h-4 text-gray-500 transition-transform ${
              favoritesExpanded ? 'rotate-180' : ''
            }`}
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth="2"
              d="M19 9l-7 7-7-7"
            />
          </svg>
        </button>
        {favoritesExpanded && (
          <div className="animate-fadeIn">
            <FavoritesList onProductClick={onProductClick} />
          </div>
        )}
      </div>
    </div>
  );
}
