'use client';

import { useEffect } from 'react';
import { initializeFirebaseServices } from '@ikea-compare/firebase';

/**
 * Client component to initialize Firebase with analytics enabled
 * This runs once when the app loads
 */
export function FirebaseInit() {
  useEffect(() => {
    // Initialize Firebase with analytics enabled for web app
    initializeFirebaseServices({ enableAnalytics: true });
  }, []);

  return null; // This component doesn't render anything
}
