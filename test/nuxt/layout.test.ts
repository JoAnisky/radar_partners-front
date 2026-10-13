import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { mockNuxtImport, mountSuspended, registerEndpoint } from '@nuxt/test-utils/runtime'
import { clearNuxtData } from '#imports'
import DefaultLayout from '~/layouts/default.vue'

mockNuxtImport('useApi', () => () => $fetch)

const mounted: { unmount: () => void }[] = []

async function mountLayout(route: string) {
  const wrapper = await mountSuspended(DefaultLayout, { route, slots: { default: '<p>Contenu de la page</p>' } })
  mounted.push(wrapper)

  return wrapper
}

beforeEach(() => {
  clearNuxtData()
  registerEndpoint('/api/signals', () => ({ items: [], total: 3, page: 1, perPage: 1 }))
})

afterEach(() => {
  mounted.splice(0).forEach(wrapper => wrapper.unmount())
  document.body.innerHTML = ''
})

describe('mise en page', () => {
  it('affiche la marque, les sections de navigation et le contenu de la page', async () => {
    const wrapper = await mountLayout('/')
    const text = wrapper.text()

    expect(text).toContain('Radar')
    expect(text).toContain('Partenaires')
    expect(text).toContain('Aperçu')
    expect(text).toContain('Accueil')
    expect(text).toContain('Prospection')
    expect(text).toContain('Entreprises')
    expect(text).toContain('Contacts')
    expect(text).toContain('Veille')
    expect(text).toContain('Signaux')
    expect(text).toContain('Contenu de la page')
  })

  it('affiche le nombre d\'offres à rattacher sur Signaux', async () => {
    const wrapper = await mountLayout('/')

    await vi.waitFor(() => expect(wrapper.find('a[href="/signals"]').text()).toContain('3'))
  })

  it('n\'affiche pas de pastille quand il n\'y a rien à rattacher', async () => {
    registerEndpoint('/api/signals', () => ({ items: [], total: 0, page: 1, perPage: 1 }))
    const wrapper = await mountLayout('/')
    await vi.waitFor(() => expect(wrapper.find('a[href="/signals"]').exists()).toBe(true))
    await new Promise(resolve => setTimeout(resolve, 50))

    expect(wrapper.find('a[href="/signals"]').text()).toBe('Signaux')
  })

  it('reprend le titre de la page dans la barre du haut', async () => {
    const wrapper = await mountLayout('/contacts')

    await vi.waitFor(() => expect(wrapper.find('h1').text()).toBe('Contacts'))
  })

  it('ouvre la création d\'entreprise depuis la barre du haut', async () => {
    const wrapper = await mountLayout('/')

    await wrapper.findAll('button').find(button => button.text() === 'Entreprise')!.trigger('click')

    await vi.waitFor(() => expect(document.body.textContent).toContain('Nouvelle entreprise'))
  })

  it('affiche « Accueil » comme titre de la page d\'accueil', async () => {
    const wrapper = await mountLayout('/')

    await vi.waitFor(() => expect(wrapper.find('h1').text()).toBe('Accueil'))
  })

  it('pointe Entreprises vers /companies et l\'accueil vers /', async () => {
    const wrapper = await mountLayout('/')

    expect(wrapper.find('a[href="/companies"]').text()).toContain('Entreprises')
    expect(wrapper.find('a[href="/"]').exists()).toBe(true)
  })

  it('propose la recherche globale', async () => {
    const wrapper = await mountLayout('/')

    // La langue française est fournie par UApp (app.vue) : ici le libellé peut être anglais.
    expect(wrapper.text()).toMatch(/Search|Rechercher/)
    expect(wrapper.find('kbd').exists()).toBe(true)
  })
})
