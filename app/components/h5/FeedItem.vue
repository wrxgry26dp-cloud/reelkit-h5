<script setup lang="ts">
import type { FeedItem } from '~/types/feed.types'

const PREVIEW_SECONDS = 10

const props = defineProps<{
  item: FeedItem
  active: boolean
}>()

const emit = defineEmits<{
  openSeries: []
  advance: []
}>()

const user = useSupabaseUser()
const route = useRoute()
const { showLogin } = useLoginModal()
const { t, locale } = useI18n()
const { isLiked, isFavorited, toggleLike, toggleFavorite, shareDrama } = useFeedActions()

const videoRef = ref<HTMLVideoElement | null>(null)
const progress = ref(0)
const expanded = ref(false)
const muted = ref(true)
const paywalled = ref(false)
const advanced = ref(false)
const isPlaying = ref(false)
const playError = ref('')
const needsTap = ref(false)
const toast = ref('')
let toastTimer: ReturnType<typeof setTimeout> | null = null

const liked = computed(() => isLiked(props.item.dramaId))
const favorited = computed(() => isFavorited(props.item.dramaId))

const isPaid = computed(() => !props.item.isFree)
const priceLabel = computed(() => {
  const coins = props.item.coinPrice || 0
  return coins > 0 ? t('unlockWithCoins', { n: coins }) : t('unlockEpisode')
})

const likeCount = computed(() => {
  const base = Math.max(1200, (props.item.dramaTitle.length * 1371) % 18000)
  return formatCount(liked.value ? base + 1 : base)
})

const collectCount = computed(() => {
  const base = Math.max(800, (props.item.slug.length * 2203) % 67000)
  return formatCount(favorited.value ? base + 1 : base)
})

function formatCount(n: number) {
  if (locale.value === 'ja') {
    if (n >= 10000) return `${(n / 10000).toFixed(1)}万`
    if (n >= 1000) return `${(n / 1000).toFixed(1)}千`
    return String(n)
  }
  if (n >= 1000000) return `${(n / 1000000).toFixed(1)}M`
  if (n >= 1000) return `${(n / 1000).toFixed(1)}K`
  return String(n)
}

function showToast(message: string) {
  toast.value = message
  if (toastTimer) clearTimeout(toastTimer)
  toastTimer = setTimeout(() => {
    toast.value = ''
  }, 1600)
}

function requireLogin(): boolean {
  if (user.value) return true
  showLogin(route.fullPath || '/')
  return false
}

function onToggleLike() {
  if (!requireLogin()) return
  const next = toggleLike(props.item.dramaId)
  showToast(next ? t('liked') : t('unliked'))
}

function onToggleFavorite() {
  if (!requireLogin()) return
  const next = toggleFavorite(props.item.dramaId)
  showToast(next ? t('favorited') : t('unfavorited'))
}

async function onShare() {
  const result = await shareDrama({
    title: props.item.dramaTitle,
    dramaId: props.item.dramaId,
  })
  if (result === 'copied') showToast(t('linkCopied'))
  else if (result === 'shared') showToast(t('shared'))
  else if (result === 'failed') showToast(t('shareFailed'))
}

async function playVideo(forceMuted = false) {
  const el = videoRef.value
  if (!el || paywalled.value) return
  playError.value = ''
  el.playsInline = true
  el.setAttribute('playsinline', 'true')
  el.setAttribute('webkit-playsinline', 'true')
  if (forceMuted) muted.value = true
  el.muted = muted.value
  el.defaultMuted = muted.value
  try {
    await el.play()
    isPlaying.value = true
    needsTap.value = false
  } catch {
    muted.value = true
    el.muted = true
    el.defaultMuted = true
    try {
      await el.play()
      isPlaying.value = true
      needsTap.value = false
    } catch (e) {
      isPlaying.value = false
      needsTap.value = true
      playError.value = e instanceof Error ? e.message : t('tapToPlay')
    }
  }
}

function lockPreview() {
  const el = videoRef.value
  if (!el) return
  paywalled.value = true
  isPlaying.value = false
  el.pause()
  if (el.currentTime > PREVIEW_SECONDS) {
    el.currentTime = PREVIEW_SECONDS
  }
  progress.value = el.duration
    ? Math.min(100, (PREVIEW_SECONDS / el.duration) * 100)
    : progress.value
}

