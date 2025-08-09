import { json } from '@remix-run/cloudflare';

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

  // TODO: Persist file (S3/minio) and schedule indexing job
  const docId = `doc_${Date.now()}`;
  const name = file.name;
  const size = file.size;
  const type = file.type;

  return json({ id: docId, name, size, type });
}