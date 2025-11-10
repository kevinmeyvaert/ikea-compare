import { IkeaStore, StorePreferences } from './types';
import {
  doc,
  getDoc,
  setDoc,
  Timestamp,
} from 'firebase/firestore';
import { db } from '../firebase';
import { getCurrentUserId } from '../user-data/user-data-manager';

// Storage key for localStorage
const STORAGE_KEY = 'ikea-store-preferences';
const MIGRATION_KEY = 'ikea-store-preferences-migrated';

/**
 * Get list of IKEA stores for a specific country
 * Uses ikea-availability-checker package data
 */
export function getStoresByCountry(countryCode: 'BE' | 'NL' | 'FR'): IkeaStore[] {
  // Note: This is a simplified list. In production, we'd use ikea-availability-checker
  // For now, including commonly used stores

  const stores: Record<'BE' | 'NL' | 'FR', IkeaStore[]> = {
    BE: [
      { buCode: '169', name: 'IKEA Gent', city: 'Ghent', countryCode: 'BE', country: 'Belgium' },
      { buCode: '179', name: 'IKEA Wilrijk', city: 'Antwerp', countryCode: 'BE', country: 'Belgium' },
      { buCode: '375', name: 'IKEA Hognoul', city: 'Liège', countryCode: 'BE', country: 'Belgium' },
      { buCode: '376', name: 'IKEA Zaventem', city: 'Brussels', countryCode: 'BE', country: 'Belgium' },
      { buCode: '423', name: 'IKEA Store 423', city: 'Belgium', countryCode: 'BE', country: 'Belgium' },
      { buCode: '452', name: 'IKEA Store 452', city: 'Belgium', countryCode: 'BE', country: 'Belgium' },
      { buCode: '482', name: 'IKEA Anderlecht', city: 'Brussels', countryCode: 'BE', country: 'Belgium' },
      { buCode: '483', name: 'IKEA Store 483', city: 'Belgium', countryCode: 'BE', country: 'Belgium' },
    ],
    NL: [
      { buCode: '087', name: 'IKEA Store 087', city: 'Netherlands', countryCode: 'NL', country: 'Netherlands' },
      { buCode: '088', name: 'IKEA Store 088', city: 'Netherlands', countryCode: 'NL', country: 'Netherlands' },
      { buCode: '089', name: 'IKEA Store 089', city: 'Netherlands', countryCode: 'NL', country: 'Netherlands' },
      { buCode: '151', name: 'IKEA Store 151', city: 'Netherlands', countryCode: 'NL', country: 'Netherlands' },
      { buCode: '270', name: 'IKEA Heerlen', city: 'Heerlen', countryCode: 'NL', country: 'Netherlands' },
      { buCode: '272', name: 'IKEA Store 272', city: 'Netherlands', countryCode: 'NL', country: 'Netherlands' },
      { buCode: '274', name: 'IKEA Store 274', city: 'Netherlands', countryCode: 'NL', country: 'Netherlands' },
      { buCode: '312', name: 'IKEA Store 312', city: 'Netherlands', countryCode: 'NL', country: 'Netherlands' },
      { buCode: '378', name: 'IKEA Store 378', city: 'Netherlands', countryCode: 'NL', country: 'Netherlands' },
      { buCode: '391', name: 'IKEA Store 391', city: 'Netherlands', countryCode: 'NL', country: 'Netherlands' },
      { buCode: '403', name: 'IKEA Breda', city: 'Breda', countryCode: 'NL', country: 'Netherlands' },
      { buCode: '404', name: 'IKEA Store 404', city: 'Netherlands', countryCode: 'NL', country: 'Netherlands' },
      { buCode: '415', name: 'IKEA Store 415', city: 'Netherlands', countryCode: 'NL', country: 'Netherlands' },
      { buCode: '739', name: 'IKEA Store 739', city: 'Netherlands', countryCode: 'NL', country: 'Netherlands' },
      { buCode: '1009', name: 'IKEA Store 1009', city: 'Netherlands', countryCode: 'NL', country: 'Netherlands' },
    ],
    FR: [
      { buCode: '018', name: 'IKEA Store 018', city: 'France', countryCode: 'FR', country: 'France' },
      { buCode: '051', name: 'IKEA Store 051', city: 'France', countryCode: 'FR', country: 'France' },
      { buCode: '060', name: 'IKEA Store 060', city: 'France', countryCode: 'FR', country: 'France' },
      { buCode: '082', name: 'IKEA Store 082', city: 'France', countryCode: 'FR', country: 'France' },
      { buCode: '083', name: 'IKEA Store 083', city: 'France', countryCode: 'FR', country: 'France' },
      { buCode: '086', name: 'IKEA Store 086', city: 'France', countryCode: 'FR', country: 'France' },
      { buCode: '130', name: 'IKEA Store 130', city: 'France', countryCode: 'FR', country: 'France' },
      { buCode: '131', name: 'IKEA Store 131', city: 'France', countryCode: 'FR', country: 'France' },
      { buCode: '133', name: 'IKEA Lille', city: 'Lille', countryCode: 'FR', country: 'France' },
      { buCode: '134', name: 'IKEA Store 134', city: 'France', countryCode: 'FR', country: 'France' },
      { buCode: '163', name: 'IKEA Store 163', city: 'France', countryCode: 'FR', country: 'France' },
      { buCode: '177', name: 'IKEA Store 177', city: 'France', countryCode: 'FR', country: 'France' },
      { buCode: '198', name: 'IKEA Store 198', city: 'France', countryCode: 'FR', country: 'France' },
      { buCode: '199', name: 'IKEA Store 199', city: 'France', countryCode: 'FR', country: 'France' },
      { buCode: '239', name: 'IKEA Store 239', city: 'France', countryCode: 'FR', country: 'France' },
      { buCode: '240', name: 'IKEA Store 240', city: 'France', countryCode: 'FR', country: 'France' },
      { buCode: '242', name: 'IKEA Store 242', city: 'France', countryCode: 'FR', country: 'France' },
      { buCode: '260', name: 'IKEA Store 260', city: 'France', countryCode: 'FR', country: 'France' },
      { buCode: '285', name: 'IKEA Store 285', city: 'France', countryCode: 'FR', country: 'France' },
      { buCode: '310', name: 'IKEA Store 310', city: 'France', countryCode: 'FR', country: 'France' },
      { buCode: '315', name: 'IKEA Store 315', city: 'France', countryCode: 'FR', country: 'France' },
      { buCode: '316', name: 'IKEA Store 316', city: 'France', countryCode: 'FR', country: 'France' },
      { buCode: '345', name: 'IKEA Store 345', city: 'France', countryCode: 'FR', country: 'France' },
      { buCode: '389', name: 'IKEA Store 389', city: 'France', countryCode: 'FR', country: 'France' },
      { buCode: '402', name: 'IKEA Store 402', city: 'France', countryCode: 'FR', country: 'France' },
      { buCode: '431', name: 'IKEA Store 431', city: 'France', countryCode: 'FR', country: 'France' },
      { buCode: '432', name: 'IKEA Store 432', city: 'France', countryCode: 'FR', country: 'France' },
      { buCode: '433', name: 'IKEA Store 433', city: 'France', countryCode: 'FR', country: 'France' },
      { buCode: '434', name: 'IKEA Store 434', city: 'France', countryCode: 'FR', country: 'France' },
      { buCode: '435', name: 'IKEA Store 435', city: 'France', countryCode: 'FR', country: 'France' },
      { buCode: '444', name: 'IKEA Store 444', city: 'France', countryCode: 'FR', country: 'France' },
      { buCode: '487', name: 'IKEA Store 487', city: 'France', countryCode: 'FR', country: 'France' },
      { buCode: '518', name: 'IKEA Store 518', city: 'France', countryCode: 'FR', country: 'France' },
      { buCode: '562', name: 'IKEA Store 562', city: 'France', countryCode: 'FR', country: 'France' },
      { buCode: '580', name: 'IKEA Store 580', city: 'France', countryCode: 'FR', country: 'France' },
      { buCode: '645', name: 'IKEA Store 645', city: 'France', countryCode: 'FR', country: 'France' },
      { buCode: '719', name: 'IKEA Store 719', city: 'France', countryCode: 'FR', country: 'France' },
    ],
  };

  return stores[countryCode] || [];
}

