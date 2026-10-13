<script setup lang="ts">
defineProps<{ score: number }>()
</script>

<template>
  <UBadge
    :color="scoreColor(score)"
    variant="subtle"
    class="tabular-nums"
  >
    {{ score }}
  </UBadge>
</template>
