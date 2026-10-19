<script setup lang="ts">
import type { Page, Signal } from '~/types/api'

definePageMeta({ title: 'Signaux' })

const api = useApi()

const view = ref('todo')

const { data, refresh } = await useAsyncData(
  'signals',
  () => api<Page<Signal>>('/api/signals', { query: { unresolved: 1, perPage: 50 } }),
)
const { data: archived, refresh: refreshArchived } = await useAsyncData(
  'signals-archived',
  () => api<Page<Signal>>('/api/signals', { query: { dismissed: 1, perPage: 50 } }),
)

const current = computed(() => (view.value === 'todo' ? data.value : archived.value))
const tabs = computed(() => [
  { value: 'todo', label: `À traiter (${data.value?.total ?? 0})` },
  { value: 'archived', label: `Archivées (${archived.value?.total ?? 0})` },
])

const refreshAll = () => Promise.all([refresh(), refreshArchived()])

const toast = useToast()

async function setDismissed(signal: Signal, dismissed: boolean) {
  try {
    await api(`/api/signals/${signal.id}`, { method: 'PATCH', body: { dismissed } })
    await refreshAll()
  }
  catch (error) {
    toast.add({ title: errorMessage(error), color: 'error' })
  }
}

const extra = (signal: Signal) =>
  [signal.extracted.city, signal.extracted.dailyRate, signal.extracted.durationMonths ? `${signal.extracted.durationMonths} mois` : null]
    .filter(Boolean)
    .join(' · ')
</script>

<template>
  <div class="space-y-4">
    <div class="space-y-2">
      <SegmentedControl
        v-model="view"
        :items="tabs"
      />
      <p
        v-if="view === 'todo'"
        class="text-sm text-muted"
      >
        {{ data?.total ?? 0 }} offre(s) à rattacher. Ouvrez l'offre pour trouver l'entreprise, puis rattachez-la ici.
      </p>
    </div>

    <p
      v-if="!current?.items.length"
      class="text-muted"
    >
      {{ view === 'todo' ? 'Rien à traiter.' : 'Aucune offre archivée.' }}
    </p>

    <UCard
      v-for="signal in current?.items"
      :key="signal.id"
    >
      <div class="space-y-3">
        <div>
          <UBadge
            v-if="signal.extracted.toReview"
            color="warning"
            variant="subtle"
            class="mr-2 mb-1"
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
        <div
          v-if="view === 'todo'"
          class="flex flex-wrap items-start justify-between gap-2"
        >
          <SignalAttach
            :signal="signal"
            @attached="refreshAll"
          />
          <UButton
            label="Écarter"
            icon="i-lucide-archive"
            color="neutral"
            variant="ghost"
            size="sm"
            @click="setDismissed(signal, true)"
          />
        </div>
        <UButton
          v-else
          label="Restaurer"
          icon="i-lucide-undo-2"
          color="neutral"
          variant="outline"
          size="sm"
          @click="setDismissed(signal, false)"
        />
      </div>
    </UCard>
  </div>
</template>
