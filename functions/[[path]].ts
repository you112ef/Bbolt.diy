import type { ServerBuild } from '@remix-run/cloudflare';
import { createPagesFunctionHandler } from '@remix-run/cloudflare-pages';
import * as build from 'virtual:remix/server-build';

export const onRequest: PagesFunction = async (context) => {
  try {
    const handler = createPagesFunctionHandler({
      build: build as unknown as ServerBuild,
      mode: (import.meta as any).env?.MODE || 'production',
    });

    try {
      return await handler(context);
    } catch (err) {
      console.error('[Worker] Error while handling request:', (err as any)?.stack || err);
      return new Response('Internal Error (handler)', { status: 500 });
    }
  } catch (err) {
    console.error(
      '[Worker] Failed to load server build via virtual:remix/server-build',
      (err as any)?.stack || err,
    );
    return new Response('Internal Error (server build missing)', { status: 500 });
  }
};
