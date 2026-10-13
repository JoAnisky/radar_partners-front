import { describe, expect, it } from 'vitest'
import { mountSuspended } from '@nuxt/test-utils/runtime'
import ScoreBadge from '~/components/ScoreBadge.vue'
import StatusBadge from '~/components/StatusBadge.vue'

describe('StatusBadge', () => {
  it('affiche le libellé français du statut', async () => {
    const wrapper = await mountSuspended(StatusBadge, { props: { status: 'ON_HOLD' } })

    expect(wrapper.text()).toBe('En attente')
  })
})

describe('ScoreBadge', () => {
  it('affiche le score', async () => {
    const wrapper = await mountSuspended(ScoreBadge, { props: { score: 42 } })

    expect(wrapper.text()).toBe('42')
  })
})
