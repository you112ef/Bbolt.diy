import { useStore } from '@nanostores/react';
import type { LinksFunction } from '@remix-run/cloudflare';
import { Links, Meta, Outlet, Scripts, ScrollRestoration } from '@remix-run/react';
import tailwindReset from '@unocss/reset/tailwind-compat.css?url';
import { themeStore } from './lib/stores/theme';
import { stripIndents } from './utils/stripIndent';
import { createHead } from 'remix-island';
import { useEffect } from 'react';
import { DndProvider } from 'react-dnd';
import { HTML5Backend } from 'react-dnd-html5-backend';
import { ClientOnly } from 'remix-utils/client-only';

import reactToastifyStyles from 'react-toastify/dist/ReactToastify.css?url';
import globalStyles from './styles/index.scss?url';
import xtermStyles from '@xterm/xterm/css/xterm.css?url';

import 'virtual:uno.css';

export const links: LinksFunction = () => [
  {
    rel: 'icon',
    href: '/favicon.svg',
    type: 'image/svg+xml',
  },
  { rel: 'icon', href: '/favicon-new.png', type: 'image/png' },
  { rel: 'apple-touch-icon', href: '/apple-touch-icon.png' },
  { rel: 'manifest', href: '/site.webmanifest' },
  { rel: 'stylesheet', href: reactToastifyStyles },
  { rel: 'stylesheet', href: tailwindReset },
  { rel: 'stylesheet', href: globalStyles },
  { rel: 'stylesheet', href: xtermStyles },
  {
    rel: 'preconnect',
    href: 'https://fonts.googleapis.com',
  },
  {
    rel: 'preconnect',
    href: 'https://fonts.gstatic.com',
    crossOrigin: 'anonymous',
  },
  {
    rel: 'stylesheet',
    href: 'https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap',
  },
  {
    rel: 'stylesheet',
    href: 'https://fonts.googleapis.com/css2?family=Cairo:wght@400;600;700&display=swap',
  },
];

const inlineThemeCode = stripIndents`
  setTutorialKitTheme();

  function setTutorialKitTheme() {
    let theme = localStorage.getItem('bolt_theme');

    if (!theme) {
      theme = window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
    }

    document.querySelector('html')?.setAttribute('data-theme', theme);
  }
`;

export const Head = createHead(() => (
  <>
    <meta charSet="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <meta name="apple-mobile-web-app-capable" content="yes" />
    <meta name="mobile-web-app-capable" content="yes" />
    <meta name="apple-mobile-web-app-status-bar-style" content="black-translucent" />
    <meta name="theme-color" content="#0EA5E9" />
    <Meta />
    <Links />

    <script dangerouslySetInnerHTML={{ __html: inlineThemeCode }} />
  </>
));

export function Layout({ children }: { children: React.ReactNode }) {
  const theme = useStore(themeStore);

  useEffect(() => {
    document.querySelector('html')?.setAttribute('data-theme', theme);
  }, [theme]);

  return (
    <>
      <DndProvider backend={HTML5Backend}>{children}</DndProvider>
      <ScrollRestoration />
      <Scripts />
    </>
  );
}

import { logStore } from './lib/stores/logs';
import { I18nProvider } from './lib/i18n';

export default function App() {
  const theme = useStore(themeStore);

  useEffect(() => {
    logStore.logSystem('Application initialized', {
      theme,
      platform: navigator.platform,
      userAgent: navigator.userAgent,
      timestamp: new Date().toISOString(),
    });
  }, []);

  return (
    <I18nProvider>
      <Layout>
        <Outlet />
      </Layout>
    </I18nProvider>
  );
}

export function ErrorBoundary({ error }: { error: Error }) {
  return (
    <html>
      <head>
        <title>Application Error</title>
      </head>
      <body style={{ padding: 20, fontFamily: 'ui-sans-serif, system-ui' }}>
        <h1 style={{ color: '#dc2626', marginBottom: 12 }}>Application Error</h1>
        <pre style={{ whiteSpace: 'pre-wrap', background: '#111827', color: '#f9fafb', padding: 12, borderRadius: 8 }}>
          {String(error?.message || error)}
        </pre>
        {error?.stack && (
          <details open style={{ marginTop: 12 }}>
            <summary>Stack trace</summary>
            <pre
              style={{ whiteSpace: 'pre-wrap', background: '#111827', color: '#f9fafb', padding: 12, borderRadius: 8 }}
            >
              {error.stack}
            </pre>
          </details>
        )}
        <script
          dangerouslySetInnerHTML={{ __html: 'console.error(' + JSON.stringify(String(error?.stack || error)) + ');' }}
        />
      </body>
    </html>
  );
}
