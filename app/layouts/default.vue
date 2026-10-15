<script setup lang="ts">
import type { NavigationMenuItem } from '@nuxt/ui'
import type { Page, Signal } from '~/types/api'

const route = useRoute()
const api = useApi()

const collapsed = ref(false)
const searchOpen = ref(false)
const createOpen = ref(false)
const { searchTerm, loading, groups } = useGlobalSearch()

const { data: pending } = useLazyAsyncData(
  'signals-pending',
  () => api<Page<Signal>>('/api/signals', { query: { unresolved: 1, perPage: 1 } }),
  { watch: [() => route.fullPath] },
)

const title = computed(() => (route.meta.title as string | undefined) ?? 'Radar Partenaires')

const sections = computed<{ label: string, items: NavigationMenuItem[] }[]>(() => [
  {
    label: 'Aperçu',
    items: [
      { label: 'Accueil', icon: 'i-lucide-layout-dashboard', to: '/', active: route.path === '/' },
    ],
  },
  {
    label: 'Prospection',
    items: [
      { label: 'Entreprises', icon: 'i-lucide-building-2', to: '/companies', active: route.path.startsWith('/companies') },
      { label: 'Contacts', icon: 'i-lucide-users', to: '/contacts' },
    ],
  },
  {
    label: 'Assistant',
    items: [
      { label: 'Assistant', icon: 'i-lucide-bot', to: '/assistant' },
    ],
  },
  {
    label: 'Veille',
    items: [
      { label: 'Signaux', icon: 'i-lucide-radio-tower', to: '/signals', badge: pending.value?.total || undefined },
    ],
  },
])
</script>

<template>
  <UDashboardGroup>
    <UDashboardSidebar
      v-model:collapsed="collapsed"
      collapsible
      resizable
      :ui="{ footer: 'border-t border-default' }"
    >
      <template #header="{ collapsed: isCollapsed }">
        <NuxtLink
          to="/"
          class="flex items-center gap-2.5 px-1"
        >
          <span class="flex size-8 shrink-0 items-center justify-center rounded-lg bg-primary text-inverted">
            <UIcon
              name="i-lucide-radar"
              class="size-5"
            />
          </span>
          <span
            v-if="!isCollapsed"
            class="leading-tight"
          >
            <span class="block text-sm font-semibold">Radar</span>
            <span class="block text-[10px] tracking-widest text-muted uppercase">Partenaires</span>
          </span>
        </NuxtLink>
      </template>

      <template #default="{ collapsed: isCollapsed }">
        <UDashboardSearchButton
          :collapsed="isCollapsed"
          class="bg-transparent ring-default"
        />

        <div
          v-for="section in sections"
          :key="section.label"
          class="space-y-1"
        >
          <p
            v-if="!isCollapsed"
            class="px-2.5 text-[11px] font-medium tracking-wider text-dimmed uppercase"
          >
            {{ section.label }}
          </p>
          <UNavigationMenu
            :collapsed="isCollapsed"
            :items="section.items"
            orientation="vertical"
          />
        </div>
      </template>
    </UDashboardSidebar>

    <UDashboardSearch
      v-model:search-term="searchTerm"
      v-model:open="searchOpen"
      :groups="groups"
      :loading="loading"
      :color-mode="false"
      placeholder="Rechercher une entreprise, un contact, une page…"
    />

    <UDashboardPanel>
      <template #header>
        <UDashboardNavbar :title="title">
          <template #leading>
            <UDashboardSidebarCollapse />
          </template>
          <template #right>
            <UButton
              label="Entreprise"
              icon="i-lucide-plus"
              @click="createOpen = true"
            />
          </template>
        </UDashboardNavbar>
      </template>

      <template #body>
        <slot />
      </template>
    </UDashboardPanel>

    <CompanyCreateModal v-model:open="createOpen" />
  </UDashboardGroup>
</template>
