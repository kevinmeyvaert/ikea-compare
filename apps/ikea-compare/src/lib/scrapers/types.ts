import { StoreAvailability } from '../stores/types';

export interface ProductData {
  productId: string;
  name: string;
  price: number;
  currency: string;
  imageUrl: string;
  available: boolean;
  country: 'BE' | 'NL' | 'FR' | 'DE';
  url: string;
  storeAvailability?: StoreAvailability; // Store-specific availability data
}

export interface ProductComparisonResult {
  productId: string;
  products: {
    belgium: ProductData | null;
    netherlands: ProductData | null;
    france: ProductData | null;
    germany: ProductData | null;
  };
  cheapest: ('BE' | 'NL' | 'FR' | 'DE')[] | null;
  error?: string;
}

export interface ScraperError {
  country: string;
  message: string;
  productId: string;
}
