import { beforeEach, describe, expect, it, vi } from 'vitest'
import { mockNuxtImport, mountSuspended } from '@nuxt/test-utils/runtime'
import ContactForm from '~/components/ContactForm.vue'
import type { Contact } from '~/types/api'

const { api } = vi.hoisted(() => ({ api: vi.fn() }))
mockNuxtImport('useApi', () => () => api)

const contact: Contact = {
  id: 3,
  fullName: 'Jane Doe',
  role: 'CTO',
  phone: null,
  email: 'jane@acme.test',
  linkedinUrl: null,
  notes: null,
}

beforeEach(() => {
  api.mockReset()
  api.mockResolvedValue({})
})

describe('ContactForm (création)', () => {
  it('envoie seulement les champs renseignés', async () => {
    const wrapper = await mountSuspended(ContactForm, { props: { companyId: 5 } })
    const inputs = wrapper.findAll('input')

    await inputs[0]!.setValue('  Jane Doe ')
    await inputs[1]!.setValue('CTO')
    await wrapper.find('form').trigger('submit')
    await vi.waitFor(() => expect(api).toHaveBeenCalled())

    expect(api).toHaveBeenCalledWith('/api/companies/5/contacts', {
      method: 'POST',
      body: { fullName: 'Jane Doe', role: 'CTO' },
    })
    await vi.waitFor(() => expect(wrapper.emitted('saved')).toHaveLength(1))
  })

  it('refuse un contact sans nom', async () => {
    const wrapper = await mountSuspended(ContactForm, { props: { companyId: 5 } })

    await wrapper.findAll('input')[1]!.setValue('CTO')
    await wrapper.find('form').trigger('submit')
    await new Promise(resolve => setTimeout(resolve, 20))

    expect(api).not.toHaveBeenCalled()
    expect(wrapper.emitted('saved')).toBeUndefined()
  })
})

describe('ContactForm (modification)', () => {
  it('pré-remplit puis n\'envoie que les changements', async () => {
    const wrapper = await mountSuspended(ContactForm, { props: { companyId: 5, contact } })
    const inputs = wrapper.findAll('input')
    expect((inputs[0]!.element as HTMLInputElement).value).toBe('Jane Doe')

    await inputs[1]!.setValue('')
    await inputs[2]!.setValue('06 12 34 56 78')
    await wrapper.find('form').trigger('submit')
    await vi.waitFor(() => expect(api).toHaveBeenCalled())

    expect(api).toHaveBeenCalledWith('/api/contacts/3', {
      method: 'PATCH',
      body: { role: null, phone: '06 12 34 56 78' },
    })
  })

  it('n\'appelle pas l\'API sans modification', async () => {
    const wrapper = await mountSuspended(ContactForm, { props: { companyId: 5, contact } })

    await wrapper.find('form').trigger('submit')

    expect(api).not.toHaveBeenCalled()
    expect(wrapper.emitted('cancel')).toHaveLength(1)
  })

  it('refuse de vider le nom', async () => {
    const wrapper = await mountSuspended(ContactForm, { props: { companyId: 5, contact } })

    await wrapper.findAll('input')[0]!.setValue('   ')
    await wrapper.find('form').trigger('submit')
    await new Promise(resolve => setTimeout(resolve, 20))

    expect(api).not.toHaveBeenCalled()
  })
})
