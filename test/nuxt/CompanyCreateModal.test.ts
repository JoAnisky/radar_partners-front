import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { mockNuxtImport, mountSuspended } from '@nuxt/test-utils/runtime'
import CompanyCreateModal from '~/components/CompanyCreateModal.vue'

const { api, navigate } = vi.hoisted(() => ({ api: vi.fn(), navigate: vi.fn() }))
mockNuxtImport('useApi', () => () => api)
mockNuxtImport('navigateTo', () => navigate)

const body = () => document.body

async function open() {
  const wrapper = await mountSuspended(CompanyCreateModal, { props: { open: true } })
  await vi.waitFor(() => expect(body().querySelector('form#create-company')).not.toBeNull())

  return wrapper
}

function type(placeholderOrIndex: string | number, value: string) {
  const inputs = [...body().querySelectorAll<HTMLInputElement>('form#create-company input')]
  const input = typeof placeholderOrIndex === 'number' ? inputs[placeholderOrIndex]! : inputs.find(i => i.placeholder === placeholderOrIndex)!
  input.value = value
  input.dispatchEvent(new Event('input', { bubbles: true }))
}

const submit = () => body().querySelector('form#create-company')!.dispatchEvent(new Event('submit', { cancelable: true, bubbles: true }))

beforeEach(() => {
  api.mockReset()
  api.mockResolvedValue({ id: 12 })
  navigate.mockReset()
})

afterEach(() => {
  body().innerHTML = ''
})

describe('CompanyCreateModal', () => {
  it('affiche le formulaire de création', async () => {
    await open()

    expect(body().textContent).toContain('Nouvelle entreprise')
    expect(body().textContent).toContain('Nom')
    expect(body().textContent).toContain('Zone')
  })

  it('refuse un nom vide', async () => {
    await open()

    type(0, '   ')
    submit()
    await new Promise(resolve => setTimeout(resolve, 30))

    expect(api).not.toHaveBeenCalled()
  })

  it('crée l\'entreprise, ferme le modal et ouvre sa fiche', async () => {
    const wrapper = await open()

    type(0, '  Acme Studio ')
    type('https://…', 'acme.test')
    submit()

    await vi.waitFor(() => expect(api).toHaveBeenCalledWith('/api/companies', {
      method: 'POST',
      body: { name: 'Acme Studio', type: 'UNKNOWN', scope: 'LOCAL', city: undefined, website: 'acme.test' },
    }))
    await vi.waitFor(() => expect(navigate).toHaveBeenCalledWith('/companies/12'))
    expect(wrapper.emitted('update:open')?.at(-1)).toEqual([false])
  })

  it('reste ouvert quand l\'API refuse', async () => {
    api.mockRejectedValue({ data: { error: 'Une entreprise porte déjà ce nom.', id: 3 } })
    const wrapper = await open()

    type(0, 'Acme')
    submit()
    await vi.waitFor(() => expect(api).toHaveBeenCalled())
    await new Promise(resolve => setTimeout(resolve, 30))

    expect(navigate).not.toHaveBeenCalled()
    expect(wrapper.emitted('update:open')).toBeUndefined()
  })
})