/**
 * Get all stores across all supported countries
 */
export function getAllStores(): IkeaStore[] {
  return [
    ...getStoresByCountry('BE'),
    ...getStoresByCountry('NL'),
    ...getStoresByCountry('FR'),
  ];
}

/**
 * Get saved store preferences (now using Firestore)
 */
export async function getStorePreferences(): Promise<StorePreferences> {
  return await getStorePreferencesFromFirestore();
}

/**
 * Save store preferences (now using Firestore)
 */
export async function saveStorePreferences(preferences: StorePreferences): Promise<void> {
  return await saveStorePreferencesToFirestore(preferences);
}

/**
 * Default store codes for each country
 */
const DEFAULT_STORES = {
  BE: '169', // IKEA Gent
  NL: '403', // IKEA Breda
  FR: '133', // IKEA Lille
};

/**
 * Get selected store for a specific country
 * Returns default store if no preference is saved
 */
export async function getSelectedStore(countryCode: 'BE' | 'NL' | 'FR'): Promise<IkeaStore | null> {
  const preferences = await getStorePreferences();
  let buCode = preferences[countryCode.toLowerCase() as keyof StorePreferences];

  // If no preference is saved, use default and save it
  if (!buCode) {
    buCode = DEFAULT_STORES[countryCode];
    await setSelectedStore(countryCode, buCode);
  }

  const stores = getStoresByCountry(countryCode);
  return stores.find(store => store.buCode === buCode) || null;
}

