import { beforeEach, describe, expect, it, vi } from 'vitest'
import { mockNuxtImport, mountSuspended } from '@nuxt/test-utils/runtime'
import type { VueWrapper } from '@vue/test-utils'
import SignalAttach from '~/components/SignalAttach.vue'
import type { Signal } from '~/types/api'

const { api } = vi.hoisted(() => ({ api: vi.fn() }))
mockNuxtImport('useApi', () => () => api)

const signal: Signal = {
  id: 4,
  companyId: null,
  companyName: null,
  type: 'FREELANCE_MISSION',
  source: 'free-work',
  title: 'Développeur Symfony',
  url: 'https://www.free-work.com/fr/tech-it/job-mission/x/y',
  detectedAt: '2026-10-13T08:57:56+02:00',
  publishedAt: null,
  extracted: {},
}

const results = {
  items: [{ id: 7, name: 'Acme', city: 'Besançon' }],
  total: 1,
  page: 1,
  perPage: 5,
}

const buttons = (wrapper: VueWrapper) => wrapper.findAll('button').map(button => button.text())

beforeEach(() => {
  api.mockReset()
  api.mockImplementation(async (url: string, options?: { method?: string }) => {
    if (url === '/api/companies' && !options?.method) return results
    return {}
  })
})

describe('SignalAttach', () => {
  it('cherche les entreprises après 2 caractères', async () => {
    const wrapper = await mountSuspended(SignalAttach, { props: { signal } })

    await wrapper.find('input').setValue('a')
    await new Promise(resolve => setTimeout(resolve, 400))
    expect(api).not.toHaveBeenCalled()

    await wrapper.find('input').setValue('ac')
    await vi.waitFor(() => expect(api).toHaveBeenCalledWith('/api/companies', { query: { q: 'ac', perPage: 5 } }))
    await vi.waitFor(() => expect(buttons(wrapper)).toContain('Acme (Besançon)'))
    expect(buttons(wrapper)).toContain('Créer « ac »')
  })

  it('rattache le signal à l\'entreprise choisie', async () => {
    const wrapper = await mountSuspended(SignalAttach, { props: { signal } })

    await wrapper.find('input').setValue('ac')
    await vi.waitFor(() => expect(buttons(wrapper)).toContain('Acme (Besançon)'))
    await wrapper.findAll('button').find(b => b.text() === 'Acme (Besançon)')!.trigger('click')

    await vi.waitFor(() => expect(api).toHaveBeenCalledWith('/api/signals/4', { method: 'PATCH', body: { companyId: 7 } }))
    await vi.waitFor(() => expect(wrapper.emitted('attached')).toHaveLength(1))
  })

  it('crée l\'entreprise puis rattache le signal', async () => {
    api.mockImplementation(async (url: string, options?: { method?: string }) => {
      if (url === '/api/companies' && options?.method === 'POST') return { id: 9 }
      if (url === '/api/companies') return { items: [], total: 0, page: 1, perPage: 5 }
      return {}
    })
    const wrapper = await mountSuspended(SignalAttach, { props: { signal } })

    await wrapper.find('input').setValue('  Acme Studio ')
    await vi.waitFor(() => expect(buttons(wrapper)).toContain('Créer « Acme Studio »'))
    await wrapper.findAll('button').find(b => b.text().startsWith('Créer'))!.trigger('click')

    await vi.waitFor(() => expect(api).toHaveBeenCalledWith('/api/companies', { method: 'POST', body: { name: 'Acme Studio' } }))
    await vi.waitFor(() => expect(api).toHaveBeenCalledWith('/api/signals/4', { method: 'PATCH', body: { companyId: 9 } }))
    await vi.waitFor(() => expect(wrapper.emitted('attached')).toHaveLength(1))
  })

  it('ne rattache rien quand l\'entreprise existe déjà', async () => {
    api.mockImplementation(async (url: string, options?: { method?: string }) => {
      if (url === '/api/companies' && options?.method === 'POST') throw { data: { error: 'Une entreprise porte déjà ce nom.', id: 5 } }
      if (url === '/api/companies') return { items: [], total: 0, page: 1, perPage: 5 }
      return {}
    })
    const wrapper = await mountSuspended(SignalAttach, { props: { signal } })

    await wrapper.find('input').setValue('Acme')
    await vi.waitFor(() => expect(buttons(wrapper)).toContain('Créer « Acme »'))
    await wrapper.findAll('button').find(b => b.text().startsWith('Créer'))!.trigger('click')
    await new Promise(resolve => setTimeout(resolve, 50))

    expect(api).not.toHaveBeenCalledWith('/api/signals/4', expect.anything())
    expect(wrapper.emitted('attached')).toBeUndefined()
  })
})
