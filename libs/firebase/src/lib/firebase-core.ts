/**
 * Core Firebase initialization
 * Shared between web and extension versions
 * Does NOT include auth initialization (handled separately)
 */
import { initializeApp, FirebaseApp } from "firebase/app";
import { getAnalytics, Analytics, logEvent as firebaseLogEvent } from "firebase/analytics";
import { getFirestore, Firestore, enableIndexedDbPersistence } from "firebase/firestore";

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

// Your web app's Firebase configuration
export const firebaseConfig: FirebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY || process.env.FIREBASE_API_KEY || '',
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN || process.env.FIREBASE_AUTH_DOMAIN || '',
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID || process.env.FIREBASE_PROJECT_ID || '',
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET || process.env.FIREBASE_STORAGE_BUCKET || '',
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID || process.env.FIREBASE_MESSAGING_SENDER_ID || '',
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID || process.env.FIREBASE_APP_ID || '',
  measurementId: process.env.NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID || process.env.FIREBASE_MEASUREMENT_ID || '',
};

// Initialize Firebase app
export const app: FirebaseApp = initializeApp(firebaseConfig);

// Initialize Firestore
export let db: Firestore | null = null;
export let analytics: Analytics | null = null;

/**
 * Initialize Firestore with offline persistence
 */
export function initializeFirestore(): Firestore {
  if (db) {
    return db;
  }

  db = getFirestore(app);

  // Enable offline persistence for Firestore
  if (db && typeof window !== 'undefined') {
    enableIndexedDbPersistence(db).catch((err) => {
      if (err.code === 'failed-precondition') {
        console.warn('Firestore persistence failed: Multiple tabs open');
      } else if (err.code === 'unimplemented') {
        console.warn('Firestore persistence not available in this browser');
      }
    });
  }

  return db;
}

/**
 * Initialize Firebase Analytics (web only)
 */
export function initializeAnalytics(): Analytics {
  if (analytics) {
    return analytics;
  }

  if (typeof window === 'undefined') {
    throw new Error('Analytics can only be initialized in browser environment');
  }

  analytics = getAnalytics(app);
  return analytics;
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
