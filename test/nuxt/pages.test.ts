import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { mockNuxtImport, mountSuspended, registerEndpoint } from '@nuxt/test-utils/runtime'
import { createError, getQuery, readBody } from 'h3'
import CompanyPage from '~/pages/companies/[id].vue'
import ContactsPage from '~/pages/contacts.vue'
import CompaniesPage from '~/pages/companies/index.vue'
import AssistantPage from '~/pages/assistant.vue'
import SignalsPage from '~/pages/signals.vue'
import type { CompanyDetail, CompanySummary, ContactListItem, Signal } from '~/types/api'

// Les pages appellent la fausse API (registerEndpoint) : pas de baseURL, contrairement au .env.
mockNuxtImport('useApi', () => () => $fetch)

const summary: CompanySummary = {
  id: 7,
  name: 'Acme Studio',
  siren: '123456789',
  website: null,
  city: 'Besançon',
  postalCode: '25000',
  phone: null,
  nafCode: '62.01Z',
  headcountRange: '10-19',
  type: 'WEB_AGENCY',
  scope: 'LOCAL',
  status: 'CONTACTED',
  score: 55,
  flags: [],
  recontactAfter: null,
  lastInteractionAt: '2026-10-01T12:00:00+02:00',
  archived: false,
}

const detail: CompanyDetail = {
  ...summary,
  address: '12 rue des Lilas',
  email: 'contact@acme.test',
  parentId: null,
  scoreExplanation: '+20 Agence web\n+15 Effectif 10-19\nTotal : 55',
  notes: 'À rappeler',
  createdAt: '2026-09-01T00:00:00+02:00',
  contacts: [{ id: 3, fullName: 'Jane Doe', role: 'CTO', phone: '+33612345678', email: 'jane@acme.test', linkedinUrl: null, notes: null }],
  interactions: [{ id: 9, contactId: 3, occurredAt: '2026-10-01T12:00:00+02:00', channel: 'PHONE', origin: 'Apéro', outcome: 'NO_ANSWER', notes: 'Message laissé', nextActionAt: null }],
  signals: [{ id: 4, companyId: 7, companyName: 'Acme Studio', type: 'FREELANCE_MISSION', source: 'free-work', title: 'Dev Symfony', url: 'https://www.free-work.com/x', detectedAt: '2026-10-13T08:57:56+02:00', publishedAt: null, dismissedAt: null, extracted: {} }],
}

const requests: Record<string, unknown>[] = []
const mounted: { unmount: () => void }[] = []

// Les pages montées restent actives : on les démonte pour qu'elles ne partagent pas leurs données entre tests.
async function mountPage(component: Parameters<typeof mountSuspended>[0], route: string) {
  const wrapper = await mountSuspended(component, { route })
  mounted.push(wrapper)

  return wrapper
}

afterEach(() => {
  mounted.splice(0).forEach(wrapper => wrapper.unmount())
})

beforeEach(() => {
  requests.length = 0
  // L'application Nuxt est partagée entre les tests : sans cela, useAsyncData réutilise les données du test précédent.
  clearNuxtData()
})

const waitForText = (wrapper: Awaited<ReturnType<typeof mountPage>>, text: string) =>
  vi.waitFor(() => expect(wrapper.text()).toContain(text))

