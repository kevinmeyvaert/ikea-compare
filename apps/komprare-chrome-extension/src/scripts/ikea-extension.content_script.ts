// Content script for IKEA Price Compare Extension
// Injects price comparison widget on IKEA product pages

interface StoreAvailability {
  buCode: string;
  storeName: string;
  cashCarry: {
    quantity: number;
    available: boolean;
    stockLevel:
      | 'HIGH_IN_STOCK'
      | 'MEDIUM_IN_STOCK'
      | 'LOW_IN_STOCK'
      | 'OUT_OF_STOCK'
      | 'UNKNOWN';
    restockDate?: string;
    restockQuantity?: number;
  };
  clickCollect: {
    quantity: number;
    available: boolean;
    stockLevel:
      | 'HIGH_IN_STOCK'
      | 'MEDIUM_IN_STOCK'
      | 'LOW_IN_STOCK'
      | 'OUT_OF_STOCK'
      | 'UNKNOWN';
  };
  lastUpdated: string;
}

interface PriceData {
  country: 'BE' | 'NL' | 'FR' | 'DE';
  price: number;
  currency: string;
  available: boolean;
  url: string;
  storeAvailability?: StoreAvailability;
}

interface FetchPricesResponse {
  success: boolean;
  prices?: Record<string, PriceData>;
  error?: string;
}

const COUNTRY_NAMES: Record<string, string> = {
  BE: 'België',
  NL: 'Nederland',
  FR: 'Frankrijk',
  DE: 'Duitsland',
};

const COUNTRY_FLAGS: Record<string, string> = {
  BE: '🇧🇪',
  NL: '🇳🇱',
  FR: '🇫🇷',
  DE: '🇩🇪',
};

/**
 * Extract product ID from IKEA URL
 * URL format: https://www.ikea.com/be/nl/p/billy-bookcase-white-00263850/
 */
function extractProductId(): string | null {
  const urlMatch = window.location.pathname.match(/\/p\/[^/]+-(\d{8})\/?$/);
  if (urlMatch) {
    return urlMatch[1];
  }
  return null;
}

/**
 * Create the comparison widget container
 */
function createWidget(): HTMLDivElement {
  const widget = document.createElement('div');
  widget.id = 'ikea-price-compare-widget';
  widget.style.cssText = `
    position: fixed;
    bottom: 20px;
    right: 20px;
    width: 400px;
    max-height: 600px;
    background: white;
    border: 2px solid #000;
    padding: 0;
    z-index: 999999;
    font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', 'Roboto', 'Helvetica', 'Arial', sans-serif;
    overflow-y: auto;
  `;

  return widget;
}

/**
 * Create loading state
 */
function createLoadingState(): HTMLElement {
  const loading = document.createElement('div');
  loading.innerHTML = `
    <div>
      <div style="background: #0058A3; padding: 16px; border-bottom: 2px solid #000;">
        <img src="${chrome.runtime.getURL(
          'assets/logo.png'
        )}" alt="KOMPRÅRE" style="height: 50px; display: block; margin: 0 auto;" />
      </div>
      <div style="padding: 20px; text-align: center;">
        <p style="margin: 0; color: #484848; font-size: 16px; font-weight: 600;">Prijzen laden...</p>
        <div style="margin-top: 12px; width: 100%; height: 3px; background: #e0e0e0; overflow: hidden;">
          <div style="height: 100%; width: 50%; background: #0058A3; animation: loading 1.5s ease-in-out infinite;"></div>
        </div>
      </div>
    </div>
    <style>
      @keyframes loading {
        0% { transform: translateX(-100%); }
        100% { transform: translateX(200%); }
      }
    </style>
  `;
  return loading;
}

/**
 * Create price comparison table
 */
