<script setup lang="ts">
import type { DonutSegment } from '~/types/chart'
import type { Stats } from '~/types/api'

definePageMeta({ title: 'Accueil' })

const api = useApi()
const { data: stats, error } = await useAsyncData('stats', () => api<Stats>('/api/stats'))

const activityTabs = [
  { value: 'interactions', label: 'Interactions', color: '#3b82f6', unit: 'interaction(s)' },
  { value: 'signals', label: 'Offres', color: '#8b5cf6', unit: 'offre(s)' },
  { value: 'companies', label: 'Entreprises', color: '#10b981', unit: 'nouvelle(s)' },
] as const

const activeTab = ref<(typeof activityTabs)[number]['value']>('interactions')
const tab = computed(() => activityTabs.find(item => item.value === activeTab.value) ?? activityTabs[0])
const weekLabels = computed(() => stats.value?.weeks.map(formatDayMonth) ?? [])
const activityValues = computed(() => stats.value?.activity[activeTab.value] ?? [])

const segments = computed<DonutSegment[]>(() => (stats.value?.pipeline ?? []).map(({ status, count }) => ({
  key: status,
  label: statusLabels[status],
  value: count,
  color: statusChartColors[status],
  to: `/companies?status=${status}`,
})))

const progress = computed(() => {
  const value = stats.value?.progress
  return [
    { label: 'Entreprises contactées', count: value?.contacted ?? 0 },
    { label: 'Avec un contact joignable', count: value?.reachable ?? 0 },
    { label: 'Type renseigné', count: value?.typed ?? 0 },
  ]
})
</script>

