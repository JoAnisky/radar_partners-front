<script setup lang="ts">
import type { CompanySummary, Page, Signal } from '~/types/api'

const props = defineProps<{ signal: Signal }>()
const emit = defineEmits<{ attached: [] }>()

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
    results.value = page.items
  }, 300)
})

async function attach(companyId: number) {
  await api(`/api/signals/${props.signal.id}`, { method: 'PATCH', body: { companyId } })
  toast.add({ title: 'Signal rattaché', color: 'success' })
  emit('attached')
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
    await attach(created.id)
  }
  catch (error) {
    const existing = (error as { data?: { id?: number } }).data?.id
    if (!existing) throw error
    toast.add({ title: 'Cette entreprise existe déjà : sélectionnez-la dans la liste.', color: 'warning' })
  }
})
</script>

<template>
  <div class="space-y-2">
    <UInput v-model="term" placeholder="Entreprise à rattacher…" class="w-full max-w-md" />
    <div class="flex flex-wrap gap-2">
      <UButton
        v-for="company in results"
        :key="company.id"
        :label="`${company.name}${company.city ? ` (${company.city})` : ''}`"
        color="neutral"
        variant="outline"
        size="sm"
        :disabled="busy"
        @click="run(() => attach(company.id))"
      />
      <UButton
        v-if="term.trim().length >= 2"
        :label="`Créer « ${term.trim()} »`"
        size="sm"
        :loading="busy"
        @click="create"
      />
    </div>
  </div>
</template>
