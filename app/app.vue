<script setup lang="ts">
import { fr } from '@nuxt/ui/locale'

useHead({ titleTemplate: title => title ? `${title} · Radar Partenaires` : 'Radar Partenaires' })
</script>

<template>
  <UApp :locale="fr">
    <NuxtRouteAnnouncer />
    <NuxtLayout>
      <NuxtPage />
    </NuxtLayout>
  </UApp>
</template>
