<script setup lang="ts">
import type { CompanyType, Scope } from '~/types/api'

const open = defineModel<boolean>('open', { default: false })

const api = useApi()
const toast = useToast()

const initial = () => ({
  name: '',
  city: '',
  website: '',
  type: 'UNKNOWN' as CompanyType,
  scope: 'LOCAL' as Scope,
})

const form = reactive(initial())
const saving = ref(false)

async function submit() {
  const name = form.name.trim()
  if (!name) {
    toast.add({ title: 'Le nom de l\'entreprise est obligatoire.', color: 'error' })
    return
  }

  saving.value = true
  try {
    const created = await api<{ id: number }>('/api/companies', {
      method: 'POST',
      body: {
        name,
        type: form.type,
        scope: form.scope,
        city: form.city.trim() || undefined,
        website: form.website.trim() || undefined,
      },
    })
    toast.add({ title: 'Entreprise créée', color: 'success' })
    Object.assign(form, initial())
    open.value = false
    await navigateTo(`/companies/${created.id}`)
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
  <UModal
    v-model:open="open"
    title="Nouvelle entreprise"
    description="Ajouter une entreprise à suivre."
  >
    <template #body>
      <form
        id="create-company"
        class="space-y-4"
        @submit.prevent="submit"
      >
        <UFormField
          label="Nom"
          required
        >
          <UInput
            v-model="form.name"
            autofocus
            class="w-full"
          />
        </UFormField>
        <div class="grid gap-4 sm:grid-cols-2">
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
          <UFormField label="Ville">
            <UInput
              v-model="form.city"
              class="w-full"
            />
          </UFormField>
          <UFormField label="Site web">
            <UInput
              v-model="form.website"
              placeholder="https://…"
              class="w-full"
            />
          </UFormField>
        </div>
      </form>
    </template>
    <template #footer>
      <div class="flex w-full justify-end gap-2">
        <UButton
          label="Annuler"
          color="neutral"
          variant="outline"
          @click="open = false"
        />
        <UButton
          type="submit"
          form="create-company"
          label="Créer"
          :loading="saving"
        />
      </div>
    </template>
  </UModal>
</template>
