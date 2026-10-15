<script setup lang="ts">
import type { ChatReply } from '~/types/api'

const { messages, open, busy, draft, company, avatarState, send, reset } = useChat()
const toast = useToast()

defineShortcuts({
  meta_j: { usingInput: true, handler: () => { open.value = !open.value } },
})

const suggestions = computed(() => company.value
  ? [
      `Où en suis-je avec ${company.value.name} (id ${company.value.id}) ?`,
      `Rédige un mail d'approche pour ${company.value.name} (id ${company.value.id}).`,
      `Rédige un script d'appel pour ${company.value.name} (id ${company.value.id}).`,
      `Rédige un message LinkedIn pour ${company.value.name} (id ${company.value.id}).`,
    ]
  : [
      'Quelles entreprises dois-je relancer ?',
      'Quelles sont les dernières offres à traiter ?',
      'Rédige un script d\'appel pour une ESN à contacter.',
    ])

const scroller = ref<HTMLElement>()
watch([() => messages.value.length, busy, open], async () => {
  await nextTick()
  if (scroller.value) scroller.value.scrollTop = scroller.value.scrollHeight
})

async function copy(content: string) {
  await navigator.clipboard.writeText(markdownToPlain(content))
  toast.add({ title: 'Copié', color: 'success' })
}

const describeCall = (call: ChatReply['toolCalls'][number]) =>
  `${call.name}(${Object.entries(call.arguments).map(([key, value]) => `${key}: ${JSON.stringify(value)}`).join(', ')})`
</script>

<template>
  <div>
    <section
      v-if="open"
      :aria-label="ASSISTANT_NAME"
      class="fixed right-8 bottom-28 z-50 flex h-[34rem] max-h-[calc(100vh-9rem)] w-[26rem] max-w-[calc(100vw-4rem)] flex-col overflow-hidden rounded-xl bg-elevated shadow-2xl ring ring-default"
    >
      <header class="flex items-center justify-between border-b border-default px-3 py-2">
        <p class="flex items-center gap-2 font-medium">
          <AmelioAvatar
            class="size-7"
            :state="avatarState"
          />
          {{ ASSISTANT_NAME }}
        </p>
        <div class="flex items-center gap-1">
          <UButton
            v-if="messages.length"
            icon="i-lucide-rotate-ccw"
            color="neutral"
            variant="ghost"
            size="xs"
            aria-label="Nouvelle conversation"
            :disabled="busy"
            @click="reset"
          />
          <UButton
            icon="i-lucide-x"
            color="neutral"
            variant="ghost"
            size="xs"
            :aria-label="`Fermer ${ASSISTANT_NAME}`"
            @click="open = false"
          />
        </div>
      </header>

      <div
        ref="scroller"
        class="flex-1 space-y-3 overflow-y-auto p-3"
      >
        <div
          v-if="!messages.length"
          class="space-y-3"
        >
          <p class="text-sm text-muted">
            Je suis {{ ASSISTANT_NAME }}. Interroge ta base ou demande-moi un script d'appel, un mail, un message LinkedIn. Je tourne en local : rien ne quitte ta machine.
          </p>
          <div class="flex flex-col items-start gap-2">
            <UButton
              v-for="suggestion in suggestions"
              :key="suggestion"
              :label="suggestion"
              color="neutral"
              variant="outline"
              size="sm"
              class="text-left"
              @click="send(suggestion)"
            />
          </div>
        </div>

        <div
          v-for="(message, index) in messages"
          :key="index"
          class="flex items-start gap-2"
          :class="message.role === 'user' ? 'justify-end' : 'justify-start'"
        >
          <AmelioAvatar
            v-if="message.role === 'assistant'"
            class="mt-1 size-6"
          />
          <div
            class="max-w-[90%] space-y-1.5 rounded-lg px-3 py-2 text-sm"
            :class="message.role === 'user' ? 'bg-primary/15' : 'bg-accented'"
          >
            <ChatMarkdown
              v-if="message.role === 'assistant'"
              :content="message.content"
            />
            <p
              v-else
              class="whitespace-pre-wrap"
            >
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
          </div>
        </div>

        <p
          v-if="busy"
          class="flex items-center gap-2 text-sm text-muted"
        >
          <AmelioAvatar
            class="size-6"
            state="thinking"
          />
          {{ ASSISTANT_NAME }} réfléchit…
        </p>
      </div>

      <form
        class="flex items-end gap-2 border-t border-default p-2"
        @submit.prevent="send()"
      >
        <UTextarea
          v-model="draft"
          :rows="1"
          autoresize
          :maxrows="5"
          placeholder="Pose ta question…"
          class="flex-1"
          :disabled="busy"
          @keydown.enter.exact.prevent="send()"
        />
        <UButton
          type="submit"
          icon="i-lucide-send"
          aria-label="Envoyer"
          :loading="busy"
          :disabled="!draft.trim()"
        />
      </form>
    </section>

    <UButton
      size="xl"
      class="fixed right-8 bottom-8 z-50 size-14 justify-center rounded-full p-0 shadow-lg"
      :aria-label="open ? `Fermer ${ASSISTANT_NAME}` : `Ouvrir ${ASSISTANT_NAME} (⌘J)`"
      @click="open = !open"
    >
      <UIcon
        v-if="open"
        name="i-lucide-x"
        class="size-6"
      />
      <AmelioAvatar
        v-else
        class="size-9"
        :state="avatarState"
      />
    </UButton>
  </div>
</template>
