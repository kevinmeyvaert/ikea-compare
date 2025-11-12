// Import the functions you need from the SDKs you need
import { initializeApp, FirebaseApp } from "firebase/app";
import { getAnalytics, Analytics, logEvent as firebaseLogEvent } from "firebase/analytics";
import { getFirestore, Firestore, enableIndexedDbPersistence } from "firebase/firestore";
import { getAuth, Auth } from "firebase/auth";

// Firebase configuration interface
export interface FirebaseConfig {
  apiKey: string;
  authDomain: string;
  projectId: string;
  storageBucket: string;
  messagingSenderId: string;
  appId: string;
  measurementId: string;
}

// Firebase initialization options
export interface FirebaseInitOptions {
  enableAnalytics?: boolean;
}

// Your web app's Firebase configuration
const firebaseConfig: FirebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY || process.env.FIREBASE_API_KEY || '',
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN || process.env.FIREBASE_AUTH_DOMAIN || '',
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID || process.env.FIREBASE_PROJECT_ID || '',
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET || process.env.FIREBASE_STORAGE_BUCKET || '',
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID || process.env.FIREBASE_MESSAGING_SENDER_ID || '',
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID || process.env.FIREBASE_APP_ID || '',
  measurementId: process.env.NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID || process.env.FIREBASE_MEASUREMENT_ID || '',
};

// Initialize Firebase
const app: FirebaseApp = initializeApp(firebaseConfig);

// Initialize services only in browser environment
let analytics: Analytics | null = null;
let db: Firestore | null = null;
let auth: Auth | null = null;

// Track if Firebase services have been initialized
let isInitialized = false;

/**
 * Initialize Firebase services with optional analytics
 * Call this once at app startup
 */
export function initializeFirebaseServices(options: FirebaseInitOptions = {}) {
  if (isInitialized) {
    console.warn('Firebase services already initialized');
    return;
  }

  if (typeof window !== 'undefined') {
    // Only initialize analytics if explicitly enabled
    if (options.enableAnalytics) {
      try {
        analytics = getAnalytics(app);
        console.log('[Firebase] Analytics enabled');
      } catch (error) {
        console.warn('[Firebase] Failed to initialize analytics:', error);
      }
    } else {
      console.log('[Firebase] Analytics disabled');
    }

    db = getFirestore(app);
    auth = getAuth(app);

    // Enable offline persistence for Firestore
    if (db) {
      enableIndexedDbPersistence(db).catch((err) => {
        if (err.code === 'failed-precondition') {
          console.warn('Firestore persistence failed: Multiple tabs open');
        } else if (err.code === 'unimplemented') {
          console.warn('Firestore persistence not available in this browser');
        }
      });
    }

    isInitialized = true;
  }
}

/**
 * Safe analytics event logging
 * Only logs if analytics is enabled, otherwise silently ignores
 */
export function logAnalyticsEvent(eventName: string, eventParams?: Record<string, any>) {
  if (analytics) {
    try {
      firebaseLogEvent(analytics, eventName, eventParams);
    } catch (error) {
      console.warn('[Firebase] Failed to log analytics event:', error);
    }
  }
}

/**
 * Check if analytics is available
 */
export function isAnalyticsEnabled(): boolean {
  return analytics !== null;
}

// Auto-initialize for backward compatibility (with analytics disabled by default)
// This allows existing code to work, but analytics must be explicitly enabled
if (typeof window !== 'undefined' && !isInitialized) {
  initializeFirebaseServices({ enableAnalytics: false });
}

export { app, analytics, db, auth, firebaseConfig };
