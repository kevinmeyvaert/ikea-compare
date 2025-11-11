import { IkeaStore, StorePreferences } from '@ikea-compare/types';

/**
 * Get list of IKEA stores for a specific country
 * Uses ikea-availability-checker package data
 */
export function getStoresByCountry(countryCode: 'BE' | 'NL' | 'FR' | 'DE'): IkeaStore[] {
  // Note: This is a simplified list. In production, we'd use ikea-availability-checker
  // For now, including commonly used stores

  const stores: Record<'BE' | 'NL' | 'FR' | 'DE', IkeaStore[]> = {
    BE: [
      { buCode: '169', name: 'IKEA Gent', city: 'Ghent', countryCode: 'BE', country: 'Belgium' },
      { buCode: '179', name: 'IKEA Wilrijk', city: 'Antwerp', countryCode: 'BE', country: 'Belgium' },
      { buCode: '375', name: 'IKEA Liège', city: 'Liège', countryCode: 'BE', country: 'Belgium' },
      { buCode: '376', name: 'IKEA Zaventem', city: 'Brussels', countryCode: 'BE', country: 'Belgium' },
      { buCode: '423', name: 'IKEA Mons', city: 'Mons', countryCode: 'BE', country: 'Belgium' },
      { buCode: '452', name: 'IKEA Hasselt', city: 'Hasselt', countryCode: 'BE', country: 'Belgium' },
      { buCode: '482', name: 'IKEA Anderlecht', city: 'Brussels', countryCode: 'BE', country: 'Belgium' },
      { buCode: '483', name: 'IKEA Arlon', city: 'Arlon', countryCode: 'BE', country: 'Belgium' },
    ],
    NL: [
      { buCode: '087', name: 'IKEA Eindhoven', city: 'Eindhoven', countryCode: 'NL', country: 'Netherlands' },
      { buCode: '088', name: 'IKEA Amsterdam', city: 'Amsterdam', countryCode: 'NL', country: 'Netherlands' },
      { buCode: '089', name: 'IKEA Heerlen', city: 'Heerlen', countryCode: 'NL', country: 'Netherlands' },
      { buCode: '151', name: 'IKEA Delft', city: 'Delft', countryCode: 'NL', country: 'Netherlands' },
      { buCode: '270', name: 'IKEA Utrecht', city: 'Utrecht', countryCode: 'NL', country: 'Netherlands' },
      { buCode: '272', name: 'IKEA Duiven', city: 'Duiven', countryCode: 'NL', country: 'Netherlands' },
      { buCode: '274', name: 'IKEA Barendrecht', city: 'Barendrecht', countryCode: 'NL', country: 'Netherlands' },
      { buCode: '312', name: 'IKEA Hengelo', city: 'Hengelo', countryCode: 'NL', country: 'Netherlands' },
      { buCode: '378', name: 'IKEA Haarlem', city: 'Haarlem', countryCode: 'NL', country: 'Netherlands' },
      { buCode: '391', name: 'IKEA Zwolle', city: 'Zwolle', countryCode: 'NL', country: 'Netherlands' },
      { buCode: '403', name: 'IKEA Breda', city: 'Breda', countryCode: 'NL', country: 'Netherlands' },
      { buCode: '404', name: 'IKEA Groningen', city: 'Groningen', countryCode: 'NL', country: 'Netherlands' },
      { buCode: '415', name: 'IKEA Amersfoort', city: 'Amersfoort', countryCode: 'NL', country: 'Netherlands' },
    ],
    FR: [
      { buCode: '018', name: 'IKEA Avignon', city: 'Avignon', countryCode: 'FR', country: 'France' },
      { buCode: '051', name: 'IKEA Hénin-Beaumont', city: 'Hénin-Beaumont', countryCode: 'FR', country: 'France' },
      { buCode: '060', name: 'IKEA Brest', city: 'Brest', countryCode: 'FR', country: 'France' },
      { buCode: '082', name: 'IKEA Evry', city: 'Evry', countryCode: 'FR', country: 'France' },
      { buCode: '083', name: 'IKEA Plaisir', city: 'Plaisir', countryCode: 'FR', country: 'France' },
      { buCode: '086', name: 'IKEA Dijon', city: 'Dijon', countryCode: 'FR', country: 'France' },
      { buCode: '130', name: 'IKEA Vitrolles', city: 'Vitrolles', countryCode: 'FR', country: 'France' },
      { buCode: '131', name: 'IKEA Paris Nord', city: 'Paris', countryCode: 'FR', country: 'France' },
      { buCode: '133', name: 'IKEA Lille', city: 'Lille', countryCode: 'FR', country: 'France' },
      { buCode: '134', name: 'IKEA Bordeaux', city: 'Bordeaux', countryCode: 'FR', country: 'France' },
      { buCode: '163', name: 'IKEA Rouen', city: 'Rouen', countryCode: 'FR', country: 'France' },
      { buCode: '177', name: 'IKEA Rennes', city: 'Rennes', countryCode: 'FR', country: 'France' },
      { buCode: '198', name: 'IKEA Reims', city: 'Reims', countryCode: 'FR', country: 'France' },
      { buCode: '199', name: 'IKEA Caen', city: 'Caen', countryCode: 'FR', country: 'France' },
      { buCode: '239', name: 'IKEA Strasbourg', city: 'Strasbourg', countryCode: 'FR', country: 'France' },
      { buCode: '240', name: 'IKEA Villiers', city: 'Villiers-sur-Marne', countryCode: 'FR', country: 'France' },
      { buCode: '242', name: 'IKEA Toulouse', city: 'Toulouse', countryCode: 'FR', country: 'France' },
      { buCode: '260', name: 'IKEA Metz', city: 'Metz', countryCode: 'FR', country: 'France' },
      { buCode: '285', name: 'IKEA Vélizy', city: 'Vélizy', countryCode: 'FR', country: 'France' },
      { buCode: '310', name: 'IKEA Bayonne', city: 'Bayonne', countryCode: 'FR', country: 'France' },
      { buCode: '315', name: 'IKEA Toulon', city: 'Toulon', countryCode: 'FR', country: 'France' },
      { buCode: '316', name: 'IKEA Nantes', city: 'Nantes', countryCode: 'FR', country: 'France' },
      { buCode: '345', name: 'IKEA Clermont-Ferrand', city: 'Clermont-Ferrand', countryCode: 'FR', country: 'France' },
      { buCode: '389', name: 'IKEA Franconville', city: 'Franconville', countryCode: 'FR', country: 'France' },
      { buCode: '402', name: 'IKEA Montpellier', city: 'Montpellier', countryCode: 'FR', country: 'France' },
      { buCode: '431', name: 'IKEA Saint-Étienne', city: 'Saint-Étienne', countryCode: 'FR', country: 'France' },
      { buCode: '432', name: 'IKEA Thiais', city: 'Thiais', countryCode: 'FR', country: 'France' },
      { buCode: '433', name: 'IKEA La Valentine', city: 'Marseille', countryCode: 'FR', country: 'France' },
      { buCode: '434', name: 'IKEA Tours', city: 'Tours', countryCode: 'FR', country: 'France' },
      { buCode: '435', name: 'IKEA Grenoble', city: 'Grenoble', countryCode: 'FR', country: 'France' },
      { buCode: '444', name: 'IKEA Mulhouse', city: 'Mulhouse', countryCode: 'FR', country: 'France' },
      { buCode: '487', name: 'IKEA Orléans', city: 'Orléans', countryCode: 'FR', country: 'France' },
      { buCode: '518', name: 'IKEA Nice', city: 'Nice', countryCode: 'FR', country: 'France' },
      { buCode: '562', name: 'IKEA Lyon', city: 'Lyon', countryCode: 'FR', country: 'France' },
      { buCode: '645', name: 'IKEA Rivoli', city: 'Paris', countryCode: 'FR', country: 'France' },
      { buCode: '719', name: 'IKEA Italie Deux', city: 'Paris', countryCode: 'FR', country: 'France' },
    ],
    DE: [
      { buCode: '102', name: 'IKEA Köln-Am Butzweilerhof', city: 'Cologne', countryCode: 'DE', country: 'Germany' },
      { buCode: '147', name: 'IKEA Köln-Godorf', city: 'Cologne', countryCode: 'DE', country: 'Germany' },
      { buCode: '321', name: 'IKEA Düsseldorf', city: 'Düsseldorf', countryCode: 'DE', country: 'Germany' },
      { buCode: '425', name: 'IKEA Duisburg', city: 'Duisburg', countryCode: 'DE', country: 'Germany' },
      { buCode: '148', name: 'IKEA Essen', city: 'Essen', countryCode: 'DE', country: 'Germany' },
      { buCode: '223', name: 'IKEA Dortmund', city: 'Dortmund', countryCode: 'DE', country: 'Germany' },
      { buCode: '184', name: 'IKEA Osnabrück', city: 'Osnabrück', countryCode: 'DE', country: 'Germany' },
      { buCode: '494', name: 'IKEA Kaarst', city: 'Kaarst', countryCode: 'DE', country: 'Germany' },
    ],
  };

  return stores[countryCode] || [];
}

/**
 * Get all stores across all supported countries
 */
export function getAllStores(): IkeaStore[] {
  return [
    ...getStoresByCountry('BE'),
    ...getStoresByCountry('NL'),
    ...getStoresByCountry('FR'),
    ...getStoresByCountry('DE'),
  ];
}

/**
 * Default store codes for each country
 */
const DEFAULT_STORES = {
  BE: '169', // IKEA Gent
  NL: '403', // IKEA Breda
  FR: '133', // IKEA Lille
  DE: '494', // IKEA Kaarst
};

/**
 * Get selected store for a specific country
 * Returns default store if no preference is saved
 * Note: For Chrome extension, this will need to use chrome.storage API
 */
export function getSelectedStoreSync(countryCode: 'BE' | 'NL' | 'FR' | 'DE'): IkeaStore {
  const buCode = DEFAULT_STORES[countryCode];
  const stores = getStoresByCountry(countryCode);
  return stores.find(store => store.buCode === buCode) || stores[0];
}

/**
 * Get store by buCode
 */
export function getStoreByBuCode(buCode: string): IkeaStore | null {
  const allStores = getAllStores();
  return allStores.find(store => store.buCode === buCode) || null;
}
