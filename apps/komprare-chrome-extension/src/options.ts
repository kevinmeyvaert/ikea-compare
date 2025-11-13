import './options.scss';
const colorSelect = document.querySelector<HTMLSelectElement>('select');
chrome.storage.local.get('color').then((storage: Partial<StorageState>) => {
  if (storage.color && colorSelect) {
    colorSelect.value = storage.color;
  }
});
if (colorSelect) {
  colorSelect.addEventListener('change', async () => {
    await chrome.storage.local.set({ color: colorSelect.value });
  });
}
