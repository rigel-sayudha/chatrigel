<template>
  <div class="min-h-screen flex flex-col">
    <AppHeader />
    <UContainer as="main" class="flex-grow py-4 sm:py-7 flex flex-col">
      <slot />
    </UContainer>
    <AppFooter />
  </div>
</template>
