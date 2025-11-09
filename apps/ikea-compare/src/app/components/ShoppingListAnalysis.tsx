'use client';

import { useState, useEffect } from 'react';
import { ShoppingListAnalysis } from '../../lib/shopping-list/types';
import { getSelectedStore } from '../../lib/stores/store-manager';
import Image from 'next/image';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

interface ShoppingListAnalysisProps {
  analysis: ShoppingListAnalysis;
  onReset: () => void;
}

export default function ShoppingListAnalysisComponent({ analysis, onReset }: ShoppingListAnalysisProps) {
  const [selectedStores, setSelectedStores] = useState<Set<'BE' | 'NL' | 'FR'>>(
    new Set(['BE', 'NL', 'FR'])
  );

  // Get selected store names
  const [storeNames, setStoreNames] = useState<Record<'BE' | 'NL' | 'FR', string>>({
    BE: 'België',
    NL: 'Nederland',
    FR: 'Frankrijk',
  });

  useEffect(() => {
    const beStore = getSelectedStore('BE');
    const nlStore = getSelectedStore('NL');
    const frStore = getSelectedStore('FR');

    setStoreNames({
      BE: beStore?.name || 'België',
      NL: nlStore?.name || 'Nederland',
      FR: frStore?.name || 'Frankrijk',
    });
  }, []);

  // Calculate optimized strategy based on selected stores
  const calculateOptimizedStrategy = () => {
    let totalCost = 0;
    const breakdown: { store: 'BE' | 'NL' | 'FR'; storeName: string; productCount: number; subtotal: number; products: string[] }[] = [];

    // Initialize breakdown for selected stores
    selectedStores.forEach(store => {
      breakdown.push({
        store,
        storeName: storeNames[store],
        productCount: 0,
        subtotal: 0,
        products: [],
      });
    });

    // For each product, find cheapest among selected stores
    analysis.products.forEach(product => {
      let cheapestPrice = Infinity;
      let cheapestStore: 'BE' | 'NL' | 'FR' | null = null;

      // Check prices in selected stores only
      if (selectedStores.has('BE') && product.products.belgium?.price) {
        if (product.products.belgium.price < cheapestPrice) {
          cheapestPrice = product.products.belgium.price;
          cheapestStore = 'BE';
        }
      }
      if (selectedStores.has('NL') && product.products.netherlands?.price) {
        if (product.products.netherlands.price < cheapestPrice) {
          cheapestPrice = product.products.netherlands.price;
          cheapestStore = 'NL';
        }
      }
      if (selectedStores.has('FR') && product.products.france?.price) {
        if (product.products.france.price < cheapestPrice) {
          cheapestPrice = product.products.france.price;
          cheapestStore = 'FR';
        }
      }

      if (cheapestStore && cheapestPrice !== Infinity) {
        const storeBreakdown = breakdown.find(b => b.store === cheapestStore);
        if (storeBreakdown) {
          storeBreakdown.productCount += 1;
          storeBreakdown.subtotal += cheapestPrice;
          storeBreakdown.products.push(product.productId);
          totalCost += cheapestPrice;
        }
      }
    });

    // Calculate savings compared to Belgium
    const belgiumStore = analysis.singleStoreStrategy.all.find(s => s.storeCode === 'BE');
    const belgiumTotal = belgiumStore?.totalCost || 0;

    return {
      totalCost,
      savings: belgiumTotal - totalCost,
      breakdown: breakdown.filter(b => b.productCount > 0),
      belgiumTotal,
    };
  };

  const optimizedStrategy = calculateOptimizedStrategy();

  const handleStoreToggle = (storeCode: 'BE' | 'NL' | 'FR') => {
    const newSelected = new Set(selectedStores);
    if (newSelected.has(storeCode)) {
      // Must keep at least one store selected
      if (newSelected.size > 1) {
        newSelected.delete(storeCode);
      }
    } else {
      newSelected.add(storeCode);
    }
    setSelectedStores(newSelected);
  };

  const exportToPDF = () => {
    const doc = new jsPDF();

    // Title
    doc.setFontSize(20);
    doc.setTextColor(0, 88, 163); // IKEA blue
    doc.text('IKEA Winkellijst Analyse', 14, 20);

    // Summary
    doc.setFontSize(12);
    doc.setTextColor(0, 0, 0);
    doc.text(`Totaal Producten: ${analysis.totalProducts}`, 14, 35);
    doc.text(`Succesvol Opgehaald: ${analysis.successfullyFetched}`, 14, 42);

    // Best Single Store
    doc.setFontSize(14);
    doc.setTextColor(0, 88, 163);
    doc.text('Beste Enkele Winkel Strategie', 14, 55);
    doc.setFontSize(11);
    doc.setTextColor(0, 0, 0);
    doc.text(`Winkel: ${analysis.singleStoreStrategy.best.storeName}`, 14, 63);
    doc.text(`Totale Kosten: €${analysis.singleStoreStrategy.best.totalCost.toFixed(2)}`, 14, 70);

    // Multi-Store Strategy
    doc.setFontSize(14);
    doc.setTextColor(0, 88, 163);
    doc.text('Meerdere Winkels Strategie', 14, 83);
    doc.setFontSize(11);
    doc.setTextColor(0, 0, 0);
    doc.text(`Totale Kosten: €${analysis.multiStoreStrategy.totalCost.toFixed(2)}`, 14, 91);
    doc.text(`Besparing: €${analysis.multiStoreStrategy.savings.toFixed(2)}`, 14, 98);

    // Products Table
    const tableData = analysis.products.map((product) => {
      const anyProduct = product.products.belgium || product.products.netherlands || product.products.france;
      return [
        product.productId,
        anyProduct?.name.substring(0, 40) || 'N.v.t.',
        product.products.belgium?.price?.toFixed(2) || '-',
        product.products.netherlands?.price?.toFixed(2) || '-',
        product.products.france?.price?.toFixed(2) || '-',
        product.cheapest === 'BE' ? 'België' : product.cheapest === 'NL' ? 'Nederland' : product.cheapest === 'FR' ? 'Frankrijk' : '-',
      ];
    });

    autoTable(doc, {
      startY: 110,
      head: [['Code', 'Product', 'BE (€)', 'NL (€)', 'FR (€)', 'Beste']],
      body: tableData,
      theme: 'striped',
      headStyles: { fillColor: [0, 88, 163] }, // IKEA blue
      styles: { fontSize: 8 },
    });

    doc.save('ikea-shopping-list-analysis.pdf');
  };

  const countryFlags = {
    BE: '🇧🇪',
    NL: '🇳🇱',
    FR: '🇫🇷',
  };

  return (
    <div className="space-y-6">
      {/* Header with Reset */}
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold text-gray-900">Winkellijst Analyse</h2>
        <div className="flex gap-2">
          <button
            onClick={exportToPDF}
            className="px-4 py-2 bg-ikea-yellow text-gray-900 text-sm font-bold rounded hover:opacity-90 transition-all"
          >
            📄 Exporteer PDF
          </button>
          <button
            onClick={onReset}
            className="px-4 py-2 bg-gray-200 text-gray-900 text-sm font-bold rounded hover:bg-gray-300 transition-all"
          >
            ✕ Wissen
          </button>
        </div>
      </div>

      {/* Price Overview */}
      <div className="bg-gradient-to-r from-ikea-blue to-blue-600 rounded-lg p-6 text-white">
        <h3 className="text-lg font-bold mb-4">Prijsvergelijking Overzicht</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div>
            <div className="text-sm opacity-90 mb-1">Winkelen bij Geselecteerde Winkel</div>
            <div className="text-3xl font-bold">
              €{optimizedStrategy.belgiumTotal.toFixed(2)}
            </div>
            <div className="text-sm mt-1 opacity-90">
              {countryFlags['BE']} {storeNames['BE']}
            </div>
          </div>
          <div>
            <div className="text-sm opacity-90 mb-1">Jouw Geoptimaliseerde Kosten</div>
            <div className="text-3xl font-bold">
              €{optimizedStrategy.totalCost.toFixed(2)}
            </div>
            <div className="text-sm mt-1 opacity-90">
              {optimizedStrategy.breakdown.length === 1
                ? `Winkelen bij ${optimizedStrategy.breakdown[0].storeName}`
                : `Verspreid over ${optimizedStrategy.breakdown.length} winkels`}
            </div>
          </div>
          <div>
            <div className="text-sm opacity-90 mb-1">Je Bespaart t.o.v. Geselecteerde Winkel</div>
            <div className="text-3xl font-bold text-ikea-yellow">
              €{optimizedStrategy.savings.toFixed(2)}
            </div>
            <div className="text-sm mt-1 opacity-90">
              {optimizedStrategy.belgiumTotal > 0
                ? `${((optimizedStrategy.savings / optimizedStrategy.belgiumTotal) * 100).toFixed(1)}% besparing`
                : '0% besparing'}
            </div>
          </div>
        </div>
      </div>

      {/* Store Selection */}
      <div className="bg-white rounded-lg border border-gray-200 p-6">
        <h3 className="text-lg font-bold text-gray-900 mb-4">Selecteer Winkels om te Bezoeken</h3>
        <p className="text-sm text-gray-600 mb-4">
          Kies welke winkels je wilt bezoeken. We berekenen de beste winkelstrategie op basis van je selectie.
        </p>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
          {analysis.singleStoreStrategy.all.map((store) => (
            <label
              key={store.storeCode}
              className={`flex items-center gap-3 p-4 border-2 rounded-lg cursor-pointer transition-all ${
                selectedStores.has(store.storeCode)
                  ? 'border-ikea-blue bg-blue-50'
                  : 'border-gray-200 hover:border-gray-300'
              }`}
            >
              <input
                type="checkbox"
                checked={selectedStores.has(store.storeCode)}
                onChange={() => handleStoreToggle(store.storeCode)}
                className="w-5 h-5 text-ikea-blue border-gray-300 rounded focus:ring-ikea-blue"
              />
              <div className="flex-1">
                <div className="flex items-center gap-2">
                  <span className="text-2xl">{countryFlags[store.storeCode]}</span>
                  <div>
                    <div className="font-bold text-gray-900">{storeNames[store.storeCode]}</div>
                    <div className="text-xs text-gray-500">{store.storeName}</div>
                    <div className="text-xs text-gray-600 mt-1">
                      {store.availableProducts} van {analysis.totalProducts} items beschikbaar
                    </div>
                    {store.unavailableProducts > 0 && (
                      <div className="text-xs text-orange-600 font-medium">
                        {store.unavailableProducts} items niet beschikbaar
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </label>
          ))}
        </div>

        {/* Availability Legend */}
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
          <h4 className="text-sm font-bold text-gray-900 mb-2">Hoe we beschikbaarheid hanteren</h4>
          <ul className="text-xs text-gray-700 space-y-1">
            <li className="flex items-start gap-2">
              <span className="text-ikea-blue font-bold">•</span>
              <span>We nemen alleen items met prijzen mee in onze berekeningen (items zonder prijzen worden als niet beschikbaar beschouwd)</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-ikea-blue font-bold">•</span>
              <span>Als een item niet beschikbaar is bij je geselecteerde winkels, wordt het niet meegenomen in de geoptimaliseerde kosten</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-ikea-blue font-bold">•</span>
              <span>De optimalisatie kiest altijd de goedkoopste beschikbare optie bij je geselecteerde winkels</span>
            </li>
          </ul>
        </div>
      </div>

      {/* Optimized Shopping Strategy */}
      <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
        <div className="p-4 bg-gray-50 border-b border-gray-200">
          <h3 className="font-bold text-gray-900">Jouw Geoptimaliseerde Winkelstrategie</h3>
          <p className="text-xs text-gray-600 mt-1">
            Op basis van je geselecteerde winkels, hier moet je elk item kopen voor de beste totaalprijs
          </p>
        </div>
        <div className="divide-y divide-gray-200">
          {optimizedStrategy.breakdown.map((store) => {
            // Calculate how many items are cheapest here vs available but not cheapest
            const storeProducts = store.products.map(productId => {
              const product = analysis.products.find(p => p.productId === productId);
              if (!product) return null;

              const storeMap = { BE: 'belgium', NL: 'netherlands', FR: 'france' } as const;
              const currentPrice = product.products[storeMap[store.store]]?.price;

              // Check if this is actually the cheapest among all stores (not just selected)
              const allPrices = [
                product.products.belgium?.price,
                product.products.netherlands?.price,
                product.products.france?.price
              ].filter(p => p !== undefined) as number[];

              const globalCheapest = Math.min(...allPrices);
              const isCheapestOverall = currentPrice === globalCheapest;

              return { productId, isCheapestOverall, currentPrice, globalCheapest };
            }).filter(Boolean);

            const cheapestHere = storeProducts.filter(p => p?.isCheapestOverall).length;
            const notCheapestButAvailable = storeProducts.length - cheapestHere;

            return (
              <div key={store.store} className="p-4">
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-3">
                    <span className="text-2xl">{countryFlags[store.store]}</span>
                    <div>
                      <div className="font-bold text-gray-900">{store.storeName}</div>
                      <div className="text-xs text-gray-600">{store.productCount} producten hier te kopen</div>
                      {notCheapestButAvailable > 0 && (
                        <div className="text-xs text-orange-600 mt-1">
                          {notCheapestButAvailable} item{notCheapestButAvailable !== 1 ? 's' : ''} gekozen omdat niet beschikbaar elders
                        </div>
                      )}
                    </div>
                  </div>
                  <div className="text-xl font-bold text-gray-900">€{store.subtotal.toFixed(2)}</div>
                </div>
              </div>
            );
          })}
        </div>
      </div>


      {/* Products Table */}
      <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
        <div className="p-4 bg-gray-50 border-b border-gray-200">
          <h3 className="font-bold text-gray-900">Alle Producten ({analysis.products.length})</h3>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="px-4 py-3 text-left text-xs font-bold text-gray-700">Product</th>
                <th className="px-4 py-3 text-center text-xs font-bold text-gray-700">🇧🇪 BE</th>
                <th className="px-4 py-3 text-center text-xs font-bold text-gray-700">🇳🇱 NL</th>
                <th className="px-4 py-3 text-center text-xs font-bold text-gray-700">🇫🇷 FR</th>
                <th className="px-4 py-3 text-center text-xs font-bold text-gray-700">Beste</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {analysis.products.map((product) => {
                const anyProduct = product.products.belgium || product.products.netherlands || product.products.france;
                return (
                  <tr key={`${product.productId}-${Math.random()}`} className="hover:bg-gray-50">
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-3">
                        {anyProduct?.imageUrl && (
                          <div className="relative w-12 h-12 flex-shrink-0">
                            <Image
                              src={anyProduct.imageUrl}
                              alt={anyProduct.name}
                              fill
                              className="object-contain"
                              unoptimized
                            />
                          </div>
                        )}
                        <div>
                          <div className="text-sm font-medium text-gray-900">{anyProduct?.name || 'Onbekend'}</div>
                          <div className="text-xs text-gray-500">{product.productId}</div>
                        </div>
                      </div>
                    </td>
                    <td className={`px-4 py-3 text-center text-sm ${product.cheapest === 'BE' ? 'bg-ikea-yellow-light font-bold' : ''}`}>
                      {product.products.belgium?.price ? `€${product.products.belgium.price.toFixed(2)}` : '-'}
                    </td>
                    <td className={`px-4 py-3 text-center text-sm ${product.cheapest === 'NL' ? 'bg-ikea-yellow-light font-bold' : ''}`}>
                      {product.products.netherlands?.price ? `€${product.products.netherlands.price.toFixed(2)}` : '-'}
                    </td>
                    <td className={`px-4 py-3 text-center text-sm ${product.cheapest === 'FR' ? 'bg-ikea-yellow-light font-bold' : ''}`}>
                      {product.products.france?.price ? `€${product.products.france.price.toFixed(2)}` : '-'}
                    </td>
                    <td className="px-4 py-3 text-center">
                      {product.cheapest && (
                        <span className="inline-block px-2 py-1 bg-ikea-yellow text-gray-900 text-xs font-bold rounded">
                          {product.cheapest}
                        </span>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
