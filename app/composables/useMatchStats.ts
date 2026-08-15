import type { BeatmapPlayed } from '~~/shared/types/match';

export type WinnerMode = 'score' | 'accuracy';
export type CostFormula = 'bathbot' | 'osuplus';

export interface PlayerStats {
  userId: number;
  username: string;
  team: string;
  avgScore: number;
  avgAccuracy: number;
  gamesPlayed: number;
}

export interface TeamStats {
  team: string;
  mapsWon: number;
  avgScore: number;
  avgAccuracy: number;
  gamesPlayed: number;
}

export interface CostBreakdown {
  performance: number;
  participation: number;
  mods: number;
  tiebreaker: number;
  matchCost: number;
}

export function useMatchStats(beatmaps: Ref<BeatmapPlayed[]>, visibleIds: Ref<Set<number>>) {
  const winnerMode = ref<WinnerMode>('score');
  const costFormula = ref<CostFormula>('bathbot');
  const visibleBeatmaps = computed(() => beatmaps.value.filter((b) => visibleIds.value.has(b.id)));
  const teamPlayed = computed(() =>
    visibleBeatmaps.value.some((b) => b.teamType === 'team-vs' || b.teamType === 'tag-team-vs'),
  );

  const teamMapWins = computed<Record<string, number>>(() => {
    const wins: Record<string, number> = {};
    for (const b of visibleBeatmaps.value) {
      if (!teamPlayed.value) break;
      const winner = mapWinner(b, winnerMode.value);
      if (winner) wins[winner] = (wins[winner] ?? 0) + 1;
    }
    return wins;
  });

  const tiebreakMapId = computed<number | null>(() => {
    if (!teamPlayed.value) return null;
    const maps = visibleBeatmaps.value;
    if (maps.length <= 4) return null;

    const last = maps[maps.length - 1];
    if (!last) return null;

    const red = teamMapWins.value.red ?? 0;
    const blue = teamMapWins.value.blue ?? 0;
    if (Math.abs(red - blue) !== 1) return null;

    return last.id;
  });

  const players = computed<PlayerStats[]>(() => {
    const map = new Map<number, PlayerStats>();
    for (const b of visibleBeatmaps.value) {
      for (const s of b.scores) {
        let p = map.get(s.userId);
        if (!p) {
          p = {
            userId: s.userId,
            username: s.username,
            team: s.team,
            avgScore: 0,
            avgAccuracy: 0,
            gamesPlayed: 0,
          };
          map.set(s.userId, p);
        }
        p.avgScore += s.score;
        p.avgAccuracy += s.accuracy;
        p.gamesPlayed += 1;
      }
    }
    return [...map.values()]
      .map((p) => ({
        ...p,
        avgScore: p.gamesPlayed ? p.avgScore / p.gamesPlayed : 0,
        avgAccuracy: p.gamesPlayed ? p.avgAccuracy / p.gamesPlayed : 0,
      }))
      .sort((a, b) => costBreakdown(b.userId).matchCost - costBreakdown(a.userId).matchCost);
  });

  const teams = computed<TeamStats[]>(() => {
    const map = new Map<string, TeamStats>();
    for (const b of visibleBeatmaps.value) {
      for (const s of b.scores) {
        let t = map.get(s.team);
        if (!t) {
          t = {
            team: s.team,
            mapsWon: 0,
            avgScore: 0,
            avgAccuracy: 0,
            gamesPlayed: 0,
          };
          map.set(s.team, t);
        }
        t.avgScore += s.score;
        t.avgAccuracy += s.accuracy;
        t.gamesPlayed += 1;
      }
    }
    return [...map.values()]
      .map((t) => ({
        ...t,
        mapsWon: teamMapWins.value[t.team] ?? 0,
        avgScore: t.gamesPlayed ? t.avgScore / t.gamesPlayed : 0,
        avgAccuracy: t.gamesPlayed ? t.avgAccuracy / t.gamesPlayed : 0,
      }))
      .sort((a, b) => {
        const order: Record<string, number> = { red: 0, blue: 1 };
        return (order[a.team] ?? 99) - (order[b.team] ?? 99);
      });
  });

  function mapWinner(b: BeatmapPlayed, mode: WinnerMode): string | null {
    const red = b.scores.filter((s) => s.team === 'red');
    const blue = b.scores.filter((s) => s.team === 'blue');
    if (!red.length || !blue.length) return null;

    if (mode === 'accuracy') {
      const redAcc = red.reduce((sum, s) => sum + s.accuracy, 0) / red.length;
      const blueAcc = blue.reduce((sum, s) => sum + s.accuracy, 0) / blue.length;
      if (redAcc === blueAcc) return null;
      return redAcc > blueAcc ? 'red' : 'blue';
    }

    const redScore = red.reduce((sum, s) => sum + s.score, 0);
    const blueScore = blue.reduce((sum, s) => sum + s.score, 0);
    if (redScore === blueScore) return null;
    return redScore > blueScore ? 'red' : 'blue';
  }

  const FLAT_BONUS = 0.5;
  const BASE_PARTICIPATION_BONUS = 1.5;
  const EXP_PARTICIPATION_BONUS = 0.6;
  const MOD_BONUS = 0.02;
  const TIEBREAKER_FACTOR = 0.25;
  const MAX_TIEBREAKER_BONUS = 0.5;

  function perGameRatio(playerId: number) {
    return visibleBeatmaps.value
      .filter((b) => b.scores.some((s) => s.userId === playerId))
      .map((b) => {
        const sum = b.scores.reduce((acc, s) => acc + s.score, 0);
        const avg = sum / b.scores.length;
        const player = b.scores.find((s) => s.userId === playerId)!;
        return player.score / avg;
      });
  }

  function modCombinations(playerId: number): number {
    const set = new Set<string>();
    for (const b of visibleBeatmaps.value) {
      const p = b.scores.find((s) => s.userId === playerId);
      if (!p) continue;
      set.add([...p.mods].sort().join(''));
    }
    return set.size;
  }

  function bathbotBreakdown(playerId: number): CostBreakdown {
    const gamesCount = visibleBeatmaps.value.length;
    const ratios = perGameRatio(playerId);
    const scoresLen = ratios.length;
    if (scoresLen === 0) {
      return {
        performance: FLAT_BONUS,
        participation: 1,
        mods: 1,
        tiebreaker: 0,
        matchCost: FLAT_BONUS,
      };
    }
    const ratioSum = ratios.reduce((sum, r) => sum + r, 0);
    const performanceCost = ratioSum / scoresLen + FLAT_BONUS;
    const exp = gamesCount <= 1 ? 0 : (scoresLen - 1) / (gamesCount - 1);
    const participationBonusFactor = Math.pow(
      BASE_PARTICIPATION_BONUS,
      Math.pow(exp, EXP_PARTICIPATION_BONUS),
    );
    const modsUsed = modCombinations(playerId);
    let modsBonusFactor = 1.0;
    if (modsUsed > 2) {
      modsBonusFactor += MOD_BONUS * (modsUsed - 2);
    }
    let tiebreakerBonus = 0.0;
    if (tiebreakMapId.value != null && ratios.length > 0) {
      const lastGame = visibleBeatmaps.value
        .filter((b) => b.id === tiebreakMapId.value)
        .find((b) => b.scores.some((s) => s.userId === playerId));
      if (lastGame) {
        const lastPerf = perGameRatio(playerId).at(-1) ?? 0;
        tiebreakerBonus = Math.min(MAX_TIEBREAKER_BONUS, TIEBREAKER_FACTOR * lastPerf);
      }
    }

    const matchCost =
      performanceCost * participationBonusFactor * modsBonusFactor + tiebreakerBonus;

    return {
      performance: performanceCost,
      participation: participationBonusFactor,
      mods: modsBonusFactor,
      tiebreaker: tiebreakerBonus,
      matchCost,
    };
  }

  function osuPlusCost(playerId: number): number {
    const ratios = perGameRatio(playerId);
    if (!ratios.length) return 0;
    const totalRelativeScore = ratios.reduce((sum, r) => sum + r, 0);
    const consistencyMultiplier = 2 / (ratios.length + 2);
    return consistencyMultiplier * totalRelativeScore;
  }

  function costBreakdown(playerId: number): CostBreakdown {
    if (costFormula.value === 'bathbot') return bathbotBreakdown(playerId);
    const matchCost = osuPlusCost(playerId);
    return {
      performance: matchCost,
      participation: 1,
      mods: 1,
      tiebreaker: 0,
      matchCost,
    };
  }

  return {
    winnerMode,
    costFormula,
    teamPlayed,
    teamMapWins,
    tiebreakMapId,
    players,
    teams,
    costBreakdown,
  };
}
