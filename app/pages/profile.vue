<script setup lang="ts">
const client = useSupabaseClient()
const user = useSupabaseUser()
const { t } = useI18n()
const { showLogin } = useLoginModal()

const { data: profile, refresh } = await useAsyncData('me', async () => {
  if (!user.value) return null
  const { data } = await client.from('profiles').select('*').eq('id', user.value.id).maybeSingle()
  return data
}, { watch: [user] })

const { data: unlocks } = await useAsyncData('my-unlocks', async () => {
  if (!user.value) return []
  const { data } = await client
    .from('episode_unlocks')
    .select('id,coins_spent,created_at, episode:episodes(episode_number,title,drama_id)')
    .eq('user_id', user.value.id)
    .order('created_at', { ascending: false })
  return data || []
}, { watch: [user] })

watch(user, () => refresh())
</script>

<template>
  <div class="mine">
    <header class="head">
      <h1>{{ t('personalCenter') }}</h1>
    </header>

    <template v-if="!user">
      <div class="guest-card">
        <p class="guest-tip">{{ t('guestTip') }}</p>
        <button class="signin-btn" type="button" @click="showLogin('/profile')">
          {{ t('signIn') }}
        </button>
      </div>
    </template>

    <template v-else>
      <div class="info-card">
        <div class="email">{{ profile?.email }}</div>
        <div class="balance">
          {{ t('balance') }}:
          <strong>{{ profile?.coin_balance ?? 0 }}</strong>
          {{ t('coins') }}
        </div>
      </div>

      <h2 class="section-title">{{ t('watchHistory') }}</h2>
      <div class="episode-list">
        <div v-for="u in unlocks" :key="u.id" class="episode-item">
          <span>EP{{ (u as any).episode?.episode_number }} · {{ (u as any).episode?.title }}</span>
          <span class="muted">-{{ u.coins_spent }} {{ t('coins') }}</span>
        </div>
        <p v-if="!unlocks?.length" class="empty">—</p>
      </div>
    </template>

    <H5BottomNav active="mine" />
  </div>
</template>

<style scoped>
.mine {
  position: relative;
  min-height: 100dvh;
  max-width: 480px;
  margin: 0 auto;
  background: #0b0d12;
  color: #fff;
  padding: 20px 16px calc(72px + env(safe-area-inset-bottom, 0px));
  box-sizing: border-box;
  font-family: 'Noto Sans SC', 'PingFang SC', 'Segoe UI', sans-serif;
}

.head h1 {
  margin: 0 0 20px;
  font-size: 24px;
  font-weight: 800;
  line-height: 1.2;
}

.guest-card {
  display: flex;
  flex-direction: column;
  align-items: stretch;
  gap: 16px;
  padding: 20px 16px;
  border-radius: 14px;
  background: #151820;
  border: 1px solid rgba(255, 255, 255, 0.08);
}

.guest-tip {
  margin: 0;
  color: rgba(255, 255, 255, 0.65);
  font-size: 14px;
  line-height: 1.5;
}

.signin-btn {
  width: 100%;
  height: 48px;
  border: 0;
  border-radius: 999px;
  background: linear-gradient(135deg, #ff8a1f, #ee2737);
  color: #fff;
  font-size: 16px;
  font-weight: 800;
  cursor: pointer;
}

.info-card {
  display: grid;
  gap: 8px;
  padding: 16px;
  border-radius: 14px;
  background: #151820;
  border: 1px solid rgba(255, 255, 255, 0.08);
}

.email {
  font-size: 15px;
  font-weight: 600;
  word-break: break-all;
}

.balance {
  color: rgba(255, 255, 255, 0.75);
  font-size: 14px;
}

.balance strong {
  color: #ffb020;
  font-size: 18px;
}

.section-title {
  margin: 22px 0 12px;
  font-size: 18px;
  font-weight: 700;
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
}
</style>
