/**
 * Firebase mocking utilities for testing
 * Provides builders for Firestore, Auth, and related Firebase objects
 */

import type { User } from 'firebase/auth';

// Types for our mocks
export interface MockFirestoreDoc {
  id: string;
  data: () => any;
  exists: boolean;
  ref: any;
  get: jest.Mock;
  set: jest.Mock;
  update: jest.Mock;
  delete: jest.Mock;
}

export interface MockFirestoreCollection {
  id: string;
  doc: jest.Mock;
  add: jest.Mock;
  get: jest.Mock;
  where: jest.Mock;
  orderBy: jest.Mock;
  limit: jest.Mock;
}

export interface MockFirestore {
  collection: jest.Mock;
  doc: jest.Mock;
  batch: jest.Mock;
  runTransaction: jest.Mock;
}

/**
 * Create a mock Firestore database instance
 */
export function createMockFirestore(): MockFirestore {
  const collections = new Map<string, any>();
  const documents = new Map<string, any>();

  return {
    collection: jest.fn((path: string) => {
      if (!collections.has(path)) {
        collections.set(path, createMockCollection(path));
      }
      return collections.get(path);
    }),
    doc: jest.fn((path: string) => {
      if (!documents.has(path)) {
        documents.set(path, createMockDocument(path, {}));
      }
      return documents.get(path);
    }),
    batch: jest.fn(() => createMockBatch()),
    runTransaction: jest.fn((callback) => callback({
      get: jest.fn(),
      set: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
    })),
  };
}

/**
 * Create a mock Firestore collection reference
 */
export function createMockCollection(id: string): MockFirestoreCollection {
  return {
    id,
    doc: jest.fn((docId?: string) => createMockDocument(docId || 'auto-id', {})),
    add: jest.fn((data) => Promise.resolve(createMockDocument('auto-id', data))),
    get: jest.fn(() => Promise.resolve(createMockQuerySnapshot([]))),
    where: jest.fn(function() { return this; }),
    orderBy: jest.fn(function() { return this; }),
    limit: jest.fn(function() { return this; }),
  };
}

/**
 * Create a mock Firestore document reference
 */
export function createMockDocument(id: string, data: any, existsValue = true): any {
  return {
    id,
    exists: () => existsValue,
    data: () => data,
    ref: { id, path: `mock/${id}` },
    get: jest.fn(() => Promise.resolve({
      id,
      exists: () => existsValue,
      data: () => data,
      ref: { id },
    })),
    set: jest.fn((newData) => {
      Object.assign(data, newData);
      return Promise.resolve();
    }),
    update: jest.fn((updates) => {
      Object.assign(data, updates);
      return Promise.resolve();
    }),
    delete: jest.fn(() => Promise.resolve()),
  };
}

/**
 * Create a mock Firestore batch
 */
export function createMockBatch() {
  const operations: any[] = [];

  return {
    set: jest.fn((ref, data) => {
      operations.push({ type: 'set', ref, data });
    }),
    update: jest.fn((ref, data) => {
      operations.push({ type: 'update', ref, data });
    }),
    delete: jest.fn((ref) => {
      operations.push({ type: 'delete', ref });
    }),
    commit: jest.fn(() => Promise.resolve()),
    _operations: operations, // For testing purposes
  };
}

/**
 * Create a mock QuerySnapshot
 */
export function createMockQuerySnapshot(docs: any[]) {
  return {
    empty: docs.length === 0,
    size: docs.length,
    docs,
    forEach: (callback: (doc: any) => void) => docs.forEach(callback),
  };
}

/**
 * Create a mock DocumentSnapshot
 */
export function createMockDocumentSnapshot(id: string, data: any, exists = true) {
  return {
    id,
    exists,
    data: () => data,
    ref: { id, path: `mock/${id}` },
    get: (field: string) => data?.[field],
  };
}

/**
 * Create a mock Firebase user
 */
export function createMockUser(overrides: Partial<User> = {}): User {
  return {
    uid: 'test-uid-123',
    email: null,
    emailVerified: false,
    isAnonymous: true,
    displayName: null,
    photoURL: null,
    phoneNumber: null,
    metadata: {
      creationTime: new Date().toISOString(),
      lastSignInTime: new Date().toISOString(),
    },
    providerData: [],
    providerId: 'firebase',
    refreshToken: '',
    tenantId: null,
    delete: jest.fn(),
    getIdToken: jest.fn(() => Promise.resolve('mock-token')),
    getIdTokenResult: jest.fn(),
    reload: jest.fn(),
    toJSON: jest.fn(() => ({})),
    ...overrides,
  } as any;
}

/**
 * Create a mock Firebase Auth instance
 */
export function createMockAuth(user: User | null = null) {
  let currentUser = user;
  const stateChangeListeners: Array<(user: User | null) => void> = [];

  return {
    currentUser,
    onAuthStateChanged: jest.fn((callback) => {
      stateChangeListeners.push(callback);
      callback(currentUser);
      return () => {
        const index = stateChangeListeners.indexOf(callback);
        if (index > -1) stateChangeListeners.splice(index, 1);
      };
    }),
    signInAnonymously: jest.fn(() => {
      currentUser = createMockUser();
      stateChangeListeners.forEach(listener => listener(currentUser));
      return Promise.resolve({ user: currentUser });
    }),
    signOut: jest.fn(() => {
      currentUser = null;
      stateChangeListeners.forEach(listener => listener(null));
      return Promise.resolve();
    }),
    _setCurrentUser: (user: User | null) => {
      currentUser = user;
      stateChangeListeners.forEach(listener => listener(user));
    },
  };
}

/**
 * Create a mock Firestore Timestamp
 */
export function createMockTimestamp(date: Date = new Date()) {
  return {
    seconds: Math.floor(date.getTime() / 1000),
    nanoseconds: (date.getTime() % 1000) * 1000000,
    toDate: () => date,
    toMillis: () => date.getTime(),
    isEqual: (other: any) => date.getTime() === other.toMillis(),
  };
}

/**
 * Mock Firebase serverTimestamp
 */
export const mockServerTimestamp = () => createMockTimestamp();

/**
 * Helper to create a mock Firestore database with pre-populated data
 */
export function createMockFirestoreWithData(data: Record<string, Record<string, any>>) {
  const db = createMockFirestore();

  // Override collection to return collections with pre-populated data
  const originalCollection = db.collection;
  db.collection = jest.fn((path: string) => {
    const collection = originalCollection(path);

    if (data[path]) {
      collection.get = jest.fn(() => {
        const docs = Object.entries(data[path]).map(([id, docData]) =>
          createMockDocumentSnapshot(id, docData, true)
        );
        return Promise.resolve(createMockQuerySnapshot(docs));
      });
    }

    return collection;
  });

  return db;
}

/**
 * Helper to wait for async operations in tests
 */
export const flushPromises = () => new Promise(resolve => setImmediate(resolve));
