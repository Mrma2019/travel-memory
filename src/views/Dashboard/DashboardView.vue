<script setup lang="ts">
import { onMounted, ref, computed } from 'vue'
import { useTravelStore } from '@/stores/useTravelStore'
import { useTravelStats } from '@/hooks/useTravelStats'
import { useThemeStore } from '@/stores/useThemeStore'
import StatCard from '@/components/cards/StatCard.vue'
import StickerBadge from '@/components/stickers/StickerBadge.vue'
import VChart from 'vue-echarts'
import { use } from 'echarts/core'
import { CanvasRenderer } from 'echarts/renderers'
import { BarChart, LineChart, HeatmapChart, PieChart } from 'echarts/charts'
import {
  TitleComponent,
  TooltipComponent,
  LegendComponent,
  GridComponent,
  VisualMapComponent,
} from 'echarts/components'

use([
  CanvasRenderer,
  BarChart,
  LineChart,
  HeatmapChart,
  PieChart,
  TitleComponent,
  TooltipComponent,
  LegendComponent,
  GridComponent,
  VisualMapComponent,
])

const travelStore = useTravelStore()
const { statCards, stats } = useTravelStats()
const themeStore = useThemeStore()
const loading = ref(true)

// 从 community 获取点赞评论数据
const communityData = ref<{ likes: number; comments: number }>({ likes: 0, comments: 0 })
// 照片总数 + 故事总数
const photoCount = ref(0)
const storyCount = ref(0)

onMounted(async () => {
  await travelStore.fetchTravels()
  // 加载统计数据
  try {
    const { usePhotoStore } = await import('@/stores/usePhotoStore')
    const photoStore = usePhotoStore()
    if (photoStore.photos.length === 0) await photoStore.fetchPhotos()
    photoCount.value = photoStore.photos.length
    storyCount.value = photoStore.photos.filter(p => p.story).length
  } catch { /* ignore */ }

  // 加载社区数据
  try {
    const saved = localStorage.getItem('travel-memory-community')
    if (saved) {
      const posts = JSON.parse(saved)
      communityData.value.likes = posts.reduce((sum: number, p: { likes: number }) => sum + p.likes, 0)
      communityData.value.comments = posts.reduce((sum: number, p: { comments: unknown[] }) => sum + p.comments.length, 0)
    }
  } catch { /* ignore */ }
  loading.value = false
})

// 年度趋势图
const yearlyOption = computed(() => ({
  tooltip: { trigger: 'axis' },
  grid: { left: 40, right: 20, top: 30, bottom: 30 },
  xAxis: {
    type: 'category',
    data: stats.value.yearlyTrend.map((y) => y.year + '年'),
    axisLabel: { fontSize: 11, color: '#999' },
  },
  yAxis: {
    type: 'value',
    axisLabel: { fontSize: 11, color: '#999' },
    splitLine: { lineStyle: { color: 'rgba(0,0,0,0.04)' } },
  },
  series: [{
    data: stats.value.yearlyTrend.map((y) => y.count),
    type: 'bar',
    itemStyle: {
      color: themeStore.currentThemeConfig.colors.primary,
      borderRadius: [8, 8, 0, 0],
    },
    barWidth: 24,
  }],
}))

// 国家分布饼图
const countryOption = computed(() => ({
  tooltip: { trigger: 'item' },
  series: [{
    type: 'pie',
    radius: ['45%', '75%'],
    center: ['50%', '55%'],
    data: stats.value.countryDistribution,
    label: { fontSize: 11, color: '#888' },
    itemStyle: { borderRadius: 6, borderColor: '#fff', borderWidth: 3 },
    emphasis: { label: { fontSize: 16, fontWeight: 'bold' } },
  }],
  color: ['#FF6B6B', '#4ECDC4', '#45B7D1', '#F7DC6F', '#BB8FCE', '#FF8A65'],
}))

// 月度热力图 - 修复：窄柱形 + visualMap右侧
const heatmapOption = computed(() => {
  const months = stats.value.monthlyHeatmap
  const maxVal = Math.max(...months.map((m) => m.count), 1)
  return {
    tooltip: { trigger: 'item' },
    grid: { left: 40, right: 80, top: 20, bottom: 20 },
    xAxis: {
      type: 'category',
      data: months.map((m) => m.month),
      axisLabel: { fontSize: 10, color: '#999' },
    },
    yAxis: {
      type: 'category',
      data: ['旅行次数'],
      axisLabel: { fontSize: 11 },
    },
    visualMap: {
      min: 0,
      max: maxVal,
      orient: 'vertical',
      right: 10,
      top: 'center',
      itemWidth: 14,
      itemHeight: 100,
      textStyle: { color: '#999', fontSize: 10 },
      inRange: {
        color: ['#e8f5e9', '#a5d6a7', '#66bb6a', '#43a047'],
      },
    },
    series: [{
      type: 'heatmap',
      data: months.map((m, i) => [i, 0, m.count]),
      label: { show: true, fontSize: 11 },
      itemStyle: { borderRadius: 4, borderWidth: 2, borderColor: '#fff' },
    }],
  }
})

