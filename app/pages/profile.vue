<script setup lang="ts">
import type { Profile } from '~/types/database.types'

type FavDrama = {
  id: string
  title: string
  cover_url: string | null
  slug?: string | null
}

type UnlockRow = {
  id: string
  coins_spent: number
  created_at: string
  episode: {
    episode_number: number
    title: string
    drama_id: string
  } | null
}

const client = useSupabaseClient()
const user = useSupabaseUser()
const { t, locale } = useI18n()

const loggingOut = ref(false)
const tip = ref('')

const { data: profile, refresh } = await useAsyncData('me', async () => {
  if (!user.value) return null
  const { data } = await client.from('profiles').select('*').eq('id', user.value.id).maybeSingle()
  return data as Profile | null
}, { watch: [user] })

const { data: unlocks, refresh: refreshUnlocks } = await useAsyncData('my-unlocks', async () => {
  if (!user.value) return [] as UnlockRow[]
  const { data } = await client
    .from('episode_unlocks')
    .select('id,coins_spent,created_at, episode:episodes(episode_number,title,drama_id)')
    .eq('user_id', user.value.id)
    .order('created_at', { ascending: false })
  return (data || []) as UnlockRow[]
}, { watch: [user] })

const { data: favoriteDramas, refresh: refreshFavorites } = await useAsyncData(
  'my-favorites',
  async () => {
    const ids = favoritedIds.value
    if (!ids.length) return [] as FavDrama[]
    const { data } = await client
      .from('dramas')
      .select('id,title,cover_url,slug')
      .in('id', ids)
      .eq('status', 'published')
    const rows = (data || []) as FavDrama[]
    const order = new Map(ids.map((id, i) => [id, i]))
    return rows.sort((a, b) => (order.get(a.id) ?? 0) - (order.get(b.id) ?? 0))
  },
  { watch: [favoritedIds] },
)

onMounted(() => {
  refreshFavorites()
})

watch(user, () => {
  refresh()
  refreshUnlocks()
  refreshFavorites()
})

const displayName = computed(() => {
  const p = profile.value
  const name = p?.display_name || p?.username || ''
  if (name) return name
  const email = user.value?.email || p?.email || ''
  if (email.includes('@')) return email.split('@')[0] || t('displayNameFallback')
  return t('displayNameFallback')
})

const emailText = computed(() => user.value?.email || profile.value?.email || '')

const avatarLetter = computed(() => {
  const raw = displayName.value.trim()
  return (raw[0] || 'R').toUpperCase()
})

const coinBalance = computed(() => Number(profile.value?.coin_balance ?? 0))

async function logout() {
  if (loggingOut.value) return
  loggingOut.value = true
  try {
    await client.auth.signOut()
    await navigateTo('/')
  } finally {
    loggingOut.value = false
  }
}

function onRecharge() {
  tip.value = t('rechargeSoon')
  window.setTimeout(() => {
    if (tip.value === t('rechargeSoon')) tip.value = ''
  }, 2200)
}
</script>

<template>
  <div class="mine">
    <header class="head">
      <div class="head-row">
        <h1>{{ t('personalCenter') }}</h1>
        <H5LangSwitch />
      </div>
    </header>

    <template v-if="!user">
      <section class="profile-card guest">
        <div class="avatar" aria-hidden="true">?</div>
        <div class="meta">
          <strong>{{ t('displayNameFallback') }}</strong>
          <p>{{ t('guestTip') }}</p>
        </div>
      </section>
      <button class="signin-btn" type="button" @click="showLogin('/profile')">
        {{ t('signIn') }}
      </button>
    </template>

    <template v-else>
      <section class="profile-card">
        <div class="avatar" aria-hidden="true">{{ avatarLetter }}</div>
        <div class="meta">
          <strong>{{ displayName }}</strong>
          <p>{{ emailText }}</p>
        </div>
      </section>

      <section class="coin-card">
        <div>
          <p class="coin-label">{{ t('balance') }}</p>
          <p class="coin-value">
            <strong>{{ coinBalance }}</strong>
            <span>{{ t('coins') }}</span>
          </p>
        </div>
        <button class="coin-btn" type="button" @click="onRecharge">+</button>
      </section>
      <p v-if="tip" class="tip">{{ tip }}</p>

      <section class="panel">
        <div class="panel-head">
          <h2>{{ t('myFavorites') }}</h2>
          <span class="count">{{ favoriteDramas?.length || 0 }}</span>
        </div>

        <div v-if="favoriteDramas?.length" class="fav-grid">
          <NuxtLink
            v-for="drama in favoriteDramas"
            :key="drama.id"
            class="fav-card"
            :to="`/drama/${drama.id}`"
          >
            <img
              v-if="drama.cover_url"
              :src="drama.cover_url"
              :alt="drama.title"
            >
            <div v-else class="fav-placeholder">{{ drama.title.slice(0, 1) }}</div>
            <span>{{ drama.title }}</span>
          </NuxtLink>
        </div>
        <p v-else class="empty">{{ t('noFavorites') }}</p>
      </section>

      <section class="panel">
        <div class="panel-head">
          <h2>{{ t('watchHistory') }}</h2>
          <span class="count">{{ unlocks?.length || 0 }}</span>
        </div>

        <div v-if="unlocks?.length" class="episode-list">
          <div v-for="u in unlocks" :key="u.id" class="episode-item">
            <span>EP{{ u.episode?.episode_number }} · {{ u.episode?.title }}</span>
            <span class="muted">-{{ u.coins_spent }} {{ t('coins') }}</span>
          </div>
        </div>
        <p v-else class="empty">{{ t('noUnlocks') }}</p>
      </section>

      <button class="logout-btn" type="button" :disabled="loggingOut" @click="logout">
        {{ loggingOut ? '…' : t('signOut') }}
      </button>
    </template>

    <H5BottomNav :key="locale" active="mine" />
  </div>
