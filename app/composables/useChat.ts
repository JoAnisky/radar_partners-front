import type { AvatarState } from '~/components/AmelioAvatar.vue'
import type { ChatMessage, ChatReply } from '~/types/api'

const STORAGE_KEY = 'radar-chat'
const MAX_SENT = 20
const MAX_STORED = 60

/** Conversation de l'assistant, partagée par toutes les pages et conservée dans le navigateur. */
export function useChat() {
  const api = useApi()
  const toast = useToast()
  const route = useRoute()

  const messages = useState<ChatMessage[]>('chat-messages', () => [])
  const open = useState('chat-open', () => false)
  const busy = useState('chat-busy', () => false)
  const draft = useState('chat-draft', () => '')
  const failed = useState('chat-failed', () => false)
  const company = useState<{ id: number, name: string } | null>('chat-company', () => null)
  const restored = useState('chat-restored', () => false)

  if (import.meta.client && !restored.value) {
    restored.value = true
    try {
      const saved = JSON.parse(localStorage.getItem(STORAGE_KEY) ?? '[]')
      if (Array.isArray(saved)) messages.value = saved
    }
    catch {
      // Stockage indisponible ou corrompu : on repart d'une conversation vide.
    }
    watch(messages, (value) => {
      try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(value.slice(-MAX_STORED)))
      }
      catch {
        // Quota ou navigation privée : la conversation reste en mémoire.
      }
    }, { deep: true })
  }

  async function send(text = draft.value) {
    const content = text.trim()
    if (!content || busy.value) return

    messages.value.push({ role: 'user', content })
    draft.value = ''
    busy.value = true
    failed.value = false
    try {
      const reply = await api<ChatReply>('/api/chat', {
        method: 'POST',
        body: {
          messages: messages.value.slice(-MAX_SENT).map(({ role, content }) => ({ role, content })),
          context: { page: route.meta.title as string | undefined, company: company.value ?? undefined },
        },
      })
      messages.value.push({ role: 'assistant', content: reply.reply, toolCalls: reply.toolCalls })
    }
    catch (error) {
      messages.value.pop()
      draft.value = content
      failed.value = true
      toast.add({ title: errorMessage(error), color: 'error' })
    }
    finally {
      busy.value = false
    }
  }

  const reset = () => {
    messages.value = []
    failed.value = false
  }

  const avatarState = computed<AvatarState>(() => (busy.value ? 'thinking' : failed.value ? 'error' : 'idle'))

  return { messages, open, busy, draft, company, avatarState, send, reset }
}
