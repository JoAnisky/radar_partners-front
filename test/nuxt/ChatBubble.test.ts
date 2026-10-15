import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { mockNuxtImport, mountSuspended, registerEndpoint } from '@nuxt/test-utils/runtime'
import { createError, readBody } from 'h3'
import { clearNuxtState } from '#imports'
import ChatBubble from '~/components/ChatBubble.vue'

mockNuxtImport('useApi', () => () => $fetch)

const reply = { reply: 'Aucune entreprise à relancer.', toolCalls: [{ name: 'search_companies', arguments: { due: true } }] }
const mounted: { unmount: () => void }[] = []

async function mountBubble() {
  const wrapper = await mountSuspended(ChatBubble)
  mounted.push(wrapper)

  return wrapper
}

const openPanel = (wrapper: Awaited<ReturnType<typeof mountBubble>>) => wrapper.find('button[aria-label^="Ouvrir Amelio"]').trigger('click')

beforeEach(() => {
  clearNuxtState(['chat-messages', 'chat-open', 'chat-busy', 'chat-draft', 'chat-company', 'chat-restored'])
  localStorage.clear()
})

afterEach(() => {
  mounted.splice(0).forEach(wrapper => wrapper.unmount())
})

describe('bulle de l\'assistant', () => {
  it('reste fermée tant qu\'on ne clique pas sur la bulle', async () => {
    const wrapper = await mountBubble()
    expect(wrapper.find('section').exists()).toBe(false)

    await openPanel(wrapper)

    expect(wrapper.find('section[aria-label="Amelio"]').exists()).toBe(true)
    expect(wrapper.text()).toContain('Je suis Amelio')
    expect(wrapper.find('section svg').attributes('data-state')).toBe('idle')
    expect(wrapper.text()).toContain('Quelles entreprises dois-je relancer ?')
  })

  it('envoie la conversation, affiche la réponse avec les outils appelés et la mémorise', async () => {
    const bodies: unknown[] = []
    registerEndpoint('/api/chat', {
      method: 'POST',
      handler: async (event) => {
        bodies.push(await readBody(event))
        return reply
      },
    })

    const wrapper = await mountBubble()
    await openPanel(wrapper)
    await wrapper.find('textarea').setValue('Qui relancer ?')
    await wrapper.find('form').trigger('submit')

    await vi.waitFor(() => expect(wrapper.text()).toContain('Aucune entreprise à relancer.'))
    expect(wrapper.find('section svg').attributes('data-state')).toBe('idle')
    expect(bodies).toEqual([{ messages: [{ role: 'user', content: 'Qui relancer ?' }], context: { page: 'Accueil' } }])
    expect(wrapper.text()).toContain('1 outil(s) appelé(s)')
    expect(wrapper.text()).toContain('search_companies(due: true)')
    expect(JSON.parse(localStorage.getItem('radar-chat') ?? '[]')).toHaveLength(2)
  })

  it('affiche l\'erreur et restaure la question si le modèle ne répond pas', async () => {
    registerEndpoint('/api/chat', {
      method: 'POST',
      handler: () => {
        throw createError({ statusCode: 503, data: { error: 'Le modèle local ne répond pas' } })
      },
    })

    const wrapper = await mountBubble()
    await openPanel(wrapper)
    await wrapper.find('textarea').setValue('Salut')
    await wrapper.find('form').trigger('submit')

    await vi.waitFor(() => expect((wrapper.find('textarea').element as HTMLTextAreaElement).value).toBe('Salut'))
    expect(wrapper.text()).not.toContain('Amelio réfléchit')
    expect(wrapper.find('section svg').attributes('data-state')).toBe('error')
    expect(localStorage.getItem('radar-chat')).toBe('[]')
  })

  it('propose des actions sur la fiche entreprise ouverte', async () => {
    const wrapper = await mountBubble()
    const { company } = useChat()
    company.value = { id: 33, name: 'Business Web Agence' }

    await openPanel(wrapper)

    expect(wrapper.text()).toContain('Rédige un mail d\'approche pour Business Web Agence (id 33).')
    expect(wrapper.text()).not.toContain('Quelles entreprises dois-je relancer ?')
  })

  it('envoie la fiche entreprise ouverte comme contexte', async () => {
    const bodies: { context: unknown }[] = []
    registerEndpoint('/api/chat', {
      method: 'POST',
      handler: async (event) => {
        bodies.push(await readBody(event))
        return reply
      },
    })

    const wrapper = await mountBubble()
    const { company } = useChat()
    company.value = { id: 33, name: 'Business Web Agence' }
    await openPanel(wrapper)
    await wrapper.find('textarea').setValue('Où j\'en suis ici ?')
    await wrapper.find('form').trigger('submit')

    await vi.waitFor(() => expect(bodies).toHaveLength(1))
    expect(bodies[0]!.context).toEqual({ page: 'Accueil', company: { id: 33, name: 'Business Web Agence' } })
  })

  it('retrouve la conversation enregistrée et peut la vider', async () => {
    localStorage.setItem('radar-chat', JSON.stringify([{ role: 'user', content: 'Ancienne question' }, { role: 'assistant', content: 'Ancienne réponse', toolCalls: [] }]))

    const wrapper = await mountBubble()
    await openPanel(wrapper)
    expect(wrapper.text()).toContain('Ancienne réponse')

    await wrapper.find('button[aria-label="Nouvelle conversation"]').trigger('click')

    expect(wrapper.text()).not.toContain('Ancienne réponse')
    await vi.waitFor(() => expect(localStorage.getItem('radar-chat')).toBe('[]'))
  })
})
