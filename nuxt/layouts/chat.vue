<script setup lang="ts">
const route = useRoute()
const toast = useToast()

// Sidebar state
const sidebarCollapsed = ref(false)

const { data: chats, refresh: refreshChats } = await useFetch('/api/chats', {
  key: 'chats',
  transform: (data: any[]) => data.map(chat => ({
    id: chat.id,
    label: chat.title || 'Untitled',
    to: `/chat/${chat.id}`,
    createdAt: chat.createdAt,
  })),
})

const { groups } = useChats(chats as any)

watch(() => route.path, () => {
  refreshChats()
})

async function deleteChat(id: string) {
  try {
    await $fetch(`/api/chats/${id}`, { method: 'DELETE' })
    toast.add({ title: 'Chat deleted', icon: 'i-lucide-trash' })
    refreshChats()
    if (route.params.id === id) navigateTo('/chat')
  } catch {
    toast.add({ title: 'Error', description: 'Failed to delete chat', color: 'error' })
  }
}
</script>

<template>
  <div class="flex h-screen w-screen overflow-hidden bg-[#f3f4f6] dark:bg-[#09090b]">
    <!-- Sidebar -->
    <aside
      class="flex flex-col shrink-0 transition-all duration-300 overflow-hidden"
      :class="sidebarCollapsed ? 'w-0' : 'w-[200px]'"
    >
      <div class="flex flex-col h-full w-[200px]">
        <!-- Sidebar header -->
        <div class="flex items-center justify-between px-3 py-3 h-[52px]">
          <NuxtLink to="/chat" class="flex items-center gap-1.5 font-bold text-[15px] text-gray-900 dark:text-white">
            <UIcon name="i-lucide-bot" class="w-5 h-5 text-primary-500 shrink-0" />
            <span>Chat<span class="text-primary-500">Rigel</span></span>
          </NuxtLink>
          <button class="w-7 h-7 rounded-md flex items-center justify-center text-gray-500 hover:text-gray-700 hover:bg-gray-200/70 dark:hover:bg-white/10 transition-colors">
            <UIcon name="i-lucide-search" class="w-4 h-4" />
          </button>
        </div>

        <!-- New chat button -->
        <div class="px-2 pb-2">
          <NuxtLink
            to="/chat"
            class="flex items-center justify-center w-full py-1.5 rounded-lg text-sm font-medium text-primary bg-primary/10 hover:bg-primary/15 transition-colors"
          >
            New chat
          </NuxtLink>
        </div>

        <!-- Chat history -->
        <div class="flex-1 overflow-y-auto px-2 py-1 space-y-3">
          <template v-for="group in groups" :key="group.label">
            <div>
              <p class="text-[11px] font-medium text-gray-400 dark:text-gray-500 uppercase tracking-wider px-2 py-1">
                {{ group.label }}
              </p>
              <div class="space-y-px">
                <div v-for="chat in group.items" :key="chat.id" class="group relative flex items-center">
                  <NuxtLink
                    :to="chat.to"
                    class="flex-1 px-2 py-1.5 rounded-lg text-sm truncate transition-colors"
                    :class="route.path === chat.to
                      ? 'bg-white dark:bg-white/10 text-gray-900 dark:text-white shadow-xs font-medium'
                      : 'text-gray-600 dark:text-gray-400 hover:bg-white/60 dark:hover:bg-white/5'"
                  >
                    {{ chat.label }}
                  </NuxtLink>
                  <button
                    class="absolute right-1 opacity-0 group-hover:opacity-100 w-5 h-5 rounded flex items-center justify-center text-gray-400 hover:text-gray-600 hover:bg-gray-200 dark:hover:bg-white/10 transition-all"
                    @click.prevent="deleteChat(chat.id)"
                  >
                    <UIcon name="i-lucide-x" class="w-3 h-3" />
                  </button>
                </div>
              </div>
            </div>
          </template>
          <div v-if="!groups.length" class="px-2 py-4 text-center text-xs text-gray-400">
            No chats yet
          </div>
        </div>

        <!-- Footer -->
        <div class="p-2 border-t border-gray-200/70 dark:border-white/10">
          <button class="flex items-center gap-2 w-full px-2 py-2 rounded-lg text-sm text-gray-600 dark:text-gray-400 hover:bg-white/60 dark:hover:bg-white/5 transition-colors">
            <UIcon name="i-simple-icons-github" class="w-4 h-4 shrink-0" />
            <span>Login with GitHub</span>
          </button>
        </div>
      </div>
    </aside>

    <!-- Main content wrapper -->
    <div class="flex-1 flex flex-col min-w-0 m-2 ml-0 rounded-xl overflow-hidden bg-white dark:bg-[#18181b] shadow-sm ring-1 ring-gray-200/80 dark:ring-white/10">
      <div class="flex items-center h-[52px] px-3 shrink-0">
        <button
          class="w-8 h-8 rounded-lg flex items-center justify-center text-gray-500 hover:text-gray-700 hover:bg-gray-100 dark:hover:bg-white/10 transition-colors"
          :title="sidebarCollapsed ? 'Show sidebar' : 'Hide sidebar'"
          @click="sidebarCollapsed = !sidebarCollapsed"
        >
          <UIcon name="i-lucide-panel-left" class="w-4 h-4" />
        </button>
        <div class="flex-1" />
        <AppTheme />
      </div>

      <!-- Page content -->
      <div class="flex-1 min-h-0 overflow-hidden">
        <slot />
      </div>
    </div>
  </div>
</template>
