import { beforeEach, describe, expect, it, vi } from 'vitest'
import { mockNuxtImport, mountSuspended } from '@nuxt/test-utils/runtime'
import type { VueWrapper } from '@vue/test-utils'
import ContactMove from '~/components/ContactMove.vue'

const { api } = vi.hoisted(() => ({ api: vi.fn() }))
mockNuxtImport('useApi', () => () => api)

const results = {
  items: [{ id: 3, name: 'Jane Doe', city: null }, { id: 7, name: 'Acme', city: 'Besançon' }],
  total: 2,
  page: 1,
  perPage: 5,
}

const props = { contactId: 4, currentCompanyId: 3 }
const buttons = (wrapper: VueWrapper) => wrapper.findAll('button').map(button => button.text())

beforeEach(() => {
  api.mockReset()
  api.mockImplementation(async (url: string, options?: { method?: string }) => {
    if (url === '/api/companies' && !options?.method) return results
    return {}
  })
})

describe('ContactMove', () => {
  it('masque l\'entreprise actuelle dans les résultats', async () => {
    const wrapper = await mountSuspended(ContactMove, { props })

    await wrapper.find('input').setValue('ac')
    await vi.waitFor(() => expect(buttons(wrapper)).toContain('Acme (Besançon)'))
    expect(buttons(wrapper)).not.toContain('Jane Doe')
  })

  it('rattache le contact à l\'entreprise choisie', async () => {
    const wrapper = await mountSuspended(ContactMove, { props })

    await wrapper.find('input').setValue('ac')
    await vi.waitFor(() => expect(buttons(wrapper)).toContain('Acme (Besançon)'))
    await wrapper.findAll('button').find(b => b.text() === 'Acme (Besançon)')!.trigger('click')

    await vi.waitFor(() => expect(api).toHaveBeenCalledWith('/api/contacts/4/move', { method: 'POST', body: { companyId: 7 } }))
    await vi.waitFor(() => expect(wrapper.emitted('moved')).toEqual([[7]]))
  })

  it('crée l\'entreprise puis rattache le contact', async () => {
    api.mockImplementation(async (url: string, options?: { method?: string }) => {
      if (url === '/api/companies' && options?.method === 'POST') return { id: 9 }
      if (url === '/api/companies') return { items: [], total: 0, page: 1, perPage: 5 }
      return {}
    })
    const wrapper = await mountSuspended(ContactMove, { props })

    await wrapper.find('input').setValue('Acme Studio')
    await vi.waitFor(() => expect(buttons(wrapper)).toContain('Créer « Acme Studio »'))
    await wrapper.findAll('button').find(b => b.text().startsWith('Créer'))!.trigger('click')

    await vi.waitFor(() => expect(api).toHaveBeenCalledWith('/api/contacts/4/move', { method: 'POST', body: { companyId: 9 } }))
  })
})
