<script setup lang="ts">
import type { PipelineStatus } from '~/types/api'

defineProps<{ status: PipelineStatus }>()
</script>

<template>
  <UBadge
    :color="statusColors[status]"
    variant="subtle"
  >
    {{ statusLabels[status] }}
  </UBadge>
</template>
