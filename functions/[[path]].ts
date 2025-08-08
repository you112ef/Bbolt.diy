import type { ServerBuild } from '@remix-run/cloudflare';
import { createPagesFunctionHandler } from '@remix-run/cloudflare-pages';
import type { AppLoadContext } from '@remix-run/cloudflare';

// Minimal context typing to stay compatible with Pages runtime
type AnyEnv = Record<string, unknown>;
type PagesFn = (context: any) => Response | Promise<Response>;

// Enhanced error handling and context setup for Cloudflare Pages
export const onRequest: PagesFn = async (context: any) => {
  try {
    // Import the server build dynamically
    // @ts-ignore - The build artifact exists at runtime; TS can't resolve it during typecheck
    const serverBuild = (await import('../build/server')) as unknown as ServerBuild;

    // Create the app load context with Cloudflare-specific data
    const getLoadContext = (): AppLoadContext => {
      return {
        cloudflare: {
          cf: context.request?.cf,
          ctx: {
            waitUntil: (...args: any[]) => (context as any)?.waitUntil?.(...args),
            passThroughOnException: () => (context as any)?.passThroughOnException?.(),
            // props is not required here for runtime; avoid strict typing
          } as any,
          caches: (globalThis as any).caches,
          env: (context as any).env as AnyEnv,
        },
      } as AppLoadContext;
    };

    // Create the Pages Function handler with proper error handling
    const handler = createPagesFunctionHandler({
      build: serverBuild,
      getLoadContext: getLoadContext as unknown as () => AppLoadContext,
      mode: process.env.NODE_ENV as 'development' | 'production',
    });

    // Execute the handler with the context
    const response = await handler(context as any);
    
    // Add CORS headers for API routes
    if (context.request.url.includes('/api/')) {
      response.headers.set('Access-Control-Allow-Origin', '*');
      response.headers.set('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
      response.headers.set('Access-Control-Allow-Headers', 'Content-Type, Authorization');
    }
    
    return response;
  } catch (error) {
    console.error('Cloudflare Pages Function Error:', error);
    
    // Return a proper error response
    return new Response(
      JSON.stringify({ 
        error: 'Internal Server Error', 
        message: error instanceof Error ? error.message : 'Unknown error',
        timestamp: new Date().toISOString()
      }), 
      {
        status: 500,
        headers: {
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*',
        },
      }
    );
  }
};
