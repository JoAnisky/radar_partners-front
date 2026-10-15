import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { mockNuxtImport, mountSuspended, registerEndpoint } from '@nuxt/test-utils/runtime'
import { createError } from 'h3'
import IndexPage from '~/pages/index.vue'
import type { CompanySummary, Signal, Stats } from '~/types/api'

mockNuxtImport('useApi', () => () => $fetch)

const company = (id: number, name: string, overrides: Partial<CompanySummary> = {}): CompanySummary => ({
  id,
  name,
  siren: null,
  website: null,
  city: 'Besançon',
  postalCode: null,
  phone: null,
  nafCode: null,
  headcountRange: '10-19',
  type: 'UNKNOWN',
  scope: 'LOCAL',
  status: 'TO_CONTACT',
  score: 40,
  flags: [],
  recontactAfter: null,
  lastInteractionAt: null,
  archived: false,
  ...overrides,
})

const signal = (id: number, title: string, overrides: Partial<Signal> = {}): Signal => ({
  id,
  companyId: null,
  companyName: null,
  type: 'FREELANCE_MISSION',
  source: 'free-work',
  title,
  url: 'https://www.free-work.com/fr/tech-it/job-mission/x/y',
  detectedAt: '2026-10-13T08:57:56+02:00',
  publishedAt: null,
  dismissedAt: null,
  extracted: {},
  ...overrides,
})

const weeks = ['2026-07-27', '2026-08-03', '2026-08-10', '2026-08-17', '2026-08-24', '2026-08-31', '2026-09-07', '2026-09-14', '2026-09-21', '2026-09-28', '2026-10-05', '2026-10-12']

const stats: Stats = {
  weeks,
  kpis: {
    companies: { total: 163, createdLast7Days: 163, series: [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 163] },
    due: { total: 2 },
    interactions: { last30Days: 8, previous30Days: 1, deltaPercent: 700, series: [0, 0, 0, 0, 0, 0, 1, 0, 0, 1, 6, 1] },
    signals: { last30Days: 1, previous30Days: 0, deltaPercent: null, unresolved: 1, series: [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1] },
  },
  activity: {
    interactions: [0, 0, 0, 0, 0, 0, 1, 0, 0, 1, 6, 1],
    signals: [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1],
    companies: [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 163],
  },
  pipeline: [
    { status: 'TO_CONTACT', count: 149 },
    { status: 'CONTACTED', count: 7 },
    { status: 'FOLLOW_UP', count: 0 },
    { status: 'MEETING', count: 1 },
    { status: 'PARTNER', count: 0 },
    { status: 'ON_HOLD', count: 5 },
    { status: 'EXCLUDED', count: 1 },
  ],
  progress: { total: 163, contacted: 14, reachable: 1, typed: 0 },
  lists: {
    due: [company(1, 'Retard SAS', { status: 'ON_HOLD', recontactAfter: '2026-10-01T00:00:00+02:00' }), company(2, 'Action échue', { status: 'CONTACTED' })],
    priorities: [company(3, 'Priorité Un', { score: 55 }), company(4, 'Priorité Deux', { headcountRange: null, city: null })],
    recentSignals: [signal(10, 'Développeur Symfony'), signal(11, 'Dev PHP', { companyId: 3, companyName: 'Priorité Un' })],
  },
}

const mounted: { unmount: () => void }[] = []

async function mountDashboard() {
  const wrapper = await mountSuspended(IndexPage, { route: '/' })
  mounted.push(wrapper)

  return wrapper
}

beforeEach(() => {
  clearNuxtData()
})

afterEach(() => {
  mounted.splice(0).forEach(wrapper => wrapper.unmount())
})

