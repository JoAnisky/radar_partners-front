<script setup lang="ts">
import type { TableColumn } from '@nuxt/ui'
import type { CompanySummary, Page, PipelineStatus } from '~/types/api'

definePageMeta({ title: 'Entreprises' })

const api = useApi()
const route = useRoute()

const search = ref('')
const q = ref('')
const queryStatus = String(route.query.status ?? '')
const status = ref<PipelineStatus | 'ALL'>(queryStatus in statusLabels ? queryStatus as PipelineStatus : 'ALL')
const due = ref(route.query.due === '1')
const sort = ref('score')
const direction = ref<'asc' | 'desc'>('desc')
const page = ref(1)
const perPage = 25

let timer: ReturnType<typeof setTimeout> | undefined
watch(search, (value) => {
  clearTimeout(timer)
  timer = setTimeout(() => {
    q.value = value.trim()
  }, 300)
})
watch([q, status, due, sort, direction], () => {
  page.value = 1
})

const query = computed(() => ({
  q: q.value || undefined,
  status: status.value === 'ALL' ? undefined : status.value,
  due: due.value ? 1 : undefined,
  sort: sort.value,
  direction: direction.value,
  page: page.value,
  perPage,
}))

const { data, status: loadStatus } = await useAsyncData(
  'companies',
  () => api<Page<CompanySummary>>('/api/companies', { query: query.value }),
  { watch: [query] },
)

const statusItems = [{ value: 'ALL', label: 'Tous les statuts' }, ...toItems(statusLabels)]
const sortItems = [
  { value: 'score', label: 'Score' },
  { value: 'name', label: 'Nom' },
  { value: 'lastInteractionAt', label: 'Dernier contact' },
  { value: 'recontactAfter', label: 'Date de relance' },
  { value: 'createdAt', label: 'Date d\'ajout' },
]

const columns: TableColumn<CompanySummary>[] = [
  { accessorKey: 'score', header: 'Score' },
  { accessorKey: 'name', header: 'Entreprise' },
  { accessorKey: 'city', header: 'Ville' },
  { accessorKey: 'headcountRange', header: 'Effectif' },
  { accessorKey: 'status', header: 'Statut' },
  { accessorKey: 'lastInteractionAt', header: 'Dernier contact' },
  { accessorKey: 'recontactAfter', header: 'Relance' },
]
</script>

<template>
  <div class="space-y-4">
    <div class="flex flex-wrap items-center gap-3">
      <UInput
        v-model="search"
        placeholder="Rechercher (nom, ville, SIREN)"
        class="w-72"
      />
      <USelect
        v-model="status"
        :items="statusItems"
        class="w-48"
      />
      <USelect
        v-model="sort"
        :items="sortItems"
        class="w-48"
      />
      <USelect
        v-model="direction"
        :items="[{ value: 'asc', label: 'Croissant' }, { value: 'desc', label: 'Décroissant' }]"
        class="w-36"
      />
      <USwitch
        v-model="due"
        label="À relancer"
      />
    </div>

    <UTable
      :data="data?.items ?? []"
      :columns="columns"
      :loading="loadStatus === 'pending'"
    >
      <template #score-cell="{ row }">
        <ScoreBadge :score="row.original.score" />
      </template>
      <template #name-cell="{ row }">
        <NuxtLink
          :to="`/companies/${row.original.id}`"
          class="font-medium text-primary hover:underline"
        >
          {{ row.original.name }}
        </NuxtLink>
      </template>
      <template #headcountRange-cell="{ row }">
        {{ row.original.headcountRange ?? '—' }}
      </template>
      <template #status-cell="{ row }">
        <StatusBadge :status="row.original.status" />
      </template>
      <template #lastInteractionAt-cell="{ row }">
        {{ formatDate(row.original.lastInteractionAt) }}
      </template>
      <template #recontactAfter-cell="{ row }">
        {{ formatDate(row.original.recontactAfter) }}
      </template>
    </UTable>

    <div class="flex items-center justify-between">
      <p class="text-sm text-muted">
        {{ data?.total ?? 0 }} entreprise(s)
      </p>
      <UPagination
        v-model:page="page"
        :items-per-page="perPage"
        :total="data?.total ?? 0"
      />
    </div>
  </div>
</template>
