'use client';

import { useState, useEffect } from 'react';
import StoreSelector from './StoreSelector';
import { getStoresByCountry, getSelectedStore, setSelectedStore } from '../../lib/stores/store-manager';
import { IkeaStore } from '../../lib/stores/types';

interface StoreSettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  onStoreChange?: () => void;
}

export default function StoreSettingsModal({ isOpen, onClose, onStoreChange }: StoreSettingsModalProps) {
  const [belgiumStore, setBelgiumStore] = useState<IkeaStore | null>(null);
  const [netherlandsStore, setNetherlandsStore] = useState<IkeaStore | null>(null);
  const [franceStore, setFranceStore] = useState<IkeaStore | null>(null);
  const [germanyStore, setGermanyStore] = useState<IkeaStore | null>(null);

  // Load saved preferences on mount and when modal opens
  useEffect(() => {
    if (isOpen) {
      // Load selected stores (defaults are handled in store-manager)
      const loadStores = async () => {
        const be = await getSelectedStore('BE');
        const nl = await getSelectedStore('NL');
        const fr = await getSelectedStore('FR');
        const de = await getSelectedStore('DE');
        setBelgiumStore(be);
        setNetherlandsStore(nl);
        setFranceStore(fr);
        setGermanyStore(de);
      };
      loadStores();
    }
  }, [isOpen]);

  const handleStoreSelect = async (countryCode: 'BE' | 'NL' | 'FR' | 'DE', buCode: string) => {
    await setSelectedStore(countryCode, buCode);

    // Update state
    const stores = getStoresByCountry(countryCode);
    const store = stores.find(s => s.buCode === buCode) || null;

    if (countryCode === 'BE') setBelgiumStore(store);
    if (countryCode === 'NL') setNetherlandsStore(store);
    if (countryCode === 'FR') setFranceStore(store);
    if (countryCode === 'DE') setGermanyStore(store);

    // Notify parent component
    if (onStoreChange) {
      onStoreChange();
    }
  };

  const countryFlags = {
    BE: '🇧🇪',
    NL: '🇳🇱',
    FR: '🇫🇷',
    DE: '🇩🇪',
  };

  if (!isOpen) return null;

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black bg-opacity-50 z-40"
        onClick={onClose}
      />

      {/* Modal */}
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
        <div className="bg-white border-2 border-black max-w-md w-full max-h-[90vh] overflow-y-auto">
          {/* Header */}
          <div className="sticky top-0 bg-black border-b-2 border-black px-6 py-4 flex items-center justify-between">
            <h2 className="text-lg font-bold text-white">Winkelinstellingen</h2>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-white transition-colors"
              aria-label="Sluit"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>

          {/* Content */}
          <div className="p-6">
            <div className="mb-4">
              <p className="text-sm text-gray-700">
                Selecteer je voorkeurswinkel per land om beschikbaarheid te controleren
              </p>
            </div>

            <div className="space-y-6">
              {/* Belgium */}
              <div>
                <label className="block text-sm font-bold text-gray-700 mb-2">
                  <span className="text-lg mr-1">{countryFlags.BE}</span>
                  België
                </label>
                <StoreSelector
                  countryCode="BE"
                  stores={getStoresByCountry('BE')}
                  selectedStore={belgiumStore}
                  onStoreSelect={(buCode) => handleStoreSelect('BE', buCode)}
                  placeholder="Selecteer belgische winkel..."
                />
              </div>

              {/* Netherlands */}
              <div>
                <label className="block text-sm font-bold text-gray-700 mb-2">
                  <span className="text-lg mr-1">{countryFlags.NL}</span>
                  Nederland
                </label>
                <StoreSelector
                  countryCode="NL"
                  stores={getStoresByCountry('NL')}
                  selectedStore={netherlandsStore}
                  onStoreSelect={(buCode) => handleStoreSelect('NL', buCode)}
                  placeholder="Selecteer nederlandse winkel..."
                />
              </div>

              {/* France */}
              <div>
                <label className="block text-sm font-bold text-gray-700 mb-2">
                  <span className="text-lg mr-1">{countryFlags.FR}</span>
                  Frankrijk
                </label>
                <StoreSelector
                  countryCode="FR"
                  stores={getStoresByCountry('FR')}
                  selectedStore={franceStore}
                  onStoreSelect={(buCode) => handleStoreSelect('FR', buCode)}
                  placeholder="Selecteer franse winkel..."
                />
              </div>

              {/* Germany */}
              <div>
                <label className="block text-sm font-bold text-gray-700 mb-2">
                  <span className="text-lg mr-1">{countryFlags.DE}</span>
                  Duitsland
                </label>
                <StoreSelector
                  countryCode="DE"
                  stores={getStoresByCountry('DE')}
                  selectedStore={germanyStore}
                  onStoreSelect={(buCode) => handleStoreSelect('DE', buCode)}
                  placeholder="Selecteer duitse winkel..."
                />
              </div>
            </div>
          </div>

          {/* Footer */}
          <div className="sticky bottom-0 bg-gray-50 border-t-2 border-gray-300 px-6 py-4">
            <button
              onClick={onClose}
              className="w-full px-4 py-3 bg-black text-white font-bold hover:bg-gray-800 transition-colors"
            >
              Klaar
            </button>
          </div>
        </div>
      </div>
    </>
  );
}
