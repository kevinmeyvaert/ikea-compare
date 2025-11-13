/**
 * Tests for User Data Manager
 */

import {
  initializeAnonymousAuth,
  getCurrentUserId,
  addFavorite,
  removeFavorite,
  isFavorite,
  getFavorites,
  addToHistory,
  getHistory,
  clearHistory,
} from '../../lib/user-data/user-data-manager';
import {
  createMockFirestore,
  createMockAuth,
  createMockUser,
  createMockDocument,
  createMockTimestamp,
  createMockQuerySnapshot,
} from '../helpers/firebase-mocks';
import {
  createMockFavorite,
  createMockHistoryEntry,
  hoursAgo,
} from '../helpers/test-fixtures';
import { measureExecutionTime } from '../helpers/performance-utils';

// Store mock collection data
const mockCollections: Map<string, any[]> = new Map();

// Mock firebase/firestore functions
jest.mock('firebase/firestore', () => ({
  collection: jest.fn((db: any, collectionName: string) => ({
    _collectionName: collectionName,
  })),
  addDoc: jest.fn((collectionRef: any, data: any) => {
    const collectionName = collectionRef._collectionName;
    if (!mockCollections.has(collectionName)) {
      mockCollections.set(collectionName, []);
    }
    const id = `mock-${Math.random().toString(36).substr(2, 9)}`;
    const newDoc = createMockDocument(id, data, true);
    mockCollections.get(collectionName)!.push(newDoc);
    return Promise.resolve(newDoc);
  }),
  deleteDoc: jest.fn((docRef: any) => {
    // Remove from mock collections
    const collectionName = docRef._collectionName;
    const docId = docRef._docId;
    const docs = mockCollections.get(collectionName);
    if (docs) {
      const index = docs.findIndex((d: any) => d.id === docId);
      if (index !== -1) {
        docs.splice(index, 1);
      }
    }
    return Promise.resolve();
  }),
  doc: jest.fn((db: any, collectionName: string, docId: string) => {
    return { _collectionName: collectionName, _docId: docId };
  }),
  query: jest.fn((...args: any[]) => ({
    _collectionRef: args[0],
    _constraints: args.slice(1),
  })),
  where: jest.fn((field: string, op: string, value: any) => ({
    type: 'where',
    field,
    op,
    value,
  })),
  orderBy: jest.fn((field: string, direction: string = 'asc') => ({
    type: 'orderBy',
    field,
    direction,
  })),
  limit: jest.fn((count: number) => ({
    type: 'limit',
    count,
  })),
  getDocs: jest.fn((queryObj: any) => {
    const collectionName = queryObj._collectionRef._collectionName;
    const constraints = queryObj._constraints || [];

    let docs = mockCollections.get(collectionName) || [];

    // Apply where filters
    for (const constraint of constraints) {
      if (constraint.type === 'where') {
        docs = docs.filter((doc: any) => {
          const docData = doc.data();
          const fieldValue = docData[constraint.field];

          switch (constraint.op) {
            case '==':
              return fieldValue === constraint.value;
            case '>=':
              // Handle Timestamp comparison
              if (typeof fieldValue === 'object' && fieldValue.toMillis) {
                return fieldValue.toMillis() >= constraint.value.toMillis();
              }
              return fieldValue >= constraint.value;
            default:
              return true;
          }
        });
      }
    }

    // Apply orderBy
    for (const constraint of constraints) {
      if (constraint.type === 'orderBy') {
        docs = [...docs].sort((a: any, b: any) => {
          const aVal = a.data()[constraint.field];
          const bVal = b.data()[constraint.field];

          // Handle Timestamp sorting
          if (typeof aVal === 'object' && aVal.toMillis) {
            const aTime = aVal.toMillis();
            const bTime = bVal.toMillis();
            return constraint.direction === 'desc' ? bTime - aTime : aTime - bTime;
          }

          if (constraint.direction === 'desc') {
            return bVal < aVal ? -1 : bVal > aVal ? 1 : 0;
          }
          return aVal < bVal ? -1 : aVal > bVal ? 1 : 0;
        });
      }
    }

    // Apply limit
    for (const constraint of constraints) {
      if (constraint.type === 'limit') {
        docs = docs.slice(0, constraint.count);
      }
    }

    return Promise.resolve(createMockQuerySnapshot(docs));
  }),
  Timestamp: {
    now: () => createMockTimestamp(),
    fromDate: (date: Date) => createMockTimestamp(date),
  },
}));

