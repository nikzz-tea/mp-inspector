<template>
  <ThemeSwitcher />
  <div
    class="relative mx-auto flex min-h-screen max-w-5xl flex-col items-center px-4 py-12"
    :class="!beatmaps.length && 'justify-center'"
  >
    <div class="w-full text-center">
      <div class="mx-auto max-w-3xl">
        <h1 class="text-5xl font-bold">osu! mp inspector</h1>
        <form
          class="relative mt-8 flex w-full flex-row gap-3 max-sm:flex-col"
          @submit.prevent="submit"
        >
          <span v-if="invalid" class="text-destructive absolute -top-6 left-2 text-sm">
            {{ errorMessage }}
          </span>
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
        <a
          :href="'https://osu.ppy.sh/mp/' + result.match.id"
          class="block text-center text-2xl hover:underline"
        >
          {{ result.match.name }}
        </a>
        <MatchStats
          :beatmaps="beatmaps"
          :visible-ids="visibleIds"
          v-model:winner-modes="winnerModes"
          v-model:cost-formula="costFormula"
          :ez-multipliers="ezMultipliers"
          :match-title="result.match.name"
          :match-url="'https://osu.ppy.sh/mp/' + result.match.id"
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
            :winner-mode="winnerModes.get(b.id) ?? 'score'"
            :ez-multiplier="ezMultipliers.get(b.id)"
            :hidden="!visibleIds.has(b.id)"
            @toggle="toggleMap(b.id)"
            @update:winner-mode="(v) => setWinnerMode(b.id, v)"
            @update:ez-multiplier="(v) => setEzMultiplier(b.id, v)"
          />
        </div>
      </div>
    </Transition>
    <footer class="absolute bottom-4">
      <p class="text-muted-foreground text-center text-sm">
        not affiliated with osu! or ppy Pty Ltd
      </p>
    </footer>
  </div>
</template>

<script setup lang="ts">
const input = ref('');
const isTriggered = ref(false);
const loading = ref(false);
const errorMessage = ref('Invalid match ID');
const result = ref<MatchDetails | null>(null);
const winnerModes = ref<Map<number, WinnerMode>>(new Map());
const costFormula = ref<CostFormula>('bathbot');
const visibleIds = ref<Set<number>>(new Set());
const ezMultipliers = ref<Map<number, number>>(new Map());
const invalid = computed(() => isTriggered.value && parseMatchId(input.value) === null);
const beatmaps = computed(() => result.value?.beatmaps ?? []);
const router = useRouter();
const route = useRoute();

watch(
  beatmaps,
  (list) => {
    visibleIds.value = new Set(
      list.filter((b) => !b.scores.every((s) => s.score === 0)).map((b) => b.id),
    );
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

const setWinnerMode = (id: number, mode: WinnerMode) => {
  const next = new Map(winnerModes.value);
  next.set(id, mode);
  winnerModes.value = next;
};

const submit = async () => {
  isTriggered.value = true;

  const id = parseMatchId(input.value);
  if (invalid.value) return;

  loading.value = true;
  try {
    result.value = await $fetch<MatchDetails>(`/api/matches/${id}`);
    await router.replace({ query: { match: id } });
  } catch (err) {
    console.error(err);
    input.value = '';
    errorMessage.value = 'Match not found';
  } finally {
    loading.value = false;
  }
};

const syncFromUrl = async () => {
  const raw = route.query.match;
  if (typeof raw !== 'string') return;

  input.value = raw;
  isTriggered.value = true;

  const id = parseMatchId(raw);
  if (!id) return;

  loading.value = true;
  try {
    result.value = await $fetch<MatchDetails>(`/api/matches/${id}`);
  } catch (err) {
    console.error(err);
    input.value = '';
    errorMessage.value = 'Match not found';
  } finally {
    loading.value = false;
  }
};

onMounted(() => syncFromUrl());
</script>
