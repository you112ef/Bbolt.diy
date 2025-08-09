import type { ActionFunctionArgs } from '@remix-run/cloudflare';
import { json } from '@remix-run/cloudflare';

export const action = async ({ request }: ActionFunctionArgs) => {
  try {
    const body = (await request.json()) as { connectionString?: string };
    const uri = body?.connectionString || '';

    if (!uri || (!uri.startsWith('mongodb://') && !uri.startsWith('mongodb+srv://'))) {
      return json({ error: 'Invalid MongoDB connection string' }, { status: 400 });
    }

    // Avoid bundling: use dynamic import shim
    const dynamicImport = (m: string) => new Function('m', 'return import(m)')(m) as Promise<any>;

    let MongoClient: any;
    try {
      const mod = await dynamicImport('mongodb');
      MongoClient = mod.MongoClient || mod.default?.MongoClient;
      if (!MongoClient) throw new Error('No MongoClient export');
    } catch (e) {
      return json({ error: 'MongoDB driver not available in this runtime' }, { status: 400 });
    }

    const client = new MongoClient(uri, { serverSelectionTimeoutMS: 3000 });

    try {
      await client.connect();
      const admin = client.db().admin();
      const [statusInfo, buildInfo] = await Promise.all([
        admin.serverStatus().catch(() => ({} as any)),
        admin.buildInfo().catch(() => ({} as any)),
      ]);

      const result = {
        isConnected: true,
        connectionInfo: {
          serverVersion: buildInfo?.version,
          platform: buildInfo?.platform,
          maxWireVersion: statusInfo?.maxWireVersion,
        },
      };

      return json(result);
    } finally {
      try {
        await client.close();
      } catch {}
    }
  } catch (error) {
    return json({ error: error instanceof Error ? error.message : 'Unknown error' }, { status: 500 });
  }
};