export type AgentRecord = {
  id: string;
  name: string;
  description?: string;
  systemPrompt?: string;
  tools?: string[];
  createdAt: string;
  updatedAt: string;
};

const g = globalThis as any;
if (!g.__agentsStore) {
  const now = new Date().toISOString();
  g.__agentsStore = {
    agents: new Map<string, AgentRecord>([
      [
        'explainer',
        {
          id: 'explainer',
          name: 'Explainer',
          description: 'Explains code and concepts',
          systemPrompt:
            'You are a helpful code explainer. Be concise and clear. Use Arabic where possible.',
          tools: [],
          createdAt: now,
          updatedAt: now,
        },
      ],
      [
        'reviewer',
        {
          id: 'reviewer',
          name: 'Reviewer',
          description: 'Reviews code for quality and issues',
          systemPrompt:
            'You are a strict code reviewer. Follow best practices. Provide actionable feedback.',
          tools: [],
          createdAt: now,
          updatedAt: now,
        },
      ],
    ]),
  } as { agents: Map<string, AgentRecord> };
}

const store = g.__agentsStore as { agents: Map<string, AgentRecord> };

export function listAgents(): AgentRecord[] {
  return Array.from(store.agents.values()).sort((a, b) => a.name.localeCompare(b.name));
}

export function getAgent(id: string): AgentRecord | undefined {
  return store.agents.get(id);
}

export function upsertAgent(agent: AgentRecord): AgentRecord {
  const now = new Date().toISOString();
  const existing = store.agents.get(agent.id);
  const rec: AgentRecord = {
    id: agent.id,
    name: agent.name,
    description: agent.description,
    systemPrompt: agent.systemPrompt,
    tools: agent.tools || [],
    createdAt: existing?.createdAt || now,
    updatedAt: now,
  };
  store.agents.set(rec.id, rec);
  return rec;
}

export function deleteAgent(id: string): boolean {
  return store.agents.delete(id);
}