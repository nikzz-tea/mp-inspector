<script setup lang="ts">
import { Monitor, Moon, Sun } from '@lucide/vue';

type Theme = 'light' | 'system' | 'dark';

const themes: Theme[] = ['light', 'system', 'dark'];
const colorMode = useColorMode();

const setTheme = (value: Theme) => {
  colorMode.preference = value;
};
</script>

<template>
  <div
    class="bg-card fixed right-0 z-50 flex flex-col rounded-l-lg border border-r-0 shadow-sm max-lg:bottom-4 lg:top-4"
  >
    <button
      v-for="option in themes"
      :key="option"
      type="button"
      class="hover:bg-accent flex size-10 cursor-pointer items-center justify-center first:rounded-tl-lg last:rounded-bl-lg max-lg:size-8"
      :class="colorMode.preference === option && 'bg-accent'"
      :aria-label="option + ' theme'"
      @click="setTheme(option)"
    >
      <Sun v-if="option === 'light'" class="size-4" />
      <Moon v-else-if="option === 'dark'" class="size-4" />
      <Monitor v-else class="size-4" />
    </button>
  </div>
</template>
