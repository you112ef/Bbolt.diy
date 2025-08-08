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
    href: '/favicon-enhanced.png',
    type: 'image/png',
    sizes: '32x32',
  },
  { rel: 'icon', href: '/favicon-enhanced.png', type: 'image/png', sizes: '16x16' },
  { rel: 'icon', href: '/favicon-enhanced.png', type: 'image/png', sizes: '192x192' },
  { rel: 'apple-touch-icon', href: '/favicon-enhanced.png', sizes: '180x180' },
  { rel: 'manifest', href: '/site.webmanifest' },
  { rel: 'preload', as: 'image', href: '/yousef-logo-enhanced.png', fetchPriority: 'high' as any },
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
    href: 'https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&family=Cairo:wght@400;500;600;700&display=swap',
  },
];

const inlineThemeCode = stripIndents`
  // Immediately set theme before React hydration to prevent flashing
  (function() {
    try {
      let theme = localStorage.getItem('bolt_theme');
      
      if (!theme) {
        theme = window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
        localStorage.setItem('bolt_theme', theme);
      }
      
      const html = document.documentElement;
      html.setAttribute('data-theme', theme);
      
      // Ensure the theme class is added immediately
      html.classList.add('theme-' + theme);
    } catch (e) {
      // Fallback to light theme if there's any error
      document.documentElement.setAttribute('data-theme', 'light');
      document.documentElement.classList.add('theme-light');
    }
  })();
`;

export const Head = createHead(() => (
  <>
    <meta charSet="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <meta name="apple-mobile-web-app-capable" content="yes" />
    <meta name="mobile-web-app-capable" content="yes" />
    <meta name="apple-mobile-web-app-status-bar-style" content="black-translucent" />
    <meta name="theme-color" content="#38bdf8" />
    <Meta />
    <Links />

    <script dangerouslySetInnerHTML={{ __html: inlineThemeCode }} />
  </>
));

export function Layout({ children }: { children: React.ReactNode }) {
  useEffect(() => {
    // Ensure Arabic language and right-to-left direction
    document.documentElement.lang = 'ar';
    document.documentElement.dir = 'rtl';

    // Subscribe to theme changes after initial hydration
    const unsubscribe = themeStore.subscribe((newTheme) => {
      const currentTheme = document.documentElement.getAttribute('data-theme');

      if (currentTheme !== newTheme) {
        document.documentElement.setAttribute('data-theme', newTheme);
        document.documentElement.className = document.documentElement.className.replace(/theme-\w+/g, '');
        document.documentElement.classList.add('theme-' + newTheme);
      }
    });

    return unsubscribe;
  }, []);

  return (
    <>
      <DndProvider backend={HTML5Backend}>{children}</DndProvider>
      <ScrollRestoration />
      <Scripts />
    </>
  );
}

import { logStore } from './lib/stores/logs';

export default function App() {
  useEffect(() => {
    // Initialize logging without reading theme immediately to prevent hydration mismatch
    const currentTheme = themeStore.get();
    logStore.logSystem('Application initialized', {
      theme: currentTheme,
      platform: navigator.platform,
      userAgent: navigator.userAgent,
      timestamp: new Date().toISOString(),
    });
  }, []);

  return (
    <Layout>
      <Outlet />
    </Layout>
  );
}
