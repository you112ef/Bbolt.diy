import { json } from '@remix-run/cloudflare';
import { listDocuments, searchDocuments, deleteDocument } from '~/lib/persistence/knowledgeStore';

export async function loader({ request }: { request: Request }) {
  const url = new URL(request.url);
  const q = url.searchParams.get('q');
  const docs = await listDocuments();

  if (!q) {
    return json({ results: [], docs });
  }

  const results = await searchDocuments(q);

  return json({ results, docs });
}

export async function action({ request }: { request: Request }) {
  const url = new URL(request.url);
  const id = url.searchParams.get('id');

  if (request.method === 'DELETE' && id) {
    await deleteDocument(id);
    return json({ ok: true });
  }

  return json({ error: 'unsupported' }, { status: 400 });
}
