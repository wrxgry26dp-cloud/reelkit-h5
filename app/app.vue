<script setup lang="ts">
const route = useRoute()
const hideChrome = computed(() => {
  const p = route.path
  return p === '/' || p.startsWith('/theater') || p.startsWith('/profile')
})
</script>

<template>
  <div class="shell" :class="{ 'feed-shell': hideChrome }">
    <AppHeader v-if="!hideChrome" />
    <NuxtPage />
    <LoginModal />
  </div>
</template>
