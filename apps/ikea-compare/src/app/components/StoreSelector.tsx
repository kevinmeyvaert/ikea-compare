'use client';

import { useState, useEffect, useRef } from 'react';
import { IkeaStore } from '@ikea-compare/firebase';

interface StoreSelectorProps {
  countryCode: 'BE' | 'NL' | 'FR' | 'DE';
  stores: IkeaStore[];
  selectedStore: IkeaStore | null;
  onStoreSelect: (buCode: string) => void;
  placeholder?: string;
}

export default function StoreSelector({
  countryCode,
  stores,
  selectedStore,
  onStoreSelect,
  placeholder = 'Selecteer een winkel...',
}: StoreSelectorProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Close dropdown when clicking outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Filter stores based on search term
  const filteredStores = stores.filter((store) => {
    const search = searchTerm.toLowerCase();
    return (
      store.name.toLowerCase().includes(search) ||
      store.city.toLowerCase().includes(search)
    );
  });

  const handleSelectStore = (buCode: string) => {
    onStoreSelect(buCode);
    setIsOpen(false);
    setSearchTerm('');
  };

  return (
    <div className="relative" ref={dropdownRef}>
      {/* Selected store display / trigger */}
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className="w-full px-4 py-3 text-left bg-white border-2 border-gray-900 hover:border-ikea-blue focus:outline-none focus:border-ikea-blue transition-colors"
      >
        {selectedStore ? (
          <div className="flex items-center justify-between">
            <div>
              <div className="font-medium text-gray-900">{selectedStore.name}</div>
              <div className="text-sm text-gray-600">{selectedStore.city}</div>
            </div>
            <svg
              className={`w-5 h-5 text-gray-400 transition-transform ${isOpen ? 'rotate-180' : ''}`}
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7" />
            </svg>
          </div>
        ) : (
          <div className="flex items-center justify-between text-gray-500">
            <span>{placeholder}</span>
            <svg
              className={`w-5 h-5 transition-transform ${isOpen ? 'rotate-180' : ''}`}
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7" />
            </svg>
          </div>
        )}
      </button>

      {/* Dropdown menu */}
      {isOpen && (
        <div className="absolute z-50 w-full mt-2 bg-white border-2 border-black max-h-96 overflow-hidden">
          {/* Search input */}
          <div className="p-3 border-b-2 border-gray-300">
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Zoek winkels..."
              className="w-full px-3 py-2 border-2 border-gray-900 focus:outline-none focus:border-ikea-blue"
              autoFocus
            />
          </div>

          {/* Store list */}
          <div className="max-h-80 overflow-y-auto">
            {filteredStores.length > 0 ? (
              filteredStores.map((store) => (
                <button
                  key={store.buCode}
                  type="button"
                  onClick={() => handleSelectStore(store.buCode)}
                  className={`w-full px-4 py-3 text-left hover:bg-blue-50 transition-colors ${
                    selectedStore?.buCode === store.buCode ? 'bg-blue-100' : ''
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <div>
                      <div className="font-medium text-gray-900">{store.name}</div>
                      <div className="text-sm text-gray-600">{store.city}</div>
                    </div>
                    {selectedStore?.buCode === store.buCode && (
                      <svg
                        className="w-5 h-5 text-green-600"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" />
                      </svg>
                    )}
                  </div>
                </button>
              ))
            ) : (
              <div className="px-4 py-8 text-center text-gray-500">Geen winkels gevonden</div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
