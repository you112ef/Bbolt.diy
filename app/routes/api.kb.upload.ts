import { json } from '@remix-run/cloudflare';
import { addDocument } from '~/lib/persistence/knowledgeStore';

export async function action({ request }: { request: Request }) {
  const contentType = request.headers.get('content-type') || '';

  if (!contentType.includes('multipart/form-data')) {
    return new Response('Unsupported Media Type', { status: 415 });
  }

  const form = await request.formData();
  const file = form.get('file') as File | null;

  if (!file) {
    return json({ error: 'file is required' }, { status: 400 });
  }

  const text = await file.text().catch(() => '');

  const id = `doc_${Date.now()}`;
  await addDocument({
    id,
    name: file.name,
    size: file.size,
    type: file.type,
    text,
    createdAt: new Date().toISOString(),
  });

  return json({ id, name: file.name, size: file.size, type: file.type });
}
