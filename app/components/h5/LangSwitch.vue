<script setup lang="ts">
const { locale, setLocale, LOCALES } = useI18n()
const open = ref(false)
const rootRef = ref<HTMLElement | null>(null)

const current = computed(() => LOCALES.find(l => l.code === locale.value) || LOCALES[LOCALES.length - 1])

function pick(code: typeof LOCALES[number]['code']) {
  setLocale(code)
  open.value = false
}

function onDocClick(e: MouseEvent) {
  if (!rootRef.value?.contains(e.target as Node)) open.value = false
}

onMounted(() => document.addEventListener('click', onDocClick))
onBeforeUnmount(() => document.removeEventListener('click', onDocClick))
</script>

<template>
  <div ref="rootRef" class="lang-switch">
    <button
      class="lang-btn"
      type="button"
      :aria-expanded="open"
      aria-haspopup="listbox"
      @click.stop="open = !open"
    >
      <span>{{ current.code.toUpperCase() }}</span>
      <span class="caret" aria-hidden="true" />
    </button>
    <ul v-if="open" class="lang-menu" role="listbox">
      <li
        v-for="l in LOCALES"
        :key="l.code"
        role="option"
        :aria-selected="l.code === locale"
        :class="{ active: l.code === locale }"
        @click.stop="pick(l.code)"
      >
        <span class="code">{{ l.code.toUpperCase() }}</span>
        <span class="name">{{ l.label }}</span>
      </li>
    </ul>
  </div>
</template>

<style scoped>
.lang-switch {
  position: relative;
  z-index: 40;
}

.lang-btn {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  height: 32px;
  padding: 0 10px;
  border: 0;
  border-radius: 999px;
  background: rgba(0, 0, 0, 0.45);
  color: #fff;
  font-size: 12px;
  font-weight: 800;
  letter-spacing: 0.04em;
  cursor: pointer;
}

.caret {
  width: 6px;
  height: 6px;
  border-right: 1.5px solid currentColor;
  border-bottom: 1.5px solid currentColor;
  transform: rotate(45deg);
  margin-top: -3px;
  opacity: 0.85;
}

.lang-menu {
  position: absolute;
  top: calc(100% + 8px);
  left: 0;
  margin: 0;
  padding: 6px;
  list-style: none;
  min-width: 148px;
  border-radius: 12px;
  background: rgba(18, 18, 22, 0.96);
  border: 1px solid rgba(255, 255, 255, 0.12);
  box-shadow: 0 12px 28px rgba(0, 0, 0, 0.45);
  backdrop-filter: blur(10px);
}

.lang-menu li {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 10px 10px;
  border-radius: 8px;
  cursor: pointer;
  color: rgba(255, 255, 255, 0.82);
  font-size: 13px;
}

.lang-menu li:hover,
.lang-menu li.active {
  background: rgba(255, 255, 255, 0.1);
  color: #fff;
}

.code {
  width: 28px;
  font-weight: 800;
  font-size: 11px;
  opacity: 0.9;
}

.name {
  white-space: nowrap;
}
</style>
