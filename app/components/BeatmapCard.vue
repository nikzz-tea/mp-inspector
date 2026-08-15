<script setup lang="ts">
const props = defineProps<{
  b: BeatmapPlayed;
  i: number;
  winnerMode: WinnerMode;
}>();

const emit = defineEmits<{
  (e: 'toggle'): void;
}>();

const isTeamPlay = (b: BeatmapPlayed): boolean => {
  return b.teamType === 'team-vs' || b.teamType === 'tag-team-vs';
};

const teamScores = (b: BeatmapPlayed, team: 'red' | 'blue'): PlayerScore[] => {
  return b.scores.filter((s) => s.team === team);
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
  return props.winnerMode === 'accuracy' ? (m * 100).toFixed(2) + '%' : m.toLocaleString();
}
</script>

<template>
  <Card class="gap-2">
    <CardHeader>
      <div class="flex items-start justify-between gap-4 max-sm:flex-col-reverse max-sm:gap-2">
        <div class="min-w-0">
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
        <ScoreList :global-mods="b.mods.length > 0" :scores="b.scores" />
      </div>
    </CardContent>
  </Card>
</template>
