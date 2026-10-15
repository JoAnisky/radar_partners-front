<script setup lang="ts">
import type { ChatMessage, ChatReply } from '~/types/api'

definePageMeta({ title: 'Assistant' })

const api = useApi()
const toast = useToast()

const messages = ref<ChatMessage[]>([])
const input = ref('')
const busy = ref(false)

const suggestions = [
  'Quelles entreprises dois-je relancer ?',
  'Quelles sont les dernières offres à traiter ?',
  'Où en suis-je avec Atol CD ?',
  'Rédige un script d\'appel pour une ESN à contacter.',
]

async function send(text = input.value) {
  const content = text.trim()
  if (!content || busy.value) return

  messages.value.push({ role: 'user', content })
  input.value = ''
  busy.value = true
  try {
    const reply = await api<ChatReply>('/api/chat', {
      method: 'POST',
      body: { messages: messages.value.map(({ role, content }) => ({ role, content })) },
    })
    messages.value.push({ role: 'assistant', content: reply.reply, toolCalls: reply.toolCalls })
  }
  catch (error) {
    messages.value.pop()
    input.value = content
    toast.add({ title: errorMessage(error), color: 'error' })
  }
  finally {
    busy.value = false
  }
}

async function copy(content: string) {
  await navigator.clipboard.writeText(content)
  toast.add({ title: 'Copié', color: 'success' })
}

const describeCall = (call: ChatReply['toolCalls'][number]) =>
  `${call.name}(${Object.entries(call.arguments).map(([key, value]) => `${key}: ${JSON.stringify(value)}`).join(', ')})`
</script>

<template>
  <div class="mx-auto flex max-w-3xl flex-col gap-4">
    <div
      v-if="!messages.length"
      class="space-y-3"
    >
      <p class="text-muted">
        Interroge ta base (entreprises, relances, offres) ou demande un script d'appel, un mail ou un message LinkedIn. Le modèle tourne en local : rien ne quitte ta machine.
      </p>
      <div class="flex flex-wrap gap-2">
        <UButton
          v-for="suggestion in suggestions"
          :key="suggestion"
          :label="suggestion"
          color="neutral"
          variant="outline"
          size="sm"
          @click="send(suggestion)"
        />
      </div>
    </div>

    <div
      v-for="(message, index) in messages"
      :key="index"
      class="flex"
      :class="message.role === 'user' ? 'justify-end' : 'justify-start'"
    >
      <UCard
        class="max-w-[85%]"
        :ui="{ body: 'p-3 sm:p-3 space-y-2' }"
      >
        <p class="whitespace-pre-wrap">
          {{ message.content }}
        </p>
        <template v-if="message.role === 'assistant'">
          <details
            v-if="message.toolCalls?.length"
            class="text-xs text-muted"
          >
            <summary class="cursor-pointer">
              {{ message.toolCalls.length }} outil(s) appelé(s)
            </summary>
            <ul class="mt-1 space-y-0.5 font-mono">
              <li
                v-for="(call, callIndex) in message.toolCalls"
                :key="callIndex"
              >
                {{ describeCall(call) }}
              </li>
            </ul>
          </details>
          <UButton
            label="Copier"
            icon="i-lucide-copy"
            color="neutral"
            variant="ghost"
            size="xs"
            @click="copy(message.content)"
          />
        </template>
      </UCard>
    </div>

    <p
      v-if="busy"
      class="text-sm text-muted"
    >
      Le modèle réfléchit…
    </p>

    <form
      class="sticky bottom-4 flex items-end gap-2"
      @submit.prevent="send()"
    >
      <UTextarea
        v-model="input"
        :rows="2"
        autoresize
        placeholder="Pose ta question… (Entrée pour envoyer, Maj+Entrée pour un retour à la ligne)"
        class="flex-1"
        :disabled="busy"
        @keydown.enter.exact.prevent="send()"
      />
      <UButton
        type="submit"
        label="Envoyer"
        icon="i-lucide-send"
        :loading="busy"
        :disabled="!input.trim()"
      />
      <UButton
        v-if="messages.length"
        icon="i-lucide-rotate-ccw"
        color="neutral"
        variant="ghost"
        aria-label="Nouvelle conversation"
        :disabled="busy"
        @click="messages = []"
      />
    </form>
  </div>
</template>
