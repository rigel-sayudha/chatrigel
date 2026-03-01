<script setup lang="ts">
definePageMeta({ layout: 'chat' })

const router = useRouter()
const toast = useToast()
const loading = ref(false)
const input = ref('')

const models = [
  { label: 'GPT-4o mini', value: 'openai/gpt-4o-mini', icon: 'i-simple-icons-openai' },
  { label: 'GPT-4o', value: 'openai/gpt-4o', icon: 'i-simple-icons-openai' },
  { label: 'Claude 3.5 Haiku', value: 'anthropic/claude-3-5-haiku', icon: 'i-simple-icons-anthropic' },
  { label: 'Gemini 2.0 Flash', value: 'google/gemini-2.0-flash-001', icon: 'i-simple-icons-google' },
]
const selectedModel = ref(models[0])

const suggestions = [
  { icon: 'i-simple-icons-nuxtdotjs', label: 'Why use Nuxt UI?', prompt: 'Why should I use Nuxt UI for my project?' },
  { icon: 'i-simple-icons-vuedotjs', label: 'Help me create a Vue composable', prompt: 'Help me create a Vue composable for managing local state' },
  { icon: 'i-simple-icons-unjs', label: 'Tell me more about UnJS', prompt: 'Tell me more about UnJS' },
  { icon: 'i-simple-icons-vueuse', label: 'Why should I consider VueUse?', prompt: 'Why should I consider VueUse?' },
  { icon: 'i-simple-icons-tailwindcss', label: 'Tailwind CSS best practices', prompt: 'What are the best practices when using Tailwind CSS?' },
  { icon: 'i-lucide-sun', label: 'What is the weather in Bordeaux?', prompt: 'What is the weather like in Bordeaux right now?' },
  { icon: 'i-lucide-line-chart', label: 'Show me a chart of sales data', prompt: 'Show me a sample bar chart of monthly sales data' },
]

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

async function startChat(prompt?: string) {
  const msg = prompt || input.value.trim()
  if (!msg && selectedFiles.value.length === 0) return
  loading.value = true
  try {
    const chat = await $fetch<{ id: string }>('/api/chats', { method: 'POST' })
    // Currently, we don't pass files through the router to avoid URL bloat.
    // The query string supports passing the initial message string to [id].vue
    await router.push({ path: `/chat/${chat.id}`, query: { message: msg, model: selectedModel.value.value } })
  } catch {
    toast.add({ title: 'Error', description: 'Failed to start chat.', color: 'error' })
    loading.value = false
  }
}

function onKeydown(e: KeyboardEvent) {
  if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); startChat() }
}
</script>

<template>
  <div class="flex flex-col items-center justify-center h-full px-6 pb-8">
    <!-- Heading -->
    <h1 class="text-3xl font-bold text-gray-900 dark:text-white mb-6 text-center">
      How can I help you today?
    </h1>

    <!-- Input box (matches reference exactly) -->
    <div class="w-full max-w-[600px]">
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
          :disabled="loading"
          @keydown="onKeydown"
        />
        <!-- Toolbar row -->
        <div class="flex items-center gap-2 px-3 py-2 border-t border-gray-100 dark:border-white/10">
          <!-- Paperclip -->
          <input type="file" multiple ref="fileInput" class="hidden" @change="handleFileChange" />
          <button @click="fileInput?.click()" class="w-7 h-7 flex items-center justify-center rounded-md text-gray-400 hover:text-gray-600 hover:bg-gray-100 dark:hover:bg-white/10 transition-colors">
            <UIcon name="i-lucide-paperclip" class="w-4 h-4" />
          </button>
          <!-- Model selector -->
          <UDropdownMenu
            :items="models.map(m => ({ label: m.label, icon: m.icon, click: () => selectedModel = m }))"
            :content="{ side: 'top', align: 'start' }"
          >
            <button class="flex items-center gap-1.5 px-2 py-1 rounded-md text-xs font-medium text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-white/10 transition-colors">
              <UIcon :name="selectedModel.icon" class="w-3.5 h-3.5" />
              {{ selectedModel.label }}
              <UIcon name="i-lucide-chevron-down" class="w-3 h-3 opacity-60" />
            </button>
          </UDropdownMenu>
          <div class="flex-1" />
          <!-- Send button -->
          <button
            class="w-8 h-8 rounded-lg flex items-center justify-center transition-colors"
            :class="(input.trim() || selectedFiles.length > 0) && !loading
              ? 'bg-gray-900 dark:bg-white text-white dark:text-gray-900 hover:bg-gray-700 dark:hover:bg-gray-100'
              : 'bg-gray-200 dark:bg-white/20 text-gray-400 cursor-not-allowed'"
            :disabled="(!input.trim() && selectedFiles.length === 0) || loading"
            @click="startChat()"
          >
            <UIcon v-if="loading" name="i-lucide-loader-2" class="w-4 h-4 animate-spin" />
            <UIcon v-else name="i-lucide-arrow-up" class="w-4 h-4" />
          </button>
        </div>
      </div>

      <!-- Suggestion pills -->
      <div class="flex flex-wrap items-center justify-center gap-2 mt-4">
        <button
          v-for="s in suggestions"
          :key="s.label"
          class="flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium text-gray-700 dark:text-gray-300 ring-1 ring-gray-200 dark:ring-white/15 bg-white dark:bg-transparent hover:bg-gray-50 dark:hover:bg-white/5 hover:ring-gray-300 transition-all"
          :disabled="loading"
          @click="startChat(s.prompt)"
        >
          <UIcon :name="s.icon" class="w-3.5 h-3.5 shrink-0" />
          {{ s.label }}
        </button>
      </div>
    </div>
  </div>
</template>
