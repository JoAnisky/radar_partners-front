import { beforeEach, describe, expect, it, vi } from 'vitest'
import { mockNuxtImport, mountSuspended } from '@nuxt/test-utils/runtime'
import CompanyForm from '~/components/CompanyForm.vue'
import type { CompanyDetail } from '~/types/api'

const { api } = vi.hoisted(() => ({ api: vi.fn() }))
mockNuxtImport('useApi', () => () => api)

const company: CompanyDetail = {
  id: 7,
  name: 'Acme',
  siren: '123456789',
  website: 'https://acme.test',
  city: 'Besançon',
  postalCode: '25000',
  phone: '+33381000000',
  nafCode: '62.01Z',
  headcountRange: '10-19',
  type: 'WEB_AGENCY',
  scope: 'LOCAL',
  status: 'TO_CONTACT',
  score: 40,
  flags: [],
  recontactAfter: null,
  lastInteractionAt: null,
  archived: false,
  address: '12 rue des Lilas',
  email: 'contact@acme.test',
  parentId: null,
  scoreExplanation: null,
  notes: null,
  createdAt: '2026-10-01T00:00:00+02:00',
  contacts: [],
  interactions: [],
  signals: [],
}

beforeEach(() => {
  api.mockReset()
  api.mockResolvedValue({})
})

describe('CompanyForm', () => {
  it('pré-remplit les champs avec l\'entreprise', async () => {
    const wrapper = await mountSuspended(CompanyForm, { props: { company } })
    const inputs = wrapper.findAll('input')

    expect((inputs[0]!.element as HTMLInputElement).value).toBe('Acme')
    expect((wrapper.find('input[placeholder="62.01Z"]').element as HTMLInputElement).value).toBe('62.01Z')
    expect((wrapper.find('input[placeholder="9 chiffres"]').element as HTMLInputElement).value).toBe('123456789')
  })

  it('n\'envoie que les champs modifiés', async () => {
    const wrapper = await mountSuspended(CompanyForm, { props: { company } })

    await wrapper.findAll('input')[0]!.setValue('  Acme Studio  ')
    await wrapper.find('input[placeholder="10-19"]').setValue('20-49')
    await wrapper.find('form').trigger('submit')
    await vi.waitFor(() => expect(api).toHaveBeenCalled())

    expect(api).toHaveBeenCalledWith('/api/companies/7', {
      method: 'PATCH',
      body: { name: 'Acme Studio', headcountRange: '20-49' },
    })
    await vi.waitFor(() => expect(wrapper.emitted('saved')).toHaveLength(1))
  })

  it('envoie null pour un champ vidé', async () => {
    const wrapper = await mountSuspended(CompanyForm, { props: { company } })

    await wrapper.find('input[placeholder="https://…"]').setValue('')
    await wrapper.find('form').trigger('submit')
    await vi.waitFor(() => expect(api).toHaveBeenCalled())

    expect(api.mock.calls[0]![1].body).toEqual({ website: null })
  })

  it('n\'appelle pas l\'API quand rien n\'a changé', async () => {
    const wrapper = await mountSuspended(CompanyForm, { props: { company } })

    await wrapper.find('form').trigger('submit')

    expect(api).not.toHaveBeenCalled()
    expect(wrapper.emitted('cancel')).toHaveLength(1)
  })

  it('n\'émet pas « saved » quand l\'API refuse', async () => {
    api.mockRejectedValue({ data: { error: 'Une entreprise porte déjà ce nom.' } })
    const wrapper = await mountSuspended(CompanyForm, { props: { company } })

    await wrapper.findAll('input')[0]!.setValue('Beta')
    await wrapper.find('form').trigger('submit')
    await vi.waitFor(() => expect(api).toHaveBeenCalled())
    await new Promise(resolve => setTimeout(resolve, 20))

    expect(wrapper.emitted('saved')).toBeUndefined()
  })
})
