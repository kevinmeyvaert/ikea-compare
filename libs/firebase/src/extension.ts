/**
 * Extension entry point - Chrome Web Store compliant
 * Uses firebase/auth/web-extension module which does NOT contain remote code
 *
 * Usage in Chrome extension:
 * import { ... } from '@ikea-compare/firebase/extension';
 */

// Firebase core (extension version with web-extension auth)
export * from './lib/firebase-extension';
export { initializeFirebaseServices, logAnalyticsEvent, isAnalyticsEnabled } from './lib/firebase-extension';
export type { FirebaseInitOptions } from './lib/firebase-extension';

// Auth functions and types (from extension auth module)
export { signInAnonymously, onAuthStateChanged, type User, type Auth } from './lib/firebase-extension';

// Analytics (limited in extensions)
export * from './lib/analytics/analytics-service';

// Stores (reusable)
export * from './lib/stores/store-manager';

// User Data (reusable)
export * from './lib/user-data/user-data-manager';

// Note: useAuth hook is 'use client' and may not work in extension contexts
// Export it but use with caution
export * from './lib/user-data/useAuth';

// Firebase-specific types (reusable)
export * from './lib/types/shopping-list-types';
export * from './lib/types/user-data-types';
