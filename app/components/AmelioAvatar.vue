<script setup lang="ts">
export type AvatarState = 'idle' | 'thinking' | 'error'

withDefaults(defineProps<{ state?: AvatarState }>(), { state: 'idle' })
</script>

<template>
  <svg
    viewBox="0 0 64 64"
    xmlns="http://www.w3.org/2000/svg"
    aria-hidden="true"
    class="shrink-0"
    :data-state="state"
  >
    <!-- Antenne -->
    <line
      x1="32"
      y1="9"
      x2="32"
      y2="15"
      stroke="#e4e4e7"
      stroke-width="3"
      stroke-linecap="round"
    />
    <circle
      cx="32"
      cy="7"
      r="3.5"
      :fill="state === 'error' ? 'var(--ui-error)' : 'var(--ui-primary)'"
      :class="{ 'animate-pulse': state === 'thinking' }"
    />
    <!-- Oreilles et tête -->
    <rect
      x="4"
      y="26"
      width="7"
      height="14"
      rx="3"
      fill="#e4e4e7"
    />
    <rect
      x="53"
      y="26"
      width="7"
      height="14"
      rx="3"
      fill="#e4e4e7"
    />
    <rect
      x="9"
      y="15"
      width="46"
      height="38"
      rx="13"
      fill="#e4e4e7"
    />
    <!-- Écran du visage -->
    <rect
      x="15"
      y="22"
      width="34"
      height="24"
      rx="10"
      fill="#0c0c0d"
    />

    <!-- Erreur : yeux en croix, bouche triste -->
    <g
      v-if="state === 'error'"
      stroke="var(--ui-error)"
      stroke-width="2.6"
      stroke-linecap="round"
      fill="none"
    >
      <path d="M22 29.5 L28 35.5 M28 29.5 L22 35.5" />
      <path d="M36 29.5 L42 35.5 M42 29.5 L36 35.5" />
      <path d="M26 42.5 Q32 37.5 38 42.5" />
    </g>

    <!-- Réflexion : yeux qui pulsent, bouche droite -->
    <g
      v-else-if="state === 'thinking'"
      fill="var(--ui-primary)"
    >
      <g class="animate-pulse">
        <circle
          cx="25"
          cy="32"
          r="3.6"
        />
        <circle
          cx="39"
          cy="32"
          r="3.6"
        />
      </g>
      <rect
        x="28"
        y="38.5"
        width="8"
        height="2.6"
        rx="1.3"
      />
    </g>

    <!-- Normal : yeux qui clignent de temps en temps, sourire -->
    <g
      v-else
      fill="var(--ui-primary)"
    >
      <g class="amelio-eyes">
        <circle
          cx="25"
          cy="32"
          r="3.6"
        />
        <circle
          cx="39"
          cy="32"
          r="3.6"
        />
      </g>
      <path
        d="M26 39.5 Q32 44 38 39.5"
        fill="none"
        stroke="var(--ui-primary)"
        stroke-width="2.6"
        stroke-linecap="round"
      />
    </g>
  </svg>
</template>

<style scoped>
@keyframes amelio-blink {
  0%, 92%, 100% { transform: scaleY(1); }
  96% { transform: scaleY(0.1); }
}

.amelio-eyes circle {
  transform-box: fill-box;
  transform-origin: center;
  animation: amelio-blink 5s infinite;
}

@media (prefers-reduced-motion: reduce) {
  .amelio-eyes circle { animation: none; }
}
</style>
