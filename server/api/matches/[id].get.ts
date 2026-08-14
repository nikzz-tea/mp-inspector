import type { MatchEvent, MatchResponse, User } from '~~/shared/types/match';
import { getOsuAccessToken } from '../../utils/osuToken';

const OSU_API_BASE = 'https://osu.ppy.sh/api/v2';

export default defineEventHandler(async (event) => {
  const id = getRouterParam(event, 'id');
  if (!id || !/^\d+$/.test(id)) {
    throw createError({
      statusCode: 400,
      statusMessage: 'Invalid match id',
    });
  }

  const config = useRuntimeConfig(event);
  if (!config.osuClientId || !config.osuClientSecret) {
    throw createError({
      statusCode: 500,
      statusMessage: 'osu! API credentials are not configured',
    });
  }

  const token = await getOsuAccessToken(config.osuClientId, config.osuClientSecret);
  const headers = {
    Authorization: `Bearer ${token}`,
    Accept: 'application/json',
  };

  const match = await fetchAllMatchEvents(id, headers);
  const games = match.events.filter((event) => event.game != null && event.game.scores.length);

  return {
    ...match,
    events: games,
  };
});

async function fetchAllMatchEvents(
  id: string,
  headers: Record<string, string>,
): Promise<MatchResponse> {
  let first: MatchResponse | null = null;
  const allEvents: MatchEvent[] = [];
  let users: User[] = [];
  let before: number | undefined;
  const limit = 100;

  for (;;) {
    const params = new URLSearchParams();
    params.set('limit', String(limit));
    if (before !== undefined) params.set('before', String(before));

    const res = await $fetch<MatchResponse>(`${OSU_API_BASE}/matches/${id}?${params.toString()}`, {
      headers,
    });
    if (!first) {
      first = res;
      users = res.users;
    }

    if (res.events.length === 0) break;

    allEvents.push(...res.events);

    const minId = Math.min(...res.events.map((e) => e.id));
    if (minId <= first.first_event_id) break;

    before = minId;

    if (allEvents.length > 10_000) break;
  }

  if (!first) {
    throw createError({ statusCode: 502, statusMessage: 'Empty response from osu!' });
  }

  return {
    ...first,
    events: allEvents.sort((a, b) => a.id - b.id),
    users,
  };
}
