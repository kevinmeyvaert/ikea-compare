export interface IkeaStore {
  buCode: string;
  name: string;
  city: string;
  countryCode: 'BE' | 'NL' | 'FR';
  country: string;
}

export interface StoreAvailability {
  buCode: string;
  storeName: string;
  cashCarry: {
    quantity: number;
    available: boolean;
    stockLevel: 'HIGH_IN_STOCK' | 'MEDIUM_IN_STOCK' | 'LOW_IN_STOCK' | 'OUT_OF_STOCK' | 'UNKNOWN';
    restockDate?: string;
    restockQuantity?: number;
  };
  clickCollect: {
    quantity: number;
    available: boolean;
    stockLevel: 'HIGH_IN_STOCK' | 'MEDIUM_IN_STOCK' | 'LOW_IN_STOCK' | 'OUT_OF_STOCK' | 'UNKNOWN';
  };
  lastUpdated: string;
}

export interface StorePreferences {
  be?: string; // buCode for Belgium
  nl?: string; // buCode for Netherlands
  fr?: string; // buCode for France
}
