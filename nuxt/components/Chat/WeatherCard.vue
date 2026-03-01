<script setup lang="ts">
import type { WeatherUIToolInvocation } from '~/shared/utils/tools/weather'

defineProps<{
  toolInvocation: WeatherUIToolInvocation
}>()
</script>

<template>
  <div class="flex flex-col gap-3 rounded-2xl border border-gray-200 dark:border-white/10 bg-white dark:bg-[#27272a] p-4 shadow-sm w-full max-w-[400px]">
    <!-- Loading state -->
    <div v-if="!('result' in toolInvocation)" class="flex items-center gap-3">
      <div class="w-10 h-10 rounded-full bg-gray-100 dark:bg-white/5 flex items-center justify-center animate-pulse">
        <UIcon name="i-lucide-loader-2" class="w-5 h-5 text-gray-400 animate-spin" />
      </div>
      <div>
        <p class="text-sm font-medium text-gray-900 dark:text-white">Checking weather...</p>
        <p class="text-xs text-gray-500">For {{ toolInvocation.args.location }}</p>
      </div>
    </div>

    <!-- Result state -->
    <div v-else class="flex flex-col gap-4">
      <div class="flex items-center justify-between">
        <div>
          <p class="text-sm font-medium text-gray-900 dark:text-white">{{ toolInvocation.result.location }}</p>
          <p class="text-2xl font-bold text-gray-900 dark:text-white">{{ toolInvocation.result.temperature }}&deg;</p>
        </div>
        <div class="flex flex-col items-end">
          <!-- Icon matching cond -->
          <UIcon
            :name="toolInvocation.result.condition.toLowerCase().includes('sun') ? 'i-lucide-sun' :
                   toolInvocation.result.condition.toLowerCase().includes('rain') ? 'i-lucide-cloud-rain' :
                   toolInvocation.result.condition.toLowerCase().includes('cloud') ? 'i-lucide-cloud' : 'i-lucide-cloud-fog'"
            class="w-10 h-10 text-primary"
          />
          <p class="text-sm font-medium text-gray-500">{{ toolInvocation.result.condition }}</p>
        </div>
      </div>
      
      <div class="grid grid-cols-4 gap-2 pt-3 border-t border-gray-100 dark:border-white/10">
        <template v-for="day in toolInvocation.result.forecast.slice(0, 4)" :key="day.day">
          <div class="flex flex-col items-center gap-1">
            <p class="text-xs text-gray-500">{{ day.day }}</p>
            <UIcon
              :name="day.condition.toLowerCase().includes('sun') ? 'i-lucide-sun' :
                     day.condition.toLowerCase().includes('rain') ? 'i-lucide-cloud-rain' :
                     day.condition.toLowerCase().includes('cloud') ? 'i-lucide-cloud' : 'i-lucide-cloud-fog'"
              class="w-5 h-5 text-gray-600 dark:text-gray-300"
            />
            <p class="text-xs font-medium text-gray-900 dark:text-white">{{ day.high }}&deg;</p>
            <p class="text-[10px] text-gray-400">{{ day.low }}&deg;</p>
          </div>
        </template>
      </div>
    </div>
  </div>
</template>
