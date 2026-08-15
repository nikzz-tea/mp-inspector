<script setup lang="ts">
import { Eye, EyeOff } from '@lucide/vue';

const props = defineProps<{
  b: BeatmapPlayed;
  i: number;
  winnerMode: WinnerMode;
  ezMultiplier?: number;
  hidden?: boolean;
}>();

const emit = defineEmits<{
  (e: 'toggle'): void;
  (e: 'update:ezMultiplier', value: number): void;
}>();

const isTeamPlay = (b: BeatmapPlayed): boolean => {
  return b.teamType === 'team-vs' || b.teamType === 'tag-team-vs';
};

const hasEZInMap = computed(() =>
  props.b.scores.some((s) => s.mods.some((m) => m.toLowerCase() === 'ez')),
);

function adjustedScore(score: PlayerScore): number {
  const isEZ = score.mods.some((m) => m.toLowerCase() === 'ez');
  if (isEZ) return score.score * (props.ezMultiplier ?? 1);
  return score.score;
}

function adjustedScores(scores: PlayerScore[]): PlayerScore[] {
  return scores.map((s) => ({ ...s, score: adjustedScore(s) }));
}

const teamScores = (b: BeatmapPlayed, team: 'red' | 'blue'): PlayerScore[] => {
  return adjustedScores(b.scores.filter((s) => s.team === team));
};

function teamMetric(b: BeatmapPlayed, team: 'red' | 'blue'): number {
  const scores = teamScores(b, team);
  if (!scores.length) return 0;
  if (props.winnerMode === 'accuracy') {
    return scores.reduce((sum, s) => sum + s.accuracy, 0) / scores.length;
  }
  return scores.reduce((sum, s) => sum + s.score, 0);
}

const winningTeam = computed(() => {
  if (!isTeamPlay(props.b)) return null;
  const red = teamMetric(props.b, 'red');
  const blue = teamMetric(props.b, 'blue');
  if (red === blue) return null;
  return red > blue ? 'red' : 'blue';
});

function teamMetricDisplay(team: 'red' | 'blue') {
  const m = teamMetric(props.b, team);
  return props.winnerMode === 'accuracy'
    ? (m * 100).toFixed(2) + '%'
    : m.toLocaleString(undefined, { maximumFractionDigits: 0 });
}
</script>

<template>
  <Card :class="hidden ? 'opacity-60' : ''" class="group relative gap-2 duration-200">
    <div
      class="absolute z-10 flex items-center gap-1 duration-150 max-sm:-top-3 max-sm:right-4 sm:-top-2 sm:right-12 sm:opacity-0 sm:group-hover:-top-3 sm:group-hover:opacity-100"
      :class="hidden ? 'sm:-top-3 sm:opacity-100' : ''"
    >
      <Input
        v-if="hasEZInMap"
        type="number"
        :model-value="ezMultiplier ?? 1"
        step="0.10"
        min="0"
        max="10"
        class="h-9 w-14 bg-white px-1 py-0 text-right text-sm"
        @update:model-value="(v) => emit('update:ezMultiplier', Number(v) || 1)"
      />
      <Button
        type="button"
        variant="outline"
        size="icon"
        class="bg-background text-muted-foreground hover:text-foreground cursor-pointer rounded-md shadow-xs"
        :aria-label="hidden ? 'Show map' : 'Hide map'"
        :title="hidden ? 'Show map' : 'Hide map'"
        @click="emit('toggle')"
      >
        <Eye v-if="hidden" class="size-4" />
        <EyeOff v-else class="size-4" />
      </Button>
    </div>
    <CardHeader>
      <div class="flex items-start justify-between gap-4 max-sm:flex-col-reverse max-sm:gap-2">
        <div class="min-w-0 pr-8">
          <CardTitle class="sm:truncate">
            <a :href="'https://osu.ppy.sh/b/' + b.beatmapId" class="hover:underline">
              {{ b.title }} [{{ b.difficultyName }}]
            </a>
            <span class="max-sm:hidden">
              <Badge v-for="mod in b.mods" :key="mod" class="mr-1" variant="outline">
                {{ mod }}
              </Badge>
            </span>
          </CardTitle>
          <CardDescription class="mt-1 sm:truncate">
            {{ b.artist }}<template v-if="b.creator"> · mapped by {{ b.creator }}</template>
            <p class="sm:hidden">{{ b.startTimeLabel }}</p>
          </CardDescription>
        </div>
        <div>
          <span class="text-muted-foreground mr-3 text-xs max-sm:hidden">
            {{ b.startTimeLabel }}
          </span>
          <Badge variant="secondary" class="shrink-0 max-sm:mr-1">#{{ i + 1 }}</Badge>
          <span class="sm:hidden">
            <Badge v-for="mod in b.mods" :key="mod" class="mr-1" variant="outline">
              {{ mod }}
            </Badge>
          </span>
        </div>
      </div>
    </CardHeader>
    <div
      class="grid transition-[grid-template-rows] duration-200 ease-out"
      :class="hidden ? 'grid-rows-[0fr] opacity-0' : 'grid-rows-[1fr]'"
    >
      <div class="overflow-hidden">
        <CardContent class="flex flex-col gap-4">
          <div v-if="isTeamPlay(b)" class="grid gap-4 max-sm:grid-rows-2 sm:grid-cols-2">
            <div>
              <p class="mb-1 text-sm font-semibold text-red-500 sm:text-right">Red</p>
              <ScoreList :global-mods="b.mods.length > 0" :scores="teamScores(b, 'red')" />
              <p
                class="mt-2 font-semibold tabular-nums sm:text-right"
                :class="
                  winningTeam === 'red' ? 'text-lg text-red-500' : 'text-muted-foreground text-sm'
                "
              >
                {{ teamMetricDisplay('red') }}
              </p>
            </div>
            <div>
              <p class="mb-1 text-sm font-semibold text-blue-500">Blue</p>
              <ScoreList :global-mods="b.mods.length > 0" :scores="teamScores(b, 'blue')" />
              <p
                class="mt-2 font-semibold tabular-nums"
                :class="
                  winningTeam === 'blue' ? 'text-lg text-blue-500' : 'text-muted-foreground text-sm'
                "
              >
                {{ teamMetricDisplay('blue') }}
              </p>
            </div>
          </div>
          <div v-else>
            <ScoreList :global-mods="b.mods.length > 0" :scores="adjustedScores(b.scores)" />
          </div>
        </CardContent>
      </div>
    </div>
  </Card>
</template>
