<script setup lang="ts">
import { Chat } from '@ai-sdk/vue'
import { DefaultChatTransport } from 'ai'
definePageMeta({ layout: 'chat' })

const route = useRoute()
const router = useRouter()
const toast = useToast()
const chatId = computed(() => route.params.id as string)

const { data: chatData } = await useFetch(() => `/api/chats/${chatId.value}`, {
  key: `chat-${chatId.value}`,
})

const models = [
  { label: 'GPT-4o mini', value: 'openai/gpt-4o-mini', icon: 'i-simple-icons-openai' },
  { label: 'GPT-4o', value: 'openai/gpt-4o', icon: 'i-simple-icons-openai' },
  { label: 'Claude 3.5 Haiku', value: 'anthropic/claude-3-5-haiku', icon: 'i-simple-icons-anthropic' },
  { label: 'Gemini 2.0 Flash', value: 'google/gemini-2.0-flash-001', icon: 'i-simple-icons-google' },
]
const selectedModel = ref(
  models.find(m => m.value === (route.query.model as string)) || models[0]
)

const input = ref('')

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
const error = computed(() => chat.error)

const stop = () => chat.stop()

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

const isStreaming = computed(() => status.value === 'streaming' || status.value === 'submitted')
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
</script>

<template>
  <div class="flex flex-col h-full">
    <!-- Messages area -->
    <div class="flex-1 overflow-y-auto min-h-0">
      <div class="max-w-[700px] mx-auto px-6 py-8 space-y-6">
        <!-- Empty state -->
        <div v-if="messages.length === 0" class="flex items-center justify-center h-40">
          <p class="text-sm text-gray-400">Start the conversation below</p>
        </div>

        <template v-for="msg in messages" :key="msg.id">
          <!-- User message -->
          <div v-if="msg.role === 'user'" class="flex justify-end">
            <div class="max-w-[80%] bg-gray-100 dark:bg-white/10 text-gray-900 dark:text-white rounded-2xl rounded-br-sm px-4 py-3 text-sm leading-relaxed">
              <p class="whitespace-pre-wrap">{{ getTextContent(msg) }}</p>
            </div>
          </div>

          <!-- Assistant message -->
          <div v-else-if="msg.role === 'assistant'" class="flex gap-3">
            <div class="flex flex-col gap-2 flex-1 min-w-0">
              <div class="text-sm text-gray-900 dark:text-white leading-relaxed min-h-[1.5rem]">
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

                <span v-if="!getTextContent(msg) && !msg.toolInvocations?.length && isStreaming" class="inline-flex gap-1 text-gray-400">
                  <span class="w-1.5 h-1.5 rounded-full bg-current animate-bounce" style="animation-delay:0ms"/>
                  <span class="w-1.5 h-1.5 rounded-full bg-current animate-bounce" style="animation-delay:150ms"/>
                  <span class="w-1.5 h-1.5 rounded-full bg-current animate-bounce" style="animation-delay:300ms"/>
                </span>
              </div>
              <!-- Copy button -->
              <div v-if="getTextContent(msg)" class="flex">
                <button
                  class="w-6 h-6 rounded flex items-center justify-center text-gray-400 hover:text-gray-600 hover:bg-gray-100 dark:hover:bg-white/10 transition-colors"
                  title="Copy"
                  @click="navigator?.clipboard?.writeText(getTextContent(msg))"
                >
                  <UIcon name="i-lucide-copy" class="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          </div>
        </template>

        <!-- Streaming thinking indicator (when user just sent a message) -->
        <div v-if="isStreaming && messages[messages.length-1]?.role === 'user'" class="flex gap-3">
          <div class="flex items-center gap-1 text-gray-400 text-sm">
            <span class="w-1.5 h-1.5 rounded-full bg-gray-400 animate-bounce" style="animation-delay:0ms"/>
            <span class="w-1.5 h-1.5 rounded-full bg-gray-400 animate-bounce" style="animation-delay:150ms"/>
            <span class="w-1.5 h-1.5 rounded-full bg-gray-400 animate-bounce" style="animation-delay:300ms"/>
          </div>
        </div>

        <div ref="messagesEnd" />
      </div>
    </div>

    <!-- Input area (pinned bottom) -->
    <div class="shrink-0 border-t border-gray-100 dark:border-white/10 px-6 py-4">
      <div class="max-w-[700px] mx-auto">
        <form @submit.prevent="handleSubmit">
          <div class="rounded-xl border border-gray-200 dark:border-white/15 bg-white dark:bg-[#27272a] overflow-hidden shadow-xs">
            
            <!-- Context files preview display -->
            <div v-if="selectedFiles.length > 0" class="flex flex-wrap gap-2 px-4 pt-4 pb-2 border-b border-gray-100 dark:border-white/10">
              <div v-for="(file, index) in selectedFiles" :key="index" class="flex items-center gap-2 px-2.5 py-1.5 rounded-lg bg-gray-50 dark:bg-white/5 border border-gray-200 dark:border-white/10 max-w-[200px]">
                <UIcon name="i-lucide-file-text" class="w-3.5 h-3.5 text-gray-400 shrink-0" />
                <span class="text-xs truncate text-gray-600 dark:text-gray-300">{{ file.name }}</span>
                <button type="button" @click="removeFile(index)" class="shrink-0 p-0.5 mt-0.5 rounded text-gray-400 hover:text-red-500 hover:bg-gray-200 dark:hover:bg-white/10 transition-colors">
                  <UIcon name="i-lucide-x" class="w-3.5 h-3.5" />
                </button>
              </div>
            </div>

            <!-- Textarea row -->
            <textarea
              v-model="input"
              rows="2"
              placeholder="Type your message here..."
              class="w-full px-4 pt-3 pb-1 text-sm text-gray-900 dark:text-white bg-transparent resize-none outline-none placeholder:text-gray-400 dark:placeholder:text-gray-500 leading-relaxed"
              :disabled="isStreaming"
              @keydown="onKeydown"
            />
            <!-- Toolbar row -->
            <div class="flex items-center gap-2 px-3 py-2 border-t border-gray-100 dark:border-white/10">
              <!-- Paperclip / File Input -->
              <input type="file" multiple ref="fileInput" class="hidden" @change="handleFileChange" />
              <button @click="fileInput?.click()" type="button" class="w-7 h-7 flex items-center justify-center rounded-md text-gray-400 hover:text-gray-600 hover:bg-gray-100 dark:hover:bg-white/10 transition-colors">
                <UIcon name="i-lucide-paperclip" class="w-4 h-4" />
              </button>
              
              <!-- Model selector -->
              <UDropdownMenu
                :items="models.map(m => ({ label: m.label, icon: m.icon, click: () => selectedModel = m }))"
                :content="{ side: 'top', align: 'start' }"
              >
                <button type="button" class="flex items-center gap-1.5 px-2 py-1 rounded-md text-xs font-medium text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-white/10 transition-colors">
                  <UIcon :name="selectedModel.icon" class="w-3.5 h-3.5" />
                  {{ selectedModel.label }}
                  <UIcon name="i-lucide-chevron-down" class="w-3 h-3 opacity-60" />
                </button>
              </UDropdownMenu>
              <div class="flex-1" />
              <!-- Stop or send -->
              <button
                v-if="isStreaming"
                type="button"
                class="w-8 h-8 rounded-lg flex items-center justify-center bg-gray-900 dark:bg-white text-white dark:text-gray-900 hover:bg-gray-700 transition-colors"
                @click="stop"
              >
                <UIcon name="i-lucide-square" class="w-3.5 h-3.5" />
              </button>
              <button
                v-else
                type="submit"
                class="w-8 h-8 rounded-lg flex items-center justify-center transition-colors"
                :class="(input.trim() || selectedFiles.length > 0)
                  ? 'bg-gray-900 dark:bg-white text-white dark:text-gray-900 hover:bg-gray-700 dark:hover:bg-gray-100'
                  : 'bg-gray-200 dark:bg-white/20 text-gray-400 cursor-not-allowed'"
                :disabled="!input.trim() && selectedFiles.length === 0"
              >
                <UIcon name="i-lucide-arrow-up" class="w-4 h-4" />
              </button>
            </div>
          </div>
        </form>
        <p class="text-[11px] text-center text-gray-400 mt-2">
          AI can make mistakes. Verify important information.
        </p>
      </div>
    </div>
  </div>
</template>
