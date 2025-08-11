import type { ServerBuild } from '@remix-run/cloudflare';
import { createPagesFunctionHandler } from '@remix-run/cloudflare-pages';

export const onRequest: PagesFunction = async (context) => {
  try {
    const serverBuild = (await import('../build/server')) as unknown as ServerBuild;

    const handler = createPagesFunctionHandler({
      build: serverBuild,
    });

    try {
      return await handler(context);
    } catch (err) {
      console.error('[Worker] Error while handling request:', (err as any)?.stack || err);
      return new Response('Internal Error (handler)', { status: 500 });
    }
  } catch (err) {
    console.error('[Worker] Failed to load server build. Did the Pages build run remix vite:build?', (err as any)?.stack || err);
    return new Response('Internal Error (server build missing)', { status: 500 });
  }
};
