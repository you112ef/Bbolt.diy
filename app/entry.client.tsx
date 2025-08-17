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
		overlay.innerHTML = `<h1 style="margin:0 0 12px">App failed</h1><pre style="white-space:pre-wrap">${message}</pre>`;
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

function installGlobalErrorHandlers() {
	try {
		window.addEventListener('error', (ev) => {
			const msg = ev?.error?.stack || ev?.message || String(ev?.error || 'Unknown error');
			console.error('Global error:', ev?.error || ev);
			showFatalError(msg);
		});
		window.addEventListener('unhandledrejection', (ev) => {
			const reason: any = (ev as any)?.reason;
			const msg = reason?.stack || reason?.message || String(reason || 'Unhandled rejection');
			console.error('Unhandled rejection:', reason || ev);
			showFatalError(msg);
		});
	} catch (_) {
		// ignore
	}
}

startTransition(() => {
	installGlobalErrorHandlers();
	try {
		const rootEl = document.getElementById('root');
		if (!rootEl) {
			throw new Error('Missing #root element');
		}
		hydrateRoot(rootEl, <RemixBrowser />);
		console.log('[entry.client] Hydration started');
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
