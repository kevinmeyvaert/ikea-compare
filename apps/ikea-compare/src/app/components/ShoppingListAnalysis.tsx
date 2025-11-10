'use client';

import { useState, useEffect, useMemo, memo } from 'react';
import { ShoppingListAnalysis } from '../../lib/shopping-list/types';
import { getSelectedStore } from '../../lib/stores/store-manager';
import Image from 'next/image';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

interface ShoppingListAnalysisProps {
  analysis: ShoppingListAnalysis;
  onReset: () => void;
}

const ShoppingListAnalysisComponent = memo(function ShoppingListAnalysisComponent({ analysis, onReset }: ShoppingListAnalysisProps) {
  const [selectedStores, setSelectedStores] = useState<Set<'BE' | 'NL' | 'FR' | 'DE'>>(
    new Set(['BE', 'NL', 'FR', 'DE'])
  );
  const [expandedStores, setExpandedStores] = useState<Set<'BE' | 'NL' | 'FR' | 'DE'>>(
    new Set(['BE', 'NL', 'FR', 'DE']) // All expanded by default
  );
  const [showFullTable, setShowFullTable] = useState(false);

  // Get selected store names
  const [storeNames, setStoreNames] = useState<Record<'BE' | 'NL' | 'FR' | 'DE', string>>({
    BE: 'België',
    NL: 'Nederland',
    FR: 'Frankrijk',
    DE: 'Duitsland',
  });

  useEffect(() => {
    const loadStoreNames = async () => {
      const beStore = await getSelectedStore('BE');
      const nlStore = await getSelectedStore('NL');
      const frStore = await getSelectedStore('FR');
      const deStore = await getSelectedStore('DE');

      setStoreNames({
        BE: beStore?.name || 'België',
        NL: nlStore?.name || 'Nederland',
        FR: frStore?.name || 'Frankrijk',
        DE: deStore?.name || 'Duitsland',
      });
    };
    loadStoreNames();
  }, []);

  // Calculate optimized strategy based on selected stores (memoized to prevent recalculation)
  const optimizedStrategy = useMemo(() => {
    let totalCost = 0;
    const breakdown: { store: 'BE' | 'NL' | 'FR' | 'DE'; storeName: string; productCount: number; subtotal: number; products: string[] }[] = [];

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
      let cheapestStore: 'BE' | 'NL' | 'FR' | 'DE' | null = null;

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
      if (selectedStores.has('DE') && product.products.germany?.price) {
        if (product.products.germany.price < cheapestPrice) {
          cheapestPrice = product.products.germany.price;
          cheapestStore = 'DE';
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
  }, [selectedStores, analysis, storeNames]);

  const handleStoreToggle = (storeCode: 'BE' | 'NL' | 'FR' | 'DE') => {
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

  const toggleStoreExpansion = (storeCode: 'BE' | 'NL' | 'FR' | 'DE') => {
    const newExpanded = new Set(expandedStores);
    if (newExpanded.has(storeCode)) {
      newExpanded.delete(storeCode);
    } else {
      newExpanded.add(storeCode);
    }
    setExpandedStores(newExpanded);
  };

  const exportToPDF = () => {
    const doc = new jsPDF();
    const storeMap = { BE: 'belgium', NL: 'netherlands', FR: 'france', DE: 'germany' } as const;

    // Title
    doc.setFontSize(20);
    doc.setTextColor(0, 88, 163); // IKEA blue
    doc.text('IKEA winkellijst analyse', 14, 20);

    // Summary
    doc.setFontSize(12);
    doc.setTextColor(0, 0, 0);
    doc.text(`Totaal producten: ${analysis.totalProducts}`, 14, 35);
    doc.text(`Succesvol opgehaald: ${analysis.successfullyFetched}`, 14, 42);

    // Optimized Strategy Summary
    doc.setFontSize(14);
    doc.setTextColor(0, 88, 163);
    doc.text('Geoptimaliseerde winkelstrategie', 14, 55);
    doc.setFontSize(11);
    doc.setTextColor(0, 0, 0);
    doc.text(`Totale kosten: €${optimizedStrategy.totalCost.toFixed(2)}`, 14, 63);
    doc.text(`Besparing t.o.v. enkel ${storeNames.BE}: €${optimizedStrategy.savings.toFixed(2)}`, 14, 70);

    let currentY = 85;

    // Shopping Lists Per Store
    optimizedStrategy.breakdown.forEach((store, storeIndex) => {
      // Check if we need a new page
      if (currentY > 240) {
        doc.addPage();
        currentY = 20;
      }

      // Store Header
      doc.setFontSize(14);
      doc.setTextColor(0, 88, 163);
      const storeFlag = countryFlags[store.store];
      doc.text(`${storeFlag} ${store.storeName}`, 14, currentY);

      doc.setFontSize(10);
      doc.setTextColor(0, 0, 0);
      currentY += 7;
      doc.text(`${store.productCount} producten • €${store.subtotal.toFixed(2)}`, 14, currentY);
      currentY += 10;

      // Store Products Table
      const storeProducts = store.products.map(productId => {
        const product = analysis.products.find(p => p.productId === productId);
        if (!product) return null;

        const productData = product.products[storeMap[store.store]];
        const currentPrice = productData?.price;

        // Check if cheapest
        const allPrices = [
          product.products.belgium?.price,
          product.products.netherlands?.price,
          product.products.france?.price,
          product.products.germany?.price
        ].filter(p => p !== undefined) as number[];
        const globalCheapest = Math.min(...allPrices);
        const isCheapest = currentPrice === globalCheapest;

        return [
          product.productId,
          productData?.name.substring(0, 35) || 'Onbekend',
          `€${currentPrice?.toFixed(2) || '-'}`,
          isCheapest ? '✓ Beste prijs' : '⚠ Beschikbaar'
        ];
      }).filter(Boolean);

      autoTable(doc, {
        startY: currentY,
        head: [['Code', 'Product', 'Prijs', 'Status']],
        body: storeProducts as any,
        theme: 'striped',
        headStyles: { fillColor: [0, 88, 163], fontSize: 9 },
        styles: { fontSize: 8, cellPadding: 2 },
        columnStyles: {
          0: { cellWidth: 25 },
          1: { cellWidth: 'auto' },
          2: { cellWidth: 25, halign: 'right' },
          3: { cellWidth: 30, fontSize: 7 }
        },
        didDrawPage: (data) => {
          currentY = data.cursor?.y || currentY;
        }
      });

      // Subtotal row
      currentY = (doc as any).lastAutoTable.finalY + 5;
      doc.setFontSize(10);
      doc.setFont('helvetica', 'bold');
      doc.text(`Subtotaal: €${store.subtotal.toFixed(2)}`, 14, currentY);
      doc.setFont('helvetica', 'normal');

      currentY += 15;

      // Add separator line between stores
      if (storeIndex < optimizedStrategy.breakdown.length - 1) {
        doc.setDrawColor(200, 200, 200);
        doc.line(14, currentY - 5, 196, currentY - 5);
      }
    });

    // Total on last page
    if (currentY > 260) {
      doc.addPage();
      currentY = 20;
    }

    doc.setFontSize(14);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(0, 88, 163);
    doc.text(`TOTAAL: €${optimizedStrategy.totalCost.toFixed(2)}`, 14, currentY);

    doc.save('ikea-winkellijst.pdf');
  };

  const countryFlags = {
    BE: '🇧🇪',
    NL: '🇳🇱',
    FR: '🇫🇷',
    DE: '🇩🇪',
  };

  return (
    <div className="space-y-6">
      {/* Header with Reset */}
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-semibold text-gray-900">Winkellijst analyse</h2>
        <div className="flex gap-2">
          <button
            onClick={exportToPDF}
            className="px-4 py-2.5 bg-ikea-pink text-white text-sm font-medium border-2 border-ikea-pink hover:bg-red-600 transition-colors"
          >
            📄 Exporteer pdf
          </button>
          <button
            onClick={onReset}
            className="px-4 py-2.5 bg-white text-gray-900 text-sm font-bold border-2 border-gray-900 hover:bg-gray-100 transition-colors"
          >
            ✕ Wissen
          </button>
        </div>
      </div>

      {/* Price Overview */}
      <div className="bg-ikea-blue border-2 border-black p-6 text-white">
        <h3 className="text-base font-semibold mb-4">Prijsvergelijking overzicht</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div>
            <div className="text-xs opacity-90 mb-1">Winkelen bij geselecteerde winkel</div>
            <div className="text-2xl font-semibold">
              €{optimizedStrategy.belgiumTotal.toFixed(2)}
            </div>
            <div className="text-sm mt-1 opacity-90">
              {countryFlags['BE']} {storeNames['BE']}
            </div>
          </div>
          <div>
            <div className="text-xs opacity-90 mb-1">Jouw geoptimaliseerde kosten</div>
            <div className="text-2xl font-semibold">
              €{optimizedStrategy.totalCost.toFixed(2)}
            </div>
            <div className="text-sm mt-1 opacity-90">
              {optimizedStrategy.breakdown.length === 1
                ? `Winkelen bij ${optimizedStrategy.breakdown[0].storeName}`
                : `Verspreid over ${optimizedStrategy.breakdown.length} winkels`}
            </div>
          </div>
          <div>
            <div className="text-xs opacity-90 mb-1">Je bespaart t.o.v. geselecteerde winkel</div>
            <div className="text-2xl font-semibold text-ikea-pink-light">
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
      <div className="bg-white border-2 border-gray-300 p-6">
        <h3 className="text-base font-semibold text-gray-900 mb-4">Selecteer winkels om te bezoeken</h3>
        <p className="text-sm text-gray-600 mb-4">
          Kies welke winkels je wilt bezoeken. We berekenen de beste winkelstrategie op basis van je selectie.
        </p>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
          {analysis.singleStoreStrategy.all.map((store) => (
            <label
              key={store.storeCode}
              className={`flex items-center gap-3 p-4 border-2 cursor-pointer transition-all ${
                selectedStores.has(store.storeCode)
                  ? 'border-black bg-blue-50'
                  : 'border-gray-300 hover:border-gray-400'
              }`}
            >
              <input
                type="checkbox"
                checked={selectedStores.has(store.storeCode)}
                onChange={() => handleStoreToggle(store.storeCode)}
                className="w-5 h-5 text-ikea-blue border-2 border-gray-900"
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
        <div className="bg-blue-50 border-2 border-ikea-blue p-4">
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
      <div className="bg-white border-2 border-gray-300 overflow-hidden">
        <div className="p-4 bg-gray-50 border-b-2 border-gray-300">
          <h3 className="text-base font-semibold text-gray-900">Jouw geoptimaliseerde winkelstrategie</h3>
          <p className="text-xs text-gray-600 mt-1">
            Klik op een winkel om je winkellijst te zien
          </p>
        </div>
        <div className="divide-y-2 divide-gray-300">
          {optimizedStrategy.breakdown.map((store) => {
            const isExpanded = expandedStores.has(store.store);
            const storeMap = { BE: 'belgium', NL: 'netherlands', FR: 'france', DE: 'germany' } as const;

            // Get full product details for this store
            const storeProducts = store.products.map(productId => {
              const product = analysis.products.find(p => p.productId === productId);
              if (!product) return null;

              const currentPrice = product.products[storeMap[store.store]]?.price;
              const productData = product.products[storeMap[store.store]];

              // Check if this is actually the cheapest among all stores (not just selected)
              const allPrices = [
                product.products.belgium?.price,
                product.products.netherlands?.price,
                product.products.france?.price,
                product.products.germany?.price
              ].filter(p => p !== undefined) as number[];

              const globalCheapest = Math.min(...allPrices);
              const isCheapestOverall = currentPrice === globalCheapest;

              return {
                productId,
                name: productData?.name || 'Onbekend product',
                price: currentPrice,
                isCheapestOverall
              };
            }).filter(Boolean);

            const cheapestHere = storeProducts.filter(p => p?.isCheapestOverall).length;
            const notCheapestButAvailable = storeProducts.length - cheapestHere;

            return (
              <div key={store.store}>
                <button
                  onClick={() => toggleStoreExpansion(store.store)}
                  className="w-full p-4 hover:bg-gray-50 transition-colors text-left"
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3 flex-1">
                      <span className="text-2xl">{countryFlags[store.store]}</span>
                      <div className="flex-1">
                        <div className="font-bold text-gray-900">{store.storeName}</div>
                        <div className="text-xs text-gray-600">{store.productCount} producten • €{store.subtotal.toFixed(2)}</div>
                        {notCheapestButAvailable > 0 && (
                          <div className="text-xs text-orange-600 mt-1">
                            {notCheapestButAvailable} item{notCheapestButAvailable !== 1 ? 's' : ''} gekozen omdat niet beschikbaar elders
                          </div>
                        )}
                      </div>
                    </div>
                    <svg
                      className={`w-5 h-5 text-gray-400 transition-transform ${isExpanded ? 'rotate-180' : ''}`}
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7" />
                    </svg>
                  </div>
                </button>

                {isExpanded && (
                  <div className="px-4 pb-4 border-t-2 border-gray-200">
                    <div className="mt-4 space-y-2">
                      {storeProducts.map((item) => item && (
                        <div
                          key={item.productId}
                          className={`p-3 border-2 ${item.isCheapestOverall ? 'bg-ikea-pink-light border-ikea-pink' : 'bg-gray-50 border-gray-300'}`}
                        >
                          <div className="flex items-start justify-between gap-3">
                            <div className="flex-1 min-w-0">
                              <div className="font-medium text-gray-900 text-sm">{item.name}</div>
                              <div className="text-xs text-gray-600 font-mono mt-1">{item.productId}</div>
                              {!item.isCheapestOverall && (
                                <div className="text-xs text-orange-600 mt-1">
                                  ⚠️ Niet de goedkoopste, maar hier beschikbaar
                                </div>
                              )}
                            </div>
                            <div className="flex flex-col items-end flex-shrink-0">
                              <div className="text-base font-semibold text-gray-900">€{item.price?.toFixed(2)}</div>
                              {item.isCheapestOverall && (
                                <div className="text-xs text-ikea-pink font-medium mt-1">✓ Beste prijs</div>
                              )}
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                    <div className="mt-4 pt-3 border-t-2 border-gray-300 flex justify-between items-center">
                      <span className="font-bold text-gray-900">Subtotaal {store.storeName}</span>
                      <span className="text-xl font-bold text-gray-900">€{store.subtotal.toFixed(2)}</span>
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>


      {/* Products Table */}
      <div className="bg-white border-2 border-gray-300 overflow-hidden">
        <button
          onClick={() => setShowFullTable(!showFullTable)}
          className={`w-full p-4 bg-gray-50 hover:bg-gray-100 transition-colors text-left ${showFullTable ? 'border-b-2 border-gray-300' : ''}`}
        >
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-base font-semibold text-gray-900">Volledige prijsvergelijking ({analysis.products.length} producten)</h3>
              <p className="text-xs text-gray-600 mt-1">
                {showFullTable ? 'Klik om te verbergen' : 'Klik om alle prijzen per land te zien'}
              </p>
            </div>
            <svg
              className={`w-5 h-5 text-gray-400 transition-transform ${showFullTable ? 'rotate-180' : ''}`}
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7" />
            </svg>
          </div>
        </button>
        {showFullTable && (
          <>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="px-4 py-3 text-left text-xs font-bold text-gray-700">Product</th>
                <th className="px-4 py-3 text-center text-xs font-bold text-gray-700">🇧🇪 BE</th>
                <th className="px-4 py-3 text-center text-xs font-bold text-gray-700">🇳🇱 NL</th>
                <th className="px-4 py-3 text-center text-xs font-bold text-gray-700">🇫🇷 FR</th>
                <th className="px-4 py-3 text-center text-xs font-bold text-gray-700">🇩🇪 DE</th>
                <th className="px-4 py-3 text-center text-xs font-bold text-gray-700">Beste</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {analysis.products.map((product) => {
                const anyProduct = product.products.belgium || product.products.netherlands || product.products.france || product.products.germany;
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
                    <td className={`px-4 py-3 text-center text-sm ${product.cheapest === 'BE' ? 'bg-ikea-pink-light font-semibold text-ikea-pink' : ''}`}>
                      {product.products.belgium?.price ? `€${product.products.belgium.price.toFixed(2)}` : '-'}
                    </td>
                    <td className={`px-4 py-3 text-center text-sm ${product.cheapest === 'NL' ? 'bg-ikea-pink-light font-semibold text-ikea-pink' : ''}`}>
                      {product.products.netherlands?.price ? `€${product.products.netherlands.price.toFixed(2)}` : '-'}
                    </td>
                    <td className={`px-4 py-3 text-center text-sm ${product.cheapest === 'FR' ? 'bg-ikea-pink-light font-semibold text-ikea-pink' : ''}`}>
                      {product.products.france?.price ? `€${product.products.france.price.toFixed(2)}` : '-'}
                    </td>
                    <td className={`px-4 py-3 text-center text-sm ${product.cheapest === 'DE' ? 'bg-ikea-pink-light font-semibold text-ikea-pink' : ''}`}>
                      {product.products.germany?.price ? `€${product.products.germany.price.toFixed(2)}` : '-'}
                    </td>
                    <td className="px-4 py-3 text-center">
                      {product.cheapest && (
                        <span className="inline-block px-2 py-1 bg-ikea-pink text-white text-xs font-medium uppercase tracking-wide">
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
          </>
        )}
      </div>
    </div>
  );
});

export default ShoppingListAnalysisComponent;