function createPriceTable(prices: Record<string, PriceData>): HTMLElement {
  const container = document.createElement('div');

  // Find cheapest price and Belgian price for comparison
  const priceValues = Object.values(prices).map((p) => p.price);
  const cheapestPrice = Math.min(...priceValues);
  const belgianPrice = prices['BE']?.price;

  // Header with logo
  const header = document.createElement('div');
  header.innerHTML = `
    <div style="background: #0058A3; padding: 16px; border-bottom: 2px solid #000;">
      <img src="${chrome.runtime.getURL(
        'assets/logo.png'
      )}" alt="KOMPRÅRE" style="height: 50px; display: block; margin: 0 auto;" />
    </div>
  `;
  container.appendChild(header);

  // Price rows (vertical list)
  const countries: Array<keyof typeof COUNTRY_FLAGS> = [
    'BE',
    'NL',
    'FR',
    'DE',
  ];
  countries.forEach((country, index) => {
    const priceData = prices[country];
    if (!priceData) return;

    const isCheapest = priceData.price === cheapestPrice;

    // Add separator before each row (except first)
    if (index > 0) {
      const separator = document.createElement('div');
      separator.style.cssText = `
        height: 1px;
        background: #dfdfdf;
        margin: 0 16px;
      `;
      container.appendChild(separator);
    }

    // Calculate difference compared to Belgium
    let priceDiff = '';
    if (belgianPrice && country !== 'BE') {
      const diff = priceData.price - belgianPrice;
      if (diff < 0) {
        priceDiff = `<span style="color: #16a34a; font-size: 12px; font-weight: 600;">-€${Math.abs(
          diff
        ).toFixed(2)}</span>`;
      } else if (diff > 0) {
        priceDiff = `<span style="color: #dc2626; font-size: 12px; font-weight: 600;">+€${diff.toFixed(
          2
        )}</span>`;
      }
    }

    // Get store name and build availability HTML
    let storeName = COUNTRY_NAMES[country]; // Fallback to country name
    let availabilityHTML = '';

    if (priceData.storeAvailability) {
      const avail = priceData.storeAvailability;
      storeName = avail.storeName || `Store ${avail.buCode}`;
      const quantity = avail.cashCarry.quantity;
      const stockLevel = avail.cashCarry.stockLevel;

      // Determine stock level color
      let stockColor = '#6b7280'; // gray default
      if (quantity > 0) {
        if (stockLevel === 'HIGH_IN_STOCK') stockColor = '#16a34a'; // green
        else if (stockLevel === 'MEDIUM_IN_STOCK')
          stockColor = '#eab308'; // yellow
        else if (stockLevel === 'LOW_IN_STOCK') stockColor = '#f97316'; // orange
      } else {
        stockColor = '#dc2626'; // red for out of stock
      }

      if (quantity > 0) {
        availabilityHTML = `
          <div style="margin-top: 2px; font-size: 12px; font-weight: 600; color: ${stockColor};">
            ${quantity} op voorraad
          </div>
        `;
      } else if (avail.cashCarry.restockDate) {
        const restockDate = new Date(
          avail.cashCarry.restockDate
        ).toLocaleDateString('nl-NL', {
          day: 'numeric',
          month: 'short',
        });
        availabilityHTML = `
          <div style="margin-top: 2px; font-size: 12px; font-weight: 600; color: ${stockColor};">
            Niet op voorraad
          </div>
          <div style="font-size: 11px; color: #6b7280;">
            Verwacht: ${restockDate}
          </div>
        `;
      } else {
        availabilityHTML = `
          <div style="margin-top: 2px; font-size: 12px; font-weight: 600; color: ${stockColor};">
            Niet op voorraad
          </div>
        `;
      }
    } else {
      availabilityHTML = `
        <div style="margin-top: 4px; font-size: 11px; color: #9ca3af; font-style: italic;">
          ℹ️ Open popup om winkel te selecteren
        </div>
      `;
    }

    const row = document.createElement('div');
    row.style.cssText = `
      display: flex;
      justify-content: space-between;
      align-items: center;
      padding: 16px;
      background: white;
      cursor: pointer;
      transition: background-color 0.2s;
    `;

    row.innerHTML = `
      <div style="display: flex; align-items: center; gap: 12px;">
        <span style="font-size: 18px;">${COUNTRY_FLAGS[country]}</span>
        <div>
          <div style="font-weight: 600; font-size: 14px; color: #111; margin-bottom: 2px;">
            ${storeName}
          </div>
          ${
            isCheapest
              ? '<div style="display: inline-block; background: #E91E63; color: white; padding: 2px 6px; font-size: 10px; font-weight: 700; letter-spacing: 0.5px;">BESTE PRIJS</div>'
              : ''
          }
          ${priceDiff ? `<div style="margin-top: 2px;">${priceDiff}</div>` : ''}
          ${availabilityHTML}
        </div>
      </div>
      <div style="display: flex; align-items: center; gap: 8px;">
        <div style="text-align: right;">
          <div style="font-weight: 700; font-size: 18px; color: #111;">
            €${priceData.price.toFixed(2)}
          </div>
        </div>
        <svg width="20" height="20" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg" style="opacity: 0.4;">
          <path d="M7.5 5L12.5 10L7.5 15" stroke="#111" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
        </svg>
      </div>
    `;

    // Make row clickable to open product page
    row.addEventListener('click', () => {
      window.open(priceData.url, '_blank');
    });

    row.addEventListener('mouseenter', () => {
      row.style.backgroundColor = '#f9fafb';
    });

    row.addEventListener('mouseleave', () => {
      row.style.backgroundColor = 'white';
    });

    container.appendChild(row);
  });

  // Close button
  const closeBtn = document.createElement('button');
  closeBtn.textContent = '✕ Sluiten';
  closeBtn.style.cssText = `
    width: 100%;
    padding: 14px;
    border: none;
    border-top: 2px solid #000;
    background: #f3f4f6;
    font-size: 14px;
    font-weight: 600;
    cursor: pointer;
    color: #111;
    transition: background 0.2s;
  `;
  closeBtn.addEventListener('mouseenter', () => {
    closeBtn.style.background = '#e5e7eb';
  });
  closeBtn.addEventListener('mouseleave', () => {
    closeBtn.style.background = '#f3f4f6';
  });
  closeBtn.addEventListener('click', () => {
    const widget = document.getElementById('ikea-price-compare-widget');
    if (widget) {
      widget.remove();
    }
  });
  container.appendChild(closeBtn);

  return container;
}

