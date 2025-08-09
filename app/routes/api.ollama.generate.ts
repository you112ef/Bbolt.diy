import type { ActionFunctionArgs } from '@remix-run/cloudflare';
import { json } from '@remix-run/cloudflare';

export const action = async ({ context, request }: ActionFunctionArgs) => {
  try {
    const { model, prompt, options } = (await request.json()) as {
      model: string;
      prompt: string;
      options?: Record<string, unknown>;
    };

    if (!model || typeof model !== 'string') {
      return json({ error: 'Model is required' }, { status: 400 });
    }

    const cfEnv: any = (context as any)?.cloudflare?.env;
    const base = cfEnv?.OLLAMA_API_BASE_URL ?? (process as any)?.env?.OLLAMA_API_BASE_URL ?? (import.meta as any)?.env?.OLLAMA_API_BASE_URL;

    if (!base) {
      return json({ error: 'OLLAMA_API_BASE_URL not configured' }, { status: 400 });
    }

    const url = `${String(base).replace(/\/$/, '')}/api/generate`;
    const res = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ model, prompt, options }),
    });

    const text = await res.text();
    let data: any = undefined;
    try { data = JSON.parse(text); } catch { data = { response: text }; }

    return json(data, { status: res.status });
  } catch (error) {
    return json({ error: error instanceof Error ? error.message : 'Unknown error' }, { status: 500 });
  }
};