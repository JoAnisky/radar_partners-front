<script setup lang="ts">
import type { TableColumn } from '@nuxt/ui'
import type { ContactListItem, Page } from '~/types/api'

const api = useApi()

const search = ref('')
const q = ref('')
const sort = ref('fullName')
const direction = ref<'asc' | 'desc'>('asc')
const page = ref(1)
const perPage = 25

let timer: ReturnType<typeof setTimeout> | undefined
watch(search, (value) => {
  clearTimeout(timer)
  timer = setTimeout(() => { q.value = value.trim() }, 300)
})
watch([q, sort, direction], () => { page.value = 1 })

const query = computed(() => ({
  q: q.value || undefined,
  sort: sort.value,
  direction: direction.value,
  page: page.value,
  perPage,
}))

const { data, status: loadStatus } = await useAsyncData(
  'contacts',
  () => api<Page<ContactListItem>>('/api/contacts', { query: query.value }),
  { watch: [query] },
)

const sortItems = [
  { value: 'fullName', label: 'Nom' },
  { value: 'company', label: 'Entreprise' },
  { value: 'lastInteractionAt', label: 'Dernier échange' },
  { value: 'createdAt', label: "Date d'ajout" },
]

const columns: TableColumn<ContactListItem>[] = [
  { accessorKey: 'fullName', header: 'Nom' },
  { accessorKey: 'role', header: 'Rôle' },
  { id: 'company', header: 'Entreprise' },
  { accessorKey: 'phone', header: 'Téléphone' },
  { accessorKey: 'email', header: 'Email' },
  { accessorKey: 'lastInteractionAt', header: 'Dernier échange' },
]
</script>

<template>
  <div class="space-y-4">
    <div class="flex flex-wrap items-center gap-3">
      <UInput v-model="search" placeholder="Rechercher (nom, rôle, email, entreprise)" class="w-80" />
      <USelect v-model="sort" :items="sortItems" class="w-48" />
      <USelect
        v-model="direction"
        :items="[{ value: 'asc', label: 'Croissant' }, { value: 'desc', label: 'Décroissant' }]"
        class="w-36"
      />
    </div>

    <UTable :data="data?.items ?? []" :columns="columns" :loading="loadStatus === 'pending'">
      <template #fullName-cell="{ row }">
        <NuxtLink :to="`/companies/${row.original.company.id}`" class="font-medium text-primary hover:underline">
          {{ row.original.fullName }}
        </NuxtLink>
      </template>
      <template #role-cell="{ row }">
        {{ row.original.role ?? '—' }}
      </template>
      <template #company-cell="{ row }">
        <NuxtLink :to="`/companies/${row.original.company.id}`" class="hover:underline">
          {{ row.original.company.name }}
        </NuxtLink>
        <span v-if="row.original.company.city" class="text-muted"> · {{ row.original.company.city }}</span>
      </template>
      <template #phone-cell="{ row }">
        <a v-if="row.original.phone" :href="`tel:${row.original.phone}`" class="hover:underline">{{ row.original.phone }}</a>
        <template v-else>—</template>
      </template>
      <template #email-cell="{ row }">
        <a v-if="row.original.email" :href="`mailto:${row.original.email}`" class="hover:underline">{{ row.original.email }}</a>
        <template v-else>—</template>
      </template>
      <template #lastInteractionAt-cell="{ row }">
        {{ formatDate(row.original.lastInteractionAt) }}
      </template>
    </UTable>

    <div class="flex items-center justify-between">
      <p class="text-sm text-muted">{{ data?.total ?? 0 }} contact(s). Pour en ajouter, ouvrez la fiche d'une entreprise.</p>
      <UPagination v-model:page="page" :items-per-page="perPage" :total="data?.total ?? 0" />
    </div>
  </div>
</template>
