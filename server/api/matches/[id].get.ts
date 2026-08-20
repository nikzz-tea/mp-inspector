import type {
  BeatmapPlayed,
  MatchDetails,
  MatchEvent,
  MatchResponse,
  PlayerScore,
  Score,
  User,
} from '~~/shared/types/match';
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

  const osu = await fetchAllMatchEvents(id, headers);

  const userById = new Map(osu.users.map((u) => [u.id, u.username]));

  const beatmaps: BeatmapPlayed[] = osu.events
    .filter((event) => event.game != null && event.game.scores.length > 0)
    .map((event) => toBeatmapPlayed(event.game!, userById));

  const result: MatchDetails = {
    match: osu.match,
    beatmaps,
  };

  return result;
});

const toBeatmapPlayed = (
  game: NonNullable<MatchEvent['game']>,
  userById: Map<number, string>,
): BeatmapPlayed => {
  const beatmap = game.beatmap;
  const beatmapset = beatmap?.beatmapset;
  const scores = game.scores.map((s) => toPlayerScore(s, userById));
  let teamType = game.team_type;
  if (teamType === 'head-to-head' && scores.length === 2) {
    teamType = 'team-vs';
    if (scores[0]) scores[0].team = 'red';
    if (scores[1]) scores[1].team = 'blue';
  }

  return {
    id: game.id,
    beatmapId: game.beatmap_id,
    startTime: game.start_time,
    endTime: game.end_time,
    startTimeLabel: formatTime(game.start_time),
    mode: game.mode,
    teamType,
    mods: game.mods,
    title: beatmapset?.title ?? beatmapset?.title_unicode ?? '',
    artist: beatmapset?.artist ?? beatmapset?.artist_unicode ?? '',
    creator: beatmapset?.creator ?? '',
    difficultyName: beatmap?.version ?? '',
    difficultyRating: beatmap?.difficulty_rating ?? 0,
    scores: scores.sort((a, b) => b.score - a.score),
  };
};

const toPlayerScore = (score: Score, userById: Map<number, string>): PlayerScore => {
  return {
    userId: score.user_id,
    username: userById.get(score.user_id) ?? `#${score.user_id}`,
    team: score.match.team,
    score: score.score,
    accuracy: score.accuracy,
    maxCombo: score.max_combo,
    rank: score.rank,
    passed: score.passed,
    mods: score.mods,
    statistics: score.statistics,
  };
};

const formatTime = (iso: string | null): string => {
  if (!iso) return '';
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return '';
  return d.toLocaleString('en-GB', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
};

const fetchAllMatchEvents = async (
  id: string,
  headers: Record<string, string>,
): Promise<MatchResponse> => {
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
};
