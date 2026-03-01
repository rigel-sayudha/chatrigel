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
  { icon: 'i-logos-nuxt-icon', label: 'Why use Nuxt UI?', prompt: 'Why should I use Nuxt UI for my project?' },
  { icon: 'i-logos-vue', label: 'Help me create a Vue composable', prompt: 'Help me create a Vue composable for managing local state' },
  { icon: 'i-logos-unjs', label: 'Tell me more about UnJS', prompt: 'Tell me more about UnJS' },
  { icon: 'i-logos-vueuse', label: 'Why should I consider VueUse?', prompt: 'Why should I consider VueUse?' },
  { icon: 'i-logos-tailwindcss-icon', label: 'Tailwind CSS best practices', prompt: 'What are the best practices when using Tailwind CSS?' },
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
  <UDashboardPanel
    id="home"
    class="min-h-0"
    :ui="{ body: 'p-0 sm:p-0' }"
  >
    <template #header>
      <UDashboardNavbar class="border-b-0">
        <template #right>
          <AppTheme />
        </template>
      </UDashboardNavbar>
    </template>

    <template #body>
      <UContainer class="flex-1 flex flex-col justify-center gap-4 sm:gap-6 py-8">
        <h1 class="text-3xl sm:text-4xl font-bold text-highlighted">
          How can I help you today?
        </h1>

        <UChatPrompt
          v-model="input"
          :status="loading ? 'streaming' : 'ready'"
          variant="subtle"
          class="[view-transition-name:chat-prompt]"
          :ui="{ base: 'px-1.5' }"
          @submit="startChat()"
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
              color="neutral"
              size="sm"
              :disabled="!input.trim() && selectedFiles.length === 0"
            />
          </template>
        </UChatPrompt>

        <!-- Suggestion chips -->
        <div class="flex flex-wrap gap-2">
          <UButton
            v-for="s in suggestions"
            :key="s.label"
            :icon="s.icon"
            :label="s.label"
            size="sm"
            color="neutral"
            variant="outline"
            class="rounded-full"
            :disabled="loading"
            @click="startChat(s.prompt)"
          />
        </div>
      </UContainer>
    </template>
  </UDashboardPanel>
</template>
