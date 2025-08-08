import { RemixBrowser } from '@remix-run/react';
import { startTransition } from 'react';
import { hydrateRoot } from 'react-dom/client';

startTransition(() => {
  hydrateRoot(document.getElementById('root')!, <RemixBrowser />);

  // Polyfill BroadcastChannel only in the browser if missing
  (async () => {
    if (typeof window !== 'undefined' && typeof (window as any).BroadcastChannel === 'undefined') {
      try {
        const mod = await import('broadcast-channel');
        (window as any).BroadcastChannel = (mod as any).BroadcastChannel || (mod as any).default || (mod as any);
      } catch (err) {
        console.warn('Failed to polyfill BroadcastChannel:', err);
      }
    }
  })();

  if ('serviceWorker' in navigator) {
    const isLocalhost = Boolean(
      window.location.hostname === 'localhost' ||
        window.location.hostname === '127.0.0.1' ||
        window.location.hostname === '::1',
    );

    if (window.location.protocol === 'https:' || isLocalhost) {
      window.addEventListener('load', () => {
        navigator.serviceWorker
          .register('/sw.js')
          .then((reg) => {
            // Optional: listen for updates
            reg.onupdatefound = () => {
              const installing = reg.installing;
              if (!installing) return;
              installing.onstatechange = () => {
                if (installing.state === 'installed') {
                  // New content available; could show a toast to refresh
                  // console.log('Service worker installed');
                }
              };
            };
          })
          .catch((err) => {
            console.error('Service worker registration failed:', err);
          });
      });
    }
  }
});
