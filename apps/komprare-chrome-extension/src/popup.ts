// KOMPRÅRE Extension Popup - Store Settings
import { getStoresByCountry } from './utils/stores';
import * as ChromeStorage from './services/chrome-storage.service';
import './popup.scss';

// UI Elements
const loadingEl = document.getElementById('loading') as HTMLDivElement;
const storeSelectorsEl = document.getElementById(
  'store-selectors'
) as HTMLDivElement;
const storeBE = document.getElementById('store-be') as HTMLSelectElement;
const storeNL = document.getElementById('store-nl') as HTMLSelectElement;
const storeFR = document.getElementById('store-fr') as HTMLSelectElement;
const storeDE = document.getElementById('store-de') as HTMLSelectElement;
const saveBtn = document.getElementById('save-btn') as HTMLButtonElement;

/**
 * Populate store dropdowns
 */
function populateStoreDropdowns(): void {
  const countries: Array<{
    code: 'BE' | 'NL' | 'FR' | 'DE';
    element: HTMLSelectElement;
  }> = [
    { code: 'BE', element: storeBE },
    { code: 'NL', element: storeNL },
    { code: 'FR', element: storeFR },
    { code: 'DE', element: storeDE },
  ];

  countries.forEach(({ code, element }) => {
    const stores = getStoresByCountry(code);
    stores.forEach((store) => {
      const option = document.createElement('option');
      option.value = store.buCode;
      option.textContent = store.name;
      element.appendChild(option);
    });
  });
}

/**
 * Load current store preferences from Chrome Storage
 */
async function loadCurrentPreferences(): Promise<void> {
  try {
    const preferences = await ChromeStorage.getStorePreferences();

    if (preferences.be) storeBE.value = preferences.be;
    if (preferences.nl) storeNL.value = preferences.nl;
    if (preferences.fr) storeFR.value = preferences.fr;
    if (preferences.de) storeDE.value = preferences.de;
  } catch (error) {
    console.error('[Popup] Failed to load preferences:', error);
  }
}

/**
 * Save store preferences to Chrome Storage
 */
async function savePreferences(): Promise<void> {
  try {
    saveBtn.disabled = true;
    saveBtn.textContent = 'Opslaan...';

    // Save each country's selected store using Chrome Storage
    const updates = [
      { code: 'BE' as const, buCode: storeBE.value },
      { code: 'NL' as const, buCode: storeNL.value },
      { code: 'FR' as const, buCode: storeFR.value },
      { code: 'DE' as const, buCode: storeDE.value },
    ];

    for (const { code, buCode } of updates) {
      if (buCode) {
        await ChromeStorage.setSelectedStore(code, buCode);
      }
    }

    // Notify all IKEA product page tabs to update their widgets
    const tabs = await chrome.tabs.query({
      url: [
        'https://www.ikea.com/be/*/p/*',
        'https://www.ikea.com/nl/*/p/*',
        'https://www.ikea.com/fr/*/p/*',
        'https://www.ikea.com/de/*/p/*',
      ],
    });

    tabs.forEach((tab) => {
      if (tab.id) {
        chrome.tabs
          .sendMessage(tab.id, { type: 'STORE_PREFERENCES_UPDATED' })
          .catch(() => {
            // Tab might not have content script loaded yet, ignore
          });
      }
    });

    console.log(
      '[Popup] Preferences saved successfully, notified',
      tabs.length,
      'tabs'
    );

    // Close popup immediately
    window.close();
  } catch (error) {
    console.error('[Popup] Failed to save preferences:', error);
    alert('Fout bij opslaan van instellingen. Probeer het opnieuw.');
  } finally {
    saveBtn.disabled = false;
    saveBtn.textContent = 'Opslaan';
  }
}

/**
 * Initialize popup
 */
async function initialize(): Promise<void> {
  try {
    // Populate dropdowns with stores
    populateStoreDropdowns();

    // Load current preferences from Chrome Storage
    await loadCurrentPreferences();

    // Show store selectors, hide loading
    loadingEl.style.display = 'none';
    storeSelectorsEl.style.display = 'flex';

    // Add save button listener
    saveBtn.addEventListener('click', savePreferences);

    console.log('[Popup] Initialized successfully');
  } catch (error) {
    console.error('[Popup] Initialization failed:', error);
    loadingEl.innerHTML = `
      <p style="color: #dc2626;">Fout bij laden van instellingen.</p>
      <p style="font-size: 12px; color: #6b7280;">Probeer de extensie opnieuw te laden.</p>
    `;
  }
}

// Run initialization when popup opens
initialize().catch(console.error);