describe('page Entreprises', () => {
  beforeEach(() => {
    registerEndpoint('/api/companies', (event) => {
      requests.push(getQuery(event))
      return { items: [summary], total: 1, page: 1, perPage: 25 }
    })
  })

  it('affiche les entreprises avec leur statut, leur score et un lien vers la fiche', async () => {
    const wrapper = await mountPage(CompaniesPage, '/companies')
    await waitForText(wrapper, 'Acme Studio')

    expect(wrapper.text()).toContain('Contactée')
    expect(wrapper.text()).toContain('55')
    expect(wrapper.text()).toContain('Besançon')
    expect(wrapper.text()).toContain('10-19')
    expect(wrapper.text()).toContain('1 entreprise(s)')
    expect(wrapper.find('a[href="/companies/7"]').exists()).toBe(true)
  })

  it('trie par score décroissant par défaut', async () => {
    const wrapper = await mountPage(CompaniesPage, '/companies')
    await waitForText(wrapper, 'Acme Studio')

    expect(requests[0]).toMatchObject({ sort: 'score', direction: 'desc', page: '1', perPage: '25' })
    expect(requests[0]).not.toHaveProperty('q')
    expect(requests[0]).not.toHaveProperty('due')
  })

  it('masque les partenaires par défaut et les réaffiche en décochant la case', async () => {
    const wrapper = await mountPage(CompaniesPage, '/companies')
    await waitForText(wrapper, 'Acme Studio')
    expect(requests[0]).toMatchObject({ hidePartners: '1' })

    await wrapper.find('button[role="checkbox"]').trigger('click')

    await vi.waitFor(() => expect(requests.at(-1)).not.toHaveProperty('hidePartners'))
  })

  it('envoie la recherche après un court délai', async () => {
    const wrapper = await mountPage(CompaniesPage, '/companies')
    await waitForText(wrapper, 'Acme Studio')

    await wrapper.find('input[placeholder^="Rechercher"]').setValue('  acme ')

    await vi.waitFor(() => expect(requests.at(-1)).toMatchObject({ q: 'acme', page: '1' }))
  })

  it('filtre les entreprises à relancer', async () => {
    const wrapper = await mountPage(CompaniesPage, '/companies')
    await waitForText(wrapper, 'Acme Studio')

    await wrapper.find('button[role="switch"]').trigger('click')

    await vi.waitFor(() => expect(requests.at(-1)).toMatchObject({ due: '1' }))
  })
})

describe('page Entreprises (filtres venant de l\'adresse)', () => {
  it('applique le statut et « à relancer » reçus dans l\'adresse', async () => {
    registerEndpoint('/api/companies', (event) => {
      requests.push(getQuery(event))
      return { items: [summary], total: 1, page: 1, perPage: 25 }
    })

    const wrapper = await mountPage(CompaniesPage, '/companies?status=MEETING&due=1')
    await waitForText(wrapper, 'Acme Studio')

    expect(requests[0]).toMatchObject({ status: 'MEETING', due: '1' })
  })

  it('ignore un statut inconnu dans l\'adresse', async () => {
    registerEndpoint('/api/companies', (event) => {
      requests.push(getQuery(event))
      return { items: [summary], total: 1, page: 1, perPage: 25 }
    })

    const wrapper = await mountPage(CompaniesPage, '/companies?status=NOPE')
    await waitForText(wrapper, 'Acme Studio')

    expect(requests[0]).not.toHaveProperty('status')
  })
})

describe('page Contacts', () => {
  it('affiche les contacts avec leur entreprise', async () => {
    const contact: ContactListItem = {
      id: 3,
      fullName: 'Jane Doe',
      role: 'CTO',
      phone: '+33612345678',
      email: 'jane@acme.test',
      linkedinUrl: null,
      notes: null,
      company: { id: 7, name: 'Acme Studio', city: 'Besançon', status: 'CONTACTED' },
      lastInteractionAt: '2026-10-01T12:00:00+02:00',
    }
    registerEndpoint('/api/contacts', (event) => {
      requests.push(getQuery(event))
      return { items: [contact], total: 1, page: 1, perPage: 25 }
    })

    const wrapper = await mountPage(ContactsPage, '/contacts')
    await waitForText(wrapper, 'Jane Doe')

    expect(wrapper.text()).toContain('CTO')
    expect(wrapper.text()).toContain('Acme Studio')
    expect(wrapper.text()).toContain('01/10/2026')
    expect(wrapper.find('a[href="mailto:jane@acme.test"]').exists()).toBe(true)
    expect(wrapper.find('a[href="/companies/7"]').exists()).toBe(true)
    expect(requests[0]).toMatchObject({ sort: 'fullName', direction: 'asc' })
  })
})

