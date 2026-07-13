<script setup lang="ts">
import { useThemeStore, themeConfigs } from '@/stores/useThemeStore'
import { useUserStore } from '@/stores/useUserStore'
import type { ThemeType } from '@/types'

const themeStore = useThemeStore()
const userStore = useUserStore()

function selectTheme(themeId: string) {
  themeStore.applyTheme(themeId as ThemeType)
  userStore.updateTheme(themeId as ThemeType)
}

const decorationIcons: Record<string, string[]> = {
  cartoon: ['☁️', '✈️', '🌟', '📮'],
  minimal: ['—', '○', '□', '△'],
  retro: ['📮', '📜', '✒️', '🗺️'],
  scifi: ['🚀', '💠', '🔮', '⚡'],
}
</script>

<template>
  <div class="theme-page">
    <div class="page-header">
      <h1 class="page-title">
        <span class="title-emoji">🎨</span> 主题中心
      </h1>
      <p class="page-subtitle">选择你喜欢的旅行风格吧~</p>
    </div>

    <div class="theme-grid">
      <div
        v-for="theme in themeConfigs"
        :key="theme.id"
        class="theme-card"
        :class="{ active: themeStore.currentTheme === theme.id }"
        :style="{
          '--t-primary': theme.colors.primary,
          '--t-accent': theme.colors.accent,
          '--t-bg-start': theme.colors.bgStart,
          '--t-bg-end': theme.colors.bgEnd,
          '--t-text': theme.colors.textPrimary,
        }"
        @click="selectTheme(theme.id)"
      >
        <!-- 预览 -->
        <div
          class="theme-preview"
          :style="{
            background: `linear-gradient(135deg, ${theme.colors.bgStart}, ${theme.colors.bgEnd})`,
            fontFamily: theme.colors.fontTitle,
          }"
        >
          <!-- 装饰元素 -->
          <div class="preview-decorations">
            <span
              v-for="(d, i) in decorationIcons[theme.id] || []"
              :key="i"
              class="preview-deco"
              :style="{ animationDelay: i * 0.3 + 's' }"
            >{{ d }}</span>
          </div>
          <!-- 迷你 UI 预览 -->
          <div class="preview-ui">
            <div
              class="preview-sidebar"
              :style="{
                background: theme.colors.primary,
                borderRadius: theme.style.cardRadius,
              }"
            ></div>
            <div class="preview-content">
              <div
                class="preview-card"
                :style="{
                  background: theme.colors.cardBg,
                  borderRadius: theme.style.cardRadius,
                  boxShadow: theme.style.cardShadow,
                  border: theme.style.decoration === 'neon'
                    ? `1px solid ${theme.colors.primary}33`
                    : '1px solid rgba(0,0,0,0.05)',
                }"
              ></div>
              <div
                class="preview-card preview-card--small"
                :style="{
                  background: theme.colors.cardBg,
                  borderRadius: theme.style.cardRadius,
                  boxShadow: theme.style.cardShadow,
                  border: theme.style.decoration === 'neon'
                    ? `1px solid ${theme.colors.primary}33`
                    : '1px solid rgba(0,0,0,0.05)',
                }"
              ></div>
            </div>
          </div>
        </div>

        <!-- 信息 -->
        <div class="theme-info">
          <div class="theme-name-row">
            <span class="theme-emoji">{{ theme.emoji }}</span>
            <h3>{{ theme.name }}</h3>
            <span v-if="themeStore.currentTheme === theme.id" class="active-dot"></span>
          </div>
          <p>{{ theme.description }}</p>
          <div class="theme-tags">
            <span class="color-dot" :style="{ background: theme.colors.primary }"></span>
            <span class="color-dot" :style="{ background: theme.colors.accent }"></span>
            <span class="style-badge">{{ {
              cartoon: '圆润', minimal: '极简', retro: '纹理', scifi: '霓虹'
            }[theme.id] }}</span>
          </div>
        </div>

        <div v-if="themeStore.currentTheme === theme.id" class="active-badge">
          ✅ 使用中
        </div>
      </div>
    </div>
  </div>
</template>

<style lang="scss" scoped>
.theme-page {
  padding: 24px;
  max-width: 1000px;
  margin: 0 auto;
  @include mobile {
    padding: 16px;
    padding-bottom: 80px;
  }
}

.page-header {
  margin-bottom: 28px;
  text-align: center;
}

.page-title {
  font-family: $font-title;
  font-size: 28px;
  color: var(--text-primary);

  .title-emoji {
    display: inline-block;
    animation: heartbeat 2s ease-in-out infinite;
  }
}

@keyframes heartbeat {
  0%, 100% { transform: scale(1); }
  25% { transform: scale(1.12); }
  50% { transform: scale(1); }
  75% { transform: scale(1.12); }
}

.page-subtitle {
  font-size: 14px;
  color: var(--text-secondary);
  margin-top: 4px;
}

.theme-grid {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 20px;
  @include mobile { grid-template-columns: 1fr; }
}

.theme-card {
  background: var(--card-bg);
  border-radius: var(--card-radius, 20px);
  overflow: hidden;
  cursor: pointer;
  border: 2px solid transparent;
  box-shadow: var(--card-shadow);
  transition: all $transition-smooth;
  position: relative;

  &:hover {
    transform: translateY(-4px);
    box-shadow: 0 12px 30px rgba(0,0,0,0.15);
  }

  &.active {
    border-color: var(--t-primary);
  }
}

.theme-preview {
  height: 150px;
  padding: 16px;
  position: relative;
  overflow: hidden;
}

.preview-decorations {
  display: flex;
  gap: 6px;
  margin-bottom: 10px;
  .preview-deco {
    font-size: 16px;
    animation: wobble 3s ease-in-out infinite;
  }
}

@keyframes wobble {
  0%, 100% { transform: rotate(-3deg); }
  50% { transform: rotate(3deg); }
}

.preview-ui {
  display: flex;
  gap: 8px;
  height: 70px;
}

.preview-sidebar {
  width: 32px;
  opacity: 0.6;
}

.preview-content {
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.preview-card {
  flex: 2;
  &--small { flex: 1; width: 60%; }
}

.theme-info {
  padding: 14px 18px;
}

.theme-name-row {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-bottom: 4px;
  .theme-emoji { font-size: 20px; }
  h3 {
    font-family: $font-title;
    font-size: 16px;
    color: var(--text-primary);
    margin: 0;
  }
  .active-dot {
    width: 8px; height: 8px;
    border-radius: 50%;
    background: #4caf50;
    margin-left: auto;
  }
}

.theme-info p {
  font-size: 13px;
  color: var(--text-secondary);
  margin-bottom: 8px;
}

.theme-tags {
  display: flex;
  align-items: center;
  gap: 8px;
}

.color-dot {
  width: 16px; height: 16px;
  border-radius: 50%;
  border: 2px solid var(--border-color);
}

.style-badge {
  font-size: 10px;
  padding: 2px 8px;
  background: var(--border-color);
  border-radius: 10px;
  color: var(--text-secondary);
  font-weight: 600;
}

.active-badge {
  position: absolute;
  top: 8px;
  right: 8px;
  padding: 4px 12px;
  background: var(--t-primary);
  color: white;
  font-size: 12px;
  font-weight: 700;
  border-radius: 20px;
  font-family: $font-title;
}
</style>
