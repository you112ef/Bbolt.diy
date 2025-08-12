import type { ActionFunctionArgs } from '@remix-run/cloudflare';
import JSZip from 'jszip';

function isValidHttpUrl(input: string): boolean {
  try {
    const u = new URL(input);
    return u.protocol === 'http:' || u.protocol === 'https:';
  } catch {
    return false;
  }
}

function absoluteUrl(base: string, href: string | null): string | null {
  if (!href) return null;
  try {
    return new URL(href, base).toString();
  } catch {
    return null;
  }
}

function stripScripts(html: string): string {
  return html.replace(/<script[\s\S]*?>[\s\S]*?<\/script>/gi, '');
}

function extractStylesheets(html: string): string[] {
  const links: string[] = [];
  const regex = /<link\s+[^>]*rel=("|')stylesheet\1[^>]*>/gi;
  let match: RegExpExecArray | null;
  while ((match = regex.exec(html)) !== null) {
    const tag = match[0];
    const hrefMatch = tag.match(/href=("|')(.*?)\1/i);
    if (hrefMatch && hrefMatch[2]) links.push(hrefMatch[2]);
  }
  return links;
}

function extractInlineStyles(html: string): string[] {
  const styles: string[] = [];
  const regex = /<style[^>]*>([\s\S]*?)<\/style>/gi;
  let match: RegExpExecArray | null;
  while ((match = regex.exec(html)) !== null) {
    styles.push(match[1]);
  }
  return styles;
}

function rewriteRelativeResourceUrls(html: string, base: string): string {
  // Convert href/src/action URLs to absolute for common elements
  const attrs = ['href', 'src', 'action', 'data-src', 'poster'];
  let output = html;
  for (const attr of attrs) {
    const attrRegex = new RegExp(`${attr}=("|')(.*?)\\1`, 'gi');
    output = output.replace(attrRegex, (_m, quote, value) => {
      const abs = absoluteUrl(base, value);
      if (!abs) return `${attr}=${quote}${value}${quote}`;
      return `${attr}=${quote}${abs}${quote}`;
    });
  }
  // Also rewrite CSS url(...) inside style attributes
  output = output.replace(/style=("|')(.*?)\1/gi, (_m, quote, styleContent) => {
    const rewritten = styleContent.replace(/url\(([^)]+)\)/gi, (m, p1) => {
      const raw = p1.trim().replace(/^['"]|['"]$/g, '');
      const abs = absoluteUrl(base, raw);
      return `url(${abs ?? raw})`;
    });
    return `style=${quote}${rewritten}${quote}`;
  });
  return output;
}

export async function action({ request }: ActionFunctionArgs) {
  if (request.method !== 'POST') {
    return new Response('Method Not Allowed', { status: 405 });
  }

  const { url } = await request.json<{ url?: string }>();

  if (!url || !isValidHttpUrl(url)) {
    return new Response(JSON.stringify({ error: 'يرجى إدخال رابط صالح يبدأ بـ http أو https' }), {
      status: 400,
      headers: { 'Content-Type': 'application/json; charset=utf-8' },
    });
  }

  // Respect basic constraints: do not fetch localhost or private IPs
  try {
    const parsed = new URL(url);
    const hostname = parsed.hostname.toLowerCase();
    if (hostname === 'localhost' || hostname.endsWith('.local') || /^\d+\.\d+\.\d+\.\d+$/.test(hostname)) {
      return new Response(JSON.stringify({ error: 'لا يمكن جلب محتوى من عناوين محلية أو خاصة' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json; charset=utf-8' },
      });
    }
  } catch {}

  try {
    const res = await fetch(url, { redirect: 'follow' });
    if (!res.ok) {
      return new Response(JSON.stringify({ error: `فشل الجلب: ${res.status}` }), {
        status: 502,
        headers: { 'Content-Type': 'application/json; charset=utf-8' },
      });
    }

    let html = await res.text();

    // Basic sanitation and style collection
    html = stripScripts(html);

    const baseHref = url;
    const linkedSheets = extractStylesheets(html)
      .map((h) => absoluteUrl(baseHref, h))
      .filter((h): h is string => !!h);

    const inlineStyles = extractInlineStyles(html);

    // Fetch linked styles with simple fail-safety
    const fetchedStyles: string[] = [];
    for (const sheet of linkedSheets.slice(0, 15)) {
      try {
        const cssRes = await fetch(sheet, { redirect: 'follow' });
        if (cssRes.ok) {
          const css = await cssRes.text();
          fetchedStyles.push(`/* ${sheet} */\n${css}`);
        }
      } catch {
        // ignore individual stylesheet failures
      }
    }

    // Build a minimal, safe HTML snapshot
    let body = html;

    // Remove original stylesheet link tags to avoid external loading
    body = body.replace(/<link\s+[^>]*rel=("|')stylesheet\1[^>]*>/gi, '');

    // Inject inlined CSS at head end or create head
    const allCss = [...inlineStyles, ...fetchedStyles].join('\n\n');
    if (/<head[\s>]/i.test(body)) {
      body = body.replace(/<head[^>]*>/i, (m) => `${m}\n<style id="inlined-from-replicator">\n${allCss}\n</style>`);
    } else {
      body = `<head><meta charset="utf-8"/><style id="inlined-from-replicator">\n${allCss}\n</style></head>${body}`;
    }

    // Rewrite relative URLs to absolute to avoid broken assets
    body = rewriteRelativeResourceUrls(body, baseHref);

    // Add a base tag for relative resolution if head exists and base not present
    if (/<head[\s>]/i.test(body) && !/<base\s+/i.test(body)) {
      body = body.replace(/<head[^>]*>/i, (m) => `${m}\n<base href="${new URL(baseHref).origin}/">`);
    }

    const now = new Date();
    const safeHost = new URL(url).hostname.replace(/[^a-z0-9.-]/gi, '_');
    const projectName = `replica_${safeHost}_${now.getFullYear()}${String(now.getMonth() + 1).padStart(2, '0')}${String(
      now.getDate(),
    ).padStart(2, '0')}`;

    const zip = new JSZip();
    const readme = `هذا الأرشيف يحتوي على لقطة واجهة آمنة من ${url}.
- تمت إزالة السكربتات.
- تم إدراج الأنماط CSS داخلياً حيث أمكن.
- تم تحويل الروابط النسبية إلى مطلقة لتجنب تعطل الأصول.

تنبيه قانوني: استخدم هذه اللقطة لأغراض التعلم أو ضمن نطاق لديك الحق به. تأكد من احترام حقوق الملكية الفكرية وسياسات الموقع المستهدف.
`;

    zip.file('README.txt', readme);
    zip.file('index.html', body);

    const archive = await zip.generateAsync({ type: 'uint8array' });

    return new Response(archive, {
      status: 200,
      headers: {
        'Content-Type': 'application/zip',
        'Content-Disposition': `attachment; filename="${projectName}.zip"`,
      },
    });
  } catch (err: any) {
    return new Response(JSON.stringify({ error: 'حدث خطأ أثناء المعالجة', details: err?.message ?? '' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json; charset=utf-8' },
    });
  }
}