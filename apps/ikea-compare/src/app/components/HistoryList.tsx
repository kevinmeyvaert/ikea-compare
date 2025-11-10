'use client';

import { useState, useEffect } from 'react';
import Image from 'next/image';
import { getHistory, clearHistory } from '../../lib/user-data/user-data-manager';
import { HistoryEntry } from '../../lib/user-data/types';
import { useAuth } from '../../lib/user-data/useAuth';

interface HistoryListProps {
  onProductClick: (productId: string) => void;
  maxItems?: number;
}

export default function HistoryList({ onProductClick, maxItems = 10 }: HistoryListProps) {
  const [history, setHistory] = useState<HistoryEntry[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const isAuthenticated = useAuth();

  useEffect(() => {
    console.log('[HistoryList] Auth state or maxItems changed, isAuthenticated:', isAuthenticated);
    if (isAuthenticated) {
      loadHistory();
    }
  }, [maxItems, isAuthenticated]);

  const loadHistory = async () => {
    try {
      console.log('[HistoryList] Starting to load history, maxItems:', maxItems);
      setIsLoading(true);
      const entries = await getHistory(maxItems);
      console.log('[HistoryList] Loaded entries:', entries.length, entries);
      setHistory(entries);
    } catch (error) {
      console.error('[HistoryList] Error loading history:', error);
    } finally {
      setIsLoading(false);
      console.log('[HistoryList] Loading complete');
    }
  };

  const handleClearHistory = async () => {
    if (!confirm('Weet je zeker dat je de hele geschiedenis wilt wissen?')) {
      return;
    }

    try {
      await clearHistory();
      setHistory([]);
    } catch (error) {
      console.error('Error clearing history:', error);
    }
  };

  const formatTimeAgo = (timestamp: any): string => {
    const date = timestamp.toDate();
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMins / 60);
    const diffDays = Math.floor(diffHours / 24);

    if (diffMins < 1) return 'Zojuist';
    if (diffMins < 60) return `${diffMins} min geleden`;
    if (diffHours < 24) return `${diffHours} uur geleden`;
    if (diffDays === 1) return 'Gisteren';
    return `${diffDays} dagen geleden`;
  };

  if (isLoading) {
    return (
      <div className="text-center py-4">
        <div className="text-sm text-gray-500">Geschiedenis laden...</div>
      </div>
    );
  }

  if (history.length === 0) {
    return (
      <div className="text-center py-4">
        <div className="text-sm text-gray-500">Geen geschiedenis</div>
        <p className="text-xs text-gray-400 mt-1">
          Je zoekopdrachten verschijnen hier
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-2">
      {history.map((entry) => (
        <button
          key={entry.id}
          onClick={() => onProductClick(entry.productId)}
          className="w-full flex items-center gap-3 p-2 hover:bg-gray-50 border border-gray-200 transition-colors text-left"
        >
          <div className="relative w-12 h-12 flex-shrink-0 bg-gray-100">
            <Image
              src={entry.imageUrl}
              alt={entry.name}
              fill
              className="object-contain"
              sizes="48px"
            />
          </div>
          <div className="flex-1 min-w-0">
            <div className="text-sm font-medium text-gray-900 truncate">
              {entry.name}
            </div>
            <div className="text-xs text-gray-500 truncate">
              {entry.productId}
            </div>
            <div className="flex items-center gap-2 mt-0.5">
              <span className="text-xs text-gray-400">
                {formatTimeAgo(entry.searchedAt)}
              </span>
              {entry.cheapestCountry && entry.cheapestPrice && (
                <>
                  <span className="text-xs text-gray-300">•</span>
                  <span className="text-xs text-green-600 font-medium">
                    {entry.cheapestCountry}: €{entry.cheapestPrice.toFixed(2)}
                  </span>
                </>
              )}
            </div>
          </div>
        </button>
      ))}

      {history.length > 0 && (
        <button
          onClick={handleClearHistory}
          className="w-full mt-2 px-3 py-1.5 text-xs text-gray-600 hover:text-red-600 hover:bg-red-50 border border-gray-200 transition-colors"
        >
          Wis geschiedenis
        </button>
      )}
    </div>
  );
}
