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
  const [_netherlandsStore, setNetherlandsStore] = useState<IkeaStore | null>(null);
  const [_franceStore, setFranceStore] = useState<IkeaStore | null>(null);

  // Load saved preferences on mount and when modal opens
  useEffect(() => {
    if (isOpen) {
      // Load selected stores (defaults are handled in store-manager)
      setBelgiumStore(getSelectedStore('BE'));
      setNetherlandsStore(getSelectedStore('NL'));
      setFranceStore(getSelectedStore('FR'));
    }
  }, [isOpen]);

  const handleStoreSelect = (countryCode: 'BE' | 'NL' | 'FR', buCode: string) => {
    setSelectedStore(countryCode, buCode);

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
          <div className="sticky top-0 bg-white border-b-2 border-gray-300 px-6 py-4 flex items-center justify-between">
            <h2 className="text-xl font-bold text-gray-900">Winkelinstellingen</h2>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600 transition-colors"
              aria-label="Sluit"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
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

              {/* Netherlands - Fixed to Breda */}
              <div>
                <label className="block text-sm font-bold text-gray-700 mb-2">
                  <span className="text-lg mr-1">{countryFlags.NL}</span>
                  Nederland
                </label>
                <div className="w-full px-3 py-2 bg-gray-100 border-2 border-gray-300 cursor-not-allowed opacity-75">
                  <div className="text-sm font-medium text-gray-900">IKEA Breda</div>
                  <div className="text-xs text-gray-600">Breda</div>
                </div>
              </div>

              {/* France - Fixed to Lille */}
              <div>
                <label className="block text-sm font-bold text-gray-700 mb-2">
                  <span className="text-lg mr-1">{countryFlags.FR}</span>
                  Frankrijk
                </label>
                <div className="w-full px-3 py-2 bg-gray-100 border-2 border-gray-300 cursor-not-allowed opacity-75">
                  <div className="text-sm font-medium text-gray-900">IKEA Lille</div>
                  <div className="text-xs text-gray-600">Lille</div>
                </div>
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
