import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import type { ThemeType } from '@/types'

export interface ThemeStyle {
  cardRadius: string
  cardShadow: string
  buttonStyle: 'round' | 'square' | 'pill'
  decoration: 'cloud' | 'line' | 'stamp' | 'neon'
}

export interface ThemeConfig {
  name: string
  id: ThemeType
  emoji: string
  description: string
  colors: {
    primary: string
    accent: string
    bgStart: string
    bgEnd: string
    cardBg: string
    sidebarBg: string
    textPrimary: string
    textSecondary: string
    borderColor: string
    fontTitle: string
    fontBody: string
  }
  style: ThemeStyle
  stickers: string[]
}

export const themeConfigs: ThemeConfig[] = [
  // ---- 🎨 卡通主题 ----
  {
    name: '卡通',
    id: 'cartoon',
    emoji: '🎨',
    description: '可爱活泼，圆润多彩的旅行手账',
    colors: {
      primary: '#FF6B8A',
      accent: '#FFD93D',
      bgStart: '#FFF5F5',
      bgEnd: '#E8F4FD',
      cardBg: 'rgba(255,255,255,0.9)',
      sidebarBg: 'linear-gradient(180deg, #FF6B8A 0%, #FF8EAB 100%)',
      textPrimary: '#2C3E50',
      textSecondary: '#7F8C8D',
      borderColor: 'rgba(0,0,0,0.06)',
      fontTitle: "'Fredoka One', 'ZCOOL KuaiLe', cursive",
      fontBody: "'Nunito', 'Noto Sans SC', sans-serif",
    },
    style: {
      cardRadius: '20px',
      cardShadow: '0 4px 15px rgba(255,107,138,0.15)',
      buttonStyle: 'pill',
      decoration: 'cloud',
    },
    stickers: ['☁️', '✈️', '🌟', '📮', '🎀'],
  },
  // ---- ✨ 简约主题 ----
  {
    name: '简约',
    id: 'minimal',
    emoji: '✨',
    description: '极简优雅，留白之美',
    colors: {
      primary: '#333333',
      accent: '#888888',
      bgStart: '#FAFAFA',
      bgEnd: '#F0F0F0',
      cardBg: '#FFFFFF',
      sidebarBg: 'linear-gradient(180deg, #2C2C2C 0%, #1A1A1A 100%)',
      textPrimary: '#1A1A1A',
      textSecondary: '#999999',
      borderColor: 'rgba(0,0,0,0.04)',
      fontTitle: "'Inter', 'Noto Sans SC', sans-serif",
      fontBody: "'Inter', 'Noto Sans SC', sans-serif",
    },
    style: {
      cardRadius: '4px',
      cardShadow: '0 1px 3px rgba(0,0,0,0.04)',
      buttonStyle: 'square',
      decoration: 'line',
    },
    stickers: [],
  },
  // ---- 📮 复古主题 ----
  {
    name: '复古',
    id: 'retro',
    emoji: '📮',
    description: '牛皮纸上的旅行日记，温暖怀旧',
    colors: {
      primary: '#C4A882',
      accent: '#8B4513',
      bgStart: '#FDF5E6',
      bgEnd: '#F5DEB3',
      cardBg: 'rgba(255,251,240,0.95)',
      sidebarBg: 'linear-gradient(180deg, #C4A882 0%, #A0845C 100%)',
      textPrimary: '#3E2723',
      textSecondary: '#6D4C41',
      borderColor: 'rgba(139,69,19,0.15)',
      fontTitle: "'Caveat', 'Ma Shan Zheng', cursive",
      fontBody: "'Georgia', 'Noto Serif SC', serif",
    },
    style: {
      cardRadius: '6px 18px 6px 18px',
      cardShadow: '0 4px 12px rgba(139,69,19,0.1)',
      buttonStyle: 'square',
      decoration: 'stamp',
    },
    stickers: ['📮', '📜', '✒️', '🗺️', '🏷️'],
  },
  // ---- 🚀 科幻主题 ----
  {
    name: '科幻',
    id: 'scifi',
    emoji: '🚀',
    description: '赛博朋克，霓虹科技感',
    colors: {
      primary: '#00E5FF',
      accent: '#7C4DFF',
      bgStart: '#0A0E27',
      bgEnd: '#1A1F3A',
      cardBg: 'rgba(20,24,50,0.85)',
      sidebarBg: 'linear-gradient(180deg, #0A0E27 0%, #1A0033 100%)',
      textPrimary: '#E0E0E0',
      textSecondary: '#8892B0',
      borderColor: 'rgba(0,229,255,0.15)',
      fontTitle: "'Orbitron', 'ZCOOL KuaiLe', sans-serif",
      fontBody: "'Rajdhani', 'Noto Sans SC', sans-serif",
    },
    style: {
      cardRadius: '2px',
      cardShadow: '0 0 20px rgba(0,229,255,0.1)',
      buttonStyle: 'square',
      decoration: 'neon',
    },
    stickers: ['🚀', '🛸', '💠', '🔮', '⚡'],
  },
]

export const useThemeStore = defineStore('theme', () => {
  const currentTheme = ref<ThemeType>(
    (localStorage.getItem('travel-memory-theme') as ThemeType) || 'cartoon'
  )

  const currentThemeConfig = computed(() => {
    return themeConfigs.find((t) => t.id === currentTheme.value) || themeConfigs[0]
  })

  function applyTheme(theme: ThemeType) {
    currentTheme.value = theme
    const config = themeConfigs.find((t) => t.id === theme)!
    const root = document.documentElement

    root.style.setProperty('--primary-color', config.colors.primary)
    root.style.setProperty('--accent-color', config.colors.accent)
    root.style.setProperty('--bg-start', config.colors.bgStart)
    root.style.setProperty('--bg-end', config.colors.bgEnd)
    root.style.setProperty('--card-bg', config.colors.cardBg)
    root.style.setProperty('--sidebar-bg', config.colors.sidebarBg)
    root.style.setProperty('--text-primary', config.colors.textPrimary)
    root.style.setProperty('--text-secondary', config.colors.textSecondary)
    root.style.setProperty('--border-color', config.colors.borderColor)
    root.style.setProperty('--font-title', config.colors.fontTitle)
    root.style.setProperty('--font-body', config.colors.fontBody)
    root.style.setProperty('--card-radius', config.style.cardRadius)
    root.style.setProperty('--card-shadow', config.style.cardShadow)
    root.style.setProperty('--decoration-type', config.style.decoration)

    localStorage.setItem('travel-memory-theme', theme)
  }

  function init() {
    const saved = localStorage.getItem('travel-memory-theme') as ThemeType | null
    if (saved && themeConfigs.some((t) => t.id === saved)) {
      applyTheme(saved)
    } else {
      applyTheme('cartoon')
    }
  }

  return {
    currentTheme,
    currentThemeConfig,
    themeConfigs,
    applyTheme,
    init,
  }
})
