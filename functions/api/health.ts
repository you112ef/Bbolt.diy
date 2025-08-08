import type { PagesFunction } from '@remix-run/cloudflare';

export const onRequest: PagesFunction = async () => {
  const body = JSON.stringify({ status: 'ok', service: 'yousef-shtiwe-ai', timestamp: new Date().toISOString() });
  return new Response(body, {
    status: 200,
    headers: {
      'content-type': 'application/json; charset=utf-8',
      'cache-control': 'no-store',
      'access-control-allow-origin': '*',
    },
  });
};