</template>

<style scoped>
.mine {
  position: relative;
  min-height: 100dvh;
  max-width: 480px;
  margin: 0 auto;
  background:
    radial-gradient(900px 320px at 50% -10%, rgba(255, 122, 26, 0.18), transparent 60%),
    #0b0d12;
  color: #fff;
  padding: 20px 16px calc(88px + env(safe-area-inset-bottom, 0px));
  box-sizing: border-box;
  font-family: 'Noto Sans SC', 'PingFang SC', 'Segoe UI', sans-serif;
}

.head h1 {
  margin: 0;
  font-size: 24px;
  font-weight: 800;
  line-height: 1.2;
}

.head-row {
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 12px;
  margin-bottom: 18px;
}

.profile-card {
  display: flex;
  align-items: center;
  gap: 14px;
  padding: 16px;
  border-radius: 16px;
  background: rgba(21, 24, 32, 0.95);
  border: 1px solid rgba(255, 255, 255, 0.08);
}

.avatar {
  width: 64px;
  height: 64px;
  border-radius: 50%;
  display: grid;
  place-items: center;
  flex-shrink: 0;
  background: linear-gradient(135deg, #ff8a1f, #ee2737);
  color: #fff;
  font-size: 26px;
  font-weight: 800;
  box-shadow: 0 8px 20px rgba(238, 39, 55, 0.28);
}

.meta {
  min-width: 0;
}

.meta strong {
  display: block;
  font-size: 18px;
  font-weight: 800;
  margin-bottom: 4px;
}

.meta p {
  margin: 0;
  color: rgba(255, 255, 255, 0.55);
  font-size: 13px;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.signin-btn,
.logout-btn {
  width: 100%;
  height: 48px;
  margin-top: 16px;
  border: 0;
  border-radius: 999px;
  font-size: 16px;
  font-weight: 800;
  cursor: pointer;
}

.signin-btn {
  background: linear-gradient(135deg, #ff8a1f, #ee2737);
  color: #fff;
}

.logout-btn {
  margin-top: 22px;
  background: rgba(255, 255, 255, 0.06);
  color: rgba(255, 255, 255, 0.85);
  border: 1px solid rgba(255, 255, 255, 0.1);
}

.logout-btn:disabled {
  opacity: 0.6;
}

.coin-card {
  margin-top: 14px;
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  padding: 16px;
  border-radius: 16px;
  background: linear-gradient(135deg, rgba(255, 138, 31, 0.18), rgba(238, 39, 55, 0.12));
  border: 1px solid rgba(255, 176, 32, 0.28);
}

.coin-label {
  margin: 0 0 4px;
  color: rgba(255, 255, 255, 0.65);
  font-size: 12px;
}

.coin-value {
  margin: 0;
  display: flex;
  align-items: baseline;
  gap: 6px;
}

.coin-value strong {
  color: #ffb020;
  font-size: 28px;
  font-weight: 900;
  line-height: 1;
}

.coin-value span {
  color: rgba(255, 255, 255, 0.7);
  font-size: 13px;
}

.coin-btn {
  width: 40px;
  height: 40px;
  border: 0;
  border-radius: 50%;
  background: linear-gradient(135deg, #ff8a1f, #ff4d00);
  color: #fff;
  font-size: 24px;
  font-weight: 700;
  line-height: 1;
  cursor: pointer;
}

.tip {
  margin: 8px 2px 0;
  color: #ffb020;
  font-size: 12px;
}

.panel {
  margin-top: 18px;
}

.panel-head {
  display: flex;
  align-items: baseline;
  justify-content: space-between;
  margin-bottom: 12px;
}

.panel-head h2 {
  margin: 0;
  font-size: 17px;
  font-weight: 800;
}

.count {
  color: rgba(255, 255, 255, 0.4);
  font-size: 13px;
}

.fav-grid {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 10px;
}

.fav-card {
  display: grid;
  gap: 6px;
  color: inherit;
  text-decoration: none;
  min-width: 0;
}

.fav-card img,
.fav-placeholder {
  width: 100%;
  aspect-ratio: 3 / 4;
  border-radius: 10px;
  object-fit: cover;
  background: #1a1f2b;
}

.fav-placeholder {
  display: grid;
  place-items: center;
  font-size: 22px;
  font-weight: 800;
  color: rgba(255, 255, 255, 0.5);
}

.fav-card span {
  font-size: 12px;
  line-height: 1.3;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
}

.episode-list {
  display: grid;
  gap: 8px;
}

.episode-item {
  display: flex;
  justify-content: space-between;
  gap: 8px;
  align-items: center;
  padding: 12px;
  border: 1px solid rgba(255, 255, 255, 0.08);
  border-radius: 10px;
  background: #151820;
  font-size: 13px;
}

.muted {
  color: rgba(255, 255, 255, 0.45);
}

.empty {
  margin: 0;
  color: rgba(255, 255, 255, 0.4);
  font-size: 13px;
  line-height: 1.5;
}
</style>