<template>
  <div
    v-if="stats"
    class="space-y-6"
  >
    <div class="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
      <KpiCard
        label="Entreprises suivies"
        :value="stats.kpis.companies.total"
        icon="i-lucide-building-2"
        tone="emerald"
        :trend="stats.kpis.companies.createdLast7Days > 0 ? `+${stats.kpis.companies.createdLast7Days} cette semaine` : undefined"
        :series="stats.kpis.companies.series"
      />
      <KpiCard
        label="À relancer"
        :value="stats.kpis.due.total"
        icon="i-lucide-bell-ring"
        tone="amber"
        :hint="stats.kpis.due.total > 0 ? 'À traiter en priorité' : 'Rien à relancer pour l\'instant'"
      />
      <KpiCard
        label="Interactions · 30 jours"
        :value="stats.kpis.interactions.last30Days"
        icon="i-lucide-messages-square"
        tone="blue"
        :delta="stats.kpis.interactions.deltaPercent"
        :hint="`${stats.kpis.interactions.previous30Days} les 30 jours précédents`"
        :series="stats.kpis.interactions.series"
      />
      <KpiCard
        label="Offres · 30 jours"
        :value="stats.kpis.signals.last30Days"
        icon="i-lucide-radio-tower"
        tone="violet"
        :delta="stats.kpis.signals.deltaPercent"
        :hint="`${stats.kpis.signals.unresolved} à rattacher à une entreprise`"
        :series="stats.kpis.signals.series"
      />
    </div>

    <div class="grid gap-6 xl:grid-cols-3">
      <DashboardCard
        title="Activité"
        description="Par semaine, sur les 12 dernières semaines"
        class="xl:col-span-2"
      >
        <template #actions>
          <SegmentedControl
            v-model="activeTab"
            :items="activityTabs.map(({ value, label }) => ({ value, label }))"
          />
        </template>
        <AreaChart
          :labels="weekLabels"
          :values="activityValues"
          :color="tab.color"
          :unit="tab.unit"
        />
      </DashboardCard>

      <div class="space-y-6">
        <DashboardCard
          title="Pipeline"
          description="Entreprises par statut"
        >
          <DonutChart
            :segments="segments"
            center-label="entreprises"
          />
        </DashboardCard>

        <DashboardCard
          title="Avancement"
          description="Où en est la base"
        >
          <ul class="space-y-4">
            <li
              v-for="item in progress"
              :key="item.label"
              class="space-y-1.5"
            >
              <div class="flex items-baseline justify-between text-sm">
                <span class="text-default">{{ item.label }}</span>
                <span class="text-muted tabular-nums">{{ item.count }} / {{ stats.progress.total }} · {{ percent(item.count, stats.progress.total) }} %</span>
              </div>
              <UProgress
                :model-value="item.count"
                :max="Math.max(stats.progress.total, 1)"
                size="sm"
              />
            </li>
          </ul>
          <p
            v-if="stats.progress.typed < stats.progress.total"
            class="mt-3 text-xs text-muted"
          >
            Indiquez le type d'une entreprise (ESN, agence web…) depuis sa fiche : il compte dans son score.
          </p>
        </DashboardCard>
      </div>
    </div>

    <div class="grid gap-6 xl:grid-cols-3">
      <DashboardCard
        title="À relancer"
        description="Relance dépassée ou action échue"
      >
        <p
          v-if="!stats.lists.due.length"
          class="text-sm text-muted"
        >
          Rien à relancer pour l'instant.
        </p>
        <ul
          v-else
          class="divide-y divide-default"
        >
          <li
            v-for="company in stats.lists.due"
            :key="company.id"
            class="flex items-center justify-between gap-3 py-2.5"
          >
            <div class="min-w-0">
              <NuxtLink
                :to="`/companies/${company.id}`"
                class="block truncate font-medium text-highlighted hover:underline"
              >
                {{ company.name }}
              </NuxtLink>
              <p class="text-xs text-muted">
                {{ company.recontactAfter ? `Relance prévue le ${formatDate(company.recontactAfter)}` : 'Action prévue échue' }}
              </p>
            </div>
            <StatusBadge :status="company.status" />
          </li>
        </ul>
        <template #footer>
          <NuxtLink
            to="/companies?due=1"
            class="text-primary hover:underline"
          >
            Tout voir →
          </NuxtLink>
        </template>
      </DashboardCard>

      <DashboardCard
        title="À contacter en priorité"
        description="Les mieux classées jamais contactées"
      >
        <p
          v-if="!stats.lists.priorities.length"
          class="text-sm text-muted"
        >
          Aucune entreprise à contacter.
        </p>
        <ul
          v-else
          class="divide-y divide-default"
        >
          <li
            v-for="company in stats.lists.priorities"
            :key="company.id"
            class="flex items-center justify-between gap-3 py-2.5"
          >
            <div class="min-w-0">
              <NuxtLink
                :to="`/companies/${company.id}`"
                class="block truncate font-medium text-highlighted hover:underline"
              >
                {{ company.name }}
              </NuxtLink>
              <p class="text-xs text-muted">
                {{ [company.city, company.headcountRange ? `${company.headcountRange} salariés` : null].filter(Boolean).join(' · ') || '—' }}
              </p>
            </div>
            <ScoreBadge :score="company.score" />
          </li>
        </ul>
        <template #footer>
          <NuxtLink
            to="/companies?status=TO_CONTACT"
            class="text-primary hover:underline"
          >
            Tout voir →
          </NuxtLink>
        </template>
      </DashboardCard>

      <DashboardCard
        title="Dernières offres"
        description="Détectées dans les alertes"
      >
        <p
          v-if="!stats.lists.recentSignals.length"
          class="text-sm text-muted"
        >
          Aucune offre détectée.
        </p>
        <ul
          v-else
          class="divide-y divide-default"
        >
          <li
            v-for="signal in stats.lists.recentSignals"
            :key="signal.id"
            class="flex items-center justify-between gap-3 py-2.5"
          >
            <div class="min-w-0">
              <a
                v-if="signal.url"
                :href="signal.url"
                target="_blank"
                rel="noopener"
                class="block truncate font-medium text-highlighted hover:underline"
              >{{ signal.title }}</a>
              <span
                v-else
                class="block truncate font-medium text-highlighted"
              >{{ signal.title }}</span>
              <p class="text-xs text-muted">
                {{ signal.source }} · {{ formatDate(signal.detectedAt) }}
              </p>
            </div>
            <NuxtLink
              v-if="signal.companyId"
              :to="`/companies/${signal.companyId}`"
              class="shrink-0 text-xs text-primary hover:underline"
            >
              {{ signal.companyName }}
            </NuxtLink>
            <UBadge
              v-else
              color="warning"
              variant="subtle"
            >
              À rattacher
            </UBadge>
          </li>
        </ul>
        <template #footer>
          <NuxtLink
            to="/signals"
            class="text-primary hover:underline"
          >
            Tout voir →
          </NuxtLink>
        </template>
      </DashboardCard>
    </div>
  </div>
  <p
    v-else-if="error"
    class="text-sm text-error"
  >
    Impossible de charger les statistiques.
  </p>
</template>
