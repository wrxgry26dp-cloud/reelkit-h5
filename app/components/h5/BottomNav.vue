<script setup lang="ts">
const props = defineProps<{
  active?: string
}>()

const tabs = [
  { key: 'home', label: '首页', to: '/' },
  { key: 'theater', label: '剧场', to: '/theater' },
  { key: 'mall', label: '商城', to: '/theater' },
  { key: 'earn', label: '赚钱', to: '/theater', badge: '赚' },
  { key: 'mine', label: '我的', to: '/profile' },
]
</script>

<template>
  <nav class="h5-tabbar" aria-label="底部导航">
    <NuxtLink
      v-for="tab in tabs"
      :key="tab.key"
      :to="tab.to"
      class="tab"
      :class="{ active: (props.active ?? 'home') === tab.key }"
    >
      <span class="label-wrap">
        <span v-if="tab.badge" class="badge">{{ tab.badge }}</span>
        <span v-if="tab.dot" class="dot" />
        <span class="label">{{ tab.label }}</span>
      </span>
    </NuxtLink>
  </nav>
</template>

<style scoped>
.h5-tabbar {
  position: fixed;
  left: 50%;
  bottom: 0;
  z-index: 100;
  transform: translateX(-50%);
  width: 100%;
  max-width: 480px;
  display: grid;
  grid-template-columns: repeat(5, 1fr);
  height: calc(52px + env(safe-area-inset-bottom, 0px));
  padding-bottom: env(safe-area-inset-bottom, 0px);
  background: #0b0d12;
  border-top: 1px solid rgba(255, 255, 255, 0.08);
  box-sizing: border-box;
}

.tab {
  display: flex;
  align-items: center;
  justify-content: center;
  min-width: 0;
  color: rgba(255, 255, 255, 0.45);
  font-size: 13px;
  font-weight: 500;
  text-decoration: none;
}

.tab.active {
  color: #fff;
  font-weight: 700;
}

.label-wrap {
  position: relative;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  padding: 4px 2px 0;
}

.label {
  line-height: 1;
  white-space: nowrap;
}

.badge {
  position: absolute;
  top: -8px;
  left: 50%;
  transform: translateX(6px);
  min-width: 18px;
  padding: 1px 5px;
  border-radius: 8px;
  background: #ff6a00;
  color: #fff;
  font-size: 9px;
  font-weight: 700;
  text-align: center;
  line-height: 1.4;
  white-space: nowrap;
}

.dot {
  position: absolute;
  top: -2px;
  right: -6px;
  width: 6px;
  height: 6px;
  border-radius: 50%;
  background: #ff3b30;
}
</style>
