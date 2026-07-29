<script setup lang="ts">
import type { LocaleCode } from '~/composables/useI18n'

const { locale, setLocale, LOCALES } = useI18n()
const open = ref(false)
const btnRef = ref<HTMLElement | null>(null)
const menuStyle = ref<Record<string, string>>({})

const current = computed(
  () => LOCALES.find(l => l.code === locale.value) || LOCALES.find(l => l.code === 'en')!,
)

function placeMenu() {
  const rect = btnRef.value?.getBoundingClientRect()
  if (!rect) return
  const left = Math.min(
    Math.max(8, Math.round(rect.left)),
    Math.max(8, window.innerWidth - 176),
  )
  menuStyle.value = {
    position: 'fixed',
    top: `${Math.round(rect.bottom + 6)}px`,
    left: `${left}px`,
    zIndex: '10000',
  }
}

function toggle() {
  open.value = !open.value
  if (open.value) nextTick(placeMenu)
}

function pick(code: LocaleCode) {
  setLocale(code)
  open.value = false
}

function onDocPointer(e: Event) {
  const target = e.target as Node
  if (btnRef.value?.contains(target)) return
  if (document.getElementById('h5-lang-menu')?.contains(target)) return
  open.value = false
}

function onResize() {
  if (open.value) placeMenu()
}

onMounted(() => {
  document.addEventListener('pointerdown', onDocPointer, true)
  window.addEventListener('resize', onResize)
  window.addEventListener('scroll', onResize, true)
})

onBeforeUnmount(() => {
  document.removeEventListener('pointerdown', onDocPointer, true)
  window.removeEventListener('resize', onResize)
  window.removeEventListener('scroll', onResize, true)
})
</script>

<template>
  <div class="lang-switch">
    <button
      ref="btnRef"
      class="lang-btn"
      type="button"
      :aria-expanded="open"
      aria-haspopup="listbox"
      :aria-label="current.label"
      @click.stop="toggle"
    >
      <span>{{ current.code.toUpperCase() }}</span>
      <span class="caret" aria-hidden="true" />
    </button>

    <Teleport to="body">
      <ul
        v-if="open"
        id="h5-lang-menu"
        class="lang-menu"
        role="listbox"
        :style="menuStyle"
      >
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
    </Teleport>
  </div>
</template>

<style scoped>
.lang-switch {
  position: relative;
  z-index: 50;
  flex: 0 0 auto;
}

.lang-btn {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 6px;
  min-width: 52px;
  height: 32px;
  padding: 0 10px;
  border: 1px solid rgba(255, 255, 255, 0.18);
  border-radius: 999px;
  background: rgba(0, 0, 0, 0.55);
  color: #fff;
  font-size: 12px;
  font-weight: 800;
  letter-spacing: 0.04em;
  cursor: pointer;
  -webkit-appearance: none;
  appearance: none;
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
</style>

<style>
/* Teleported outside feed overflow — keep height = 5 locales only */
#h5-lang-menu.lang-menu {
  margin: 0;
  padding: 6px;
  list-style: none;
  width: max-content;
  min-width: 168px;
  max-width: min(240px, calc(100vw - 16px));
  height: auto;
  max-height: none;
  overflow: hidden;
  border-radius: 12px;
  background: #141418;
  border: 1px solid rgba(255, 255, 255, 0.14);
  box-shadow: 0 16px 40px rgba(0, 0, 0, 0.55);
  box-sizing: border-box;
}

#h5-lang-menu.lang-menu li {
  display: flex;
  align-items: center;
  gap: 10px;
  height: auto;
  padding: 10px 12px;
  border-radius: 8px;
  cursor: pointer;
  color: rgba(255, 255, 255, 0.88);
  font-size: 13px;
  line-height: 1.2;
  background: transparent;
}

#h5-lang-menu.lang-menu li:hover,
#h5-lang-menu.lang-menu li.active {
  background: rgba(238, 39, 55, 0.22);
  color: #fff;
}

#h5-lang-menu.lang-menu .code {
  width: 28px;
  flex: 0 0 28px;
  font-weight: 800;
  font-size: 11px;
  letter-spacing: 0.04em;
}

#h5-lang-menu.lang-menu .name {
  white-space: nowrap;
}
</style>
