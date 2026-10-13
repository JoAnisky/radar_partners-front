<script setup lang="ts">
import type { DonutSegment } from '~/types/chart'

const props = defineProps<{ segments: DonutSegment[], centerLabel: string }>()

const total = computed(() => props.segments.reduce((sum, segment) => sum + segment.value, 0))
const arcs = computed(() => donutArcs(props.segments.map(segment => segment.value)))
const visible = computed(() => props.segments.filter(segment => segment.value > 0))
</script>

<template>
  <div class="flex flex-wrap items-center gap-6">
    <svg
      viewBox="0 0 42 42"
      class="size-36 shrink-0"
      role="img"
      :aria-label="centerLabel"
    >
      <circle
        cx="21"
        cy="21"
        r="15.9155"
        fill="none"
        stroke="currentColor"
        class="text-default"
        stroke-width="5"
      />
      <template
        v-for="(segment, index) in segments"
        :key="segment.key"
      >
        <circle
          v-if="segment.value > 0"
          cx="21"
          cy="21"
          r="15.9155"
          fill="none"
          :stroke="segment.color"
          stroke-width="5"
          :stroke-dasharray="`${arcs[index]!.length} ${100 - arcs[index]!.length}`"
          :stroke-dashoffset="25 - arcs[index]!.start"
        >
          <title>{{ segment.label }} : {{ segment.value }}</title>
        </circle>
      </template>
      <text
        x="21"
        y="21.5"
        text-anchor="middle"
        class="fill-white text-[7px] font-semibold"
      >{{ total }}</text>
      <text
        x="21"
        y="27"
        text-anchor="middle"
        class="fill-neutral-500 text-[3px]"
      >{{ centerLabel }}</text>
    </svg>

    <ul class="min-w-40 flex-1 space-y-2 text-sm">
      <li
        v-for="segment in visible"
        :key="segment.key"
        class="flex items-center gap-2"
      >
        <span
          class="size-2.5 shrink-0 rounded-full"
          :style="{ backgroundColor: segment.color }"
        />
        <NuxtLink
          v-if="segment.to"
          :to="segment.to"
          class="text-muted hover:text-default"
        >
          {{ segment.label }}
        </NuxtLink>
        <span
          v-else
          class="text-muted"
        >{{ segment.label }}</span>
        <span class="ml-auto font-medium text-highlighted tabular-nums">{{ segment.value }}</span>
        <span class="w-10 text-right text-xs text-dimmed tabular-nums">{{ percent(segment.value, total) }} %</span>
      </li>
    </ul>
  </div>
</template>
