<script setup lang="ts">
import type { CompanySummary, Page } from '~/types/api'

const props = defineProps<{ contactId: number, currentCompanyId: number }>()
const emit = defineEmits<{ moved: [companyId: number], cancel: [] }>()

const api = useApi()
const toast = useToast()

const term = ref('')
const results = ref<CompanySummary[]>([])
const busy = ref(false)

let timer: ReturnType<typeof setTimeout> | undefined
watch(term, (value) => {
  clearTimeout(timer)
  const text = value.trim()
  if (text.length < 2) {
    results.value = []
    return
  }
  timer = setTimeout(async () => {
    const page = await api<Page<CompanySummary>>('/api/companies', { query: { q: text, perPage: 5 } })
    results.value = page.items.filter(c => c.id !== props.currentCompanyId)
  }, 300)
})

async function move(companyId: number) {
  await api(`/api/contacts/${props.contactId}/move`, { method: 'POST', body: { companyId } })
  toast.add({ title: 'Contact rattaché', color: 'success' })
  emit('moved', companyId)
}

async function run(action: () => Promise<void>) {
  busy.value = true
  try {
    await action()
  }
  catch (error) {
    toast.add({ title: errorMessage(error), color: 'error' })
  }
  finally {
    busy.value = false
  }
}

const create = () => run(async () => {
  try {
    const created = await api<CompanySummary>('/api/companies', { method: 'POST', body: { name: term.value.trim() } })
    await move(created.id)
  }
  catch (error) {
    const existing = (error as { data?: { id?: number } }).data?.id
    if (!existing) throw error
    toast.add({ title: 'Cette entreprise existe déjà : sélectionnez-la dans la liste.', color: 'warning' })
  }
})
</script>

<template>
  <div class="mt-2 space-y-2 rounded-md border border-default p-3">
    <UInput
      v-model="term"
      placeholder="Entreprise à rattacher…"
      class="w-full max-w-md"
    />
    <div class="flex flex-wrap gap-2">
      <UButton
        v-for="company in results"
        :key="company.id"
        :label="`${company.name}${company.city ? ` (${company.city})` : ''}`"
        color="neutral"
        variant="outline"
        size="sm"
        :disabled="busy"
        @click="run(() => move(company.id))"
      />
      <UButton
        v-if="term.trim().length >= 2"
        :label="`Créer « ${term.trim()} »`"
        size="sm"
        :loading="busy"
        @click="create"
      />
      <UButton
        label="Annuler"
        color="neutral"
        variant="ghost"
        size="sm"
        @click="emit('cancel')"
      />
    </div>
  </div>
</template>
