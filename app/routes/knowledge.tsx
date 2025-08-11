import type { MetaFunction } from '@remix-run/cloudflare';
import { Header } from '~/components/header/Header';
import React, { useEffect, useState } from 'react';

export const meta: MetaFunction = () => {
  return [
    { title: 'Knowledge | YOUSEF.SHTIWE AI' },
    { name: 'description', content: 'إدارة قاعدة المعرفة والمستندات' },
  ];
};

interface DocItem {
  id: string;
  name: string;
  size: number;
  type: string;
  createdAt: string;
}
interface SearchResult {
  id: string;
  score: number;
  snippet: string;
  name: string;
}

export default function KnowledgeRoute() {
  const [docs, setDocs] = useState<DocItem[]>([]);
  const [results, setResults] = useState<SearchResult[]>([]);
  const [query, setQuery] = useState('');
  const [uploading, setUploading] = useState(false);

  const refresh = async (q?: string) => {
    const res = await fetch(`/api/kb/search${q ? `?q=${encodeURIComponent(q)}` : ''}`);
    const data = (await res.json()) as { docs?: DocItem[]; results?: SearchResult[] };
    setDocs(data.docs || []);
    setResults(data.results || []);
  };

  useEffect(() => {
    refresh();
  }, []);

  const onUpload = async (file: File) => {
    setUploading(true);

    try {
      const form = new FormData();
      form.append('file', file);
      await fetch('/api/kb/upload', { method: 'POST', body: form });
      await refresh(query);
    } finally {
      setUploading(false);
    }
  };

  const onDelete = async (id: string) => {
    await fetch(`/api/kb/search?id=${encodeURIComponent(id)}`, { method: 'DELETE' });
    await refresh(query);
  };

  return (
    <div className="flex flex-col h-full w-full bg-bolt-elements-background-depth-1">
      <Header />
      <div className="max-w-5xl mx-auto w-full p-4 flex flex-col gap-4">
        <div className="flex items-center gap-3">
          <input
            type="file"
            accept=".txt,.md,.json,.csv,.log,.html,.xml,.js,.ts,.tsx,.py,.java,.go,.rb,.php,.cs,.c,.cpp,.h,.hpp,.sh"
            onChange={(e) => e.target.files && onUpload(e.target.files[0])}
            disabled={uploading}
          />
          {uploading && <span className="text-sm text-bolt-elements-textSecondary">جاري الرفع...</span>}
          <input
            className="flex-1 rounded border border-gray-700 bg-transparent p-2"
            placeholder="ابحث في قاعدة المعرفة"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && refresh(query)}
          />
          <button className="px-3 py-2 bg-blue-600 rounded" onClick={() => refresh(query)}>
            بحث
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="rounded border border-gray-800 p-3">
            <h3 className="font-semibold mb-2">الوثائق</h3>
            <ul className="space-y-2">
              {docs.map((d) => (
                <li key={d.id} className="flex items-center justify-between gap-2 text-sm">
                  <span className="truncate">
                    {d.name} <span className="opacity-60">({d.size}B)</span>
                  </span>
                  <button className="text-red-400" onClick={() => onDelete(d.id)}>
                    حذف
                  </button>
                </li>
              ))}
              {docs.length === 0 && <li className="opacity-60">لا توجد وثائق بعد</li>}
            </ul>
          </div>

          <div className="rounded border border-gray-800 p-3">
            <h3 className="font-semibold mb-2">نتائج البحث</h3>
            <ul className="space-y-2">
              {results.map((r) => (
                <li key={r.id} className="text-sm">
                  <div className="font-medium">
                    {r.name} <span className="opacity-60">— {r.score.toFixed(2)}</span>
                  </div>
                  <div className="opacity-70 whitespace-pre-wrap">{r.snippet}</div>
                </li>
              ))}
              {results.length === 0 && <li className="opacity-60">لا توجد نتائج</li>}
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}
