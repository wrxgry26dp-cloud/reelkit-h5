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
  <div class="container stack profile-page">
    <h1>{{ t('personalCenter') }}</h1>
    <template v-if="!user">
      <p class="muted">{{ t('guestTip') }}</p>
      <button class="btn" @click="showLogin('/profile')">{{ t('signIn') }}</button>
    </template>
    <template v-else>
      <div class="card stack" style="background:#121212; border:1px solid #222; border-radius:12px; padding:16px;">
        <div>{{ profile?.email }}</div>
        <div>{{ t('balance') }}: <strong>{{ profile?.coin_balance ?? 0 }}</strong> {{ t('coins') }}</div>
        <div class="muted">source: {{ profile?.client_source || 'h5' }}</div>
      </div>
      <h2>{{ t('watchHistory') }}</h2>
      <div class="episode-list">
        <div v-for="u in unlocks" :key="u.id" class="episode-item">
          <span>EP{{ (u as any).episode?.episode_number }} · {{ (u as any).episode?.title }}</span>
          <span class="muted">-{{ u.coins_spent }} {{ t('coins') }}</span>
        </div>
        <p v-if="!unlocks?.length" class="muted">—</p>
      </div>
    </template>
    <H5BottomNav active="mine" />
  </div>
</template>

<style scoped>
.profile-page {
  max-width: 480px;
  margin: 0 auto;
  min-height: 100dvh;
  padding-bottom: calc(72px + env(safe-area-inset-bottom, 0px));
  box-sizing: border-box;
}
</style>

