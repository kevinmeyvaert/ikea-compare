import { Timestamp } from 'firebase/firestore';

/**
 * Represents a product that a user has favorited
 */
export interface FavoriteProduct {
  id: string;              // Firestore document ID
  userId: string;          // Firebase Auth user ID (anonymous or authenticated)
  productId: string;       // IKEA product ID (e.g., "002.638.50")
  name: string;            // Product name
  imageUrl: string;        // Product image URL
  addedAt: Timestamp;      // When the product was favorited
}

/**
 * Represents a product search in the user's history
 */
export interface HistoryEntry {
  id: string;              // Firestore document ID
  userId: string;          // Firebase Auth user ID (anonymous or authenticated)
  productId: string;       // IKEA product ID (e.g., "002.638.50")
  name: string;            // Product name
  imageUrl: string;        // Product image URL
  searchedAt: Timestamp;   // When the product was searched
  cheapestCountry?: 'BE' | 'NL' | 'FR' | 'DE';  // Which country had the best price
  cheapestPrice?: number;  // The lowest price found
}

/**
 * Data required to add a product to favorites or history
 */
export interface FavoriteProductData {
  productId: string;
  name: string;
  imageUrl: string;
  cheapestCountry?: 'BE' | 'NL' | 'FR' | 'DE';
  cheapestPrice?: number;
}
