<script setup lang="ts">
import type { Drama } from '~/types/feed.types'

const { fetchHomeSections, fetchFeed } = useDramaFeed()
const { locale, t } = useI18n()
const dramas = ref<Drama[]>([])
const loading = ref(true)

useHead({ title: 'Theater · ReelKit' })

async function load() {
  loading.value = true
  try {
    const sections = await fetchHomeSections()
    const map = new Map<string, Drama>()
    for (const section of sections) {
      for (const item of section.items) {
        map.set(item.drama.id, item.drama)
      }
    }
    dramas.value = [...map.values()]
    if (!dramas.value.length) {
      const feed = await fetchFeed()
      dramas.value = feed.map((f) => ({
        id: f.dramaId,
        title: f.dramaTitle,
        slug: f.slug,
        synopsis: f.synopsis,
        cover_url: f.coverUrl,
        status: 'published',
        is_trending: f.isTrending,
        tags: f.tags,
      }))
    }
  } finally {
    loading.value = false
  }
}

onMounted(load)
watch(locale, load)
</script>

<template>
  <div class="theater">
    <header class="head">
      <div class="head-row">
        <div>
          <h1>{{ t('theaterTitle') }}</h1>
          <p>{{ t('theaterSubtitle') }}</p>
        </div>
        <H5LangSwitch />
      </div>
    </header>

    <div v-if="loading" class="hint">{{ t('loading') }}</div>

    <div v-else class="grid">
      <NuxtLink
        v-for="drama in dramas"
        :key="drama.id"
        class="card"
        :to="`/drama/${drama.id}`"
      >
        <img v-if="drama.cover_url" :src="drama.cover_url" :alt="drama.title">
        <div class="info">
          <strong>{{ drama.title }}</strong>
          <span>{{ (drama.tags || []).slice(0, 2).join(' · ') || '—' }}</span>
        </div>
      </NuxtLink>
    </div>

    <p v-if="!loading && !dramas.length" class="hint">{{ t('noDramas') }}</p>

    <H5BottomNav :key="locale" active="theater" />
  </div>
</template>

<style scoped>
.theater {
  position: relative;
  min-height: 100dvh;
  max-width: 480px;
  margin: 0 auto;
  background: #0b0d12;
  color: #fff;
  padding: 24px 20px calc(72px + env(safe-area-inset-bottom, 0px));
  font-family: 'Noto Sans SC', 'PingFang SC', sans-serif;
  box-sizing: border-box;
}
.head h1 { margin: 0; font-size: 28px; }
.head p { margin: 6px 0 20px; color: rgba(255, 255, 255, 0.55); }
.head-row { display: flex; justify-content: space-between; align-items: flex-start; gap: 12px; }
.hint { color: rgba(255, 255, 255, 0.5); }
.grid { display: grid; grid-template-columns: repeat(2, minmax(0, 1fr)); gap: 12px; }
.card {
  display: block;
  overflow: hidden;
  border-radius: 12px;
  background: #151820;
  color: inherit;
  text-decoration: none;
}
.card img { width: 100%; aspect-ratio: 3/4; object-fit: cover; display: block; background: #222; }
.info { padding: 10px; display: grid; gap: 4px; }
.info strong { font-size: 14px; line-height: 1.3; }
.info span { color: rgba(255,255,255,.55); font-size: 12px; }
</style>
