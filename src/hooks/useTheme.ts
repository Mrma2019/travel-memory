import { useThemeStore } from '@/stores/useThemeStore'

export function useTheme() {
  const themeStore = useThemeStore()

  return {
    currentTheme: themeStore.currentTheme,
    currentThemeConfig: themeStore.currentThemeConfig,
    themeConfigs: themeStore.themeConfigs,
    applyTheme: themeStore.applyTheme,
    init: themeStore.init,
  }
}
