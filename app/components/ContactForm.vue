<script setup lang="ts">
import type { Contact, ContactPayload } from '~/types/api'

const props = defineProps<{ companyId: number, contact?: Contact }>()
const emit = defineEmits<{ saved: [], cancel: [] }>()

const api = useApi()
const toast = useToast()

type Field = 'fullName' | 'role' | 'phone' | 'email' | 'linkedinUrl' | 'notes'

const fields: { key: Field, label: string, placeholder?: string }[] = [
  { key: 'fullName', label: 'Nom' },
  { key: 'role', label: 'Rôle', placeholder: 'CTO, gérant…' },
  { key: 'phone', label: 'Téléphone', placeholder: '06 00 00 00 00' },
  { key: 'email', label: 'Email' },
  { key: 'linkedinUrl', label: 'LinkedIn', placeholder: 'linkedin.com/in/…' },
]

const form = reactive(Object.fromEntries(
  [...fields.map(f => f.key), 'notes' as const].map(key => [key, props.contact?.[key] ?? '']),
) as Record<Field, string>)
const saving = ref(false)
const editing = computed(() => props.contact !== undefined)

async function submit() {
  const payload: ContactPayload = {}
  for (const key of Object.keys(form) as Field[]) {
    const value = form[key].trim()
    if (value !== (props.contact?.[key] ?? '')) payload[key] = (value || null) as never
  }
  if (!form.fullName.trim()) {
    toast.add({ title: 'Le nom du contact est obligatoire.', color: 'error' })
    return
  }
  if (props.contact && !Object.keys(payload).length) {
    emit('cancel')
    return
  }

  saving.value = true
  try {
    if (props.contact) {
      await api(`/api/contacts/${props.contact.id}`, { method: 'PATCH', body: payload })
    }
    else {
      await api(`/api/companies/${props.companyId}/contacts`, { method: 'POST', body: payload })
    }
    toast.add({ title: editing.value ? 'Contact modifié' : 'Contact ajouté', color: 'success' })
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
    class="space-y-3"
    @submit.prevent="submit"
  >
    <UFormField
      v-for="field in fields"
      :key="field.key"
      :label="field.label"
      size="sm"
    >
      <UInput
        v-model="form[field.key]"
        :placeholder="field.placeholder"
        class="w-full"
      />
    </UFormField>
    <UFormField
      label="Notes"
      size="sm"
    >
      <UTextarea
        v-model="form.notes"
        :rows="2"
        class="w-full"
      />
    </UFormField>
    <div class="flex gap-2">
      <UButton
        type="submit"
        size="sm"
        :label="editing ? 'Enregistrer' : 'Ajouter'"
        :loading="saving"
      />
      <UButton
        size="sm"
        label="Annuler"
        color="neutral"
        variant="outline"
        @click="emit('cancel')"
      />
    </div>
  </form>
</template>
