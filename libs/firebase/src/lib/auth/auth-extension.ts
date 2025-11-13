/**
 * Extension-specific Firebase Auth module
 * Uses firebase/auth/web-extension which is designed for Chrome extensions
 * Does NOT contain remote code references - Chrome Web Store compliant
 */
import { getAuth, Auth } from 'firebase/auth/web-extension';
import { FirebaseApp } from 'firebase/app';

/**
 * Initialize Firebase Auth for Chrome extensions
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
} from 'firebase/auth/web-extension';
