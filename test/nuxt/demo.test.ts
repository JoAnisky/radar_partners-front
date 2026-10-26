import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { mockNuxtImport, mountSuspended, registerEndpoint } from '@nuxt/test-utils/runtime'
import { clearNuxtData, clearNuxtState } from '#imports'
import DefaultLayout from '~/layouts/default.vue'
import CompanyPage from '~/pages/companies/[id].vue'
import SignalsPage from '~/pages/signals.vue'
import ChatBubble from '~/components/ChatBubble.vue'
import type { CompanyDetail, Signal } from '~/types/api'

mockNuxtImport('useApi', () => () => $fetch)
mockNuxtImport('useDemo', () => () => true)

const detail: CompanyDetail = {
  id: 7,
  name: 'Acme Studio',
  siren: null,
  website: null,
  city: 'Besançon',
  postalCode: '25000',
  phone: null,
  nafCode: null,
  headcountRange: null,
  type: 'WEB_AGENCY',
  scope: 'LOCAL',
  status: 'CONTACTED',
  score: 55,
  flags: [],
  recontactAfter: null,
  lastInteractionAt: null,
  archived: false,
  address: null,
  email: null,
  parentId: null,
  scoreExplanation: null,
  notes: null,
  createdAt: '2026-09-01T00:00:00+02:00',
  contacts: [{ id: 3, fullName: 'Jane Doe', role: null, phone: null, email: null, linkedinUrl: null, notes: null }],
  interactions: [{ id: 9, contactId: 3, occurredAt: '2026-10-01T12:00:00+02:00', channel: 'PHONE', origin: null, outcome: 'NO_ANSWER', notes: null, nextActionAt: null }],
  signals: [],
}

const signal: Signal = {
  id: 4,
  companyId: null,
  companyName: null,
  type: 'FREELANCE_MISSION',
  source: 'free-work',
  title: 'Développeur Symfony',
  url: null,
  detectedAt: '2026-10-13T08:57:56+02:00',
  publishedAt: null,
  dismissedAt: null,
  extracted: {},
}

const mounted: { unmount: () => void }[] = []

beforeEach(() => {
  clearNuxtData()
  registerEndpoint('/api/companies/7', () => detail)
  registerEndpoint('/api/signals', () => ({ items: [signal], total: 1, page: 1, perPage: 50 }))
})

afterEach(() => {
  mounted.splice(0).forEach(wrapper => wrapper.unmount())
  document.body.innerHTML = ''
})

type Wrapper = { findAll: (selector: string) => { text: () => string, attributes: (name: string) => string | undefined }[] }

const buttons = (wrapper: Wrapper) => wrapper.findAll('button')
const isDisabled = (wrapper: Wrapper, label: string) => {
  const matching = buttons(wrapper).filter(button => button.text() === label)
  expect(matching.length, `bouton « ${label} » absent`).toBeGreaterThan(0)

  return matching.every(button => button.attributes('disabled') !== undefined)
}

describe('mode démo', () => {
  it('affiche le bandeau et grise la création d\'entreprise', async () => {
    const wrapper = await mountSuspended(DefaultLayout, { route: '/', slots: { default: '<p>Contenu</p>' } })
    mounted.push(wrapper)

    expect(wrapper.text()).toContain('Démo en lecture seule')
    expect(isDisabled(wrapper, 'Entreprise')).toBe(true)
  })

  it('grise les actions d\'écriture de la fiche entreprise', async () => {
    const wrapper = await mountSuspended(CompanyPage, { route: '/companies/7' })
    mounted.push(wrapper)
    await vi.waitFor(() => expect(wrapper.text()).toContain('Jane Doe'))

    for (const label of ['Archiver', 'Modifier', 'Ajouter', 'Supprimer', 'Enregistrer les notes'])
      expect(isDisabled(wrapper, label), label).toBe(true)
    expect(wrapper.find('fieldset').attributes('disabled')).toBeDefined()
  })

  it('grise le rattachement et l\'archivage des signaux', async () => {
    const wrapper = await mountSuspended(SignalsPage, { route: '/signals' })
    mounted.push(wrapper)
    await vi.waitFor(() => expect(wrapper.text()).toContain('Développeur Symfony'))

    expect(isDisabled(wrapper, 'Écarter')).toBe(true)
    expect(wrapper.find('fieldset').attributes('disabled')).toBeDefined()
  })

  it('propose les questions types de la démo dans l\'assistant', async () => {
    clearNuxtState(['chat-messages', 'chat-open', 'chat-busy', 'chat-draft', 'chat-company', 'chat-restored'])
    localStorage.clear()
    const wrapper = await mountSuspended(ChatBubble)
    mounted.push(wrapper)
    await wrapper.find('button[aria-label^="Ouvrir Amelio"]').trigger('click')

    expect(wrapper.text()).toContain('Version de démonstration')
    expect(wrapper.text()).toContain('Quelles entreprises contacter en priorité ?')
    expect(wrapper.text()).toContain('Rédige un message d\'approche pour Silex Digital.')
    expect(wrapper.text()).not.toContain('rien ne quitte ta machine')
  })
})
