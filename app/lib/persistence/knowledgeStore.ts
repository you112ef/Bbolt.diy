export type KnowledgeDocument = {
  id: string;
  name: string;
  size: number;
  type: string;
  text?: string;
  createdAt: string;
};

export type KnowledgeStore = {
  docs: Map<string, KnowledgeDocument>;
};

// Use a global store to survive module reloads in dev
const g = globalThis as any;
if (!g.__knowledgeStore) {
  g.__knowledgeStore = { docs: new Map<string, KnowledgeDocument>() } as KnowledgeStore;
}

export const knowledgeStore: KnowledgeStore = g.__knowledgeStore as KnowledgeStore;

export function addDocument(doc: KnowledgeDocument) {
  knowledgeStore.docs.set(doc.id, doc);
}

export function getDocument(id: string) {
  return knowledgeStore.docs.get(id);
}

export function listDocuments(): KnowledgeDocument[] {
  return Array.from(knowledgeStore.docs.values()).sort((a, b) => (a.createdAt < b.createdAt ? 1 : -1));
}

export function deleteDocument(id: string) {
  knowledgeStore.docs.delete(id);
}

export function searchDocuments(query: string, limit = 10) {
  const q = query.toLowerCase();
  const scored = Array.from(knowledgeStore.docs.values())
    .map((d) => {
      const hay = `${d.name}\n${d.text || ''}`.toLowerCase();
      const count = hay.split(q).length - 1;
      const score = count > 0 ? count + Math.min((d.text || '').length / 10000, 1) : 0;
      const snippetIndex = (d.text || '').toLowerCase().indexOf(q);
      const start = Math.max(0, snippetIndex - 60);
      const end = Math.min((d.text || '').length, start + 160);
      const snippet = snippetIndex >= 0 ? (d.text || '').slice(start, end) : '';
      return { doc: d, score, snippet };
    })
    .filter((x) => x.score > 0)
    .sort((a, b) => b.score - a.score)
    .slice(0, limit);

  return scored.map((s) => ({ id: s.doc.id, score: s.score, snippet: s.snippet, name: s.doc.name }));
}