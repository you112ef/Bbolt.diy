import { json } from '@remix-run/cloudflare';
import { listAgents, upsertAgent } from '~/lib/persistence/agentsStore';

export async function loader() {
  return json({ agents: listAgents() });
}

export async function action({ request }: { request: Request }) {
  const body = await request.json();
  const id = body.id || body.name?.toLowerCase().replace(/\s+/g, '-');
  if (!id || !body.name) return json({ error: 'id and name required' }, { status: 400 });
  const agent = upsertAgent({
    id,
    name: body.name,
    description: body.description,
    systemPrompt: body.systemPrompt,
    tools: body.tools || [],
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  });
  return json({ agent });
}