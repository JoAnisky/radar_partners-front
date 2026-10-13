<script setup lang="ts">
type Tone = 'emerald' | 'blue' | 'amber' | 'violet'

const props = defineProps<{
  label: string
  value: number | string
  icon: string
  tone: Tone
  /** Variation en pourcentage ; `null` quand il n'y a pas de période de comparaison. */
  delta?: number | null
  /** Texte de tendance libre (prioritaire sur `delta`), ex. « +5 cette semaine ». */
  trend?: string
  hint?: string
  series?: number[]
}>()

// Classes écrites en entier pour que Tailwind les détecte.
const tones: Record<Tone, { icon: string, color: string }> = {
  emerald: { icon: 'bg-emerald-500/10 text-emerald-400', color: '#10b981' },
  blue: { icon: 'bg-blue-500/10 text-blue-400', color: '#3b82f6' },
  amber: { icon: 'bg-amber-500/10 text-amber-400', color: '#f59e0b' },
  violet: { icon: 'bg-violet-500/10 text-violet-400', color: '#8b5cf6' },
}

const trendText = computed(() => props.trend ?? (props.delta == null ? undefined : formatDelta(props.delta)))
const down = computed(() => props.trend === undefined && props.delta != null && props.delta < 0)
</script>

<template>
  <div class="flex flex-col overflow-hidden rounded-xl bg-elevated ring ring-default">
    <div class="flex items-start justify-between gap-3 p-4 pb-2">
      <div class="space-y-1.5">
        <p class="text-sm text-muted">
          {{ label }}
        </p>
        <p class="text-3xl font-semibold text-highlighted tabular-nums">
          {{ value }}
        </p>
        <p
          v-if="trendText"
          class="flex items-center gap-1 text-xs"
          :class="down ? 'text-error' : 'text-success'"
        >
          <UIcon
            :name="down ? 'i-lucide-trending-down' : 'i-lucide-trending-up'"
            class="size-3.5"
          />
          {{ trendText }}
        </p>
        <p
          v-if="hint"
          class="text-xs text-muted"
        >
          {{ hint }}
        </p>
      </div>
      <span
        class="flex size-10 shrink-0 items-center justify-center rounded-lg"
        :class="tones[tone].icon"
      >
        <UIcon
          :name="icon"
          class="size-5"
        />
      </span>
    </div>
    <SparklineChart
      v-if="series?.length"
      :values="series"
      :color="tones[tone].color"
      class="mt-auto"
    />
  </div>
</template>
