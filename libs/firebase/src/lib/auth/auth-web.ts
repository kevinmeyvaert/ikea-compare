/**
 * Web-specific Firebase Auth module
 * Uses firebase/auth which is suitable for web applications
 * NOT compatible with Chrome extensions (contains remote code references)
 */
import { getAuth, Auth } from 'firebase/auth';
import { FirebaseApp } from 'firebase/app';

/**
 * Initialize Firebase Auth for web applications
 */
export function initializeAuth(app: FirebaseApp): Auth {
  return getAuth(app);
}

// Re-export auth functions for convenience
export {
  signInAnonymously,
  onAuthStateChanged,
  type User,
  type Auth,
} from 'firebase/auth';
