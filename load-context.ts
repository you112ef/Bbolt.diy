import { type PlatformProxy } from 'wrangler';

// Enhanced Cloudflare environment interface
interface Env {
  // Environment variables
  NODE_ENV?: string;
  
  // API keys (should be set in Cloudflare dashboard)
  OPENAI_API_KEY?: string;
  ANTHROPIC_API_KEY?: string;
  GOOGLE_API_KEY?: string;
  GROQ_API_KEY?: string;
  
  // Database and storage
  DB?: D1Database;
  KV?: KVNamespace;
  R2?: R2Bucket;
  
  // Other services
  [key: string]: any;
}

type Cloudflare = Omit<PlatformProxy<Env>, 'dispose'>;

// Enhanced AppLoadContext with better typing
declare module '@remix-run/cloudflare' {
  interface AppLoadContext {
    cloudflare: Cloudflare;
    // Additional context helpers
    env: Env;
    waitUntil: (promise: Promise<any>) => void;
  }
}

// Export environment interface for use in other files
export type { Env };
