import { cloudflareDevProxyVitePlugin as remixCloudflareDevProxy, vitePlugin as remixVitePlugin } from '@remix-run/dev';
import UnoCSS from 'unocss/vite';
import { defineConfig, type ViteDevServer } from 'vite';
import { nodePolyfills } from 'vite-plugin-node-polyfills';
import { optimizeCssModules } from 'vite-plugin-optimize-css-modules';
import tsconfigPaths from 'vite-tsconfig-paths';
import * as dotenv from 'dotenv';

dotenv.config();

export default defineConfig((config) => {
  return {
    define: {
      'process.env.NODE_ENV': JSON.stringify(process.env.NODE_ENV),
      'global': 'globalThis',
    },
    build: {
      target: 'esnext',
      sourcemap: false, // Disable sourcemaps completely to eliminate errors
      minify: 'esbuild',
      chunkSizeWarningLimit: 2000, // Increased to reduce warnings
      rollupOptions: {
        external: [],
        onwarn(warning, warn) {
          // Suppress sourcemap-related warnings
          if (warning.code === 'SOURCEMAP_ERROR' || 
              warning.code === 'MISSING_SOURCE_MAP' ||
              warning.message.includes('sourcemap')) {
            return;
          }
          warn(warning);
        },
        output: {
          manualChunks: (id) => {
            if (id.includes('node_modules')) {
              if (id.includes('react') || id.includes('react-dom')) {
                return 'react-vendor';
              }
              if (id.includes('@codemirror')) {
                return 'codemirror';
              }
              if (id.includes('@radix-ui')) {
                return 'radix';
              }
              if (id.includes('ai-sdk') || id.includes('@ai-sdk')) {
                return 'ai-vendor';
              }
              return 'vendor';
            }
          },
          // Optimize for Cloudflare Workers runtime
          format: 'es',
          exports: 'named',
        },
      },
    },
    esbuild: {
      sourcemap: false, // Disable esbuild sourcemaps
      legalComments: 'none', // Remove legal comments to reduce bundle size
    },
    ssr: {
      noExternal: ['@nanostores/react', 'nanostores'],
    },
    optimizeDeps: {
      include: ['react', 'react-dom'],
      exclude: [],
      force: true,
      esbuildOptions: {
        sourcemap: false, // Disable sourcemaps in dependency optimization
      },
    },
    resolve: {
      dedupe: ['react', 'react-dom'],
    },
    plugins: [
      nodePolyfills({
        include: ['buffer', 'process', 'util', 'stream', 'path'],
        globals: {
          Buffer: true,
          process: true,
          global: true,
        },
        protocolImports: true,
        exclude: ['child_process', 'fs'],
      }),
      {
        name: 'buffer-polyfill',
        transform(code, id) {
          if (id.includes('env.mjs')) {
            return {
              code: `import { Buffer } from 'buffer';\n${code}`,
              map: null,
            };
          }

          return null;
        },
      },
      // Custom plugin to suppress sourcemap warnings
      {
        name: 'suppress-sourcemap-warnings',
        configureServer(server: ViteDevServer) {
          // Suppress sourcemap warnings in dev mode
          const originalWarn = console.warn;
          console.warn = (...args) => {
            const message = args.join(' ');
            if (message.includes('sourcemap') || 
                message.includes('Sourcemap') ||
                message.includes('Can\'t resolve original location')) {
              return;
            }
            originalWarn(...args);
          };
        },
        configResolved(config) {
          // Suppress sourcemap warnings during build
          if (config.command === 'build') {
            const originalWarn = console.warn;
            console.warn = (...args) => {
              const message = args.join(' ');
              if (message.includes('sourcemap') || 
                  message.includes('Sourcemap') ||
                  message.includes('Can\'t resolve original location')) {
                return;
              }
              originalWarn(...args);
            };
          }
        },
      },
      // Enable cloudflare dev proxy for better local development
      config.mode !== 'test' && config.mode !== 'production' && remixCloudflareDevProxy(),
      remixVitePlugin({
        future: {
          v3_fetcherPersist: true,
          v3_relativeSplatPath: true,
          v3_throwAbortReason: true,
          v3_lazyRouteDiscovery: true,
        },
      }),
      UnoCSS(),
      tsconfigPaths(),
      chrome129IssuePlugin(),
      config.mode === 'production' && optimizeCssModules({ apply: 'build' }),
    ],
    envPrefix: [
      'VITE_',
      'OPENAI_LIKE_API_BASE_URL',
      'OLLAMA_API_BASE_URL',
      'LMSTUDIO_API_BASE_URL',
      'TOGETHER_API_BASE_URL',
    ],
    css: {
      preprocessorOptions: {
        scss: {
          api: 'modern-compiler',
        },
      },
    },
  };
});

function chrome129IssuePlugin() {
  return {
    name: 'chrome129IssuePlugin',
    configureServer(server: ViteDevServer) {
      server.middlewares.use((req, res, next) => {
        const raw = req.headers['user-agent']?.match(/Chrom(e|ium)\/([0-9]+)\./);

        if (raw) {
          const version = parseInt(raw[2], 10);

          if (version === 129) {
            res.setHeader('content-type', 'text/html');
            res.end(
              '<body><h1>Please use Chrome Canary for testing.</h1><p>Chrome 129 has an issue with JavaScript modules & Vite local development, see <a href="https://github.com/stackblitz/bolt.new/issues/86#issuecomment-2395519258">for more information.</a></p><p><b>Note:</b> This only impacts <u>local development</u>. `pnpm run build` and `pnpm run start` will work fine in this browser.</p></body>',
            );

            return;
          }
        }

        next();
      });
    },
  };
}