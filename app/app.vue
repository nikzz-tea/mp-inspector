<template>
  <div
    class="mx-auto flex min-h-screen max-w-5xl flex-col items-center px-4 py-16"
    :class="beatmaps.length ? 'max-sm:py-4' : 'justify-center'"
  >
    <div class="w-full text-center">
      <div class="mx-auto max-w-3xl">
        <h1 class="text-5xl font-bold">osu! mp inspector</h1>
        <form class="mt-8 flex w-full flex-row gap-3 max-sm:flex-col" @submit.prevent="submit">
          <Input
            v-model="input"
            type="text"
            placeholder="https://osu.ppy.sh/community/matches/99814465"
            :aria-invalid="invalid"
          />
          <Button type="submit" class="cursor-pointer" :disabled="invalid || loading">
            <Spinner v-if="loading" />
            Search
          </Button>
        </form>
        <p class="text-muted-foreground mt-4 text-sm">
          Works with <code class="bg-muted rounded px-1 py-0.5">/community/matches/…</code>,
          <code class="bg-muted rounded px-1 py-0.5">/mp/…</code> or plain match ID.
        </p>
      </div>
    </div>

    <Transition
      enter-active-class="transition duration-600 ease-out"
      enter-from-class="opacity-0 translate-y-6"
    >
      <div v-if="beatmaps.length && result" class="mx-auto mt-10 w-full text-left">
        <h2 class="text-center text-2xl">{{ result.match.name }}</h2>
        <MatchStats
          :beatmaps="beatmaps"
          :visible-ids="visibleIds"
          v-model:winner-mode="winnerMode"
          v-model:cost-formula="costFormula"
          :ez-multipliers="ezMultipliers"
          class="mt-4"
        />
        <h2 class="text-muted-foreground mt-2 text-sm font-medium">
          {{ visibleBeatmaps.length }} beatmap{{ visibleBeatmaps.length === 1 ? '' : 's' }}
        </h2>
        <div class="mt-4 flex flex-col gap-4">
          <BeatmapCard
            v-for="(b, i) in beatmaps"
            :key="b.id"
            :b
            :i
            :winner-mode="winnerMode"
            :ez-multiplier="ezMultipliers.get(b.id)"
            :hidden="!visibleIds.has(b.id)"
            @toggle="toggleMap(b.id)"
            @update:ez-multiplier="(v) => setEzMultiplier(b.id, v)"
          />
        </div>
      </div>
    </Transition>
  </div>
</template>

<script setup lang="ts">
const input = ref('');
const isTriggered = ref(false);
const loading = ref(false);
const result = ref<MatchDetails | null>(null);
const winnerMode = ref<WinnerMode>('score');
const costFormula = ref<CostFormula>('bathbot');
const visibleIds = ref<Set<number>>(new Set());
const ezMultipliers = ref<Map<number, number>>(new Map());
const invalid = computed(() => isTriggered.value && parseMatchId(input.value) === null);
const beatmaps = computed(() => result.value?.beatmaps ?? []);

watch(
  beatmaps,
  (list) => {
    visibleIds.value = new Set(list.map((b) => b.id));
  },
  { deep: true },
);

const visibleBeatmaps = computed(() => beatmaps.value.filter((b) => visibleIds.value.has(b.id)));

const toggleMap = (id: number) => {
  const next = new Set(visibleIds.value);
  if (next.has(id)) next.delete(id);
  else next.add(id);
  visibleIds.value = next;
};

const setEzMultiplier = (id: number, value: number) => {
  const next = new Map(ezMultipliers.value);
  next.set(id, value);
  ezMultipliers.value = next;
};

const submit = async () => {
  isTriggered.value = true;

  const id = parseMatchId(input.value);
  if (invalid.value) return;

  loading.value = true;
  try {
    result.value = await $fetch<MatchDetails>(`/api/matches/${id}`);
  } catch (err) {
    console.error(err);
  } finally {
    loading.value = false;
  }
};
</script>
