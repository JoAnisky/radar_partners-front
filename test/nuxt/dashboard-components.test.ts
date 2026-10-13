import { describe, expect, it } from 'vitest'
import { mountSuspended } from '@nuxt/test-utils/runtime'
import AreaChart from '~/components/AreaChart.vue'
import DashboardCard from '~/components/DashboardCard.vue'
import DonutChart from '~/components/DonutChart.vue'
import KpiCard from '~/components/KpiCard.vue'
import SegmentedControl from '~/components/SegmentedControl.vue'
import SparklineChart from '~/components/SparklineChart.vue'

describe('KpiCard', () => {
  it('affiche le libellé, la valeur, la tendance et la mini-courbe', async () => {
    const wrapper = await mountSuspended(KpiCard, {
      props: { label: 'Interactions', value: 8, icon: 'i-lucide-messages-square', tone: 'blue', delta: 700, hint: '1 les 30 jours précédents', series: [0, 1, 4, 8] },
    })

    expect(wrapper.text()).toContain('Interactions')
    expect(wrapper.text()).toContain('8')
    expect(wrapper.text()).toContain('+700 %')
    expect(wrapper.text()).toContain('1 les 30 jours précédents')
    expect(wrapper.find('p.text-success').exists()).toBe(true)
    expect(wrapper.findComponent(SparklineChart).exists()).toBe(true)
    expect(wrapper.find('svg path').exists()).toBe(true)
  })

  it('affiche une baisse en rouge', async () => {
    const wrapper = await mountSuspended(KpiCard, { props: { label: 'Offres', value: 2, icon: 'i-lucide-radio-tower', tone: 'violet', delta: -50 } })

    expect(wrapper.text()).toContain('-50 %')
    expect(wrapper.find('p.text-error').exists()).toBe(true)
  })

  it('n\'affiche ni tendance ni courbe sans comparaison', async () => {
    const wrapper = await mountSuspended(KpiCard, { props: { label: 'À relancer', value: 0, icon: 'i-lucide-bell-ring', tone: 'amber', delta: null, hint: 'Rien à relancer' } })

    expect(wrapper.text()).toContain('Rien à relancer')
    expect(wrapper.find('p.text-success, p.text-error').exists()).toBe(false)
    expect(wrapper.findComponent(SparklineChart).exists()).toBe(false)
  })

  it('privilégie un texte de tendance libre', async () => {
    const wrapper = await mountSuspended(KpiCard, { props: { label: 'Entreprises', value: 163, icon: 'i-lucide-building-2', tone: 'emerald', trend: '+5 cette semaine', delta: -10 } })

    expect(wrapper.text()).toContain('+5 cette semaine')
    expect(wrapper.text()).not.toContain('-10 %')
  })
})

describe('AreaChart', () => {
  const labels = ['01/09', '08/09', '15/09', '22/09']

  it('trace la courbe, les points et les graduations', async () => {
    const wrapper = await mountSuspended(AreaChart, { props: { labels, values: [0, 2, 6, 3], color: '#3b82f6', unit: 'interaction(s)' } })

    expect(wrapper.findAll('circle')).toHaveLength(4)
    const axis = wrapper.findAll('text').map(item => item.text())
    expect(axis).toContain('8') // maximum d'axe arrondi
    expect(axis).toContain('22/09')
    expect(wrapper.find('circle title').text()).toBe('01/09 : 0 interaction(s)')
  })

  it('n\'affiche qu\'une étiquette sur deux, la dernière toujours présente', async () => {
    const wrapper = await mountSuspended(AreaChart, { props: { labels, values: [1, 1, 1, 1], color: '#10b981' } })
    const axis = wrapper.findAll('text').map(item => item.text())

    expect(axis).toContain('22/09')
    expect(axis).toContain('08/09')
    expect(axis).not.toContain('15/09')
    expect(axis).not.toContain('01/09')
  })

  it('reste lisible sans aucune donnée', async () => {
    const wrapper = await mountSuspended(AreaChart, { props: { labels, values: [0, 0, 0, 0], color: '#10b981' } })

    expect(wrapper.findAll('text').map(item => item.text())).toContain('4')
    expect(wrapper.findAll('circle')).toHaveLength(4)
  })
})

describe('DonutChart', () => {
  const segments = [
    { key: 'A', label: 'À contacter', value: 6, color: '#71717a', to: '/companies?status=A' },
    { key: 'B', label: 'Contactée', value: 3, color: '#0ea5e9' },
    { key: 'C', label: 'Exclue', value: 0, color: '#ef4444' },
  ]

  it('affiche le total au centre et une légende sans les parts vides', async () => {
    const wrapper = await mountSuspended(DonutChart, { props: { segments, centerLabel: 'entreprises' } })

    expect(wrapper.find('svg text').text()).toBe('9')
    expect(wrapper.text()).toContain('entreprises')
    expect(wrapper.text()).toContain('À contacter')
    expect(wrapper.text()).toContain('67 %')
    expect(wrapper.text()).toContain('33 %')
    expect(wrapper.text()).not.toContain('Exclue')
    expect(wrapper.find('a[href="/companies?status=A"]').exists()).toBe(true)
  })

  it('dessine un arc par part non vide', async () => {
    const wrapper = await mountSuspended(DonutChart, { props: { segments, centerLabel: 'entreprises' } })

    expect(wrapper.findAll('circle[stroke-dasharray]')).toHaveLength(2)
  })

  it('n\'affiche que le cercle de fond quand tout est à zéro', async () => {
    const wrapper = await mountSuspended(DonutChart, { props: { segments: segments.map(s => ({ ...s, value: 0 })), centerLabel: 'entreprises' } })

    expect(wrapper.findAll('circle[stroke-dasharray]')).toHaveLength(0)
    expect(wrapper.find('svg text').text()).toBe('0')
  })
})

describe('SegmentedControl', () => {
  const items = [{ value: 'a', label: 'Alpha' }, { value: 'b', label: 'Bravo' }]

  it('marque l\'onglet actif et émet le choix de l\'utilisateur', async () => {
    const wrapper = await mountSuspended(SegmentedControl, { props: { items, modelValue: 'a' } })
    const tabs = wrapper.findAll('[role="tab"]')

    expect(tabs[0]!.attributes('aria-selected')).toBe('true')
    expect(tabs[1]!.attributes('aria-selected')).toBe('false')

    await tabs[1]!.trigger('click')

    expect(wrapper.emitted('update:modelValue')).toEqual([['b']])
  })
})

describe('DashboardCard', () => {
  it('affiche le titre, la description, les actions, le contenu et le pied', async () => {
    const wrapper = await mountSuspended(DashboardCard, {
      props: { title: 'Pipeline', description: 'Entreprises par statut' },
      slots: { default: '<p>Contenu</p>', actions: '<button>Action</button>', footer: '<a>Tout voir</a>' },
    })

    expect(wrapper.text()).toContain('Pipeline')
    expect(wrapper.text()).toContain('Entreprises par statut')
    expect(wrapper.text()).toContain('Contenu')
    expect(wrapper.text()).toContain('Action')
    expect(wrapper.text()).toContain('Tout voir')
  })

  it('n\'affiche pas de pied sans contenu', async () => {
    const wrapper = await mountSuspended(DashboardCard, { props: { title: 'Pipeline' } })

    expect(wrapper.find('footer').exists()).toBe(false)
  })
})
