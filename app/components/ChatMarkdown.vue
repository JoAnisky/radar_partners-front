<script setup lang="ts">
const props = defineProps<{ content: string }>()

const html = computed(() => renderMarkdown(props.content))
</script>

<template>
  <!-- eslint-disable vue/no-v-html -- markdown-it avec html: false, voir utils/markdown.ts -->
  <div
    class="chat-md"
    v-html="html"
  />
  <!-- eslint-enable vue/no-v-html -->
</template>

<style scoped>
.chat-md :deep(> :first-child) { margin-top: 0; }
.chat-md :deep(> :last-child) { margin-bottom: 0; }
.chat-md :deep(p) { margin: 0 0 0.5rem; }
.chat-md :deep(ul), .chat-md :deep(ol) { margin: 0 0 0.5rem; padding-left: 1.25rem; }
.chat-md :deep(ul) { list-style: disc; }
.chat-md :deep(ol) { list-style: decimal; }
.chat-md :deep(li) { margin: 0.125rem 0; }
.chat-md :deep(strong) { font-weight: 600; color: var(--ui-text-highlighted); }
.chat-md :deep(em) { font-style: italic; }
.chat-md :deep(a) { color: var(--ui-primary); text-decoration: underline; }
.chat-md :deep(code) { padding: 0.1rem 0.3rem; border-radius: 0.25rem; background: var(--ui-bg); font-size: 0.85em; }
.chat-md :deep(blockquote) { margin: 0 0 0.5rem; padding-left: 0.75rem; border-left: 3px solid var(--ui-border-accented); color: var(--ui-text-muted); }
.chat-md :deep(h1), .chat-md :deep(h2), .chat-md :deep(h3), .chat-md :deep(h4) { margin: 0.5rem 0 0.25rem; font-weight: 600; font-size: 1em; color: var(--ui-text-highlighted); }
.chat-md :deep(hr) { margin: 0.5rem 0; border-color: var(--ui-border); }
</style>
