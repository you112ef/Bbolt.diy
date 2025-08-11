import type { AppLoadContext } from '@remix-run/cloudflare';
import { RemixServer } from '@remix-run/react';
import { isbot } from 'isbot';
import { renderHeadToString } from 'remix-island';
import { Head } from './root';

// Import removed to prevent hydration mismatch

export default async function handleRequest(
  request: Request,
  responseStatusCode: number,
  responseHeaders: Headers,
  remixContext: any,
  _loadContext: AppLoadContext,
) {
  // await initializeModelList({});

  // Determine language and direction (default to Arabic/RTL)
  const cookies = request.headers.get('cookie') || '';
  const cookieLangMatch = cookies.match(/(?:^|;)\s*lang=([^;]+)/);
  let selectedLang = (cookieLangMatch && decodeURIComponent(cookieLangMatch[1])) || '';

  if (!selectedLang) {
    const acceptLanguage = request.headers.get('accept-language') || '';
    const prefersArabic = /\bar\b|\bar[-_]/i.test(acceptLanguage);
    selectedLang = prefersArabic ? 'ar' : 'en';
  }

  /* dir removed */

  // Dynamically import server renderer to avoid CJS named export issue in Vite
  const reactDomServer: any = await import('react-dom/server');

  const app = <RemixServer context={remixContext} url={request.url} />;

  let appHtml = '';

  try {
    if (typeof reactDomServer.renderToString === 'function') {
      appHtml = reactDomServer.renderToString(app);
    } else if (reactDomServer.default && typeof reactDomServer.default.renderToString === 'function') {
      appHtml = reactDomServer.default.renderToString(app);
    } else {
      throw new Error('renderToString is not available from react-dom/server');
    }
  } catch (error) {
    console.error(error);
    responseStatusCode = 500;
  }

  const head = renderHeadToString({ request, remixContext, Head });

  const fullHtml = `<!DOCTYPE html><html lang="${selectedLang}" data-theme="${themeStore.value}"><head>${head}</head><body><div id="root" class="w-full h-full">${appHtml}</div></body></html>`;

  const body = new ReadableStream({
    start(controller) {
<<<<<<< HEAD
      const head = renderHeadToString({ request, remixContext, Head });

      controller.enqueue(
        new Uint8Array(
          new TextEncoder().encode(
            `<!DOCTYPE html><html lang="en"><head>${head}</head><body><div id="root" class="w-full h-full">`,
          ),
        ),
      );

      const reader = readable.getReader();

      function read() {
        reader
          .read()
          .then(({ done, value }) => {
            if (done) {
              controller.enqueue(new Uint8Array(new TextEncoder().encode('</div></body></html>')));
              controller.close();

              return;
            }

            controller.enqueue(value);
            read();
          })
          .catch((error) => {
            controller.error(error);
            readable.cancel();
          });
      }
      read();
    },

    cancel() {
      readable.cancel();
=======
      controller.enqueue(new Uint8Array(new TextEncoder().encode(fullHtml)));
      controller.close();
>>>>>>> cursor/create-stealthy-multi-layered-code-f8fe
    },
  });

  if (isbot(request.headers.get('user-agent') || '')) {
    // Nothing special when using renderToString
  }

  responseHeaders.set('Content-Type', 'text/html');

  responseHeaders.set('Cross-Origin-Embedder-Policy', 'require-corp');
  responseHeaders.set('Cross-Origin-Opener-Policy', 'same-origin');

  return new Response(body, {
    headers: responseHeaders,
    status: responseStatusCode,
  });
}
