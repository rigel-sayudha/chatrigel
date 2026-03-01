<script setup lang="ts">
definePageMeta({
  middleware: [
    function (to, from) {
      return navigateTo('/chat')
    }
  ]
})
</script>

<template>
  <div></div>
</template>
