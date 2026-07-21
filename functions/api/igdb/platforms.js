// Cloudflare Pages Function for /api/igdb/platforms

let cachedToken = null;
let tokenExpiry = 0;

async function getIgdbToken(env) {
  const now = Date.now();
  if (cachedToken && now < tokenExpiry - 10_000) {
    return cachedToken;
  }
  const clientId = env.IGDB_CLIENT_ID;
  const clientSecret = env.IGDB_CLIENT_SECRET;
  if (!clientId || !clientSecret) {
    throw new Error('Missing IGDB_CLIENT_ID or IGDB_CLIENT_SECRET');
  }

  const params = new URLSearchParams({
    client_id: clientId,
    client_secret: clientSecret,
    grant_type: 'client_credentials',
  });

  const res = await fetch(`https://id.twitch.tv/oauth2/token?${params.toString()}`, { method: 'POST' });
  if (!res.ok) throw new Error('Twitch auth failed');
  const tokenData = await res.json();
  cachedToken = tokenData.access_token;
  tokenExpiry = Date.now() + (tokenData.expires_in || 0) * 1000;
  return cachedToken;
}

export async function onRequestGet(context) {
  const { request, env } = context;
  const url = new URL(request.url);
  const search = (url.searchParams.get('search') || '').trim();
  const limitParam = parseInt(url.searchParams.get('limit') || '8', 10);
  const limit = Number.isFinite(limitParam) ? Math.min(Math.max(limitParam, 1), 20) : 8;

  const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'GET, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type',
    'Content-Type': 'application/json',
  };

  if (!search || search.length < 2) {
    return new Response(JSON.stringify({ error: 'Search term too short' }), { status: 400, headers: corsHeaders });
  }

  try {
    const token = await getIgdbToken(env);
    const safeTerm = search.replace(/"/g, '\\"');
    const body = `
search "${safeTerm}";
fields id,name,abbreviation,generation;
limit ${limit};
`;

    const res = await fetch('https://api.igdb.com/v4/platforms', {
      method: 'POST',
      headers: {
        'Client-ID': env.IGDB_CLIENT_ID,
        Authorization: `Bearer ${token}`,
        'Content-Type': 'text/plain',
      },
      body,
    });

    if (!res.ok) {
      const text = await res.text();
      return new Response(JSON.stringify({ error: 'Platform search failed', detail: text }), { status: res.status, headers: corsHeaders });
    }

    const platforms = await res.json();
    const normalized = Array.isArray(platforms)
      ? platforms.map((p) => ({
          id: p.id,
          name: p.name || '',
          abbreviation: p.abbreviation || '',
          generation: p.generation || null,
        }))
      : [];

    return new Response(JSON.stringify({ platforms: normalized }), { status: 200, headers: corsHeaders });
  } catch (err) {
    return new Response(JSON.stringify({ error: err.message }), { status: 500, headers: corsHeaders });
  }
}

export async function onRequestOptions() {
  return new Response(null, {
    status: 204,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type',
    },
  });
}
