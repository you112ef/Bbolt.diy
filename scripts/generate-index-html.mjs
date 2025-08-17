import { readdir, writeFile } from 'node:fs/promises';
import { join, resolve } from 'node:path';

async function main() {
  const outDir = resolve('build/client');
  const assetsDir = join(outDir, 'assets');

  const files = await readdir(assetsDir);

  const findFirst = (regex) => files.find((f) => regex.test(f));

  const entryClientJs = findFirst(/^entry\.client-.*\.js$/);
  const remixManifestJs = findFirst(/^manifest-.*\.js$/);
  const cssFiles = files.filter((f) => f.endsWith('.css'));

  if (!entryClientJs || !remixManifestJs) {
    console.error('[generate-index-html] Could not find entry.client or manifest asset in', assetsDir);
    console.error('Found files:', files.slice(0, 50).join(', '));
    process.exit(1);
  }

  const cssLinks = cssFiles
    .map((css) => `<link rel="stylesheet" href="/assets/${css}" />`)
    .join('\n    ');

  const remixDataShim = `\n    <script>\n      (function(){\n        try {\n          var originalFetch = window.fetch;\n          window.fetch = function(input, init){\n            try {\n              var req = (typeof input === 'string') ? new Request(input, init) : input;\n              var url = (typeof input === 'string') ? input : req.url;\n              var isData = (req.headers && req.headers.get('X-Remix-Data') === 'yes') || /(?:__data|_data)/.test(url) || /[?&]index(?:=|&|$)/.test(url);\n              if (isData) {\n                return Promise.resolve(new Response(JSON.stringify({}), { status: 200, headers: { 'Content-Type': 'application/json' } }));\n              }\n            } catch (_) {}\n            return originalFetch(input, init);\n          };\n        } catch (e) { /* noop */ }\n      })();\n    </script>`;

  const html = `<!doctype html>
<html lang="ar" dir="rtl">
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <title>Yousef Shtiwe AI</title>
    <link rel="icon" href="/favicon.ico" />
    <link rel="manifest" href="/site.webmanifest" />
    ${cssLinks}
  </head>
  <body>
    <div id="root"></div>
    ${remixDataShim}
    <script type="module" src="/assets/${remixManifestJs}"></script>
    <script type="module" src="/assets/${entryClientJs}"></script>
  </body>
</html>`;

  await writeFile(join(outDir, 'index.html'), html, 'utf8');
  console.log('[generate-index-html] Wrote', join(outDir, 'index.html'));
}

main().catch((err) => {
  console.error('[generate-index-html] Failed:', err);
  process.exit(1);
});