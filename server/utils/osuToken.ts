const OSU_TOKEN_URL = 'https://osu.ppy.sh/oauth/token';

interface TokenResponse {
  access_token: string;
  expires_in: number;
}

interface CachedToken {
  accessToken: string;
  expiresAt: number;
}

const tokenCache = new Map<string, CachedToken>();

export const getOsuAccessToken = async (
  clientId: string,
  clientSecret: string,
): Promise<string> => {
  const cacheKey = `${clientId}:${clientSecret}`;
  const cached = tokenCache.get(cacheKey);

  if (cached && cached.expiresAt > Date.now()) {
    return cached.accessToken;
  }

  const body = new URLSearchParams({
    client_id: clientId,
    client_secret: clientSecret,
    grant_type: 'client_credentials',
    scope: 'public',
  });

  const response = await $fetch<TokenResponse>(OSU_TOKEN_URL, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
      Accept: 'application/json',
    },
    body: body.toString(),
  });

  const bufferMs = 60_000;
  const expiresAt = Date.now() + response.expires_in * 1000 - bufferMs;

  tokenCache.set(cacheKey, {
    accessToken: response.access_token,
    expiresAt,
  });

  return response.access_token;
};
