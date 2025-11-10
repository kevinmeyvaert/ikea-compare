import { useState, useEffect } from 'react';
import { onAuthStateChanged, User } from 'firebase/auth';
import { auth } from '../firebase';

/**
 * Custom hook to track Firebase auth state
 * Returns true when user is authenticated (including anonymous)
 */
export function useAuth(): boolean {
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  useEffect(() => {
    if (!auth) {
      console.log('[useAuth] Firebase Auth not available');
      return;
    }

    console.log('[useAuth] Setting up auth state listener');
    const unsubscribe = onAuthStateChanged(auth, (user: User | null) => {
      console.log('[useAuth] Auth state changed:', user ? `User ${user.uid}` : 'No user');
      setIsAuthenticated(!!user);
    });

    return () => {
      console.log('[useAuth] Cleaning up auth state listener');
      unsubscribe();
    };
  }, []);

  return isAuthenticated;
}
