import type { ServerBuild } from '@remix-run/cloudflare';
import { createPagesFunctionHandler } from '@remix-run/cloudflare-pages';
import type { AppLoadContext } from '@remix-run/cloudflare';

// Type definitions for Cloudflare Pages Functions
interface Env {
  [key: string]: any;
}

type PagesFunction<Env = unknown> = (
  context: {
    request: Request;
    env: Env;
    params: Record<string, string>;
    waitUntil: (promise: Promise<any>) => void;
    next: (input?: Request | string, init?: RequestInit) => Promise<Response>;
    data: Record<string, unknown>;
  }
) => Response | Promise<Response>;

// Enhanced error handling and context setup for Cloudflare Pages
export const onRequest: PagesFunction<Env> = async (context) => {
  try {
    // Import the server build dynamically
    const serverBuild = (await import('../build/server')) as unknown as ServerBuild;

    // Create the app load context with Cloudflare-specific data
    const getLoadContext = (): AppLoadContext => {
      return {
        cloudflare: {
          cf: context.request.cf,
          ctx: {
            waitUntil: context.waitUntil,
            passThroughOnException: () => {},
          },
          caches,
          env: context.env,
        },
      };
    };

    // Create the Pages Function handler with proper error handling
    const handler = createPagesFunctionHandler({
      build: serverBuild,
      getLoadContext,
      mode: process.env.NODE_ENV as 'development' | 'production',
    });

    // Execute the handler with the context
    const response = await handler(context);
    
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
