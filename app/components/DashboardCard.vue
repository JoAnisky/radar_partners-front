<script setup lang="ts">
defineProps<{ title: string, description?: string }>()
</script>

<template>
  <section class="rounded-xl bg-elevated p-5 ring ring-default">
    <header class="mb-4 flex flex-wrap items-start justify-between gap-3">
      <div>
        <h2 class="font-medium text-highlighted">
          {{ title }}
        </h2>
        <p
          v-if="description"
          class="text-sm text-muted"
        >
          {{ description }}
        </p>
      </div>
      <slot name="actions" />
    </header>
    <slot />
    <footer
      v-if="$slots.footer"
      class="mt-4 border-t border-default pt-3 text-sm"
    >
      <slot name="footer" />
    </footer>
  </section>
</template>
