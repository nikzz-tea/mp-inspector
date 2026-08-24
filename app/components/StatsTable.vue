<script setup lang="ts">
defineProps<{
  players: PlayerStats[];
  playerRank: Map<PlayerStats['userId'], number>;
  costBreakdown: (id: number) => CostBreakdown;
}>();

const breakdownTitle = (b: CostBreakdown): string => {
  return `${b.matchCost.toFixed(2)} = (${b.performance.toFixed(2)} * ${b.participation.toFixed(2)} * ${b.mods.toFixed(2)}) + ${b.tiebreaker.toFixed(2)}`;
};

const playerColor = ['text-yellow-500', 'text-zinc-400', 'text-orange-700'];
</script>

<template>
  <Table>
    <TableHeader class="[&_tr]:border-0">
      <TableRow class="border-0 hover:bg-transparent">
        <TableHead class="text-muted-foreground px-2 text-xs font-normal max-sm:px-0">
          Player
        </TableHead>
        <TableHead class="text-muted-foreground px-2 text-right text-xs font-normal max-sm:px-0">
          Avg score
        </TableHead>
        <TableHead class="text-muted-foreground px-2 text-right text-xs font-normal max-sm:px-0">
          Avg acc
        </TableHead>
        <TableHead class="text-muted-foreground px-2 text-right text-xs font-normal max-sm:px-0">
          Maps
        </TableHead>
        <TableHead class="text-muted-foreground px-2 text-right text-xs font-normal max-sm:px-0">
          MC
        </TableHead>
      </TableRow>
    </TableHeader>
    <TableBody class="[&_tr:last-child]:border-0">
      <TableRow v-for="p in players" :key="p.userId" class="border-0 hover:bg-transparent">
        <TableCell class="px-2 max-sm:px-0">
          <a
            :href="'https://osu.ppy.sh/u/' + p.userId"
            class="text-foreground font-medium hover:underline"
            :class="playerColor[playerRank.get(p.userId) ?? -1]"
          >
            {{ p.username }}
          </a>
        </TableCell>
        <TableCell class="px-2 text-right tabular-nums max-sm:px-0">
          {{ p.avgScore.toLocaleString(undefined, { maximumFractionDigits: 0 }) }}
        </TableCell>
        <TableCell class="px-2 text-right tabular-nums max-sm:px-0">
          {{ (p.avgAccuracy * 100).toFixed(2) }}%
        </TableCell>
        <TableCell class="px-2 text-right tabular-nums max-sm:px-0">{{ p.gamesPlayed }}</TableCell>
        <TableCell class="px-2 text-right max-sm:px-0">
          <span class="font-semibold tabular-nums" :title="breakdownTitle(costBreakdown(p.userId))">
            {{ costBreakdown(p.userId).matchCost.toFixed(2) }}
          </span>
        </TableCell>
      </TableRow>
    </TableBody>
  </Table>
</template>
