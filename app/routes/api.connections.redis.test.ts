import type { ActionFunctionArgs } from '@remix-run/cloudflare';
import { json } from '@remix-run/cloudflare';

export const action = async ({ request }: ActionFunctionArgs) => {
  try {
    if (typeof process === 'undefined' || !process.versions?.node) {
      return json({ message: 'Server environment does not support Node.js drivers' }, { status: 501 });
    }

    const { host, port, password, database, ssl } = await request.json();
    if (!host) return json({ message: 'Missing host' }, { status: 400 });

    // Dynamically import to avoid bundling for CF runtime
    const { createClient } = await import('redis');

    const url = new URL(`${ssl ? 'rediss' : 'redis'}://${host}:${port || 6379}`);
    if (password) url.password = password;

    const client = createClient({ url: url.toString(), database: typeof database === 'number' ? database : 0 });

    client.on('error', () => {});

    await client.connect();

    const infoRaw = await client.info();
    const info: Record<string, string> = {};
    for (const line of infoRaw.split('\n')) {
      const idx = line.indexOf(':');
      if (idx > 0) {
        const key = line.slice(0, idx);
        const val = line.slice(idx + 1).trim();
        info[key] = val;
      }
    }

    const server = {
      version: info.redis_version,
      mode: info.redis_mode,
      memory: info.used_memory_human,
      clients: Number(info.connected_clients || 0),
    };

    await client.quit();

    return json({ ok: true, server });
  } catch (error) {
    return json(
      { message: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 },
    );
  }
};