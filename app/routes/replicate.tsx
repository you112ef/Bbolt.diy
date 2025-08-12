import { useState } from 'react';
import { json, type MetaFunction } from '@remix-run/cloudflare';

export const meta: MetaFunction = () => [
  { title: 'نسخ واجهة موقع – YOUSEF.SHTIWE' },
];

export const loader = () => json({});

export default function ReplicatePage() {
  const [url, setUrl] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);

    try {
      const u = new URL(url);
      if (!/^https?:$/.test(u.protocol)) throw new Error();
    } catch {
      setError('أدخل رابطاً صالحاً يبدأ بـ https:// أو http://');
      return;
    }

    setIsLoading(true);
    try {
      const res = await fetch('/api/replicate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ url }),
      });

      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        setError(data?.error || 'فشل الطلب');
        setIsLoading(false);
        return;
      }

      const blob = await res.blob();
      const a = document.createElement('a');
      a.href = URL.createObjectURL(blob);
      a.download = 'replica.zip';
      document.body.appendChild(a);
      a.click();
      a.remove();
      URL.revokeObjectURL(a.href);
      setIsLoading(false);
    } catch (err: any) {
      setError('حدث خطأ غير متوقع');
      setIsLoading(false);
    }
  }

  return (
    <div className="max-w-2xl mx-auto p-6">
      <h1 className="text-2xl font-bold mb-4 text-bolt-elements-textPrimary">نسخ واجهة موقع</h1>
      <p className="text-sm text-bolt-elements-textSecondary mb-6">
        أدخل رابط الموقع لالتقاط لقطة واجهته بشكل آمن مع أنماط CSS مضمنة بدون سكربتات.
      </p>
      <form onSubmit={onSubmit} className="flex gap-2">
        <input
          type="url"
          dir="ltr"
          value={url}
          onChange={(e) => setUrl(e.target.value)}
          placeholder="https://example.com"
          className="flex-1 px-3 py-2 rounded border border-bolt-elements-borderColor bg-bolt-elements-background-depth-2"
          required
          pattern="https?://.*"
        />
        <button
          type="submit"
          disabled={isLoading}
          className="px-4 py-2 rounded bg-accent text-white disabled:opacity-60"
        >
          {isLoading ? '...جاري' : 'نسخ'}
        </button>
      </form>
      {error && <div className="mt-3 text-bolt-elements-icon-error text-sm">{error}</div>}
      <div className="mt-6 text-xs text-bolt-elements-textSecondary">
        ملاحظة: احترم حقوق النشر وسياسات المواقع. استخدم اللقطة لأغراض التعلم أو ضمن صلاحياتك القانونية فقط.
      </div>
    </div>
  );
}