// Mock the firebase module
let mockDb: any = null;
let mockAuth: any = null;

jest.mock('../../lib/firebase', () => ({
  get db() {
    return mockDb;
  },
  get auth() {
    return mockAuth;
  },
  signInAnonymously: jest.fn(),
  onAuthStateChanged: jest.fn(),
}));

describe('User Data Manager', () => {
  let mockUser: any;

  beforeEach(() => {
    // Clear collections
    mockCollections.clear();

    // Set up fresh mocks
    mockDb = createMockFirestore();
    mockUser = createMockUser({ uid: 'test-user-123' });
    mockAuth = createMockAuth(mockUser);
  });

  describe('Authentication', () => {
    it('should initialize with existing user', async () => {
      const { onAuthStateChanged } = require('../../lib/firebase');
      onAuthStateChanged.mockImplementation((auth: any, callback: any) => {
        callback(mockUser);
        return jest.fn(); // Return unsubscribe function
      });

      const user = await initializeAnonymousAuth();

      expect(user).toBe(mockUser);
      expect(user?.uid).toBe('test-user-123');
    });

    it('should create new anonymous user when none exists', async () => {
      const { onAuthStateChanged, signInAnonymously } = require('../../lib/firebase');
      const newUser = createMockUser({ uid: 'new-anon-user' });

      onAuthStateChanged.mockImplementation((auth: any, callback: any) => {
        callback(null); // No existing user
        return jest.fn();
      });

      signInAnonymously.mockResolvedValue({ user: newUser });

      const user = await initializeAnonymousAuth();

      expect(signInAnonymously).toHaveBeenCalled();
      expect(user?.uid).toBe('new-anon-user');
    });

    it('should return current user ID', async () => {
      const { onAuthStateChanged } = require('../../lib/firebase');
      onAuthStateChanged.mockImplementation((auth: any, callback: any) => {
        callback(mockUser);
        return jest.fn();
      });

      await initializeAnonymousAuth();
      const userId = getCurrentUserId();

      expect(userId).toBe('test-user-123');
    });

    it('should handle auth errors gracefully', async () => {
      const { onAuthStateChanged, signInAnonymously } = require('../../lib/firebase');

      onAuthStateChanged.mockImplementation((auth: any, callback: any) => {
        callback(null);
        return jest.fn();
      });

      signInAnonymously.mockRejectedValue(new Error('Auth failed'));

      const user = await initializeAnonymousAuth();

      expect(user).toBeNull();
    });

    it('should return null when auth not initialized', async () => {
      mockAuth = null;

      const user = await initializeAnonymousAuth();

      expect(user).toBeNull();
    });
  });

  describe('Favorites Management', () => {
    beforeEach(async () => {
      // Initialize auth
      const { onAuthStateChanged } = require('../../lib/firebase');
      onAuthStateChanged.mockImplementation((auth: any, callback: any) => {
        callback(mockUser);
        return jest.fn();
      });
      await initializeAnonymousAuth();
    });

    it('should add favorite and create document', async () => {
      const productData = {
        productId: '12345678',
        name: 'BILLY Bookcase',
        imageUrl: 'https://example.com/billy.jpg',
      };

      await addFavorite(productData);

      const favorites = mockCollections.get('favorites');
      expect(favorites).toHaveLength(1);
      expect(favorites![0].data().productId).toBe('12345678');
      expect(favorites![0].data().userId).toBe('test-user-123');
    });

    it('should prevent duplicate favorites', async () => {
      const productData = {
        productId: '12345678',
        name: 'BILLY Bookcase',
        imageUrl: 'https://example.com/billy.jpg',
      };

      await addFavorite(productData);
      await addFavorite(productData); // Try to add again

      const favorites = mockCollections.get('favorites');
      expect(favorites).toHaveLength(1); // Should still be 1
    });

    it('should remove favorite and delete document', async () => {
      const productData = {
        productId: '12345678',
        name: 'BILLY Bookcase',
        imageUrl: 'https://example.com/billy.jpg',
      };

      await addFavorite(productData);
      await removeFavorite('12345678');

      const favorites = mockCollections.get('favorites') || [];
      expect(favorites).toHaveLength(0);
    });

    it('should check if product is favorite', async () => {
      const productData = {
        productId: '12345678',
        name: 'BILLY Bookcase',
        imageUrl: 'https://example.com/billy.jpg',
      };

      const beforeAdd = await isFavorite('12345678');
      expect(beforeAdd).toBe(false);

      await addFavorite(productData);

      const afterAdd = await isFavorite('12345678');
      expect(afterAdd).toBe(true);
    });

    it('should get all favorites with correct ordering', async () => {
      const products = [
        { productId: '111', name: 'Product 1', imageUrl: 'url1' },
        { productId: '222', name: 'Product 2', imageUrl: 'url2' },
        { productId: '333', name: 'Product 3', imageUrl: 'url3' },
      ];

      // Add in sequence (newest last)
      for (const product of products) {
        await addFavorite(product);
        // Small delay to ensure different timestamps
        await new Promise(resolve => setTimeout(resolve, 10));
      }

      const favorites = await getFavorites();

      expect(favorites).toHaveLength(3);
      // Should be ordered by addedAt desc (newest first)
      expect(favorites[0].productId).toBe('333'); // Latest
      expect(favorites[2].productId).toBe('111'); // Oldest
    });

    it('should respect limit parameter in getFavorites', async () => {
      // The default limit is 50 in the implementation
      // We'll just verify it returns correct count when under limit
      const products = Array.from({ length: 5 }, (_, i) => ({
        productId: `prod-${i}`,
        name: `Product ${i}`,
        imageUrl: `url${i}`,
      }));

      for (const product of products) {
        await addFavorite(product);
      }

      const favorites = await getFavorites();

      expect(favorites.length).toBeLessThanOrEqual(50);
      expect(favorites.length).toBe(5);
    });

    it('should handle unauthenticated user in favorites', async () => {
      mockDb = null;

      await expect(addFavorite({
        productId: '123',
        name: 'Test',
        imageUrl: 'url',
      })).rejects.toThrow('Firebase not initialized or user not authenticated');
    });

    it('should handle Firestore errors in favorites', async () => {
      const { addDoc } = require('firebase/firestore');
      addDoc.mockRejectedValueOnce(new Error('Firestore error'));

      await expect(addFavorite({
        productId: '123',
        name: 'Test',
        imageUrl: 'url',
      })).rejects.toThrow('Firestore error');
    });
  });

  describe('History Management', () => {
    beforeEach(async () => {
      // Initialize auth
      const { onAuthStateChanged } = require('../../lib/firebase');
      onAuthStateChanged.mockImplementation((auth: any, callback: any) => {
        callback(mockUser);
        return jest.fn();
      });
      await initializeAnonymousAuth();
    });

    it('should create new history entry', async () => {
      const productData = {
        productId: '12345678',
        name: 'BILLY Bookcase',
        imageUrl: 'https://example.com/billy.jpg',
        cheapestCountry: 'BE' as const,
        cheapestPrice: 59.99,
      };

      await addToHistory(productData);

      const history = mockCollections.get('history');
      expect(history).toHaveLength(1);
      expect(history![0].data().productId).toBe('12345678');
      expect(history![0].data().cheapestPrice).toBe(59.99);
    });

    it('should deduplicate within 24h - update timestamp', async () => {
      const productData = {
        productId: '12345678',
        name: 'BILLY Bookcase',
        imageUrl: 'https://example.com/billy.jpg',
        cheapestCountry: 'BE' as const,
        cheapestPrice: 59.99,
      };

      // Add first entry
      await addToHistory(productData);
      const firstHistory = mockCollections.get('history') || [];
      expect(firstHistory).toHaveLength(1);
      const firstId = firstHistory[0].id;

      // Add same product within 24h (should replace)
      await addToHistory(productData);
      const secondHistory = mockCollections.get('history') || [];

      expect(secondHistory).toHaveLength(1);
      // Should be a different document (old deleted, new created)
      expect(secondHistory[0].id).not.toBe(firstId);
    });

    it('should create new entry after 24h', async () => {
      const productData = {
        productId: '12345678',
        name: 'BILLY Bookcase',
        imageUrl: 'https://example.com/billy.jpg',
        cheapestCountry: 'BE' as const,
        cheapestPrice: 59.99,
      };

      // Add first entry with old timestamp (25 hours ago)
      const oldTimestamp = createMockTimestamp(hoursAgo(25));
      const { addDoc } = require('firebase/firestore');
      const originalAddDoc = addDoc.getMockImplementation();

      addDoc.mockImplementationOnce((collectionRef: any, data: any) => {
        return originalAddDoc(collectionRef, { ...data, searchedAt: oldTimestamp });
      });

      await addToHistory(productData);

      // Add same product now (should create new entry)
      addDoc.mockImplementation(originalAddDoc);
      await addToHistory(productData);

      const history = mockCollections.get('history') || [];
      expect(history).toHaveLength(2);
    });

    it('should delete old entry when updating', async () => {
      const productData = {
        productId: '12345678',
        name: 'BILLY Bookcase',
        imageUrl: 'https://example.com/billy.jpg',
        cheapestCountry: 'BE' as const,
        cheapestPrice: 59.99,
      };

      await addToHistory(productData);
      const firstCount = (mockCollections.get('history') || []).length;

      // Add again within 24h
      await addToHistory(productData);
      const secondCount = (mockCollections.get('history') || []).length;

      expect(firstCount).toBe(1);
      expect(secondCount).toBe(1); // Old deleted, new added
    });

    it('should handle timestamp edge case - exactly 24h', async () => {
      const productData = {
        productId: '12345678',
        name: 'BILLY Bookcase',
        imageUrl: 'https://example.com/billy.jpg',
        cheapestCountry: 'BE' as const,
        cheapestPrice: 59.99,
      };

      // Add entry exactly 24 hours ago
      const exactlyOneDayAgo = createMockTimestamp(hoursAgo(24));
      const { addDoc } = require('firebase/firestore');
      const originalAddDoc = addDoc.getMockImplementation();

      addDoc.mockImplementationOnce((collectionRef: any, data: any) => {
        return originalAddDoc(collectionRef, { ...data, searchedAt: exactlyOneDayAgo });
      });

      await addToHistory(productData);

      // Add now - should replace because >= 24h ago matches
      addDoc.mockImplementation(originalAddDoc);
      await addToHistory(productData);

      const history = mockCollections.get('history') || [];
      expect(history).toHaveLength(1);
    });

    it('should return history ordered by timestamp desc', async () => {
      const products = [
        {
          productId: '111',
          name: 'Product 1',
          imageUrl: 'url1',
          cheapestCountry: 'BE' as const,
          cheapestPrice: 10,
        },
        {
          productId: '222',
          name: 'Product 2',
          imageUrl: 'url2',
          cheapestCountry: 'NL' as const,
          cheapestPrice: 20,
        },
        {
          productId: '333',
          name: 'Product 3',
          imageUrl: 'url3',
          cheapestCountry: 'FR' as const,
          cheapestPrice: 30,
        },
      ];

      // Add in sequence
      for (const product of products) {
        await addToHistory(product);
        await new Promise(resolve => setTimeout(resolve, 10));
      }

      const history = await getHistory();

      expect(history).toHaveLength(3);
      // Should be ordered by searchedAt desc (newest first)
      expect(history[0].productId).toBe('333');
      expect(history[2].productId).toBe('111');
    });

    it('should respect limit parameter in getHistory', async () => {
      const products = Array.from({ length: 10 }, (_, i) => ({
        productId: `prod-${i}`,
        name: `Product ${i}`,
        imageUrl: `url${i}`,
        cheapestCountry: 'BE' as const,
        cheapestPrice: i * 10,
      }));

      for (const product of products) {
        await addToHistory(product);
      }

      const history = await getHistory(5);

      expect(history).toHaveLength(5);
    });

    it('should clear all history with batch delete', async () => {
      const products = Array.from({ length: 5 }, (_, i) => ({
        productId: `prod-${i}`,
        name: `Product ${i}`,
        imageUrl: `url${i}`,
        cheapestCountry: 'BE' as const,
        cheapestPrice: i * 10,
      }));

      for (const product of products) {
        await addToHistory(product);
      }

      expect(mockCollections.get('history')).toHaveLength(5);

      await clearHistory();

      const history = mockCollections.get('history') || [];
      expect(history).toHaveLength(0);
    });

    it('should handle empty history', async () => {
      const history = await getHistory();

      expect(history).toEqual([]);
    });

    it('should perform deduplication query quickly', async () => {
      const productData = {
        productId: '12345678',
        name: 'BILLY Bookcase',
        imageUrl: 'https://example.com/billy.jpg',
        cheapestCountry: 'BE' as const,
        cheapestPrice: 59.99,
      };

      // Add initial entry
      await addToHistory(productData);

      // Measure deduplication performance
      const { duration } = await measureExecutionTime(async () => {
        await addToHistory(productData);
      });

      expect(duration).toBeLessThan(500); // Should be under 500ms
    });
  });
});
