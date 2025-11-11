import { IkeaStore, StorePreferences } from '../types/store-types';
import {
  doc,
  getDoc,
  setDoc,
  Timestamp,
  Firestore,
} from 'firebase/firestore';
import { Auth } from 'firebase/auth';
import { db } from '../firebase';
import { getCurrentUserId } from '../user-data/user-data-manager';

// Storage key for localStorage
const STORAGE_KEY = 'ikea-store-preferences';
const MIGRATION_KEY = 'ikea-store-preferences-migrated';

/**
 * Get list of IKEA stores for a specific country
 * Uses ikea-availability-checker package data
 */
export function getStoresByCountry(countryCode: 'BE' | 'NL' | 'FR' | 'DE'): IkeaStore[] {
  // Note: This is a simplified list. In production, we'd use ikea-availability-checker
  // For now, including commonly used stores

  const stores: Record<'BE' | 'NL' | 'FR' | 'DE', IkeaStore[]> = {
    BE: [
      { buCode: '169', name: 'IKEA Gent', city: 'Ghent', countryCode: 'BE', country: 'Belgium' },
      { buCode: '179', name: 'IKEA Wilrijk', city: 'Antwerp', countryCode: 'BE', country: 'Belgium' },
      { buCode: '375', name: 'IKEA Liège', city: 'Liège', countryCode: 'BE', country: 'Belgium' },
      { buCode: '376', name: 'IKEA Zaventem', city: 'Brussels', countryCode: 'BE', country: 'Belgium' },
      { buCode: '423', name: 'IKEA Mons', city: 'Mons', countryCode: 'BE', country: 'Belgium' },
      { buCode: '452', name: 'IKEA Hasselt', city: 'Hasselt', countryCode: 'BE', country: 'Belgium' },
      { buCode: '482', name: 'IKEA Anderlecht', city: 'Brussels', countryCode: 'BE', country: 'Belgium' },
      { buCode: '483', name: 'IKEA Arlon', city: 'Arlon', countryCode: 'BE', country: 'Belgium' },
    ],
    NL: [
      { buCode: '087', name: 'IKEA Eindhoven', city: 'Eindhoven', countryCode: 'NL', country: 'Netherlands' },
      { buCode: '088', name: 'IKEA Amsterdam', city: 'Amsterdam', countryCode: 'NL', country: 'Netherlands' },
      { buCode: '089', name: 'IKEA Heerlen', city: 'Heerlen', countryCode: 'NL', country: 'Netherlands' },
      { buCode: '151', name: 'IKEA Delft', city: 'Delft', countryCode: 'NL', country: 'Netherlands' },
      { buCode: '270', name: 'IKEA Utrecht', city: 'Utrecht', countryCode: 'NL', country: 'Netherlands' },
      { buCode: '272', name: 'IKEA Duiven', city: 'Duiven', countryCode: 'NL', country: 'Netherlands' },
      { buCode: '274', name: 'IKEA Barendrecht', city: 'Barendrecht', countryCode: 'NL', country: 'Netherlands' },
      { buCode: '312', name: 'IKEA Hengelo', city: 'Hengelo', countryCode: 'NL', country: 'Netherlands' },
      { buCode: '378', name: 'IKEA Haarlem', city: 'Haarlem', countryCode: 'NL', country: 'Netherlands' },
      { buCode: '391', name: 'IKEA Zwolle', city: 'Zwolle', countryCode: 'NL', country: 'Netherlands' },
      { buCode: '403', name: 'IKEA Breda', city: 'Breda', countryCode: 'NL', country: 'Netherlands' },
      { buCode: '404', name: 'IKEA Groningen', city: 'Groningen', countryCode: 'NL', country: 'Netherlands' },
      { buCode: '415', name: 'IKEA Amersfoort', city: 'Amersfoort', countryCode: 'NL', country: 'Netherlands' },
    ],
    FR: [
      { buCode: '018', name: 'IKEA Avignon', city: 'Avignon', countryCode: 'FR', country: 'France' },
      { buCode: '051', name: 'IKEA Hénin-Beaumont', city: 'Hénin-Beaumont', countryCode: 'FR', country: 'France' },
      { buCode: '060', name: 'IKEA Brest', city: 'Brest', countryCode: 'FR', country: 'France' },
      { buCode: '082', name: 'IKEA Evry', city: 'Evry', countryCode: 'FR', country: 'France' },
      { buCode: '083', name: 'IKEA Plaisir', city: 'Plaisir', countryCode: 'FR', country: 'France' },
      { buCode: '086', name: 'IKEA Dijon', city: 'Dijon', countryCode: 'FR', country: 'France' },
      { buCode: '130', name: 'IKEA Vitrolles', city: 'Vitrolles', countryCode: 'FR', country: 'France' },
      { buCode: '131', name: 'IKEA Paris Nord', city: 'Paris', countryCode: 'FR', country: 'France' },
      { buCode: '133', name: 'IKEA Lille', city: 'Lille', countryCode: 'FR', country: 'France' },
      { buCode: '134', name: 'IKEA Bordeaux', city: 'Bordeaux', countryCode: 'FR', country: 'France' },
      { buCode: '163', name: 'IKEA Rouen', city: 'Rouen', countryCode: 'FR', country: 'France' },
      { buCode: '177', name: 'IKEA Rennes', city: 'Rennes', countryCode: 'FR', country: 'France' },
      { buCode: '198', name: 'IKEA Reims', city: 'Reims', countryCode: 'FR', country: 'France' },
      { buCode: '199', name: 'IKEA Caen', city: 'Caen', countryCode: 'FR', country: 'France' },
      { buCode: '239', name: 'IKEA Strasbourg', city: 'Strasbourg', countryCode: 'FR', country: 'France' },
      { buCode: '240', name: 'IKEA Villiers', city: 'Villiers-sur-Marne', countryCode: 'FR', country: 'France' },
      { buCode: '242', name: 'IKEA Toulouse', city: 'Toulouse', countryCode: 'FR', country: 'France' },
      { buCode: '260', name: 'IKEA Metz', city: 'Metz', countryCode: 'FR', country: 'France' },
      { buCode: '285', name: 'IKEA Vélizy', city: 'Vélizy', countryCode: 'FR', country: 'France' },
      { buCode: '310', name: 'IKEA Bayonne', city: 'Bayonne', countryCode: 'FR', country: 'France' },
      { buCode: '315', name: 'IKEA Toulon', city: 'Toulon', countryCode: 'FR', country: 'France' },
      { buCode: '316', name: 'IKEA Nantes', city: 'Nantes', countryCode: 'FR', country: 'France' },
      { buCode: '345', name: 'IKEA Clermont-Ferrand', city: 'Clermont-Ferrand', countryCode: 'FR', country: 'France' },
      { buCode: '389', name: 'IKEA Franconville', city: 'Franconville', countryCode: 'FR', country: 'France' },
      { buCode: '402', name: 'IKEA Montpellier', city: 'Montpellier', countryCode: 'FR', country: 'France' },
      { buCode: '431', name: 'IKEA Saint-Étienne', city: 'Saint-Étienne', countryCode: 'FR', country: 'France' },
      { buCode: '432', name: 'IKEA Thiais', city: 'Thiais', countryCode: 'FR', country: 'France' },
      { buCode: '433', name: 'IKEA La Valentine', city: 'Marseille', countryCode: 'FR', country: 'France' },
      { buCode: '434', name: 'IKEA Tours', city: 'Tours', countryCode: 'FR', country: 'France' },
      { buCode: '435', name: 'IKEA Grenoble', city: 'Grenoble', countryCode: 'FR', country: 'France' },
      { buCode: '444', name: 'IKEA Mulhouse', city: 'Mulhouse', countryCode: 'FR', country: 'France' },
      { buCode: '487', name: 'IKEA Orléans', city: 'Orléans', countryCode: 'FR', country: 'France' },
      { buCode: '518', name: 'IKEA Nice', city: 'Nice', countryCode: 'FR', country: 'France' },
      { buCode: '562', name: 'IKEA Lyon', city: 'Lyon', countryCode: 'FR', country: 'France' },
      { buCode: '645', name: 'IKEA Rivoli', city: 'Paris', countryCode: 'FR', country: 'France' },
      { buCode: '719', name: 'IKEA Italie Deux', city: 'Paris', countryCode: 'FR', country: 'France' },
    ],
    DE: [
      { buCode: '102', name: 'IKEA Köln-Am Butzweilerhof', city: 'Cologne', countryCode: 'DE', country: 'Germany' },
      { buCode: '147', name: 'IKEA Köln-Godorf', city: 'Cologne', countryCode: 'DE', country: 'Germany' },
      { buCode: '321', name: 'IKEA Düsseldorf', city: 'Düsseldorf', countryCode: 'DE', country: 'Germany' },
      { buCode: '425', name: 'IKEA Duisburg', city: 'Duisburg', countryCode: 'DE', country: 'Germany' },
      { buCode: '148', name: 'IKEA Essen', city: 'Essen', countryCode: 'DE', country: 'Germany' },
      { buCode: '223', name: 'IKEA Dortmund', city: 'Dortmund', countryCode: 'DE', country: 'Germany' },
      { buCode: '184', name: 'IKEA Osnabrück', city: 'Osnabrück', countryCode: 'DE', country: 'Germany' },
      { buCode: '494', name: 'IKEA Kaarst', city: 'Kaarst', countryCode: 'DE', country: 'Germany' },
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
    ...getStoresByCountry('DE'),
  ];
}

/**
 * Get saved store preferences (now using Firestore)
 * @param firestoreDb - Optional Firestore instance (for Chrome extension use)
 * @param authInstance - Optional Auth instance (for Chrome extension use)
 */
export async function getStorePreferences(
  firestoreDb?: Firestore,
  authInstance?: Auth
): Promise<StorePreferences> {
  return await getStorePreferencesFromFirestore(firestoreDb, authInstance);
}

/**
 * Save store preferences (now using Firestore)
 * @param preferences - Store preferences to save
 * @param firestoreDb - Optional Firestore instance (for Chrome extension use)
 * @param authInstance - Optional Auth instance (for Chrome extension use)
 */
export async function saveStorePreferences(
  preferences: StorePreferences,
  firestoreDb?: Firestore,
  authInstance?: Auth
): Promise<void> {
  return await saveStorePreferencesToFirestore(preferences, firestoreDb, authInstance);
}

/**
 * Default store codes for each country
 */
const DEFAULT_STORES = {
  BE: '169', // IKEA Gent
  NL: '403', // IKEA Breda
  FR: '133', // IKEA Lille
  DE: '494', // IKEA Kaarst
};

/**
 * Get selected store for a specific country
 * Returns default store if no preference is saved
 * @param countryCode - Country code (BE, NL, FR, DE)
 * @param firestoreDb - Optional Firestore instance (for Chrome extension use)
 * @param authInstance - Optional Auth instance (for Chrome extension use)
 */
export async function getSelectedStore(
  countryCode: 'BE' | 'NL' | 'FR' | 'DE',
  firestoreDb?: Firestore,
  authInstance?: Auth
): Promise<IkeaStore | null> {
  const preferences = await getStorePreferences(firestoreDb, authInstance);
  let buCode = preferences[countryCode.toLowerCase() as keyof StorePreferences];

  // If no preference is saved, use default and save it
  if (!buCode) {
    buCode = DEFAULT_STORES[countryCode];
    await setSelectedStore(countryCode, buCode, firestoreDb, authInstance);
  }

  const stores = getStoresByCountry(countryCode);
  return stores.find(store => store.buCode === buCode) || null;
}

/**
 * Set selected store for a specific country
 * @param countryCode - Country code (BE, NL, FR, DE)
 * @param buCode - Store bu code
 * @param firestoreDb - Optional Firestore instance (for Chrome extension use)
 * @param authInstance - Optional Auth instance (for Chrome extension use)
 */
export async function setSelectedStore(
  countryCode: 'BE' | 'NL' | 'FR' | 'DE',
  buCode: string,
  firestoreDb?: Firestore,
  authInstance?: Auth
): Promise<void> {
  const preferences = await getStorePreferences(firestoreDb, authInstance);
  preferences[countryCode.toLowerCase() as keyof StorePreferences] = buCode;
  await saveStorePreferences(preferences, firestoreDb, authInstance);
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
 * @param firestoreDb - Optional Firestore instance (for Chrome extension use)
 * @param authInstance - Optional Auth instance (for Chrome extension use)
 */
export async function getStorePreferencesFromFirestore(
  firestoreDb?: Firestore,
  authInstance?: Auth
): Promise<StorePreferences> {
  const dbInstance = firestoreDb || db;

  // Get user ID from auth instance if provided, otherwise use shared currentUser
  let userId: string | null = null;
  if (authInstance) {
    userId = authInstance.currentUser?.uid || null;
  } else {
    userId = getCurrentUserId();
  }

  if (!dbInstance || !userId) {
    console.log('[StorePreferences] Missing db or userId:', { db: !!dbInstance, userId });
    return {};
  }

  try {
    const docRef = doc(dbInstance, 'storePreferences', userId);
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
        de: DEFAULT_STORES.DE,
      };
    }
  } catch (error) {
    console.error('[StorePreferences] Failed to load from Firestore:', error);
    return {};
  }
}

/**
 * Save store preferences to Firestore
 * @param preferences - Store preferences to save
 * @param firestoreDb - Optional Firestore instance (for Chrome extension use)
 * @param authInstance - Optional Auth instance (for Chrome extension use)
 */
export async function saveStorePreferencesToFirestore(
  preferences: StorePreferences,
  firestoreDb?: Firestore,
  authInstance?: Auth
): Promise<void> {
  const dbInstance = firestoreDb || db;

  // Get user ID from auth instance if provided, otherwise use shared currentUser
  let userId: string | null = null;
  if (authInstance) {
    userId = authInstance.currentUser?.uid || null;
  } else {
    userId = getCurrentUserId();
  }

  if (!dbInstance || !userId) {
    console.log('[StorePreferences] Missing db or userId for save:', { db: !!dbInstance, userId });
    throw new Error('Firebase not initialized or user not authenticated');
  }

  try {
    const docRef = doc(dbInstance, 'storePreferences', userId);
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
