<script setup lang="ts">
import type { CompanyDetail, CompanyType, CompanyUpdatePayload, Scope } from '~/types/api'

const props = defineProps<{ company: CompanyDetail }>()
const emit = defineEmits<{ saved: [], cancel: [] }>()

const api = useApi()
const toast = useToast()

type TextField = 'name' | 'website' | 'address' | 'postalCode' | 'city' | 'phone' | 'email' | 'siren' | 'nafCode' | 'headcountRange'

const fields: { key: TextField, label: string, placeholder?: string, full?: boolean }[] = [
  { key: 'name', label: 'Nom', full: true },
  { key: 'website', label: 'Site web', placeholder: 'https://…' },
  { key: 'email', label: 'Email' },
  { key: 'phone', label: 'Téléphone', placeholder: '03 81 00 00 00' },
  { key: 'address', label: 'Adresse' },
  { key: 'postalCode', label: 'Code postal' },
  { key: 'city', label: 'Ville' },
  { key: 'siren', label: 'SIREN', placeholder: '9 chiffres' },
  { key: 'nafCode', label: 'Code NAF', placeholder: '62.01Z' },
  { key: 'headcountRange', label: 'Effectif', placeholder: '10-19' },
]

const form = reactive({
  type: props.company.type as CompanyType,
  scope: props.company.scope as Scope,
  ...Object.fromEntries(fields.map(f => [f.key, props.company[f.key] ?? ''])) as Record<TextField, string>,
})
const saving = ref(false)

async function submit() {
  const payload: CompanyUpdatePayload = {}
  for (const { key } of fields) {
    const value = form[key].trim()
    if (value !== (props.company[key] ?? '')) payload[key] = (value || null) as never
  }
  if (form.type !== props.company.type) payload.type = form.type
  if (form.scope !== props.company.scope) payload.scope = form.scope

  if (!Object.keys(payload).length) {
    emit('cancel')
    return
  }

  saving.value = true
  try {
    await api(`/api/companies/${props.company.id}`, { method: 'PATCH', body: payload })
    toast.add({ title: 'Informations enregistrées', color: 'success' })
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
    class="grid gap-4 sm:grid-cols-2"
    @submit.prevent="submit"
  >
    <UFormField
      v-for="field in fields"
      :key="field.key"
      :label="field.label"
      :class="{ 'sm:col-span-2': field.full }"
    >
      <UInput
        v-model="form[field.key]"
        :placeholder="field.placeholder"
        class="w-full"
      />
    </UFormField>
    <UFormField label="Type">
      <USelect
        v-model="form.type"
        :items="toItems(typeLabels)"
        class="w-full"
      />
    </UFormField>
    <UFormField label="Zone">
      <USelect
        v-model="form.scope"
        :items="toItems(scopeLabels)"
        class="w-full"
      />
    </UFormField>
    <div class="flex gap-2 sm:col-span-2">
      <UButton
        type="submit"
        label="Enregistrer"
        :loading="saving"
      />
      <UButton
        label="Annuler"
        color="neutral"
        variant="outline"
        @click="emit('cancel')"
      />
    </div>
  </form>
</template>
