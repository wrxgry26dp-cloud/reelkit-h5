<script setup lang="ts">
import type { FeedItem } from '~/types/feed.types'

const props = defineProps<{
  items: FeedItem[]
}>()

const emit = defineEmits<{
  openSeries: [item: FeedItem]
}>()

const activeTab = ref<'recommend' | 'hot'>('recommend')
const activeIndex = ref(0)
const scrollerRef = ref<HTMLElement | null>(null)
const { t, locale } = useI18n()

const visibleItems = computed(() => {
  if (activeTab.value === 'hot') {
    return props.items.filter((i) => i.isTrending)
  }
  return props.items
})

let observer: IntersectionObserver | null = null

onMounted(() => {
  document.documentElement.classList.add('h5-feed-lock')
  document.body.classList.add('h5-feed-lock')

  observer = new IntersectionObserver(
    (entries) => {
      const visible = entries
        .filter((e) => e.isIntersecting && e.intersectionRatio >= 0.6)
        .sort((a, b) => b.intersectionRatio - a.intersectionRatio)[0]
      if (!visible?.target) return
      const idx = Number((visible.target as HTMLElement).dataset.index)
      if (!Number.isNaN(idx)) activeIndex.value = idx
    },
    {
      root: scrollerRef.value,
      threshold: [0.55, 0.75, 0.9],
    },
  )

  nextTick(() => {
    scrollerRef.value
      ?.querySelectorAll<HTMLElement>('[data-index]')
      .forEach((el) => observer?.observe(el))
  })
})

watch(visibleItems, async () => {
  activeIndex.value = 0
  await nextTick()
  observer?.disconnect()
  scrollerRef.value
    ?.querySelectorAll<HTMLElement>('[data-index]')
    .forEach((el) => observer?.observe(el))
  scrollerRef.value?.scrollTo({ top: 0, behavior: 'auto' })
})

function scrollToIndex(index: number) {
  const root = scrollerRef.value
  if (!root) return
  const slides = root.querySelectorAll<HTMLElement>('.slide[data-index]')
  if (!slides.length) return

  const targetIndex = ((index % slides.length) + slides.length) % slides.length
  const target = slides[targetIndex]
  activeIndex.value = targetIndex
  root.scrollTo({ top: target.offsetTop, behavior: 'smooth' })
}

function onAdvance() {
  scrollToIndex(activeIndex.value + 1)
}

onBeforeUnmount(() => {
  observer?.disconnect()
  document.documentElement.classList.remove('h5-feed-lock')
  document.body.classList.remove('h5-feed-lock')
})
</script>

<template>
  <div class="h5-feed">
    <header class="topbar">
      <H5LangSwitch />
      <div class="tabs" role="tablist">
        <button
          type="button"
          role="tab"
          :class="{ active: activeTab === 'hot' }"
          @click="activeTab = 'hot'"
        >
          {{ t('tabHot') }}
        </button>
        <button
          type="button"
          role="tab"
          :class="{ active: activeTab === 'recommend' }"
          @click="activeTab = 'recommend'"
        >
          {{ t('tabForYou') }}
        </button>
      </div>
      <NuxtLink class="icon-btn" to="/theater" aria-label="theater">{{ t('tabGrid') }}</NuxtLink>
    </header>

    <div ref="scrollerRef" class="scroller">
      <div
        v-for="(item, index) in visibleItems"
        :key="item.episodeId"
        class="slide"
        :data-index="index"
      >
        <H5FeedItem
          :item="item"
          :active="index === activeIndex"
          @open-series="emit('openSeries', item)"
          @advance="onAdvance"
        />
      </div>

      <div v-if="!visibleItems.length" class="empty">
        <p>{{ t('emptyFeed') }}</p>
      </div>
    </div>

    <H5BottomNav :key="locale" active="home" />
  </div>
</template>

<style scoped>
.topbar {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  z-index: 30;
  display: grid;
  grid-template-columns: auto 1fr auto;
  align-items: center;
  gap: 8px;
  padding: calc(8px + env(safe-area-inset-top, 0px)) 8px 8px;
  background: linear-gradient(180deg, rgba(0, 0, 0, 0.55), transparent);
  overflow: visible;
}

.h5-feed {
  position: relative;
  height: 100dvh;
  width: 100%;
  max-width: 480px;
  margin: 0 auto;
  background: #000;
  overflow: hidden;
  color: #fff;
  font-family: 'Noto Sans SC', 'PingFang SC', 'Microsoft YaHei', sans-serif;
  overscroll-behavior: none;
}

.icon-btn {
  display: grid;
  place-items: center;
  height: 36px;
  border: 0;
  background: transparent;
  color: #fff;
  font-size: 12px;
  font-weight: 700;
  text-decoration: none;
}

.tabs {
  display: flex;
  justify-content: center;
  gap: 22px;
}

.tabs button {
  position: relative;
  border: 0;
  background: transparent;
  color: rgba(255, 255, 255, 0.62);
  font-size: 16px;
  font-weight: 500;
  padding: 6px 0;
}

.tabs button.active {
  color: #fff;
  font-weight: 700;
}

.tabs button.active::after {
  content: '';
  position: absolute;
  left: 50%;
  bottom: 0;
  width: 18px;
  height: 2px;
  border-radius: 999px;
  background: #fff;
  transform: translateX(-50%);
}

.scroller {
  height: 100%;
  overflow-y: auto;
  overflow-x: hidden;
  scroll-snap-type: y mandatory;
  overscroll-behavior-y: contain;
  -webkit-overflow-scrolling: touch;
  touch-action: pan-y;
  scrollbar-width: none;
  -ms-overflow-style: none;
}

.scroller::-webkit-scrollbar {
  display: none;
  width: 0;
  height: 0;
  background: transparent;
}

.slide {
  height: 100%;
  scroll-snap-align: start;
  scroll-snap-stop: always;
}

.empty {
  height: 100%;
  display: grid;
  place-items: center;
  color: rgba(255, 255, 255, 0.6);
}
</style>
