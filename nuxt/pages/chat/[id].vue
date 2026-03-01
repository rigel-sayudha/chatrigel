<script setup lang="ts">
import { Chat } from '@ai-sdk/vue'
import { DefaultChatTransport } from 'ai'

definePageMeta({ layout: 'chat' })

const route = useRoute()
const router = useRouter()
const toast = useToast()
const chatId = computed(() => route.params.id as string)

const models = [
  { label: 'GPT-4o mini', value: 'openai/gpt-4o-mini', icon: 'i-simple-icons-openai' },
  { label: 'GPT-4o', value: 'openai/gpt-4o', icon: 'i-simple-icons-openai' },
  { label: 'Claude 3.5 Haiku', value: 'anthropic/claude-3-5-haiku', icon: 'i-simple-icons-anthropic' },
  { label: 'Gemini 2.0 Flash', value: 'google/gemini-2.0-flash-001', icon: 'i-simple-icons-google' },
]
const selectedModel = ref(
  models.find(m => m.value === (route.query.model as string)) || models[0]
)

const { data: chatData } = await useFetch(() => `/api/chats/${chatId.value}`, {
  key: `chat-${chatId.value}`,
})

if (!chatData.value) {
  throw createError({ statusCode: 404, statusMessage: 'Chat not found' })
}

const input = ref('')

const fileInput = ref<HTMLInputElement>()
const selectedFiles = ref<File[]>([])

function handleFileChange(e: Event) {
  const target = e.target as HTMLInputElement
  if (target.files?.length) {
    selectedFiles.value = [...selectedFiles.value, ...Array.from(target.files)]
  }
}

function removeFile(index: number) {
  selectedFiles.value.splice(index, 1)
}

const chat = new Chat({
  id: chatId.value,
  messages: (chatData.value?.messages || []).map((msg: any) => ({
    id: msg.id,
    role: msg.role,
    content: Array.isArray(msg.parts)
      ? msg.parts.filter((p: any) => p.type === 'text').map((p: any) => p.text).join('')
      : '',
    parts: msg.parts,
    toolInvocations: Array.isArray(msg.parts)
      ? msg.parts.filter((p: any) => p.type === 'tool-invocation').map((p: any) => p.toolInvocation)
      : undefined
  })),
  transport: new DefaultChatTransport({
    api: `/api/chats/${chatId.value}`,
    body: {
      get model() {
        return selectedModel.value.value
      }
    }
  }),
  onData: (dataPart) => {
    if (dataPart.type === 'data-chat-title') {
      refreshNuxtData('chats')
    }
  },
  onError: (err) => {
    toast.add({
      title: 'AI Error',
      description: err.message?.includes('key') ? 'AI_GATEWAY_API_KEY belum dikonfigurasi di .env' : 'Failed to get response',
      color: 'error',
    })
  },
})

const messages = computed(() => chat.messages)
const status = computed(() => chat.status)
const isStreaming = computed(() => status.value === 'streaming' || status.value === 'submitted')

function handleSubmit(e: Event) {
  e.preventDefault()
  if (input.value.trim() || selectedFiles.value.length > 0) {
    chat.sendMessage({
      text: input.value,
      files: selectedFiles.value.length > 0 ? selectedFiles.value : undefined
    })
    input.value = ''
    selectedFiles.value = []
  }
}

// Handle first message from query string
onMounted(async () => {
  const firstMessage = route.query.message as string
  if (firstMessage && messages.value.length === 0) {
    input.value = firstMessage
    router.replace({ query: {} })
    await nextTick()
    handleSubmit(new Event('submit') as any)
  }
})

const messagesEnd = ref<HTMLElement>()
watch(messages, () => {
  nextTick(() => messagesEnd.value?.scrollIntoView({ behavior: 'smooth' }))
}, { deep: true })

const pageTitle = computed(() => chatData.value?.title || 'New Chat')
useSeoMeta({ title: pageTitle })

function getTextContent(msg: any): string {
  if (typeof msg.content === 'string' && msg.content) return msg.content
  if (Array.isArray(msg.parts)) {
    return msg.parts.filter((p: any) => p.type === 'text').map((p: any) => p.text).join('')
  }
  return ''
}

function onKeydown(e: KeyboardEvent) {
  if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleSubmit(e as any) }
}

const stop = () => chat.stop()
</script>