describe('page Signaux', () => {
  const signal: Signal = {
    id: 4,
    companyId: null,
    companyName: null,
    type: 'FREELANCE_MISSION',
    source: 'free-work',
    title: 'Développeur fullstack/ DevOps',
    url: 'https://www.free-work.com/fr/tech-it/job-mission/x/y',
    detectedAt: '2026-10-13T08:57:56+02:00',
    publishedAt: null,
    dismissedAt: null,
    extracted: { city: 'Ramonville-Saint-Agne', dailyRate: '400 €', durationMonths: 6 },
  }

  it('liste les offres à rattacher avec un lien vers l\'annonce', async () => {
    registerEndpoint('/api/signals', (event) => {
      requests.push(getQuery(event))
      return { items: [signal], total: 1, page: 1, perPage: 50 }
    })

    const wrapper = await mountPage(SignalsPage, '/signals')
    await waitForText(wrapper, 'Développeur fullstack/ DevOps')

    expect(wrapper.text()).toContain('Mission freelance')
    expect(wrapper.text()).toContain('Ramonville-Saint-Agne · 400 € · 6 mois')
    expect(wrapper.text()).toContain('1 offre(s) à rattacher')
    const link = wrapper.find('a[href^="https://www.free-work.com"]')
    expect(link.attributes('target')).toBe('_blank')
    expect(link.attributes('rel')).toBe('noopener')
    expect(requests[0]).toMatchObject({ unresolved: '1' })
  })

  it('écarte une offre et la restaure depuis les archivées', async () => {
    const patches: unknown[] = []
    registerEndpoint('/api/signals/4', {
      method: 'PATCH',
      handler: async (event) => {
        patches.push(await readBody(event))
        return { ...signal, dismissedAt: '2026-10-15T09:00:00+02:00' }
      },
    })
    registerEndpoint('/api/signals', (event) => {
      const dismissed = getQuery(event).dismissed === '1'
      return { items: dismissed ? [{ ...signal, dismissedAt: '2026-10-14T09:00:00+02:00' }] : [signal], total: 1, page: 1, perPage: 50 }
    })

    const wrapper = await mountPage(SignalsPage, '/signals')
    await waitForText(wrapper, 'À traiter (1)')
    expect(wrapper.text()).toContain('Archivées (1)')

    await wrapper.findAll('button').find(b => b.text() === 'Écarter')!.trigger('click')
    await vi.waitFor(() => expect(patches).toEqual([{ dismissed: true }]))

    await wrapper.findAll('[role="tab"]')[1]!.trigger('click')
    await waitForText(wrapper, 'Restaurer')
    await wrapper.findAll('button').find(b => b.text() === 'Restaurer')!.trigger('click')
    await vi.waitFor(() => expect(patches).toEqual([{ dismissed: true }, { dismissed: false }]))
  })

  it('indique quand il n\'y a rien à traiter', async () => {
    registerEndpoint('/api/signals', () => ({ items: [], total: 0, page: 1, perPage: 50 }))

    const wrapper = await mountPage(SignalsPage, '/signals')

    await waitForText(wrapper, 'Rien à traiter.')
  })
})

