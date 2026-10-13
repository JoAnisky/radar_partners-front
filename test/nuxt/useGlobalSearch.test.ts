import { nextTick } from 'vue'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { mockNuxtImport } from '@nuxt/test-utils/runtime'

const { api } = vi.hoisted(() => ({ api: vi.fn() }))
mockNuxtImport('useApi', () => () => api)

const company = { id: 7, name: 'Acme Studio', city: 'Besançon' }
const contact = { id: 3, fullName: 'Jane Doe', company: { id: 7, name: 'Acme Studio' } }

function respondWith(companies: unknown[], contacts: unknown[]) {
  api.mockImplementation(async (url: string) => ({ items: url === '/api/companies' ? companies : contacts, total: 1 }))
}

const group = (groups: ReturnType<typeof useGlobalSearch>['groups'], id: string) => groups.value.find(g => g.id === id)!

beforeEach(() => {
  api.mockReset()
  respondWith([company], [contact])
})

describe('useGlobalSearch', () => {
  it('propose les pages sans recherche', () => {
    const { groups } = useGlobalSearch()

    expect(group(groups, 'pages').items.map(item => item.to)).toEqual(['/', '/contacts', '/signals'])
    expect(group(groups, 'companies').items).toEqual([])
    expect(group(groups, 'contacts').items).toEqual([])
  })

  it('n\'appelle pas l\'API sous 2 caractères', async () => {
    const { searchTerm, loading } = useGlobalSearch()

    searchTerm.value = 'a'
    await new Promise(resolve => setTimeout(resolve, 350))

    expect(api).not.toHaveBeenCalled()
    expect(loading.value).toBe(false)
  })

  it('cherche entreprises et contacts et construit les liens vers les fiches', async () => {
    const { searchTerm, groups, loading } = useGlobalSearch()

    searchTerm.value = '  ac '
    await nextTick()
    expect(loading.value).toBe(true)
    await vi.waitFor(() => expect(group(groups, 'companies').items).toHaveLength(1))

    expect(api).toHaveBeenCalledWith('/api/companies', { query: { q: 'ac', perPage: 5, sort: 'score', direction: 'desc' } })
    expect(api).toHaveBeenCalledWith('/api/contacts', { query: { q: 'ac', perPage: 5 } })
    expect(group(groups, 'companies').items[0]).toMatchObject({ label: 'Acme Studio', suffix: 'Besançon', to: '/companies/7' })
    expect(group(groups, 'contacts').items[0]).toMatchObject({ label: 'Jane Doe', suffix: 'Acme Studio', to: '/companies/7' })
    expect(group(groups, 'companies').ignoreFilter).toBe(true)
    expect(loading.value).toBe(false)
  })

  it('ignore une réponse périmée arrivée après une recherche plus récente', async () => {
    let releaseSlow!: () => void
    const slow = new Promise<void>((resolve) => {
      releaseSlow = resolve
    })
    api.mockImplementation(async (url: string, options: { query: { q: string } }) => {
      if (options.query.q === 'old') await slow
      const name = options.query.q === 'old' ? 'Ancienne' : 'Récente'
      return { items: url === '/api/companies' ? [{ id: 1, name, city: null }] : [], total: 1 }
    })
    const { searchTerm, groups } = useGlobalSearch()

    searchTerm.value = 'old'
    await vi.waitFor(() => expect(api).toHaveBeenCalledTimes(2))
    searchTerm.value = 'new'
    await vi.waitFor(() => expect(group(groups, 'companies').items.map(i => i.label)).toEqual(['Récente']))
    releaseSlow()
    await new Promise(resolve => setTimeout(resolve, 30))

    expect(group(groups, 'companies').items.map(i => i.label)).toEqual(['Récente'])
  })

  it('vide les résultats quand la recherche est effacée ou échoue', async () => {
    const { searchTerm, groups, loading } = useGlobalSearch()
    searchTerm.value = 'acme'
    await vi.waitFor(() => expect(group(groups, 'companies').items).toHaveLength(1))

    searchTerm.value = ''
    await nextTick()
    expect(group(groups, 'companies').items).toEqual([])

    api.mockRejectedValue(new Error('réseau'))
    searchTerm.value = 'beta'
    await vi.waitFor(() => expect(loading.value).toBe(false))
    expect(group(groups, 'companies').items).toEqual([])
  })
})
