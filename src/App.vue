<script setup lang="ts">
import { computed } from 'vue'
import { useThemeStore } from './stores/useThemeStore'

const themeStore = useThemeStore()

const themeStyle = computed(() => {
  const cfg = themeStore.currentThemeConfig
  return {
    '--primary-color': cfg.colors.primary,
    '--accent-color': cfg.colors.accent,
    '--bg-start': cfg.colors.bgStart,
    '--bg-end': cfg.colors.bgEnd,
    '--card-bg': cfg.colors.cardBg,
  }
})
</script>

<template>
  <n-config-provider :theme-overrides="{
    common: {
      primaryColor: themeStore.currentThemeConfig.colors.primary,
      primaryColorHover: themeStore.currentThemeConfig.colors.primary,
    },
  }">
    <div class="app-root" :style="themeStyle">
      <router-view v-slot="{ Component, route }">
        <component :is="Component" :key="route.path" />
      </router-view>
    </div>
  </n-config-provider>
</template>

<style lang="scss">
.app-root {
  width: 100%;
  height: 100vh;
  overflow: hidden;
  background: linear-gradient(135deg, var(--bg-start), var(--bg-end));
  transition: background 0.5s ease;
}
</style>
