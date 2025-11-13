/**
 * Tests for Store Manager
 */

import {
  getStoresByCountry,
  getAllStores,
  getSelectedStore,
  setSelectedStore,
  getStorePreferencesFromFirestore,
  saveStorePreferencesToFirestore,
  migrateLocalStorageToFirestore,
} from '../../lib/stores/store-manager';
import { createMockFirestore, createMockAuth, createMockUser, createMockDocument, createMockTimestamp } from '../helpers/firebase-mocks';
import { createMockStorePreferences } from '../helpers/test-fixtures';

// Store mock document references
let mockDocuments: Map<string, any> = new Map();

// Mock firebase/firestore functions
jest.mock('firebase/firestore', () => ({
  doc: jest.fn((db: any, collectionPath: string, docId: string) => {
    const key = `${collectionPath}/${docId}`;
    if (!mockDocuments.has(key)) {
      mockDocuments.set(key, createMockDocument(docId, {}, false));
    }
    return mockDocuments.get(key);
  }),
  getDoc: jest.fn((docRef: any) => {
    return docRef.get();
  }),
  setDoc: jest.fn((docRef: any, data: any) => {
    return docRef.set(data);
  }),
  Timestamp: {
    now: () => createMockTimestamp(),
    fromDate: (date: Date) => createMockTimestamp(date),
  },
}));

// Mock the firebase module
jest.mock('../../lib/firebase', () => ({
  db: null,
}));

// Mock getCurrentUserId
jest.mock('../../lib/user-data/user-data-manager', () => ({
  getCurrentUserId: jest.fn(() => 'test-uid-123'),
}));

