'use client';

import { useState, useEffect, useCallback } from 'react';
import {
  addFavorite,
  removeFavorite,
  isFavorite,
} from '@ikea-compare/firebase';
import { FavoriteProductData } from '@ikea-compare/firebase';

interface FavoriteButtonProps {
  productData: FavoriteProductData;
  className?: string;
}

export default function FavoriteButton({
  productData,
  className = '',
}: FavoriteButtonProps) {
  const [isFavorited, setIsFavorited] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  const checkFavoriteStatus = useCallback(async () => {
    try {
      const favorited = await isFavorite(productData.productId);
      setIsFavorited(favorited);
    } catch (error) {
      console.error('Error checking favorite status:', error);
    } finally {
      setIsLoading(false);
    }
  }, [productData.productId]);

  // Check if product is favorited on mount
  useEffect(() => {
    checkFavoriteStatus();
  }, [checkFavoriteStatus]);

  const handleToggleFavorite = async () => {
    try {
      setIsLoading(true);
      if (isFavorited) {
        await removeFavorite(productData.productId);
        setIsFavorited(false);
      } else {
        await addFavorite(productData);
        setIsFavorited(true);
      }
    } catch (error) {
      console.error('Error toggling favorite:', error);
      // Revert optimistic update on error
      setIsFavorited(!isFavorited);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <button
      onClick={handleToggleFavorite}
      disabled={isLoading}
      className={`flex items-center gap-2 px-3 py-1.5 text-sm font-medium border-2 transition-colors ${
        isFavorited
          ? 'bg-ikea-pink text-white border-ikea-pink hover:bg-ikea-pink/90'
          : 'bg-white text-gray-900 border-gray-300 hover:border-ikea-pink hover:text-ikea-pink'
      } ${isLoading ? 'opacity-50 cursor-not-allowed' : ''} ${className}`}
      title={
        isFavorited ? 'Verwijder uit favorieten' : 'Voeg toe aan favorieten'
      }
    >
      <svg
        className="w-4 h-4"
        fill={isFavorited ? 'currentColor' : 'none'}
        stroke="currentColor"
        viewBox="0 0 24 24"
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth="2"
          d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z"
        />
      </svg>
      <span>{isFavorited ? 'In favorieten' : 'Favoriet'}</span>
    </button>
  );
}
