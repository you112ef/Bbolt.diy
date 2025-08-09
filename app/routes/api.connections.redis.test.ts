import type { ActionFunctionArgs } from '@remix-run/cloudflare';
import { json } from '@remix-run/cloudflare';

export const action = async ({ request }: ActionFunctionArgs) => {
  try {
    const body = (await request.json()) as {
      host: string;
      port?: number;
      password?: string;
      db?: number;
      ssl?: boolean;
    };

    if (!body?.host) {
      return json({ error: 'Host is required' }, { status: 400 });
    }

    const dynamicImport = (m: string) => new Function('m', 'return import(m)')(m) as Promise<any>;

    let IORedis: any;
    try {
      const mod = await dynamicImport('ioredis');
      IORedis = mod.default || mod;
    } catch (e) {
      return json({ error: 'Redis client not available in this runtime' }, { status: 400 });
    }

    const port = body.port ?? 6379;
    const tls = body.ssl ? {} : undefined;

    const client = new IORedis({
      host: body.host,
      port,
      password: body.password,
      db: body.db ?? 0,
      tls,
      connectTimeout: 3000,
      lazyConnect: false,
    });

    try {
      const infoStr: string = await client.info('server');
      const memStr: string = await client.info('memory');
      const clientsStr: string = await client.info('clients');

      const parseInfo = (s: string) => Object.fromEntries(s.split('\n').map((l) => l.split(':') as [string, string]).filter((a) => a[1]));
      const server = parseInfo(infoStr);
      const memory = parseInfo(memStr);
      const clients = parseInfo(clientsStr);

      return json({
        isConnected: true,
        serverInfo: {
          version: server.redis_version,
          mode: server.redis_mode,
          memory: memory.used_memory_human,
          clients: parseInt(clients.connected_clients || '0', 10),
        },
      });
    } finally {
      try { client.disconnect(); } catch {}
    }
  } catch (error) {
    return json({ error: error instanceof Error ? error.message : 'Unknown error' }, { status: 500 });
  }
};