// 照片趋势
const photoOption = computed(() => ({
  tooltip: { trigger: 'axis' },
  grid: { left: 40, right: 20, top: 30, bottom: 30 },
  xAxis: {
    type: 'category',
    data: stats.value.photoTrend.map((p) => p.month),
    axisLabel: { fontSize: 10, color: '#999' },
  },
  yAxis: {
    type: 'value',
    axisLabel: { fontSize: 11, color: '#999' },
    splitLine: { lineStyle: { color: 'rgba(0,0,0,0.04)' } },
  },
  series: [{
    data: stats.value.photoTrend.map((p) => p.count),
    type: 'line',
    smooth: true,
    lineStyle: { color: themeStore.currentThemeConfig.colors.accent, width: 3 },
    itemStyle: { color: themeStore.currentThemeConfig.colors.accent },
    areaStyle: {
      color: {
        type: 'linear', x: 0, y: 0, x2: 0, y2: 1,
        colorStops: [
          { offset: 0, color: (themeStore.currentThemeConfig.colors.accent || '#FFD93D') + '40' },
          { offset: 1, color: (themeStore.currentThemeConfig.colors.accent || '#FFD93D') + '05' },
        ],
      },
    },
    symbol: 'circle',
    symbolSize: 8,
  }],
}))

// 标签分类柱状图
const tagOption = computed(() => ({
  tooltip: { trigger: 'axis', axisPointer: { type: 'shadow' } },
  grid: { left: 60, right: 30, top: 20, bottom: 30 },
  xAxis: {
    type: 'value',
    axisLabel: { fontSize: 11, color: '#999' },
    splitLine: { lineStyle: { color: 'rgba(0,0,0,0.04)' } },
  },
  yAxis: {
    type: 'category',
    data: stats.value.tagDistribution.map((t) => t.name),
    axisLabel: { fontSize: 11, color: '#888' },
    inverse: true,
  },
  series: [{
    data: stats.value.tagDistribution.map((t) => t.value),
    type: 'bar',
    barWidth: 16,
    itemStyle: {
      color: themeStore.currentThemeConfig.colors.primary,
      borderRadius: [0, 8, 8, 0],
    },
    label: { show: true, position: 'right', fontSize: 11, color: '#999' },
  }],
  color: ['#FF6B6B', '#4ECDC4', '#45B7D1', '#F7DC6F', '#BB8FCE', '#FF8A65', '#FF9A76', '#A8E6CF', '#DDA0DD', '#FFD93D'],
}))

// 社区互动柱状图
const communityChartOption = computed(() => ({
  tooltip: { trigger: 'axis' },
  grid: { left: 60, right: 30, top: 20, bottom: 30 },
  xAxis: {
    type: 'category',
    data: ['❤️ 点赞', '💬 评论'],
    axisLabel: { fontSize: 13, color: '#888' },
  },
  yAxis: {
    type: 'value',
    axisLabel: { fontSize: 11, color: '#999' },
    splitLine: { lineStyle: { color: 'rgba(0,0,0,0.04)' } },
  },
  series: [{
    data: [
      { value: communityData.value.likes, itemStyle: { color: '#FF6B6B' } },
      { value: communityData.value.comments, itemStyle: { color: '#4ECDC4' } },
    ],
    type: 'bar',
    barWidth: 40,
    itemStyle: { borderRadius: [8, 8, 0, 0] },
    label: { show: true, position: 'top', fontSize: 14, fontWeight: 'bold', color: '#666' },
  }],
}))
</script>

