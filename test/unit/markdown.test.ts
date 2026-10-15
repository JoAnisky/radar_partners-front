import { describe, expect, it } from 'vitest'
import { markdownToPlain, renderMarkdown } from '../../app/utils/markdown'

describe('renderMarkdown', () => {
  it('met en forme le gras, les listes et les retours à la ligne', () => {
    const html = renderMarkdown('Voici **Atol CD** :\n- SIREN : 429\n- Score : 65\nFin')

    expect(html).toContain('<strong>Atol CD</strong>')
    expect(html).toContain('<ul>')
    expect(html).toContain('<li>SIREN : 429</li>')
  })

  it('échappe le HTML brut et ouvre les liens dans un nouvel onglet', () => {
    const html = renderMarkdown('<script>alert(1)</script> [site](https://exemple.fr) [mauvais](javascript:alert(1))')

    expect(html).not.toContain('<script>')
    expect(html).toContain('target="_blank"')
    expect(html).toContain('rel="noopener noreferrer"')
    expect(html).not.toContain('href="javascript:')
  })
})

describe('markdownToPlain', () => {
  it('retire la mise en forme sans toucher au texte', () => {
    const plain = markdownToPlain('## Objet\n**Bonjour** Marc,\n* point un\n* point *deux*\n> citation\nVoir `code` et 2 * 3 * 4')

    expect(plain).toBe('Objet\nBonjour Marc,\n- point un\n- point deux\ncitation\nVoir code et 2 * 3 * 4')
  })
})
