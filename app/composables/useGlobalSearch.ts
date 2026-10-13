import type { CompanySummary, ContactListItem, Page } from '~/types/api'

const pages = [
  { label: 'Accueil', icon: 'i-lucide-layout-dashboard', to: '/' },
  { label: 'Entreprises', icon: 'i-lucide-building-2', to: '/companies' },
  { label: 'Contacts', icon: 'i-lucide-users', to: '/contacts' },
  { label: 'Signaux', icon: 'i-lucide-radio-tower', to: '/signals' },
]

const MIN_LENGTH = 2
const DELAY = 250

/** Palette ⌘K : pages (filtrées localement) puis entreprises et contacts cherchés côté serveur. */
export function useGlobalSearch() {
  const api = useApi()
  const searchTerm = ref('')
  const loading = ref(false)
  const companies = ref<CompanySummary[]>([])
  const contacts = ref<ContactListItem[]>([])

  let timer: ReturnType<typeof setTimeout> | undefined
  let latest = 0

  watch(searchTerm, (value) => {
    clearTimeout(timer)
    const term = value.trim()
    const request = ++latest

    if (term.length < MIN_LENGTH) {
      companies.value = []
      contacts.value = []
      loading.value = false
      return
    }

    loading.value = true
    timer = setTimeout(async () => {
      try {
        const [foundCompanies, foundContacts] = await Promise.all([
          api<Page<CompanySummary>>('/api/companies', { query: { q: term, perPage: 5, sort: 'score', direction: 'desc' } }),
          api<Page<ContactListItem>>('/api/contacts', { query: { q: term, perPage: 5 } }),
        ])
        if (request !== latest) return
        companies.value = foundCompanies.items
        contacts.value = foundContacts.items
      }
      catch {
        if (request === latest) {
          companies.value = []
          contacts.value = []
        }
      }
      finally {
        if (request === latest) loading.value = false
      }
    }, DELAY)
  })

  const groups = computed(() => [
    { id: 'pages', label: 'Pages', items: pages },
    {
      id: 'companies',
      label: 'Entreprises',
      ignoreFilter: true,
      items: companies.value.map(company => ({
        label: company.name,
        suffix: company.city ?? undefined,
        icon: 'i-lucide-building-2',
        to: `/companies/${company.id}`,
      })),
    },
    {
      id: 'contacts',
      label: 'Contacts',
      ignoreFilter: true,
      items: contacts.value.map(contact => ({
        label: contact.fullName,
        suffix: contact.company.name,
        icon: 'i-lucide-user',
        to: `/companies/${contact.company.id}`,
      })),
    },
  ])

  return { searchTerm, loading, groups }
}
