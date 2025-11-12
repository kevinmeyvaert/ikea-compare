// Firebase core
export * from './lib/firebase';
export { initializeFirebaseServices, logAnalyticsEvent, isAnalyticsEnabled } from './lib/firebase';
export type { FirebaseInitOptions } from './lib/firebase';

// Analytics
export * from './lib/analytics/analytics-service';

// Stores
export * from './lib/stores/store-manager';

// User Data
export * from './lib/user-data/user-data-manager';
export * from './lib/user-data/useAuth';

// Firebase-specific types only
export * from './lib/types/shopping-list-types';
export * from './lib/types/user-data-types';
