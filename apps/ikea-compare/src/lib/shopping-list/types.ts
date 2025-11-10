import { ProductData } from '../scrapers/types';

export interface ShoppingListProduct {
  productId: string;
  products: {
    belgium: ProductData | null;
    netherlands: ProductData | null;
    france: ProductData | null;
    germany: ProductData | null;
  };
  cheapest: 'BE' | 'NL' | 'FR' | 'DE' | null;
  cheapestPrice: number | null;
}

export interface StoreTotal {
  storeCode: 'BE' | 'NL' | 'FR' | 'DE';
  storeName: string;
  totalCost: number;
  availableProducts: number;
  unavailableProducts: number;
}

export interface MultiStoreStrategy {
  totalCost: number;
  savings: number;
  breakdown: {
    store: 'BE' | 'NL' | 'FR' | 'DE';
    storeName: string;
    productCount: number;
    subtotal: number;
    products: string[]; // product IDs
  }[];
}

export interface ShoppingListAnalysis {
  products: ShoppingListProduct[];
  singleStoreStrategy: {
    best: StoreTotal;
    all: StoreTotal[];
  };
  multiStoreStrategy: MultiStoreStrategy;
  totalProducts: number;
  successfullyFetched: number;
  failedProducts: string[];
}
