import type { ActionFunctionArgs } from '@remix-run/cloudflare';
import { json } from '@remix-run/cloudflare';

export const action = async ({ request }: ActionFunctionArgs) => {
  try {
    const { token } = await request.json();
    if (!token || typeof token !== 'string') {
      return json({ message: 'Missing token' }, { status: 400 });
    }

    // Validate token by calling PlanetScale API (profile endpoint)
    const res = await fetch('https://api.planetscale.com/v1/profile', {
      headers: {
        Authorization: `Bearer ${token}`,
        Accept: 'application/json',
      },
    });

    if (!res.ok) {
      const body = await res.text();
      return json(
        {
          message: `Token validation failed (${res.status})`,
          details: body?.slice(0, 500),
        },
        { status: 401 },
      );
    }

    const profile = await res.json();

    return json({ ok: true, profile });
  } catch (error) {
    return json(
      { message: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 },
    );
  }
};