describe('Store Manager', () => {
  let mockDb: any;
  let mockAuth: any;

  beforeEach(() => {
    // Clear mock documents
    mockDocuments.clear();

    mockDb = createMockFirestore();
    mockAuth = createMockAuth(createMockUser());

    // Setup localStorage mock
    const localStorageMock: { [key: string]: string } = {};
    global.localStorage = {
      getItem: jest.fn((key: string) => localStorageMock[key] || null),
      setItem: jest.fn((key: string, value: string) => {
        localStorageMock[key] = value;
      }),
      removeItem: jest.fn((key: string) => {
        delete localStorageMock[key];
      }),
      clear: jest.fn(() => {
        Object.keys(localStorageMock).forEach(key => delete localStorageMock[key]);
      }),
      length: 0,
      key: jest.fn(),
    } as any;
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('getStoresByCountry', () => {
    it('should return Belgian stores', () => {
      const stores = getStoresByCountry('BE');

      expect(stores).toBeDefined();
      expect(stores.length).toBeGreaterThan(0);
      expect(stores.every(s => s.countryCode === 'BE')).toBe(true);
      expect(stores.every(s => s.country === 'Belgium')).toBe(true);
    });

    it('should return Dutch stores', () => {
      const stores = getStoresByCountry('NL');

      expect(stores).toBeDefined();
      expect(stores.length).toBeGreaterThan(0);
      expect(stores.every(s => s.countryCode === 'NL')).toBe(true);
      expect(stores.every(s => s.country === 'Netherlands')).toBe(true);
    });

    it('should return French stores', () => {
      const stores = getStoresByCountry('FR');

      expect(stores).toBeDefined();
      expect(stores.length).toBeGreaterThan(0);
      expect(stores.every(s => s.countryCode === 'FR')).toBe(true);
      expect(stores.every(s => s.country === 'France')).toBe(true);
    });

    it('should return German stores', () => {
      const stores = getStoresByCountry('DE');

      expect(stores).toBeDefined();
      expect(stores.length).toBeGreaterThan(0);
      expect(stores.every(s => s.countryCode === 'DE')).toBe(true);
      expect(stores.every(s => s.country === 'Germany')).toBe(true);
    });

    it('should return stores with required properties', () => {
      const stores = getStoresByCountry('BE');

      stores.forEach(store => {
        expect(store).toHaveProperty('buCode');
        expect(store).toHaveProperty('name');
        expect(store).toHaveProperty('city');
        expect(store).toHaveProperty('countryCode');
        expect(store).toHaveProperty('country');
        expect(typeof store.buCode).toBe('string');
        expect(store.buCode.length).toBeGreaterThan(0);
      });
    });
  });

  describe('getAllStores', () => {
    it('should return stores from all countries', () => {
      const allStores = getAllStores();

      expect(allStores).toBeDefined();
      expect(allStores.length).toBeGreaterThan(0);

      const countries = new Set(allStores.map(s => s.countryCode));
      expect(countries.has('BE')).toBe(true);
      expect(countries.has('NL')).toBe(true);
      expect(countries.has('FR')).toBe(true);
      expect(countries.has('DE')).toBe(true);
    });

    it('should return same stores as individual country calls combined', () => {
      const allStores = getAllStores();
      const beStores = getStoresByCountry('BE');
      const nlStores = getStoresByCountry('NL');
      const frStores = getStoresByCountry('FR');
      const deStores = getStoresByCountry('DE');

      const combinedLength = beStores.length + nlStores.length + frStores.length + deStores.length;
      expect(allStores.length).toBe(combinedLength);
    });
  });

  describe('getStorePreferencesFromFirestore', () => {
    it('should return stored preferences', async () => {
      const mockPrefs = createMockStorePreferences();
      const mockDoc = createMockDocument('test-uid-123', { preferences: mockPrefs }, true);
      mockDocuments.set('storePreferences/test-uid-123', mockDoc);

      const prefs = await getStorePreferencesFromFirestore(mockDb, mockAuth);

      expect(prefs).toEqual(mockPrefs);
    });

    it('should return default stores for new users', async () => {
      // Don't set up a document, so it will be created as non-existent
      const prefs = await getStorePreferencesFromFirestore(mockDb, mockAuth);

      expect(prefs).toHaveProperty('be');
      expect(prefs).toHaveProperty('nl');
      expect(prefs).toHaveProperty('fr');
      expect(prefs).toHaveProperty('de');
      expect(prefs.be).toBe('169'); // Default IKEA Gent
    });

    it('should return empty object when no user is authenticated', async () => {
      const authWithNoUser = createMockAuth(null);
      const prefs = await getStorePreferencesFromFirestore(mockDb, authWithNoUser);

      expect(prefs).toEqual({});
    });

    it('should handle Firestore errors gracefully', async () => {
      const mockDoc = createMockDocument('test-uid-123', {}, true);
      mockDoc.get = jest.fn(() => Promise.reject(new Error('Firestore error')));
      mockDocuments.set('storePreferences/test-uid-123', mockDoc);

      const prefs = await getStorePreferencesFromFirestore(mockDb, mockAuth);

      expect(prefs).toEqual({});
    });
  });

  describe('saveStorePreferencesToFirestore', () => {
    it('should save preferences to Firestore', async () => {
      const mockPrefs = createMockStorePreferences();
      const mockDoc = createMockDocument('test-uid-123', {}, true);
      mockDocuments.set('storePreferences/test-uid-123', mockDoc);

      await saveStorePreferencesToFirestore(mockPrefs, mockDb, mockAuth);

      expect(mockDoc.set).toHaveBeenCalled();
      const savedData = mockDoc.set.mock.calls[0][0];
      expect(savedData.preferences).toEqual(mockPrefs);
      expect(savedData.userId).toBe('test-uid-123');
    });

    it('should throw error when user not authenticated', async () => {
      const authWithNoUser = createMockAuth(null);
      const mockPrefs = createMockStorePreferences();

      await expect(
        saveStorePreferencesToFirestore(mockPrefs, mockDb, authWithNoUser)
      ).rejects.toThrow('Firebase not initialized or user not authenticated');
    });

    it('should propagate Firestore errors', async () => {
      const mockPrefs = createMockStorePreferences();
      const mockDoc = createMockDocument('test-uid-123', {}, true);
      mockDoc.set = jest.fn(() => Promise.reject(new Error('Firestore write error')));
      mockDocuments.set('storePreferences/test-uid-123', mockDoc);

      await expect(
        saveStorePreferencesToFirestore(mockPrefs, mockDb, mockAuth)
      ).rejects.toThrow('Firestore write error');
    });
  });

  describe('getSelectedStore', () => {
    it('should return selected store from preferences', async () => {
      const mockPrefs = { be: '179' }; // Wilrijk
      const mockDoc = createMockDocument('test-uid-123', { preferences: mockPrefs }, true);
      mockDocuments.set('storePreferences/test-uid-123', mockDoc);

      const store = await getSelectedStore('BE', mockDb, mockAuth);

      expect(store).toBeDefined();
      expect(store?.buCode).toBe('179');
      expect(store?.name).toContain('Wilrijk');
    });

    it('should use default store when no preference exists', async () => {
      const mockDoc = createMockDocument('test-uid-123', { preferences: {} }, true);
      mockDocuments.set('storePreferences/test-uid-123', mockDoc);

      const store = await getSelectedStore('BE', mockDb, mockAuth);

      expect(store).toBeDefined();
      expect(store?.buCode).toBe('169'); // Default Gent
    });

    it('should return null if store code is invalid', async () => {
      const mockPrefs = { be: '999' }; // Invalid code
      const mockDoc = createMockDocument('test-uid-123', { preferences: mockPrefs }, true);
      mockDocuments.set('storePreferences/test-uid-123', mockDoc);

      const store = await getSelectedStore('BE', mockDb, mockAuth);

      expect(store).toBeNull();
    });
  });

  describe('setSelectedStore', () => {
    it('should update store preference for country', async () => {
      const mockPrefs = createMockStorePreferences();
      const mockDoc = createMockDocument('test-uid-123', { preferences: mockPrefs }, true);
      mockDocuments.set('storePreferences/test-uid-123', mockDoc);

      await setSelectedStore('BE', '179', mockDb, mockAuth);

      expect(mockDoc.set).toHaveBeenCalled();
      const savedData = mockDoc.set.mock.calls[0][0];
      expect(savedData.preferences.be).toBe('179');
    });

    it('should create new preferences if none exist', async () => {
      const mockDoc = createMockDocument('test-uid-123', {}, false);
      mockDocuments.set('storePreferences/test-uid-123', mockDoc);

      await setSelectedStore('NL', '403', mockDb, mockAuth);

      expect(mockDoc.set).toHaveBeenCalled();
    });
  });

  describe('migrateLocalStorageToFirestore', () => {
    beforeEach(() => {
      // Mock window object for localStorage migration tests
      global.window = {} as any;
    });

    it('should migrate preferences from localStorage to Firestore', async () => {
      const oldPrefs = createMockStorePreferences();
      localStorage.setItem('ikea-store-preferences', JSON.stringify(oldPrefs));

      const mockDoc = createMockDocument('test-uid-123', {}, false);
      mockDb.collection('storePreferences').doc = jest.fn(() => mockDoc);

      // Mock getCurrentUserId and db
      const { getCurrentUserId } = require('../../lib/user-data/user-data-manager');
      getCurrentUserId.mockReturnValue('test-uid-123');
      const firebaseModule = require('../../lib/firebase');
      firebaseModule.db = mockDb;

      await migrateLocalStorageToFirestore();

      expect(localStorage.removeItem).toHaveBeenCalledWith('ikea-store-preferences');
      expect(localStorage.setItem).toHaveBeenCalledWith('ikea-store-preferences-migrated', 'true');
    });

    it('should skip migration if already completed', async () => {
      localStorage.setItem('ikea-store-preferences-migrated', 'true');

      const saveSpy = jest.fn();
      const mockDoc = createMockDocument('test-uid-123', {}, false);
      mockDoc.set = saveSpy;
      mockDb.collection('storePreferences').doc = jest.fn(() => mockDoc);

      await migrateLocalStorageToFirestore();

      expect(saveSpy).not.toHaveBeenCalled();
    });

    it('should skip migration if no localStorage data exists', async () => {
      const saveSpy = jest.fn();
      const mockDoc = createMockDocument('test-uid-123', {}, false);
      mockDoc.set = saveSpy;

      const firebaseModule = require('../../lib/firebase');
      firebaseModule.db = mockDb;

      await migrateLocalStorageToFirestore();

      expect(saveSpy).not.toHaveBeenCalled();
      expect(localStorage.setItem).toHaveBeenCalledWith('ikea-store-preferences-migrated', 'true');
    });

    it('should not overwrite existing Firestore data', async () => {
      const oldPrefs = createMockStorePreferences();
      localStorage.setItem('ikea-store-preferences', JSON.stringify(oldPrefs));

      // Firestore already has data
      const mockDoc = createMockDocument('test-uid-123', { preferences: oldPrefs }, true);
      const saveSpy = jest.fn();
      mockDoc.set = saveSpy;
      mockDb.collection('storePreferences').doc = jest.fn(() => mockDoc);

      const firebaseModule = require('../../lib/firebase');
      firebaseModule.db = mockDb;
      const { getCurrentUserId } = require('../../lib/user-data/user-data-manager');
      getCurrentUserId.mockReturnValue('test-uid-123');

      await migrateLocalStorageToFirestore();

      expect(saveSpy).not.toHaveBeenCalled();
      expect(localStorage.removeItem).toHaveBeenCalledWith('ikea-store-preferences');
    });
  });
});
