import MarkdownIt from 'markdown-it'

// html: false échappe tout HTML brut : la sortie d'un modèle ne peut pas injecter de balises.
const md = new MarkdownIt({ html: false, linkify: true, breaks: true })

const renderLink = md.renderer.rules.link_open
  ?? ((tokens, index, options, _env, self) => self.renderToken(tokens, index, options))
md.renderer.rules.link_open = (tokens, index, options, env, self) => {
  tokens[index]!.attrSet('target', '_blank')
  tokens[index]!.attrSet('rel', 'noopener noreferrer')
  return renderLink(tokens, index, options, env, self)
}

export const renderMarkdown = (text: string): string => md.render(text)

/** Texte sans mise en forme Markdown, pour le copier dans un mail ou un message. */
export function markdownToPlain(text: string): string {
  return text
    .replace(/^\s*[*+]\s+/gm, '- ')
    .replace(/\*\*(.+?)\*\*/gs, '$1')
    .replace(/__(.+?)__/gs, '$1')
    .replace(/(?<![\w*])\*(?!\s)(.+?)(?<!\s)\*(?![\w*])/gs, '$1')
    .replace(/`([^`]+)`/g, '$1')
    .replace(/^#{1,6}\s+/gm, '')
    .replace(/^>\s?/gm, '')
}