describe('fiche entreprise', () => {
  beforeEach(() => {
    registerEndpoint('/api/companies/7', () => detail)
    registerEndpoint('/api/companies/9', () => {
      throw createError({ statusCode: 404 })
    })
  })

  it('affiche les informations, le score expliqué, les contacts et l\'historique', async () => {
    const wrapper = await mountPage(CompanyPage, '/companies/7')
    await waitForText(wrapper, 'Acme Studio')
    const text = wrapper.text()

    expect(text).toContain('Agence web · Local')
    expect(text).toContain('SIREN 123456789')
    expect(text).toContain('12 rue des Lilas, 25000, Besançon')
    expect(text).toContain('Score 55/100')
    expect(text).toContain('+20 Agence web')
    expect(text).toContain('Total : 55')
    expect(text).toContain('Jane Doe')
    expect(text).toContain('Historique (1)')
    expect(text).toContain('Téléphone')
    expect(text).toContain('Pas de réponse')
    expect(text).toContain('avec Jane Doe')
    expect(text).toContain('Origine : Apéro')
    expect(text).toContain('Signaux (1)')
    expect(wrapper.find('a[href="mailto:jane@acme.test"]').exists()).toBe(true)
  })

  it('affiche un message quand l\'entreprise n\'existe pas', async () => {
    const wrapper = await mountPage(CompanyPage, '/companies/9')

    await waitForText(wrapper, 'Entreprise introuvable.')
  })

  it('ouvre le formulaire d\'édition des informations', async () => {
    const wrapper = await mountPage(CompanyPage, '/companies/7')
    await waitForText(wrapper, 'Acme Studio')

    const edit = wrapper.findAll('button').filter(b => b.text() === 'Modifier')[0]!
    await edit.trigger('click')

    await waitForText(wrapper, 'Code NAF')
    expect(wrapper.findAll('button').some(b => b.text() === 'Annuler')).toBe(true)
  })

  it('demande une confirmation avant de supprimer un contact', async () => {
    const wrapper = await mountPage(CompanyPage, '/companies/7')
    await waitForText(wrapper, 'Jane Doe')
    expect(wrapper.text()).not.toContain('Supprimer définitivement ce contact')

    await wrapper.findAll('button').find(b => b.text() === 'Supprimer')!.trigger('click')

    await waitForText(wrapper, 'Supprimer définitivement ce contact ? Ses interactions sont conservées.')
  })

  it('ouvre le formulaire d\'ajout de contact', async () => {
    const wrapper = await mountPage(CompanyPage, '/companies/7')
    await waitForText(wrapper, 'Jane Doe')

    await wrapper.findAll('button').find(b => b.text() === 'Ajouter')!.trigger('click')

    await waitForText(wrapper, 'LinkedIn')
    expect(wrapper.find('input[placeholder="linkedin.com/in/…"]').exists()).toBe(true)
  })
})

describe('page Assistant', () => {
  const reply = { reply: 'Aucune entreprise à relancer.', toolCalls: [{ name: 'search_companies', arguments: { due: true } }] }

  it('envoie la conversation et affiche la réponse avec les outils appelés', async () => {
    const bodies: unknown[] = []
    registerEndpoint('/api/chat', {
      method: 'POST',
      handler: async (event) => {
        bodies.push(await readBody(event))
        return reply
      },
    })

    const wrapper = await mountPage(AssistantPage, '/assistant')
    await wrapper.find('textarea').setValue('Qui relancer ?')
    await wrapper.find('form').trigger('submit')

    await waitForText(wrapper, 'Aucune entreprise à relancer.')
    expect(bodies).toEqual([{ messages: [{ role: 'user', content: 'Qui relancer ?' }] }])
    expect(wrapper.text()).toContain('Qui relancer ?')
    expect(wrapper.text()).toContain('1 outil(s) appelé(s)')
    expect(wrapper.text()).toContain('search_companies(due: true)')
  })

  it('affiche l\'erreur et restaure la question si le modèle ne répond pas', async () => {
    registerEndpoint('/api/chat', {
      method: 'POST',
      handler: () => {
        throw createError({ statusCode: 503, data: { error: 'Le modèle local ne répond pas' } })
      },
    })

    const wrapper = await mountPage(AssistantPage, '/assistant')
    await wrapper.find('textarea').setValue('Salut')
    await wrapper.find('form').trigger('submit')

    await vi.waitFor(() => expect((wrapper.find('textarea').element as HTMLTextAreaElement).value).toBe('Salut'))
    expect(wrapper.text()).not.toContain('Le modèle réfléchit')
  })
})
