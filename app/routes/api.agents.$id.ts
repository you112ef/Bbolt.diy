import { json } from '@remix-run/cloudflare';
import { getAgent, upsertAgent, deleteAgent } from '~/lib/persistence/agentsStore';

export async function loader({ params }: { params: { id: string } }) {
  const agent = getAgent(params.id);

  if (!agent) {
    return json({ error: 'not found' }, { status: 404 });
  }

  return json({ agent });
}

export async function action({ request, params }: { request: Request; params: { id: string } }) {
  if (request.method === 'DELETE') {
    deleteAgent(params.id);
    return json({ ok: true });
  }

  const body = (await request.json()) as {
    name?: string;
    description?: string;
    systemPrompt?: string;
    tools?: string[];
  };
  const agent = upsertAgent({
    id: params.id,
    name: body.name || '',
    description: body.description || '',
    systemPrompt: body.systemPrompt || '',
    tools: body.tools || [],
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  });

  return json({ agent });
}
