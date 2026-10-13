<script setup lang="ts">
const props = defineProps<{ values: number[], color: string }>()

const id = useId()
const points = computed(() => scalePoints(props.values, 100, 26))
const line = computed(() => linePath(points.value))
const area = computed(() => areaPath(points.value, 32))
</script>

<template>
  <svg
    viewBox="0 0 100 32"
    preserveAspectRatio="none"
    class="h-8 w-full"
    aria-hidden="true"
  >
    <defs>
      <linearGradient
        :id="`spark-${id}`"
        x1="0"
        y1="0"
        x2="0"
        y2="1"
      >
        <stop
          offset="0%"
          :stop-color="color"
          stop-opacity="0.35"
        />
        <stop
          offset="100%"
          :stop-color="color"
          stop-opacity="0"
        />
      </linearGradient>
    </defs>
    <path
      :d="area"
      :fill="`url(#spark-${id})`"
    />
    <path
      :d="line"
      fill="none"
      :stroke="color"
      stroke-width="1.5"
      vector-effect="non-scaling-stroke"
    />
  </svg>
</template>