<template>
  <div class="dashboard">
    <div class="page-header">
      <h1 class="page-title">
        <span class="title-emoji">✈️</span> Dashboard
      </h1>
      <div class="header-stickers">
        <span class="sticker">📮</span>
        <span class="sticker">🌟</span>
        <span class="sticker">🎨</span>
      </div>
    </div>

    <!-- 旅行成就（移到图表上方） -->
    <div class="section">
      <h2 class="section-title">🏆 旅行成就</h2>
      <div class="badges-row">
        <StickerBadge text="新手旅行者" :achieved="stats.totalTrips >= 1" />
        <StickerBadge text="五大洲探索者" :achieved="stats.totalCountries >= 5" />
        <StickerBadge text="摄影爱好者" :achieved="photoCount >= 10" />
        <StickerBadge text="环球达人" :achieved="stats.totalCountries >= 10" />
        <StickerBadge text="摄影师" :achieved="photoCount >= 100" />
        <StickerBadge text="收藏家" :achieved="photoCount >= 50" />
      </div>
    </div>

    <!-- 数据卡片 -->
    <div class="stats-grid">
      <StatCard v-for="card in statCards" :key="card.label" :label="card.label" :value="card.value" :icon="card.icon"
        :color="card.color" :unit="card.unit" />
    </div>

    <!-- 图表区域 -->
    <div class="charts-grid">
      <div class="chart-card cartoon-card">
        <div class="chart-header">
          <h3>📊 年度旅行趋势</h3>
        </div>
        <v-chart class="chart" :option="yearlyOption" autoresize />
      </div>

      <div class="chart-card cartoon-card">
        <div class="chart-header">
          <h3>🌍 国家访问统计</h3>
        </div>
        <v-chart class="chart" :option="countryOption" autoresize />
      </div>

      <div class="chart-card cartoon-card chart-card--wide">
        <div class="chart-header">
          <h3>📅 旅行月份热力图</h3>
        </div>
        <v-chart class="chart" :option="heatmapOption" autoresize />
      </div>

      <div class="chart-card cartoon-card">
        <div class="chart-header">
          <h3>📷 照片上传趋势</h3>
        </div>
        <v-chart class="chart" :option="photoOption" autoresize />
      </div>

      <!-- 标签分类柱状图 -->
      <div class="chart-card cartoon-card">
        <div class="chart-header">
          <h3>🏷️ 标签分类统计</h3>
        </div>
        <v-chart class="chart" :option="tagOption" autoresize />
      </div>

      <!-- 社区互动统计 -->
      <div class="chart-card cartoon-card">
        <div class="chart-header">
          <h3>🌐 社区互动</h3>
        </div>
        <v-chart class="chart" :option="communityChartOption" autoresize />
      </div>
    </div>

    <div v-if="loading" class="loading-overlay">
      <span>🌍 加载中...</span>
    </div>
  </div>
</template>

<style lang="scss" scoped>
.dashboard {
  padding: 24px;
  max-width: 1400px;
  margin: 0 auto;

  @include mobile {
    padding: 16px;
    padding-bottom: 80px;
  }
}

.page-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 24px;
}

.page-title {
  font-family: 'Fredoka One', 'ZCOOL KuaiLe', cursive;
  font-size: 28px;
  color: var(--text-primary, #2c3e50);

  .title-emoji {
    animation: heartbeat 2s ease-in-out infinite;
    display: inline-block;
  }
}

.header-stickers {
  display: flex;
  gap: 8px;

  .sticker {
    font-size: 24px;
    animation: wobble 3s ease-in-out infinite;

    &:nth-child(2) {
      animation-delay: 0.5s;
    }

    &:nth-child(3) {
      animation-delay: 1s;
    }
  }
}

@keyframes heartbeat {

  0%,
  100% {
    transform: scale(1);
  }

  25% {
    transform: scale(1.12);
  }

  50% {
    transform: scale(1);
  }

  75% {
    transform: scale(1.12);
  }
}

@keyframes wobble {

  0%,
  100% {
    transform: rotate(-3deg);
  }

  50% {
    transform: rotate(3deg);
  }
}

.stats-grid {
  display: grid;
  grid-template-columns: repeat(6, 1fr);
  gap: 16px;
  margin-bottom: 28px;

  @include tablet {
    grid-template-columns: repeat(3, 1fr);
  }

  @include mobile {
    grid-template-columns: repeat(2, 1fr);
    gap: 10px;
  }
}

.charts-grid {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 20px;
  margin-bottom: 28px;

  @include tablet-down {
    grid-template-columns: 1fr;
  }
}

.chart-card {
  padding: 20px;

  &--wide {
    grid-column: span 2;

    @include tablet-down {
      grid-column: span 1;
    }
  }
}

.chart-header {
  margin-bottom: 12px;

  h3 {
    font-family: 'Fredoka One', 'ZCOOL KuaiLe', cursive;
    font-size: 15px;
    color: var(--text-primary);
  }
}

.chart {
  height: 280px;
  width: 100%;
}

.section {
  margin-bottom: 28px;
}

.section-title {
  font-family: 'Fredoka One', 'ZCOOL KuaiLe', cursive;
  font-size: 20px;
  color: var(--text-primary);
  margin-bottom: 16px;
}

.badges-row {
  display: flex;
  gap: 12px;
  flex-wrap: wrap;
  justify-content: center;
}

.loading-overlay {
  position: absolute;
  inset: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  background: rgba(255, 255, 255, 0.5);
  font-size: 20px;
  color: #aaa;
}
</style>
