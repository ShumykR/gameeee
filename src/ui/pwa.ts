/** Registers the service worker and exposes the Android install prompt. */
export function setupPwa(onInstallable: (install: () => void) => void) {
  if ('serviceWorker' in navigator && import.meta.env.PROD) {
    const register = () => navigator.serviceWorker.register('./sw.js').catch(() => {});
    if (document.readyState === 'complete') register();
    else window.addEventListener('load', register);
  }
  window.addEventListener('beforeinstallprompt', (e: any) => {
    e.preventDefault();
    onInstallable(() => {
      e.prompt();
      e.userChoice.finally?.(() => {});
    });
  });
}
