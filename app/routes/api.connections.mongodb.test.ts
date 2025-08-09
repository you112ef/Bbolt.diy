import type { ActionFunctionArgs } from '@remix-run/cloudflare';
import { json } from '@remix-run/cloudflare';

export const action = async ({ request }: ActionFunctionArgs) => {
  try {
    if (typeof process === 'undefined' || !process.versions?.node) {
      return json({ message: 'Server environment does not support Node.js drivers' }, { status: 501 });
    }

    const { connectionString } = await request.json();
    if (!connectionString || typeof connectionString !== 'string') {
      return json({ message: 'Missing connectionString' }, { status: 400 });
    }

    // Dynamically import to avoid bundling for CF runtime
    const { MongoClient } = await import('mongodb');

    const client = new MongoClient(connectionString, { serverSelectionTimeoutMS: 3000 });
    try {
      await client.connect();
      const admin = client.db().admin();
      const info = await admin.serverStatus().catch(() => null);
      const buildInfo = await admin.buildInfo().catch(() => null);

      return json({
        ok: true,
        server: {
          version: buildInfo?.version,
          platform: buildInfo?.platform,
          maxWireVersion: info?.maxWireVersion,
        },
      });
    } finally {
      await client.close().catch(() => {});
    }
  } catch (error) {
    return json(
      { message: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 },
    );
  }
};