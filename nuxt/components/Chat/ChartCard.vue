<script setup lang="ts">
import { computed } from 'vue'

const props = defineProps<{
  toolInvocation: any
}>()

const result = computed(() => props.toolInvocation.result)
const isLoaded = computed(() => 'result' in props.toolInvocation)
</script>

<template>
  <div class="flex flex-col gap-3 rounded-2xl border border-gray-200 dark:border-white/10 bg-white dark:bg-[#27272a] p-4 shadow-sm w-full max-w-[500px]">
    <!-- Loading state -->
    <div v-if="!isLoaded" class="flex items-center gap-3">
      <div class="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center animate-pulse">
        <UIcon name="i-lucide-bar-chart-2" class="w-5 h-5 text-primary animate-pulse" />
      </div>
      <div>
        <p class="text-sm font-medium text-gray-900 dark:text-white">Generating chart...</p>
        <p class="text-xs text-gray-500">Retrieving monthly sales data</p>
      </div>
    </div>

    <!-- Result state -->
    <div v-else class="flex flex-col h-full w-full">
      <div class="mb-4">
        <h3 class="text-sm font-semibold text-gray-900 dark:text-white">{{ result.title }}</h3>
        <p class="text-xs text-gray-500">Sales vs Expenses</p>
      </div>
      
      <!-- Simple CSS Bar Chart implementation since no chart library is installed yet -->
      <div class="flex items-end gap-2 h-40 mt-2">
        <template v-for="item in result.data" :key="item.month">
          <div class="flex flex-col items-center justify-end flex-1 h-full gap-1 group relative">
            <div class="absolute -top-10 scale-0 group-hover:scale-100 transition-transform bg-gray-900 text-white text-[10px] px-2 py-1 rounded-md z-10 text-center pointer-events-none w-max">
              Sales: ${{ item.sales }}<br>
              Exp: ${{ item.expenses }}
            </div>
            <div class="w-full flex justify-center items-end gap-0.5 h-[calc(100%-1.5rem)]">
               <div 
                 class="w-[40%] bg-primary hover:bg-primary/80 transition-all rounded-t-sm"
                 :style="{ height: `${Math.min(100, (item.sales / 6000) * 100)}%` }"
               />
               <div 
                 class="w-[40%] bg-orange-400 hover:bg-orange-500 transition-all rounded-t-sm"
                 :style="{ height: `${Math.min(100, (item.expenses / 6000) * 100)}%` }"
               />
            </div>
            
            <p class="text-[10px] text-gray-500 font-medium">{{ item.month }}</p>
          </div>
        </template>
      </div>

      <div class="flex items-center justify-center gap-4 mt-4 pt-4 border-t border-gray-100 dark:border-white/10 text-[10px] font-medium text-gray-600 dark:text-gray-400">
        <div class="flex items-center gap-1.5 hover:text-gray-900 dark:hover:text-white cursor-help">
          <div class="w-2.5 h-2.5 rounded-full bg-primary" /> Sales Data
        </div>
        <div class="flex items-center gap-1.5 hover:text-gray-900 dark:hover:text-white cursor-help">
          <div class="w-2.5 h-2.5 rounded-full bg-orange-400" /> Operational Expenses
        </div>
      </div>
    </div>
  </div>
</template>
