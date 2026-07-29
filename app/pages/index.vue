<script setup lang="ts">
const client = useSupabaseClient()
const { t, locale } = useI18n()

const { data: banners, refresh: refreshBanners } = await useAsyncData(
  () => `banners-${locale.value}`,
  () => fetchHomeBannersByLocale(client, locale.value),
  { server: false, default: () => [], watch: [locale] },
)

const { data: sections, pending, refresh: refreshSections } = await useAsyncData(
  () => `sections-${locale.value}`,
  () => fetchHomeSectionsByLocale(client, locale.value),
  { server: false, default: () => [], watch: [locale] },
)

watch(locale, () => {
  refreshBanners()
  refreshSections()
})

const hero = computed(() => banners.value?.[0])

function localizedSectionTitle(section: any) {
  const key = sectionTitleKey(section?.slug)
  return key ? t(key) : section?.title
}
</script>

<template>
  <div>
    <p class="muted" style="padding:8px 20px 0;">{{ t('guestTip') }}</p>
    <section class="hero">
      <div style="text-align:center;">
        <h1 class="hero-title">{{ hero?.title || 'ReelKit' }}</h1>
        <NuxtLink v-if="hero?.drama_id" class="btn light" :to="`/drama/${hero.drama_id}`">{{ t('play') }}</NuxtLink>
        <NuxtLink v-else class="btn light" to="/categories">{{ t('categories') }}</NuxtLink>
      </div>
    </section>

    <p v-if="pending" class="muted" style="padding:0 16px;">Loading...</p>
    <p v-else-if="!sections?.length && !banners?.length" class="muted" style="padding:0 16px;">{{ t('noContentForLocale') }}</p>
    <section v-for="section in sections" :key="section.id" class="section">
      <div class="section-head">
        <h2>{{ localizedSectionTitle(section) }}</h2>
        <NuxtLink class="muted" to="/categories">{{ t('viewAll') }}</NuxtLink>
      </div>
      <div class="rail">
        <NuxtLink v-for="d in section.dramas" :key="d.id" :to="`/drama/${d.id}`">
          <div class="poster" :style="d.cover_url ? { backgroundImage: `url(${d.cover_url})` } : {}">
            <span v-if="d.is_trending" class="tag">HOT</span>
          </div>
          <div class="card-title">{{ d.title }}</div>
        </NuxtLink>
      </div>
    </section>
  </div>
</template>
