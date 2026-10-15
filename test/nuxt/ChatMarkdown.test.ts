import { describe, expect, it } from 'vitest'
import { mountSuspended } from '@nuxt/test-utils/runtime'
import ChatMarkdown from '~/components/ChatMarkdown.vue'

describe('ChatMarkdown', () => {
  it('affiche le gras et les listes au lieu des astérisques', async () => {
    const wrapper = await mountSuspended(ChatMarkdown, { props: { content: '**Statut** : CONTACTÉ\n- Score : 65' } })

    expect(wrapper.find('strong').text()).toBe('Statut')
    expect(wrapper.find('li').text()).toBe('Score : 65')
    expect(wrapper.text()).not.toContain('*')
  })
})
