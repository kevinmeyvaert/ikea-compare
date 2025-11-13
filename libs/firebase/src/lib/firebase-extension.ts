/**
 * Firebase module for Chrome extensions
 * Uses firebase/auth/web-extension which is Chrome Web Store compliant
 * Does NOT contain remote code references
 */
import { Auth } from "firebase/auth/web-extension";
import {
  app,
  db as coreDb,
  firebaseConfig,
  initializeFirestore,
  logAnalyticsEvent as coreLogAnalyticsEvent,
  isAnalyticsEnabled as coreIsAnalyticsEnabled,
} from './firebase-core';
import {
  initializeAuth,
  signInAnonymously,
  onAuthStateChanged,
  type User,
} from './auth/auth-extension';

// Re-export types and config
export type { FirebaseConfig } from './firebase-core';

// Re-export auth functions and types
export { signInAnonymously, onAuthStateChanged, type User, type Auth };

// Firebase initialization options
export interface FirebaseInitOptions {
  enableAnalytics?: boolean; // Note: Analytics not supported in extensions
}

// Initialize services only in browser environment
let analytics = null; // Analytics not supported in Chrome extensions
let db = coreDb;
let auth: Auth | null = null;

// Track if Firebase services have been initialized
let isInitialized = false;

/**
 * Initialize Firebase services for Chrome extension
 * Analytics is not supported in extensions and will be disabled
 */
export function initializeFirebaseServices(options: FirebaseInitOptions = {}) {
  if (isInitialized) {
    console.warn('Firebase services already initialized');
    return;
  }

  if (typeof window !== 'undefined' || typeof chrome !== 'undefined') {
    // Analytics not supported in extensions
    if (options.enableAnalytics) {
      console.warn('[Firebase Extension] Analytics is not supported in Chrome extensions');
    }

    // Initialize Firestore
    db = initializeFirestore();

    // Initialize Auth (extension version)
    auth = initializeAuth(app);

    isInitialized = true;
    console.log('[Firebase Extension] Services initialized (analytics disabled)');
  }
}

// Re-export analytics functions from core (no-op in extensions)
export const logAnalyticsEvent = coreLogAnalyticsEvent;
export const isAnalyticsEnabled = coreIsAnalyticsEnabled;

// Auto-initialize for backward compatibility
if ((typeof window !== 'undefined' || typeof chrome !== 'undefined') && !isInitialized) {
  initializeFirebaseServices({ enableAnalytics: false });
}

export { app, analytics, db, auth, firebaseConfig };
