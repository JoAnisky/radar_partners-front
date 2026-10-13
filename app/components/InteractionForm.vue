<script setup lang="ts">
import type { Channel, Contact, Interaction, InteractionPayload, InteractionUpdatePayload, Outcome } from '~/types/api'

const props = defineProps<{ companyId: number, contacts: Contact[], interaction?: Interaction }>()
const emit = defineEmits<{ saved: [], cancel: [] }>()

const api = useApi()
const toast = useToast()

interface FormState {
  channel: Channel
  occurredAt: string
  outcome: Outcome
  contactId: number | 'NONE'
  origin: string
  notes: string
  nextActionAt: string
}

const dateOnly = (iso: string | null | undefined) => iso?.slice(0, 10) ?? ''

function initial(): FormState {
  const source = props.interaction
  return {
    channel: source?.channel ?? 'PHONE',
    occurredAt: source ? dateOnly(source.occurredAt) : new Date().toISOString().slice(0, 10),
    outcome: source?.outcome ?? 'OTHER',
    contactId: source?.contactId ?? 'NONE',
    origin: source?.origin ?? '',
    notes: source?.notes ?? '',
    nextActionAt: dateOnly(source?.nextActionAt),
  }
}

const form = reactive(initial())
const saving = ref(false)
const editing = computed(() => props.interaction !== undefined)

const contactItems = computed(() => [
  { value: 'NONE', label: 'Aucun contact précis' },
  ...props.contacts.map(c => ({ value: c.id, label: c.fullName })),
])

async function create() {
  const payload: InteractionPayload = {
    channel: form.channel,
    occurredAt: form.occurredAt || undefined,
    outcome: form.outcome,
    contactId: form.contactId === 'NONE' ? undefined : form.contactId,
    origin: form.origin.trim() || undefined,
    notes: form.notes.trim() || undefined,
    nextActionAt: form.nextActionAt || undefined,
  }
  await api(`/api/companies/${props.companyId}/interactions`, { method: 'POST', body: payload })
  Object.assign(form, initial())
}

async function update(interaction: Interaction) {
  // Les dates inchangées ne sont pas renvoyées : l'heure éventuelle d'origine est conservée.
  const payload: InteractionUpdatePayload = {
    channel: form.channel,
    outcome: form.outcome,
    contactId: form.contactId === 'NONE' ? null : form.contactId,
    origin: form.origin.trim() || null,
    notes: form.notes.trim() || null,
  }
  if (form.occurredAt && form.occurredAt !== dateOnly(interaction.occurredAt)) {
    payload.occurredAt = form.occurredAt
  }
  if (form.nextActionAt !== dateOnly(interaction.nextActionAt)) {
    payload.nextActionAt = form.nextActionAt || null
  }
  await api(`/api/interactions/${interaction.id}`, { method: 'PATCH', body: payload })
}

async function submit() {
  saving.value = true
  try {
    if (props.interaction) await update(props.interaction)
    else await create()
    toast.add({ title: editing.value ? 'Interaction modifiée' : 'Interaction enregistrée', color: 'success' })
    emit('saved')
  }
  catch (error) {
    toast.add({ title: errorMessage(error), color: 'error' })
  }
  finally {
    saving.value = false
  }
}
</script>

<template>
  <form
    class="grid gap-4 md:grid-cols-2"
    @submit.prevent="submit"
  >
    <UFormField label="Canal">
      <USelect
        v-model="form.channel"
        :items="toItems(channelLabels)"
        class="w-full"
      />
    </UFormField>
    <UFormField label="Date">
      <UInput
        v-model="form.occurredAt"
        type="date"
        class="w-full"
      />
    </UFormField>
    <UFormField label="Résultat">
      <USelect
        v-model="form.outcome"
        :items="toItems(outcomeLabels)"
        class="w-full"
      />
    </UFormField>
    <UFormField label="Contact">
      <USelect
        v-model="form.contactId"
        :items="contactItems"
        class="w-full"
      />
    </UFormField>
    <UFormField label="Origine">
      <UInput
        v-model="form.origin"
        placeholder="Événement, recommandation…"
        class="w-full"
      />
    </UFormField>
    <UFormField label="Prochaine action">
      <UInput
        v-model="form.nextActionAt"
        type="date"
        class="w-full"
      />
    </UFormField>
    <UFormField
      label="Notes"
      class="md:col-span-2"
    >
      <UTextarea
        v-model="form.notes"
        :rows="3"
        class="w-full"
      />
    </UFormField>
    <div class="flex gap-2 md:col-span-2">
      <UButton
        type="submit"
        :label="editing ? 'Enregistrer les modifications' : 'Enregistrer l\'interaction'"
        :loading="saving"
      />
      <UButton
        v-if="editing"
        label="Annuler"
        color="neutral"
        variant="outline"
        @click="emit('cancel')"
      />
    </div>
  </form>
</template>
