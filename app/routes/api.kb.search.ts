import { json } from '@remix-run/cloudflare';

export async function loader({ request }: { request: Request }) {
  const url = new URL(request.url);
  const q = url.searchParams.get('q') || '';
  if (!q) return json({ results: [] });

  // TODO: Perform vector search via pgvector or external service.
  return json({
    results: [
      {
        id: 'stub-1',
        score: 0.8,
        snippet: `نتيجة أولية للبحث عن: ${q}`,
      },
    ],
  });
}