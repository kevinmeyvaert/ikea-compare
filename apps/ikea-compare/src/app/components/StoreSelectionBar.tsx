'use client';

import { useState, useEffect } from 'react';
import StoreSelector from './StoreSelector';
import { getStoresByCountry, getSelectedStore, setSelectedStore } from '../../lib/stores/store-manager';
import { IkeaStore } from '../../lib/stores/types';

interface StoreSelectionBarProps {
  onStoreChange?: () => void;
}

export default function StoreSelectionBar({ onStoreChange }: StoreSelectionBarProps) {
  const [belgiumStore, setBelgiumStore] = useState<IkeaStore | null>(null);
  const [_netherlandsStore, setNetherlandsStore] = useState<IkeaStore | null>(null);
  const [_franceStore, setFranceStore] = useState<IkeaStore | null>(null);

  // Load saved preferences on mount, with defaults
  useEffect(() => {
    const loadStores = async () => {
      // Load stores (defaults are handled in store-manager)
      const beStore = await getSelectedStore('BE');
      setBelgiumStore(beStore);

      const nlStore = await getSelectedStore('NL');
      setNetherlandsStore(nlStore);

      const frStore = await getSelectedStore('FR');
      setFranceStore(frStore);
    };
    loadStores();
  }, []);

  const handleStoreSelect = async (countryCode: 'BE' | 'NL' | 'FR', buCode: string) => {
    await setSelectedStore(countryCode, buCode);

    // Update state
    const stores = getStoresByCountry(countryCode);
    const store = stores.find(s => s.buCode === buCode) || null;

    if (countryCode === 'BE') setBelgiumStore(store);
    if (countryCode === 'NL') setNetherlandsStore(store);
    if (countryCode === 'FR') setFranceStore(store);

    // Notify parent component
    if (onStoreChange) {
      onStoreChange();
    }
  };

  const countryFlags = {
    BE: '🇧🇪',
    NL: '🇳🇱',
    FR: '🇫🇷',
  };

  return (
    <div>
      <div className="mb-4">
        <h2 className="text-sm font-bold text-gray-900">Voorkeurswinkel</h2>
        <p className="text-xs text-gray-700 mt-1">
          Bekijk beschikbaarheid in geselecteerde winkels
        </p>
      </div>

      <div className="space-y-4">
        {/* Belgium */}
        <div>
          <label className="block text-xs font-bold text-gray-700 mb-2">
            <span className="text-lg mr-1">{countryFlags.BE}</span>
            België
          </label>
          <StoreSelector
            countryCode="BE"
            stores={getStoresByCountry('BE')}
            selectedStore={belgiumStore}
            onStoreSelect={(buCode) => handleStoreSelect('BE', buCode)}
            placeholder="Selecteer Belgische winkel..."
          />
        </div>

        {/* Netherlands - Fixed to Breda */}
        <div>
          <label className="block text-xs font-bold text-gray-700 mb-2">
            <span className="text-lg mr-1">{countryFlags.NL}</span>
            Nederland
          </label>
          <div className="w-full px-3 py-2 bg-gray-100 border border-gray-300 rounded cursor-not-allowed opacity-75">
            <div className="text-sm font-medium text-gray-900">IKEA Breda</div>
            <div className="text-xs text-gray-600">Breda</div>
          </div>
        </div>

        {/* France - Fixed to Lille */}
        <div>
          <label className="block text-xs font-bold text-gray-700 mb-2">
            <span className="text-lg mr-1">{countryFlags.FR}</span>
            Frankrijk
          </label>
          <div className="w-full px-3 py-2 bg-gray-100 border border-gray-300 rounded cursor-not-allowed opacity-75">
            <div className="text-sm font-medium text-gray-900">IKEA Lille</div>
            <div className="text-xs text-gray-600">Lille</div>
          </div>
        </div>
      </div>
    </div>
  );
}
