<script setup lang="ts">
const items = [
  { label: 'Entreprises', to: '/' },
  { label: 'Signaux', to: '/signals' },
]
</script>

<template>
  <div class="min-h-screen">
    <header class="border-b border-default">
      <UContainer class="flex h-14 items-center gap-6">
        <NuxtLink to="/" class="font-semibold">Radar Partenaires</NuxtLink>
        <UNavigationMenu :items="items" />
      </UContainer>
    </header>
    <UContainer class="py-6">
      <slot />
    </UContainer>
  </div>
</template>
