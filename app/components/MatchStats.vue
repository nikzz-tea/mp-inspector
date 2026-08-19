<script setup lang="ts">
import type { AcceptableValue } from 'reka-ui';

const props = defineProps<{
  beatmaps: BeatmapPlayed[];
  visibleIds: Set<number>;
  winnerMode: WinnerMode;
  costFormula: CostFormula;
  ezMultipliers: Map<number, number>;
}>();

const emit = defineEmits<{
  (e: 'update:winnerMode', value: WinnerMode): void;
  (e: 'update:costFormula', value: CostFormula): void;
}>();

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
</script>

<template>
  <Card class="gap-4 border-none shadow-none *:max-sm:p-0">
    <CardHeader>
      <div class="flex justify-between gap-4 max-sm:flex-col sm:items-center">
        <CardTitle class="shrink-0">Match stats</CardTitle>
        <div class="flex flex-wrap gap-2">
          <Select :model-value="winnerModeRef" @update:model-value="onWinnerMode">
            <SelectTrigger class="w-42">
              <SelectValue placeholder="Win condition" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="score">Total score</SelectItem>
              <SelectItem value="accuracy">Average accuracy</SelectItem>
            </SelectContent>
          </Select>
          <Select :model-value="costFormulaRef" @update:model-value="onCostFormula">
            <SelectTrigger class="w-42">
              <SelectValue placeholder="Match cost" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="bathbot">Bathbot formula</SelectItem>
              <SelectItem value="osuplus">osu!plus formula</SelectItem>
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
