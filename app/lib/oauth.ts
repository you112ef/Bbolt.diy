import { randomBytes, createHash } from 'node:crypto';

export type OAuthProvider = 'github' | 'vercel' | 'netlify';

interface ProviderConfig {
  authorizeUrl: string;
  tokenUrl: string;
  clientIdEnv: string;
  clientSecretEnv: string;
  scope: string;
}

export const providerConfigs: Record<OAuthProvider, ProviderConfig> = {
  github: {
    authorizeUrl: 'https://github.com/login/oauth/authorize',
    tokenUrl: 'https://github.com/login/oauth/access_token',
    clientIdEnv: 'GITHUB_CLIENT_ID',
    clientSecretEnv: 'GITHUB_CLIENT_SECRET',
    scope: 'read:user repo',
  },
  vercel: {
    authorizeUrl: 'https://vercel.com/oauth/authorize',
    tokenUrl: 'https://api.vercel.com/v2/oauth/access_token',
    clientIdEnv: 'VERCEL_CLIENT_ID',
    clientSecretEnv: 'VERCEL_CLIENT_SECRET',
    scope: 'read write deployments',
  },
  netlify: {
    authorizeUrl: 'https://app.netlify.com/authorize',
    tokenUrl: 'https://api.netlify.com/oauth/token',
    clientIdEnv: 'NETLIFY_CLIENT_ID',
    clientSecretEnv: 'NETLIFY_CLIENT_SECRET',
    scope: 'read_content manage_sites',
  },
};

export function generateState(): string {
  return randomBytes(16).toString('hex');
}

export function generateCodeVerifier(): string {
  return randomBytes(32).toString('base64url');
}

export function generateCodeChallenge(verifier: string): string {
  const hash = createHash('sha256').update(verifier).digest('base64');
  return hash.replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
}

export function getEnv(context: any, key: string): string | undefined {
  return context?.cloudflare?.env?.[key] || process.env[key];
}

export function buildRedirectUri(baseUrl: string, provider: OAuthProvider) {
  const normalized = baseUrl.replace(/\/$/, '');
  return `${normalized}/auth/${provider}/callback`;
}

export function buildAuthorizeUrl(
  provider: OAuthProvider,
  clientId: string,
  redirectUri: string,
  scope: string,
  state: string,
  codeChallenge?: string,
): string {
  const base = providerConfigs[provider].authorizeUrl;
  const params = new URLSearchParams({
    client_id: clientId,
    redirect_uri: redirectUri,
    response_type: 'code',
    scope,
    state,
  });

  if (codeChallenge) {
    params.set('code_challenge', codeChallenge);
    params.set('code_challenge_method', 'S256');
  }

  return `${base}?${params.toString()}`;
}

export async function exchangeCodeForToken(
  provider: OAuthProvider,
  request: Request,
  clientId: string,
  clientSecret: string,
  redirectUri: string,
  code: string,
  codeVerifier?: string,
): Promise<any> {
  const tokenUrl = providerConfigs[provider].tokenUrl;
  const params = new URLSearchParams({
    client_id: clientId,
    client_secret: clientSecret,
    grant_type: 'authorization_code',
    code,
    redirect_uri: redirectUri,
  });

  if (codeVerifier) {
    params.set('code_verifier', codeVerifier);
  }

  const headers: Record<string, string> = { 'Content-Type': 'application/x-www-form-urlencoded' };

  if (provider === 'github') {
    headers.Accept = 'application/json';
  }

  const res = await fetch(tokenUrl, { method: 'POST', body: params, headers });

  if (!res.ok) {
    const txt = await res.text();
    throw new Error(`Token exchange failed: ${res.status} ${res.statusText} - ${txt}`);
  }

  return res.json();
}

export function setCookie(headers: Headers, name: string, value: string, maxAgeSeconds = 60 * 60 * 24 * 30) {
  const encoded = encodeURIComponent(value);
  const cookie = `${name}=${encoded}; Path=/; Max-Age=${maxAgeSeconds}; HttpOnly; Secure; SameSite=Lax`;
  headers.append('Set-Cookie', cookie);
}
