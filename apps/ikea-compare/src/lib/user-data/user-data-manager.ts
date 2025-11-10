import {
  collection,
  addDoc,
  deleteDoc,
  doc,
  query,
  where,
  orderBy,
  limit,
  getDocs,
  Timestamp,
} from 'firebase/firestore';
import { signInAnonymously, onAuthStateChanged, User } from 'firebase/auth';
import { db, auth } from '../firebase';
import { FavoriteProduct, HistoryEntry, ProductData } from './types';

let currentUser: User | null = null;

/**
 * Initialize anonymous authentication
 * This should be called when the app loads
 */
export async function initializeAnonymousAuth(): Promise<User | null> {
  if (!auth) {
    console.error('[Auth] Firebase Auth not initialized');
    return null;
  }

  console.log('[Auth] Initializing anonymous authentication...');
  const authInstance = auth; // Store in a const to help TypeScript understand it's not null
  return new Promise((resolve) => {
    // Check if user is already signed in
    onAuthStateChanged(authInstance, async (user) => {
      if (user) {
        console.log('[Auth] User already signed in:', user.uid);
        currentUser = user;
        resolve(user);
      } else {
        // Sign in anonymously if not already signed in
        console.log('[Auth] No user found, signing in anonymously...');
        try {
          const userCredential = await signInAnonymously(authInstance);
          currentUser = userCredential.user;
          console.log('[Auth] Anonymous sign-in successful:', currentUser.uid);
          resolve(userCredential.user);
        } catch (error) {
          console.error('[Auth] Error signing in anonymously:', error);
          resolve(null);
        }
      }
    });
  });
}

/**
 * Get the current user ID
 */
export function getCurrentUserId(): string | null {
  const userId = currentUser?.uid || null;
  console.log('[Auth] getCurrentUserId called, returning:', userId);
  return userId;
}

// ==================== FAVORITES ====================

/**
 * Add a product to favorites
 */
export async function addFavorite(productData: ProductData): Promise<void> {
  if (!db || !currentUser) {
    throw new Error('Firebase not initialized or user not authenticated');
  }

  // Check if already favorited
  const exists = await isFavorite(productData.productId);
  if (exists) {
    console.log('Product already in favorites');
    return;
  }

  const favoritesRef = collection(db, 'favorites');
  await addDoc(favoritesRef, {
    userId: currentUser.uid,
    productId: productData.productId,
    name: productData.name,
    imageUrl: productData.imageUrl,
    addedAt: Timestamp.now(),
  });
}

/**
 * Remove a product from favorites
 */
export async function removeFavorite(productId: string): Promise<void> {
  if (!db || !currentUser) {
    throw new Error('Firebase not initialized or user not authenticated');
  }

  const favoritesRef = collection(db, 'favorites');
  const q = query(
    favoritesRef,
    where('userId', '==', currentUser.uid),
    where('productId', '==', productId)
  );

  const querySnapshot = await getDocs(q);
  const deletePromises = querySnapshot.docs.map((document) =>
    deleteDoc(doc(db!, 'favorites', document.id))
  );

  await Promise.all(deletePromises);
}

/**
 * Check if a product is in favorites
 */
export async function isFavorite(productId: string): Promise<boolean> {
  if (!db || !currentUser) {
    return false;
  }

  const favoritesRef = collection(db, 'favorites');
  const q = query(
    favoritesRef,
    where('userId', '==', currentUser.uid),
    where('productId', '==', productId),
    limit(1)
  );

  const querySnapshot = await getDocs(q);
  return !querySnapshot.empty;
}

/**
 * Get all favorites for the current user
 */
export async function getFavorites(): Promise<FavoriteProduct[]> {
  console.log('[Favorites] getFavorites called');
  if (!db || !currentUser) {
    console.log('[Favorites] No db or currentUser:', { db: !!db, currentUser: !!currentUser });
    return [];
  }

  console.log('[Favorites] Querying favorites for user:', currentUser.uid);
  const favoritesRef = collection(db, 'favorites');
  const q = query(
    favoritesRef,
    where('userId', '==', currentUser.uid),
    orderBy('addedAt', 'desc'),
    limit(50) // Limit to 50 favorites
  );

  const querySnapshot = await getDocs(q);
  const results = querySnapshot.docs.map((document) => ({
    id: document.id,
    ...(document.data() as Omit<FavoriteProduct, 'id'>),
  }));
  console.log('[Favorites] Query returned', results.length, 'items');
  return results;
}

// ==================== HISTORY ====================

/**
 * Add a search to history
 * If the product was searched recently (within 24h), update the timestamp instead of creating a new entry
 */
export async function addToHistory(productData: ProductData): Promise<void> {
  if (!db || !currentUser) {
    throw new Error('Firebase not initialized or user not authenticated');
  }

  const historyRef = collection(db, 'history');

  // Check if product was searched recently (last 24 hours)
  const oneDayAgo = new Date();
  oneDayAgo.setHours(oneDayAgo.getHours() - 24);

  const recentQuery = query(
    historyRef,
    where('userId', '==', currentUser.uid),
    where('productId', '==', productData.productId),
    where('searchedAt', '>=', Timestamp.fromDate(oneDayAgo))
  );

  const recentSnapshot = await getDocs(recentQuery);

  if (!recentSnapshot.empty) {
    // Update existing entry's timestamp
    const docToUpdate = recentSnapshot.docs[0];
    const docRef = doc(db, 'history', docToUpdate.id);
    await deleteDoc(docRef);
  }

  // Add new entry
  await addDoc(historyRef, {
    userId: currentUser.uid,
    productId: productData.productId,
    name: productData.name,
    imageUrl: productData.imageUrl,
    searchedAt: Timestamp.now(),
    cheapestCountry: productData.cheapestCountry,
    cheapestPrice: productData.cheapestPrice,
  });
}

/**
 * Get search history for the current user
 */
export async function getHistory(limitCount: number = 20): Promise<HistoryEntry[]> {
  console.log('[History] getHistory called with limit:', limitCount);
  if (!db || !currentUser) {
    console.log('[History] No db or currentUser:', { db: !!db, currentUser: !!currentUser });
    return [];
  }

  console.log('[History] Querying history for user:', currentUser.uid);
  const historyRef = collection(db, 'history');
  const q = query(
    historyRef,
    where('userId', '==', currentUser.uid),
    orderBy('searchedAt', 'desc'),
    limit(limitCount)
  );

  const querySnapshot = await getDocs(q);
  const results = querySnapshot.docs.map((document) => ({
    id: document.id,
    ...(document.data() as Omit<HistoryEntry, 'id'>),
  }));
  console.log('[History] Query returned', results.length, 'items');
  return results;
}

/**
 * Clear all history for the current user
 */
export async function clearHistory(): Promise<void> {
  if (!db || !currentUser) {
    throw new Error('Firebase not initialized or user not authenticated');
  }

  const historyRef = collection(db, 'history');
  const q = query(historyRef, where('userId', '==', currentUser.uid));

  const querySnapshot = await getDocs(q);
  const deletePromises = querySnapshot.docs.map((document) =>
    deleteDoc(doc(db!, 'history', document.id))
  );

  await Promise.all(deletePromises);
}