/**
 * Create error state
 */
function createErrorState(message: string): HTMLElement {
  const error = document.createElement('div');
  error.innerHTML = `
    <div>
      <div style="background: #0058A3; padding: 16px; border-bottom: 2px solid #000;">
        <img src="${chrome.runtime.getURL(
          'assets/logo.png'
        )}" alt="KOMPRÅRE" style="height: 50px; display: block; margin: 0 auto;" />
      </div>
      <div style="text-align: center; padding: 20px; background: #fee2e2; border-top: 2px solid #dc2626;">
        <p style="margin: 0; color: #991b1b; font-size: 16px; font-weight: 600;">⚠️ ${message}</p>
      </div>
    </div>
  `;
  return error;
}

/**
 * Fetch prices from background worker
 */
async function fetchPrices(
  productId: string
): Promise<Record<string, PriceData>> {
  return new Promise((resolve, reject) => {
    chrome.runtime.sendMessage(
      { type: 'FETCH_PRICES', productId },
      (response: FetchPricesResponse) => {
        if (response.success && response.prices) {
          resolve(response.prices);
        } else {
          reject(new Error(response.error || 'Failed to fetch prices'));
        }
      }
    );
  });
}

/**
 * Update widget with fresh prices
 */
async function updateWidget(productId: string) {
  const widget = document.getElementById('ikea-price-compare-widget');
  if (!widget) return;

  // Show loading state
  widget.innerHTML = '';
  widget.appendChild(createLoadingState());

  try {
    // Fetch prices
    const prices = await fetchPrices(productId);
    console.log('[KOMPRÅRE] Prijzen opgehaald:', prices);

    // Update widget with prices
    widget.innerHTML = '';
    widget.appendChild(createPriceTable(prices));
  } catch (error) {
    console.error('[KOMPRÅRE] Fout:', error);
    widget.innerHTML = '';
    widget.appendChild(
      createErrorState(
        error instanceof Error ? error.message : 'Onbekende fout'
      )
    );
  }
}

/**
 * Main function
 */
async function main() {
  console.log('[KOMPRÅRE] Content script geladen');

  // Extract product ID from URL
  const productId = extractProductId();
  if (!productId) {
    console.log('[KOMPRÅRE] Kon product ID niet uit URL halen');
    return;
  }

  console.log(`[KOMPRÅRE] Product ID gedetecteerd: ${productId}`);

  // Wait for page to load
  if (document.readyState === 'loading') {
    await new Promise((resolve) => {
      document.addEventListener('DOMContentLoaded', resolve);
    });
  }

  // Create and inject widget
  const widget = createWidget();
  widget.appendChild(createLoadingState());
  document.body.appendChild(widget);

  // Initial load
  await updateWidget(productId);

  // Listen for store preference updates
  chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
    if (message.type === 'STORE_PREFERENCES_UPDATED') {
      console.log('[KOMPRÅRE] Store preferences updated, refreshing widget...');
      updateWidget(productId)
        .then(() => {
          sendResponse({ success: true });
        })
        .catch((error) => {
          console.error('[KOMPRÅRE] Failed to update widget:', error);
          sendResponse({ success: false, error: error.message });
        });
      // Return true to indicate we'll send response asynchronously
      return true;
    }
    return false;
  });
}

// Run main function
main().catch(console.error);

export {};
