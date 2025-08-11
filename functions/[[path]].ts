import type { ServerBuild } from '@remix-run/cloudflare';
import { createPagesFunctionHandler } from '@remix-run/cloudflare-pages';
// @ts-ignore - Resolved by Cloudflare Pages at deploy time
import * as serverBuild from '../build/server/index.js';

export const onRequest: PagesFunction = async (context) => {
  try {
    const handler = createPagesFunctionHandler({
      build: serverBuild as unknown as ServerBuild,
      mode: (import.meta as any).env?.MODE || 'production',
    });

    try {
      return await handler(context);
    } catch (err) {
      console.error('[Worker] Error while handling request:', (err as any)?.stack || err);
      return new Response('Internal Error (handler)', { status: 500 });
    }
  } catch (err) {
    console.error('[Worker] Failed to load server build via static import', (err as any)?.stack || err);
    return new Response('Internal Error (server build missing)', { status: 500 });
  }
};