<template>
  <UDashboardPanel
    id="chat"
    class="relative min-h-0"
    :ui="{ body: 'p-0 sm:p-0 overscroll-none' }"
  >
    <template #header>
      <!-- Navbar row -->
      <UDashboardNavbar class="border-b-0">
        <template #right>
          <AppTheme />
        </template>
      </UDashboardNavbar>
    </template>

    <template #body>
      <UContainer class="flex-1 flex flex-col h-full">
        <!-- Messages area -->
        <div class="flex-1 overflow-y-auto min-h-0">
          <div class="max-w-[700px] mx-auto px-2 py-8 space-y-6">
            <!-- Empty state -->
            <div v-if="messages.length === 0" class="flex items-center justify-center h-40">
              <p class="text-sm text-gray-400 dark:text-gray-500">Start the conversation below</p>
            </div>

            <template v-for="msg in messages" :key="msg.id">
              <!-- User message -->
              <div v-if="msg.role === 'user'" class="flex justify-end">
                <div class="max-w-[85%] bg-[var(--ui-bg-elevated)] text-[var(--ui-text)] rounded-2xl rounded-br-sm px-4 py-3 text-sm leading-relaxed ring-1 ring-[var(--ui-border)]">
                  <p class="whitespace-pre-wrap">{{ getTextContent(msg) }}</p>
                </div>
              </div>

              <!-- Assistant message -->
              <div v-else-if="msg.role === 'assistant'" class="flex gap-3">
                <div class="flex flex-col gap-3 flex-1 min-w-0">
                  <div class="text-sm text-[var(--ui-text)] leading-relaxed min-h-[1.5rem]">
                    <MDC
                      v-if="getTextContent(msg)"
                      :value="getTextContent(msg)"
                      class="prose prose-sm dark:prose-invert max-w-none prose-p:my-1 prose-li:my-0.5"
                    />

                    <!-- Handle Tool Invocations -->
                    <template v-if="msg.toolInvocations?.length">
                      <div v-for="toolInvocation in msg.toolInvocations" :key="toolInvocation.toolCallId" class="mt-4 first:mt-2">
                        <ChatWeatherCard
                          v-if="toolInvocation.toolName === 'weather'"
                          :toolInvocation="toolInvocation"
                        />
                        <ChatChartCard
                          v-else-if="toolInvocation.toolName === 'chart'"
                          :toolInvocation="toolInvocation"
                        />
                      </div>
                    </template>

                    <span v-if="!getTextContent(msg) && !msg.toolInvocations?.length && isStreaming" class="inline-flex gap-1 text-[var(--ui-text-muted)]">
                      <span class="w-1.5 h-1.5 rounded-full bg-current animate-bounce" style="animation-delay:0ms"/>
                      <span class="w-1.5 h-1.5 rounded-full bg-current animate-bounce" style="animation-delay:150ms"/>
                      <span class="w-1.5 h-1.5 rounded-full bg-current animate-bounce" style="animation-delay:300ms"/>
                    </span>
                  </div>
                  <!-- Copy button -->
                  <div v-if="getTextContent(msg)" class="flex">
                    <UButton
                      icon="i-lucide-copy"
                      color="neutral"
                      variant="ghost"
                      size="xs"
                      class="text-muted"
                      @click="navigator?.clipboard?.writeText(getTextContent(msg))"
                    />
                  </div>
                </div>
              </div>
            </template>

            <!-- Streaming thinking indicator -->
            <div v-if="isStreaming && messages[messages.length-1]?.role === 'user'" class="flex gap-3">
              <div class="flex items-center gap-1 text-[var(--ui-text-muted)] text-sm">
                <span class="w-1.5 h-1.5 rounded-full bg-current animate-bounce" style="animation-delay:0ms"/>
                <span class="w-1.5 h-1.5 rounded-full bg-current animate-bounce" style="animation-delay:150ms"/>
                <span class="w-1.5 h-1.5 rounded-full bg-current animate-bounce" style="animation-delay:300ms"/>
              </div>
            </div>

            <div ref="messagesEnd" />
          </div>
        </div>

        <!-- Input area sticky bottom -->
        <div class="shrink-0 pb-4">
          <div class="max-w-[700px] mx-auto">
            <form @submit.prevent="handleSubmit">
              <UChatPrompt
                v-model="input"
                :status="isStreaming ? 'streaming' : 'ready'"
                variant="subtle"
                :ui="{ base: 'px-1.5' }"
                class="sticky bottom-0 z-10"
                @submit="handleSubmit"
                @stop="stop"
              >
                <!-- File preview header -->
                <template v-if="selectedFiles.length > 0" #header>
                  <div class="flex flex-wrap gap-2">
                    <div v-for="(file, index) in selectedFiles" :key="index" class="flex items-center gap-2 px-2.5 py-1.5 rounded-lg bg-[var(--ui-bg-elevated)] border border-[var(--ui-border)] max-w-[200px]">
                      <UIcon name="i-lucide-file-text" class="w-3.5 h-3.5 text-[var(--ui-text-muted)] shrink-0" />
                      <span class="text-xs truncate text-[var(--ui-text-toned)]">{{ file.name }}</span>
                      <UButton icon="i-lucide-x" color="neutral" variant="ghost" size="xs" class="p-0.5" @click="removeFile(index)" />
                    </div>
                  </div>
                </template>

                <!-- Toolbar footer -->
                <template #footer>
                  <div class="flex items-center gap-1">
                    <!-- File upload -->
                    <input type="file" multiple ref="fileInput" class="hidden" @change="handleFileChange" />
                    <UButton
                      icon="i-lucide-paperclip"
                      color="neutral"
                      variant="ghost"
                      size="sm"
                      @click="fileInput?.click()"
                    />

                    <!-- Model selector -->
                    <UDropdownMenu
                      :items="models.map(m => ({ label: m.label, icon: m.icon, click: () => selectedModel = m }))"
                      :content="{ side: 'top', align: 'start' }"
                    >
                      <UButton
                        color="neutral"
                        variant="ghost"
                        size="sm"
                        :icon="selectedModel.icon"
                        :label="selectedModel.label"
                        trailing-icon="i-lucide-chevron-down"
                      />
                    </UDropdownMenu>
                  </div>

                  <UChatPromptSubmit
                    :status="isStreaming ? 'streaming' : 'ready'"
                    color="neutral"
                    size="sm"
                    :disabled="!input.trim() && selectedFiles.length === 0"
                    @stop="stop"
                  />
                </template>
              </UChatPrompt>
            </form>
          </div>
        </div>
      </UContainer>
    </template>
  </UDashboardPanel>
</template>
