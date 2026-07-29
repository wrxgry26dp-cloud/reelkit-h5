<script setup lang="ts">
const route = useRoute()
const hideChrome = computed(() => {
  const p = route.path
  return p === '/' || p.startsWith('/theater') || p.startsWith('/profile')
})
const fullBleed = computed(() => route.path === '/')
</script>

<template>
  <div class="shell" :class="{ 'feed-shell': fullBleed }">
    <AppHeader v-if="!hideChrome" />
    <NuxtPage />
    <LoginModal />
  </div>
</template>