/**
 * Set selected store for a specific country
 */
export async function setSelectedStore(countryCode: 'BE' | 'NL' | 'FR', buCode: string): Promise<void> {
  const preferences = await getStorePreferences();
  preferences[countryCode.toLowerCase() as keyof StorePreferences] = buCode;
  await saveStorePreferences(preferences);
}

/**
 * Clear all store preferences
 */
export function clearStorePreferences(): void {
  if (typeof window === 'undefined') return;
  localStorage.removeItem(STORAGE_KEY);
}

// ==================== FIRESTORE FUNCTIONS ====================

/**
 * Get store preferences from Firestore
 */
export async function getStorePreferencesFromFirestore(): Promise<StorePreferences> {
  const userId = getCurrentUserId();
  if (!db || !userId) {
    return {};
  }

  try {
    const docRef = doc(db, 'storePreferences', userId);
    const docSnap = await getDoc(docRef);

    if (docSnap.exists()) {
      const data = docSnap.data();
      return data.preferences || {};
    } else {
      // Return default stores for new users
      return {
        be: DEFAULT_STORES.BE,
        nl: DEFAULT_STORES.NL,
        fr: DEFAULT_STORES.FR,
      };
    }
  } catch (error) {
    console.error('[StorePreferences] Failed to load from Firestore:', error);
    return {};
  }
}

/**
 * Save store preferences to Firestore
 */
export async function saveStorePreferencesToFirestore(
  preferences: StorePreferences
): Promise<void> {
  const userId = getCurrentUserId();
  if (!db || !userId) {
    throw new Error('Firebase not initialized or user not authenticated');
  }

  try {
    const docRef = doc(db, 'storePreferences', userId);
    await setDoc(docRef, {
      userId,
      preferences,
      updatedAt: Timestamp.now(),
    });
  } catch (error) {
    console.error('[StorePreferences] Failed to save to Firestore:', error);
    throw error;
  }
}

/**
 * Migrate store preferences from localStorage to Firestore
 * This is a one-time migration that runs on first load
 */
export async function migrateLocalStorageToFirestore(): Promise<void> {
  const userId = getCurrentUserId();
  if (typeof window === 'undefined' || !db || !userId) {
    return;
  }

  // Check if migration has already been done
  const migrationComplete = localStorage.getItem(MIGRATION_KEY);
  if (migrationComplete === 'true') {
    return;
  }

  try {
    // Check if there's existing data in localStorage
    const localData = localStorage.getItem(STORAGE_KEY);
    if (!localData) {
      localStorage.setItem(MIGRATION_KEY, 'true');
      return;
    }

    const preferences: StorePreferences = JSON.parse(localData);

    // Check if Firestore already has preferences (in case migration was interrupted)
    const docRef = doc(db, 'storePreferences', userId);
    const docSnap = await getDoc(docRef);

    if (!docSnap.exists()) {
      // Only migrate if Firestore doesn't have data yet
      await saveStorePreferencesToFirestore(preferences);
    }

    // Clear localStorage after successful migration
    localStorage.removeItem(STORAGE_KEY);
    localStorage.setItem(MIGRATION_KEY, 'true');
  } catch (error) {
    console.error('[StorePreferences] Migration failed:', error);
    // Don't throw - we don't want to break the app if migration fails
  }
}
