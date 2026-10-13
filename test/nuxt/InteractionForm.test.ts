import { beforeEach, describe, expect, it, vi } from 'vitest'
import { mockNuxtImport, mountSuspended } from '@nuxt/test-utils/runtime'
import InteractionForm from '~/components/InteractionForm.vue'
import type { Contact, Interaction } from '~/types/api'

const { api } = vi.hoisted(() => ({ api: vi.fn() }))
mockNuxtImport('useApi', () => () => api)

const contacts: Contact[] = [
  { id: 3, fullName: 'Jane Doe', role: null, phone: null, email: null, linkedinUrl: null, notes: null },
]

const interaction: Interaction = {
  id: 9,
  contactId: null,
  occurredAt: '2026-10-01T00:00:00+02:00',
  channel: 'EMAIL',
  origin: 'Apéro',
  outcome: 'VOICEMAIL',
  notes: 'Avant',
  nextActionAt: null,
}

beforeEach(() => {
  api.mockReset()
  api.mockResolvedValue({})
})

describe('InteractionForm (création)', () => {
  it('envoie les valeurs saisies à l\'API et signale l\'enregistrement', async () => {
    const wrapper = await mountSuspended(InteractionForm, { props: { companyId: 5, contacts } })

    await wrapper.findAll('input[type="date"]')[0]!.setValue('2026-10-01')
    await wrapper.find('textarea').setValue('  Premier échange  ')
    await wrapper.find('form').trigger('submit')
    await vi.waitFor(() => expect(api).toHaveBeenCalled())

    expect(api).toHaveBeenCalledWith('/api/companies/5/interactions', {
      method: 'POST',
      body: {
        channel: 'PHONE',
        occurredAt: '2026-10-01',
        outcome: 'OTHER',
        contactId: undefined,
        origin: undefined,
        notes: 'Premier échange',
        nextActionAt: undefined,
      },
    })
    await vi.waitFor(() => expect(wrapper.emitted('saved')).toHaveLength(1))
  })

  it('vide le formulaire après un enregistrement réussi', async () => {
    const wrapper = await mountSuspended(InteractionForm, { props: { companyId: 5, contacts } })
    const notes = wrapper.find('textarea')

    await notes.setValue('Texte')
    await wrapper.find('form').trigger('submit')
    await vi.waitFor(() => expect(wrapper.emitted('saved')).toBeTruthy())

    expect((notes.element as HTMLTextAreaElement).value).toBe('')
  })

  it('n\'émet rien quand l\'API refuse', async () => {
    api.mockRejectedValue({ data: { detail: 'Valeur invalide pour channel.' } })
    const wrapper = await mountSuspended(InteractionForm, { props: { companyId: 5, contacts } })

    await wrapper.find('form').trigger('submit')
    await vi.waitFor(() => expect(api).toHaveBeenCalled())
    await new Promise(resolve => setTimeout(resolve, 20))

    expect(wrapper.emitted('saved')).toBeUndefined()
  })
})

describe('InteractionForm (modification)', () => {
  it('pré-remplit le formulaire avec l\'interaction', async () => {
    const wrapper = await mountSuspended(InteractionForm, { props: { companyId: 5, contacts, interaction } })

    expect((wrapper.findAll('input[type="date"]')[0]!.element as HTMLInputElement).value).toBe('2026-10-01')
    expect((wrapper.find('textarea').element as HTMLTextAreaElement).value).toBe('Avant')
    expect(wrapper.text()).toContain('Enregistrer les modifications')
    expect(wrapper.text()).toContain('Annuler')
  })

  it('n\'envoie pas les dates inchangées et vide les champs effacés', async () => {
    const wrapper = await mountSuspended(InteractionForm, { props: { companyId: 5, contacts, interaction } })

    await wrapper.find('textarea').setValue('Après')
    await wrapper.find('input[placeholder^="Événement"]').setValue('')
    await wrapper.find('form').trigger('submit')
    await vi.waitFor(() => expect(api).toHaveBeenCalled())

    const [url, options] = api.mock.calls[0]!
    expect(url).toBe('/api/interactions/9')
    expect(options.method).toBe('PATCH')
    expect(options.body).toEqual({ channel: 'EMAIL', outcome: 'VOICEMAIL', contactId: null, origin: null, notes: 'Après' })
    expect(options.body).not.toHaveProperty('occurredAt')
    expect(options.body).not.toHaveProperty('nextActionAt')
  })

  it('envoie une date modifiée et une prochaine action', async () => {
    const wrapper = await mountSuspended(InteractionForm, { props: { companyId: 5, contacts, interaction } })
    const dates = wrapper.findAll('input[type="date"]')

    await dates[0]!.setValue('2026-10-05')
    await dates[1]!.setValue('2026-10-12')
    await wrapper.find('form').trigger('submit')
    await vi.waitFor(() => expect(api).toHaveBeenCalled())

    expect(api.mock.calls[0]![1].body).toMatchObject({ occurredAt: '2026-10-05', nextActionAt: '2026-10-12' })
  })

  it('annule sans appeler l\'API', async () => {
    const wrapper = await mountSuspended(InteractionForm, { props: { companyId: 5, contacts, interaction } })

    const cancel = wrapper.findAll('button').find(button => button.text() === 'Annuler')
    await cancel!.trigger('click')

    expect(wrapper.emitted('cancel')).toHaveLength(1)
    expect(api).not.toHaveBeenCalled()
  })
})