function requestAdvance() {
  if (!props.active || advanced.value || paywalled.value) return
  advanced.value = true
  isPlaying.value = false
  videoRef.value?.pause()
  emit('advance')
}

watch(
  () => props.active,
  async (active) => {
    const el = videoRef.value
    if (!el) return
    if (active) {
      paywalled.value = false
      advanced.value = false
      needsTap.value = false
      playError.value = ''
      el.loop = false
      try {
        el.currentTime = 0
      } catch {
        /* ignore seek before ready */
      }
      progress.value = 0
      await nextTick()
      // 等资源就绪再播
      if (el.readyState >= 2) await playVideo(true)
      else {
        const onCanPlay = () => {
          el.removeEventListener('canplay', onCanPlay)
          if (props.active) void playVideo(true)
        }
        el.addEventListener('canplay', onCanPlay)
        el.load()
      }
    } else {
      el.pause()
      isPlaying.value = false
      try {
        el.currentTime = 0
      } catch {
        /* ignore */
      }
      progress.value = 0
      paywalled.value = false
      advanced.value = false
      needsTap.value = false
    }
  },
)

function onTimeUpdate() {
  const el = videoRef.value
  if (!el || !props.active) return

  isPlaying.value = !el.paused
  const duration = el.duration || 0
  const clipEnd = duration > 0 ? Math.min(PREVIEW_SECONDS, duration) : PREVIEW_SECONDS
  progress.value = duration ? Math.min(100, (el.currentTime / duration) * 100) : 0

  if (paywalled.value || advanced.value) return
  if (el.currentTime < clipEnd - 0.05) return

  if (isPaid.value) {
    lockPreview()
    return
  }

  requestAdvance()
}

function onEnded() {
  if (!props.active || paywalled.value || advanced.value) return
  if (isPaid.value) {
    lockPreview()
    return
  }
  requestAdvance()
}

function onLoadedData() {
  if (props.active) void playVideo(true)
}

function onVideoError() {
  isPlaying.value = false
  needsTap.value = true
  playError.value = t('videoLoadFailed')
}

async function onTapPlay() {
  if (paywalled.value) return
  await playVideo()
}

async function toggleMute() {
  if (paywalled.value) return
  if (!isPlaying.value) {
    await playVideo()
    return
  }
  muted.value = !muted.value
  if (videoRef.value) {
    videoRef.value.muted = muted.value
    if (props.active) await playVideo()
  }
}

function onBuy() {
  if (!user.value) {
    showLogin(route.fullPath || '/')
    return
  }
  navigateTo(`/drama/${props.item.dramaId}`)
}

onBeforeUnmount(() => {
  if (toastTimer) clearTimeout(toastTimer)
})

onMounted(async () => {
  const el = videoRef.value
  if (!el) return
  el.loop = false
  el.muted = true
  el.defaultMuted = true
  if (props.active) await playVideo(true)
})
</script>

