<script setup lang="ts">
import type { FeedItem } from '~/types/feed.types'

const { fetchFeed } = useDramaFeed()
const { locale, t } = useI18n()
const feed = ref<FeedItem[]>([])
const loading = ref(true)
const errorMsg = ref('')

useHead({
  title: 'ReelKit',
  meta: [{ name: 'description', content: 'Vertical short drama feed' }],
  link: [
    {
      rel: 'stylesheet',
      href: 'https://fonts.googleapis.com/css2?family=Noto+Sans+SC:wght@400;500;700;900&display=swap',
    },
  ],
})

async function load() {
  loading.value = true
  errorMsg.value = ''
  try {
    feed.value = await fetchFeed()
  } catch (e) {
    errorMsg.value = e instanceof Error ? e.message : 'Load failed'
  } finally {
    loading.value = false
  }
}

onMounted(load)
watch(locale, load)

function openSeries(item: FeedItem) {
  navigateTo(`/drama/${item.dramaId}`)
}
</script>

<template>
  <div>
    <div v-if="loading" class="boot">
      <div class="spinner" />
      <p>{{ t('loading') }}</p>
    </div>
    <div v-else-if="errorMsg" class="boot">
      <p>{{ errorMsg }}</p>
    </div>
    <H5VideoFeed v-else :items="feed" @open-series="openSeries" />
  </div>
</template>

<style scoped>
.boot {
  min-height: 100vh;
  display: grid;
  place-content: center;
  gap: 14px;
  color: rgba(255, 255, 255, 0.7);
  background: #000;
  text-align: center;
}
.spinner {
  width: 28px;
  height: 28px;
  margin: 0 auto;
  border-radius: 50%;
  border: 2px solid rgba(255, 255, 255, 0.2);
  border-top-color: #ff7a1a;
  animation: spin 0.8s linear infinite;
}
@keyframes spin { to { transform: rotate(360deg); } }
</style>
