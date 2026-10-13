<script setup lang="ts">
import type { Channel, Contact, InteractionPayload, Outcome } from '~/types/api'

const props = defineProps<{ companyId: number, contacts: Contact[] }>()
const emit = defineEmits<{ saved: [] }>()

const api = useApi()
const toast = useToast()

const today = () => new Date().toISOString().slice(0, 10)
const initial = () => ({
  channel: 'PHONE' as Channel,
  occurredAt: today(),
  outcome: 'OTHER' as Outcome,
  contactId: 'NONE' as number | 'NONE',
  origin: '',
  notes: '',
  nextActionAt: '',
})

const form = reactive(initial())
const saving = ref(false)

const contactItems = computed(() => [
  { value: 'NONE', label: 'Aucun contact précis' },
  ...props.contacts.map(c => ({ value: c.id, label: c.fullName })),
])

async function submit() {
  saving.value = true
  const payload: InteractionPayload = {
    channel: form.channel,
    occurredAt: form.occurredAt || undefined,
    outcome: form.outcome,
    contactId: form.contactId === 'NONE' ? undefined : form.contactId,
    origin: form.origin.trim() || undefined,
    notes: form.notes.trim() || undefined,
    nextActionAt: form.nextActionAt || undefined,
  }

  try {
    await api(`/api/companies/${props.companyId}/interactions`, { method: 'POST', body: payload })
    Object.assign(form, initial())
    toast.add({ title: 'Interaction enregistrée', color: 'success' })
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
  <form class="grid gap-4 md:grid-cols-2" @submit.prevent="submit">
    <UFormField label="Canal">
      <USelect v-model="form.channel" :items="toItems(channelLabels)" class="w-full" />
    </UFormField>
    <UFormField label="Date">
      <UInput v-model="form.occurredAt" type="date" class="w-full" />
    </UFormField>
    <UFormField label="Résultat">
      <USelect v-model="form.outcome" :items="toItems(outcomeLabels)" class="w-full" />
    </UFormField>
    <UFormField label="Contact">
      <USelect v-model="form.contactId" :items="contactItems" class="w-full" />
    </UFormField>
    <UFormField label="Origine">
      <UInput v-model="form.origin" placeholder="Événement, recommandation…" class="w-full" />
    </UFormField>
    <UFormField label="Prochaine action">
      <UInput v-model="form.nextActionAt" type="date" class="w-full" />
    </UFormField>
    <UFormField label="Notes" class="md:col-span-2">
      <UTextarea v-model="form.notes" :rows="3" class="w-full" />
    </UFormField>
    <div class="md:col-span-2">
      <UButton type="submit" label="Enregistrer l'interaction" :loading="saving" />
    </div>
  </form>
</template>
