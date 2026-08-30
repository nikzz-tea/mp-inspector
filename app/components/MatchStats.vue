<script setup lang="ts">
import { Check, Copy } from '@lucide/vue';
import type { AcceptableValue } from 'reka-ui';

const props = defineProps<{
  beatmaps: BeatmapPlayed[];
  visibleIds: Set<number>;
  winnerMode: WinnerMode;
  costFormula: CostFormula;
  ezMultipliers: Map<number, number>;
  matchTitle: string;
  matchUrl: string;
}>();

const emit = defineEmits<{
  (e: 'update:winnerMode', value: WinnerMode): void;
  (e: 'update:costFormula', value: CostFormula): void;
}>();

const copied = ref(false);
let resetTimer: ReturnType<typeof setTimeout> | undefined;

const beatmapsRef = toRef(props, 'beatmaps');
const visibleIdsRef = toRef(props, 'visibleIds');
const winnerModeRef = toRef(props, 'winnerMode');
const costFormulaRef = toRef(props, 'costFormula');
const ezMultipliersRef = toRef(props, 'ezMultipliers');

const { teamPlayed, teamMapWins, players, costBreakdown } = useMatchStats(
  beatmapsRef,
  visibleIdsRef,
  winnerModeRef,
  costFormulaRef,
  ezMultipliersRef,
);

const bluePlayers = computed(() => players.value.filter((p) => p.team === 'blue'));
const redPlayers = computed(() => players.value.filter((p) => p.team === 'red'));
const playerRank = computed<Map<PlayerStats['userId'], number>>(() => {
  const map = new Map<number, number>();
  [...players.value].slice(0, 3).forEach((p, i) => map.set(p.userId, i));
  return map;
});

const onWinnerMode = (value: AcceptableValue) => {
  if (value != null) emit('update:winnerMode', value as WinnerMode);
};

const onCostFormula = (value: AcceptableValue) => {
  if (value != null) emit('update:costFormula', value as CostFormula);
};

const playerLine = (p: PlayerStats, rank: number): string => {
  const breakdown = costBreakdown(p.userId);
  const medal = ['🥇', '🥈', '🥉'][rank] ?? '';
  const username = `[${p.username}](<https://osu.ppy.sh/u/${p.userId}>)`;
  const name = medal ? `${username} ${medal}` : username;
  const score = p.avgScore.toLocaleString(undefined, { maximumFractionDigits: 0 });
  const acc = `${(p.avgAccuracy * 100).toFixed(1)}%`;
  const parts = [
    `**${name}**`,
    score,
    acc,
    `${p.gamesPlayed} maps`,
    `**${breakdown.matchCost.toFixed(2)}** MC`,
  ];
  return parts.join(' · ');
};

const buildStatsText = (): string => {
  const lines: string[] = [];
  lines.push(`## [${props.matchTitle}](<${props.matchUrl}>)`);
  if (teamPlayed.value) {
    lines.push(`🔴 **${teamMapWins.value.red ?? 0}** — **${teamMapWins.value.blue ?? 0}** 🔵`, '');
  }

  for (const team of teamPlayed.value ? (['red', 'blue'] as const) : ([''] as const)) {
    const rows =
      team === '' ? players.value : team === 'red' ? redPlayers.value : bluePlayers.value;
    if (teamPlayed.value) lines.push(team === 'red' ? '🔴' : '🔵');
    for (const p of rows) {
      lines.push(playerLine(p, playerRank.value.get(p.userId) ?? -1));
    }
    if (teamPlayed.value) lines.push('');
  }

  return lines.join('\n').replace(/\n$/, '');
};

const onCopy = async () => {
  const text = buildStatsText();
  await navigator.clipboard.writeText(text);
  copied.value = true;
  if (resetTimer) clearTimeout(resetTimer);
  resetTimer = setTimeout(() => {
    copied.value = false;
  }, 2000);
};
</script>

<template>
  <Card class="gap-4 border-none bg-transparent shadow-none *:max-sm:p-0">
    <CardHeader>
      <div class="flex justify-between gap-2 max-sm:flex-col sm:items-center">
        <CardTitle class="flex shrink-0 items-center gap-2">
          <span>Match stats</span>
          <Button variant="outline" size="sm" class="h-9 cursor-pointer" @click="onCopy">
            <Transition
              mode="out-in"
              enter-active-class="transition duration-150 ease-out"
              leave-active-class="transition duration-100 ease-in"
              enter-from-class="scale-95 opacity-0"
              leave-to-class="scale-95 opacity-0"
            >
              <Check v-if="copied" class="text-green-500" />
              <Copy v-else />
            </Transition>
            {{ copied ? 'Copied' : 'Copy' }}
          </Button>
        </CardTitle>
        <div class="flex flex-wrap gap-2">
          <Select :model-value="winnerModeRef" @update:model-value="onWinnerMode">
            <SelectTrigger class="w-42 cursor-pointer">
              <SelectValue placeholder="Win condition" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="score" class="cursor-pointer">Total score</SelectItem>
              <SelectItem value="accuracy" class="cursor-pointer">Average accuracy</SelectItem>
            </SelectContent>
          </Select>
          <Select :model-value="costFormulaRef" @update:model-value="onCostFormula">
            <SelectTrigger class="w-42 cursor-pointer">
              <SelectValue placeholder="Match cost" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="bathbot" class="cursor-pointer">Bathbot formula</SelectItem>
              <SelectItem value="osuplus" class="cursor-pointer">osu!plus formula</SelectItem>
              <SelectItem value="elitebotix" class="cursor-pointer">Elitebotix formula</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>
    </CardHeader>
    <CardContent>
      <div v-if="teamPlayed" class="grid gap-8 sm:grid-cols-2">
        <div>
          <div class="max-sm flex items-center max-sm:gap-2 sm:justify-between">
            <span class="text-xl font-bold text-red-500"> {{ teamMapWins.red ?? 0 }} </span>
            <span class="size-4 rounded-full bg-red-500"></span>
          </div>
          <StatsTable :players="redPlayers" :playerRank :cost-breakdown="costBreakdown" />
        </div>
        <div>
          <div class="flex items-center max-sm:gap-2 sm:justify-between">
            <span class="size-4 rounded-full bg-blue-500"></span>
            <span class="text-xl font-bold text-blue-500"> {{ teamMapWins.blue ?? 0 }} </span>
          </div>
          <StatsTable :players="bluePlayers" :playerRank :cost-breakdown="costBreakdown" />
        </div>
      </div>
      <StatsTable v-else :players="players" :playerRank :cost-breakdown="costBreakdown" />
    </CardContent>
  </Card>
</template>