<template>
  <article class="feed-item">
    <video
      ref="videoRef"
      class="video"
      :key="item.videoUrl"
      :src="item.videoUrl"
      :poster="isPlaying ? undefined : (item.coverUrl ?? undefined)"
      playsinline
      webkit-playsinline
      preload="auto"
      :muted="muted"
      @loadeddata="onLoadedData"
      @canplay="onLoadedData"
      @timeupdate="onTimeUpdate"
      @ended="onEnded"
      @error="onVideoError"
      @playing="isPlaying = true"
      @pause="isPlaying = false"
      @click="onTapPlay"
    />

    <div class="scrim" aria-hidden="true" />

    <button
      v-if="needsTap && !paywalled"
      class="tap-play"
      type="button"
      @click.stop="onTapPlay"
    >
      <span class="tap-icon">▶</span>
      <span>{{ playError || t('tapToPlay') }}</span>
    </button>

    <button
      v-if="!paywalled"
      class="mute-btn"
      type="button"
      @click.stop="toggleMute"
    >
      {{ muted ? t('mute') : t('sound') }}
    </button>

    <div v-if="paywalled" class="paywall">
      <div class="paywall-card">
        <p class="paywall-title">{{ t('previewEnded') }}</p>
        <p class="paywall-desc">{{ t('previewPaidDesc') }}</p>
        <button class="buy-btn" type="button" @click.stop="onBuy">
          {{ priceLabel }}
        </button>
        <p v-if="!user" class="paywall-tip">{{ t('loginFirstTip') }}</p>
      </div>
    </div>

    <aside v-show="!paywalled" class="actions" :aria-label="t('share')">
      <button type="button" class="action" @click.stop="onToggleLike">
        <span class="icon" :class="{ liked }">
          <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12 21s-7.2-4.4-9.4-9A5.4 5.4 0 0 1 12 6.2 5.4 5.4 0 0 1 21.4 12C19.2 16.6 12 21 12 21z" fill="currentColor"/></svg>
        </span>
        <span>{{ likeCount }}</span>
      </button>
      <button type="button" class="action" @click.stop="onToggleFavorite">
        <span class="icon" :class="{ favorited }">
          <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12 3l2.4 5 5.6.8-4 4 .9 5.6L12 16.8 7.1 18.4l.9-5.6-4-4 5.6-.8L12 3z" fill="currentColor"/></svg>
        </span>
        <span>{{ collectCount }}</span>
      </button>
      <button type="button" class="action" @click.stop="onShare">
        <span class="icon">
          <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M14 5l7 7-7 7M21 12H9M9 5H4v14h5" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"/></svg>
        </span>
        <span>{{ t('share') }}</span>
      </button>
    </aside>

    <div v-if="toast" class="toast">{{ toast }}</div>

    <div class="meta">
      <button class="title" type="button" @click="emit('openSeries')">
        {{ item.dramaTitle }}
        <span>›</span>
      </button>

      <div v-if="item.tags.length" class="tags">
        <span v-for="tag in item.tags.slice(0, 3)" :key="tag" class="tag">{{ tag }}</span>
        <span v-if="isPaid" class="tag tag-paid">{{ t('paidTag') }}</span>
      </div>

      <p class="desc" :class="{ open: expanded }" @click="expanded = !expanded">
        {{ t('episodeN', { n: item.episodeNumber }) }}
        <template v-if="item.synopsis">｜{{ item.synopsis }}</template>
        <span class="more">{{ expanded ? t('collapse') : t('expand') }}</span>
      </p>

      <button class="series-bar" type="button" @click="emit('openSeries')">
        <span class="play">▶</span>
        {{ t('watchFullSeries', { n: item.episodeCount }) }}
        <span class="chev">›</span>
      </button>

      <div class="progress" aria-hidden="true">
        <i :style="{ width: `${progress}%` }" />
      </div>
    </div>
  </article>
</template>

<style scoped>
.feed-item {
  position: relative;
  height: 100%;
  width: 100%;
  overflow: hidden;
  background: #000;
  scroll-snap-align: start;
  scroll-snap-stop: always;
}

.video {
  position: absolute;
  inset: 0;
  width: 100%;
  height: 100%;
  object-fit: cover;
  background: #111;
}

.scrim {
  position: absolute;
  inset: 0;
  background:
    linear-gradient(180deg, rgba(0, 0, 0, 0.35) 0%, transparent 18%),
    linear-gradient(0deg, rgba(0, 0, 0, 0.78) 0%, rgba(0, 0, 0, 0.35) 28%, transparent 48%);
  pointer-events: none;
}

.mute-btn {
  position: absolute;
  top: calc(54px + env(safe-area-inset-top, 0px));
  left: 14px;
  z-index: 5;
  border: 0;
  border-radius: 999px;
  padding: 6px 10px;
  background: rgba(0, 0, 0, 0.45);
  color: rgba(255, 255, 255, 0.9);
  font-size: 11px;
}

.tap-play {
  position: absolute;
  left: 50%;
  top: 42%;
  z-index: 8;
  transform: translate(-50%, -50%);
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 10px;
  border: 0;
  background: transparent;
  color: #fff;
  font-size: 14px;
  font-weight: 600;
}

.tap-icon {
  width: 64px;
  height: 64px;
  border-radius: 50%;
  display: grid;
  place-items: center;
  background: rgba(0, 0, 0, 0.55);
  font-size: 22px;
  padding-left: 4px;
}

