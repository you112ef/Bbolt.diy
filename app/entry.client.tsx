import { RemixBrowser } from '@remix-run/react';
import { startTransition } from 'react';
import { hydrateRoot } from 'react-dom/client';

function showFatalError(message: string, details?: unknown) {
	try {
		const overlay = document.createElement('div');
		overlay.style.position = 'fixed';
		overlay.style.inset = '0';
		overlay.style.background = 'black';
		overlay.style.color = 'white';
		overlay.style.zIndex = '99999';
		overlay.style.padding = '24px';
		overlay.style.fontFamily = 'system-ui, sans-serif';
		overlay.innerHTML = `<h1 style="margin:0 0 12px">App failed to start</h1><pre style="white-space:pre-wrap">${message}</pre>`;
		if (details) {
			const pre = document.createElement('pre');
			pre.textContent = typeof details === 'string' ? details : JSON.stringify(details, null, 2);
			pre.style.whiteSpace = 'pre-wrap';
			overlay.appendChild(pre);
		}
		document.body.appendChild(overlay);
	} catch (_) {
		// ignore
	}
}

startTransition(() => {
	try {
		const rootEl = document.getElementById('root');
		if (!rootEl) {
			throw new Error('Missing #root element');
		}
		hydrateRoot(rootEl, <RemixBrowser />);
	} catch (err) {
		console.error('Hydration failed:', err);
		showFatalError('Hydration failed. Check console for details.', err instanceof Error ? err.stack || err.message : err);
	}

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
						reg.onupdatefound = () => {
							const installing = reg.installing;

							if (!installing) {
								return;
							}

							installing.onstatechange = () => {
								if (installing.state === 'installed') {
									// New content available
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
