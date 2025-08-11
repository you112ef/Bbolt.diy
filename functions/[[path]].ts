import type { ServerBuild } from '@remix-run/cloudflare';
import { createPagesFunctionHandler } from '@remix-run/cloudflare-pages';

export const onRequest: PagesFunction = async (context) => {
  try {
    let serverBuild: ServerBuild | undefined;

    // Prefer build colocated with functions (Cloudflare Pages bundle)
    try {
      const localPath = `./build/server`;
      serverBuild = (await import(localPath)) as unknown as ServerBuild;
    } catch {
      // Fallback to repo-root build (local/dev)
      const repoRootPath = `../build/server`;
      serverBuild = (await import(repoRootPath)) as unknown as ServerBuild;
    }

    const handler = createPagesFunctionHandler({ build: serverBuild });

    try {
      return await handler(context);
    } catch (err) {
      console.error('[Worker] Error while handling request:', (err as any)?.stack || err);
      return new Response('Internal Error (handler)', { status: 500 });
    }
  } catch (err) {
    console.error(
      '[Worker] Failed to load server build. Did the Pages build run remix vite:build?',
      (err as any)?.stack || err,
    );
    return new Response('Internal Error (server build missing)', { status: 500 });
  }
};
