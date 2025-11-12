'use client';

import { useState, useEffect } from 'react';
import Image from 'next/image';
import { getFavorites, removeFavorite } from '@ikea-compare/firebase';
import { FavoriteProduct } from '@ikea-compare/firebase';
import { useAuth } from '@ikea-compare/firebase';

interface FavoritesListProps {
  onProductClick: (productId: string) => void;
  onFavoriteRemoved?: () => void;
}

export default function FavoritesList({
  onProductClick,
  onFavoriteRemoved,
}: FavoritesListProps) {
  const [favorites, setFavorites] = useState<FavoriteProduct[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const isAuthenticated = useAuth();

  useEffect(() => {
    console.log(
      '[FavoritesList] Auth state changed, isAuthenticated:',
      isAuthenticated
    );
    if (isAuthenticated) {
      loadFavorites();
    }
  }, [isAuthenticated]);

  const loadFavorites = async () => {
    try {
      console.log('[FavoritesList] Starting to load favorites');
      setIsLoading(true);
      const items = await getFavorites();
      console.log('[FavoritesList] Loaded items:', items.length, items);
      setFavorites(items);
    } catch (error) {
      console.error('[FavoritesList] Error loading favorites:', error);
    } finally {
      setIsLoading(false);
      console.log('[FavoritesList] Loading complete');
    }
  };

  const handleRemoveFavorite = async (
    productId: string,
    event: React.MouseEvent
  ) => {
    event.stopPropagation(); // Prevent triggering product click

    try {
      await removeFavorite(productId);
      setFavorites((prev) => prev.filter((fav) => fav.productId !== productId));
      onFavoriteRemoved?.();
    } catch (error) {
      console.error('Error removing favorite:', error);
    }
  };

  if (isLoading) {
    return (
      <div className="text-center py-4">
        <div className="text-sm text-gray-500">Favorieten laden...</div>
      </div>
    );
  }

  if (favorites.length === 0) {
    return (
      <div className="text-center py-4">
        <div className="text-sm text-gray-500">Geen favorieten</div>
        <p className="text-xs text-gray-400 mt-1">
          Klik op het hartje om producten toe te voegen
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-2">
      {favorites.map((favorite) => (
        <div
          key={favorite.id}
          className="relative flex items-center gap-3 p-2 hover:bg-gray-50 border border-gray-200 transition-colors"
        >
          <button
            onClick={() => onProductClick(favorite.productId)}
            className="flex items-center gap-3 flex-1 min-w-0 text-left"
          >
            <div className="relative w-12 h-12 flex-shrink-0 bg-gray-100">
              <Image
                src={favorite.imageUrl}
                alt={favorite.name}
                fill
                className="object-contain"
                sizes="48px"
              />
            </div>
            <div className="flex-1 min-w-0">
              <div className="text-sm font-medium text-gray-900 truncate">
                {favorite.name}
              </div>
              <div className="text-xs text-gray-500 truncate">
                {favorite.productId}
              </div>
            </div>
          </button>
          <button
            onClick={(e) => handleRemoveFavorite(favorite.productId, e)}
            className="flex-shrink-0 p-1 text-gray-400 hover:text-red-600 hover:bg-red-50 transition-colors"
            title="Verwijder uit favorieten"
          >
            <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
              <path
                fillRule="evenodd"
                d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z"
                clipRule="evenodd"
              />
            </svg>
          </button>
        </div>
      ))}
    </div>
  );
}
