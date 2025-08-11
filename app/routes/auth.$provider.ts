import { type LoaderFunctionArgs, json } from '@remix-run/cloudflare';
import {
  buildAuthorizeUrl,
  buildRedirectUri,
  exchangeCodeForToken,
  generateCodeChallenge,
  generateCodeVerifier,
  generateState,
  getEnv,
  providerConfigs,
  type OAuthProvider,
  setCookie,
} from '~/lib/oauth';

export async function loader({ request, params, context }: LoaderFunctionArgs) {
  const url = new URL(request.url);
  const provider = (params.provider as OAuthProvider) || 'github';
  const mode = url.searchParams.get('mode') || 'start';

  // Resolve env
  const clientId = getEnv(context, providerConfigs[provider].clientIdEnv);
  const clientSecret = getEnv(context, providerConfigs[provider].clientSecretEnv);

  if (!clientId || !clientSecret) {
    return json({ error: `Missing env vars for ${provider}` }, { status: 500 });
  }

  const baseUrl = `${url.protocol}//${url.host}`;

  if (mode === 'start') {
    const state = generateState();
    const codeVerifier = generateCodeVerifier();
    const codeChallenge = generateCodeChallenge(codeVerifier);
    const redirectUri = buildRedirectUri(baseUrl, provider);

    // Store state and verifier in cookies (httpOnly response)
    const headers = new Headers();
    setCookie(headers, `${provider}_oauth_state`, state, 600);
    setCookie(headers, `${provider}_oauth_cv`, codeVerifier, 600);

    const authUrl = buildAuthorizeUrl(
      provider,
      clientId,
      redirectUri,
      providerConfigs[provider].scope,
      state,
      codeChallenge,
    );
    headers.set('Location', authUrl);

    return new Response(null, { status: 302, headers });
  }

  if (mode === 'callback') {
    const state = url.searchParams.get('state') || '';
    const code = url.searchParams.get('code') || '';

    if (!code || !state) {
      return json({ error: 'Missing code/state' }, { status: 400 });
    }

    // Read cookies back
    const cookieHeader = request.headers.get('cookie') || '';
    const stateCookie = cookieHeader.match(new RegExp(`${provider}_oauth_state=([^;]+)`))?.[1];
    const cvCookie = cookieHeader.match(new RegExp(`${provider}_oauth_cv=([^;]+)`))?.[1];

    if (!stateCookie || stateCookie !== encodeURIComponent(state)) {
      return json({ error: 'Invalid state' }, { status: 400 });
    }

    const redirectUri = buildRedirectUri(baseUrl, provider);
    const token = await exchangeCodeForToken(
      provider,
      request,
      clientId,
      clientSecret,
      redirectUri,
      code,
      cvCookie && decodeURIComponent(cvCookie),
    );

    const headers = new Headers();
    setCookie(headers, `${provider}_access_token`, JSON.stringify(token));
    headers.set('Location', '/');

    return new Response(null, { status: 302, headers });
  }

  return json({ ok: true });
}