describe('page Accueil', () => {
  beforeEach(() => {
    registerEndpoint('/api/stats', () => stats)
  })

  it('affiche les quatre indicateurs avec leur tendance', async () => {
    const wrapper = await mountDashboard()
    await vi.waitFor(() => expect(wrapper.text()).toContain('Entreprises suivies'))
    const text = wrapper.text()

    expect(text).toContain('163')
    expect(text).toContain('+163 cette semaine')
    expect(text).toContain('À relancer')
    expect(text).toContain('À traiter en priorité')
    expect(text).toContain('Interactions · 30 jours')
    expect(text).toContain('+700 %')
    expect(text).toContain('1 les 30 jours précédents')
    expect(text).toContain('Offres · 30 jours')
    expect(text).toContain('1 à rattacher à une entreprise')
  })

  it('affiche la répartition du pipeline avec des liens filtrés', async () => {
    const wrapper = await mountDashboard()
    await vi.waitFor(() => expect(wrapper.text()).toContain('Pipeline'))

    expect(wrapper.find('a[href="/companies?status=TO_CONTACT"]').text()).toBe('À contacter')
    expect(wrapper.find('a[href="/companies?status=ON_HOLD"]').exists()).toBe(true)
    expect(wrapper.find('a[href="/companies?status=PARTNER"]').exists()).toBe(false)
    expect(wrapper.text()).toContain('91 %')
  })

  it('affiche l\'avancement et invite à renseigner le type', async () => {
    const wrapper = await mountDashboard()
    await vi.waitFor(() => expect(wrapper.text()).toContain('Avancement'))
    const text = wrapper.text()

    expect(text).toContain('14 / 163 · 9 %')
    expect(text).toContain('1 / 163 · 1 %')
    expect(text).toContain('0 / 163 · 0 %')
    expect(text).toContain('Indiquez le type d\'une entreprise')
  })

  it('liste les entreprises à relancer, les priorités et les dernières offres', async () => {
    const wrapper = await mountDashboard()
    await vi.waitFor(() => expect(wrapper.text()).toContain('Retard SAS'))
    const text = wrapper.text()

    expect(text).toContain('Relance prévue le 01/10/2026')
    expect(text).toContain('Action prévue échue')
    expect(wrapper.find('a[href="/companies/1"]').text()).toBe('Retard SAS')
    expect(text).toContain('Priorité Un')
    expect(text).toContain('10-19 salariés')
    expect(text).toContain('55')
    expect(text).toContain('Développeur Symfony')
    expect(text).toContain('À rattacher')
    expect(wrapper.find('a[href="/companies/3"]').exists()).toBe(true)
    expect(wrapper.find('a[href="/companies?due=1"]').exists()).toBe(true)
    expect(wrapper.find('a[href="/signals"]').exists()).toBe(true)
  })

  it('change de série du graphique avec le sélecteur', async () => {
    const wrapper = await mountDashboard()
    await vi.waitFor(() => expect(wrapper.text()).toContain('Activité'))
    const titles = () => wrapper.findAll('svg.h-auto circle title').map(title => title.text())

    expect(titles().at(-1)).toBe('12/10 : 1 interaction(s)')

    await wrapper.findAll('[role="tab"]').find(tab => tab.text() === 'Entreprises')!.trigger('click')

    await vi.waitFor(() => expect(titles().at(-1)).toBe('12/10 : 163 nouvelle(s)'))
  })

  it('utilise des libellés de semaine au format jour/mois', async () => {
    const wrapper = await mountDashboard()
    await vi.waitFor(() => expect(wrapper.text()).toContain('Activité'))

    expect(wrapper.findAll('svg text').map(text => text.text())).toEqual(expect.arrayContaining(['12/10', '28/09']))
  })
})

describe('page Accueil (cas limites)', () => {
  it('indique quand il n\'y a rien à relancer, à contacter ni à lire', async () => {
    registerEndpoint('/api/stats', () => ({
      ...stats,
      kpis: { ...stats.kpis, due: { total: 0 } },
      progress: { total: 10, contacted: 10, reachable: 10, typed: 10 },
      lists: { due: [], priorities: [], recentSignals: [] },
    }))

    const wrapper = await mountDashboard()
    await vi.waitFor(() => expect(wrapper.text()).toContain('Rien à relancer pour l\'instant.'))
    const text = wrapper.text()

    expect(text).toContain('Aucune entreprise à contacter.')
    expect(text).toContain('Aucune offre détectée.')
    expect(text).not.toContain('Indiquez le type d\'une entreprise')
  })

  it('affiche un message quand les statistiques ne se chargent pas', async () => {
    registerEndpoint('/api/stats', () => {
      throw createError({ statusCode: 500 })
    })

    const wrapper = await mountDashboard()

    await vi.waitFor(() => expect(wrapper.text()).toContain('Impossible de charger les statistiques.'))
  })
})
