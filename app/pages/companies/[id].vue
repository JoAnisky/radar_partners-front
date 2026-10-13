<script setup lang="ts">
import type { CompanyDetail, PipelineStatus } from '~/types/api'

const api = useApi()
const toast = useToast()
const route = useRoute()
const id = Number(route.params.id)

const { data: company, refresh } = await useAsyncData(
  `company-${id}`,
  () => api<CompanyDetail>(`/api/companies/${id}`),
)

const notes = ref('')
watch(company, (value) => { notes.value = value?.notes ?? '' }, { immediate: true })

async function patch(payload: Record<string, unknown>, message: string) {
  try {
    await api(`/api/companies/${id}`, { method: 'PATCH', body: payload })
    toast.add({ title: message, color: 'success' })
    await refresh()
  }
  catch (error) {
    toast.add({ title: errorMessage(error), color: 'error' })
  }
}

const editingId = ref<number | null>(null)

async function onEdited() {
  editingId.value = null
  await refresh()
}

const contactName = (contactId: number | null) =>
  company.value?.contacts.find(c => c.id === contactId)?.fullName
</script>

<template>
  <div v-if="company" class="space-y-6">
    <div class="flex flex-wrap items-start justify-between gap-4">
      <div>
        <NuxtLink to="/" class="text-sm text-muted hover:underline">← Entreprises</NuxtLink>
        <h1 class="text-2xl font-semibold">
          {{ company.name }}
          <UBadge v-if="company.archived" color="neutral" variant="outline">Archivée</UBadge>
        </h1>
        <p class="text-sm text-muted">
          {{ typeLabels[company.type] }} · {{ scopeLabels[company.scope] }}
          <template v-if="company.siren"> · SIREN {{ company.siren }}</template>
          <template v-if="company.nafCode"> · NAF {{ company.nafCode }}</template>
        </p>
      </div>
      <div class="flex items-center gap-3">
        <USelect
          :model-value="company.status"
          :items="toItems(statusLabels)"
          class="w-48"
          @update:model-value="(value: PipelineStatus) => patch({ status: value }, 'Statut mis à jour')"
        />
        <UButton
          :label="company.archived ? 'Restaurer' : 'Archiver'"
          color="neutral"
          variant="outline"
          @click="patch({ archived: !company.archived }, company.archived ? 'Entreprise restaurée' : 'Entreprise archivée')"
        />
      </div>
    </div>

    <div class="grid gap-6 lg:grid-cols-3">
      <UCard class="lg:col-span-2">
        <template #header>
          <h2 class="font-medium">Informations</h2>
        </template>
        <dl class="grid gap-x-6 gap-y-2 text-sm sm:grid-cols-2">
          <div><dt class="text-muted">Adresse</dt><dd>{{ [company.address, company.postalCode, company.city].filter(Boolean).join(', ') || '—' }}</dd></div>
          <div><dt class="text-muted">Effectif</dt><dd>{{ company.headcountRange ?? '—' }}</dd></div>
          <div><dt class="text-muted">Téléphone</dt><dd>{{ company.phone ?? '—' }}</dd></div>
          <div><dt class="text-muted">Email</dt><dd>{{ company.email ?? '—' }}</dd></div>
          <div>
            <dt class="text-muted">Site</dt>
            <dd>
              <a v-if="company.website" :href="company.website" target="_blank" rel="noopener" class="text-primary hover:underline">{{ company.website }}</a>
              <template v-else>—</template>
            </dd>
          </div>
          <div><dt class="text-muted">Relance</dt><dd>{{ formatDate(company.recontactAfter) }}</dd></div>
          <div v-if="company.flags.length" class="sm:col-span-2">
            <dt class="text-muted">Alertes</dt>
            <dd class="flex flex-wrap gap-2">
              <UBadge v-for="flag in company.flags" :key="flag" color="warning" variant="subtle">{{ flag }}</UBadge>
            </dd>
          </div>
        </dl>
      </UCard>

      <UCard>
        <template #header>
          <h2 class="font-medium">Contacts</h2>
        </template>
        <p v-if="!company.contacts.length" class="text-sm text-muted">Aucun contact.</p>
        <ul class="space-y-3 text-sm">
          <li v-for="contact in company.contacts" :key="contact.id">
            <p class="font-medium">{{ contact.fullName }}<span v-if="contact.role" class="text-muted"> · {{ contact.role }}</span></p>
            <p v-if="contact.phone">{{ contact.phone }}</p>
            <p v-if="contact.email">{{ contact.email }}</p>
          </li>
        </ul>
      </UCard>
    </div>

    <UCard>
      <template #header>
        <h2 class="font-medium">Notes</h2>
      </template>
      <UTextarea v-model="notes" :rows="3" class="w-full" />
      <div class="mt-3">
        <UButton
          label="Enregistrer les notes"
          :disabled="notes === (company.notes ?? '')"
          @click="patch({ notes: notes.trim() || null }, 'Notes enregistrées')"
        />
      </div>
    </UCard>

    <UCard>
      <template #header>
        <h2 class="font-medium">Nouvelle interaction</h2>
      </template>
      <InteractionForm :company-id="company.id" :contacts="company.contacts" @saved="refresh" />
    </UCard>

    <UCard>
      <template #header>
        <h2 class="font-medium">Historique ({{ company.interactions.length }})</h2>
      </template>
      <p v-if="!company.interactions.length" class="text-sm text-muted">Aucune interaction.</p>
      <ul class="space-y-4">
        <li v-for="interaction in company.interactions" :key="interaction.id" class="text-sm">
          <InteractionForm
            v-if="editingId === interaction.id"
            :company-id="company.id"
            :contacts="company.contacts"
            :interaction="interaction"
            @saved="onEdited"
            @cancel="editingId = null"
          />
          <template v-else>
            <div class="flex items-start justify-between gap-3">
              <p class="font-medium">
                {{ formatDate(interaction.occurredAt) }} · {{ channelLabels[interaction.channel] }}
                <UBadge color="neutral" variant="subtle">{{ outcomeLabels[interaction.outcome] }}</UBadge>
              </p>
              <UButton label="Modifier" color="neutral" variant="ghost" size="xs" @click="editingId = interaction.id" />
            </div>
            <p v-if="contactName(interaction.contactId)" class="text-muted">avec {{ contactName(interaction.contactId) }}</p>
            <p v-if="interaction.origin" class="text-muted">Origine : {{ interaction.origin }}</p>
            <p v-if="interaction.notes" class="whitespace-pre-line">{{ interaction.notes }}</p>
            <p v-if="interaction.nextActionAt" class="text-muted">Prochaine action : {{ formatDate(interaction.nextActionAt) }}</p>
          </template>
        </li>
      </ul>
    </UCard>

    <UCard v-if="company.signals.length">
      <template #header>
        <h2 class="font-medium">Signaux ({{ company.signals.length }})</h2>
      </template>
      <ul class="space-y-3 text-sm">
        <li v-for="signal in company.signals" :key="signal.id">
          <a v-if="signal.url" :href="signal.url" target="_blank" rel="noopener" class="font-medium text-primary hover:underline">{{ signal.title }}</a>
          <p v-else class="font-medium">{{ signal.title }}</p>
          <p class="text-muted">{{ signalTypeLabels[signal.type] }} · {{ signal.source }} · détecté le {{ formatDate(signal.detectedAt) }}</p>
        </li>
      </ul>
    </UCard>
  </div>
  <p v-else class="text-muted">Entreprise introuvable.</p>
</template>
