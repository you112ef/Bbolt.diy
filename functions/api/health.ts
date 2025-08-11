type PagesFn = (context: any) => Response | Promise<Response>;

export const onRequest: PagesFn = async () => {
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