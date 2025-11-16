/**
 * Chrome Storage Service
 * Replaces Firebase for Chrome Extension to comply with Chrome Web Store policies
 * Uses chrome.storage.sync for preferences and chrome.storage.local for history
 */

import { type StorePreferences } from '@ikea-compare/types';

// Storage keys
const STORAGE_KEYS = {
  USER_ID: 'kompråre_user_id',
  STORE_PREFERENCES: 'kompråre_store_preferences',
  PRODUCT_HISTORY: 'kompråre_product_history',
} as const;

// Data types
export interface ProductHistoryItem {
  productId: string;
  name: string;
  imageUrl: string;
  searchedAt: string; // ISO timestamp
  cheapestCountry?: 'BE' | 'NL' | 'FR' | 'DE';
  cheapestPrice?: number;
}

// Default store codes for each country
const DEFAULT_STORES: StorePreferences = {
  be: '169', // IKEA Gent
  nl: '403', // IKEA Breda
  fr: '133', // IKEA Lille
  de: '494', // IKEA Kaarst
};

/**
 * Generate a unique user ID (replaces Firebase anonymous auth)
 */
function generateUserId(): string {
  return `user_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
}

/**
 * Get or create a unique user ID
 */
export async function getUserId(): Promise<string> {
  const result = await chrome.storage.local.get(STORAGE_KEYS.USER_ID);

  if (result[STORAGE_KEYS.USER_ID]) {
    return result[STORAGE_KEYS.USER_ID];
  }

  // Generate new user ID
  const userId = generateUserId();
  await chrome.storage.local.set({ [STORAGE_KEYS.USER_ID]: userId });
  return userId;
}

// ==================== STORE PREFERENCES ====================

/**
 * Get store preferences from Chrome sync storage
 * Syncs across user's Chrome instances
 */
export async function getStorePreferences(): Promise<StorePreferences> {
  const result = await chrome.storage.sync.get(STORAGE_KEYS.STORE_PREFERENCES);

  if (result[STORAGE_KEYS.STORE_PREFERENCES]) {
    return result[STORAGE_KEYS.STORE_PREFERENCES];
  }

  // Return defaults for new users
  return { ...DEFAULT_STORES };
}

/**
 * Save store preferences to Chrome sync storage
 */
export async function saveStorePreferences(preferences: StorePreferences): Promise<void> {
  await chrome.storage.sync.set({
    [STORAGE_KEYS.STORE_PREFERENCES]: preferences,
  });
}

/**
 * Get selected store for a specific country
 */
export async function getSelectedStoreCode(
  countryCode: 'BE' | 'NL' | 'FR' | 'DE'
): Promise<string> {
  const preferences = await getStorePreferences();
  const key = countryCode.toLowerCase() as keyof StorePreferences;
  return preferences[key] || DEFAULT_STORES[key] || '';
}

/**
 * Set selected store for a specific country
 */
export async function setSelectedStore(
  countryCode: 'BE' | 'NL' | 'FR' | 'DE',
  buCode: string
): Promise<void> {
  const preferences = await getStorePreferences();
  const key = countryCode.toLowerCase() as keyof StorePreferences;
  preferences[key] = buCode;
  await saveStorePreferences(preferences);
}

// ==================== PRODUCT HISTORY ====================

const MAX_HISTORY_ITEMS = 50;

/**
 * Get product history from Chrome local storage
 * Limited to last 50 items
 */
export async function getProductHistory(): Promise<ProductHistoryItem[]> {
  const result = await chrome.storage.local.get(STORAGE_KEYS.PRODUCT_HISTORY);

  if (result[STORAGE_KEYS.PRODUCT_HISTORY]) {
    return result[STORAGE_KEYS.PRODUCT_HISTORY];
  }

  return [];
}

/**
 * Add product to history
 * If product was viewed in last 24h, updates timestamp instead of creating duplicate
 */
export async function addToHistory(item: ProductHistoryItem): Promise<void> {
  const history = await getProductHistory();

  // Check if product was viewed recently (last 24 hours)
  const oneDayAgo = Date.now() - 24 * 60 * 60 * 1000;
  const recentIndex = history.findIndex(
    (h) =>
      h.productId === item.productId &&
      new Date(h.searchedAt).getTime() > oneDayAgo
  );

  // Remove recent entry if found
  if (recentIndex !== -1) {
    history.splice(recentIndex, 1);
  }

  // Add new entry at the beginning
  const newItem: ProductHistoryItem = {
    ...item,
    searchedAt: new Date().toISOString(),
  };

  history.unshift(newItem);

  // Keep only last MAX_HISTORY_ITEMS
  const trimmedHistory = history.slice(0, MAX_HISTORY_ITEMS);

  await chrome.storage.local.set({
    [STORAGE_KEYS.PRODUCT_HISTORY]: trimmedHistory,
  });
}

/**
 * Clear all product history
 */
export async function clearHistory(): Promise<void> {
  await chrome.storage.local.remove(STORAGE_KEYS.PRODUCT_HISTORY);
}

/**
 * Get recent searches (limited count)
 */
export async function getRecentSearches(limit = 10): Promise<ProductHistoryItem[]> {
  const history = await getProductHistory();
  return history.slice(0, limit);
}
