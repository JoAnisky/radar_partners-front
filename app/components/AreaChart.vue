<script setup lang="ts">
const props = defineProps<{ labels: string[], values: number[], color: string, unit?: string }>()

const WIDTH = 640
const HEIGHT = 190
const margin = { top: 12, right: 12, bottom: 28, left: 40 }
const innerWidth = WIDTH - margin.left - margin.right
const innerHeight = HEIGHT - margin.top - margin.bottom

const id = useId()
const svg = useTemplateRef<SVGSVGElement>('svg')
const width = ref(0)
let observer: ResizeObserver | undefined
onMounted(() => {
  if (!svg.value || typeof ResizeObserver === 'undefined') return
  observer = new ResizeObserver(([entry]) => {
    width.value = entry?.contentRect.width ?? 0
  })
  observer.observe(svg.value)
})
onBeforeUnmount(() => observer?.disconnect())
// Police de 10 px à l'écran, quelle que soit l'échelle du SVG.
const fontSize = computed(() => (width.value ? 10 * WIDTH / width.value : 10))
const max = computed(() => axisMax(Math.max(...props.values, 0)))
const points = computed(() => scalePoints(props.values, innerWidth, innerHeight, max.value))
const line = computed(() => linePath(points.value))
const area = computed(() => areaPath(points.value, innerHeight))
const gridlines = computed(() => ticks(max.value).map(value => ({ value, y: Math.round(innerHeight * (1 - value / max.value)) })))
const xLabels = computed(() => props.labels
  .map((label, index) => ({ label, x: points.value[index]?.x ?? 0, index }))
  .filter(({ index }) => (props.labels.length - 1 - index) % 2 === 0))
</script>

<template>
  <svg
    ref="svg"
    :viewBox="`0 0 ${WIDTH} ${HEIGHT}`"
    class="h-auto w-full"
    role="img"
  >
    <defs>
      <linearGradient
        :id="`area-${id}`"
        x1="0"
        y1="0"
        x2="0"
        y2="1"
      >
        <stop
          offset="0%"
          :stop-color="color"
          stop-opacity="0.3"
        />
        <stop
          offset="100%"
          :stop-color="color"
          stop-opacity="0"
        />
      </linearGradient>
    </defs>
    <g :transform="`translate(${margin.left},${margin.top})`">
      <g
        v-for="grid in gridlines"
        :key="grid.value"
      >
        <line
          x1="0"
          :x2="innerWidth"
          :y1="grid.y"
          :y2="grid.y"
          stroke="currentColor"
          class="text-default"
          stroke-dasharray="3 4"
        />
        <text
          x="-10"
          :y="grid.y + 4"
          text-anchor="end"
          class="fill-neutral-500"
          :font-size="fontSize"
        >{{ grid.value }}</text>
      </g>
      <path
        :d="area"
        :fill="`url(#area-${id})`"
      />
      <path
        :d="line"
        fill="none"
        :stroke="color"
        stroke-width="2.5"
        stroke-linecap="round"
      />
      <circle
        v-for="(point, index) in points"
        :key="index"
        :cx="point.x"
        :cy="point.y"
        r="3"
        :fill="color"
      >
        <title>{{ labels[index] }} : {{ values[index] }}{{ unit ? ` ${unit}` : '' }}</title>
      </circle>
      <text
        v-for="item in xLabels"
        :key="item.index"
        :x="item.x"
        :y="innerHeight + 20"
        text-anchor="middle"
        class="fill-neutral-500"
        :font-size="fontSize"
      >
        {{ item.label }}
      </text>
    </g>
  </svg>
</template>
