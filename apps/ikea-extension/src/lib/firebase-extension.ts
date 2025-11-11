// Firebase initialization for Chrome extension
// Uses web-extension specific auth module
import { initializeApp, FirebaseApp } from "firebase/app";
import { getFirestore, Firestore } from "firebase/firestore";
import { getAuth as getWebExtensionAuth, Auth } from "firebase/auth/web-extension";

// Firebase configuration - webpack will replace process.env values at build time
const firebaseConfig = {
  apiKey: process.env.FIREBASE_API_KEY || '',
  authDomain: process.env.FIREBASE_AUTH_DOMAIN || '',
  projectId: process.env.FIREBASE_PROJECT_ID || '',
  storageBucket: process.env.FIREBASE_STORAGE_BUCKET || '',
  messagingSenderId: process.env.FIREBASE_MESSAGING_SENDER_ID || '',
  appId: process.env.FIREBASE_APP_ID || '',
  measurementId: process.env.FIREBASE_MEASUREMENT_ID || '',
};

// Initialize Firebase app
const app: FirebaseApp = initializeApp(firebaseConfig);

// Initialize Firestore
const db: Firestore = getFirestore(app);

// Initialize Auth with web-extension module
const auth: Auth = getWebExtensionAuth(app);

console.log('[Firebase Extension] Initialized Firebase for Chrome extension');

export { app, db, auth };