.paywall {
  position: absolute;
  inset: 0;
  z-index: 20;
  display: grid;
  place-items: center;
  padding: 24px;
  background: rgba(0, 0, 0, 0.62);
  backdrop-filter: blur(4px);
}

.paywall-card {
  width: min(100%, 300px);
  text-align: center;
  color: #fff;
}

.paywall-title {
  margin: 0;
  font-size: 22px;
  font-weight: 800;
}

.paywall-desc {
  margin: 10px 0 0;
  color: rgba(255, 255, 255, 0.72);
  font-size: 14px;
  line-height: 1.5;
}

.buy-btn {
  margin-top: 22px;
  width: 100%;
  border: 0;
  border-radius: 999px;
  padding: 14px 18px;
  background: linear-gradient(135deg, #ff8a1f, #ff4d00);
  color: #fff;
  font-size: 16px;
  font-weight: 800;
}

.paywall-tip {
  margin: 12px 0 0;
  color: rgba(255, 255, 255, 0.45);
  font-size: 12px;
}

.actions {
  position: absolute;
  right: 10px;
  bottom: 168px;
  z-index: 5;
  display: flex;
  flex-direction: column;
  gap: 18px;
  align-items: center;
}

.action {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 4px;
  border: 0;
  background: transparent;
  color: #fff;
  font-size: 11px;
  text-shadow: 0 1px 3px rgba(0, 0, 0, 0.55);
}

.icon {
  width: 42px;
  height: 42px;
  border-radius: 50%;
  display: grid;
  place-items: center;
  background: rgba(255, 255, 255, 0.12);
  backdrop-filter: blur(8px);
  color: #fff;
}

.icon svg {
  width: 20px;
  height: 20px;
}

.icon.liked {
  color: #ff3b5c;
  background: rgba(255, 59, 92, 0.2);
}

.icon.favorited {
  color: #ffb020;
  background: rgba(255, 176, 32, 0.2);
}

.toast {
  position: absolute;
  left: 50%;
  top: 46%;
  z-index: 25;
  transform: translate(-50%, -50%);
  padding: 10px 16px;
  border-radius: 999px;
  background: rgba(0, 0, 0, 0.72);
  color: #fff;
  font-size: 13px;
  font-weight: 600;
  pointer-events: none;
  white-space: nowrap;
}

.meta {
  position: absolute;
  left: 0;
  right: 0;
  bottom: calc(52px + env(safe-area-inset-bottom, 0px));
  z-index: 5;
  padding: 0 14px 8px;
  padding-right: 72px;
}

.title {
  display: inline-flex;
  align-items: center;
  gap: 4px;
  max-width: 100%;
  border: 0;
  background: transparent;
  color: #fff;
  font-size: 16px;
  font-weight: 700;
  text-align: left;
  padding: 0;
}

.tags {
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
  margin-top: 8px;
}

.tag {
  padding: 3px 8px;
  border-radius: 4px;
  background: rgba(255, 255, 255, 0.14);
  color: rgba(255, 255, 255, 0.88);
  font-size: 11px;
}

.tag-paid {
  background: rgba(255, 122, 26, 0.25);
  color: #ffb070;
}

.desc {
  margin: 8px 0 0;
  color: rgba(255, 255, 255, 0.78);
  font-size: 13px;
  line-height: 1.45;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
}

.desc.open {
  display: block;
  -webkit-line-clamp: unset;
}

.more {
  margin-left: 4px;
  color: rgba(255, 255, 255, 0.55);
}

.series-bar {
  margin-top: 12px;
  width: 100%;
  display: flex;
  align-items: center;
  gap: 8px;
  border: 0;
  border-radius: 8px;
  padding: 10px 12px;
  background: rgba(40, 40, 40, 0.88);
  color: #fff;
  font-size: 13px;
  font-weight: 600;
  text-align: left;
}

.play {
  color: #ff8a1f;
  font-size: 11px;
}

.chev {
  margin-left: auto;
  opacity: 0.7;
}

.progress {
  margin-top: 10px;
  height: 2px;
  border-radius: 999px;
  background: rgba(255, 255, 255, 0.22);
  overflow: hidden;
}

.progress i {
  display: block;
  height: 100%;
  background: #fff;
  border-radius: inherit;
}
</style>
