<script setup lang="ts">
import type { Page, Signal } from '~/types/api'

definePageMeta({ title: 'Signaux' })

const api = useApi()

const { data, refresh } = await useAsyncData(
  'signals',
  () => api<Page<Signal>>('/api/signals', { query: { unresolved: 1, perPage: 50 } }),
)

const extra = (signal: Signal) =>
  [signal.extracted.city, signal.extracted.dailyRate, signal.extracted.durationMonths ? `${signal.extracted.durationMonths} mois` : null]
    .filter(Boolean)
    .join(' · ')
</script>

<template>
  <div class="space-y-4">
    <div>
      <p class="text-sm text-muted">
        {{ data?.total ?? 0 }} offre(s) à rattacher. Ouvrez l'offre pour trouver l'entreprise, puis rattachez-la ici.
      </p>
    </div>

    <p
      v-if="!data?.items.length"
      class="text-muted"
    >
      Rien à traiter.
    </p>

    <UCard
      v-for="signal in data?.items"
      :key="signal.id"
    >
      <div class="space-y-3">
        <div>
          <UBadge
            v-if="signal.extracted.toReview"
            color="warning"
            variant="subtle"
            class="mb-1"
          >
            À vérifier
          </UBadge>
          <a
            v-if="signal.url"
            :href="signal.url"
            target="_blank"
            rel="noopener"
            class="font-medium text-primary hover:underline"
          >
            {{ signal.title }}
          </a>
          <p
            v-else
            class="font-medium"
          >
            {{ signal.title }}
          </p>
          <p class="text-sm text-muted">
            {{ signalTypeLabels[signal.type] }} · {{ signal.source }} · détecté le {{ formatDate(signal.detectedAt) }}
            <template v-if="extra(signal)">
              · {{ extra(signal) }}
            </template>
          </p>
        </div>
        <SignalAttach
          :signal="signal"
          @attached="refresh"
        />
      </div>
    </UCard>
  </div>
</template>
