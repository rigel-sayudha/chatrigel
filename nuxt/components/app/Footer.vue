<script lang="ts" setup></script>
<template>
  <footer
    class="bg-background/75 border-t border-dashed border-gray-200/80 dark:border-gray-800/80"
  >
    <UContainer>
      <div class="flex items-center gap-2 items-end justify-center">
        <span> ChatRigel &copy; {{ new Date().getFullYear() }} </span>
        <USeparator orientation="vertical" />
        <NuxtLink to="https://github.com/rigel-sayudha/chatrigel" target="_blank" class="hover:text-primary"> GitHub </NuxtLink>
      </div>
    </UContainer>
  </footer>
</template>
