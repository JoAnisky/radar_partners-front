<script setup lang="ts">
defineProps<{ items: { value: string, label: string }[] }>()
const model = defineModel<string>({ required: true })
</script>

<template>
  <div
    class="inline-flex rounded-lg bg-default p-1 ring ring-default"
    role="tablist"
  >
    <button
      v-for="item in items"
      :key="item.value"
      type="button"
      role="tab"
      :aria-selected="model === item.value"
      class="rounded-md px-3 py-1 text-sm transition-colors"
      :class="model === item.value ? 'bg-accented text-highlighted' : 'text-muted hover:text-default'"
      @click="model = item.value"
    >
      {{ item.label }}
    </button>
  </div>
</template>
