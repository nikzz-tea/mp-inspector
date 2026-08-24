<script setup lang="ts">
const props = defineProps<{
  scores: PlayerScore[];
  commonMods: string[];
}>();

const rankColor = {
  XH: 'text-zinc-400',
  X: 'text-yellow-500',
  SH: 'text-zinc-400',
  S: 'text-yellow-500',
  A: 'text-green-500',
  B: 'text-blue-500',
  C: 'text-pink-500',
  D: 'text-red-500',
  F: 'text-red-500',
};

const mods = (s: PlayerScore) => s.mods.filter((m) => !props.commonMods.includes(m));
</script>

<template>
  <ul class="flex flex-col gap-1 text-sm">
    <li v-for="s in scores" :key="s.userId" class="text-muted-foreground flex items-baseline gap-2">
      <a
        :href="'https://osu.ppy.sh/u/' + s.userId"
        class="text-foreground font-medium hover:underline"
      >
        {{ s.username }}
      </a>
      <span class="ml-auto font-bold" :class="rankColor[s.rank]">{{ s.rank }}</span>
      <span v-if="mods(s).length" class="text-right">+{{ mods(s).join('') }}</span>
      <span class="text-right tabular-nums">
        {{ s.score.toLocaleString(undefined, { maximumFractionDigits: 0 }) }}
      </span>
      <span class="w-12 text-right tabular-nums">{{ (s.accuracy * 100).toFixed(2) }}%</span>
    </li>
  </ul>
</template>
