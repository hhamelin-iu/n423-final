// Cloudflare Pages Function for /api/igdb/games

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
    throw new Error('Missing IGDB_CLIENT_ID or IGDB_CLIENT_SECRET in Cloudflare env vars');
  }

  const params = new URLSearchParams({
    client_id: clientId,
    client_secret: clientSecret,
    grant_type: 'client_credentials',
  });

  const res = await fetch(`https://id.twitch.tv/oauth2/token?${params.toString()}`, { method: 'POST' });
  if (!res.ok) {
    throw new Error(`Twitch auth failed: ${res.status}`);
  }
  const tokenData = await res.json();
  cachedToken = tokenData.access_token;
  tokenExpiry = Date.now() + (tokenData.expires_in || 0) * 1000;
  return cachedToken;
}

function normalizeGame(game, platformVersionMap = new Map()) {
  const toYear = (timestamp) => {
    if (!timestamp) return '';
    const date = new Date(timestamp * 1000);
    const year = date.getUTCFullYear();
    return Number.isFinite(year) ? String(year) : '';
  };

  const buildImageUrl = (imageId, size) => {
    if (!imageId) return '';
    return `https://images.igdb.com/igdb/image/upload/${size}/${imageId}.jpg`;
  };

  const developerEntry = Array.isArray(game.involved_companies)
    ? game.involved_companies.find((ic) => ic?.developer && ic?.company?.name)
    : null;

  const releaseDates = Array.isArray(game.release_dates)
    ? [...game.release_dates].filter((r) => r?.platform && r?.date)
    : [];

  const sortedReleases = releaseDates.sort((a, b) => (a.date || 9999999999) - (b.date || 9999999999));
  const earliestRelease = sortedReleases[0];

  const platformLookup = {};
  if (Array.isArray(game.platforms)) {
    game.platforms.forEach((p) => {
      if (p?.id) platformLookup[p.id] = p.name || '';
    });
  }

  const platformName =
    (earliestRelease && platformLookup[earliestRelease.platform]) ||
    (Array.isArray(game.platforms) && game.platforms[0]?.name) ||
    '';

  const platformList = sortedReleases
    .map((r) => {
      const version = platformVersionMap.get(r.platform);
      const releaseDate = Array.isArray(version?.release_dates) && version.release_dates[0]?.date
        ? version.release_dates[0].date
        : r.date || null;
      const name = version?.platform?.name || platformLookup[r.platform] || '';
      return { name, date: releaseDate };
    })
    .filter((r) => r.name);

  platformList.sort((a, b) => (a.date || 9999999999) - (b.date || 9999999999));
  const platformNamesChrono = platformList.map((p) => p.name);

  const coverUrl = buildImageUrl(game.cover?.image_id, 't_cover_big');
  const screenshotUrl = Array.isArray(game.screenshots) && game.screenshots[0]?.image_id
    ? buildImageUrl(game.screenshots[0].image_id, 't_screenshot_huge')
    : '';

  const popularityScore = Number.isFinite(game.total_rating_count)
    ? game.total_rating_count
    : Number.isFinite(game.hypes)
      ? game.hypes
      : 0;

  return {
    id: game.id,
    title: game.name,
    year: toYear(game.first_release_date),
    platform: platformName,
    developer: developerEntry?.company?.name || '',
    imageUrl: coverUrl || screenshotUrl || '',
    popularity: popularityScore,
    platforms: platformNamesChrono,
    releases: platformList,
  };
}

export async function onRequestGet(context) {
  const { request, env } = context;
  const url = new URL(request.url);
  const search = (url.searchParams.get('search') || '').trim();
  const limitParam = parseInt(url.searchParams.get('limit') || '6', 10);
  const limit = Number.isFinite(limitParam) ? Math.min(Math.max(limitParam, 1), 12) : 6;

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
fields id,name,first_release_date,total_rating,total_rating_count,hypes,platforms.id,platforms.name,release_dates.date,release_dates.platform,cover.image_id,screenshots.image_id,involved_companies.developer,involved_companies.company.name;
limit ${limit};
`;

    const igdbRes = await fetch('https://api.igdb.com/v4/games', {
      method: 'POST',
      headers: {
        'Client-ID': env.IGDB_CLIENT_ID,
        Authorization: `Bearer ${token}`,
        'Content-Type': 'text/plain',
      },
      body,
    });

    if (!igdbRes.ok) {
      const errText = await igdbRes.text();
      return new Response(JSON.stringify({ error: 'IGDB query failed', detail: errText }), { status: igdbRes.status, headers: corsHeaders });
    }

    const games = await igdbRes.json();

    // Fetch platform_versions to preserve release ordering
    const platformIds = new Set();
    (Array.isArray(games) ? games : []).forEach((g) => {
      if (Array.isArray(g.release_dates)) {
        g.release_dates.forEach((r) => {
          if (r?.platform) platformIds.add(r.platform);
        });
      }
    });

    const platformVersionMap = new Map();
    const numericIds = Array.from(platformIds).map((id) => Number(id)).filter((id) => Number.isFinite(id) && id > 0);
    if (numericIds.length) {
      const idList = numericIds.join(',');
      const pvBody = `
fields platform,name,release_dates.date;
where platform = (${idList});
limit 200;
`;
      try {
        const pvRes = await fetch('https://api.igdb.com/v4/platform_versions', {
          method: 'POST',
          headers: {
            'Client-ID': env.IGDB_CLIENT_ID,
            Authorization: `Bearer ${token}`,
            'Content-Type': 'text/plain',
          },
          body: pvBody,
        });
        if (pvRes.ok) {
          const versions = await pvRes.json();
          versions.forEach((v) => {
            if (v?.platform) {
              if (Array.isArray(v.release_dates)) {
                v.release_dates = [...v.release_dates].sort((a, b) => (a?.date || 9999999999) - (b?.date || 9999999999));
              }
              platformVersionMap.set(v.platform, v);
            }
          });
        }
      } catch (err) {
        // ignore platform version lookup failure
      }
    }

    const normalized = Array.isArray(games) ? games.map((g) => normalizeGame(g, platformVersionMap)) : [];
    return new Response(JSON.stringify({ games: normalized }), { status: 200, headers: corsHeaders });
  } catch (err) {
    return new Response(JSON.stringify({ error: err.message || 'Internal Cloudflare Function Error' }), { status: 500, headers: corsHeaders });
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
